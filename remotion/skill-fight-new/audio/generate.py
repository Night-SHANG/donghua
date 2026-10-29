"""Original synthetic score / physical Foley for Bell Duel (no samples or services).
Adapted concepts: stickman-video gen_audio.py envelopes/modal plucks; animated-video
parts/audio/designed.py filtered air, stereo panning and event-aligned sound design.
Run from any directory: python audio/generate.py. All authored sounds are synthetic.
"""
from pathlib import Path
import json, subprocess, re
import numpy as np
from scipy.io import wavfile
from scipy.signal import butter, sosfilt
ROOT=Path(__file__).resolve().parent.parent
OUT=ROOT/'public/audio'
SR=48000; FPS=30; DURATION=20; N=SR*DURATION
rng=np.random.default_rng(20261029480)

def filt(x,lo=80,hi=3000):
    return sosfilt(butter(2,[lo,hi],btype='bandpass',fs=SR,output='sos'),x)
def fade(x,a=.004,b=.04):
    x=x.copy(); na=min(len(x),int(a*SR)); nb=min(len(x),int(b*SR))
    if na:x[:na]*=np.linspace(0,1,na)
    if nb:x[-nb:]*=np.linspace(1,0,nb)
    return x
def tone(note,d=.7,soft=False):
    t=np.arange(round(d*SR))/SR; f=440*2**((note-69)/12)
    # String-like modal excitation, inharmonic upper partials decay faster.
    y=sum((1/k**1.7)*np.sin(2*np.pi*f*k*(1+.00008*k*k)*t+.12*k)*np.exp(-t*(2.7+k*1.8)/(1.6 if soft else 1)) for k in range(1,7))
    y+=filt(rng.normal(0,1,len(t)),600,2500)*np.exp(-t*75)*.08
    return fade(y,.012 if soft else .003,.12)
def air(d=.35,lo=450,hi=3500):
    t=np.arange(round(d*SR))/SR
    y=filt(rng.normal(0,1,len(t)),lo,hi)
    return fade(y*np.sin(np.pi*t/d)**2,.015,.04)
def thud(d=.2,f=105):
    t=np.arange(round(d*SR))/SR
    phase=2*np.pi*(f*t+f*.6*(1-np.exp(-t*30))/30)
    return fade(np.sin(phase)*np.exp(-t*26)+filt(rng.normal(0,1,len(t)),150,1700)*np.exp(-t*45)*.35,.002,.04)
def chirp(d=.15):
    t=np.arange(round(d*SR))/SR
    f=2100+1450*np.sin(np.pi*t/d)+100*np.sin(t*100)
    return fade(np.sin(2*np.pi*np.cumsum(f)/SR)*np.sin(np.pi*t/d)**1.3,.008,.015)
def put(buf,x,sec,gain=1,pan=0):
    i=round(sec*SR); m=min(len(x),len(buf)-i)
    if m<=0:return
    angle=(pan+1)*np.pi/4
    buf[i:i+m,0]+=x[:m]*gain*np.cos(angle)
    buf[i:i+m,1]+=x[:m]*gain*np.sin(angle)
def write(path,x):
    wavfile.write(path,SR,np.round(np.clip(x,-1,1)*32767).astype(np.int16))


def source_events():
    s=(ROOT/'src/timeline.ts').read_text().split('export const EVENTS=')[1].split(';')[0]
    return [{'frame':int(f),'name':k} for f,k in re.findall(r"\{f:(\d+),kind:'([^']+)'",s)]

def wood(note,d=.35):
    t=np.arange(round(d*SR))/SR; f=440*2**((note-69)/12)
    y=sum(a*np.sin(2*np.pi*f*r*t)*np.exp(-t*decay) for r,a,decay in [(1,1,10),(2.72,.23,24),(5.1,.07,40)])
    return fade(y,.002,.06)

def bell(d=3.5):
    t=np.arange(round(d*SR))/SR
    y=sum(a*np.sin(2*np.pi*523.25*r*t)*np.exp(-t*k) for r,a,k in [(1,.75,1.7),(2.71,.24,2.4),(4.07,.10,3.8),(5.43,.06,5)])
    return fade(y,.002,.3)

def measure(path):
    p=subprocess.run(['ffmpeg','-hide_banner','-i',str(path),'-af','loudnorm=I=-18:TP=-2:LRA=9:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
    return json.loads(re.findall(r'\{[^{}]*\}',p.stderr)[-1])

def generate():
    OUT.mkdir(exist_ok=True,parents=True)
    music=np.zeros((N,2)); sfx=np.zeros_like(music); cues=[]
    # Distinct D-minor pentatonic 126 BPM cue: low drum ostinato and wooden melody.
    beat=60/126; notes=[62,69,65,72,69,74,72,65]
    for j,sec in enumerate(np.arange(0,15.21,beat/2)):
        energy=.5 if sec<1.5 else .75+.25*sec/15.2
        if j%2==0:
            put(music,thud(.22,58 if j%8==0 else 72),sec,.14*energy,-.12)
            put(music,tone([38,38,41,36][(j//8)%4],.65),sec,.085*energy,-.2)
        if j%4==2:put(music,air(.105,350,1700),sec,.095*energy,.18)
        put(music,wood(notes[j%8],.29),sec,.085*energy,(-1)**j*.28)
        if sec>7:put(music,air(.048,1800,4800),sec,.022,.3)
    # Musical action ends at decisive palm; empty beat lets the post bell read.
    for j,(sec,note) in enumerate([(17.65,74),(18.05,69),(18.45,65),(18.95,62)]):
        put(music,wood(note,.8),sec,.065,(-1)**j*.15)
    for note in [50,57,62]:put(music,tone(note,1.1,True),18.8,.035)
    dry=music.copy()
    for sec,g in [(.041,.10),(.083,.055)]:
        shift=round(sec*SR);music[shift:]+=dry[:-shift,::-1]*g
    def fx(frame,name,x,g=.2,pan=0,source=None):
        put(sfx,x,frame/FPS,g,pan)
        cues.append({'frame':frame,'seconds':frame/FPS,'name':name,'sourceKind':source,'durationSeconds':len(x)/SR,'gain':g,'pan':pan,'synthetic':True})
    for e in source_events():
        f=e['frame'];k=e['name'];p=.1 if f>300 else -.1
        if k in ['whoosh','sweep']:
            fx(f,'miss_air_'+k,air(.28,300 if k=='sweep' else 650,3200),.28,p,k)
        elif k in ['block','clash','kick']:
            x=thud(.24,155)+air(.24,750,2800)*.43+wood(64,.24)*.15
            fx(f,'guard_contact_'+k,x,.23 if k!='clash' else .27,p,k)
        elif k=='body':fx(f,'body_palm',thud(.3,92)+air(.3,160,1200)*.24,.29 if f<450 else .36,p,k)
        elif k=='jump':fx(f,'takeoff',thud(.22,120)+air(.22,400,2000)*.25,.18,p,k)
        elif k=='land':fx(f,'landing',thud(.34,75)+air(.34,200,1800)*.25,.27,p,k)
        elif k=='post':
            fx(f,'wood_post_contact',thud(.34,100)+wood(50,.34)*.30,.30,p,k)
            fx(f,'bell_ring',bell(),.32,.28,k)
        else:raise ValueError('Unmapped source event '+k)
    # Smooth onset/end; post bell continues beneath the surprise pause.
    envelope=(np.minimum(1,np.arange(N)/(SR*.03))*np.minimum(1,(N-1-np.arange(N))/(SR*.5)))[:,None]
    music*=envelope*2.5;sfx*=envelope*.8
    master=music+sfx
    write(OUT/'master.wav',master)
    initial=measure(OUT/'master.wav')
    gain=10**(min(-18-float(initial['input_i']),-2.25-float(initial['input_tp']))/20)
    music*=gain;sfx*=gain;master*=gain
    for name,arr in [('master',master),('music',music),('sfx',sfx)]:write(OUT/f'{name}.wav',arr)
    metadata={'fps':FPS,'durationFrames':600,'durationSeconds':20,'sampleRate':SR,'master':'audio/master.wav','masterVolume':1,'provenance':'Original deterministic procedural instruments and Foley; no recordings, voices, external APIs or licensed samples.','source':'src/timeline.ts EVENTS','storyAnchors':source_events(),'sections':[{'start':s,'end':e,'name':n} for s,e,n in [(0,1.5,'setup'),(1.5,15.2,'rising_action'),(15.2,16,'decisive_release'),(16,17.65,'bell_and_surprise'),(17.65,20,'light_bow_resolve')]],'cues':cues}
    (ROOT/'audio/cues.json').write_text(json.dumps(metadata,indent=2)+'\n')
    measured=measure(OUT/'master.wav')
    report={'durationSeconds':len(master)/SR,'sampleRate':SR,'channels':2,'samplePeakDbFS':float(20*np.log10(np.max(np.abs(master)))),'clippedSamples':int(np.sum(np.abs(master)>=1)),'integratedLufs':float(measured['input_i']),'truePeakDbTP':float(measured['input_tp']),'loudnessRangeLu':float(measured['input_lra']),'sourceEventCount':len(source_events()),'foleyCueCount':len(cues),'listeningVerified':False,'check':'Objective measurements only; subjective listening not claimed.'}
    (ROOT/'audio/measurements.json').write_text(json.dumps(report,indent=2)+'\n')
    print(json.dumps(report,indent=2))
if __name__=='__main__':generate()
