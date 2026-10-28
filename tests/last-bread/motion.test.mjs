import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function load() {
 const calls=[], window={}; const ctx=vm.createContext({window,console,location:{search:'?render'},LOOPS:{},paint:(p,s)=>calls.push({p,s}),inkLine:(p)=>calls.push({p}),boilSeed:()=>{},camBegin:()=>{},camEnd:()=>{}});
 for(const f of ['src/last-bread/config.js','src/core.js','src/timeline.js','src/last-bread/characters.js','src/last-bread/motion.js','src/last-bread/sets.js','src/last-bread/shots.js']) if(fs.existsSync(f)) vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f});
 // Only unavailable GPU calls are replaced; geometry, timing and orchestration remain real.
 return {ctx,B:vm.runInContext('Bread',ctx),calls};
}
const plain=x=>JSON.parse(JSON.stringify(x));
function finite(x){if(typeof x==='number')assert.ok(Number.isFinite(x));else if(x&&typeof x==='object')Object.values(x).forEach(finite);}
// Broken motion exports, hidden mutable accumulators and nonfinite interpolation must fail.
test('pilot sampling is finite, pure and supports reverse/random access',()=>{
 const {B}=load();assert.equal(typeof B.sample,'function');const forward=[];
 for(let f=0;f<=120;f++){const s=B.sample(16+f/24);finite(s);assert.equal(s.bread.wrapped,true);forward.push(plain(s));}
 for(let f=120;f>=0;f--)assert.deepEqual(plain(B.sample(16+f/24)),forward[f]);
 for(const t of [NaN,Infinity,15.9,21.1])assert.throws(()=>B.sample(t),/pilot|finite/i);
});
// A sliding root, sinus-only stance or fake test-only anchors breaks this actual rendered geometry test.
test('run support feet are grounded world locks, and visible vertices share them',()=>{
 const {B}=load();assert.equal(typeof B.sample,'function');
 for(const species of ['tuantuan','jiujiao']) {
  let support=0,swing=0;const groups=new Map();
  for(let f=0;f<27;f++){
   const p=B.sample(16+f/24)[species],g=B.characterGeometry(species,p);
   p.contacts.forEach((c,i)=>{const a=g.anchors.feet[i]; const visible=g.layers.find(l=>l.id===(i?'footR':'footL')).points;
    assert.ok(visible.some(q=>Math.hypot(q[0]-a[0],q[1]-a[1])<1e-6));
    if(c){support++;assert.ok(Math.abs(a[1]-B.groundY(a[0]))<.1);const key=`${i}:${c}`;if(groups.has(key))assert.ok(Math.hypot(a[0]-groups.get(key)[0],a[1]-groups.get(key)[1])<=3);else groups.set(key,a);}
    else {swing++;assert.ok(a[1]<=B.groundY(a[0])+.1);}
   });
  }assert.ok(support>15&&swing>15);assert.ok(groups.size>=5);
 }
});
test('front foot brakes while torso moves, weight compresses and tail overshoots',()=>{
 const {B}=load();assert.equal(typeof B.sample,'function');const poses=[18.2,18.3,18.4,18.55,18.7].map(t=>B.sample(t).tuantuan);
 const anchors=poses.map(p=>B.characterGeometry('tuantuan',p).anchors.feet[1]);
 for(const p of anchors)assert.ok(Math.hypot(p[0]-anchors[0][0],p[1]-anchors[0][1])<=3);
 assert.ok(poses.at(-1).x-poses[0].x>25);assert.ok(Math.max(...poses.map(p=>p.squash))>.1);
 assert.ok(Math.max(...poses.map(p=>p.tailAngle))-Math.min(...poses.map(p=>p.tailAngle))>.15);
});
test('miss has an airborne reach, independent wrapped bread and readable later separation',()=>{
 const {B}=load();assert.equal(typeof B.sample,'function');
 const miss=B.sample(17.9),early=B.sample(17.7),late=B.sample(18.15);
 assert.ok(miss.tuantuan.contacts.every(x=>!x));assert.equal(miss.tuantuan.mood,'surprised');
 const gap=s=>Math.min(...B.characterGeometry('tuantuan',s.tuantuan).anchors.hands.map(p=>Math.hypot(p[0]-s.bread.x,p[1]-s.bread.y)));
 assert.ok(gap(miss)>60&&gap(miss)<110,`miss gap ${gap(miss)}`);assert.ok(gap(late)>gap(miss)+15);
 assert.notEqual(late.bread.x-early.bread.x,late.tuantuan.x-early.tuantuan.x);
});
test('sparrow closes distance after brake, then both root velocities converge to zero',()=>{
 const {B}=load();assert.equal(typeof B.sample,'function');const a=B.sample(18.2),b=B.sample(20.6),c=B.sample(21);
 assert.ok(a.tuantuan.x-a.jiujiao.x>b.tuantuan.x-b.jiujiao.x+100);
 assert.equal(b.tuantuan.x,c.tuantuan.x);assert.equal(b.jiujiao.x,c.jiujiao.x);assert.ok(c.jiujiao.contacts.every(Boolean));
 assert.ok(Math.abs(B.sample(19.5).jiujiao.hatDrop-c.jiujiao.hatDrop)>.05);
});
test('named events are unique and pilot loop is exactly 5 seconds',()=>{
 const {B,ctx}=load();assert.ok(Array.isArray(B.events));assert.equal(new Set(B.events.map(e=>e.id)).size,B.events.length);
 for(const e of B.events)assert.ok(e.t>=16&&e.t<=21);
 assert.equal(vm.runInContext('LOOPS.breadPilot.len',ctx),5);
});
test('world foot targets deform real articulated legs under rotation/squash without altering default anatomy',()=>{
 const {B}=load();for(const species of ['tuantuan','jiujiao']){
 const target=[[85,320],[160,325]],pose={x:120,y:330,u:30,flip:true,bodyRot:.2,squash:.12,footTargets:target};
 const g=B.characterGeometry(species,pose);g.anchors.feet.forEach((p,i)=>assert.ok(Math.hypot(p[0]-target[i][0],p[1]-target[i][1])<1e-6));
 assert.throws(()=>B.characterGeometry(species,{footTargets:[[NaN,0],[0,0]]}),/footTargets/);
 }});
test('drawFrame paints set, shadow, wrapped paper and both articulated characters without a cache',()=>{
 const {B,ctx}=load();assert.equal(typeof B.drawFrame,'function');
 const marks=[];ctx.record=(points,style)=>marks.push({points:plain(points),style});
 vm.runInContext('paint=(p,s)=>record(p,s);inkLine=(p)=>record(p);camBegin=()=>{};camEnd=()=>{}',ctx);
 ctx.randomSeed=()=>{};for(const name of ['push','pop','noStroke','fill','beginShape','vertex','endShape'])ctx[name]=()=>{};ctx.CLOSE='close';vm.runInContext('flushBrush=()=>{}',ctx);
 B.drawFrame(17.9);assert.ok(marks.length>100);const first=JSON.stringify(marks);marks.length=0;B.drawFrame(18.3);assert.notEqual(JSON.stringify(marks),first);
 vm.runInContext('LOOPS.breadPilot(2.3)',ctx);
});
test('event transitions have continuous roots and articulated limb controls',()=>{
 const {B}=load();for(const e of B.events||[]){if(e.t<=16||e.t>=21)continue;
  const a=B.sample(e.t-1e-6),b=B.sample(e.t+1e-6);
  for(const s of ['tuantuan','jiujiao'])for(const key of ['x','y','bodyRot','squash',...(s==='tuantuan'?['armL','armR']:['wingL','wingR'])])assert.ok(Math.abs(a[s][key]-b[s][key])<.01,`${e.id} ${s}.${key} jumped ${a[s][key]} → ${b[s][key]}`);
 }
});
test('catchup sparrow face and oversized hat draw in front of the raccoon tail',()=>{
 const {B,ctx}=load(),marks=[];ctx.record=p=>marks.push(plain(p));
 vm.runInContext('paint=p=>record(p);inkLine=p=>record(p);camBegin=()=>{};camEnd=()=>{};flushBrush=()=>{}',ctx);
 ctx.randomSeed=()=>{};for(const name of ['push','pop','noStroke','fill','beginShape','vertex','endShape'])ctx[name]=()=>{};ctx.CLOSE='close';
 const state=B.drawFrame(20.6),raccoon=B.characterGeometry('tuantuan',state.tuantuan),bird=B.characterGeometry('jiujiao',state.jiujiao);
 const at=(g,id)=>marks.findIndex(p=>JSON.stringify(p)===JSON.stringify(g.layers.find(l=>l.id===id).points));
 assert.ok(at(bird,'hat/crown')>at(raccoon,'tail'),'hat silhouette must survive overlapping opaque tail');
 assert.ok(at(bird,'head')>at(raccoon,'tail'));
});
test('actual rotating parcel outline clears sloped ground and makes support contact without a proxy circle',()=>{
 const {B,ctx}=load(),painted=[];ctx.record=p=>painted.push(plain(p));ctx.randomSeed=()=>{};vm.runInContext('paint=p=>record(p);inkLine=p=>record(p)',ctx);
 for(let f=0;f<=120;f++){
  const t=16+f/24,b=B.sample(t).bread;painted.length=0;B.drawWrappedBread(b);const outline=painted[0];
  assert.deepEqual(outline,plain(B.parcelGeometry(b)),'support outline must be the polygon actually painted');
  const clearance=outline.map(([x,y])=>B.groundY(x)-y);
  assert.ok(Math.min(...clearance)>=-1e-7,`parcel penetrates ground at${t}: ${Math.min(...clearance)}`);
  if(t<17.42||t>19.25)assert.ok(Math.abs(Math.min(...clearance))<1e-7,'rolling packet must touch its true support vertex');
 }
});
