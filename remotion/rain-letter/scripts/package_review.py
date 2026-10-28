#!/usr/bin/env python3
"""Remotion review derivatives and dense frame evidence; no animation logic."""
import argparse, hashlib, json, math, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageStat
FPS,DURATION,FRAME_COUNT,CAP=60,30,1800,14_000_000
SCENES=[]
WINDOWS=[]
TRAJECTORY_FRAMES=list(range(0,1800,30))+[1799]
def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''): h.update(block)
    return h.hexdigest()

def write_json(path, data):
    Path(path).write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')

def output(argv):
    return subprocess.check_output(list(map(str, argv)), text=True).strip()

def run(argv, log=None, check=True, cwd=None, env=None):
    print('+', ' '.join(map(str, argv)), flush=True)
    if log:
        with Path(log).open('w') as f:
            proc = subprocess.Popen(list(map(str, argv)), stdout=subprocess.PIPE, stderr=subprocess.STDOUT, text=True, cwd=cwd, env=env)
            for line in proc.stdout:
                print(line, end='', flush=True); f.write(line); f.flush()
            proc.stdout.close()
            code = proc.wait()
        if check and code: raise subprocess.CalledProcessError(code, argv)
        return code
    return subprocess.run(list(map(str, argv)), check=check, cwd=cwd, env=env).returncode

def probe(path):
    return json.loads(output(['ffprobe', '-v', 'error', '-count_frames', '-show_format', '-show_streams', '-of', 'json', path]))

def verify_video(path, width, height, frames=FRAME_COUNT, audio=False):
    data = probe(path); vs = [x for x in data['streams'] if x['codec_type'] == 'video']
    au = [x for x in data['streams'] if x['codec_type'] == 'audio']
    if len(vs) != 1: raise RuntimeError('Exactly one video stream required')
    v = vs[0]; n, d = map(int, v['avg_frame_rate'].split('/'))
    if (v['width'], v['height'], v['codec_name'], v['pix_fmt']) != (width, height, 'h264', 'yuv420p'):
        raise RuntimeError('Wrong dimensions/codec/pixel format')
    if n / d != FPS or int(v['nb_read_frames']) != frames or abs(float(v['duration']) - frames / FPS) > 1 / FPS:
        raise RuntimeError('Wrong frame count, fps or video duration')
    if audio:
        if len(au) != 1 or int(au[0]['sample_rate']) != 48000 or au[0]['channels'] != 2:
            raise RuntimeError('Expected one stereo 48kHz soundtrack')
        if float(au[0].get('duration', 0)) < frames / FPS - .05:
            raise RuntimeError('Audio does not cover the complete video')
    elif au: raise RuntimeError('Expected silent native picture')
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'])
    return data

def frame_range(window):
    start, end = round(window['start'] * FPS), round(window['end'] * FPS)
    if start < 0 or end >= FRAME_COUNT or end < start: raise ValueError('Evidence window outside film')
    return list(range(start, end + 1))

def contact_sheets(paths, indices, prefix, title, out):
    from PIL import Image, ImageDraw
    if len(paths) != len(indices):
        raise RuntimeError('Frame image count does not match time index')
    sheets = []
    for offset in range(0, len(paths), 32):
        group = paths[offset:offset + 32]
        sheet = Image.new('RGB', (2048, 32 + math.ceil(len(group) / 8) * 164), '#f1ece4')
        draw = ImageDraw.Draw(sheet); draw.text((10, 10), title, fill='#182422')
        for j, path in enumerate(group):
            frame = indices[offset + j]; x, y = (j % 8) * 256, 32 + (j // 8) * 164
            with Image.open(path) as im: sheet.paste(im.convert('RGB'), (x, y))
            draw.text((x + 6, y + 146), f'{frame:04d}  {frame / FPS:07.4f}s', fill='#182422')
        dst = out / f'{prefix}-{offset // 32 + 1:02d}.jpg'; sheet.save(dst, quality=88); sheets.append(dst.name)
    return sheets

def check_size(out):
    files = [p for p in out.rglob('*') if p.is_file()]
    total = sum(p.stat().st_size for p in files)
    if not files or total >= CAP: raise RuntimeError(f'Refusing upload: {total} bytes across {len(files)} files')
    print(f'Artifact size verified: {total} bytes < {CAP}')
    return total

def encode_review(master, target, work, frames):
    enc=['-vf','scale=1280:720,format=yuv420p','-c:v','libx264','-preset','slow','-b:v','2000k','-pix_fmt','yuv420p','-r',FPS,'-passlogfile',work/'review-pass']
    run(['ffmpeg','-y','-v','error','-i',master]+enc+['-pass',1,'-an','-f','null',os.devnull])
    run(['ffmpeg','-y','-v','error','-i',master,'-map','0:v:0','-map','0:a:0']+enc+['-pass',2,'-c:a','aac','-b:a','160k','-t',frames/FPS,'-movflags','+faststart',target])
    if target.stat().st_size>9_500_000: raise RuntimeError('Movie exceeded reserved budget')

def preflight(plan,work,out):
    records=[]
    for frame in plan['keyframes']:
        raw=work/'stills'/f'frame-{frame}.png'
        with Image.open(raw) as image:
            if image.size!=(1920,1080): raise RuntimeError('Wrong raw still dimensions')
            rgb=image.convert('RGB');std=ImageStat.Stat(rgb.resize((160,90))).stddev
            if max(std)<4: raise RuntimeError('Blank rendered still')
            dst=out/f'keyframe-{frame:04d}.jpg';rgb.resize((1280,720)).save(dst,quality=86)
        records.append({'frame':frame,'seconds':frame/FPS,'rawPngSha256':sha(raw),'pixelStddev':std,'reviewImage':dst.name})
    write_json(out/'keyframes.json',records)

def dense(master,window,offset,out,work):
    start,end=window['start'],window['endExclusive'];indices=list(range(start,end))
    folder=work/('dense-'+window['id']);folder.mkdir(exist_ok=True)
    filt=f"select=between(n\\,{start-offset}\\,{end-offset-1}),scale=256:144"
    run(['ffmpeg','-y','-v','error','-i',master,'-vf',filt,'-vsync',0,'-q:v',3,'-start_number',start,folder/'frame-%04d.jpg'])
    paths=sorted(folder.glob('frame-*.jpg'))
    sheets=contact_sheets(paths,indices,'dense-'+window['id'],window['id']+' | every frame, global timeline @60fps',out)
    return {**window,'frames':indices,'sheets':sheets}

def package(plan,work,out):
    renders=plan['clips'] if plan['phase']=='preview' else [{'id':'full-film','start':0,'endExclusive':1800}]
    records=[]
    for clip in renders:
        frames=clip['endExclusive']-clip['start'];master=work/(clip['id']+'-1080p60.mp4');target=out/(clip['id']+'-720p60.mp4')
        mp=verify_video(master,1920,1080,frames,True);encode_review(master,target,work,frames);rp=verify_video(target,1280,720,frames,True)
        windows=[clip] if plan['phase']=='preview' else plan['clips']+plan['finalDenseWindows']
        sheets=[dense(master,w,clip['start'],out,work) for w in windows]
        records.append({**clip,'masterSha256':sha(master),'masterProbe':mp,'reviewSha256':sha(target),'reviewProbe':rp,'denseEvidence':sheets})
        run(['ffmpeg','-v','info','-i',target,'-vn','-af','ebur128=peak=true','-f','null','-'],out/(clip['id']+'-loudness.txt'))
    write_json(out/'media-evidence.json',records)
    (out/'package-lock.json').write_bytes(Path('package-lock.json').read_bytes())
    (out/'README.txt').write_text('Rain Letter: original Remotion 30s / 1800 frames / 60fps / native1080p. Preview phase renders ONLY two transformation windows with timeline-aligned sound, not the full film. Final requires an approved preview commit. JPEG keyframes are actual renders; dense sheets retain every frame in the registered windows. Audio/visual/aesthetic approval requires independent viewing. No paid render service.\n')

def finalize(out):
    if not any(p.is_file() and p.name!='SHA256SUMS' for p in out.rglob('*')): raise RuntimeError('No render evidence exists')
    (out/'SHA256SUMS').write_text(''.join(f'{sha(p)}  {p.relative_to(out)}\n' for p in sorted(out.rglob('*')) if p.is_file() and p.name!='SHA256SUMS'))
    return check_size(out)

if __name__=='__main__':
    command=sys.argv[1];plan=json.loads(Path('render-plan.json').read_text());work=Path('.tmp/rain-letter');out=Path('artifacts/rain-letter');out.mkdir(parents=True,exist_ok=True)
    if command=='preflight': preflight(plan,work,out)
    elif command=='package': package(plan,work,out)
    elif command=='check-size': finalize(out)
    else: raise SystemExit('Unknown command')
