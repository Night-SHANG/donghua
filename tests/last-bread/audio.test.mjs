import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const api=fs.existsSync('scripts/last-bread-events.mjs')?await import('../../scripts/last-bread-events.mjs'):{};
test('audio cue export uses exact motion event identities and relative times, not a duplicate timeline',()=>{
 assert.equal(typeof api.pilotEvents,'function');const events=api.pilotEvents();assert.ok(events.length>15);
 const ctx=vm.createContext({window:{},location:{search:'?render'},console});
 for(const file of ['src/last-bread/config.js','src/core.js','src/timeline.js','src/last-bread/characters.js','src/last-bread/motion.js'])vm.runInContext(fs.readFileSync(file,'utf8'),ctx);
 const source=vm.runInContext('Bread.events',ctx);
 for(const e of events){const motion=source.find(x=>x.id===e.motionEvent);assert.ok(motion,e.motionEvent);assert.ok(Math.abs(e.t-(motion.t-16))<1e-10);assert.ok(e.t>=0&&e.t<5);assert.ok(e.sfx);}
 assert.ok(events.some(e=>e.motionEvent==='miss'));assert.ok(events.some(e=>e.motionEvent==='land'));assert.ok(events.some(e=>e.motionEvent==='birdStop'));
});
test('pilot score is independent original content with only five seconds of intended timeline',()=>{
 assert.ok(fs.existsSync('film/last-bread/score.json'));const s=JSON.parse(fs.readFileSync('film/last-bread/score.json'));
 assert.equal(s.scope,'5-second motion pilot; not the full film score');assert.equal(s.bpm,120);assert.equal(s.sections.reduce((a,b)=>a+b.bars,0)*s.beats_per_bar*60/s.bpm,5);
 assert.notDeepEqual(s.parts,JSON.parse(fs.readFileSync('film/audio/score.json')).parts);
});
test('real AAC verifier accepts five-second stereo48k and rejects incorrect duration',async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const dir=await mkdtemp(join(tmpdir(),'bread-audio-qa-'));
 try{
  for(const duration of [5,4]){
   const file=join(dir,`fixture-${duration}.m4a`);
   const encode=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y','-f','lavfi','-i',`sine=frequency=1000:sample_rate=48000:duration=${duration}`,'-af','volume=7dB','-ac','2','-c:a','aac','-b:a','192k',file],{encoding:'utf8'});assert.equal(encode.status,0,encode.stderr);
   const check=spawnSync('python',['scripts/verify-last-bread.py','--audio',file],{encoding:'utf8'});
   if(duration===5){assert.equal(check.status,0,check.stderr);const q=JSON.parse(check.stdout);assert.equal(q.duration,5);assert.ok(q.true_peak_dbtp<=-1.5);assert.equal(q.full_decode,'pass');}
   else {assert.notEqual(check.status,0);assert.match(check.stderr,/five-second/);}
  }
 }finally{await rm(dir,{recursive:true,force:true});}
});
