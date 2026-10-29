import {solve,STAND,type Pose} from './stickman/stick';
export const FPS=30, TOTAL=600, SCALE=2, GROUND=880;
export type Vec=[number,number];
export type ActorId='a'|'b';
export const clamp=(x:number,a=0,b=1)=>Math.max(a,Math.min(b,x));
export const sm=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export type Key={f:number,x:number,h:number,lean:number,l:Vec,r:Vec,rot?:number};
// Hand targets are canonical facing-local offsets from the hip; knees always use anatomical branch.
const guardL:Vec=[42,-150],guardR:Vec=[100,-128];
const k=(f:number,x:number,h=158,lean=8,l:Vec=guardL,r:Vec=guardR,rot=0):Key=>({f,x,h,lean,l,r,rot});
export const AK:Key[]=[
 k(0,650,170,0,[20,-105],[48,-185]),k(24,650,170,0,[20,-105],[48,-185]),
 k(36,720,151,18),k(48,835,152,24,[25,-150],[80,-130]),k(55,860,148,10,[35,-145],[35,-130]),
 k(60,892,154,24,[30,-150],[185,-128]),k(65,892,154,24,[30,-150],[185,-128]),k(76,900,155,4),
 k(86,900,145,12,[20,-145],[25,-120]),k(94,929,151,28,[188,-125],[58,-155]),k(100,930,151,25,[170,-125],[58,-155]),
 k(112,930,150,8),k(121,930,150,8),k(124,930,150,4,[50,-130],[85,-112]),k(135,880,148,-27,[35,-125],[85,-120]),
 k(144,900,138,-10,[20,-140],[90,-110]),k(155,940,125,-18,[10,-140],[75,-100]),k(162,960,138,-10),
 k(178,1000,145,5),k(190,1000,125,-35,[90,-50],[105,-70]),k(200,1000,138,-28,[90,-50],[105,-70]),
 k(213,1065,148,20,[30,-145],[40,-105]),k(224,1100,158,25,[25,-145],[190,-110]),k(230,1100,158,25,[25,-145],[190,-110]),
 k(243,1145,152,10),k(253,1160,145,5),k(260,1180,150,22,[155,-135],[160,-120]),k(268,1200,145,22,[155,-135],[160,-120]),
 k(280,1270,155,15),k(289,1320,120,32,[0,-80],[30,-85]),k(300,1380,235,-8,[65,-180],[120,-155]),
 k(317,1480,300,-10,[35,-170],[110,-155]),k(332,1570,250,-15,[0,-155],[80,-130]),k(340,1610,205,-12,[0,-155],[80,-130]),
 k(353,1645,142,25,[70,-100],[105,-105]),k(360,1650,120,30,[70,-80],[95,-95]),k(375,1660,155,10),
 k(390,1690,155,4),k(398,1695,145,-6,[135,-150],[145,-135]),k(405,1690,145,-5,[135,-150],[145,-135]),
 k(416,1690,145,-35,[60,-135],[100,-115]),k(425,1690,145,-40,[60,-135],[100,-115]),k(433,1700,145,-30,[60,-135],[100,-115]),k(440,1730,145,-10,[50,-135],[80,-115]),
 k(445,1760,138,0,[25,-145],[45,-110]),k(456,1812,159,28,[20,-140],[197,-108]),k(461,1812,159,28,[20,-140],[197,-108]),
 k(474,1850,157,10),k(490,1895,160,6),k(510,1940,168,0,[15,-80],[60,-110]),
 k(530,1940,170,0,[10,-80],[30,-90]),k(548,1940,160,28,[20,-80],[40,-90]),k(565,1940,170,0,[10,-80],[30,-90]),k(599,1940,170,0,[10,-80],[30,-90])];
export const BK:Key[]=[
 k(0,1040,166,0,[25,-100],[60,-170]),k(30,1040,166,0,[25,-100],[60,-170]),k(47,1120,154,12),
 k(55,1150,150,8,[145,-145],[135,-120]),k(60,1150,150,12,[155,-130],[135,-112]),k(65,1150,150,12,[155,-130],[135,-112]),k(78,1160,152,10),
 k(84,1250,99,75,[75,-50],[105,-70]),k(94,1270,99,75,[75,-50],[105,-70]),k(103,1270,102,75,[75,-50],[105,-70]),
 k(115,1160,135,16,[40,-140],[40,-100]),k(124,1130,151,28,[25,-140],[180,-105]),k(128,1130,151,28,[25,-140],[180,-105]),k(138,1160,151,10),
 k(148,1190,180,-6,[20,-145],[90,-130]),k(155,1205,210,-12,[10,-155],[70,-135]),k(163,1215,180,-10),k(174,1230,149,5),
 k(183,1230,150,-24,[10,-140],[60,-110]),k(190,1230,156,-30,[0,-145],[45,-105]),k(199,1230,150,-20,[10,-140],[60,-120]),k(208,1270,152,6),
 k(216,1310,154,8,[150,-130],[140,-115]),k(224,1320,150,-14,[150,-120],[145,-100]),k(232,1370,152,-20,[90,-100],[110,-110]),
 k(244,1410,151,8),k(253,1410,145,12,[150,-135],[155,-115]),k(260,1420,145,18,[150,-135],[155,-115]),k(268,1440,145,18,[150,-135],[155,-115]),
 k(280,1550,154,8),k(300,1740,150,10),k(317,1810,150,8,[140,-120],[150,-100]),
 k(332,1820,145,-14,[150,-110],[150,-92]),k(339,1850,145,-20,[140,-105],[150,-90]),k(356,1915,151,0),k(375,1935,154,8),
 k(388,1920,139,25,[30,-130],[40,-110]),k(398,1910,151,28,[185,-135],[35,-145]),k(403,1910,151,28,[185,-135],[35,-145]),k(413,1940,155,10),
 k(420,1950,150,10,[25,-140],[25,-115]),k(425,1935,152,30,[190,-130],[40,-150]),k(432,1935,152,30,[185,-130],[40,-150]),
 k(446,1985,154,8),k(455,1985,154,8),k(456,1985,154,6,[65,-110],[105,-100]),k(461,2050,150,-24,[45,-110],[95,-100]),
 k(472,2190,170,-24,[0,-140],[60,-120]),k(480,2260,160,-18,[35,-140],[70,-100]),
 k(492,2250,110,-30,[55,-70],[85,-60]),k(510,2245,70,-18,[55,-60],[75,-40]),k(530,2245,70,-10,[50,-50],[75,-35]),k(599,2245,70,-10,[50,-50],[75,-35])];
export function keyAt(id:ActorId,f:number):Key {const ks=id==='a'?AK:BK;f=clamp(f,0,599);let i=1;while(i<ks.length&&ks[i].f<f)i++;if(i===ks.length)return ks.at(-1)!;const a=ks[i-1],b=ks[i];const t=sm((f-a.f)/(b.f-a.f));return{f,x:mix(a.x,b.x,t),h:mix(a.h,b.h,t),lean:mix(a.lean,b.lean,t),l:[mix(a.l[0],b.l[0],t),mix(a.l[1],b.l[1],t)],r:[mix(a.r[0],b.r[0],t),mix(a.r[1],b.r[1],t)],rot:mix(a.rot||0,b.rot||0,t)}}
export function twoBone(dx:number,dy:number,l1:number,l2:number,branch:number):[number,number] {const d=Math.min(l1+l2-.1,Math.max(Math.abs(l1-l2)+.1,Math.hypot(dx,dy)));const a=Math.atan2(dx,dy),beta=Math.acos(clamp((l1*l1+d*d-l2*l2)/(2*l1*d),-1,1));const q=a+branch*beta;const kx=Math.sin(q)*l1,ky=Math.cos(q)*l1;const s=Math.atan2(dx-kx,dy-ky);let rel=s-q;while(rel>Math.PI)rel-=2*Math.PI;while(rel< -Math.PI)rel+=2*Math.PI;return[q*180/Math.PI,rel*180/Math.PI]}
export type Feet={l:Vec,r:Vec,plantL:boolean,plantR:boolean};
function isAir(id:ActorId,f:number){return id==='a'?f>290&&f<353:(f>145&&f<170)||(f>461&&f<492)}
const FEET_CACHE:Record<ActorId,Feet[]>={a:[],b:[]};
function buildFeet(id:ActorId){const arr:Feet[]=[];const start=keyAt(id,0).x;let feet:Vec[]=[[start-60,GROUND],[start+60,GROUND]];let moving=-1,begin=0,from:Vec=[0,0],to:Vec=[0,0];let airStart:Vec[]=[[...feet[0]],[...feet[1]]];
 for(let f=0;f<TOTAL;f++){const q=keyAt(id,f);const air=isAir(id,f);
  if(air){const st=id==='a'?290:(f<180?145:461),en=id==='a'?353:(f<180?170:492),u=clamp((f-st)/(en-st));if(f===st+1)airStart=feet.map(v=>[...v] as Vec);const baseX=keyAt(id,st).x,lift=Math.sin(u*Math.PI)*(id==='a'?130:f<180?50:80);feet=airStart.map((v,i)=>[q.x+mix(v[0]-baseX,i===0?-60:60,sm(u)),GROUND-lift] as Vec);moving=-1;arr.push({l:[...feet[0]],r:[...feet[1]],plantL:false,plantR:false});continue;}
  if(f>0&&isAir(id,f-1)){feet=[[q.x-60,GROUND],[q.x+60,GROUND]];moving=-1;}
  if(moving<0){const gaps=feet.map(v=>Math.abs(v[0]-q.x));const vel=keyAt(id,Math.min(599,f+6)).x-q.x;if(Math.max(...gaps)>78&&Math.abs(vel)>1){moving=gaps[0]>gaps[1]?0:1;begin=f;from=[...feet[moving]];to=[keyAt(id,Math.min(599,f+8)).x+Math.sign(vel)*54,GROUND];}}
  if(moving>=0){const u=clamp((f-begin)/8),t=sm(u);feet[moving]=[mix(from[0],to[0],t),GROUND-40*Math.sin(Math.PI*u)*clamp((q.h-80)/70)];if(u>=1)moving=-1;}
  arr.push({l:[...feet[0]],r:[...feet[1]],plantL:moving!==0,plantR:moving!==1});
 }return arr;}
FEET_CACHE.a=buildFeet('a');FEET_CACHE.b=buildFeet('b');
export function feetAt(id:ActorId,f:number):Feet{const q=FEET_CACHE[id][Math.round(clamp(f,0,599))];return{l:[...q.l],r:[...q.r],plantL:q.plantL,plantR:q.plantR}}
function rawActorAt(id:ActorId,f:number):{pose:Pose,facing:number,feet:Feet} {const q=keyAt(id,f),facing=id==='a'?1:-1;let y=GROUND-q.h;const feet=feetAt(id,f);if(!isAir(id,f)){for(const foot of [feet.l,feet.r]){const dx=Math.min(186,Math.abs(foot[0]-q.x));const maxH=Math.sqrt(187*187-dx*dx);y=Math.max(y,foot[1]-maxH);}}const p:Pose={...STAND,x:q.x,y,lean:q.lean,head:0,rot:q.rot||0,ll2:-5,rl2:-5};
 const leg=(v:Vec)=>twoBone((v[0]-p.x)*facing,v[1]-p.y,96,92,1);[p.ll1,p.ll2]=leg(feet.l);[p.rl1,p.rl2]=leg(feet.r);
 const zero=solve({...p,la1:0,la2:0,ra1:0,ra2:0},SCALE,facing);const sx=(zero.neck[0]-p.x)*.92*facing,sy=(zero.neck[1]-p.y)*.92;
 const arm=(target:Vec,branch:number)=>{const v=twoBone(Math.max(35,target[0]-sx),target[1]-sy,80,76,-1);return[v[0]+p.lean,v[1]]};[p.la1,p.la2]=arm(q.l,1);[p.ra1,p.ra2]=arm(q.r,-1);
 return{pose:p,facing,feet};}
export const EVENTS=[{f:60,kind:'block',x:1030,y:GROUND-280},{f:94,kind:'whoosh',x:1100,y:600},{f:124,kind:'body',x:1010,y:680},{f:155,kind:'sweep',x:1110,y:825},{f:190,kind:'whoosh',x:1110,y:625},{f:224,kind:'block',x:1220,y:665},{f:260,kind:'clash',x:1300,y:640},{f:294,kind:'jump',x:1350,y:GROUND},{f:332,kind:'kick',x:1750,y:650},{f:360,kind:'land',x:1650,y:GROUND},{f:398,kind:'block',x:1810,y:625},{f:425,kind:'whoosh',x:1820,y:600},{f:456,kind:'body',x:1960,y:680},{f:480,kind:'post',x:2300,y:690}];
export function cameraAt(f:number){const keys=[[0,1500,650,.8],[28,1500,650,.8],[48,1050,660,1],[240,1270,655,1.12],[290,1510,650,1],[360,1830,655,1.12],[410,1830,655,1.12],[440,2000,655,1.08],[492,2120,650,1.12],[520,2120,650,1.12],[560,2050,620,.95],[599,2050,620,.95]];let i=1;while(i<keys.length&&f>keys[i][0])i++;i=Math.min(i,keys.length-1);const a=keys[i-1],b=keys[i],t=sm((f-a[0])/(b[0]-a[0]));return{x:mix(a[1],b[1],t),y:mix(a[2],b[2],t),z:mix(a[3],b[3],t)}}
export const CONTACTS=[{f:60,a:'r',b:'r',kind:'block'},{f:124,a:'body',b:'r',kind:'body'},{f:224,a:'r',b:'r',kind:'block'},{f:260,a:'r',b:'r',kind:'clash'},{f:332,a:'foot',b:'r',kind:'kick'},{f:398,a:'r',b:'r',kind:'block'},{f:456,a:'r',b:'body',kind:'body'}];

export function actorAt(id:ActorId,f:number):ReturnType<typeof rawActorAt>{
 const a=rawActorAt('a',f),b=rawActorAt('b',f); const objects={a,b};
 for(const e of CONTACTS){const d=Math.abs(f-e.f);if(d>10)continue;const w=sm(1-d/10);const ja=solve(a.pose,SCALE,a.facing),jb=solve(b.pose,SCALE,b.facing);
  let target:Vec;
  if(e.kind==='body') {const j=e.a==='body'?ja:jb;target=[mix(j.hip[0],j.neck[0],.55),mix(j.hip[1],j.neck[1],.55)];}
  else if(e.kind==='kick')target=[jb.rHand[0],jb.rHand[1]];
  else target=[(ja.neck[0]+jb.neck[0])/2,(ja.neck[1]+jb.neck[1])/2+30];
  for(const aid of ['a','b'] as ActorId[]){const part=aid==='a'?e.a:e.b;if(part==='body')continue;const obj=objects[aid],p=obj.pose,j=aid==='a'?ja:jb;
   if(part==='foot'){const goal:Vec=[mix(j.rFoot[0],target[0],w),mix(j.rFoot[1],target[1],w)];const ang=twoBone((goal[0]-p.x)*obj.facing,goal[1]-p.y,96,92,1);[p.rl1,p.rl2]=ang;obj.feet.plantR=false;}
   else {const start=part==='r'?j.rHand:j.lHand;const goal:Vec=[mix(start[0],target[0],w),mix(start[1],target[1],w)];const sx=p.x+(j.neck[0]-p.x)*.92,sy=p.y+(j.neck[1]-p.y)*.92;const ang=twoBone((goal[0]-sx)*obj.facing,goal[1]-sy,80,76,-1);if(part==='r'){p.ra1=ang[0]+p.lean;p.ra2=ang[1]}else{p.la1=ang[0]+p.lean;p.la2=ang[1]}}
  }
 }
 // Explicit low sweep and high kick, with anatomically correct negative shin flexion.
 const obj=objects[id]; const kicks=id==='a'?[{f:155,x:170,y:-20}]:[{f:190,x:150,y:-270}];
 for(const e of kicks){const d=Math.abs(f-e.f);if(d>13)continue;const w=sm(1-d/13),j=solve(obj.pose,SCALE,obj.facing);const sx=(j.rFoot[0]-obj.pose.x)*obj.facing,sy=j.rFoot[1]-obj.pose.y,tx=e.x,ty=GROUND+e.y-obj.pose.y;let angle0=Math.atan2(sx,sy),angle1=Math.atan2(tx,ty);while(angle1-angle0>Math.PI)angle1-=2*Math.PI;while(angle1-angle0< -Math.PI)angle1+=2*Math.PI;const angle=mix(angle0,angle1,w),radius=mix(Math.hypot(sx,sy),Math.min(187,Math.hypot(tx,ty)),w);[obj.pose.rl1,obj.pose.rl2]=twoBone(Math.sin(angle)*radius,Math.min(GROUND-obj.pose.y,Math.cos(angle)*radius),96,92,1);obj.feet.plantR=false;}
 return obj;
}

export function contactPoint(e:{f:number,kind:string,x:number,y:number}):Vec{const c=CONTACTS.find(c=>c.f===e.f);if(!c)return[e.x,e.y];const a=actorAt('a',e.f),b=actorAt('b',e.f),ja=solve(a.pose,SCALE,a.facing),jb=solve(b.pose,SCALE,b.facing);if(c.a==='body')return[mix(ja.hip[0],ja.neck[0],.55),mix(ja.hip[1],ja.neck[1],.55)];if(c.b==='body')return[mix(jb.hip[0],jb.neck[0],.55),mix(jb.hip[1],jb.neck[1],.55)];const p=c.a==='foot'?ja.rFoot:ja.rHand;return[(p[0]+jb.rHand[0])/2,(p[1]+jb.rHand[1])/2]}
