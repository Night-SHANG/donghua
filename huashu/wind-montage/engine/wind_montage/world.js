/* Four physical sets, four cameras, one deforming leaf. Original native Three film. */
(()=>{
const cut=[0,3.6,7.2,11,15],ids=['spring','summer','autumn','winter'];
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},lerp=(a,b,q)=>a+(b-a)*q;
// Explicit timed gust/action keys. Cubic segment velocities preserve wind acceleration,
// while short overshoots and opposing vertical segments create stall and falling motion.
const paths=[
 [[0,-1.35,2.35,0],[.6,-1.24,2.42,0],[1.25,-.35,3.45,-.2],[1.65,.2,3.58,-.4],[2.1,-.1,3.18,-.35],[2.7,.8,2.55,-.55],[3.6,1.65,3.05,-1.2]],
 [[0,-2.2,1.25,0],[.6,-1.25,.65,-1.25],[1.3,.1,.43,-2.6],[1.9,1,.64,-3.25],[2.45,.5,1.25,-3.6],[3.6,2.3,2.2,-5.5]],
 [[0,-1.1,3.1,0],[.6,-.3,4.8,-.4],[1.1,.55,5.6,-.8],[1.7,1,5.7,-1],[2.2,.25,5.05,-1.1],[2.8,-.5,4.25,-1.5],[3.8,.7,3.35,-2]],
 [[0,-1.8,2.9,-.6],[.65,-.6,2.65,-.25],[1.25,.1,2.05,0],[1.85,-.45,1.4,.3],[2.45,.1,.8,.4],[3.2,.5,.11,.55],[3.45,.55,.16,.55],[4,.57,.1,.55]]
];
function sample(keys,t){let i=0;while(i<keys.length-2&&t>keys[i+1][0])i++;const a=keys[i],b=keys[i+1],p=keys[Math.max(0,i-1)],n=keys[Math.min(keys.length-1,i+2)],dt=b[0]-a[0],q=clamp((t-a[0])/dt),q2=q*q,q3=q2*q;return [1,2,3].map(k=>{const va=(b[k]-p[k])/(b[0]-p[0]),vb=(n[k]-a[k])/(n[0]-a[0]);return (2*q3-3*q2+1)*a[k]+(q3-2*q2+q)*dt*va+(-2*q3+3*q2)*b[k]+(q3-q2)*dt*vb;});}
function state(t){t=Math.max(0,Math.min(15,t));let shot=t<3.6?0:t<7.2?1:t<11?2:3,l=t-cut[shot],position=sample(paths[shot],l),rotation,camera,target,fov;
if(shot===0){rotation=[.75+.32*Math.sin(l*5)*ease(l/.6),.3+1.7*ease((l-.6)/1.5),-.2+.25*Math.sin(l*7)*(1-ease(l/.6))+2.9*ease((l-1.8)/1.8)];camera=[.7-l*.09,3.15,5.5-l*.2];target=[.05,2.9,-.25];fov=44;}
if(shot===1){rotation=[.35+.45*Math.sin(l*3.5),.5+l*.6,.15+.65*Math.sin(l*2.2)];camera=[-3+l*.55,1.18,5-l*.8];target=[.2,1,-2];fov=58;}
if(shot===2){rotation=[.8+.35*Math.sin(l*4),-.4+l*.9,.1+Math.PI*2.35*ease(l/3.4)];camera=[2.6-l*.35,1.2,-.5+l*.3];target=[.2,4.65,-1.4];fov=60;}
if(shot===3){const settle=ease((l-2.7)/.7);rotation=[lerp(.45+.48*Math.sin(l*4.4),0,settle),.3+l*.3,lerp(.55*Math.sin(l*4.2),0,settle)];camera=[4.8+l*.3,3.9+l*.35,7.5+l*.4];target=[0,1,0];fov=47;}
const leafColor=[[.36,.68,.10],[.08,.36,.035],[.85,.22,.025],[.26,.12,.045]][shot];return {t,shot,scene:ids[shot],localTime:l,position,rotation,camera,target,fov,leafColor,curl:[.045,.07,.17,.22][shot],frost:shot===3?.38:0,seasonWeights:[0,1,2,3].map(i=>+(i===shot))};}
let R,sets=[],active=0;const NX=20,NY=40;
function point(u,v,s){let w=Math.pow(Math.sin(Math.PI*v),.72)*.43,z=(v-.5)*1.85;return [u*w,.035*Math.sin(v*Math.PI)+s.curl*(u*u*.38+v*v*.36)+.045*Math.sin(v*8-s.localTime*6)*Math.abs(u),z];}
const API=window.WIND_MONTAGE={state,cutFrames:[216,432,660],diagnostics(){if(!R)return {initialized:false};const gl=R.getContext(),ext=gl.getExtension('WEBGL_debug_renderer_info');return {renderer:'three-webgl',revision:THREE.REVISION,cameraType:sets[active].camera.type,sceneCount:sets.length,activeScene:ids[active],sceneId:ids[active],sceneUUID:sets[active].scene.uuid,cameraUUID:sets[active].camera.uuid,webgl:{version:gl.getParameter(gl.VERSION),renderer:ext?gl.getParameter(ext.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER),contextLost:gl.isContextLost()},renderSize:[1280,720],drawCalls:R.info.render.calls,triangles:R.info.render.triangles};}};window.SEASONS_LEAF_3D=API;API.auditEnvironment=()=>({sets:[0,1,2,3].map(build),point});
// Authored botanical environment: instance-batched twigs, petals and leaves, not crown balls.
function build(shot){const T=THREE,S=new T.Scene(),C=new T.PerspectiveCamera(47,16/9,.08,90);
const bg=['#e7deda','#b9d9d2','#eed9b5','#d6dfeb'][shot];S.background=new T.Color(bg);S.fog=new T.Fog(bg,15,58);
// A soft vertex-colored sky, not an image plate: camera rotation sees the dome.
const skyGeo=new T.SphereGeometry(72,32,20),skyColors=[],skyP=skyGeo.attributes.position;
const skyTop=new T.Color(['#aecdd9','#91c6d6','#c2d5df','#a7bed9'][shot]),skyHorizon=new T.Color(['#f4e7de','#e6ead8','#f7e5c7','#eee4e3'][shot]);
for(let i=0;i<skyP.count;i++){let blend=Math.pow(Math.max(0,skyP.getY(i)/72),.7),color=skyHorizon.clone().lerp(skyTop,blend);skyColors.push(color.r,color.g,color.b);}skyGeo.setAttribute('color',new T.Float32BufferAttribute(skyColors,3));const sky=new T.Mesh(skyGeo,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide,fog:false,depthWrite:false}));sky.name='sky-dome';sky.renderOrder=-100;S.add(sky);
S.add(new T.HemisphereLight(['#fff2e9','#e4f8ee','#ffebc6','#edf4ff'][shot],['#64785e','#375e59','#67513e','#8693b0'][shot],1.5));
const sun=new T.DirectionalLight(['#ffe5cf','#fff2cb','#ffd08b','#fff2dc'][shot],2.35);sun.position.set(-7,12,5);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-15,right:15,top:15,bottom:-15,near:.1,far:50});sun.shadow.normalBias=.035;S.add(sun);S.add(sun.target);
const fill=new T.DirectionalLight(['#e1e9ff','#c6e4ff','#d8e7ff','#bcd5ff'][shot],.55);fill.position.set(6,5,-8);S.add(fill);
let seed=3481+shot*132;const rnd=()=>{seed=(1664525*seed+1013904223)>>>0;return seed/4294967296};const mat=(col,r=.8)=>new T.MeshStandardMaterial({color:col,roughness:r});
const bark=mat(shot===3?'#666779':'#746153'),snow=mat('#e7edf5'),twigRows=[],snowRows=[],foliageRows=[],petalRows=[],grassRows=[];
const dummy=new T.Object3D(),up=new T.Vector3(0,1,0);
function mesh(g,m,p,scale){const o=new T.Mesh(g,m);o.position.set(...p);if(scale)o.scale.set(...scale);o.castShadow=true;o.receiveShadow=true;S.add(o);return o;}
function segment(a,b,r,rows=twigRows){let av=new T.Vector3(...a),bv=new T.Vector3(...b),d=bv.clone().sub(av);dummy.position.copy(av.add(bv).multiplyScalar(.5));dummy.quaternion.setFromUnitVectors(up,d.clone().normalize());dummy.scale.set(r,d.length(),r);dummy.updateMatrix();rows.push(dummy.matrix.clone());}
function item(rows,p,scale,rot){dummy.position.set(...p);dummy.rotation.set(...rot);dummy.scale.set(...scale);dummy.updateMatrix();rows.push(dummy.matrix.clone());}
function batch(geo,material,rows,name){if(!rows.length)return null;const o=new T.InstancedMesh(geo,material,rows.length);rows.forEach((m,i)=>{o.setMatrixAt(i,m);if(name==='botanical-leaves'||name==='five-petal-blossoms'){const cc=new T.Color(name==='five-petal-blossoms'?['#f5dce3','#e4a6bf','#fff0e6'][i%3]:shot===2?['#e8bd67','#c9883b','#e3a449','#f3d593'][i%4]:['#72a17c','#a4bc7c','#5b927c'][i%3]);o.setColorAt(i,cc);}});o.name=name;o.castShadow=name==='twigs';o.receiveShadow=true;S.add(o);return o;}
// Curved botanical blade with 12 triangles; a convex center catches directional light.
function bladeGeometry(){const g=new T.BufferGeometry(),p=[],ind=[];for(let j=0;j<=4;j++){let t=j/4,w=Math.sin(Math.PI*t)*.5;for(let side=-1;side<=1;side++)p.push(side*w,t,.1*Math.sin(Math.PI*t)*(1-Math.abs(side)));}for(let j=0;j<4;j++)for(let k=0;k<2;k++){let q=j*3+k;ind.push(q,q+1,q+3,q+1,q+4,q+3);}g.setAttribute('position',new T.Float32BufferAttribute(p,3));g.setIndex(ind);g.computeVertexNormals();return g;}
const botan=bladeGeometry();
function crownTip(p,size){if(shot===3)return;let count=shot===0?8:22;for(let j=0;j<count;j++){let angle=rnd()*6.283,rad=Math.sqrt(rnd())*size,q=[p[0]+Math.cos(angle)*rad,p[1]+(rnd()-.5)*size*.65,p[2]+Math.sin(angle)*rad];if(shot===0){for(let k=0;k<5;k++)item(petalRows,q,[.095,.16,.12],[rnd()*.7+.8,k*1.256,rnd()*6.28]);}else item(foliageRows,q,[.22+rnd()*.22,.35+rnd()*.3,1],[rnd()*2,angle,rnd()*6.28]);}}
function tree(x,z,h,spread){const base=[x,0,z],top=[x+.2,h,z-.15];segment(base,top,.16+h*.015);for(let j=0;j<9;j++){let t=.35+j*.065,ang=j*2.399+rnd()*.4,r=spread*(.6+rnd()*.4),a=[x+.2*t,h*t,z-.15*t],b=[x+Math.cos(ang)*r,h*(t+.16),z+Math.sin(ang)*r];segment(a,b,.055+(1-t)*.065);if(shot===3)segment([a[0],a[1]+.065,a[2]],[b[0],b[1]+.065,b[2]],.075,snowRows);
for(let k=0;k<4;k++){let q=.45+k*.16,c=a.map((v,i)=>v+(b[i]-v)*q),aa=ang+(k%2?-.7:.7),e=[c[0]+Math.cos(aa)*spread*.38,c[1]+.35+rnd()*.4,c[2]+Math.sin(aa)*spread*.38];segment(c,e,.018+(1-q)*.025);if(shot===3)segment([c[0],c[1]+.035,c[2]],[e[0],e[1]+.035,e[2]],.035,snowRows);crownTip(e,spread*.38);}}
}
function terrain(w,d,x,z,y,color,height){const g=new T.PlaneGeometry(w,d,48,48);g.rotateX(-Math.PI/2);const p=g.attributes.position;for(let i=0;i<p.count;i++){const xx=p.getX(i)+x,zz=p.getZ(i)+z;let yy=height*(.55+.25*Math.sin(xx*.24+zz*.17)+.2*Math.cos(zz*.34-xx*.11));p.setY(i,yy);}g.computeVertexNormals();let o=mesh(g,mat(color),[x,y,z]);o.name='terrain';return o;}
// Deep landscape layers are real curved terrain, visible through botanical silhouettes.
terrain(85,65,0,-15,shot===1?-8:-.18,['#aeb990','#779d82','#b18c60','#e5e9ef'][shot],shot===3?.10:.12);
for(let layer=0;layer<3;layer++)terrain(70,15,0,-26-layer*11,[-.1,-.2,0,0][shot],['#a4b8a9','#94b9ae','#b1a68e','#bacadc'][shot],2.2+layer*1.8);
let water,rings=[],waterUniform={value:0};
if(shot===0){
// Close flowering bough stays behind the approved detachment pose.
segment([-4,1.1,-.5],[-1.35,2.98,-.68],.065);for(let j=0;j<8;j++){let q=j/8,a=[-3.9+q*2.1,1.2+q*1.5,-.65],b=[a[0]-.28,a[1]+.45,a[2]-.23];segment(a,b,.018);crownTip(b,.25);}
for(let i=0;i<19;i++){let x=-14+(i%7)*4.4+(rnd()-.5),z=-5-Math.floor(i/7)*7-rnd()*2;tree(x,z,4+rnd()*3.6,1.7+rnd()*.7);}
}
if(shot===1){
// Clear winding water corridor, layered banks and mirror geometry below the surface.
for(const sign of [-1,1]){terrain(10,35,sign*10,-10,-.05,'#668a64',.7);for(let i=0;i<9;i++)tree(sign*(6.3+rnd()*6),-3-i*3,5+rnd()*3,1.7);}
const wg=new T.PlaneGeometry(28,58,90,130);wg.rotateX(-Math.PI/2);const wm=new T.MeshStandardMaterial({color:'#71b0aa',roughness:.23,metalness:.18,transparent:true,opacity:.67,side:T.DoubleSide});
wm.onBeforeCompile=sh=>{sh.uniforms.envTime=waterUniform;sh.vertexShader='uniform float envTime; varying vec3 waterPos;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n transformed.y += .022*sin(position.x*2.8+envTime*1.3)+.016*sin(position.z*3.7-envTime); waterPos=position;');sh.fragmentShader='uniform float envTime; varying vec3 waterPos;\n'+sh.fragmentShader.replace('#include <normal_fragment_begin>','#include <normal_fragment_begin>\n normal = normalize(normal + vec3(.10*cos(waterPos.x*2.8+envTime*1.3),.05*cos(waterPos.z*3.7-envTime),0.));').replace('#include <color_fragment>','#include <color_fragment>\n float glint=pow(max(0.,sin(waterPos.x*3.1+sin(waterPos.z*2.)+envTime)*sin(waterPos.z*9.-envTime)),18.); diffuseColor.rgb += vec3(.18,.21,.16)*glint;');};wm.customProgramCacheKey=()=> 'season-water-v1';water=mesh(wg,wm,[0,0,-12]);water.castShadow=false;water.receiveShadow=true;
for(let i=0;i<7;i++){let ring=mesh(new T.RingGeometry(.45,.47,64),new T.MeshBasicMaterial({color:'#d5f6e7',transparent:true,opacity:.35,side:T.DoubleSide,depthWrite:false}),[0,.04,-2]);ring.rotation.x=-Math.PI/2;rings.push(ring);}
}
if(shot===2){for(let i=0;i<20;i++){let a=i/20*6.283,r=6.8+rnd()*3;tree(Math.cos(a)*r,Math.sin(a)*r,7.8+rnd()*3,2.5+rnd()*.6);}}
if(shot===3){
// Sculpted snowbanks frame an untouched flat landing pocket around the hero.
terrain(22,18,-11,-9,-.2,'#d9e2ed',1.7);terrain(19,22,11,-12,-.3,'#e4e9ef',1.9);
for(let i=0;i<29;i++){let x=-22+(i%10)*4.8+(rnd()-.5)*1.2,z=-7-Math.floor(i/10)*8-rnd()*3;tree(x,z,4+rnd()*4.5,1.5+rnd()*.8);}
}
// Fine ground growth, only outside the protected center corridor.
if(shot!==2)for(let i=0;i<1900;i++){let x=(rnd()-.5)*34,z=3-rnd()*33;if(shot===1&&Math.abs(x)<5)continue;if(shot===3&&Math.abs(x)<4&&z>-5)continue;item(grassRows,[x,shot===3?.05:.1,z],[.035,.15+rnd()*.46,1],[0,rnd()*6.28,(rnd()-.5)*.5]);}
const twigMesh=batch(new T.CylinderGeometry(.65,1,1,6),bark,twigRows,'twigs');batch(new T.CylinderGeometry(.65,1,1,6),snow,snowRows,'snow-on-branches');
const leafMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.85,side:T.DoubleSide});const foliage=batch(botan,leafMat,foliageRows,'botanical-leaves');
const petalMat=new T.MeshStandardMaterial({color:'#ffffff',roughness:.8,side:T.DoubleSide});batch(botan,petalMat,petalRows,'five-petal-blossoms');
batch(botan,new T.MeshStandardMaterial({color:shot===3?'#b4becd':'#829d6c',side:T.DoubleSide,roughness:1}),grassRows,'bank-grasses');
if(shot===1){for(const source of [twigMesh,foliage])if(source){const reflected=source.clone();reflected.name='water-reflection';reflected.scale.y=-1;reflected.position.y=-.04;reflected.castShadow=false;reflected.receiveShadow=false;reflected.material=new T.MeshBasicMaterial({color:source===twigMesh?'#47635e':'#648f7c',transparent:true,opacity:.45,side:T.DoubleSide});S.add(reflected);}}
function updateEnv(t){waterUniform.value=t;}
// One connected leaf surface, veins are re-evaluated on the exact surface.
const geo=new T.BufferGeometry(),arr=[],cols=[],idx=[];for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){arr.push(0,0,0);cols.push(1,1,1);}for(let j=0;j<NY;j++)for(let i=0;i<NX;i++){let n=j*(NX+1)+i;idx.push(n,n+NX+1,n+1,n+1,n+NX+1,n+NX+2);}geo.setAttribute('position',new T.Float32BufferAttribute(arr,3));geo.setAttribute('color',new T.Float32BufferAttribute(cols,3));geo.setIndex(idx);const leaf=new T.Group(),lm=new T.MeshStandardMaterial({vertexColors:true,side:T.DoubleSide,roughness:shot===3?.85:.5}),blade=new T.Mesh(geo,lm);blade.castShadow=true;blade.receiveShadow=true;leaf.add(blade);S.add(leaf);
const vg=new T.BufferGeometry();vg.setAttribute('position',new T.Float32BufferAttribute(new Float32Array((40+144)*6),3));const veins=new T.LineSegments(vg,new T.LineBasicMaterial({color:['#5a7026','#b1bd53','#6a3817','#b8b4a0'][shot]}));leaf.add(veins);
const pg=new T.BufferGeometry(),pa=new Float32Array(75*3),seeds=Array.from({length:75},()=>[(rnd()-.5)*24,rnd()*8,(rnd()-.5)*28]);pg.setAttribute('position',new T.BufferAttribute(pa,3));const particles=new T.Points(pg,new T.PointsMaterial({color:['#f2cdd4','#e6f7c5','#e7b14d','#ffffff'][shot],size:shot===3?.065:.10,transparent:true,opacity:.65,depthWrite:false}));S.add(particles);
return {scene:S,camera:C,sun,leaf,geo,veins,vg,water,rings,pg,seeds,updateEnv};}
function init(){if(R)return;if(!window.THREE)throw Error('Missing native Three');R=new THREE.WebGLRenderer({antialias:true,preserveDrawingBuffer:true});R.setSize(1280,720);R.setPixelRatio(1);R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.outputColorSpace=THREE.SRGBColorSpace;R.toneMapping=THREE.ACESFilmicToneMapping;R.toneMappingExposure=1.05;sets=[0,1,2,3].map(build);}
function draw(c,lt,t){init();const s=state(t===undefined?lt:t),l=s.localTime;active=s.shot;const w=sets[active],a=w.geo.attributes.position,col=w.geo.attributes.color;for(let j=0;j<=NY;j++)for(let i=0;i<=NX;i++){let u=i/NX*2-1,v=j/NY,k=j*(NX+1)+i;a.setXYZ(k,...point(u,v,s));const frost=s.frost*ease((Math.abs(u)-.7)/.3),mott=.93+.06*Math.sin(i*2+j*.8);col.setXYZ(k,...s.leafColor.map(q=>lerp(q*mott,.82,frost)));}a.needsUpdate=true;col.needsUpdate=true;w.geo.computeVertexNormals();let va=w.vg.attributes.position,n=0;function seg(u,v,x,y){for(const [uu,vv]of [[u,v],[x,y]]){let p=point(uu,vv,s);va.setXYZ(n++,p[0],p[1]+.008,p[2]);}}for(let j=0;j<40;j++)seg(0,j/40,0,(j+1)/40);for(let j=1;j<=6;j++)for(let side of [-1,1])for(let k=0;k<12;k++)seg(side*k/12,j/8-k/12*.12,side*(k+1)/12,j/8-(k+1)/12*.12);va.needsUpdate=true;w.leaf.position.set(...s.position);w.leaf.rotation.set(...s.rotation);w.camera.position.set(...s.camera);w.camera.fov=s.fov;w.camera.updateProjectionMatrix();w.camera.lookAt(...s.target);
for(let i=0;i<w.rings.length;i++){const age=(l*1.5+i*.3)%2.1,ring=w.rings[i];ring.scale.setScalar(.5+age*2);ring.material.opacity=(1-age/2.1)*.24;ring.position.x=s.position[0]*.25;}
const p=w.pg.attributes.position;w.seeds.forEach(([x,y,z],i)=>p.setXYZ(i,x+Math.sin(l*1.8+i)*(.3+.3*Math.sin(l)),((y-l*(active===3?.5:.2))%8+8)%8,z+l*.3));p.needsUpdate=true;w.updateEnv(l);R.render(w.scene,w.camera);c.drawImage(R.domElement,0,0,1920,1080);}
ids.forEach(id=>SCENES[id]={draw});
})();
