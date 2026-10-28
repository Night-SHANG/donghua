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
SR=48000; DURATION=15; N=SR*DURATION; SEED=2810282
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

def compose():
    # New F-major miniature: asymmetrical phrases with intentional breathing.
    # Spring compressed anticipation, summer spacious arc, autumn warmer open
    # voicing, winter an unresolved added-sixth that becomes a gentle homecoming.
    for t,ch,d,g in [(0,[53,60,65,69],4.1,.055),(3.4,[50,57,65,69],4.2,.052),
                      (7.05,[46,53,62,65],4.5,.06),(11.0,[53,60,67,69],4,.05)]:
        pad(t,ch,d,g)
    for t,m,g in [(.15,65,.075),(.72,69,.055),(1.5,72,.09),(1.76,77,.065),
                  (2.65,74,.07),(3.28,72,.055),(3.65,69,.075),(4.5,65,.06),
                  (5.52,69,.078),(5.85,72,.066),(6.34,76,.065),
                  (7.24,70,.085),(8.08,65,.065),(8.65,62,.07),(9.4,65,.08),
                  (9.72,69,.065),(10.18,74,.055),(11.3,72,.065),
                  (12.2,69,.06),(13.0,67,.05),(14.2,65,.048)]:
        note(t,m,g,.2*math.sin(t),d=min(2.4,15-t))
    for t,m,g in [(1.58,81,.028),(3.6,77,.035),(5.65,81,.028),(7.32,77,.032),(9.53,81,.028),(14.2,77,.018)]:
        woody(t,m,g,.15*math.sin(t))
    drop(.8,.024,-.18,'雨滴压弯叶面：克制水滴')
    gust(1.24,.65,.065,-.2,'叶片回弹，花瓣围绕',1.5)
    drop(3.6,.025,.18,'圆形涟漪iris接池塘')
    gust(5.2,1.12,.064,.2,'蜻蜓掠风，螺旋上升',5.5)
    cues.append(dict(time=7.2,kind='harmonic_change',description='秋：降B暖和弦，不加硬切声'))
    rustle(9.4,.95,.064,-.1,'翻页托起叶子：纸面轻擦')
    gust(10.92,.85,.05,.08,'白色翻页擦镜进入雪园',11.2)
    gust(12.0,1.4,.025,-.12,'冬：微弱上升气流',12.6)
    rustle(14.2,.23,.012,0,'结霜叶片轻触初芽')

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
    manifest={'duration':15,'sampleRate':SR,'seed':SEED,'shots':[{'start':0,'end':3.6,'name':'spring'},{'start':3.6,'end':7.2,'name':'summer'},{'start':7.2,'end':11.2,'name':'autumn'},{'start':11.2,'end':15,'name':'winter'}],'cues':cues,'notes':notes,'score':'New original F-major paper-garden miniature, piano, woody resonators and soft pads. Rain pressure and rebound, pond arc, floating-book page lift, frost-to-bud landing. No samples. Reused synthesis primitives, newly composed notes and cues.','end':'Natural instrumental decay with final 0.8-second cos² tail; exact zero endpoints.'}
    (OUT/'audio-cues.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'master.wav',OUT/'music-only.wav',OUT/'foley-only.wav',OUT/'music.m4a']}
    result={'duration':15,'sr':SR,'channels':2,'final_loudnorm':final,'linearGain':gain,'hashes':hashes,'listening':'Not subjectively auditioned; encoding, loudness and waveform checks only.'}
    (OUT/'build-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
