#!/usr/bin/env python3
"""Rain Garden: original 15-second miniature, modal piano, glass and water.
No samples, pretrained generation, network, external score or paid service.
"""
from pathlib import Path
import hashlib,json,math,re,subprocess,tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile
OUT=Path(__file__).resolve().parent
SR=48000; DURATION=15; N=SR*DURATION; SEED=271028
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

def compose():
    # D-major / B-minor pentatonic melody: irregular phrase, space for the water.
    # Soft low voicings never overpower the crystal melody or become a metronome.
    pad(0,[50,57,61,64],4.1,.055)
    pad(3.7,[47,54,57,62],3.7,.050)
    pad(7.0,[43,50,57,59],4.3,.054)
    pad(10.9,[50,57,61,66],4.1,.045)
    for t,m,g,p in [(0.15,62,.16,-.20),(.72,66,.12,.05),(1.48,69,.14,.18),(2.35,64,.10,-.08),
                    (4.42,66,.13,.12),(5.17,62,.10,-.10),(6.12,69,.115,.20),
                    (7.18,67,.13,-.12),(8.28,69,.13,.05),(9.38,71,.12,.18),
                    (10.45,69,.10,.10),(11.18,66,.11,-.10),(12.20,74,.095,.12),(12.85,69,.065,-.08)]:
        note(t,m,g,p,d=min(3.4,15-t))
    for t,m in [(.12,50),(3.85,47),(7.05,43),(11.05,50)]: note(t,m,.095,-.1,d=3.4)
    for t,m in [(.45,57),(4.65,54),(7.75,59),(11.65,61)]: note(t,m,.055,.1,d=2.6)
    note(1.10,81,.028,.22,'glass',2.0)
    # No literal tick at detach; a tiny air movement leads into the water impact.
    u=ts(.65);air=filt(rng.standard_normal(len(u)),500,2300)
    mix(effects,fade(air,.22,.20),2.8,.010,-.10)
    cues.append(dict(time=2.8,kind='air',description='露珠脱离叶尖，轻柔气流',duration=.65))
    drop(3.8,.10,0,'主水滴触池，精确触水点')
    drop(4.05,.033,.08,'小回弹水珠再落')
    # Soft, filtered water wash begins with the first expanding ring.
    u=ts(2.0);wash=filt(rng.standard_normal(len(u)),180,1400)
    mix(effects,fade(wash,.12,.9),3.81,.012,0)
    for t,m,g in [(7.2,79,.030),(8.3,81,.031),(9.4,83,.032)]:
        sparkle(t,m,g,'睡莲依次展开的轻玻璃泛音')
    sparkle(12.2,86,.025,'拉远浮岛的柔和高音')
    # Barely audible organic ambience, not a stock audio bed.
    u=ts(15);wind=filt(rng.standard_normal(N),1700)*(.8+.2*np.sin(2*np.pi*.11*u))
    mix(effects,fade(wind,1.0,1.0),0,.0025,0)

def measure(path):
    p=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-20:TP=-2:LRA=11:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    data,_=json.JSONDecoder().raw_decode(p.stderr[p.stderr.rfind('{'):]);return data

def pcm(path,x):
    # temp float32 WAV -> ffmpeg standard 24-bit PCM, with no gain or extra resample.
    tmp=path.with_suffix('.float.wav');wavfile.write(tmp,SR,x.astype(np.float32))
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(tmp),'-c:a','pcm_s24le',str(path)],check=True);tmp.unlink()

def main():
    compose();m=reverb(music);f=reverb(effects)
    envelope=np.ones(N);a=round(.05*SR);r=round(1.0*SR)
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
    manifest={'duration':15,'sampleRate':SR,'seed':SEED,'shots':[{'start':0,'end':3.8,'name':'dew'},{'start':3.8,'end':7,'name':'ripple'},{'start':7,'end':11,'name':'bloom'},{'start':11,'end':15,'name':'island'}],'cues':cues,'notes':notes,'score':'Original D-major/B-minor pentatonic miniature; modal felt-piano and glass synthesis, no samples.','end':'Natural instrumental decay with final one-second cos² tail; exact zero endpoints.'}
    (OUT/'audio-cues.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'master.wav',OUT/'music-only.wav',OUT/'foley-only.wav',OUT/'music.m4a']}
    result={'duration':15,'sr':SR,'channels':2,'final_loudnorm':final,'linearGain':gain,'hashes':hashes,'listening':'Not subjectively auditioned; encoding, loudness and waveform checks only.'}
    (OUT/'build-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
