#!/usr/bin/env python3
"""Four Seasons Leaf: original continuous 15-second piano, glass and wind.
No samples, pretrained generation, network, external score or paid service.
"""
from pathlib import Path
import hashlib,json,math,re,subprocess,tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile
OUT=Path(__file__).resolve().parent
SR=48000; DURATION=15; N=SR*DURATION; SEED=281015
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
    # One through-composed E-major pentatonic line. Season boundaries never
    # restart the pulse, stop the bed, or hard-switch timbre.
    for start,chord,d,g in [(0,[52,59,63,66],5.1,.052),
                            (3.1,[49,56,59,64],5.1,.05),
                            (6.7,[45,52,59,61],5.2,.05),
                            (10.3,[52,59,63,68],4.7,.046)]:
        pad(start,chord,d,g)
    # Gentle 160 ms humanized phrase offsets; soft arpeggio always overlaps
    # predecessor decay, rather than separate four mini-jingles.
    pitches=[64,68,71,68,66,64,63,66,68,71,73,71,68,66,64,63,61,64,66,68,71,68,66,64,68,71,76]
    for i,m in enumerate(pitches):
        t=.12+i*.48+(.018 if i%3==1 else -.012 if i%3==2 else 0)
        gain=.093+.021*(.5+.5*math.sin(i*.81))
        note(t,m,gain,.22*math.sin(i*.44),d=min(3.1,15-t))
    for t,m in [(.08,52),(2.48,59),(4.88,49),(7.28,45),(9.68,52),(12.08,52)]:
        note(t,m,.062,-.13,d=min(3.5,15-t))
    # Sparse glass notes connect the rising phrase; no impact-like scene ticks.
    for t,m,g in [(1.56,83,.014),(5.38,85,.016),(9.22,80,.017),(12.72,88,.018)]:
        note(t,m,g,.24,'glass',min(2.3,15-t))
    u=ts(15)
    # Continuous band-limited breath with independent slow stereo drift. 
    # A tonal whistling oscillator is deliberately absent.
    wind=filt(rng.standard_normal(N),180,2100)
    amp=.72+.16*np.sin(2*np.pi*.17*u)+.10*np.sin(2*np.pi*.31*u+.8)
    base=fade(wind*amp,.65,1.4)
    mix(effects,base,0,.011,-.35)
    mix(effects,fade(filt(rng.standard_normal(N),300,2600)*amp,.8,1.4),0,.007,.35)
    for t,g,desc in [(3.75,.016,'春夏遮挡转场的柔风'),(7.5,.017,'夏秋转场的叶片轻响'),(11.25,.014,'秋冬转场的轻雪气流')]:
        u=ts(1.45); flutter=filt(rng.standard_normal(len(u)),700,4800)
        flutter*=.7+.3*np.sin(2*np.pi*7*u)*np.exp(-u/.8)
        mix(effects,fade(flutter,.52,.7),t-.55,g,.18*math.sin(t))
        cues.append(dict(time=t,kind='continuous_wind_swell',description=desc,duration=1.45,start=t-.55))
    cues.append(dict(time=14.2,kind='tail',description='旋律自然衰减，持续风声收尾',duration=.8))

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
    manifest={'duration':15,'sampleRate':SR,'seed':SEED,'shots':[{'start':0,'end':3.75,'name':'spring'},{'start':3.75,'end':7.5,'name':'summer'},{'start':7.5,'end':11.25,'name':'autumn'},{'start':11.25,'end':15,'name':'winter'}],'cues':cues,'notes':notes,'score':'Original continuous E-major pentatonic phrase, overlapping modal piano, soft glass and synthesized wind; no samples.','end':'Natural instrumental decay with final 0.8-second cos² tail; exact zero endpoints.'}
    (OUT/'audio-cues.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'master.wav',OUT/'music-only.wav',OUT/'foley-only.wav',OUT/'music.m4a']}
    result={'duration':15,'sr':SR,'channels':2,'final_loudnorm':final,'linearGain':gain,'hashes':hashes,'listening':'Not subjectively auditioned; encoding, loudness and waveform checks only.'}
    (OUT/'build-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
