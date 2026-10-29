import React from 'react';

type V=[number,number,number];
type Face={p:V[];fill:string;stroke:string;width:number;bias:number};
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]];
const sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const mul=(a:V,s:number):V=>[a[0]*s,a[1]*s,a[2]*s];
const dot=(a:V,b:V)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
const cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=(a:V)=>mul(a,1/Math.sqrt(dot(a,a)));
export function RunnerScene({turn=false}:{turn?:boolean}){
const faces:Face[]=[];
const poly=(p:V[],fill='#faf9f5',stroke='#292b2e',width=1.3,bias=0)=>faces.push({p,fill,stroke,width,bias});
const line=(a:V,b:V,color='#414447',w=1,bias=0)=>poly([a,b],'none',color,w,bias);
function box(c:V,s:V,colors=['#eeeDE7','#faf9f5','#d8d9d5']){
 const [x,y,z]=c,[w,h,d]=s; const p:V[]=[[-w/2,0,-d/2],[w/2,0,-d/2],[w/2,h,-d/2],[-w/2,h,-d/2],[-w/2,0,d/2],[w/2,0,d/2],[w/2,h,d/2],[-w/2,h,d/2]].map(v=>add(v as V,[x,y,z]));
 for(const [i,q] of [[0,1,2,3],[4,7,6,5],[0,3,7,4],[1,5,6,2],[3,2,6,7]].entries())poly(q.map(n=>p[n]),colors[i===4?0:i%2?1:2]);
}
// A true perspective camera: both images project the same 3D street and rig.
const eye:V=turn?[-5.5,3.9,-7.7]:[4.2,1.65,7.4];
const aim:V=turn?[0,1.7,0.8]:[0,1.7,0];
const forward=unit(sub(aim,eye)),right=unit(cross(forward,[0,1,0])),up=cross(right,forward);
const focal=turn?1410:1400;
const project=(p:V)=>{const d=sub(p,eye),z=dot(d,forward);return {x:800+focal*dot(d,right)/z,y:477-focal*dot(d,up)/z,z};};
// Ground, raised sidewalks, repeating city blocks. Every vertex is world-space.
poly([[-50,-.08,-90],[50,-.08,-90],[50,-.08,90],[-50,-.08,90]],'#f3f2ec','none',0,1e5);
for(const x of [-6.9,6.9])for(let j=-12;j<=12;j++){if(j===0)continue;box([x,-.06,j*6],[4.6,.15,6],['#e6e6df','#eeeeE8','#c4c6c2']);}
for(const x of [-4.6,4.6]){line([x,.095,-80],[x,.095,-3],'#616664',1.9);line([x,.095,3],[x,.095,80],'#616664',1.9);}for(const z of [-3,3])for(const sign of [-1,1])line([sign*4.6,.095,z],[sign*30,.095,z],'#616664',1.9);
for(let z=-68;z<68;z+=3){if(Math.abs(z)<3)continue;
 for(const x of [-8,-6,6,8])line([x,.1,z],[x,.1,z+3],'#b6bab5',.7);
 for(const sign of [-1,1])line([sign*4.6,.1,z],[sign*9.2,.1,z],'#959c96',.9);
}
for(let z=-58;z<65;z+=7)poly([[-.075,.005,z],[.075,.005,z],[.075,.005,z+3],[-.075,.005,z+3]],'#d1d5ce','none');
// The intersecting street has its own orthogonal markings and opposite vanishing point.
for(const side of [-1,1])for(let x=6;x<42;x+=5)poly([[side*x,.012,-.065],[side*(x+2.2),.012,-.065],[side*(x+2.2),.012,.065],[side*x,.012,.065]],'#c5cdc4','none');
for(const side of [-1,1])for(let z=-2.1;z<2.5;z+=.85)poly([[side*5.2,.013,z],[side*7.1,.013,z],[side*7.1,.013,z+.36],[side*5.2,.013,z+.36]],'#d7dcd3','none');
// Road perspective tracks remain geometric rather than screen-space speed overlays.
for(const x of [-3.8,3.8])line([x,.007,-80],[x,.007,80],'#c9cec8',.8);
for(let j=-7;j<=7;j++)for(const side of [-1,1]){
 const z=j*8+1.5;if(j===0)continue;
 const x=side*(7.8+(Math.abs(j)%2)*.4),h=5.4+((j*j+3+(side+1))%5)*1.45,w=5.7,d=6.2;
 box([x,.1,z],[w,h,d]);
 // window recesses on street-facing wall (real 3D quads)
 const wx=x-side*(w/2+.012);
 for(let level=1;level<h-1;level+=1.6)for(let k=-1;k<=1;k++){
 const za=z+k*1.7;
 poly([[wx,level,za-.48],[wx,level+.88,za-.48],[wx,level+.88,za+.48],[wx,level,za+.48]],'#e0e3df','#727b76',.8,-.001);
 line([wx,level+.15,za-.48],[wx,level+.15,za+.48],'#b0b9b1',.7,-.002);
 }
 // Side-facing facade broad horizontal floor lines
 for(let level=1.1;level<h;level+=1.6)line([x-w/2,level,z+d/2+.01],[x+w/2,level,z+d/2+.01],'#aeb6ad',.8,-.005);
 box([x,.1+h,z],[w+.17,.12,d+.17],['#dddFD8','#f6f5ef','#bbc4b8']);
}
// Suspended cross-street wire and simple outlined sign.
line([-8,5.8,-13],[8,5.5,-13],'#5e6860',1.4);
box([-4.15,.1,-11],[.11,4.1,.11],['#555d56','#707970','#39433d']);
box([-3.7,3.55,-11],[1.05,.5,.12],['#faf9f5','#faf9f5','#d0d5ce']);
// Cast shadow, an actual polygon on the road plane.
poly([[-.4,.018,.65],[.15,.018,.95],[2.8,.018,-2.4],[2.45,.018,-2.7],[1.3,.018,-1.9],[-.1,.018,.05]],'#d4d8d0','none');
// Runner local rig, coherent opposing stride; second pose banks into a turn.
const yaw=turn?-.5:0,lean=turn?.16:-.035;
const tr=(v:V):V=>{let [x,y,z]=v;const xx=x+lean*(y-1.6);return [xx*Math.cos(yaw)+z*Math.sin(yaw),y,z*Math.cos(yaw)-xx*Math.sin(yaw)];};
function limb(a:V,b:V,r0:number,r1:number,fill='#faf9f5',sides=7){
 const axis=unit(sub(b,a)),u=unit(cross(axis,Math.abs(axis[1])>.92?[1,0,0]:[0,1,0])),v=cross(axis,u);
 const rings=[a,b].map((c,j)=>Array.from({length:sides},(_,i)=>add(c,add(mul(u,Math.cos(i*2*Math.PI/sides)*(j?r1:r0)),mul(v,Math.sin(i*2*Math.PI/sides)*(j?r1:r0))))));
 poly(rings[0].map(tr),fill,'#22272a',1.7);poly(rings[1].map(tr),fill,'#22272a',1.7);
 for(let i=0;i<sides;i++)poly([rings[0][i],rings[0][(i+1)%sides],rings[1][(i+1)%sides],rings[1][i]].map(tr),i%3===1&&fill==='#faf9f5'?'#e7e9e4':fill,'#39413f',.8);
}
function ellipsoid(c:V,r:V,fill='#faf9f5'){
 const n=12,m=6;const point=(i:number,j:number):V=>[c[0]+r[0]*Math.sin(j*Math.PI/m)*Math.cos(i*2*Math.PI/n),c[1]+r[1]*Math.cos(j*Math.PI/m),c[2]+r[2]*Math.sin(j*Math.PI/m)*Math.sin(i*2*Math.PI/n)];
 const edges=new Map<string,{a:V,b:V,visible:number,total:number}>();
 for(let j=0;j<m;j++)for(let i=0;i<n;i++){
 const local=[point(i,j),point(i+1,j),point(i+1,j+1),point(i,j+1)],q=local.map(tr),center=mul(q.reduce((a,b)=>add(a,b),[0,0,0] as V),.25);
 let normal=cross(sub(q[1],q[0]),sub(q[2],q[0]));if(dot(normal,normal)<1e-10)normal=cross(sub(q[2],q[0]),sub(q[3],q[0]));if(dot(normal,sub(center,tr(c)))<0)normal=mul(normal,-1);
 const visible=dot(normal,sub(eye,center))>0;
 if(visible)poly(q,fill,fill,.4);
 for(let e=0;e<4;e++){const a=q[e],b=q[(e+1)%4];const key=[a.map(n=>n.toFixed(6)).join(','),b.map(n=>n.toFixed(6)).join(',')].sort().join('|');const old=edges.get(key)||{a,b,visible:0,total:0};old.total++;old.visible+=Number(visible);edges.set(key,old);}
 }
 for(const edge of edges.values())if(edge.visible>0&&edge.visible<edge.total)line(edge.a,edge.b,'#333c3b',1.6,-.002);
}
// shoes and limb segments use consistent volumetric meshes, not a disconnected skeleton.
const hipL:V=[-.22,1.75,-.07],hipR:V=[.22,1.75,.02];
const kneeL:V=turn?[-.36,1.16,-.56]:[-.3,1.02,-.58],ankleL:V=turn?[-.52,1.14,-1.32]:[-.34,.84,-1.28];
const kneeR:V=turn?[.35,1.05,.65]:[.25,1.2,.83],ankleR:V=turn?[.46,.22,.9]:[.28,.29,.63];
limb(hipL,kneeL,.17,.115,'#272f31');limb(kneeL,ankleL,.105,.08);limb(hipR,kneeR,.18,.115,'#323b3b');limb(kneeR,ankleR,.105,.08);
function shoe(p:V){limb(add(p,[0,-.03,-.08]),add(p,[0,-.045,.34]),.13,.14,'#fcfbf5',6);limb(add(p,[0,-.12,-.08]),add(p,[0,-.135,.37]),.065,.08,'#373e3d',6);}
shoe(ankleL);shoe(ankleR);
// Torso leans forward into +Z, with the neck and head following the action line.
limb([0,1.72,0],[0,2.64,.34],.31,.4,'#faf9f5',8);
limb([0,2.57,.31],[0,2.88,.43],.12,.125,'#f4f3ed');
// jacket hem and collar give the character an intentional clean graphic design.
limb([0,1.72,0],[0,1.84,.04],.32,.32,'#d9ded7',8);
const sl:V=[-.35,2.55,.31],sr:V=[.35,2.55,.31],el:V=[-.53,2.03,.81],er:V=[.57,2.19,-.37],hl:V=[-.35,2.56,1.05],hr:V=[.46,1.88,-.7];
limb(sl,el,.15,.105);limb(el,hl,.105,.08);limb(sr,er,.15,.105);limb(er,hr,.105,.08);ellipsoid(hl,[.105,.13,.11]);ellipsoid(hr,[.105,.13,.11]);
// Distinctive faceted head, ink hair cap, one simple eye line on the forward face.
ellipsoid([0,3.08,.48],[.27,.32,.265]);
limb([0,3.2,.46],[0,3.425,.47],.282,.17,'#303839',10);
poly([[-.2,3.27,.64],[-.07,3.25,.76],[.05,3.12,.73],[.15,3.27,.68]].map(v=>tr(v as V)),'#303839','#303839',1);
line(tr([-.14,3.08,.75]),tr([-.06,3.08,.75]),'#242c2d',2);
line(tr([.06,3.08,.75]),tr([.14,3.08,.75]),'#242c2d',2);
// short fabric scarf follows the wake, built from 3D ribbon polygons.
poly([[-.16,2.8,.26],[.12,2.8,.26],[-.1,2.82,-.38],[-.3,2.9,-.82],[-.45,2.78,-1.3],[-.22,2.65,-.73]].map(v=>tr(v as V)),'#6c7770','#303b36',1.5);
// A few ground-level dust strokes establish direction without substituting for motion.
for(let i=0;i<5;i++){const z=-1.3-i*.25;line([-.2-i*.07,.08+i*.03,z],[.2-i*.08,.08+i*.03,z-.08],'#a3ada3',1);}
const projected=faces.map(f=>({...f,q:f.p.map(project)})).filter(f=>f.q.every(p=>p.z>.3)).sort((a,b)=>b.q.reduce((s,p)=>s+p.z,0)/b.q.length+b.bias-(a.q.reduce((s,p)=>s+p.z,0)/a.q.length+a.bias));
return <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900" style={{background:'#faf9f5'}}><rect width="1600" height="900" fill="#faf9f5"/>{projected.map((f,i)=>f.q.length===2?<line key={i} x1={f.q[0].x} y1={f.q[0].y} x2={f.q[1].x} y2={f.q[1].y} stroke={f.stroke} strokeWidth={f.width}/>:<polygon key={i} points={f.q.map(p=>`${p.x},${p.y}`).join(' ')} fill={f.fill} stroke={f.stroke} strokeWidth={f.width} strokeLinejoin="round"/>)}</svg>;
}
