"""Original 30 s instrumental 'Cloud Laundry'. No samples or third-party score.
Deterministic PCM synthesis; Python 3 + NumPy + SciPy. 80 BPM, ten 4/4 bars.
Run in this directory, producing music.wav, foley.wav and master.wav.
"""
from pathlib import Path
import json, hashlib
import numpy as np
from scipy.signal import butter,sosfilt
from scipy.io import wavfile
SR=48000; DURATION=30; N=SR*DURATION
OUT=Path(__file__).parent
rng=np.random.default_rng(429032)
music=np.zeros((N,2)); foley=np.zeros((N,2))
def add(buf, signal, onset, amp=1.,pan=0.):
 i=int(onset*SR); length=min(len(signal),N-i)
 if length<=0:return
 p=(pan+1)*np.pi/4
 buf[i:i+length,0]+=signal[:length]*amp*np.cos(p)
 buf[i:i+length,1]+=signal[:length]*amp*np.sin(p)
def filt(x,hz,kind='lowpass'):return sosfilt(butter(2,hz,fs=SR,btype=kind,output='sos'),x)
def note(midi,seconds=2.5,vel=1):
 t=np.arange(int(seconds*SR))/SR; f=440*2**((midi-69)/12)
 y=np.zeros_like(t)
 # Rounded tine/felt attack, with high partials damping faster than fundamental.
 for k,a in [(1,1),(2,.24),(3,.095),(4,.035),(5,.013)]:
  y+=a*np.sin(2*np.pi*f*k*(1+0.00012*k*k)*t)*np.exp(-t*(1.45+.65*k))
 y*= (1-np.exp(-t*95))*np.minimum(1,(seconds-t)*20)
 y+=filt(rng.normal(0,1,len(t)),1800)*.025*np.exp(-t*55)
 return y*vel
chords=[[50,57,61,66],[47,54,57,62],[43,50,54,59],[45,52,57,62],
        [47,54,57,62],[43,50,54,59],[50,57,61,66],[45,52,57,64],[43,50,54,59],[50,57,62,66]]
# Rising and settling motifs vary each bar; final cadence is distinct.
melody=[[74,None,78,76],[73,74,69,None],[71,None,74,78],[76,74,73,None],
        [74,78,81,78],[79,78,74,71],[78,None,81,83],[81,78,76,73],[74,71,69,None],[74,None,None,None]]
for bar,chord in enumerate(chords):
 st=bar*3
 for j,pitch in enumerate(chord):
  add(music,note(pitch,4),st+j*.055,.095,(-.25+j/6))
 # Delicate inner harp pulse; thin out ending and first bar.
 for step in range(8 if bar<9 else 3):
  pitch=chord[(step*3)%4]+12
  add(music,note(pitch,2),st+step*.375,.035 if step%2 else .045,(-.45 if step%2 else .45))
 for beat,pitch in enumerate(melody[bar]):
  if pitch is not None:add(music,note(pitch,3.2),st+beat*.75+.08,.14,.12)
 # Slow airy harmonic cushion, lowpassed so not a shrill synth drone.
 length=min(4.8,DURATION-st); t=np.arange(int(length*SR))/SR
 env=np.sin(np.pi*np.minimum(t/length,1))**1.5
 pad=np.zeros_like(t)
 for p in chord[:3]:
  f=440*2**((p+12-69)/12)
  pad+=(np.sin(2*np.pi*f*t+.004*np.sin(2*np.pi*.8*t))+ .22*np.sin(2*np.pi*f*2.001*t))
 add(music,pad*env,st,.013,-.15)
# Atmospheric entrance, not broadband continuous hiss.
t=np.arange(N)/SR
noise=filt(rng.normal(0,1,N),1200); noise=filt(noise,160,'highpass')
wind=np.exp(-((t-3.0)/1.6)**2)+.32*np.exp(-((t-19.6)/1.6)**2)
add(foley,noise*wind,0,.055,-.3)
def drop(time,pitch=950,amp=.06,pan=0):
 t=np.arange(int(.45*SR))/SR
 y=np.sin(2*np.pi*(pitch*t-160*t*t))*np.exp(-t*20)*(1-np.exp(-t*1000))
 y+=.15*np.sin(2*np.pi*pitch*1.48*t)*np.exp(-t*32)
 add(foley,y,time,amp,pan)
# Hoop touch: warm, brief metal resonance with deliberately soft upper partial.
add(foley,note(86,1.3),6.9,.07,-.1)
for time in [8.7,9.1,9.5]:
 tt=np.arange(int(.6*SR))/SR
 rub=filt(rng.normal(0,1,len(tt)),650)*np.sin(np.pi*tt/.6)**2
 add(foley,rub,time-.13,.09,.1)
 for d in [0,.13,.29]:drop(time+.19+d,800+150*rng.random(),.035,rng.uniform(-.3,.3))
drop(12.6,790,.12,.12)
# A little growing figure, rather than explosion/sparkle spam.
for i,p in enumerate([74,78,81]):add(foley,note(p,1.4),13.2+i*.42,.04,-.2+i*.2)
# Fabric unfurl sweep follows 19–21.5 s action.
tt=np.arange(int(2.5*SR))/SR
fabric=filt(rng.normal(0,1,len(tt)),2400); fabric=filt(fabric,300,'highpass')
add(foley,fabric*np.sin(np.pi*tt/2.5)**2*(.7+.3*np.cos(tt*7)),19,.045,.1)
# Wooden pin click, brief filtered noise, no sharp digital impulse.
tt=np.arange(int(.12*SR))/SR
click=filt(rng.normal(0,1,len(tt)),1800)*np.exp(-tt*70)*(1-np.exp(-tt*1500))
add(foley,click,22,.075,.25)
# Light chamber echoes, unequal delays and attenuated high frequencies.
def reverb(buf):
 wet=np.zeros_like(buf)
 for delay,gain in [(.073,.12),(.113,.10),(.191,.07),(.281,.05),(.403,.035)]:
  n=int(delay*SR)
  wet[n:,0]+=filt(buf[:-n,1],2800)*gain
  wet[n:,1]+=filt(buf[:-n,0],2600)*gain
 return buf+wet
music=reverb(music); foley=reverb(foley)
fadein=np.clip((t-.025)/.65,0,1); fadeout=np.clip((29.975-t)/.675,0,1)
env=(fadein*fadeout)**1.5
music*=env[:,None];foley*=env[:,None]
master=music+foley
# Consistent moderate loudness; preserve generous true-peak headroom.
rms=np.sqrt(np.mean(master**2)); scale=.092/rms
peak=np.max(np.abs(master*scale))
if peak>.60:scale*=.60/peak
for name,x in [('music',music),('foley',foley),('master',master)]:
 wavfile.write(OUT/f'{name}.wav',SR,np.round(np.clip(x*scale,-1,1)*32767).astype(np.int16))
metadata={'title':'云朵洗衣店 / Cloud Laundry','duration_seconds':30,'sample_rate':SR,'channels':2,'tempo_bpm':80,'original':True,'source_assets':'None: procedural original composition and synthetic foley','cues':[{'time':2,'end':5,'action':'cloud enters; soft wind'},{'time':6.9,'action':'brass hoop contact'},{'time':8.7,'action':'squeeze and droplets'},{'time':9.1,'action':'squeeze and droplets'},{'time':9.5,'action':'squeeze and droplets'},{'time':12.6,'action':'main droplet lands at sprout'},{'time':13.2,'end':14.6,'action':'sprout growing figure'},{'time':19,'end':21.5,'action':'cloth unfurl'},{'time':22,'action':'wooden clothespin click'},{'time':24,'end':29.3,'action':'warm musical resolution'},{'time':29.3,'end':30,'action':'natural fade to silence'}]}
(OUT/'cues.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2))
print(json.dumps({'duration':DURATION,'peak':float(np.max(np.abs(master*scale))),'rms':float(np.sqrt(np.mean((master*scale)**2))),'sha256':hashlib.sha256((OUT/'master.wav').read_bytes()).hexdigest()},indent=2))
