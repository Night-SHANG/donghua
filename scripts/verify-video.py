"""Strict delivery gate for a newly rendered original 12-second animation."""
import json, subprocess, sys
p=sys.argv[1]
r=json.loads(subprocess.check_output(['ffprobe','-v','error','-count_frames','-show_streams','-show_format','-of','json',p]))
v=next(s for s in r['streams'] if s['codec_type']=='video'); a=next(s for s in r['streams'] if s['codec_type']=='audio')
assert (v['width'],v['height'])==(1920,1080),v
assert v['r_frame_rate']=='24/1',v
assert int(v['nb_read_frames'])==288,v
assert v['codec_name']=='h264' and v['pix_fmt']=='yuv420p',v
assert a['codec_name']=='aac' and int(a['sample_rate'])==48000 and a['channels']==2,a
assert abs(float(r['format']['duration'])-12)<0.05,r['format']
subprocess.run(['ffmpeg','-v','error','-xerror','-i',p,'-f','null','-'],check=True)
print(json.dumps({'status':'PASS','video':v,'audio':a,'format':r['format']},indent=2))
