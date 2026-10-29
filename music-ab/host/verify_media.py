import argparse, hashlib, json, subprocess
from pathlib import Path

def validate(probe, audio):
 video=[s for s in probe['streams'] if s['codec_type']=='video']
 sounds=[s for s in probe['streams'] if s['codec_type']=='audio']
 assert len(video)==1, 'Expected exactly one video stream'
 v=video[0]
 assert (v['width'],v['height'])==(1280,720), 'Wrong dimensions'
 assert v['r_frame_rate']=='30/1', 'Wrong FPS'
 assert int(v['nb_frames'])==900, 'Wrong frame count'
 assert abs(float(v['duration'])-30)<0.001, 'Wrong visual duration'
 assert abs(float(v.get('start_time',0)))<0.001, 'Nonzero visual start'
 assert len(sounds)==int(audio), 'Unexpected audio stream count'
 if audio:
  assert sounds[0]['channels']==2, 'Not stereo'
  assert abs(float(sounds[0]['duration'])-30)<0.025, 'Wrong audio duration'
  assert abs(float(sounds[0].get('start_time',0)))<0.025, 'Audio offset'

if __name__=='__main__':
 ap=argparse.ArgumentParser();ap.add_argument('file');ap.add_argument('--audio',action='store_true');ap.add_argument('--report');a=ap.parse_args()
 p=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_streams','-show_format','-of','json',a.file]))
 validate(p,a.audio)
 subprocess.run(['ffmpeg','-v','error','-i',a.file,'-f','null','-'],check=True)
 report={'file':Path(a.file).name,'sha256':hashlib.sha256(Path(a.file).read_bytes()).hexdigest(),'probe':p,'full_decode':'pass','contract':'pass'}
 if a.report:Path(a.report).write_text(json.dumps(report,indent=2))
 print(json.dumps({'file':report['file'],'sha256':report['sha256'],'full_decode':'pass','contract':'pass'}))
