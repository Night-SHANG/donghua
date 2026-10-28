#!/usr/bin/env python3
"""Transparent, local-content-only SwiftShader launch adapter; no native source edits.

Native rendering/QA still execute the pinned upstream script via runpy. The only
adaptation is BrowserType.launch(args=...) to opt in to CPU WebGL on GPU-less CI.
"""
from __future__ import annotations
import base64
import functools
import hashlib
import http.server
import io
import json
from pathlib import Path
import runpy
import socketserver
import sys
import threading
import time

FLAGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader']
BASE_ARGS = ['--disable-web-security', '--enable-gpu-rasterization', '--ignore-gpu-blocklist']


def merge_launch_args(args=None):
    return [a for a in (args or []) if not a.startswith(('--use-gl=', '--use-angle=')) and a != '--enable-unsafe-swiftshader'] + FLAGS


def run_native(script, arguments):
    from playwright.sync_api import BrowserType
    original = BrowserType.launch
    def adapted(self, *args, **kwargs):
        if self.name != 'chromium': raise RuntimeError('This adapter only supports Chromium')
        kwargs['args'] = merge_launch_args(kwargs.get('args'))
        print('WEBGL launch adapter:', json.dumps({'script': str(script), 'args': kwargs['args']}), flush=True)
        return original(self, *args, **kwargs)
    BrowserType.launch = adapted
    old = sys.argv
    try:
        sys.argv = [str(script), *arguments]
        runpy.run_path(str(script), run_name='__main__')
    finally:
        sys.argv = old
        BrowserType.launch = original


# Independent measurement rather than trusting a scene's self-reported backend.
INSTRUMENT = r"""
(() => {
  const contexts=[], byContext=new WeakMap();
  window.__CI_WEBGL={contexts,compositeCalls:0};
  const get=HTMLCanvasElement.prototype.getContext;
  HTMLCanvasElement.prototype.getContext=function(kind,...args){
    const gl=get.call(this,kind,...args);
    if(gl && ['webgl','webgl2','experimental-webgl'].includes(kind) && !byContext.has(gl)){
      const rec={gl,canvas:this,type:kind,drawCalls:0}; contexts.push(rec);byContext.set(gl,rec);
    }
    return gl;
  };
  for(const P of [window.WebGLRenderingContext?.prototype,window.WebGL2RenderingContext?.prototype].filter(Boolean)){
    for(const fn of ['drawArrays','drawElements','drawArraysInstanced','drawElementsInstanced']){
      if(typeof P[fn] !== 'function')continue;
      const orig=P[fn];P[fn]=function(...args){const r=byContext.get(this);if(r)r.drawCalls++;return orig.apply(this,args)};
    }
  }
  const draw=CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage=function(source,...args){
    if(contexts.some(r=>r.canvas===source))window.__CI_WEBGL.compositeCalls++;
    return draw.call(this,source,...args);
  };
})();
"""
CAPTURE = r"""async t => {
  const c=window.__CI_WEBGL;c.compositeCalls=0;c.contexts.forEach(r=>r.drawCalls=0);
  await window.prepare(t);window.renderFrame(t);
  return {threeRevision:window.THREE?.REVISION,canvasSize:[window.__canvas.width,window.__canvas.height],
    webgl:c.contexts.map(r=>{const gl=r.gl,e=gl.getExtension('WEBGL_debug_renderer_info');return {
      type:r.type,version:gl.getParameter(gl.VERSION),renderer:e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),
      contextLost:gl.isContextLost(),width:r.canvas.width,height:r.canvas.height,
      preserveDrawingBuffer:gl.getContextAttributes()?.preserveDrawingBuffer,drawCalls:r.drawCalls};}),
    compositeCalls:c.compositeCalls,diagnostics:window.WIND_MONTAGE?.diagnostics(),
    png:window.__canvas.toDataURL('image/png').split(',')[1]};
}"""


def validate_webgl_capture(data):
    if data.get('threeRevision') != '160' or data.get('canvasSize') != [1920, 1080]:
        raise RuntimeError('Expected pinned native Three r160 and 1080p composite')
    if data.get('diagnostics', {}).get('cameraType') != 'PerspectiveCamera' or data.get('diagnostics', {}).get('triangles', 0) <= 0:
        raise RuntimeError('Expected actual perspective camera and rendered triangle geometry')
    active = [g for g in data.get('webgl', []) if g.get('drawCalls', 0) > 0]
    if not active or not any(g.get('width') == 1280 and g.get('height') == 720 for g in active):
        raise RuntimeError('No active 1280x720 WebGL draw calls; refusing 2D fallback')
    if any(g.get('contextLost') is not False or g.get('preserveDrawingBuffer') is not True or not g.get('renderer') or 'WebGL' not in g.get('version', '') for g in active):
        raise RuntimeError('WebGL context lost/invalid or capture buffer not preserved')
    stddev = data.get('pixelStddev', [])
    if data.get('compositeCalls', 0) <= 0 or len(stddev) != 3 or max(stddev) < 5:
        raise RuntimeError('WebGL was not composited, or captured pixels are effectively blank')


def validate_scene_sequence(captures, expected):
    diagnostics = [s.get('diagnostics', {}) for s in captures]
    if [d.get('sceneId') for d in diagnostics] != expected:
        raise RuntimeError('Actual rendered scenes do not match the four-shot edit')
    for field in ['sceneUUID', 'cameraUUID']:
        values = [d.get(field) for d in diagnostics]
        if any(not isinstance(v, str) or not v for v in values) or len(set(values)) != len(expected):
            raise RuntimeError('Four genuinely distinct scenes and cameras required: ' + field)


def preflight(engine, film, scenes, out):
    """Actual four-season GPU-API readback before starting the 900-frame movie."""
    from playwright.sync_api import sync_playwright
    from PIL import Image, ImageStat
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args): pass
    class Server(socketserver.ThreadingTCPServer):
        allow_reuse_address = True
        daemon_threads = True
        request_queue_size = 128
    server = Server(('127.0.0.1', 0), functools.partial(Quiet, directory=str(engine)))
    thread = threading.Thread(target=server.serve_forever, daemon=True);thread.start()
    result = {'schema': 1, 'launchFlags': merge_launch_args(BASE_ARGS), 'samples': [], 'errors': [],
              'scope': 'Actual WebGL API calls/context, perspective/triangles, Canvas composition and nonblank pixels; not aesthetic approval',
              'securityScope': 'Explicit SwiftShader for reviewed local repository content only; no credentials or external pages'}
    try:
        with sync_playwright() as p:
            b = p.chromium.launch(args=merge_launch_args(BASE_ARGS))
            result['browserVersion'] = b.version
            pg = b.new_page(viewport={'width': 1920, 'height': 1080}, device_scale_factor=1)
            # This opt-in must never be used as a general browser for untrusted content.
            pg.route('**/*', lambda route: route.continue_() if route.request.url.startswith(f'http://127.0.0.1:{server.server_address[1]}/') else route.abort())
            pg.on('pageerror', lambda err: result['errors'].append(str(err)))
            pg.on('console', lambda msg: result['errors'].append(msg.text) if msg.type == 'error' else None)
            pg.add_init_script(INSTRUMENT)
            pg.goto(f'http://127.0.0.1:{server.server_address[1]}/index.html?render=1&film={film}&w=1920&h=1080')
            pg.wait_for_function('window.__ready === true || !!window.__bootFailed', timeout=120000)
            if pg.evaluate('window.__bootFailed || null'): raise RuntimeError('Native scene boot failed')
            for scene in scenes:
                begin = time.monotonic()
                capture = pg.evaluate(CAPTURE, scene['still'])
                capture['captureSeconds'] = round(time.monotonic() - begin, 4)
                raw = base64.b64decode(capture.pop('png'))
                with Image.open(io.BytesIO(raw)) as im:
                    rgb = im.convert('RGB');capture['pixelStddev'] = ImageStat.Stat(rgb.resize((160, 90))).stddev
                    dst = out / f"webgl-{scene['id']}.jpg";rgb.resize((640, 360)).save(dst, quality=82)
                capture.update({'scene': scene['id'], 't': scene['still'], 'rawCanvasPngSha256': hashlib.sha256(raw).hexdigest(), 'reviewImage': dst.name, 'reviewImageSize': [640, 360]})
                result['samples'].append(capture)
                validate_webgl_capture(capture)
            validate_scene_sequence(result['samples'], [s['id'] for s in scenes])
            # Same source frame after visiting the other seasons must be exactly reproducible.
            repeated = pg.evaluate(CAPTURE, scenes[0]['still'])
            result['repeatedFrameMatches'] = hashlib.sha256(base64.b64decode(repeated.pop('png'))).hexdigest() == result['samples'][0]['rawCanvasPngSha256']
            b.close()
        if result['errors'] or not result['repeatedFrameMatches']: raise RuntimeError('WebGL boot/render errors or history-dependent frame')
        result['passed'] = True
        return result
    finally:
        server.shutdown();server.server_close()
        (out / 'webgl-preflight.json').write_text(json.dumps(result, indent=2) + '\n')


if __name__ == '__main__':
    if len(sys.argv) < 2: raise SystemExit('Usage: webgl_runtime.py PINNED_NATIVE_SCRIPT [native args...]')
    run_native(Path(sys.argv[1]).resolve(), sys.argv[2:])
