#!/usr/bin/env python3
"""Remotion review derivatives and dense frame evidence; no animation logic."""
import argparse, hashlib, json, math, os, subprocess, sys
from pathlib import Path
from PIL import Image, ImageStat
FPS,DURATION,FRAME_COUNT,CAP=60,15,900,14_000_000
SCENES=[]
WINDOWS=[]
TRAJECTORY_FRAMES=list(range(0,900,30))+[899]
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

def encode_review(master, audio, target, work, logdir):
    enc = ['-vf', 'scale=1280:720,format=yuv420p', '-c:v', 'libx264', '-preset', 'slow', '-b:v', '4000k',
           '-pix_fmt', 'yuv420p', '-r', FPS, '-passlogfile', work / 'review-pass']
    run(['ffmpeg', '-y', '-v', 'error', '-i', master] + enc + ['-pass', 1, '-an', '-f', 'null', os.devnull], logdir / 'encode-pass1.log')
    run(['ffmpeg', '-y', '-v', 'error', '-i', master, '-i', audio, '-map', '0:v:0', '-map', '1:a:0'] + enc +
        ['-pass', 2, '-c:a', 'aac', '-b:a', '192k', '-t', DURATION, '-movflags', '+faststart', target], logdir / 'encode-pass2.log')
    if target.stat().st_size > 9_000_000: raise RuntimeError('Review movie exceeded its reserved 9MB budget')

def extract_evidence(master, review, out, work):
    records = {'sceneStills': [], 'denseWindows': [], 'source': 'decoded native 1080p60 encoded master; JPEG thumbnails are review evidence'}
    for scene in SCENES:
        frame = round(scene['still'] * FPS); dst = out / f"scene-{scene['id']}-f{frame:04d}.jpg"
        run(['ffmpeg', '-y', '-v', 'error', '-i', master, '-vf', f'select=eq(n\\,{frame}),scale=1280:720', '-frames:v', 1, '-q:v', 3, dst])
        records['sceneStills'].append({**scene, 'frame': frame, 'actualTime': frame / FPS, 'file': dst.name})
    trajectory = work / 'trajectory'; trajectory.mkdir()
    # Preserve every requested source-frame index; this is a trace sheet, not retimed animation.
    selection = '+'.join(f'eq(n\\,{n})' for n in TRAJECTORY_FRAMES)
    run(['ffmpeg', '-y', '-v', 'error', '-i', master, '-vf', f'select={selection},scale=256:144',
         '-vsync', 0, '-q:v', 3, trajectory / 'frame-%04d.jpg'])
    trace_paths = sorted(trajectory.glob('frame-*.jpg'))
    trace_sheets = contact_sheets(trace_paths, TRAJECTORY_FRAMES, 'trajectory', 'Full-film leaf trajectory | every 0.25s + last frame', out)
    records['trajectory'] = {'frames': TRAJECTORY_FRAMES, 'times': [n / FPS for n in TRAJECTORY_FRAMES], 'sheets': trace_sheets}
    for window in WINDOWS:
        indices = frame_range(window); folder = work / ('dense-' + window['id']); folder.mkdir()
        pattern = folder / 'frame-%04d.jpg'
        run(['ffmpeg', '-y', '-v', 'error', '-i', master, '-vf', f"select=between(n\\,{indices[0]}\\,{indices[-1]}),scale=256:144",
             '-vsync', 0, '-q:v', 3, '-start_number', indices[0], pattern])
        frames = sorted(folder.glob('frame-*.jpg'))
        if len(frames) != len(indices): raise RuntimeError('Missing dense sequence frames')
        sheets = contact_sheets(frames, indices, 'dense-' + window['id'],
                                f"{window['id']} | every frame @60fps | global {window['start']:.3f}-{window['end']:.3f}s", out)
        movie = out / f"window-{window['id']}-60fps.mp4"
        # Extract from the already complete review; every selected frame retained, no retiming.
        filt = f'trim=start_frame={indices[0]}:end_frame={indices[-1]+1},setpts=PTS-STARTPTS'
        run(['ffmpeg', '-y', '-v', 'error', '-i', review, '-an', '-vf', filt, '-c:v', 'libx264', '-preset', 'slow',
             '-r', FPS, '-crf', 20, '-maxrate', '3000k', '-bufsize', '6000k', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', movie])
        window_probe = verify_video(movie, 1280, 720, frames=len(indices))
        records['denseWindows'].append({**window, 'frames': indices, 'times': [n / FPS for n in indices], 'sheets': sheets,
                                       'video': movie.name, 'probe': window_probe, 'audio': 'silent picture inspection only'})
    write_json(out / 'frame-evidence.json', records)
    return records

def preflight(variant, item, work, out):
    records=[]
    for frame in item['keyframes']:
        raw=work/'stills'/f'frame-{frame}.png'
        with Image.open(raw) as image:
            if image.size!=(1920,1080): raise RuntimeError('Wrong raw still dimensions')
            rgb=image.convert('RGB');std=ImageStat.Stat(rgb.resize((160,90))).stddev
            if max(std)<4: raise RuntimeError('Blank or near-blank rendered still')
            dst=out/f'keyframe-{frame:04d}.jpg';rgb.resize((1280,720)).save(dst,quality=86)
        records.append({'frame':frame,'seconds':frame/60,'rawPngSha256':sha(raw),'pixelStddev':std,'reviewImage':dst.name})
    write_json(out/'keyframes.json',records)

def package(variant,item,work,out):
    global WINDOWS
    WINDOWS=[{'id':f'transition-{i+1}','start':a/60,'end':b/60,'transition':(a+b)/120} for i,(a,b) in enumerate(item['windows'])]
    master=work/'master-1080p60.mp4';master_probe=verify_video(master,1920,1080,audio=True)
    review=out/f'{variant}-720p60-review.mp4';encode_review(master,master,review,work,out)
    review_probe=verify_video(review,1280,720,audio=True)
    preflight(variant,item,work,out)
    frames=extract_evidence(master,review,out,work)
    write_json(out/'media-evidence.json',{'master':{'sha256':sha(master),'probe':master_probe,'uploaded':False},'review':{'sha256':sha(review),'probe':review_probe},'denseFrames':sum(len(x['frames']) for x in frames['denseWindows']),'timing':item['timing']})
    run(['ffmpeg','-v','info','-i',review,'-vn','-af','ebur128=peak=true','-f','null','-'],out/'audio-loudness.txt')
    if Path('package-lock.json').exists(): (out/'package-lock.json').write_bytes(Path('package-lock.json').read_bytes())
    (out/'README.txt').write_text('New independently authored Remotion film, not migrated old huashu motion. Native1920x1080/60fps,900frames; delivery1280x720/60fps with full music.\nKeyframes are actual Remotion stills; dense sheets/videos retain every frame in registered windows.\n3D WebGL evidence is real onAfterRender context/triangles. State/tests do not certify beauty. Watch complete movie with sound before approval.\nLicense reviewed: https://www.remotion.dev/docs/license/pricing — free for individuals/companies up to3people; larger organizations need appropriate license. No paid rendering service used.\n')
    (out/'SHA256SUMS').write_text(''.join(f'{sha(p)}  {p.relative_to(out)}\n' for p in sorted(out.rglob('*')) if p.is_file() and p.name!='SHA256SUMS'))
    check_size(out)

if __name__=='__main__':
    command,variant=sys.argv[1:3];plan=json.loads(Path('render-plan.json').read_text());item=plan['variants'][variant]
    work=Path('.tmp')/variant;out=Path('artifacts')/variant
    if command=='check-size':
        if out.exists() and any(p.is_file() for p in out.rglob('*')):
            (out/'SHA256SUMS').write_text(''.join(f'{sha(p)}  {p.relative_to(out)}\n' for p in sorted(out.rglob('*')) if p.is_file() and p.name!='SHA256SUMS'))
        check_size(out)
    elif command=='preflight': preflight(variant,item,work,out)
    elif command=='package': package(variant,item,work,out)
    else: raise SystemExit('Unknown packaging command')
