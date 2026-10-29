import json,subprocess,sys
from pathlib import Path
spec=json.loads(Path('film-spec.json').read_text());plan=json.loads(Path('render-plan.json').read_text());duration=spec['durationInFrames']/spec['fps'];preview=plan['mode']=='preview'
if plan['mode']=='keyframes':
 gate=json.loads(Path('out/fx-prop-gate.json').read_text());assert gate['pass'];print('Keyframes/pixel gate only');sys.exit(0)
report={}
for name in (['preview.mp4','clean.mp4'] if preview else [spec['outputName']]):
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(Path('out')/name)]));video=next(x for x in data['streams'] if x['codec_type']=='video');audio=next(x for x in data['streams'] if x['codec_type']=='audio')
 assert video['codec_name']=='h264' and audio['codec_name']=='aac'
 assert video['r_frame_rate']==str(spec['fps'])+'/1' and int(video['nb_frames'])==spec['durationInFrames']
 scale=.5 if preview else 1
 assert video['width']==int(spec['width']*scale) and video['height']==int(spec['height']*scale)
 for obj in (video,audio,data['format']):assert abs(float(obj['duration'])-duration)<.025,(name,obj.get('duration'),duration)
 report[name]=data
Path('out/verification.json').write_text(json.dumps(report,indent=2))
print('Film spec duration/frames/codecs verified')
