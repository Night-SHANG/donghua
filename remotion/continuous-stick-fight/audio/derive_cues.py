"""Fail-closed adapter from frozen visual contract to original audio cues.
Usage: python derive_cues.py PROJECT_ROOT
Never treats a threat-phase, near-miss, or beat's name as an impact.
"""
import json,sys,pathlib,hashlib
ROOT=pathlib.Path(__file__).parent

def derive(project):
 specpath=project/'film-spec.json';posepath=project/'src/poses.json'
 spec=json.loads(specpath.read_text());poses=json.loads(posepath.read_text())
 if spec.get('posesSha256'):
  assert hashlib.sha256(posepath.read_bytes()).hexdigest()==spec['posesSha256'], 'Spec poses hash mismatch; freeze needs refresh'
 frames=spec['durationInFrames'];fps=spec['fps']
 assert isinstance(frames,int) and frames==len(poses['frames'])
 assert fps==poses['fps'] and 48000%fps==0
 events=[]
 def add(frame,kind,**extra):
  assert isinstance(frame,int) and 0<=frame<frames
  events.append(dict(frame=frame,time=frame/fps,kind=kind,**extra))
 # One anticipation per actual attack. Threats remain air only.
 for i,b in enumerate(poses['beats']):
  f=b.get('contactFrame')
  if f is None:continue
  kick=any(x in b['id'] for x in ('kick','rail','push','final'))
  lead=12 if kick else 7
  start=max(b['start'],f-lead)
  add(start,'whoosh',duration=(f-start)/fps,gain=.85 if kick else .55,pan=(-.18 if i%2 else .18),sourceBeat=b['id'],evidence='attack anticipation, no impact implied')
 for c in poses['contacts']:
  kind=c['kind'];mapping={'block':'block','rail':'metal','impact':'heavy'}
  if kind not in mapping:continue
  if kind=='impact':
   assert poses.get('terminalReaction'), 'Final impact requires frozen terminalReaction validation contract'
  add(c['frame'],mapping[kind],gain={'block':.88,'rail':1.1,'impact':1.15}[kind],sourceBeat=c['beat'],evidence='verified visual contact kind='+kind)
 reaction=poses.get('terminalReaction') or {}
 if reaction.get('landingFrame') is not None:
  add(reaction['landingFrame'],'land',gain=.8,evidence='verified terminalReaction landingFrame')
 # Landing/steps must be supplied as explicit verified events, never invented from timing.
 for c in poses.get('scene_events',[]):
  mapping={'landing':'land','land':'land','step':'step','slide':'slide','rail-debris':'metal'}
  if c['kind'] in mapping:
   add(c['frame'],mapping[c['kind']],gain=c.get('gain',.25 if c['kind']=='step' else .65),evidence='verified scene event')
 events.sort(key=lambda e:e['frame'])
 result=dict(frames=frames,fps=fps,duration=frames/fps,bpm=138,music_action_start=.12,music_action_end=max(1,frames/fps-1.15),events=events,source_sha256={str(p.relative_to(project)):hashlib.sha256(p.read_bytes()).hexdigest() for p in (specpath,posepath)})
 return result
if __name__=='__main__':
 cues=derive(pathlib.Path(sys.argv[1]))
 (ROOT/'cues.json').write_text(json.dumps(cues,indent=2)+'\n');print(json.dumps(cues,indent=2))
