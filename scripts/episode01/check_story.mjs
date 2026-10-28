import vm from 'node:vm';import fs from 'node:fs';import assert from 'node:assert/strict';
let depth=0,points=0,frames=0;const finite=(...a)=>a.flat(Infinity).forEach(x=>{if(typeof x==='number')assert.ok(Number.isFinite(x),'nonfinite');});
const check=p=>{for(const v of p){assert.equal(v.length,2);finite(v);points++;}};
const c={console,window:{},Math,random:()=>.5,randomSeed(){},noiseSeed(){},noise:()=>.5,push(){depth++},pop(){assert.ok(depth>0,'unbalanced pop');depth--},translate:finite,rotate:finite,scale:finite,resetMatrix(){},image(){},fill(){},noStroke(){},rect:finite,circle:finite,ellipse:finite,line:finite,beginShape(){},vertex:finite,endShape(){},CLOSE:1};vm.createContext(c);
for(const p of ['src/episode01/config.js','src/core.js','src/clawd.js','src/timeline.js','src/cast/duo.js'])vm.runInContext(fs.readFileSync(p,'utf8'),c,{filename:p});
c.CAST=c.window.CAST;
c.paint=check;c.inkLine=check;c.flushBrush=()=>{};c.flushLetters=()=>{};
vm.runInContext(fs.readFileSync('src/episode01/story.js','utf8'),c,{filename:'story.js'});
for(let f=0;f<768;f++){c.now=f/24;vm.runInContext('T=now; BOILN=Math.floor(now*12); LOOPS.episode01(now)',c);assert.equal(depth,0,'unbalanced frame');frames++;}
console.log(JSON.stringify({status:'passed',frames,points,finite_geometry:true,balanced_transforms:true,actual_paint_render:false}));
