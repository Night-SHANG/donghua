"""Original deterministic action score + foley. No third-party audio samples."""
import json, pathlib, hashlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
ROOT=pathlib.Path(__file__).parent
SR=48000; DURATION=18; N=SR*DURATION
rng=np.random.default_rng(2026102902)

def noise(d,lo=150,hi=5000):
 n=max(2,int(d*SR)); z=rng.normal(0,1,n)
 z=sosfilt(butter(2,[lo,hi],btype='bandpass',fs=SR,output='sos'),z)
 return z/max(.01,np.sqrt(np.mean(z*z)))
def fade(z,a=.004,r=.03):
 z=z.copy(); na=min(len(z),int(a*SR)); nr=min(len(z),int(r*SR))
 if na:z[:na]*=np.linspace(0,1,na)**2
 if nr:z[-nr:]*=np.linspace(1,0,nr)**2
 return z

def put(track,z,when,gain=1,pan=0):
 i=round(when*SR); skip=max(0,-i); i=max(0,i); z=z[skip:min(len(z),N-i+skip)]*gain
 if not len(z):return
 track[i:i+len(z),0]+=z*np.sqrt((1-pan)/2)
 track[i:i+len(z),1]+=z*np.sqrt((1+pan)/2)

def tone(f,d,attack=.005,decay=.2):
 t=np.arange(int(d*SR))/SR
 z=(np.sin(2*np.pi*f*t)+.22*np.sin(2*np.pi*f*2*t)+.08*np.sin(2*np.pi*f*3*t))*np.exp(-t/decay)
 return fade(z,attack,.05)
def kick(d=.23):
 t=np.arange(int(d*SR))/SR
 phase=2*np.pi*(48*t+45*.028*(1-np.exp(-t/.028)))
 return fade(np.sin(phase)*np.exp(-t/.055),.001,.015)
def whoosh(d=.25):
 t=np.arange(int(d*SR))/SR
 z=noise(d,250,4200); env=np.sin(np.pi*t/d)**2.2
 return fade(z*env*(.6+.4*np.sin(2*np.pi*55*t)),.01,.02)
def contact(kind):
 if kind=='control':
  d=.30;t=np.arange(int(d*SR))/SR
  z=np.zeros_like(t)
  for at,f in [(0,660),(.12,880)]:
   u=t-at;env=np.where((u>=0)&(u<.1),np.sin(np.pi*np.clip(u,0,.1)/.1)**2,0)
   z+=.45*np.sin(2*np.pi*f*t)*env
 elif kind in ('door_open','door_close'):
  d=100/60;t=np.arange(int(d*SR))/SR
  env=np.sin(np.pi*t/d)**.8
  direction=1 if kind=='door_open' else -1
  z=(.22*noise(d,65,1350)+.16*np.sin(2*np.pi*(55*t+direction*5*t*t)))*env
 elif kind=='alarm':
  d=.70;t=np.arange(int(d*SR))/SR
  z=.2*np.sin(2*np.pi*(440*t+12/(2*np.pi)*np.sin(2*np.pi*t)))*np.sin(np.pi*t/d)**2
 elif kind=='block':
  d=.18;t=np.arange(int(d*SR))/SR
  z=.62*noise(d,500,4400)*np.exp(-t/.018)+.35*np.sin(2*np.pi*830*t)*np.exp(-t/.024)+.24*np.sin(2*np.pi*190*t)*np.exp(-t/.035)
 elif kind in ('hit','heavy'):
  heavy=kind=='heavy'; d=.42 if heavy else .28;t=np.arange(int(d*SR))/SR
  phase=2*np.pi*((47 if heavy else 68)*t+(100 if heavy else 120)*.022*(1-np.exp(-t/.022)))
  z=.8*np.sin(phase)*np.exp(-t/(.10 if heavy else .065))+.45*noise(d,180,3800)*np.exp(-t/.028)
  z+=.08*noise(d,900,6000)*np.exp(-t/.08)
 elif kind in ('metal','door','wall'):
  d=.75 if kind=='metal' else .42;t=np.arange(int(d*SR))/SR
  z=.5*noise(d,150,3400)*np.exp(-t/.025)
  for f,g,tau in [(131,.45,.075),(293,.18,.15),(521,.12,.23),(867,.055,.16),(1337,.035,.12)]:
   z+=g*np.sin(2*np.pi*f*t)*np.exp(-t/tau)
  if kind=='wall':z+=.30*noise(d,80,1000)*np.exp(-t/.09)
 elif kind=='land':
  d=.30;t=np.arange(int(d*SR))/SR
  z=.55*noise(d,90,2100)*np.exp(-t/.04)+.5*np.sin(2*np.pi*(61*t+1.5*(1-np.exp(-t/.03))))*np.exp(-t/.075)
 elif kind in ('slide','roll'):
  d=.45 if kind=='slide' else .65;t=np.arange(int(d*SR))/SR
  z=.45*noise(d,180,2300)*np.sin(np.pi*t/d)**.8*(.75+.25*np.sin(2*np.pi*19*t))
 else:
  d=.13;t=np.arange(int(d*SR))/SR
  z=.35*noise(d,120,2000)*np.exp(-t/.025)
 return fade(z,.001,.025)

def main():
 global DURATION,N
 cues=json.loads((ROOT/'cues.json').read_text(encoding='utf8'))
 DURATION=float(cues['duration']);N=round(SR*DURATION)
 assert cues['fps'] in (24,30,60) and 10<=DURATION<=30
 music=np.zeros((N,2),dtype=np.float64);foley=np.zeros_like(music)
 # New original E-minor percussive score: brief tension, rhythmic duel, resolved tail.
 action_start=cues.get('music_action_start',1.5);action_end=cues.get('music_action_end',DURATION-2.0)
 beat=.5
 bassline=[82.407,82.407,97.999,73.416,82.407,110,97.999,73.416]
 k=0;at=action_start
 while at<action_end:
  if k%2==0:put(music,kick(),at,.16,0)
  if k%4==2:
   t=np.arange(int(.16*SR))/SR
   drum=noise(.16,380,4300)*np.exp(-t/.028)+.4*np.sin(2*np.pi*185*t)*np.exp(-t/.045)
   put(music,fade(drum,.001,.025),at,.055,-.08)
  if k%2==1:
   t=np.arange(int(.065*SR))/SR
   put(music,fade(noise(.065,2300,6800)*np.exp(-t/.012),.001,.015),at,.014,.25)
  if k%2==0:put(music,tone(bassline[(k//2)%len(bassline)],.48,.008,.13),at,.12,-.02)
  if k%4==1:
   f=[329.628,391.995,493.883,440][(k//4)%4]
   z=tone(f,.65,.008,.14)
   put(music,z,at,.035,(-.22 if k%8<4 else .22));put(music,z,at+.12,.008,.22)
  k+=1;at=action_start+k*beat
 # Sparse lead-in pulses make an entrance; no endless drone or constant impact wash.
 for at in [.35,.9]:put(music,tone(82.407,.7,.04,.23),at,.065,-.03)
 t=np.arange(N)/SR
 bed_env=np.minimum(t/.8,1)*np.minimum((DURATION-t)/1.5,1)
 for f,pan in [(164.814,-.3),(246.942,.3)]:
  z=(np.sin(2*np.pi*f*t)+.1*np.sin(2*np.pi*f*2*t))*bed_env
  put(music,z,0,.008,pan)
 # Deliberate ending cadence, allowed to decay as the characters recover.
 for f,g in [(82.407,.16),(164.814,.055),(246.942,.025),(329.628,.03)]:
  put(music,tone(f,1.8,.015,.38),action_end,g,0)
 for e in cues['events']:
  assert abs(e['time']-e['frame']/cues['fps'])<1e-8
  kind=e['kind'];at=e['time'];pan=e.get('pan',0);gain=e.get('gain',1)
  if kind=='whoosh':z=whoosh(e.get('duration',.23));base=.19
  else:z=contact(kind);base={'block':.27,'hit':.36,'heavy':.58,'land':.30,'slide':.16,'roll':.15,'step':.13,'metal':.32,'door':.28,'wall':.40,'control':.18,'door_open':.18,'door_close':.18,'alarm':.16}.get(kind,.13)
  put(foley,z,at,base*gain,pan)
  if kind in ('block','hit','heavy','land','metal','door','wall'):
   put(foley,z,at+.038,base*gain*.065,-pan)
   a=max(0,int((at-.02)*SR));b=min(N,int((at+.23)*SR));u=np.arange(b-a)/SR
   music[a:b]*=(1-.6*np.exp(-u/.085))[:,None]
 fadein=np.minimum(np.arange(N)/(SR*.08),1);fadeout=np.minimum((N-1-np.arange(N))/(SR*.42),1)
 env=np.maximum(0,fadein*fadeout);music*=env[:,None];foley*=env[:,None]
 for tr in (music,foley):tr[:240]=0;tr[-240:]=0
 master=music+foley
 magnitude=np.max(np.abs(master),axis=1);reduction=np.tanh(magnitude*6)/(magnitude*6+1e-12)
 music*=reduction[:,None];foley*=reduction[:,None];master=music+foley
 rms=np.sqrt(np.mean(master**2));peak=np.max(np.abs(master));gain=min(.089/max(rms,1e-9),.78/max(peak,1e-9))
 for name,tr in [('master',master),('music',music),('foley',foley)]:
  y=np.clip(tr*gain,-.999,.999);wavfile.write(ROOT/(name+'.wav'),SR,np.round(y*32767).astype(np.int16))
 meta={'duration':DURATION,'sample_rate':SR,'channels':2,'gain':float(gain),'rms':float(np.sqrt(np.mean((master*gain)**2))),'peak':float(np.max(np.abs(master*gain))),'sha256':hashlib.sha256((ROOT/'master.wav').read_bytes()).hexdigest()}
 (ROOT/'generation.json').write_text(json.dumps(meta,indent=2)+'\n');print(json.dumps(meta))
if __name__=='__main__':main()
