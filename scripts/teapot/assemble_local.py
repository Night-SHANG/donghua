"""Repack the twelve same-commit parts with FFmpeg7; no video re-encoding."""
import argparse,hashlib,json,subprocess
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('parts',type=Path);p.add_argument('output',type=Path);a=p.parse_args();root=Path(__file__).resolve().parents[2];a.output.mkdir(parents=True,exist_ok=True)
versions=set()
for i in range(12):
 m=json.loads((a.parts/f'manifest-{i}.json').read_text());assert m['status']=='passed';versions.add(m['commit'])
 assert all(abs(m['frames'][j]['t']-(i*28+j)/24)<1e-8 for j in range(28))
 if i<11:assert (a.parts/f'boundary-{i}.png').read_bytes()==(a.parts/f'f{(i+1)*28:05d}.png').read_bytes()
assert len(versions)==1
run=lambda *args:subprocess.run(list(args),check=True)
version=subprocess.check_output(['ffmpeg','-version'],text=True).splitlines()[0]
run('python',str(root/'scripts/teapot/build_audio.py'))
run('ffmpeg','-v','error','-y','-i',str(root/'film/teapot/audio/mix.wav'),'-c:a','aac','-b:a','192k',str(a.output/'music.m4a'))
listing=a.output/'concat.txt';listing.write_text(''.join(f"file '{(a.parts/f'part-{i}.mp4').resolve()}'\n" for i in range(12)))
f=a.output/'teapot-bubbles-1080p.mp4'
run('ffmpeg','-v','error','-y','-f','concat','-safe','0','-i',str(listing),'-i',str(a.output/'music.m4a'),'-map','0:v:0','-map','1:a:0','-c','copy','-t','14','-movflags','+faststart',str(f))
run('python',str(root/'scripts/teapot/verify.py'),str(f))
(a.output/'provenance.json').write_text(json.dumps({'render_commit':versions.pop(),'parts':12,'frames':336,'boundary_checks':11,'encoder':version,'video_reencoded':False,'sha256':hashlib.sha256(f.read_bytes()).hexdigest()},indent=2))
