"""Original procedural 7-second score. No samples, downloads, speech or paid API.
Rebuild: python audio/generate.py ; python audio/test_audio.py
Requires numpy scipy and FFmpeg. Fixed RNG; PCM is deterministic in this toolchain.
"""
import hashlib,json,pathlib,re,shutil,subprocess,wave
import numpy as np
from scipy.signal import butter,sosfilt
ROOT=pathlib.Path(__file__).resolve().parent
SR=48000;FPS=30;N=SR*7
rng=np.random.default_rng(6102911)
music=np.zeros((N,2));sfx=np.zeros_like(music)
def noise(n,lo,hi):
 return sosfilt(butter(2,[lo,hi],btype='bandpass',fs=SR,output='sos'),rng.normal(0,1,n))
def shape(t,attack,decay):return (1-np.exp(-t/attack))*np.exp(-t/decay)
def body(kind,dur=.45):
 t=np.arange(round(dur*SR))/SR
 if kind=='whoosh':
  env=np.sin(np.pi*np.minimum(t/dur,1))**2
  a=noise(len(t),220,2400)*env*.5
 elif kind=='body':
  phase=2*np.pi*(63*t+34*.025*(1-np.exp(-t/.025)))
  a=(.8*np.sin(phase)*shape(t,.001,.065)+noise(len(t),140,1700)*shape(t,.001,.024)*.65)
 elif kind=='cloth':
  a=noise(len(t),180,1400)*shape(t,.008,.035)*.5
 elif kind=='parry':
  a=sum(v*np.sin(2*np.pi*f*t)*shape(t,.0007,d) for f,v,d in [(310,.35,.025),(543,.16,.018),(821,.08,.012)])+noise(len(t),450,3500)*shape(t,.001,.018)*.32
 elif kind in ('ground','step','brace'):
  mult={'ground':1,'step':.55,'brace':.65}[kind]
  a=mult*(np.sin(2*np.pi*96*t)*shape(t,.002,.04)*.45+noise(len(t),100,1800)*shape(t,.001,.045)*.65)
 elif kind=='bass':
  a=sum(v*np.sin(2*np.pi*f*t)*shape(t,.004,d) for f,v,d in [(73.416,.6,.22),(146.832,.19,.12),(220.248,.06,.07)])
 elif kind=='wood':
  a=sum(v*np.sin(2*np.pi*f*t)*shape(t,.001,d) for f,v,d in [(196,.32,.052),(527,.09,.027),(933,.03,.016)])+noise(len(t),500,1800)*shape(t,.001,.012)*.1
 a*=np.minimum(1,(dur-t)/.015).clip(0,1)
 return a

def place(target,frame,kind,amp,pan=0,dur=.45):
 a=body(kind,dur)*amp;start=round(frame*SR/FPS)
 # Equal-power pan; subtle short room reflection, not stereo widening/phase trick.
 y=np.column_stack([a*np.sqrt((1-pan)/2),a*np.sqrt((1+pan)/2)])
 k=min(len(y),N-start);target[start:start+k]+=y[:k]
 delay=round(.021*SR);k=min(len(y),N-start-delay)
 if k>0:target[start+delay:start+delay+k]+=.065*y[:k,::-1]

cues=[]
def cue(frame,event,kind,amp,pan=0,dur=.45):
 cues.append(dict(frame=frame,sample=frame*1600,event=event,kind=kind,gain=amp,pan=pan,duration_seconds=dur))
 place(sfx,frame,kind,amp,pan,dur)
# Whoosh is a movement sound, never a substitute impact on an evaded strike.
cue(19,'counter_approach','whoosh',.17,-.12,.21)
cue(26,'body_counter','body',.55,.12)
cue(50,'hand_brace','brace',.48,.25)
cue(105,'low_kick_evaded','whoosh',.28,-.08,.24)
cue(130,'finish_entry','whoosh',.18,.1,.17)
cue(135,'finish_guard','cloth',.20,.15)
cue(143,'shoulder_body','body',.40,.18)
cue(153,'backstep','step',.31,.3)
cue(164,'hand_support','brace',.46,.36)
cue(177,'seated_ground','ground',.69,.38)
# Restrained syncopated wood pulse, dark rounded bass; no melody/beep tones.
for f in [3,21,39,57,75,93,111,129,147,165]:place(music,f,'wood',.13 if f%36==3 else .085,-.25,.22)
for f in [3,39,75,111,147]:place(music,f,'bass',.17,0,.7)
for f in [30,66,102,138,174]:place(music,f,'wood',.055,.25,.15)
# Last impact is left exposed; natural tail and final fade, exact 210-frame endpoint.
fade=np.ones(N);fade[:480]=np.linspace(0,1,480);fade[-12000:]=np.linspace(1,0,12000)
music*=fade[:,None]*3.2;sfx*=fade[:,None]
def write(path,x):
 with wave.open(str(path),'wb') as w:
  w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR)
  w.writeframes(np.rint(np.clip(x,-1,1)*32767).astype('<i2').tobytes())
def measure(path):
 p=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(path),'-af','loudnorm=I=-19:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 return json.loads(re.findall(r'\{[^{}]+\}',p.stderr)[-1])
write(ROOT/'premaster.wav',music+sfx)
pre=measure(ROOT/'premaster.wav')
gain_db=min(-19-float(pre['input_i']),-2.2-float(pre['input_tp']))
gain=10**(gain_db/20)
measurements={}
for name,x in [('music',music),('sfx',sfx),('master',music+sfx),('master-safe',(music+sfx)*10**(-.7/20))]:
 write(ROOT/(name+'.wav'),x*gain);measurements[name]=measure(ROOT/(name+'.wav'))
(ROOT/'premaster.wav').unlink()
measurements.update(dict(gain_db=gain_db,method='FFmpeg loudnorm input integrated EBU R128 and oversampled true peak; PCM master, not AAC output',sample_rate=SR,samples=N,channels=2,duration_seconds=7,seed=6102911))
(ROOT/'measurements.json').write_text(json.dumps(measurements,indent=2)+'\n')
source=ROOT.parent/'src/poses.json'
hashes={'src/poses.json':hashlib.sha256(source.read_bytes()).hexdigest()}
(ROOT/'cues.json').write_text(json.dumps(dict(fps=FPS,total_frames=210,sample_rate=SR,candidate='frozen-authored-poses',source_hashes=hashes,cues=cues),indent=2)+'\n')
public=ROOT.parent/'public/audio';public.mkdir(parents=True,exist_ok=True)
shutil.copy2(ROOT/'master.wav',public/'master.wav')
shutil.copy2(ROOT/'master-safe.wav',public/'master-safe.wav')
(ROOT/'SHA256SUMS').write_text(''.join(hashlib.sha256(p.read_bytes()).hexdigest()+'  '+p.name+'\n' for p in sorted(ROOT.iterdir()) if p.suffix in ['.py','.wav','.json']))
print(json.dumps(measurements,indent=2))
