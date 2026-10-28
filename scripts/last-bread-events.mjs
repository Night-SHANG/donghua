// Audio placement is exported from the production motion event source, not retimed by hand.
import fs from 'node:fs';
import vm from 'node:vm';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
export function pilotEvents(){
 const ctx=vm.createContext({window:{},console,location:{search:'?render'}});
 for(const file of ['src/last-bread/config.js','src/core.js','src/timeline.js','src/last-bread/characters.js','src/last-bread/motion.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx,{filename:file});
 const B=vm.runInContext('Bread',ctx),start=B.events.find(e=>e.id==='runStart').t;
 const cues={crouch:{sfx:'paper',gain_db:-20,dur:.15},takeoff:{sfx:'whoosh',gain_db:-15,dur:.3,bright:-.4},miss:{sfx:'whip',gain_db:-15,dur:.16,tone:.2},land:{sfx:'impact',gain_db:-14,pitch:-5,role:'hero'},brakeEnd:{sfx:'paper',gain_db:-19,dur:.2},birdBrake:{sfx:'paper',gain_db:-21,dur:.17},birdStop:{sfx:'pop',gain_db:-19,pitch:7},settle:{sfx:'paper',gain_db:-24,dur:.12}};
 return B.events.flatMap(e=>{
  let cue=cues[e.id];const bird=e.id.startsWith('jiujiao-')||e.id.startsWith('bird');
  if(e.id.includes('-step-'))cue={sfx:bird?'tick':'pop',gain_db:bird?-25:-21,...(bird?{}:{pitch:-12})};
  if(!cue)return [];
  const state=B.sample(e.t),x=(bird?state.jiujiao:state.tuantuan).x;
  return [{motionEvent:e.id,t:e.t-start,...cue,pan:Math.max(-.7,Math.min(.7,(2*x/1920-1)*.7)),role:cue.role||'detail',why:`Original pilot cue at motion event ${e.id}`}];
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const json=JSON.stringify(pilotEvents(),null,2)+'\n';
 if(process.argv[2]==='--check'){if(fs.readFileSync('film/last-bread/events.json','utf8')!==json)throw new Error('Generated events drift: run node scripts/last-bread-events.mjs');}
 else fs.writeFileSync('film/last-bread/events.json',json);
}
