import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const runner=fs.existsSync('scripts/render-last-bread.mjs')?await import('../../scripts/render-last-bread.mjs'):{};
const film={width:1920,height:1080,fps:24,duration:5};
test('runner produces exactly 120 continuous frames, excludes diagnostic end boundary',()=>{
 assert.equal(typeof runner.planFrames,'function');const p=runner.planFrames({loop:'breadPilot',start:0,end:120},film);
 assert.equal(p.frames.length,120);assert.deepEqual(p.frames,Array.from({length:120},(_,i)=>i));assert.equal(p.boundary,120);assert.ok(!p.frames.includes(p.boundary));
 const part=runner.planFrames({loop:'breadPilot',start:20,end:40},film);assert.equal(part.frames.length,20);assert.equal(part.boundary,40);
});
test('range derives from film metadata rather than old fixed frame count',()=>{
 assert.equal(typeof runner.planFrames,'function');assert.equal(runner.planFrames({loop:'breadPilot'},{...film,fps:30,duration:2}).frames.length,60);
});
test('invalid flags, noninteger/out-of-bounds ranges, and unapproved full film are rejected',()=>{
 assert.equal(typeof runner.parseArgs,'function');for(const args of [[],['--loop','bad'],['--start','1.5'],['--end','NaN'],['--start','-1'],['--wat','1'],['--loop'],['--loop','breadPilot','--out','']])assert.throws(()=>runner.parseArgs(args));
 for(const p of [{start:0,end:121},{start:2,end:2},{start:3,end:2},{start:.5,end:30},{start:-1,end:30}])assert.throws(()=>runner.planFrames({loop:'breadPilot',...p},film));
 assert.deepEqual(runner.parseArgs(['--loop','breadPilot','--start','0','--end','120','--out','test-output']),{loop:'breadPilot',start:0,end:120,out:'test-output'});
});
test('views are explicit representative stills rather than silently encoded as continuous movie',()=>{
 assert.equal(typeof runner.planFrames,'function');const p=runner.planFrames({loop:'breadViews'},film);assert.deepEqual(p.frames,[0,12,24,36,48,60,72,84,96,108]);assert.equal(p.boundary,null);assert.equal(p.continuous,false);
});
test('stage request accepts only views/pilot, never progression or full',()=>{
 assert.equal(typeof runner.requestStage,'function');assert.equal(runner.requestStage({stage:'views'}),'views');assert.equal(runner.requestStage({stage:'pilot'}),'pilot');
 for(const x of [{stage:'full'},{},null,{stage:['pilot']}])assert.throws(()=>runner.requestStage(x));
});
test('timing statistics retain startup and 30 percent projection headroom',()=>{
 assert.equal(typeof runner.timingSummary,'function');const s=runner.timingSummary([10,20,30,40,50],100,200,6);assert.equal(s.medianMs,30);assert.equal(s.p95Ms,50);assert.equal(s.maxMs,50);assert.equal(s.projectedChunkUpperMs,15990);
});
test('entry metadata uses the actual standalone film contract',()=>{
 assert.deepEqual(runner.entryMetadata('breadViews'),film);assert.throws(()=>runner.entryMetadata('notImplemented'),/not implemented/);
});
test('invalid range fails early with a diagnostic manifest, not silent bootstrap loss',async()=>{
 const {mkdtemp,readFile,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');const {spawnSync}=await import('node:child_process');
 const out=await mkdtemp(join(tmpdir(),'bread-runner-failure-'));
 try{
  const p=spawnSync(process.execPath,['scripts/render-last-bread.mjs','--loop','breadViews','--end','121','--out',out],{env:{...process.env,PATH:'/nonexistent'},encoding:'utf8'});
  assert.equal(p.status,1);assert.match(p.stderr,/Invalid frame range/);
  assert.ok(fs.existsSync(join(out,'render-manifest.json')),'bootstrap failure must retain diagnostic manifest');
  const m=JSON.parse(await readFile(join(out,'render-manifest.json'),'utf8'));
  assert.equal(m.status,'failed');assert.match(m.error,/Invalid frame range/);assert.equal(m.stage,'breadViews');assert.ok(m.nodePeakRssKiB>0);assert.deepEqual(m.frameTimes,[]);
 }finally{await rm(out,{recursive:true,force:true});}
});
test('encoder preflight prepares decodable AAC before single-frame mux and verifies both real streams',{skip:process.env.BREAD_PNG_ONLY==='1'},async()=>{
 const {mkdtemp,rm}=await import('node:fs/promises');const {tmpdir}=await import('node:os');const {join}=await import('node:path');
 const out=await mkdtemp(join(tmpdir(),'bread-encoder-'));
 try{
  const result=runner.encoderPreflight(film,out);
  assert.ok(result.audioPreflight?.streams?.some(s=>s.codec_name==='aac'&&s.sample_rate==='48000'&&s.channels===2),'AAC must be encoded and probed before one-frame mux');
  assert.ok(result.streams.some(s=>s.codec_type==='audio'&&s.codec_name==='aac'));
  const video=result.streams.find(s=>s.codec_type==='video');assert.equal(video.codec_name,'h264');assert.equal(video.nb_frames,'1');
 }finally{await rm(out,{recursive:true,force:true});}
});
test('views PNG path has no AAC or video encoder dependency',()=>{
 assert.equal(typeof runner.stagePreflight,'function');const before=process.env.PATH;
 try{process.env.PATH='/nonexistent';assert.deepEqual(runner.stagePreflight('breadViews',film,'/nonexistent-output'),{skipped:true,reason:'PNG views do not encode audio or video'});}finally{process.env.PATH=before;}
});
test('even frame timing counts report the statistical median rather than the upper middle',()=>{
 assert.equal(runner.timingSummary([10,40,20,30],100).medianMs,25);
});
