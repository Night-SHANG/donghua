const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const engine=process.env.HUASHU_ENGINE||'/tmp/animation-trials/huashu/skill/scripts/engine';
const ctx={window:{},SCENES:{},console};ctx.window=ctx;vm.createContext(ctx);vm.runInContext(fs.readFileSync(path.join(engine,'lib/three.min.js'),'utf8'),ctx);vm.runInContext(fs.readFileSync(path.join(__dirname,'../engine/wind_montage/world.js'),'utf8'),ctx);
const T=ctx.THREE,api=ctx.WIND_MONTAGE,samples=[];
for(let frame=0;frame<=900;frame++){
const t=frame/60,s=api.state(t),camera=new T.PerspectiveCamera(s.fov,16/9,.08,90);camera.position.set(...s.camera);camera.lookAt(...s.target);camera.updateMatrixWorld();const v=new T.Vector3(...s.position).project(camera);s.screen=[(v.x+1)*960,(1-v.y)*540];const mat=new T.Matrix4().makeRotationFromEuler(new T.Euler(...s.rotation));let projected=[];for(const q of [[-.43,0,0],[.43,0,0],[0,0,-.925],[0,0,.925]]){const v=new T.Vector3(...q).applyMatrix4(mat).add(new T.Vector3(...s.position)).project(camera);projected.push([(v.x+1)*960,(1-v.y)*540]);}s.projectedSize=Math.max(...projected.map(p=>p[0]))-Math.min(...projected.map(p=>p[0]));s.frame=frame;s.sceneId=s.scene;s.cameraFov=s.fov;
assert([...s.position,...s.rotation,...s.camera,...s.screen].every(Number.isFinite));assert(v.z<1&&v.z>-1,'leaf depth visible');assert(s.screen[0]>80&&s.screen[0]<1840&&s.screen[1]>50&&s.screen[1]<1030,`leaf center framed ${frame} ${s.screen}`);samples.push(s);
}
const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));let metrics=[];
for(let shot=0;shot<4;shot++){let rows=samples.filter(s=>s.shot===shot),maxPositionStep=0,maxRotationStep=0,maxCameraStep=0,screenTravel=0;
for(let i=1;i<rows.length;i++){maxPositionStep=Math.max(maxPositionStep,dist(rows[i].position,rows[i-1].position));maxRotationStep=Math.max(maxRotationStep,dist(rows[i].rotation,rows[i-1].rotation));maxCameraStep=Math.max(maxCameraStep,dist(rows[i].camera,rows[i-1].camera));screenTravel+=dist(rows[i].screen,rows[i-1].screen);}
let verticalRange=Math.max(...rows.map(s=>s.screen[1]))-Math.min(...rows.map(s=>s.screen[1])),rotationRange=Math.max(...[0,1,2].map(k=>Math.max(...rows.map(s=>s.rotation[k]))-Math.min(...rows.map(s=>s.rotation[k]))));assert(maxPositionStep<.09);assert(maxRotationStep<.11);assert(maxCameraStep<.04);assert(screenTravel>200,`visible screen travel ${shot}`);assert(verticalRange>65,`visible wind height ${shot}`);metrics.push({sceneId:rows[0].scene,screenTravel,verticalRange,rotationRange,maxPositionStep,maxRotationStep,maxCameraStep});}
assert(metrics[0].rotationRange>2.5);assert(metrics[2].rotationRange>6.28,'autumn complete roll');assert(new Set(samples.map(s=>s.scene)).size===4);
// Environment-only revision: lock the accepted leaf, cameras, cuts and audio.
const crypto=require('crypto'),sha256=x=>crypto.createHash('sha256').update(x).digest('hex');
function canonical(v){if(typeof v==='number')return Math.round(v*1e10)/1e10;if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])]));return v;}
const lock=JSON.parse(fs.readFileSync(path.join(__dirname,'approved-motion-lock.json'),'utf8'));
assert.equal(lock.schema,1);assert.equal(lock.samples,901);assert.equal(lock.roundingDecimals,10);
const sampleHash=sha256(JSON.stringify(canonical(samples)));
assert.equal(sampleHash,lock.samplesSha256,'Approved 901-frame leaf/camera/material/projection states changed');
const source=fs.readFileSync(path.join(__dirname,'../engine/wind_montage/world.js'),'utf8');
const lockedParts={point:source.match(/function point\(u,v,s\)\{[^\n]+/)[0],heroGeometry:source.slice(source.indexOf('// One connected leaf surface'),source.indexOf('const pg=new T.BufferGeometry()')),heroDraw:source.match(/function draw\(c,lt,t\)\{[^\n]+/)[0],topology:source.match(/const NX=\d+,NY=\d+;/)[0]};
for(const [name,value]of Object.entries(lockedParts))assert.equal(sha256(value),lock.heroSourceSha256[name],`Approved hero source changed: ${name}`);
for(const [file,hash]of Object.entries(lock.lockedFiles))assert.equal(sha256(fs.readFileSync(path.join(__dirname,'..',file))),hash,`Approved cuts/audio changed: ${file}`);
const motionLockProof={schema:1,passed:true,frames:901,roundingDecimals:10,samplesSha256:sampleHash,approvedSource:lock.approvedSource,lockedHeroParts:Object.keys(lockedParts),lockedFiles:Object.keys(lock.lockedFiles)};
if(process.env.STATE_REPORT)fs.writeFileSync(path.join(path.dirname(process.env.STATE_REPORT),'approved-motion-lock-proof.json'),JSON.stringify(motionLockProof,null,2));
console.log('PASS: approved 901-state leaf/camera lock, hero source, cut timeline and audio hashes unchanged.');

// Real geometry rays, not only a screen-position claim. Center plus 4 interior
// surface points are tested at every frame. This is a sparse surface audit, not
// complete pixel occlusion proof; atmospheric transparent geometry is excluded.
assert.equal(typeof api.auditEnvironment,'function','Offline real geometry audit API required');
const audit=api.auditEnvironment();assert.equal(audit.sets.length,4);
const uv=[[0,.5],[-.65,.5],[.65,.5],[0,.2],[0,.8]],ray=new T.Raycaster(),occluders=audit.sets.map(w=>{
  const list=[];w.scene.traverse(o=>{if(!o.isMesh)return;for(let p=o;p;p=p.parent)if(p===w.leaf)return;
    const materials=Array.isArray(o.material)?o.material:[o.material];
    if(materials.some(m=>m&&m.visible!==false&&!m.transparent&&(m.opacity===undefined||m.opacity>=.98)))list.push(o);});
  assert(list.length>0,'Missing actual opaque environment geometry');return list;
});
let blockedRays=0,blockedCenters=0,maxBlockedPerFrame=0,firstFailures=[],byShot=[0,0,0,0];
for(const s of samples){const w=audit.sets[s.shot];if(w.updateEnv)w.updateEnv(s.localTime);w.scene.updateMatrixWorld(true);
  const transform=new T.Matrix4().makeRotationFromEuler(new T.Euler(...s.rotation)),origin=new T.Vector3(...s.camera);let blocked=0;
  for(let k=0;k<uv.length;k++){const p=new T.Vector3(...audit.point(...uv[k],s)).applyMatrix4(transform).add(new T.Vector3(...s.position));const direction=p.clone().sub(origin),distance=direction.length();
    ray.set(origin,direction.normalize());ray.near=.001;ray.far=Math.max(.001,distance-.015);
    const hits=ray.intersectObjects(occluders[s.shot],false).filter(hit=>{for(let p=hit.object;p;p=p.parent)if(p.visible===false)return false;return true;});
    if(hits.length){blocked++;blockedRays++;byShot[s.shot]++;if(k===0)blockedCenters++;if(firstFailures.length<16)firstFailures.push({frame:s.frame,t:s.t,scene:s.scene,point:k,distance:hits[0].distance,targetDistance:distance,object:hits[0].object.name||hits[0].object.type,instanceId:hits[0].instanceId??null});}
  }
  maxBlockedPerFrame=Math.max(maxBlockedPerFrame,blocked);
}
const occlusionProof={schema:1,passed:blockedCenters===0&&maxBlockedPerFrame<=1,frames:901,pointsPerFrame:5,rays:901*5,opaqueMeshesPerScene:occluders.map(x=>x.length),blockedRays,blockedCenters,maxBlockedPerFrame,byShot,firstFailures,
 scope:'Real Three ray intersections toward five actual deformed hero-surface points, all 901 frames; ignores transparent atmosphere and permits <=1 peripheral point but no blocked center. Not a per-pixel occlusion proof.'};
if(process.env.STATE_REPORT)fs.writeFileSync(path.join(path.dirname(process.env.STATE_REPORT),'environment-occlusion.json'),JSON.stringify(occlusionProof,null,2));
console.log(JSON.stringify(occlusionProof));
assert.equal(blockedCenters,0,'Opaque environment occludes the hero center');assert(maxBlockedPerFrame<=1,'Opaque environment covers multiple sampled hero surface points');
console.log('PASS: real environment geometry ray audit leaves hero center clear in all901 frames.');

const report={schema:1,passed:true,film:'wind_montage',duration:15,fps:60,cuts:[216,432,660],cutFrames:[216,432,660],motionLock:motionLockProof,environmentOcclusion:occlusionProof,limits:{maxPositionStep:.09,maxRotationStep:.11,maxCameraStep:.04,minScreenTravel:200,minVerticalRange:65},metrics,samples};if(process.env.STATE_REPORT)fs.writeFileSync(process.env.STATE_REPORT,JSON.stringify(report));console.log('PASS: four real shot states, 901 projections; visible wind, roll and camera-cut contracts.');console.log(JSON.stringify(metrics));
