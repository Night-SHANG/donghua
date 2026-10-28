import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Geometry is real production code. Only the unavailable WebGL paint boundary is recorded.
function load() {
  const calls = [];let points=[],baseColor;
  const ctx = vm.createContext({console, LOOPS: {},CLOSE:'close',
    flushBrush:()=>calls.push({kind:'flush'}),push:()=>{},pop:()=>{},noStroke:()=>{},fill:c=>baseColor=c,
    beginShape:()=>{points=[];},vertex:(x,y)=>points.push([x,y]),endShape:()=>calls.push({kind:'base',points,color:baseColor}),
    paint: (points, style) => calls.push({kind:'paint', points, style}),
    inkLine: (points, sw, col) => calls.push({kind:'line', points, sw, col}),
    boilSeed: key => calls.push({kind:'seed', key}),
  });
  for (const file of ['config', 'characters']) {
    const path = `src/last-bread/${file}.js`;
    if (fs.existsSync(path)) vm.runInContext(fs.readFileSync(path,'utf8'),ctx,{filename:path});
  }
  return {ctx, calls, Bread: vm.runInContext('typeof Bread === "undefined" ? {} : Bread',ctx)};
}
const plain = x => JSON.parse(JSON.stringify(x));
const species = ['tuantuan','jiujiao'];
const views = ['front','q','side','qback','back'];
function finite(value) {
  if (typeof value === 'number') assert.ok(Number.isFinite(value));
  else if (value && typeof value === 'object') Object.values(value).forEach(finite);
}

// Catches a missing public API rather than an import/setup error.
test('character API is available to a classic-script consumer', () => {
  const {Bread} = load();
  for (const key of ['characterGeometry','drawTuantuan','drawJiuJiao']) assert.equal(typeof Bread[key],'function',key);
});
test('all five views and both facing directions produce finite articulated geometry', () => {
  const {Bread} = load();
  for (const s of species) for (const view of views) for (const flip of [false,true]) {
    const g = Bread.characterGeometry(s,{x:960,y:800,u:42,view,flip,bodyRot:.2,squash:.1});
    finite(g);
    assert.ok(g.layers.length > 12, `${s} ${view} has layered drawing`);
    assert.equal(g.anchors.feet.length,2);
    assert.equal(new Set(g.layers.map(x=>x.id)).size,g.layers.length);
    for (const l of g.layers) assert.ok(l.points.length>=2);
    if (view==='back') assert.equal(g.layers.some(l=>l.id.includes('eye')),false);
    if (s==='jiujiao') { assert.equal('hands' in g.anchors,false); assert.equal(g.anchors.beak.length,2); }
    else { assert.equal(g.anchors.hands.length,2); assert.equal(g.anchors.apron.length,2); }
  }
});
test('views genuinely alter contours and rear views hide front clothing and eyes',()=>{
  const {Bread}=load();
  for (const s of species) {
    const silhouettes=views.map(view=>Bread.characterGeometry(s,{view}).layers.filter(l=>['head','body'].includes(l.id)).map(l=>l.points));
    assert.equal(new Set(silhouettes.map(JSON.stringify)).size,5);
    assert.ok(!Bread.characterGeometry(s,{view:'back'}).layers.some(l=>/muzzle|pocket|eye/.test(l.id)));
  }
});
test('geometry is pure, repeatable and unaffected by evaluation order',()=>{
  const {Bread}=load();
  for (const s of species) {
    const pose={x:51,y:87,u:23,view:'q',flip:true,bodyRot:.4,squash:.2,legPhase:1.1,armL:.5,wingR:1.3,mood:'surprised'};
    const original=plain(pose), a=plain(Bread.characterGeometry(s,pose));
    Bread.characterGeometry(s,{view:'back',legPhase:6});
    assert.deepEqual(plain(Bread.characterGeometry(s,pose)),a);
    assert.deepEqual(pose,original);
  }
});
test('arms, wings and legs articulate without moving the torso',()=>{
  const {Bread}=load();
  for (const [s,control,part] of [['tuantuan','armL','armL'],['tuantuan','armR','armR'],['jiujiao','wingL','wingL'],['jiujiao','wingR','wingR'],['tuantuan','legPhase','legL'],['jiujiao','legPhase','legL']]) {
    const a=Bread.characterGeometry(s,{view:'q'}), b=Bread.characterGeometry(s,{view:'q',[control]:.8});
    const layer=(g,id)=>plain(g.layers.find(l=>l.id===id).points);
    assert.notDeepEqual(layer(a,part),layer(b,part),control);
    assert.deepEqual(layer(a,'body'),layer(b,'body'),control);
    if(control==='legPhase') assert.notDeepEqual(plain(a.anchors.feet),plain(b.anchors.feet));
    if(control.startsWith('arm')) assert.notDeepEqual(plain(a.anchors.hands),plain(b.anchors.hands));
  }
});
test('anchors and visible geometry share world translation, scale, flip, squash and rotation',()=>{
  const {Bread}=load();
  for(const s of species) {
    const a=Bread.characterGeometry(s,{u:1});
    const b=Bread.characterGeometry(s,{x:10,y:20,u:2,flip:true,bodyRot:Math.PI/2,squash:.25});
    const expected=([x,y])=>[10-y*1.5,20-x*2.5];
    const near=(actual,want)=>actual.forEach((v,i)=>assert.ok(Math.abs(v-want[i])<1e-8));
    for(const key of Object.keys(a.anchors)) {
      if (key==='beak') near(b.anchors[key],expected(a.anchors[key]));
      else a.anchors[key].forEach((point,i)=>near(b.anchors[key][i],expected(point)));
    }
    a.layers.forEach((l,i)=>l.points.forEach((p,j)=>near(b.layers[i].points[j],expected(p))));
  }
});
test('hands, apron corners, beak and feet coincide with drawn attachment landmarks',()=>{
  const {Bread}=load();
  for(const s of species) for(const view of views) {
    const g=Bread.characterGeometry(s,{view,armL:.4,legPhase:.8,wingR:1});
    const points=id=>g.layers.find(l=>l.id===id).points;
    const contains=(ps,p)=>ps.some(q=>q.every((n,i)=>Math.abs(n-p[i])<1e-8));
    g.anchors.feet.forEach((p,i)=>assert.ok(contains(points(i?'footR':'footL'),p)));
    if(s==='jiujiao') {if(g.layers.some(l=>l.id==='beak'))assert.ok(contains(points('beak'),g.anchors.beak));}
    else {
      g.anchors.hands.forEach((p,i)=>assert.ok(contains(points(i?'armR':'armL'),p)));
      if(g.layers.some(l=>l.id==='apron'))g.anchors.apron.forEach(p=>assert.ok(contains(points('apron'),p)));
    }
  }
});
test('expressions, gaze, tail and paper hat have independent visible controls',()=>{
  const {Bread}=load();
  const subset=(s,p,pattern)=>plain(Bread.characterGeometry(s,p).layers.filter(l=>pattern.test(l.id)));
  for(const s of species) {
    assert.notDeepEqual(subset(s,{},/eye|mouth/),subset(s,{mood:'surprised'},/eye|mouth/));
    assert.notDeepEqual(subset(s,{},/pupil/),subset(s,{lookX:.8,lookY:-.5},/pupil/));
  }
  assert.notDeepEqual(subset('tuantuan',{},/tail/),subset('tuantuan',{tailAngle:.5},/tail/));
  assert.notDeepEqual(subset('jiujiao',{},/hat/),subset('jiujiao',{hatDrop:.8},/hat/));
});
test('draw uses geometry in order and stable species/part boil seeds',()=>{
  const {Bread,calls}=load();
  for(const [s,draw] of [['tuantuan','drawTuantuan'],['jiujiao','drawJiuJiao']]) {
    calls.length=0;
    const pose={x:100,y:300,u:30,view:'q'}, g=Bread.characterGeometry(s,pose);
    const returned=Bread[draw](pose);
    assert.deepEqual(plain(returned),plain(g));
    let cursor=0;
    for(const l of g.layers){
      assert.equal(calls[cursor++].key,`bread/${s}/${l.id}`);
      if(l.kind==='paint'){
        assert.equal(calls[cursor++].kind,'flush','flush deferred masks before opaque base');
        const base=calls[cursor++];assert.equal(base.kind,'base');assert.equal(base.color,l.base);assert.deepEqual(plain(base.points),plain(l.points));
      }
      const mark=calls[cursor++];assert.deepEqual(plain(mark.points),plain(l.points));assert.equal(mark.kind,l.kind==='line'?'line':'paint');
    }
    assert.equal(cursor,calls.length);
  }
});
test('breadViews loop draws five angles and both facing directions, with five-second contract',()=>{
  const {ctx,calls}=load();
  assert.equal(ctx.LOOPS.breadViews.len,5);
  const frames=[];
  for(let t=0;t<5;t++) {calls.length=0;ctx.LOOPS.breadViews(t);frames.push(JSON.stringify(calls));assert.ok(calls.length>100);}
  assert.equal(new Set(frames).size,5);
});
test('invalid species, view and singular or non-finite poses fail with clear errors',()=>{
  const {Bread}=load();
  assert.throws(()=>Bread.characterGeometry('unknown'),/Unknown Bread species/);
  assert.throws(()=>Bread.characterGeometry('tuantuan',{view:'unknown'}),/Unknown Bread view/);
  for(const p of [{u:0},{u:-2},{squash:1},{squash:-1}]) assert.throws(()=>Bread.characterGeometry('tuantuan',p),/u must be positive/);
  for(const key of ['x','y','u','bodyRot','squash','armL','wingR','legPhase','lookX','hatDrop']) assert.throws(()=>Bread.characterGeometry('jiujiao',{[key]:NaN}),/Non-finite pose/);
});
test('standalone HTML registers its loop with unchanged core/timeline and exposes a 1080p film',()=>{
  // Execute the actual local classic scripts in document order. WebGL setup is intentionally not invoked.
  const html=fs.readFileSync('last-bread.html','utf8');
  const window={},context=vm.createContext({window,console,URLSearchParams,location:{search:'?loop=breadViews'}});
  for(const tag of html.matchAll(/<script(?:\s+src="([^"]+)")?>([\s\S]*?)<\/script>/g)) {
    const [,src,inline]=tag;
    if(src?.startsWith('node_modules/')) continue; // external browser libraries, not project scripts
    vm.runInContext(src?fs.readFileSync(src,'utf8'):inline,context,{filename:src||'entry-inline'});
  }
  assert.equal(window.film.width,1920);
  assert.equal(window.film.height,1080);
  assert.equal(window.film.fps,24);
  assert.equal(window.film.duration,5);
  assert.equal(typeof window.LOOP,'function');
  assert.equal(typeof window.renderAt,'function');
});
test('rear art omits hidden bib and beak instead of relying on translucent occlusion',()=>{
 const {Bread}=load();
 const back=Bread.characterGeometry('tuantuan',{view:'back'});
 assert.equal(back.layers.some(l=>l.id==='apron'),false,'back must not paint the front bib');
 assert.ok(back.layers.some(l=>l.id==='apron/back-straps'));
 for(const view of ['back','qback'])assert.equal(Bread.characterGeometry('jiujiao',{view}).layers.some(l=>l.id==='beak'),false,'rear head must not paint hidden beak');
});
test('opaque underpaint provides facial silhouette while watercolor remains a restrained overlay',()=>{
 const {Bread}=load();const g=Bread.characterGeometry('tuantuan',{view:'front'});
 for(const id of ['body','head','mask0','eye0/pupil','nose']){
  const l=g.layers.find(l=>l.id===id);assert.equal(typeof l.base,'string',id+' needs opaque material');assert.equal(l.style.wash,undefined,'no second opaque-looking deferred wash');assert.ok(l.style.fillOp>0&&l.style.fillOp<=32);
 }
 const body=g.layers.find(l=>l.id==='body').points;
 const width=Math.max(...body.map(p=>p[0]))-Math.min(...body.map(p=>p[0]));const height=Math.max(...body.map(p=>p[1]))-Math.min(...body.map(p=>p[1]));assert.ok(width/height>1.1,'pear torso should be broader than tall');
 const bird=Bread.characterGeometry('jiujiao');assert.ok(bird.layers.find(l=>l.id==='legL').style.sw>=.5);
});
