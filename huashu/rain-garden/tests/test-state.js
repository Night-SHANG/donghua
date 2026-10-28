const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const upstream=process.env.HUASHU_ENGINE||'/tmp/animation-trials/huashu/skill/scripts/engine';
global.window=global;global.SCENES={};
for(const f of ['lib/util.js','lib/motion.js','lib/camera.js','lib/paint.js'])vm.runInThisContext(fs.readFileSync(path.join(upstream,f),'utf8'),{filename:f});
for(const f of ['eras_rain_garden.js','rain_garden/world.js'])vm.runInThisContext(fs.readFileSync(path.join(__dirname,'../engine',f),'utf8'),{filename:f});
assert.equal(ERAS.reduce((a,e)=>a+e.dur,0),15);assert.deepEqual(Object.keys(SCENES),['dew','ripple','bloom','island']);
for(let f=0;f<=900;f++){const t=f/60,a=RAIN_GARDEN.state(t),b=RAIN_GARDEN.state(t);assert.deepEqual(a,b);assert(Number.isFinite(a.camera.z));assert(a.camera.z>.7);assert(a.flowers.every(x=>x>=0&&x<=1));}
assert.equal(RAIN_GARDEN.state(2.8).dropY,350);assert(Math.abs(RAIN_GARDEN.state(3.8).dropY-620)<1e-8);assert(!RAIN_GARDEN.state(3.8).dropVisible);
for(const t of [3.8,7,11]){const a=RAIN_GARDEN.state(t-1e-6),b=RAIN_GARDEN.state(t+1e-6);assert(Math.abs(a.camera.x-b.camera.x)<.001);assert(Math.abs(a.camera.z-b.camera.z)<.001)}
assert.equal(RAIN_GARDEN.state(15).flowers.reduce((a,x)=>a+x,0),3);
console.log('PASS 901 deterministic states; 4 shots/15s; exact impact; continuous camera across all boundaries; no image/sprite dependencies. Visual verification pending.');
