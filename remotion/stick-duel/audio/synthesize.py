"""Original deterministic action score + foley. No third-party audio samples."""
import json, pathlib, hashlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
ROOT=pathlib.Path(__file__).parent
SR=48000; DURATION=12; N=SR*DURATION
rng=np.random.default_rng(20261029)

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
 if kind=='block':
  d=.18;t=np.arange(int(d*SR))/SR
  z=.62*noise(d,500,4400)*np.exp(-t/.018)+.35*np.sin(2*np.pi*830*t)*np.exp(-t/.024)+.24*np.sin(2*np.pi*190*t)*np.exp(-t/.035)
 elif kind in ('hit','heavy'):
  heavy=kind=='heavy'; d=.42 if heavy else .28;t=np.arange(int(d*SR))/SR
  phase=2*np.pi*((47 if heavy else 68)*t+(100 if heavy else 120)*.022*(1-np.exp(-t/.022)))
  z=.8*np.sin(phase)*np.exp(-t/(.10 if heavy else .065))+.45*noise(d,180,3800)*np.exp(-t/.028)
  z+=.08*noise(d,900,6000)*np.exp(-t/.08)
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
 cues=json.loads((ROOT/'cues.json').read_text(encoding='utf8'))
 assert cues['fps']==60 and cues['duration']==12
 music=np.zeros((N,2),dtype=np.float64); foley=np.zeros_like(music)
 # Restrained original D-minor pulse, bass/pluck/drum motif. Not copied reference music.
 beat=.5
 for k in range(22):
  at=.15+k*beat
  if k%2==0:put(music,kick(),at,.15,0)
  if k%4==2:
   t=np.arange(int(.12*SR))/SR; put(music,fade(noise(.12,800,5800)*np.exp(-t/.025),.001,.02),at,.055,-.12)
  if k%2==1:
   t=np.arange(int(.06*SR))/SR;put(music,fade(noise(.06,2300,8000)*np.exp(-t/.01),.001,.015),at,.018,.3)
  bass=[73.416,73.416,65.406,87.307][(k//4)%4]
  if k%2==0:put(music,tone(bass,.5,.012,.16),at,.13,-.04)
 for j,(at,f) in enumerate([(0.4,293.665),(1.4,349.228),(2.4,440),(3.15,349.228),(4.4,261.626),(5.4,293.665),(6.4,349.228),(7.4,440),(8.4,523.251),(9.15,440),(10.15,349.228),(10.9,293.665)]):
  z=tone(f,.7,.01,.19)
  put(music,z,at,.055,(-.3 if j%2 else .3));put(music,z,at+.16,.012,(-.3 if not j%2 else .3))
 # Quiet atmospheric harmonic bed with no large transient at frame zero.
 t=np.arange(N)/SR
 for f,p in [(146.832,-.3),(220,.3),(293.665,0)]:
  z=np.sin(2*np.pi*f*t+.002*np.sin(2*np.pi*.31*t))*np.sin(np.pi*np.minimum(t/12,1))**1.5
  put(music,z,0,.009,p)
 for e in cues['events']:
  assert abs(e['time']-e['frame']/60)<1e-8
  kind=e['kind'];at=e['time'];pan=e.get('pan',0);gain=e.get('gain',1)
  if kind=='whoosh':z=whoosh(e.get('duration',.24));base=.20
  else:z=contact(kind);base={'block':.27,'hit':.36,'heavy':.58,'land':.30,'slide':.16,'roll':.15,'step':.13}.get(kind,.13)
  put(foley,z,at,base*gain,pan)
  if kind in ('block','hit','heavy','land'):
   put(foley,z,at+.035,base*gain*.07,-pan)
   a=max(0,int((at-.02)*SR));b=min(N,int((at+.20)*SR));u=np.arange(b-a)/SR
   music[a:b]*=(1-.55*np.exp(-u/.08))[:,None]
 # Fade musical start/end; preserve complete last recovery foley tail.
 fadein=np.minimum(np.arange(N)/(SR*.10),1);fadeout=np.minimum((N-1-np.arange(N))/(SR*.38),1)
 env=np.maximum(0,fadein*fadeout);music*=env[:,None];foley*=env[:,None]
 for tr in (music,foley):tr[:240]=0;tr[-240:]=0
 master=music+foley
 # Soft shared bus saturation controls isolated impact peaks without flattening stereo.
 magnitude=np.max(np.abs(master),axis=1)
 reduction=np.tanh(magnitude*6)/(magnitude*6+1e-12)
 music*=reduction[:,None];foley*=reduction[:,None];master=music+foley
 rms=np.sqrt(np.mean(master**2)); peak=np.max(np.abs(master)); gain=min(.089/max(rms,1e-9),.82/max(peak,1e-9))
 for name,tr in [('master',master),('music',music),('foley',foley)]:
  y=np.clip(tr*gain,-.999,.999);wavfile.write(ROOT/(name+'.wav'),SR,np.round(y*32767).astype(np.int16))
 meta={'duration':12,'sample_rate':SR,'channels':2,'gain':float(gain),'rms':float(np.sqrt(np.mean((master*gain)**2))),'peak':float(np.max(np.abs(master*gain))),'sha256':hashlib.sha256((ROOT/'master.wav').read_bytes()).hexdigest()}
 (ROOT/'generation.json').write_text(json.dumps(meta,indent=2)+'\n')
 print(json.dumps(meta))
if __name__=='__main__':main()
