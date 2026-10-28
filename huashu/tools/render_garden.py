#!/usr/bin/env python3
"""One complete native 15s garden render, music mux and dense transition evidence."""
from __future__ import annotations
import argparse
import hashlib
import importlib.metadata
import json
import math
import os
from pathlib import Path
import shutil
import subprocess
import sys
import time

UPSTREAM_SHA = '8a0d7d72ca65fcce6f8ba82c4a6c8dfe35b8422c'
UPSTREAM_URL = 'https://github.com/alchaincyf/huashu-art-motion.git'
FILM = 'rain_garden'
FPS, DURATION, FRAME_COUNT, CAP = 60, 15, 900, 14_000_000
SCENES = [
    {'id': 'dew', 'range': [0, 3.8], 'still': 1.7},
    {'id': 'ripple', 'range': [3.8, 7], 'still': 4.25},
    {'id': 'bloom', 'range': [7, 11], 'still': 9.8},
    {'id': 'island', 'range': [11, 15], 'still': 14.4},
]
# Every source frame is represented, not 5/10fps sampling. Times are global.
WINDOWS = [
    {'id': 'dew-impact', 'start': 2.75, 'end': 4.3, 'transition': 3.8},
    {'id': 'ripple-bloom', 'start': 6.9, 'end': 7.4, 'transition': 7},
    {'id': 'bloom-island', 'start': 10.9, 'end': 11.3, 'transition': 11},
]


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


def verify_upstream(root):
    head = output(['git', '-C', root, 'rev-parse', 'HEAD'])
    dirty = output(['git', '-C', root, 'status', '--porcelain', '--untracked-files=no'])
    if head != UPSTREAM_SHA or dirty:
        raise RuntimeError('Upstream must be the clean exact reviewed commit')
    return head


def manifest(root):
    if any(p.is_symlink() for p in root.rglob('*')): raise RuntimeError('Symlink source is not allowed')
    return {str(p.relative_to(root)): {'sha256': sha(p), 'bytes': p.stat().st_size}
            for p in sorted(root.rglob('*')) if p.is_file() and '__pycache__' not in p.parts and p.suffix != '.pyc'}


def overlay_engine(upstream, project, work):
    verify_upstream(upstream)
    work.mkdir(parents=True, exist_ok=False)
    shutil.copytree(upstream / 'scripts', work / 'scripts', ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    overlay = project / 'engine'
    if not (overlay / 'eras_rain_garden.js').is_file(): raise RuntimeError('Native eras_rain_garden.js required')
    for p in sorted(overlay.rglob('*')):
        if p.is_symlink(): raise RuntimeError('Engine overlay must not contain symlinks')
        if not p.is_file(): continue
        target = work / 'scripts/engine' / p.relative_to(overlay)
        if target.exists(): raise RuntimeError('Additive overlay must not replace an upstream engine file')
        target.parent.mkdir(parents=True, exist_ok=True); shutil.copy2(p, target)
    if sha(work / 'scripts/engine/render.py') != sha(upstream / 'scripts/engine/render.py'):
        raise RuntimeError('Native renderer changed')


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
    from PIL import Image, ImageDraw
    records = {'sceneStills': [], 'denseWindows': [], 'source': 'decoded native 1080p60 encoded master; JPEG thumbnails are review evidence'}
    for scene in SCENES:
        frame = round(scene['still'] * FPS); dst = out / f"scene-{scene['id']}-f{frame:04d}.jpg"
        run(['ffmpeg', '-y', '-v', 'error', '-i', master, '-vf', f'select=eq(n\\,{frame}),scale=1280:720', '-frames:v', 1, '-q:v', 3, dst])
        records['sceneStills'].append({**scene, 'frame': frame, 'actualTime': frame / FPS, 'file': dst.name})
    for window in WINDOWS:
        indices = frame_range(window); folder = work / ('dense-' + window['id']); folder.mkdir()
        pattern = folder / 'frame-%04d.jpg'
        run(['ffmpeg', '-y', '-v', 'error', '-i', master, '-vf', f"select=between(n\\,{indices[0]}\\,{indices[-1]}),scale=256:144",
             '-vsync', 0, '-q:v', 3, '-start_number', indices[0], pattern])
        frames = sorted(folder.glob('frame-*.jpg'))
        if len(frames) != len(indices): raise RuntimeError('Missing dense sequence frames')
        sheets = []
        for offset in range(0, len(frames), 32):
            group = frames[offset:offset + 32]; rows = math.ceil(len(group) / 8)
            sheet = Image.new('RGB', (2048, 32 + rows * 164), '#f1ece4'); draw = ImageDraw.Draw(sheet)
            draw.text((10, 10), f"{window['id']} | every frame @60fps | global {window['start']:.3f}-{window['end']:.3f}s", fill='#182422')
            for j, p in enumerate(group):
                frame = indices[offset + j]; x, y = (j % 8) * 256, 32 + (j // 8) * 164
                with Image.open(p) as im: sheet.paste(im.convert('RGB'), (x, y))
                draw.text((x + 6, y + 146), f'{frame:04d}  {frame / FPS:07.4f}s', fill='#182422')
            dst = out / f"dense-{window['id']}-{offset // 32 + 1:02d}.jpg"; sheet.save(dst, quality=88); sheets.append(dst.name)
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


def render(args):
    upstream, project, work, out = args.upstream.resolve(), args.project.resolve(), args.work.resolve(), args.out.resolve()
    out.mkdir(parents=True, exist_ok=False)
    evidence = {'schema': 1, 'film': FILM, 'purpose': 'Original 15-second healing garden short; no characters or reused fox/stork rig',
                'upstream': {'url': UPSTREAM_URL, 'commit': verify_upstream(upstream)}, 'projectSource': manifest(project),
                'repository': os.getenv('GITHUB_REPOSITORY'), 'commit': os.getenv('GITHUB_SHA'), 'runId': os.getenv('GITHUB_RUN_ID'),
                'runAttempt': os.getenv('GITHUB_RUN_ATTEMPT'), 'workflowRef': os.getenv('GITHUB_WORKFLOW_REF'),
                'nativeRenderer': {'width': 1920, 'height': 1080, 'fps': FPS, 'duration': DURATION, 'frames': FRAME_COUNT, 'crf': 14},
                'tools': {'python': sys.version, 'ffmpeg': output(['ffmpeg', '-version']).splitlines()[0],
                          'packages': {x: importlib.metadata.version(x) for x in ['playwright', 'Pillow', 'numpy', 'scipy', 'opencv-python-headless']}},
                'independentRealTimeReview': 'pending; measurements do not certify aesthetics or sound-image meaning'}
    evidence['orchestrationSource'] = {str(p): {'sha256': sha(p)} for p in [Path(__file__), Path('.github/workflows/huashu-rain-garden.yml'), Path('requirements-huashu-garden.txt')] if p.is_file()}
    write_json(out / 'evidence.json', evidence)
    overlay_engine(upstream, project, work)
    run(['node', project / 'tests/test-state.js'], out / 'garden-state-tests.log', cwd=project,
        env={**os.environ, 'HUASHU_ENGINE': str(work / 'scripts/engine')})
    if (project / '镜头表.md').exists():
        run([sys.executable, work / 'scripts/storyboard_lint.py', project / '镜头表.md'], out / 'storyboard-lint.txt')
    run([sys.executable, project / 'audio/synthesize.py'], out / 'audio-build.log', cwd=project)
    run([sys.executable, project / 'audio/test_audio.py'], out / 'audio-tests.log', cwd=project)
    audio = project / 'audio/master.wav'; audio_probe = probe(audio)
    stream = next((s for s in audio_probe['streams'] if s['codec_type'] == 'audio'), None)
    if not stream or int(stream['sample_rate']) != 48000 or stream['channels'] != 2 or abs(float(audio_probe['format']['duration']) - DURATION) > .001:
        raise RuntimeError('Soundtrack must be exactly 15 seconds, stereo 48kHz')
    master = work / 'garden-native-1080p60.mp4'; begin = time.monotonic()
    run([sys.executable, work / 'scripts/engine/render.py', '--film', FILM, '--width', 1920, '--height', 1080, '--fps', FPS,
         '--crf', 14, '--from', 0, '--to', DURATION, '--out', master], out / 'render-native.log')
    elapsed = time.monotonic() - begin; master_probe = verify_video(master, 1920, 1080)
    review = out / 'rain-garden-720p60-review.mp4'; encode_review(master, audio, review, work, out)
    review_probe = verify_video(review, 1280, 720, audio=True)
    frames = extract_evidence(master, review, out, work)
    qa_dir = out / 'native-qa'
    qa_code = run([sys.executable, work / 'scripts/qa.py', '--project', work / 'scripts/engine', '--film', FILM,
                   '--fps', 5, '--sub-band', 0, '--out', qa_dir], out / 'native-qa.log', check=False)
    qa = json.loads((qa_dir / 'qa.json').read_text()) if (qa_dir / 'qa.json').is_file() else {}
    with (out / 'film-gate.json').open('w') as f:
        gate = subprocess.run([sys.executable, str(work / 'scripts/film_gate.py'), str(review), '--json', '--no-template', '--sub-band', '0'], stdout=f)
    run(['ffmpeg', '-v', 'info', '-i', review, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], out / 'encoded-audio-loudness.txt')
    verify_upstream(upstream)
    blockers = []
    if qa_code or qa.get('page_errors') or len(qa.get('segments', [])) != 4: blockers.append('Native QA failed or did not cover four scenes')
    if any(not s['deterministic'] for s in qa.get('segments', [])): blockers.append('Sampled cold/hot frame determinism failed')
    if gate.returncode: blockers.append('Native film gate red/unreadable; see actual JSON/log, not an approved final')
    evidence.update({'renderWallSeconds': round(elapsed, 3), 'audio': {'path': 'audio/master.wav', 'sha256': sha(audio), 'probe': audio_probe},
                     'nativeMaster': {'sha256': sha(master), 'bytes': master.stat().st_size, 'probe': master_probe, 'uploaded': False},
                     'reviewDerivative': {'sha256': sha(review), 'bytes': review.stat().st_size, 'probe': review_probe,
                                          'videoBitsPerSecond': 4_000_000, 'audioBitsPerSecond': 192_000, 'size': [1280, 720]},
                     'sceneEvidence': frames['sceneStills'], 'denseEvidenceFrames': sum(len(w['frames']) for w in frames['denseWindows']),
                     'nativeQaExitCode': qa_code, 'filmGateExitCode': gate.returncode, 'technicalBlockers': blockers,
                     'qualityScope': 'Full video decode/frame integrity + sparse native QA + every encoded frame in three critical windows; independent review still required'})
    write_json(out / 'evidence.json', evidence)
    (out / 'UPSTREAM-LICENSE.txt').write_text((upstream / 'LICENSE').read_text())
    (out / 'READ-ME.txt').write_text(
        'Rain Garden: original 15-second, four-shot short. No characters, fox rig or official-example character assets.\n'
        'Rendered once in native huashu at 1920x1080, 60fps, 900 frames. Uploaded film is a 1280x720, 60fps music-muxed derivative.\n'
        'Scene stills and dense sheets derive from the native 1080p encoded master, not claims of lossless original canvas PNGs.\n'
        'Dense sheets include EVERY frame (60Hz) in 2.75–4.3, 6.9–7.4, 10.9–11.3 global seconds; frame-evidence.json maps every tile to time.\n'
        'Short window movies are silent picture inspection clips, not replacement soundtrack segments. Main review has complete music.\n'
        'Native QA determinism is sampled at reduced resolution; cinematic/aesthetic/audio review remains pending.\n')
    (out / 'SHA256SUMS').write_text(''.join(f'{sha(p)}  {p.relative_to(out)}\n' for p in sorted(out.rglob('*')) if p.is_file() and p.name != 'SHA256SUMS'))
    check_size(out)
    if blockers: raise RuntimeError('; '.join(blockers))


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=['render', 'check-size'])
    p.add_argument('--upstream', type=Path, default=Path('.native-garden/upstream'))
    p.add_argument('--project', type=Path, default=Path('huashu/rain-garden'))
    p.add_argument('--work', type=Path, default=Path('.native-garden/work'))
    p.add_argument('--out', type=Path, default=Path('garden-output'))
    args = p.parse_args()
    if args.command == 'check-size': check_size(args.out)
    else: render(args)


if __name__ == '__main__': main()
