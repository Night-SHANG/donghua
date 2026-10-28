#!/usr/bin/env python3
"""Wind Leaf Montage: original gesture-scored 15-second piano, glass and wind.
No samples, pretrained generation, network, external score or paid service.
"""
from pathlib import Path
import hashlib,json,math,re,subprocess,tempfile
import numpy as np
from scipy import signal
from scipy.io import wavfile
OUT=Path(__file__).resolve().parent
SR=48000; DURATION=15; N=SR*DURATION; SEED=281017
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

def compose():
    # Four distinct phrases share a quiet harmonic bed. Deliberate note spacing
    # and gust envelopes reveal anticipation, lift, suspension and falling.
    for start,chord,d,g in [(0,[50,57,62,66],3.9,.034),
                            (3.3,[47,54,62,66],4.2,.032),
                            (7.0,[43,50,57,62],4.3,.042),
                            (10.8,[50,57,62,69],4.2,.03)]:
        pad(start,chord,d,g)
    # Spring: tremble, quick upward pickup, then no new notes during hang-time.
    phrase=[(.08,74,.052),(.29,76,.045),(.51,74,.04),
            (.64,62,.095),(.79,66,.105),(.94,69,.11),(1.10,74,.11),
            (2.12,78,.09),(2.36,74,.085),(2.73,71,.075),(3.12,69,.065),
            # Summer: fast skips and broadening intervals mirror low skimming.
            (3.62,66,.105),(3.86,69,.09),(4.13,74,.095),(4.39,76,.08),
            (4.82,74,.08),(5.23,71,.085),(5.49,69,.085),(5.76,66,.07),
            (6.24,69,.085),(6.52,74,.09),(6.83,78,.08),
            # Autumn: strong lift, tumbling descent, then sparse stalled breath.
            (7.22,55,.13),(7.39,62,.12),(7.57,67,.125),(7.76,71,.12),
            (8.00,78,.10),(8.22,76,.095),(8.46,71,.10),(8.73,67,.09),
            (9.06,62,.07),(9.78,66,.065),(10.34,62,.055),
            # Winter: unhurried downward phrase and soft snow landing.
            (11.08,74,.07),(11.72,71,.065),(12.39,69,.06),
            (13.12,66,.055),(13.69,62,.05),(14.20,50,.045)]
    for i,(t,m,g) in enumerate(phrase):
        note(t,m,g,.22*math.sin(i*.55),d=min(2.2,15-t))
    for t,m,g in [(1.16,86,.012),(3.6,81,.016),(7.2,86,.022),(11.0,81,.014),(14.2,74,.013)]:
        note(t,m,g,.12,'glass',min(1.7,15-t))
    # Quiet constant room-air under distinct nonuniform gusts. Never silence
    # the sound bed just because the scene cuts.
    u=ts(15);air=filt(rng.standard_normal(N),120,1400)
    mix(effects,fade(air,.3,1.0),0,.005,-.18)
    for args in [(.00,.58,.023,-.1,'春：枝头轻颤',.28),
                 (.52,.88,.11,-.28,'春：阵风上卷',.6),
                 (2.02,.76,.065,.3,'春：翻面离枝',2.1),
                 (3.38,.62,.07,-.2,'切夏：近水气流掠过',3.6),
                 (4.05,1.55,.044,.18,'夏：低空侧摆气流',4.7),
                 (6.15,.9,.06,-.3,'夏：风抬升准备切镜',6.6),
                 (7.04,1.5,.135,.25,'切秋：骤升阵风和翻滚',7.2),
                 (8.45,.78,.065,-.3,'秋：旋转尾流渐弱至失速',8.8),
                 (10.76,.7,.055,.15,'切冬：近叶掠镜风声',11.0),
                 (11.7,1.5,.026,-.15,'冬：缓落微风',12.4)]:
        gust(*args)
    # Fine, non-tonal snow contact rather than a bell-like hard collision.
    u=ts(.36);snow=filt(rng.standard_normal(len(u)),1300,7500)*np.exp(-u/.085)
    mix(effects,fade(snow,.012,.18),14.2,.024,.0)
    cues.append(dict(time=14.2,start=14.2,duration=.36,kind='snow_contact',description='叶片触雪轻响，尾音自然散去'))

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
    manifest={'duration':15,'sampleRate':SR,'seed':SEED,'shots':[{'start':0,'end':3.6,'name':'spring'},{'start':3.6,'end':7.2,'name':'summer'},{'start':7.2,'end':11.0,'name':'autumn'},{'start':11.0,'end':15,'name':'winter'}],'cues':cues,'notes':notes,'score':'Original D-major gesture-scored montage: anticipation, upward pickup, suspension, skim, tumble, stall and landing. Piano, glass and synthesized gusts; no samples.','end':'Natural instrumental decay with final 0.8-second cos² tail; exact zero endpoints.'}
    (OUT/'audio-cues.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
    hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [OUT/'master.wav',OUT/'music-only.wav',OUT/'foley-only.wav',OUT/'music.m4a']}
    result={'duration':15,'sr':SR,'channels':2,'final_loudnorm':final,'linearGain':gain,'hashes':hashes,'listening':'Not subjectively auditioned; encoding, loudness and waveform checks only.'}
    (OUT/'build-result.json').write_text(json.dumps(result,indent=2)+'\n')
    print(json.dumps(result,indent=2))
if __name__=='__main__':main()
