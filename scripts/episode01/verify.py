import json,subprocess,sys
from pathlib import Path
p=Path(sys.argv[1]); probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',str(p)]));v=next(s for s in probe['streams'] if s['codec_type']=='video');a=next(s for s in probe['streams'] if s['codec_type']=='audio')
p.with_suffix('.probe.json').write_text(json.dumps(probe,indent=2))
print(json.dumps({'video_duration':v.get('duration'),'audio_duration':a.get('duration'),'video_frames':v.get('nb_frames')}),flush=True)
assert (v['width'],v['height'],v['r_frame_rate'],int(v['nb_frames']))==(1920,1080,'24/1',768)
assert abs(float(v['duration'])-32)<.002 and abs(float(a['duration'])-32)<.025
assert a['sample_rate']=='48000' and a['channels']==2
assert v['pix_fmt']=='yuv420p' and v['color_space']=='bt709'
subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(p),'-f','null','-'],check=True)
raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-map','0:a:0','-f','f32le','-acodec','pcm_f32le','-']);n=len(raw)//8;assert 1536000<=n<=1537024
result={'status':'passed','video_duration':v['duration'],'audio_duration':a['duration'],'frames':768,'audio_decoded_frames_per_channel':n,'full_decode':True,'human_audition':False,'probe':probe};p.with_suffix('.qa.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
