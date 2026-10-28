#!/usr/bin/env python3
"""Reproduce two unchanged official huashu excerpts. Never overlays or edits upstream."""
from __future__ import annotations
import argparse
import hashlib
import importlib.metadata
import json
import os
from pathlib import Path
import re
import subprocess
import sys
import time

SHA = '8a0d7d72ca65fcce6f8ba82c4a6c8dfe35b8422c'
URL = 'https://github.com/alchaincyf/huashu-art-motion.git'
CAP = 14_000_000
EXAMPLES = {
    'gallery': {'film': 'gallery', 'start': 9, 'end': 21, 'stills': [9.8, 10.9, 12.2, 14.7, 18.1, 20.6]},
    'long-scroll': {'film': 'demos/long_scroll', 'start': 3, 'end': 15, 'stills': [3.3, 5.9, 6.6, 7.8, 10.9, 12.6]},
}


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for b in iter(lambda: f.read(1024 * 1024), b''):
            h.update(b)
    return h.hexdigest()


def text_command(argv):
    return subprocess.check_output([str(x) for x in argv], text=True).strip()


def run(argv, log=None):
    print('+', ' '.join(map(str, argv)), flush=True)
    if log:
        with Path(log).open('w') as f:
            proc = subprocess.Popen([str(x) for x in argv], stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True)
            for line in proc.stdout:
                f.write(line); f.flush(); print(line, end='', flush=True)
            code = proc.wait()
            if code:
                raise subprocess.CalledProcessError(code, argv)
    else:
        subprocess.run([str(x) for x in argv], check=True)


def write_json(path, value):
    Path(path).write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')


def verify_upstream(root):
    actual = text_command(['git', '-C', root, 'rev-parse', 'HEAD'])
    status = text_command(['git', '-C', root, 'status', '--porcelain', '--untracked-files=no'])
    if actual != SHA or status:
        raise RuntimeError(f'Refusing non-pinned or modified upstream: SHA={actual}, dirty={bool(status)}')
    return {'commit': actual, 'trackedChanges': status}


def asset_preflight(root):
    from PIL import Image
    engine = root / 'scripts/engine'
    fonts = re.findall(r"url:'([^']+)'", (engine / 'lib/fonts.js').read_text())
    scripts = re.findall(r'<script src="([^"$]+)"', (engine / 'index.html').read_text())
    gallery = (engine / 'eras_gallery.js').read_text()
    scenes = re.findall(r"\{ id: '([^']+)'", gallery)
    files = [engine / p for p in fonts + scripts] + [engine / 'scenes' / (p + '.js') for p in scenes]
    counts = {}
    for meta in sorted((engine / 'demos/long_scroll/frames').glob('*/meta.json')):
        data = json.loads(meta.read_text()); frames = [meta.parent / f['file'] for f in data['frames']]
        counts[meta.parent.name] = len(frames)
        files += [meta] + frames
        for p in frames:
            with Image.open(p) as im:
                im.verify()
    if len(counts) != 6 or sum(counts.values()) != 48:
        raise RuntimeError('Expected the six official long-scroll frame sets, 48 PNG frames')
    missing = [str(p.relative_to(root)) for p in files if not p.is_file()]
    if missing:
        raise RuntimeError('Missing declared official dependency: ' + ', '.join(missing))
    needed = set(re.findall(r"transition: \{ type: '([^']+)'", gallery))
    base = (engine / 'transitions.js').read_text()
    registered = set(re.findall(r'^\s{2}([A-Za-z0-9_]+)\(c,\s*A,\s*B,\s*p', base, re.M)) | set(re.findall(r'\bT\.([A-Za-z0-9_]+)\s*=', base))
    if needed - registered:
        raise RuntimeError('Missing declared gallery transition')
    return {'fonts': len(fonts), 'indexScripts': len(scripts), 'galleryScenes': len(scenes),
            'galleryTransitions': len(needed), 'longScrollFrameSets': counts, 'pngVerification': 'Pillow verify; read-only'}


def source_manifest(root):
    paths = sorted((root / 'scripts/engine').rglob('*'))
    return {str(p.relative_to(root)): {'sha256': digest(p), 'bytes': p.stat().st_size}
            for p in paths if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc'}


def verify_video(path, width, height, frames=720):
    probe = json.loads(text_command(['ffprobe', '-v', 'error', '-count_frames', '-show_format', '-show_streams', '-of', 'json', path]))
    streams = probe['streams']; video = [s for s in streams if s['codec_type'] == 'video']
    if len(video) != 1 or any(s['codec_type'] == 'audio' for s in streams):
        raise RuntimeError('Expected one silent video stream (official source contains no audio)')
    v = video[0]
    if (v['width'], v['height'], v['codec_name'], v['pix_fmt']) != (width, height, 'h264', 'yuv420p'):
        raise RuntimeError('Unexpected dimensions/codec/pixel format')
    n, d = map(int, v['avg_frame_rate'].split('/'))
    if n / d != 60 or int(v['nb_read_frames']) != frames or abs(float(v['duration']) - frames / 60) > 1 / 60:
        raise RuntimeError('Expected exact 60fps, 720 frames, 12 seconds')
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'])
    return probe


def check_size(out):
    files = [p for p in out.rglob('*') if p.is_file()]
    size = sum(p.stat().st_size for p in files)
    if not files or size >= CAP:
        raise RuntimeError(f'Refusing upload: {len(files)} files, {size} bytes, limit<{CAP}')
    print(f'Upload size checked: {len(files)} files, {size} bytes < {CAP}')
    return size


def render(root, out, work, example):
    from PIL import Image
    ex = EXAMPLES[example]
    out.mkdir(parents=True, exist_ok=False); work.mkdir(parents=True, exist_ok=False)
    evidence = {'schema': 1, 'example': example, 'purpose': 'Unchanged official skill demonstration; not an original new film',
                'source': {'url': URL, **verify_upstream(root)}, 'excerpt': ex,
                'repository': os.getenv('GITHUB_REPOSITORY'), 'commit': os.getenv('GITHUB_SHA'),
                'runId': os.getenv('GITHUB_RUN_ID'), 'runAttempt': os.getenv('GITHUB_RUN_ATTEMPT'),
                'workflowRef': os.getenv('GITHUB_WORKFLOW_REF'), 'sourceEdits': 'none', 'audio': 'none: official bundled examples contain no audio',
                'tools': {'python': sys.version, 'playwright': importlib.metadata.version('playwright'),
                          'Pillow': importlib.metadata.version('Pillow'), 'ffmpeg': text_command(['ffmpeg', '-version']).splitlines()[0]},
                'preflight': asset_preflight(root)}
    write_json(out / 'evidence.json', evidence)
    manifest = source_manifest(root); write_json(out / 'upstream-engine-sha256.json', manifest)
    renderer = root / 'scripts/engine/render.py'
    base = [sys.executable, renderer, '--film', ex['film'], '--width', 1920, '--height', 1080, '--fps', 60, '--crf', 14]
    first = work / 'first-stills'
    run(base + ['--stills', ','.join(map(str, ex['stills'])), '--out', first], out / 'stills-native.log')
    master = work / 'official-native-1080p60.mp4'
    start = time.monotonic()
    run(base + ['--from', ex['start'], '--to', ex['end'], '--out', master], out / 'render-native.log')
    elapsed = time.monotonic() - start
    master_probe = verify_video(master, 1920, 1080)
    # Run a fresh native browser again, comparing source PNGs at two original times.
    samples = [ex['stills'][2], ex['stills'][-1]]
    second = work / 'repeat-stills'
    run(base + ['--stills', ','.join(map(str, samples)), '--out', second], out / 'repeat-native.log')
    deterministic = []
    for t in samples:
        name = f't{t:06.2f}.png'; a = digest(first / name); b = digest(second / name)
        deterministic.append({'globalTime': t, 'firstSha256': a, 'repeatSha256': b, 'equal': a == b})
    if not all(v['equal'] for v in deterministic):
        write_json(out / 'sample-determinism.json', deterministic)
        raise RuntimeError('Two sampled source PNGs changed across fresh native browser launches')
    for p in sorted(first.glob('*.png')):
        with Image.open(p) as src:
            im = src.convert('RGB'); im.thumbnail((1280, 720)); im.save(out / (p.stem + '.jpg'), quality=90)
    # Artifact is explicitly a review derivative, not mislabelled as the native master.
    review = out / f'official-{example}-720p60-review.mp4'
    passlog = work / 'review-pass'
    encoding = ['-vf', 'scale=1280:720,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '5000k',
                '-pix_fmt', 'yuv420p', '-an', '-passlogfile', passlog]
    cmd = ['ffmpeg', '-y', '-v', 'error', '-i', master]
    run(cmd + encoding + ['-pass', 1, '-f', 'null', os.devnull], out / 'encode-pass1.log')
    run(cmd + encoding + ['-pass', 2, '-movflags', '+faststart', review], out / 'encode-pass2.log')
    review_probe = verify_video(review, 1280, 720)
    if review.stat().st_size >= 12_500_000:
        raise RuntimeError('Review movie exceeds reserved movie budget; refusing upload')
    if source_manifest(root) != manifest:
        raise RuntimeError('Upstream engine content changed during reproduction')
    evidence.update({'upstreamAfterRender': verify_upstream(root), 'renderWallSeconds': round(elapsed, 3),
                     'nativeMaster': {'size': [1920, 1080], 'fps': 60, 'crf': 14, 'sha256': digest(master),
                                      'bytes': master.stat().st_size, 'probe': master_probe, 'uploaded': False},
                     'reviewDerivative': {'size': [1280, 720], 'fps': 60, 'twoPassBitsPerSecond': 5_000_000,
                                          'sha256': digest(review), 'bytes': review.stat().st_size, 'probe': review_probe},
                     'sampledDeterminism': deterministic,
                     'qualityScope': 'Native browser runtime + two sampled cold-launch PNG comparisons + complete decode/frame validation; no claim of exhaustive QA or artistic approval'})
    write_json(out / 'evidence.json', evidence)
    (out / 'UPSTREAM-LICENSE.txt').write_text((root / 'LICENSE').read_text())
    (out / 'READ-ME.txt').write_text(
        'Official huashu skill demonstration, reproduced without changing example source.\n'
        f'Source {URL} commit {SHA}\n'
        f'Original global interval: {ex["start"]}–{ex["end"]} seconds; no retiming, loop, new dialogue or music.\n'
        'Native render: 1920x1080, 60fps, H.264 CRF14. Uploaded derivative: 1280x720, 60fps, 2-pass 5Mbps, silent.\n'
        'The native master hash/probe and complete engine file hashes are in evidence.json/upstream-engine-sha256.json.\n'
        'Author character frames are bundled for this skill demonstration only, not licensed by MIT for unrelated use.\n'
        'Fonts retain their own OFL licenses. This is not our original artwork or a reproduced complete showcase movie.\n'
        'No blue/purple colors or other original aesthetic choices were altered to satisfy a heuristic quality gate.\n')
    (out / 'SHA256SUMS').write_text(''.join(f'{digest(p)}  {p.name}\n' for p in sorted(out.iterdir()) if p.is_file() and p.name != 'SHA256SUMS'))
    check_size(out)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command', choices=['render', 'check-size'])
    parser.add_argument('--upstream', type=Path, default=Path('.native-official/upstream'))
    parser.add_argument('--example', choices=EXAMPLES, default='gallery')
    parser.add_argument('--out', type=Path, default=Path('official-output'))
    parser.add_argument('--work', type=Path, default=Path('.native-official/work'))
    args = parser.parse_args()
    if args.command == 'check-size': check_size(args.out)
    else: render(args.upstream.resolve(), args.out, args.work, args.example)


if __name__ == '__main__': main()
