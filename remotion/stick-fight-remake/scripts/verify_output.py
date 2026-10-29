"""CI requires ffprobe (provided on GitHub ubuntu-latest). Fail closed on mismatch."""
import json,subprocess
from pathlib import Path
plan=json.loads(Path('render-plan.json').read_text())
names=['preview-360p60.mp4','clean-360p60.mp4'] if plan['mode']=='preview' else ['exit-fight-15s.mp4']
report={}
for name in names:
 p=Path('out')/name
 data=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]))
 video=next(x for x in data['streams'] if x['codec_type']=='video')
 audio=next(x for x in data['streams'] if x['codec_type']=='audio')
 assert video['codec_name']=='h264' and audio['codec_name']=='aac'
 assert video['r_frame_rate']=='60/1' and int(video['nb_frames'])==900
 assert video['width']==(640 if plan['mode']=='preview' else 1280)
 assert video['height']==(360 if plan['mode']=='preview' else 720)
 for obj in (video,audio,data['format']):assert abs(float(obj['duration'])-15)<.025,(name,obj.get('duration'))
 report[name]=data
Path('out/verification.json').write_text(json.dumps(report,indent=2))
print('Verified exact frame count, dimensions, codecs and duration for',names)
