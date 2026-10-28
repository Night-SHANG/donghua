import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
let n=0;const check=ps=>{for(const p of ps){assert.equal(p.length,2);assert.ok(p.every(Number.isFinite));n++;}};
const c={window:{},clamp:(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp:(a,b,k)=>a+(b-a)*k,push(){},pop(){},translate(){},scale(){},boilSeed(){},paint:check,inkLine:check,eyes(){},mouth(){},feel(){return {eyes:'normal',mouth:'smile'}}};vm.createContext(c);vm.runInContext(fs.readFileSync('src/cast/duo.js','utf8'),c);
for(const who of ['kokou','liuliu'])for(const view of ['front','quarter','profile','back'])for(const pose of Object.keys(c.window.CAST.poses))c.window.CAST.draw(who,0,0,3,{view,pose});
assert.equal(c.window.CAST.defs.kokou.h,100);assert.equal(c.window.CAST.defs.liuliu.h,72);console.log(JSON.stringify({geometry:'finite',drawings:72,points:n,actual_render:false}));
