// Pure-state/static API tests, explicitly NOT a browser/pixel visual pass.
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const filmRoot=path.resolve(__dirname,'../engine');
global.window=global;global.SCENES={};
const engine=path.resolve(process.env.HUASHU_ENGINE||'/tmp/animation-trials/huashu/skill/scripts/engine');
for(const file of ['lib/util.js','lib/motion.js'])vm.runInThisContext(fs.readFileSync(path.join(engine,file),'utf8'),{filename:file});
for(const file of ['eras_fox_stork.js','fox_stork/asset_meta.js','fox_stork/timeline.js','fox_stork/actors.js'])vm.runInThisContext(fs.readFileSync(path.join(filmRoot,file),'utf8'),{filename:file});
assert.equal(ERAS.length,14);assert.equal(ERAS.reduce((n,s)=>n+s.dur,0),65);assert.equal(PUNCH,0);
for(let i=0;i<14;i++){assert.equal(ERAS[i].id,FABLE.SHOTS[i].id);assert.equal(ERAS[i].dur,FABLE.SHOTS[i].b-FABLE.SHOTS[i].a);}
for(const [who,poses] of Object.entries(FABLE.poseNames))for(const pose of poses){const m=FABLE.meta(who,pose);assert(m.ref_h>0);assert(fs.existsSync(path.join(filmRoot,FABLE.assetPath(who,pose))));for(const v of [...m.anchor,...m.contact])assert(Number.isFinite(v));}
for(let t=0;t<65;t+=.125){assert.deepStrictEqual(FABLE.state(t),FABLE.state(t));const s=FABLE.state(t);for(const who of ['fox','stork']){const a=FABLE.actorTransform(who,s[who]);assert.equal(a.x,s[who].x);assert.equal(a.y,s[who].y);assert(Number.isFinite(a.dx+a.dy));}if(t>=33)assert.equal(s.leftSoup,0);}
for(const [t,who,x,y,tol] of [[6.65,'fox',730,697,3],[12.1,'stork',1190,697,.05],[21,'stork',1196,697,.05],[39.35,'stork',1188,422,.05],[40.2,'stork',1188,590,.05],[45.1,'fox',737,418,.05]]){const s=FABLE.state(t);const a=FABLE.actorTransform(who,s[who]);assert(Math.abs(a.mouth[0]-x)<tol&&Math.abs(a.mouth[1]-y)<tol,JSON.stringify({t,a}));}
for(const t of [63.5,64,64.5,64.99]){const s=FABLE.state(t);assert.equal(s.fox.pose,'ears_droop');assert.equal(s.stork.pose,'content');assert(!s.stork.contact);assert.equal(s.fox.rot,0);}
assert.deepStrictEqual(FABLE.contactTimes.jarSet,[34.2,34.55]);assert.equal(FABLE.contactTimes.foxBlock,45.1);assert.equal(FABLE.contactTimes.hold,63.5);
console.log('PASS: 14 shots/65s; 17 real assets; 520 repeated-time state samples; grounded roots; 6 measured contact anchors; 63.5–65 pose hold; exact cue registry.');
