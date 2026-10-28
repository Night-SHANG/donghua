#!/usr/bin/env python3
"""Native huashu orchestration; render.py/engine.js remain upstream-exact.
No publishing, credentials, remote writes, or dependency installers in this file.
"""
from __future__ import annotations
import argparse
import hashlib
import json
import math
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import time

UPSTREAM_SHA = '8a0d7d72ca65fcce6f8ba82c4a6c8dfe35b8422c'
UPSTREAM_URL = 'https://github.com/alchaincyf/huashu-art-motion.git'
DEFAULT_PROJECT = 'huashu/fox-stork'


def run(argv, **kw):
    print('+', ' '.join(map(str, argv)), flush=True)
    return subprocess.run(list(map(str, argv)), check=True, **kw)


def output(argv):
    return subprocess.check_output(list(map(str, argv)), text=True).strip()


def sha(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1024 * 1024), b''):
            h.update(block)
    return h.hexdigest()


def write_json(path, data):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')


def safe_path(root, relative):
    root = Path(root).resolve()
    path = (root / relative).resolve()
    if path == root or not path.is_relative_to(root):
        raise ValueError(f'Expected a relative child path, got {relative!r}')
    return path


def load_config(project):
    c = json.loads((Path(project) / 'render-config.json').read_text())
    if c.get('mode', 'smoke') not in ('smoke', 'final'):
        raise ValueError('mode must be smoke or final')
    if c.get('mode') == 'final' and not str(c.get('reviewedSmokeRun', '')).isdigit():
        raise ValueError('Final mode requires reviewedSmokeRun (the reviewed GitHub smoke run ID)')
    if c.get('mode') == 'final' and c.get('audioRequired', True) and not c.get('audio'):
        raise ValueError('Final mode requires a configured complete soundtrack')
    if not re.fullmatch(r'[a-z0-9_]+', c['film']):
        raise ValueError('film must be a native safe film name')
    for k, low, high in [('duration', 5, 180), ('fps', 12, 60), ('width', 640, 1920), ('height', 360, 1920), ('chunkSeconds', 1, 8)]:
        v = c[k]
        if isinstance(v, bool) or not isinstance(v, (float, int)) or not math.isfinite(v) or not low <= v <= high:
            raise ValueError(f'{k} must be a finite number in [{low}, {high}]')
    for k in ('fps', 'width', 'height'):
        if int(c[k]) != c[k]:
            raise ValueError(f'{k} must be integral')
        c[k] = int(c[k])
    if c['width'] % 2 or c['height'] % 2:
        raise ValueError('H.264 dimensions must be even')
    for k in ('duration', 'chunkSeconds'):
        if abs(c[k] * c['fps'] - round(c[k] * c['fps'])) > 1e-7:
            raise ValueError(f'{k} must land exactly on a frame boundary')
    start = c.get('representativeStart', 0)
    if not isinstance(start, (int, float)) or not 0 <= start <= c['duration'] - 5:
        raise ValueError('representativeStart must leave a complete five-second clip')
    if abs(start * c['fps'] - round(start * c['fps'])) > 1e-7:
        raise ValueError('representativeStart must land on a frame boundary')
    c.setdefault('stills', [0.5, c['duration'] / 2, c['duration'] - 0.5])
    if not c['stills'] or any(isinstance(t, bool) or not isinstance(t, (float, int)) or not 0 <= t < c['duration'] for t in c['stills']):
        raise ValueError('stills must contain in-range timestamps')
    c.setdefault('crf', 18)
    if not isinstance(c['crf'], int) or not 12 <= c['crf'] <= 28:
        raise ValueError('crf must be an integer from 12 to 28')
    c.setdefault('qaFps', 5)
    if not isinstance(c['qaFps'], (int, float)) or not 1 <= c['qaFps'] <= 30:
        raise ValueError('qaFps must be in [1, 30]')
    c.setdefault('artifactLimitBytes', 14_000_000)
    if not isinstance(c['artifactLimitBytes'], int) or not 1_000_000 <= c['artifactLimitBytes'] < 15_000_000:
        raise ValueError('artifactLimitBytes must be >=1MB and strictly below 15MB')
    c.setdefault('reviewWidth', 1280)
    if not isinstance(c['reviewWidth'], int) or c['reviewWidth'] % 2 or not 640 <= c['reviewWidth'] <= c['width']:
        raise ValueError('reviewWidth must be an even integer in [640, width]')
    for k in ('audio', 'storyboard'):
        if c.get(k):
            safe_path(project, c[k])
    for argv in c.get('audioBuild', []):
        if not isinstance(argv, list) or not argv or any(not isinstance(v, str) for v in argv):
            raise ValueError('audioBuild must be a list of argv lists, never shell strings')
    c.setdefault('smokeIds', [])
    if any(not re.fullmatch(r'[a-zA-Z0-9_-]+', x) for x in c['smokeIds']):
        raise ValueError('smokeIds contains an invalid native scene ID')
    return c


def chunks(c):
    total = round(c['duration'] * c['fps'])
    step = round(c['chunkSeconds'] * c['fps'])
    return [{'part': f'{i:03}', 'startFrame': n, 'endFrame': min(n + step, total)} for i, n in enumerate(range(0, total, step))]


def file_manifest(root):
    root = Path(root)
    if any(p.is_symlink() for p in root.rglob('*')):
        raise ValueError('Symlinks are not allowed in source/artifact bundles')
    return {str(p.relative_to(root)): {'sha256': sha(p), 'bytes': p.stat().st_size}
            for p in sorted(root.rglob('*')) if p.is_file() and '__pycache__' not in p.parts and '.git' not in p.parts}


def source_manifest(project):
    # Excludes generated audio by computing this before audioBuild.
    files = {str(Path(project) / name): record for name, record in file_manifest(project).items()}
    for p in [Path(__file__), Path('.github/workflows/huashu-fable.yml'), Path('requirements-huashu-ci.txt'), Path('.github/actions/setup-huashu/action.yml'), Path('tests/test_huashu_ci.py')]:
        if p.is_file():
            key = str(p.relative_to(Path.cwd())) if p.is_absolute() and p.is_relative_to(Path.cwd()) else str(p)
            files[key] = {'sha256': sha(p), 'bytes': p.stat().st_size}
    digest = hashlib.sha256(json.dumps(files, sort_keys=True).encode()).hexdigest()
    return {'digestSha256': digest, 'files': files}


def provenance(project, config):
    return {'schema': 1, 'repository': os.getenv('GITHUB_REPOSITORY'), 'commit': os.getenv('GITHUB_SHA'),
            'ref': os.getenv('GITHUB_REF'), 'runId': os.getenv('GITHUB_RUN_ID'), 'runAttempt': os.getenv('GITHUB_RUN_ATTEMPT'),
            'workflowRef': os.getenv('GITHUB_WORKFLOW_REF'), 'upstream': {'url': UPSTREAM_URL, 'commit': UPSTREAM_SHA},
            'config': config, 'source': source_manifest(project),
            'toolVersions': {'python': sys.version, 'ffmpeg': output(['ffmpeg', '-version']).splitlines()[0],
                             'pipFreeze': output([sys.executable, '-m', 'pip', 'freeze']).splitlines()},
            'renderMethod': 'Unmodified huashu native Playwright Canvas renderer piped to ffmpeg; no Remotion',
            'independentVisualAudioReview': 'pending; CI metrics are not artistic approval'}


def prepare(args, c):
    upstream = Path(args.upstream).resolve()
    actual = output(['git', '-C', upstream, 'rev-parse', 'HEAD'])
    if actual != UPSTREAM_SHA:
        raise RuntimeError(f'Wrong upstream SHA: {actual}')
    # Do not accept a locally modified renderer as the pinned upstream.
    if output(['git', '-C', upstream, 'status', '--porcelain', '--untracked-files=no']):
        raise RuntimeError('Upstream checkout must be clean')
    work = Path(args.work)
    if work.exists():
        raise RuntimeError(f'Refusing to replace existing workspace {work}; use a fresh --work')
    work.mkdir(parents=True)
    shutil.copytree(upstream / 'scripts', work / 'scripts', ignore=shutil.ignore_patterns('__pycache__', '*.pyc'))
    shutil.copy2(upstream / 'LICENSE', work / 'UPSTREAM-LICENSE')
    overlay = Path(args.project) / 'engine'
    if not overlay.is_dir() or not (overlay / f"eras_{c['film']}.js").is_file():
        raise RuntimeError('Film engine overlay and eras_<film>.js are required')
    for p in sorted(overlay.rglob('*')):
        if p.is_symlink():
            raise RuntimeError(f'Symlink not allowed in engine overlay: {p}')
        if p.is_file():
            rel = p.relative_to(overlay)
            target = work / 'scripts' / 'engine' / rel
            # All film code is additive: no changes to upstream renderer/core/fonts.
            if target.exists():
                raise RuntimeError(f'Film overlay must not overwrite upstream file: {rel}')
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(p, target)
    write_json(work / 'provenance.json', provenance(args.project, c))
    if c.get('storyboard'):
        run([sys.executable, work / 'scripts/storyboard_lint.py', safe_path(args.project, c['storyboard'])])
    if args.skip_audio:
        return  # Final native-qa already validated the soundtrack; chunks are silent.
    for argv in c.get('audioBuild', []):
        run(argv, cwd=Path(args.project))
    if c.get('audio'):
        audio = safe_path(args.project, c['audio'])
        if not audio.is_file():
            raise RuntimeError(f'Configured audio missing: {audio}')
        data = json.loads(output(['ffprobe', '-v', 'error', '-show_format', '-show_streams', '-of', 'json', audio]))
        if not any(s['codec_type'] == 'audio' for s in data['streams']) or float(data['format']['duration']) < c['duration'] - 0.05:
            raise RuntimeError('Audio must contain a stream covering the whole film')
        write_json(work / 'audio-source.json', {'sha256': sha(audio), 'probe': data})
    elif c.get('mode') == 'final' and c.get('audioRequired', True):
        raise RuntimeError('Soundtrack required: configure audio/audioBuild before rendering')


def verify_video(path, c, expected_frames, audio=False, width=None):
    data = json.loads(output(['ffprobe', '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json', path]))
    videos = [s for s in data['streams'] if s['codec_type'] == 'video']
    if len(videos) != 1:
        raise RuntimeError('Expected exactly one video stream')
    v = videos[0]
    w = width or c['width']; h = round(c['height'] * w / c['width'] / 2) * 2
    if (v['width'], v['height']) != (w, h):
        raise RuntimeError(f'Wrong frame size {(v["width"], v["height"])} expected {(w, h)}')
    if v['codec_name'] != 'h264' or v.get('pix_fmt') != 'yuv420p':
        raise RuntimeError('Expected H.264 yuv420p')
    n, d = map(int, v['avg_frame_rate'].split('/'))
    if abs(n / d - c['fps']) > 1e-6 or int(v['nb_read_frames']) != expected_frames:
        raise RuntimeError(f'Wrong frame count or fps: {v}')
    if abs(float(v['duration']) - expected_frames / c['fps']) > 1 / c['fps']:
        raise RuntimeError('Encoded video duration mismatch')
    if audio and not any(s['codec_type'] == 'audio' for s in data['streams']):
        raise RuntimeError('Audio stream missing')
    run(['ffmpeg', '-v', 'error', '-xerror', '-i', path, '-f', 'null', '-'], stdout=subprocess.DEVNULL)
    return data


def native_render(args, c, out, start=0, end=None, stills=None):
    cmd = [sys.executable, Path(args.work) / 'scripts/engine/render.py', '--film', c['film'], '--width', c['width'],
           '--height', c['height'], '--fps', c['fps'], '--crf', c['crf'], '--out', out]
    if stills is not None:
        cmd += ['--stills', ','.join(map(str, stills))]
    else:
        cmd += ['--from', start, '--to', end]
    run(cmd)


def bounded_encode(source, target, c, duration, audio=None, start=0, width=None):
    # Two-pass explicit bitrate budget; metadata/headroom remain well below 15 MB.
    limit = c['artifactLimitBytes'] - 500_000
    audio_bps = 128_000 if audio else 0
    bitrate = min(8_000_000, int(limit * 8 / duration * .94) - audio_bps)
    if bitrate < 150_000:
        raise RuntimeError('File budget too small for a useful review encode')
    width = width or c['width']
    scale = f'scale={width}:-2,format=yuv420p'
    base = ['ffmpeg', '-y', '-v', 'error', '-i', source]
    enc = ['-vf', scale, '-r', c['fps'], '-c:v', 'libx264', '-preset', 'slow', '-b:v', bitrate, '-pix_fmt', 'yuv420p']
    passlog = str(Path(target).with_suffix('.passlog'))
    run(base + enc + ['-pass', 1, '-passlogfile', passlog, '-an', '-f', 'null', os.devnull])
    if audio:
        base += ['-ss', start, '-t', duration, '-i', audio]
    mappings = ['-map', '0:v:0'] + (['-map', '1:a:0', '-c:a', 'aac', '-b:a', '128k'] if audio else ['-an'])
    run(base + mappings + enc + ['-pass', 2, '-passlogfile', passlog, '-t', duration, '-movflags', '+faststart', target])
    for path in Path(target).parent.glob(Path(passlog).name + '*'):
        path.unlink()  # Ephemeral encoder stats created by this invocation, not prior outputs.
    if Path(target).stat().st_size > limit:
        raise RuntimeError('Encoded video exceeds its conservative file budget')
    return {'twoPass': True, 'targetVideoBitsPerSecond': bitrate, 'audioBitsPerSecond': audio_bps, 'width': width}


def bundle(args, c, folder, extra=None):
    folder = Path(folder)
    prov = json.loads((Path(args.work) / 'provenance.json').read_text())
    prov.update(extra or {})
    if (Path(args.work) / 'audio-source.json').exists():
        prov['audio'] = json.loads((Path(args.work) / 'audio-source.json').read_text())
    prov['artifacts'] = file_manifest(folder)
    write_json(folder / 'provenance.json', prov)
    (folder / 'SHA256SUMS').write_text(''.join(f"{sha(p)}  {p.relative_to(folder)}\n" for p in sorted(folder.rglob('*')) if p.is_file() and p.name != 'SHA256SUMS'))
    size = sum(p.stat().st_size for p in folder.rglob('*') if p.is_file())
    if size >= c['artifactLimitBytes']:
        raise RuntimeError(f'Artifact bundle {folder} is {size} bytes, exceeds conservative cap {c["artifactLimitBytes"]}')


def smoke(args, c):
    from PIL import Image, ImageDraw
    out = Path(args.out); out.mkdir(parents=True, exist_ok=False)
    stilldir = Path(args.work) / 'smoke-original-stills'
    native_render(args, c, stilldir, stills=c['stills'])
    jpgs = []
    for p in sorted(stilldir.glob('*.png')):
        im = Image.open(p).convert('RGB'); im.thumbnail((1280, 720))
        dst = out / (p.stem + '.jpg'); im.save(dst, quality=91); jpgs.append((p.stem, im.copy()))
    sheet = Image.new('RGB', (960, math.ceil(len(jpgs) / 2) * 294), '#eee8dc')
    draw = ImageDraw.Draw(sheet)
    for i, (name, im) in enumerate(jpgs):
        im.thumbnail((480, 270)); x = (i % 2) * 480; y = (i // 2) * 294
        sheet.paste(im, (x, y + 24)); draw.text((x + 10, y + 5), name, fill='#24201d')
    sheet.save(out / 'contact-sheet.jpg', quality=89)
    start = c.get('representativeStart', 0); master = Path(args.work) / 'smoke-native.mp4'
    t = time.monotonic(); native_render(args, c, master, start, start + 5)
    elapsed = time.monotonic() - t
    verify_video(master, c, c['fps'] * 5)
    audio = safe_path(args.project, c['audio']) if c.get('audio') else None
    encoding = bounded_encode(master, out / 'representative-5s.mp4', c, 5, audio, start, c['reviewWidth'])
    probe = verify_video(out / 'representative-5s.mp4', c, c['fps'] * 5, bool(audio), c['reviewWidth'])
    if c['smokeIds']:
        qa(args, c, out / 'native-qa', ids=c['smokeIds'])
    bundle(args, c, out, {'stage': 'smoke', 'globalTimeRange': [start, start + 5], 'renderWallSeconds': round(elapsed, 3),
                         'nativeMasterSha256': sha(master), 'encodedProbe': probe, 'encoding': encoding,
                         'nativeQaCoverage': c['smokeIds'] or 'not run; full native QA runs at final stage'})


def chunk(args, c):
    record = next((r for r in chunks(c) if r['part'] == args.part), None)
    if record is None:
        raise ValueError('Unknown chunk part')
    out = Path(args.out); out.mkdir(parents=True, exist_ok=False)
    start, end = record['startFrame'] / c['fps'], record['endFrame'] / c['fps']
    master = Path(args.work) / f"native-{args.part}.mp4"
    native_render(args, c, master, start, end)
    verify_video(master, c, record['endFrame'] - record['startFrame'])
    target = out / f"part-{args.part}.mp4"
    encoding = {'method': 'native encoder copy', 'crf': c['crf']}
    if master.stat().st_size < c['artifactLimitBytes'] - 500_000:
        shutil.copy2(master, target)
    else:
        encoding = bounded_encode(master, target, c, end - start)
    probe = verify_video(target, c, record['endFrame'] - record['startFrame'])
    bundle(args, c, out, {'stage': 'chunk', **record, 'encodedProbe': probe, 'encoding': encoding, 'nativeMasterSha256': sha(master)})


def qa(args, c, out=None, ids=None):
    out = Path(out or args.out)
    cmd = [sys.executable, Path(args.work) / 'scripts/qa.py', '--project', Path(args.work) / 'scripts/engine',
           '--film', c['film'], '--fps', c['qaFps'], '--sub-band', 0, '--out', out]
    if ids:
        cmd += ['--ids', ','.join(ids)]
    run(cmd)
    report = json.loads((out / 'qa.json').read_text())
    if not report['segments'] or report.get('page_errors'):
        raise RuntimeError('Native QA did not cover scenes or reported page errors')
    if any(not x['deterministic'] for x in report['segments']):
        raise RuntimeError('Sampled cold/hot frame determinism check failed')
    if ids and set(ids) != {x['id'] for x in report['segments']}:
        raise RuntimeError('Native QA requested scene IDs not all present')
    if out == Path(args.out):
        bundle(args, c, out, {'stage': 'native-qa', 'coverage': 'sampled per-scene, not exhaustive every-frame proof'})


def collect_parts(folder, expected, commit, source_digest):
    found = {}
    for provpath in Path(folder).glob('*/provenance.json'):
        p = json.loads(provpath.read_text())
        if p.get('stage') != 'chunk':
            continue
        if p.get('commit') != commit or p['source']['digestSha256'] != source_digest or p['upstream']['commit'] != UPSTREAM_SHA:
            raise RuntimeError('Chunk commit/source/upstream provenance mismatch')
        key = p['part']
        if key in found:
            raise RuntimeError('Duplicate chunk')
        video = provpath.parent / f'part-{key}.mp4'
        if sha(video) != p['artifacts'][video.name]['sha256']:
            raise RuntimeError('Chunk artifact digest mismatch')
        found[key] = (video, p)
    if set(found) != {x['part'] for x in expected}:
        raise RuntimeError('Missing or unexpected chunks')
    ordered = []
    for want in expected:
        video, p = found[want['part']]
        if any(p[k] != want[k] for k in ('startFrame', 'endFrame')):
            raise RuntimeError('Chunk range mismatch; would cause gap or overlap')
        ordered.append((video, p))
    return ordered


def assemble(args, c):
    out = Path(args.out); out.mkdir(parents=True, exist_ok=False)
    own = json.loads((Path(args.work) / 'provenance.json').read_text())
    parts = collect_parts(args.parts, chunks(c), own['commit'], own['source']['digestSha256'])
    for video, p in parts:
        verify_video(video, c, p['endFrame'] - p['startFrame'])
    concat = Path(args.work) / 'concat.txt'
    # Generated paths contain no apostrophes on GitHub-hosted runner; still reject.
    if any("'" in str(p.resolve()) or '\n' in str(p) for p, _ in parts):
        raise RuntimeError('Unsafe concat filename')
    concat.write_text(''.join(f"file '{p.resolve()}'\n" for p, _ in parts))
    master = Path(args.work) / 'assembled-native-silent.mp4'
    run(['ffmpeg', '-y', '-v', 'error', '-f', 'concat', '-safe', 0, '-i', concat, '-c', 'copy', '-movflags', '+faststart', master])
    frames = round(c['duration'] * c['fps']); verify_video(master, c, frames)
    audio = safe_path(args.project, c['audio']) if c.get('audio') else None
    film = out / 'fox-stork-review.mp4'
    encoding = bounded_encode(master, film, c, c['duration'], audio, width=c['reviewWidth'])
    probe = verify_video(film, c, frames, bool(audio), c['reviewWidth'])
    gate = out / 'film-gate.json'
    with gate.open('w') as f:
        result = subprocess.run([sys.executable, str(Path(args.work) / 'scripts/film_gate.py'), str(film), '--json', '--no-template', '--sub-band', '0'], stdout=f)
    if result.returncode not in (0, 2):
        raise RuntimeError('Native film gate could not measure the encoded film')
    # Always preserve red result and movie for diagnosis, but fail CI after writing provenance.
    with (out / 'audio-loudness.txt').open('w') as f:
        if audio:
            run(['ffmpeg', '-v', 'info', '-i', film, '-vn', '-af', 'ebur128=peak=true', '-f', 'null', '-'], stdout=subprocess.DEVNULL, stderr=f)
        else:
            f.write('No audio configured.\n')
    for p, rec in parts:
        write_json(out / f"chunk-{rec['part']}-provenance.json", rec)
    bundle(args, c, out, {'stage': 'assembled-review', 'encodedProbe': probe, 'encoding': encoding,
                         'assembledNativeSilentSha256': sha(master), 'filmGateExitCode': result.returncode,
                         'sourceArtifactNote': 'Repository commit + exact upstream pin reproduce source; review is size-bounded, not an untouched master.'})
    if result.returncode == 2:
        raise RuntimeError('Film gate is red; artifact retained for diagnosis, not approved delivery')


def main():
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument('command', choices=['matrix', 'prepare', 'smoke', 'chunk', 'qa', 'assemble', 'check-size'])
    p.add_argument('--project', default=DEFAULT_PROJECT)
    p.add_argument('--upstream', default='.native/upstream')
    p.add_argument('--work', default='.native/work')
    p.add_argument('--out', default='huashu-output')
    p.add_argument('--part')
    p.add_argument('--skip-audio', action='store_true', help='Prepare silent chunk workers after audio preflight')
    p.add_argument('--parts', default='huashu-parts')
    args = p.parse_args(); c = load_config(args.project)
    if args.command == 'check-size':
        files = [p for p in Path(args.out).rglob('*') if p.is_file()]
        size = sum(p.stat().st_size for p in files)
        if not files or size >= c['artifactLimitBytes']:
            raise RuntimeError(f'Refusing upload: {len(files)} files, {size} bytes')
        print(f'Upload bundle: {len(files)} files, {size} bytes < {c["artifactLimitBytes"]}')
        return
    if args.command == 'matrix':
        plan = {'include': chunks(c)}
        print(json.dumps(plan))
        if os.getenv('GITHUB_OUTPUT'):
            with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
                f.write('matrix=' + json.dumps(plan, separators=(',', ':')) + '\nmode=' + c.get('mode', 'smoke') + '\n')
        return
    if args.command == 'prepare': prepare(args, c)
    elif args.command == 'smoke': smoke(args, c)
    elif args.command == 'chunk': chunk(args, c)
    elif args.command == 'qa': qa(args, c)
    elif args.command == 'assemble': assemble(args, c)


if __name__ == '__main__':
    main()
