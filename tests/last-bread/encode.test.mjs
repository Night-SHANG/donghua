import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
const api=fs.existsSync('scripts/encode-last-bread.mjs')?await import('../../scripts/encode-last-bread.mjs'):{};
const manifest=()=>({status:'rendered',stage:'breadPilot',film:{width:1920,height:1080,fps:24,duration:5},plan:{continuous:true,start:0,end:120,total:120,frames:Array.from({length:120},(_,i)=>i)},frameTimes:Array.from({length:121},(_,frame)=>({frame,ms:30,diagnostic:frame===120})),startupMs:100});
test('encode gate accepts exact continuous pilot but rejects views, short, duplicates and unfinished renders',()=>{
 assert.equal(typeof api.validatePilotManifest,'function');assert.equal(api.validatePilotManifest(manifest()).frames,120);
 for(const change of [m=>m.stage='breadViews',m=>m.status='failed',m=>m.plan.frames.pop(),m=>m.plan.frames[119]=118,m=>m.frameTimes.pop(),m=>m.film.duration=60,m=>m.plan.continuous=false]){const m=manifest();change(m);assert.throws(()=>api.validatePilotManifest(m));}
});
test('real finalizer encodes120 synthetic fixture frames, excludes boundary and measures output',async()=>{
 const {mkdtemp,writeFile,mkdir,link,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const dir=await mkdtemp(join(tmpdir(),'bread-encode-qa-'));
 const command=(args)=>{const r=spawnSync('ffmpeg',['-hide_banner','-loglevel','error','-y',...args],{encoding:'utf8'});assert.equal(r.status,0,r.stderr);};
 try{
  await mkdir(join(dir,'frames'));await mkdir(join(dir,'diagnostics'));
  command(['-f','lavfi','-i','color=c=orange:s=1920x1080:r=24','-frames:v','1',join(dir,'base.png')]);
  for(let i=0;i<120;i++)await link(join(dir,'base.png'),join(dir,'frames',`f${String(i).padStart(5,'0')}.png`));
  await link(join(dir,'base.png'),join(dir,'diagnostics','boundary-00120.png'));
  command(['-f','lavfi','-i','sine=frequency=1000:sample_rate=48000:duration=5','-af','volume=7dB','-ac','2','-c:a','aac','-b:a','192k',join(dir,'audio.m4a')]);
  await writeFile(join(dir,'render-manifest.json'),JSON.stringify(manifest()));
  const result=await api.encodePilot(dir,join(dir,'audio.m4a'));
  assert.equal(result.encodedFrameCount,120);assert.equal(result.visualReview,'pending controller and user');assert.ok(result.timing.encodeMs>0);
  const qa=JSON.parse(await readFile(join(dir,'pilot-technical-qa.json'),'utf8'));assert.equal(qa.frames,120);assert.equal(qa.duration,5);assert.equal(qa.full_decode,'pass');
 }finally{await rm(dir,{recursive:true,force:true});}
});
