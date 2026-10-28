"""Original deterministic music and foley. One shared cue file; no external samples."""
import json, math, wave
from pathlib import Path
import numpy as np
ROOT=Path(__file__).resolve().parents[2]
C=json.loads((ROOT/'film/teapot/cues.json').read_text()); SR=48000; D=C['duration']; N=int(D*SR)
rng=np.random.default_rng(731); music=np.zeros((N,2)); sfx=np.zeros((N,2)); events={e['id']:e['t'] for e in C['events']}
def put(bus,t,s,gain=1,pan=0):
 i=round(t*SR); a=max(0,i); b=min(N,i+len(s))
 if b<=a:return
 sig=s[a-i:b-i]*gain; bus[a:b,0]+=sig*math.sqrt((1-pan)/2);bus[a:b,1]+=sig*math.sqrt((1+pan)/2)
def tone(freq,d,kind='pluck'):
 t=np.arange(round(d*SR))/SR
 if kind=='pad':env=np.sin(np.pi*np.minimum(t/d,1))**1.5; sig=np.sin(2*np.pi*freq*t)+.15*np.sin(2*np.pi*freq*2*t)
 else:env=(1-np.exp(-t*170))*np.exp(-t*(8 if kind=='pluck' else 4));sig=np.sin(2*np.pi*freq*t)+.2*np.sin(2*np.pi*freq*2.01*t)+.1*np.sin(2*np.pi*freq*3.9*t)
 return sig*env
# A gentle continuous warm bed, not silence between score notes.
for start,f in [(0,174.61),(3.5,196),(7,164.81),(10.5,174.61)]:
 for ratio in [1,1.25,1.5]:put(music,start,tone(f*ratio,3.5,'pad'),.026,0)
melody=[349.23,440,523.25,440,392,440,587.33,523.25,440,349.23,329.63,392,440,349.23]
for k,f in enumerate(melody):
 put(music,k*.5+.2,tone(f,.8),.12,(-1)**k*.18)
# Float phrase climbs, sudden pop breaks the run; landing gets a low soft accent.
for t,f in [(4,523.25),(4.5,587.33),(5,659.25),(5.5,698.46),(6,783.99),(7.65,130.81),(8.25,261.63),(9,349.23),(10,440),(11,523.25),(11.5,440),(12,349.23),(12.5,698.46),(13,523.25)]:put(music,t,tone(f,.9),.11)
for e in C['events']:
 t=e['t'];id=e['id'];d=.22
 if id in ['inhale','blow','fall','strain','close']:
  d={'inhale':.6,'blow':1.05,'fall':.7,'strain':.35,'close':.75}[id]; x=np.arange(round(d*SR))/SR
  noise=rng.normal(0,1,len(x));smooth=np.convolve(noise,np.ones(11)/11,mode='same')
  sig=smooth*np.sin(np.pi*x/d)**2*.28
  if id in ['blow','strain']:sig+=.07*np.sin(2*np.pi*(260*x+220*x*x/d))*np.sin(np.pi*x/d)**2
 elif 'pop' in id:
  d=.18 if id=='small_pop' else .35;x=np.arange(round(d*SR))/SR;f=1050 if id=='small_pop' else 250
  sig=(np.sin(2*np.pi*(f*x-0.35*f*x*x/d))*.5+rng.normal(0,1,len(x))*.09)*np.exp(-x*28)*(1-np.exp(-x*1200))
 elif id in ['land','lid']:
  d=.45; x=np.arange(round(d*SR))/SR;f=180 if id=='land' else 780
  sig=(np.sin(2*np.pi*f*x)+.45*np.sin(2*np.pi*f*2.71*x))*np.exp(-x*(16 if id=='land' else 10))*(1-np.exp(-x*900))*.3
 else:
  f={'small_release':700,'proud':880,'lift':620,'height_notice':370,'paddle':260,'dazed':280,'hiccup':480,'flinch':340,'relief':660,'crown':1100}[id]
  sig=tone(f,.4,'bell')*.23
 put(sfx,t,sig,1,0.1)
 if id=='lid':put(sfx,t+.14,tone(1040,.22,'bell'),.12,-.08)
# Foley foreground; music underscored beneath key hits.
for t in [events[k] for k in ["big_pop","land","lid","hiccup","crown"]]:
 a=max(0,int((t-.03)*SR));b=min(N,int((t+.3)*SR));music[a:b]*=.65
mix=music*.72+sfx
fade=int(.04*SR);mix[:fade]*=np.linspace(0,1,fade)[:,None];mix[-fade:]*=np.linspace(1,0,fade)[:,None]
peak=np.max(np.abs(mix));gain=.8/max(peak,1e-9);mix*=gain
out=ROOT/'film/teapot/audio';out.mkdir(parents=True,exist_ok=True)
def wav(path,arr):
 with wave.open(str(path),'wb') as w:w.setnchannels(2);w.setsampwidth(2);w.setframerate(SR);w.writeframes(np.clip(arr*32767,-32768,32767).astype('<i2').tobytes())
wav(out/'mix.wav',mix)
(out/'audio-build.json').write_text(json.dumps({'duration':D,'sample_rate':SR,'channels':2,'sample_frames':N,'sample_peak':float(np.max(np.abs(mix))),'source':'original deterministic synthesis','events':C['events'],'human_audition':False},indent=2))
print(out/'mix.wav')
