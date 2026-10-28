#!/usr/bin/env python3
"""Remotion Leaf Duo: original cue-scored 15-second music and synthesized foley.
No samples, pretrained generation, network, external score or paid service.
"""
from pathlib import Path
import hashlib,json,math,re,subprocess,tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile
OUT=Path(__file__).resolve().parent
SR=48000; DURATION=15; N=SR*DURATION; SEED=2810283
rng=np.random.default_rng(SEED)
music=np.zeros((N,2)); effects=np.zeros((N,2)); notes=[]; cues=[]

def hz(m): return 440*2**((m-69)/12)
def ts(d): return np.arange(round(d*SR))/SR

def fade(x,a=.006,r=.05):
    x=x.copy();an=min(len(x),round(a*SR));rn=min(len(x),round(r*SR))
    x[:an]*=np.sin(np.linspace(0,np.pi/2,an))**2
    x[-rn:]*=np.sin(np.linspace(np.pi/2,0,rn))**2
    return x

def filt(x,lo,hi=None):
    return signal.sosfilt(signal.butter(2,[lo,hi] if hi else lo,btype='bandpass' if hi else 'lowpass',fs=SR,output='sos'),x)

def mix(dst,x,start,g=.1,p=0):
    i=round(start*SR); k=min(len(x),N-i)
    if k<=0:return
    # Equal-power pan; close, not an exaggerated headphone effect.
    dst[i:i+k,0]+=x[:k]*g*np.cos((p+1)*np.pi/4)
    dst[i:i+k,1]+=x[:k]*g*np.sin((p+1)*np.pi/4)

def piano(m,d=3.0):
    t=ts(d);f=hz(m);x=np.zeros(len(t))
    # Damped, mildly inharmonic string modes with faster high-partial decay.
    for k,amp in enumerate([1,.43,.21,.095,.042,.018],1):
        fk=f*k*math.sqrt(1+.000035*k*k)
        tau=2.1/(1+.37*(k-1))
        x+=amp*np.cos(2*np.pi*fk*t)*np.exp(-t/tau)
    hammer=filt(rng.standard_normal(len(t)),180,2200)*np.exp(-t/.018)*.022
    return fade((x+hammer)*.65,.012,.22)

def glass(m,d=2.3):
    t=ts(d); f=hz(m)
    x=sum(a*np.sin(2*np.pi*f*k*t)*np.exp(-t/tau) for k,a,tau in [(1,1,1.1),(2.756,.10,.50),(5.404,.025,.20)])
    return fade(x,.008,.3)

def note(t,m,g=.12,p=0,kind='piano',d=3):
    mix(music,glass(m,d) if kind=='glass' else piano(m,d),t,g,p)
    notes.append(dict(time=t,midi=m,kind=kind,gain=g,pan=p))

def pad(t,midis,d,g=.028):
    u=ts(d);x=np.zeros(len(u))
    for j,m in enumerate(midis):
        f=hz(m)
        x+=(np.sin(2*np.pi*f*u+.2*j)+.22*np.sin(2*np.pi*f*2*u+.4))*np.sin(np.pi*np.minimum(1,u/.65)/2)**2
    x/=len(midis)
    mix(music,fade(x,.5,.8),t,g,-.15)
    mix(music,fade(x,.6,.9),t+.025,g,.15)

def drop(t,g,p,description):
    u=ts(.46);f=710+1080*np.exp(-u/.026)
    phase=2*np.pi*np.cumsum(f)/SR
    body=np.sin(phase)*np.exp(-u/.095)
    splash=filt(rng.standard_normal(len(u)),900,6000)*np.exp(-u/.045)*.13
    mix(effects,fade(body+splash,.002,.12),t,g,p)
    cues.append(dict(time=t,kind='water_drop',description=description,duration=.46))

def sparkle(t,m,g,description):
    mix(effects,glass(m,1.7),t,g,.12)
    cues.append(dict(time=t,kind='flower_glass',description=description,midi=m,duration=1.7))

def reverb(x):
    # A small deterministic diffusion network; no repetitive full-volume echo.
    dry=x.copy(); out=x.copy()
    for delay,g,cross in [(.071,.12,False),(.113,.09,True),(.193,.075,False),(.317,.06,True),(.449,.042,False),(.613,.028,True),(.821,.018,False)]:
        n=round(delay*SR);src=dry[:-n,::-1] if cross else dry[:-n]
        out[n:]+=src*g
    return out

def gust(start,d,g,pan,description,center):
    u=ts(d)
    air=filt(rng.standard_normal(len(u)),220,3300)
    # A single swelling gust, not a uniform noise loop. Leaf flutter rides its
    # decay; envelope explicitly follows the airborne gesture.
    env=np.sin(np.pi*u/d)**1.7
    flutter=.75+.25*np.sin(2*np.pi*(5*u+1.8*u*u))
    mix(effects,fade(air*env*flutter,.025,.08),start,g,pan)
    cues.append(dict(time=center,start=start,duration=d,kind='gust',description=description))

def wood(m,d=1.5):
    u=ts(d);f=hz(m)
    x=sum(a*np.sin(2*np.pi*f*k*u)*np.exp(-u/tau) for k,a,tau in [(1,1,.5),(3.98,.16,.12),(9.1,.035,.04)])
    return fade(x,.009,.18)

def woody(t,m,g=.08,p=0):
    mix(music,wood(m),t,g,p)
    notes.append(dict(time=t,midi=m,kind='wood',gain=g,pan=p))

def rustle(t,d,g,p,description):
    u=ts(d);x=filt(rng.standard_normal(len(u)),600,6800)
    env=np.sin(np.pi*u/d)**2*(.65+.35*np.sin(2*np.pi*19*u)**2)
    mix(effects,fade(x*env,.025,.09),t,g,p)
    cues.append(dict(time=t,start=t,duration=d,kind='paper_rustle',description=description))

def harp(m,d=2.5):
    u=ts(d); f=hz(m)
    x=sum((1/k**1.5)*np.sin(2*np.pi*f*k*u+.08*k)*np.exp(-u/(1.8/k**.45)) for k in range(1,9))
    return fade(x,.014,.3)

def pluck(t,m,g=.07,p=0):
    mix(music,harp(m,min(2.5,15-t)),t,g,p)
    notes.append(dict(time=t,midi=m,kind='harp',gain=g,pan=p))

def compose():
    # Different new score in A major: spiral-shaped harp gestures, sparse piano
    # anchor notes and long lower-register warmth; no uniform metronomic bells.
    for t,ch,d,g in [(0,[45,52,59,64],3.95,.07),(3.2,[42,49,57,61],4.05,.07),
                      (6.8,[50,57,61,64],4.5,.08),(10.8,[45,52,61,64],4.2,.075)]:
        pad(t,ch,d,g)
    for t,m,g in [(.1,64,.065),(.65,59,.05),(2.65,68,.06),(3.45,61,.07),
                  (4.6,64,.055),(6.4,69,.06),(7.05,62,.075),(8.8,66,.06),
                  (10.2,64,.045),(11.12,61,.075),(12.1,64,.055),(13.7,59,.048),(14.3,57,.045)]:
        note(t,m,g,.13*math.sin(t),d=min(2.7,15-t))
    for t,m,g,p in [(1.1,57,.045,-.25),(1.36,61,.05,-.1),(1.65,64,.055,.05),(2.02,71,.04,.2),
                     (3.65,69,.04,.2),(4.05,64,.043,0),(5.6,61,.045,-.15),(5.82,64,.05,0),(6.15,69,.045,.15),
                     (7.3,57,.06,-.3),(7.65,62,.06,-.15),(8.0,66,.06,0),(8.3,69,.06,.15),
                     (8.56,73,.055,.3),(8.8,76,.045,.1),(9.1,78,.038,-.1),
                     (11.5,69,.035,.1),(12.8,64,.045,-.1),(13.12,68,.037,.1),(14.3,69,.025,0)]:
        pluck(t,m,g,p)
    note(11.02,81,.012,.2,'glass',2.0)
    drop(.15,.022,-.12,'温室凝露滴落')
    gust(.82,1.6,.06,-.2,'玻璃温室螺旋钻圆窗',1.1)
    drop(3.4,.026,.15,'月门换荷塘：轻水音')
    # Low pass spray supports a near-water pass, never a cartoon whistle.
    rustle(5.6,.65,.035,.22,'叶片低空掠水细碎水雾')
    rustle(7.0,.7,.038,-.2,'秋石庭干叶被卷起')
    gust(7.45,1.9,.085,.12,'绕石灯旋风逐渐上升',8.3)
    gust(8.9,.7,.055,-.15,'上升收束后留停顿',9.1)
    cues.append(dict(time=11.0,kind='harmonic_change',description='冬夜灯笼：玻璃泛音和A大调暖归宿'))
    gust(12.5,.9,.027,.08,'灯笼热气轻托叶片',12.8)
    rustle(14.3,.25,.014,0,'叶片落石台，微弱接触')

def measure(path):
    p=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-20:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    data,_=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):]);return data

def pcm(path,x):
    # temp float32 WAV -> ffmpeg standard 24-bit PCM, with no gain or extra resample.
    tmp=path.with_suffix('.float.wav');wavfile.write(tmp,SR,x.astype(np.float32))
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(tmp),'-c:a','pcm_s24le',str(path)],check=True);tmp.unlink()

def main():
    compose();m=reverb(music);f=reverb(effects)
    envelope=np.ones(N);a=round(.05*SR);r=round(.8*SR)
    envelope[:a]=np.sin(np.linspace(0,np.pi/2,a))**2
    envelope[-r:]=np.cos(np.linspace(0,np.pi/2,r))**2
    m*=envelope[:,None];f*=envelope[:,None]
    raw=m+f;raw-=raw.mean(axis=0)
    raw[0]=0;raw[-1]=0
    tmp=OUT/'normalization-input.wav';pcm(tmp,raw)
    measured=measure(tmp);gain=10**((-20-float(measured['input_i']))/20)
    peak=float(measured['input_tp'])+20*np.log10(gain)
    if peak>-2: gain*=10**((-2-peak)/20)
    pcm(OUT/'master.wav',raw*gain);tmp.unlink()
    pcm(OUT/'music-only.wav',m*gain);pcm(OUT/'foley-only.wav',f*gain)
    final=measure(OUT/'master.wav')
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(OUT/'master.wav'),'-c:a','aac','-b:a','192k',str(OUT/'music.m4a')],check=True)
    for p in [OUT/'master.wav',OUT/'music.m4a']:
        subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(p),'-f','null','-'],check=True)
    manifest={'duration':15,'sampleRate':SR,'seed':SEED,'shots':[{'start':0,'end':3.4,'name':'spring'},{'start':3.4,'end':7.0,'name':'summer'},{'start':7.0,'end':11.0,'name':'autumn'},{'start':11.0,'end':15,'name':'winter'}],'cues':cues,'notes':notes,'score':'New original A-major cinematic greenhouse-to-lantern score. Harp spiral gestures, piano anchors, glass harmonics and warm low pads. New notes, arrangements and shot cues; only synthesis primitives reused. No samples.','end':'Natural instrumental decay with final 0.8-second cos² tail; exact zero endpoints.'}
    (OUT/'audio-cues.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'master.wav',OUT/'music-only.wav',OUT/'foley-only.wav',OUT/'music.m4a']}
    result={'duration':15,'sr':SR,'channels':2,'final_loudnorm':final,'linearGain':gain,'hashes':hashes,'listening':'Not subjectively auditioned; encoding, loudness and waveform checks only.'}
    (OUT/'build-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
