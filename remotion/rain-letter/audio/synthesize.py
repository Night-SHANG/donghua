#!/usr/bin/env python3
"""Original deterministic thirty-second score; no samples or looped sections."""
from pathlib import Path
import json, subprocess, re, hashlib
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
ROOT=Path(__file__).resolve().parent
SR=48000; DURATION=30; N=SR*DURATION
rng=np.random.default_rng(731904)
music=np.zeros((N,2),np.float64); foley=np.zeros_like(music)
def add(bus, sound, start, gain=1, pan=0):
    i=round(start*SR); j=min(N,i+len(sound)); sound=sound[:j-i]*gain
    if i<0 or j<=i:return
    bus[i:j,0]+=sound*np.sqrt((1-pan)/2);bus[i:j,1]+=sound*np.sqrt((1+pan)/2)
def hz(m):return 440*2**((m-69)/12)
def note(m,length=3,kind='piano'):
    t=np.arange(round(length*SR))/SR; f=hz(m); y=np.zeros_like(t)
    if kind=='piano':
        for k,a in enumerate([1,.42,.18,.09,.035],1):y+=a*np.sin(2*np.pi*f*k*(1+0.00012*k*k)*t)*np.exp(-t*(.85+k*.24))
        y*=1-np.exp(-t*140)
    elif kind=='wood':
        for ratio,a,decay in [(1,1,4),(2.76,.23,9),(5.4,.05,15)]:y+=a*np.sin(2*np.pi*f*ratio*t)*np.exp(-decay*t)
        y*=1-np.exp(-t*350)
    else:
        y=(np.sin(2*np.pi*f*t)+.16*np.sin(2*np.pi*f*2*t))*(.98+.02*np.sin(2*np.pi*3.1*t))
        y*=np.minimum(t/.8,1)*np.minimum((length-t)/1.7,1)
    return y*np.minimum((length-t)/.08,1)
def noise(length,low,high):
    x=rng.normal(0,1,round(length*SR));return sosfilt(butter(2,[low,high],btype='bandpass',fs=SR,output='sos'),x)
def sweep(start,length,gain,pan=0):
    t=np.arange(round(length*SR))/SR; env=np.sin(np.pi*t/length)**2
    add(foley,noise(length,900,6500)*env,start,gain,pan)
def droplet(start,m=85,gain=.08):
    t=np.arange(round(.65*SR))/SR
    y=np.sin(2*np.pi*hz(m)*(t+.055*(1-np.exp(-t*22))))*np.exp(-t*13)*(1-np.exp(-t*300))
    add(foley,y,start,gain,-.1)
# Through-composed harmonic progression, 5-second scene phrases. Upper voices warm.
chords=[[50,57,60,64],[46,53,57,60],[41,53,57,64],[48,55,62,64],[41,57,60,67],[41,57,62,65]]
for scene,chord in enumerate(chords):
    start=scene*5
    for k,m in enumerate(chord):
        add(music,note(m,5.7,'harmonic'),start,.022 if scene<4 else .03,(k-1.5)*.35)
        add(music,note(m,3.5),start+.14+k*.24,.12 if k==0 else .065,(k-1.5)*.3)
# Asymmetric melody, held notes, rests around visual reveals. No 15-second repetition.
melody=[(.8,69,.12),(2.1,72,.105),(3.1,76,.085),(5.6,72,.10),(6.9,69,.095),(8.1,65,.08),(10.5,67,.1),(11.3,69,.085),(12.3,72,.12),(14,76,.075),(15.5,74,.095),(17.3,72,.10),(18.1,79,.085),(20.4,77,.12),(21.8,76,.10),(23.3,72,.095),(25.2,69,.08),(26.5,65,.08),(27.5,72,.055)]
for start,m,gain in melody:add(music,note(m,3.4),start,gain,.12*np.sin(start))
for start,m in [(8.8,77),(12.15,81),(19.1,79),(27.5,84)]:add(music,note(m,1.8,'wood'),start,.032,.3)
# Continuous stereo rain with a gradual daylight retreat, rather than repeated sample.
t=np.arange(N)/SR
rainenv=np.interp(t,[0,.5,15,19,23,27,28,30],[0,.045,.041,.029,.009,.003,.001,0])
for channel in range(2):foley[:,channel]+=noise(30,650,10000)*rainenv
for start in rng.uniform(.2,21,85):
    length=rng.uniform(.025,.075); q=np.arange(round(length*SR))/SR
    add(foley,noise(length,2000,11000)*np.exp(-q*90),start,.018,rng.uniform(-.9,.9))
droplet(3.6,87,.11)
# Flow along ink and paper fold / unfold texture.
sweep(5.3,2.5,.022,-.25)
sweep(8.8,.32,.045,.25)
for start,length in [(10.4,.4),(10.95,.5),(11.65,.55)]:sweep(start,length,.052,.15)
droplet(16.8,83,.10)
for start,length in [(17.2,.6),(17.85,.7),(18.6,.6)]:sweep(start,length,.035,-.1)
sweep(22.1,1.6,.012,.25);sweep(26.4,.6,.028,.15)
# Small room reflections, short enough to preserve visual cue precision.
for bus in [music,foley]:
    dry=bus.copy()
    for delay,gain in [(.071,.14),(.137,.10),(.229,.065),(.389,.04)]:
        n=round(delay*SR);bus[n:]+=dry[:-n,::-1]*gain
# Gentle opening and final two-second decay, no abrupt last-frame truncation.
fade=np.minimum(t/.12,1)*np.where(t>28,np.cos(np.minimum((t-28)/2,1)*np.pi/2)**2,1)
mix=(music+foley)*fade[:,None]
raw=ROOT/'_raw.wav';wavfile.write(raw,SR,mix.astype(np.float32))
def measure(path):
    p=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-20:TP=-2:LRA=12:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    return json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}',p.stderr,re.S)[-1])
a=measure(raw); gain=-20-float(a['input_i'])
subprocess.run(['ffmpeg','-y','-v','error','-i',str(raw),'-af',f'volume={gain:.6f}dB','-ar',str(SR),'-ac','2','-c:a','pcm_s24le',str(ROOT/'master.wav')],check=True)
raw.unlink();b=measure(ROOT/'master.wav')
report={'sample_rate':SR,'duration_seconds':DURATION,'channels':2,'codec':'pcm_s24le','seed':731904,'gain_db':gain,'integrated_lufs':float(b['input_i']),'true_peak_dbtp':float(b['input_tp']),'lra':float(b['input_lra']),'sha256':hashlib.sha256((ROOT/'master.wav').read_bytes()).hexdigest(),'listening_review':'Not performed; objective measurements only.'}
(ROOT/'qa.json').write_text(json.dumps(report,indent=2)+'\n')
print(json.dumps(report,indent=2))
