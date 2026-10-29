"""Original deterministic paper-bird score. No samples, network or paid APIs.
Requires Python/numpy/scipy and FFmpeg. Run from any directory.
"""
from pathlib import Path
import json, wave, subprocess, hashlib, shutil
import numpy as np
from scipy.signal import butter, sosfilt
ROOT=Path(__file__).resolve().parent
OUT=ROOT.parent/'public/audio'; OUT.mkdir(parents=True,exist_ok=True)
SR=48000; DURATION=24; N=SR*DURATION
rng=np.random.default_rng(72941)
music=np.zeros((N,2)); sfx=np.zeros_like(music)
def hz(m):return 440*2**((m-69)/12)
def put(bus,x,at,gain=1,pan=0):
 start=round(at*SR); n=min(len(x),N-start)
 if n<=0:return
 bus[start:start+n,0]+=x[:n]*gain*np.sqrt((1-pan)/2)
 bus[start:start+n,1]+=x[:n]*gain*np.sqrt((1+pan)/2)
def tone(m,d,kind='wood'):
 t=np.arange(round(d*SR))/SR; f=hz(m)
 if kind=='wood':
  env=(1-np.exp(-t/0.008))*np.exp(-t/0.24)*np.minimum(1,(d-t)/0.08)
  y=np.sin(2*np.pi*f*t)+.26*np.sin(2*np.pi*2*f*t)*np.exp(-t/.1)+.10*np.sin(2*np.pi*3*f*t)*np.exp(-t/.07)
 elif kind=='air':
  env=np.minimum(t/.09,1)*np.minimum((d-t)/.24,1)*np.exp(-t/.95)
  phase=2*np.pi*f*t+.011*np.sin(2*np.pi*4.2*t)
  y=np.sin(phase)+.13*np.sin(2*phase)+.025*np.sin(3*phase)
 else:
  env=np.minimum(t/.35,1)*np.minimum((d-t)/.6,1)
  y=.75*np.sin(2*np.pi*f*t)+.18*np.sin(2*np.pi*f*1.0013*t)+.07*np.sin(2*np.pi*f*2*t)
 return y*env
# Six 4-second phrases, 120 BPM. D major / G / B minor / A / G / D.
chords=[[50,57,62,66],[43,55,59,62],[47,54,59,62],[45,57,61,64],[43,55,59,62],[50,57,62,66]]
melodies=[[(.5,74), (1.25,78),(2,81),(3,78)],[(.25,79),(1,78),(2,74),(3,71)],[(0,74),(1,78),(2.25,81),(3,83)],[(.25,81),(1.25,76),(2,73),(3,76)],[(0,79),(1,81),(2,83),(3,86)],[(0,81),(1,78),(2,74)]]
for bar,chord in enumerate(chords):
 at=bar*4
 for j,m in enumerate(chord):put(music,tone(m,4.8,'pad'),at,.025,(-.6+j*.4))
 for k in range(8):
  m=chord[1+(k%3)]+(12 if k%4==3 else 0)
  put(music,tone(m,.8),at+k*.5,.105 if k%2==0 else .068,(-.32 if k%2==0 else .32))
 for t,m in melodies[bar]:put(music,tone(m,1.25,'air'),at+t,.105,.12*np.sin(t))
 # Rounded bass, no drums or sharp clicks.
 for k in (0,2):put(music,tone(chord[0],1.7,'air'),at+k,.08,-.08)
def noise(d,low,high):
 x=rng.normal(0,1,round(d*SR));return sosfilt(butter(2,[low,high],btype='bandpass',fs=SR,output='sos'),x)
def flutter(at,d=.32,gain=.022,pan=0):
 t=np.arange(round(d*SR))/SR
 env=np.sin(np.pi*t/d)**2*(.45+.55*np.sin(2*np.pi*21*t)**2)
 put(sfx,noise(d,900,6500)*env,at,gain,pan)
def swell(at,d,gain,pan=0):
 t=np.arange(round(d*SR))/SR
 put(sfx,noise(d,180,2300)*np.sin(np.pi*t/d)**2,at,gain,pan)
# Ambient moving air, progressively more spacious toward the waterfront.
t=np.arange(N)/SR
for pan in [-.7,.7]:
 wind=noise(24,120,1700)*(.013+.008*np.sin(2*np.pi*.13*t+pan)**2)
 put(sfx,wind,0,1,pan)
# Distant softly rippling water opens from 15.5 seconds, never a splash impact.
d=8.5; tt=np.arange(round(d*SR))/SR
water=noise(d,450,4200)*(.4+.6*np.sin(2*np.pi*1.7*tt+.4*np.sin(tt))**2)*np.minimum(tt/2,1)
put(sfx,water,15.5,.019,.48)
flutter(.55,.40,.022,-.25);flutter(.94,.48,.043,-.12);swell(.85,1.1,.032)
for at in np.arange(1.8,20,.8):flutter(float(at),.30,.014,float(.3*np.sin(at*.5)))
for at in [3.9,7.85,11.9,15.85,19.85]:swell(at,.35,.018,-.18)
swell(16,2,.035,.2); flutter(20,.6,.018,.1)
# Gentle fade to silence, score resolves at 22 seconds with natural tail.
fade=np.minimum(t/.12,1)*np.minimum((24-t)/1.05,1)
music*=fade[:,None];sfx*=fade[:,None]
music[[0,-1]]=0;sfx[[0,-1]]=0

def write(path,x):
 with wave.open(str(path),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
  w.writeframes(np.round(np.clip(x,-1,1)*32767).astype('<i2').tobytes())
def measure(path):
 p=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-20:TP=-2.8:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 return json.loads(p.stderr[p.stderr.rfind('{'):p.stderr.rfind('}')+1])
mix=music+sfx
write(ROOT/'master-safe.wav',mix)
initial=measure(ROOT/'master-safe.wav');gain=10**((-20-float(initial['input_i']))/20)
# Preserve dynamics with constant gain; no limiter needed for this gentle score.
if float(initial['input_tp'])+20*np.log10(gain)>=-2.8:raise RuntimeError('Unexpected crest factor; redesign mix rather than clip')
write(ROOT/'music.wav',music*gain);write(ROOT/'sfx.wav',sfx*gain);write(ROOT/'master-safe.wav',mix*gain)
metrics={'master-safe':measure(ROOT/'master-safe.wav'),'sample_rate':SR,'channels':2,'samples_per_channel':N,'duration_seconds':DURATION,'seed':72941,'master_gain':gain,'method':'FFmpeg EBU R128 loudnorm analysis; constant linear gain, no compression'}
(ROOT/'measurements.json').write_text(json.dumps(metrics,indent=2)+'\n')
cues=[]
def cue(sec,event,kind):cues.append(dict(seconds=sec,frame=round(sec*30),sample=round(sec*SR),event=event,kind=kind))
for sec,event in [(4,'street_to_alley_hard_cut'),(8,'wall_occlusion_to_corner'),(12,'action_match_to_bridge'),(16,'pier_occlusion_start_climb'),(20,'rear_wide_long_glide')]:cue(sec,event,'transition')
for sec,event in [(.55,'crouch_paper_rustle'),(1,'takeoff'),(2.4,'sustained_glide'),(16,'waterfront_climb'),(20,'wings_open_long_glide')]:cue(sec,event,'bird')
(ROOT/'cues.json').write_text(json.dumps({'duration_seconds':24,'fps':30,'sample_rate':SR,'anchors_confirmed_with':'animate_line_world_journey','cues':sorted(cues,key=lambda c:c['seconds'])},indent=2)+'\n')
shutil.copyfile(ROOT/'master-safe.wav',OUT/'master-safe.wav')
files=['master-safe.wav','music.wav','sfx.wav','generate.py','cues.json']
(ROOT/'SHA256SUMS').write_text(''.join(hashlib.sha256((ROOT/f).read_bytes()).hexdigest()+'  '+f+'\n' for f in files))
print(json.dumps(metrics,indent=2))
