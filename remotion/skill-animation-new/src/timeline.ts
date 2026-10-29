import {STAND,poseAt,solve,walkCycle,runCycle,addPose,SMOOTH,type Pose,type Key} from './stickman/stick';
export const FPS=30,TOTAL=720,GROUND=860,SCALE=1.65;
export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const smooth=(x:number)=>{const t=clamp(x);return t*t*(3-2*t)};
export function curve(f:number,ts:number[],vs:number[],ease=true){if(f<=ts[0])return vs[0];for(let i=1;i<ts.length;i++)if(f<=ts[i]){const t=clamp((f-ts[i-1])/(ts[i]-ts[i-1]));return mix(vs[i-1],vs[i],ease?smooth(t):t)}return vs.at(-1)!}
const neutral={...STAND,x:600,y:700};
const pose=(p:Partial<Pose>)=>({...neutral,...p});
const K:Key[]=[
 {f:0,p:pose({x:620})},{f:59,p:pose({x:770}),e:t=>t},
 {f:72,p:pose({x:786,lean:-8,head:15,ra1:165,ra2:18})},
 {f:88,p:pose({x:800,lean:10,head:-18,ra1:120,ra2:0,la1:-65,la2:-25})},
 {f:102,p:pose({x:830,lean:18,head:-12,ra1:95,ra2:-15})},
 {f:110,p:pose({x:850,lean:16})},{f:190,p:pose({x:1510,lean:16}),e:t=>t},
 {f:200,p:pose({x:1595,lean:38,head:-15,ll1:-58,ll2:105,rl1:52,rl2:-90,la1:-55,la2:-40,ra1:75,ra2:25})},
 {f:227,p:pose({x:1825,lean:44,head:-20,ll1:-55,ll2:100,rl1:55,rl2:-95,la1:-50,la2:-60,ra1:70,ra2:40}),e:t=>t},
 {f:245,p:pose({x:1975,lean:16}),e:SMOOTH},{f:280,p:pose({x:2250,lean:16}),e:t=>t},
 {f:291,p:pose({x:2300,lean:20,la1:-75,la2:-15,ra1:-65,ra2:-20,ll1:-65,ll2:105,rl1:55,rl2:-100})},
 {f:300,p:pose({x:2380,y:575,lean:20,la1:155,la2:-30,ra1:140,ra2:15,ll1:-35,ll2:65,rl1:80,rl2:-30}),e:SMOOTH},
 {f:325,p:pose({x:2590,y:430,lean:10,head:-10,la1:110,la2:-25,ra1:130,ra2:20,ll1:-75,ll2:90,rl1:65,rl2:-45}),e:SMOOTH},
 {f:350,p:pose({x:2810,y:595,lean:-10,la1:-85,la2:-20,ra1:85,ra2:20,ll1:-35,ll2:45,rl1:35,rl2:-30}),e:SMOOTH},
 {f:358,p:pose({x:2850,lean:22,ll1:-65,ll2:110,rl1:55,rl2:-100,la1:-90,la2:-40,ra1:90,ra2:40}),e:SMOOTH},
 {f:374,p:pose({x:2955,lean:-28,ll1:-40,ll2:20,rl1:55,rl2:-30,la1:-110,la2:-40,ra1:70,ra2:60}),e:SMOOTH},
 {f:395,p:pose({x:3000,head:25,lean:10}),e:SMOOTH},
 {f:420,p:pose({x:3005,head:30,lean:15})},
 {f:445,p:pose({x:3020,head:15,lean:60,ll1:-70,ll2:120,rl1:65,rl2:-115,la1:-15,la2:55,ra1:40,ra2:20}),e:SMOOTH},
 {f:485,p:pose({x:3020,head:10,lean:40,ll1:-70,ll2:120,rl1:65,rl2:-115,la1:-15,la2:55,ra1:40,ra2:20})},
 {f:505,p:pose({x:3020,head:0,lean:40,ll1:-70,ll2:120,rl1:65,rl2:-115,la1:-15,la2:55,ra1:40,ra2:20})},
 {f:530,p:pose({x:3015,head:15,lean:75,ll1:-70,ll2:120,rl1:65,rl2:-115,la1:-15,la2:55,ra1:40,ra2:20})},
 {f:550,p:pose({x:3000,head:15,lean:10,ra1:65,ra2:-20}),e:SMOOTH},
 {f:565,p:pose({x:2980,head:15,lean:10,ra1:65,ra2:-20}),e:SMOOTH},
 {f:595,p:pose({x:2910,head:12,la1:-25,ra1:15}),e:SMOOTH},
 {f:630,p:pose({x:2910,head:-20}),e:SMOOTH},
 {f:665,p:pose({x:2910,head:0}),e:SMOOTH},{f:680,p:pose({x:2910,head:-10,lean:-3,ra1:145,ra2:28}),e:SMOOTH},
 {f:705,p:pose({x:2910,head:6,ra1:35,ra2:45}),e:SMOOTH},{f:719,p:pose({x:2910,head:6,ra1:35,ra2:45})}
];
const ANGLES=['lean','head','la1','la2','ra1','ra2','ll1','ll2','rl1','rl2','rot'] as const;
const NK:Key[]=(()=>{let last={...neutral};return K.map(k=>{const next={...last,...k.p};for(const a of ANGLES)next[a]=last[a]+((next[a]-last[a]+540)%360-180);last=next;return {...k,p:next,e:k.e??SMOOTH};});})();
export function heroPose(f:number):Pose{
 let p=poseAt(f,NK,neutral);
 if(f<60)p=addPose(p,walkCycle(f,.19));
 if((f>=110&&f<190)||(f>=245&&f<280)){const start=f<190?110:245,end=f<190?190:280;const amp=.82*smooth((f-start)/8)*smooth((end-f)/8);p=addPose(p,runCycle(f,.37,amp));}
 if(f>=200&&f<227){p.ll1+=Math.sin(f*.4)*12;p.rl1-=Math.sin(f*.4)*12;}
 {const j=solve(p,SCALE);p.y+=GROUND-Math.max(j.lFoot[1],j.rFoot[1]);if(f>294&&f<358)p.y-=330*Math.sin(Math.PI*(f-294)/64);}
 if(f>=430&&f<=552){const weight=smooth((f-430)/18)*(1-smooth((f-531)/8));const h=hatAt(f);const j=solve(p,SCALE);const sx=p.x+(j.neck[0]-p.x)*.92,sy=p.y+(j.neck[1]-p.y)*.92;const hr=h.r*Math.PI/180;const dx=h.x-83*Math.cos(hr)-3*Math.sin(hr)-sx,dy=h.y-83*Math.sin(hr)+3*Math.cos(hr)-sy;const L1=40*SCALE,L2=38*SCALE,d=Math.min(Math.hypot(dx,dy),L1+L2-.01);const a2=Math.acos(Math.max(-1,Math.min(1,(d*d-L1*L1-L2*L2)/(2*L1*L2))));const a1=Math.atan2(dx,dy)-Math.atan2(L2*Math.sin(a2),L1+L2*Math.cos(a2));p.ra1+=(((a1*180/Math.PI+p.lean-p.ra1+540)%360)-180)*weight;p.ra2+=(((a2*180/Math.PI-p.ra2+540)%360)-180)*weight;}
 return p;
}
export function hatAt(f:number):{x:number,y:number,r:number,s:number}{
 if(f<76){const p=poseAt(f,NK,neutral);if(f<60)Object.assign(p,addPose(p,walkCycle(f,.19)));const j=solve(p,SCALE);p.y+=GROUND-Math.max(j.lFoot[1],j.rFoot[1]);const h=solve(p,SCALE).headC;return{x:h[0],y:h[1]-38,r:f>60?curve(f,[60,72,76],[0,25,-12]):Math.sin(f*.19)*3,s:1};}
 const start=hatAt(75);
 return{x:curve(f,[76,100,160,218,270,325,370,405,719],[start.x,1060,1550,1980,2360,2810,3075,3170,3170]),y:curve(f,[76,100,160,218,270,325,370,405,445,468,505,532,719],[start.y,330,440,350,450,290,510,840,840,742,742,806,806]),r:curve(f,[76,100,160,218,270,325,370,405,445,468,505,532,719],[start.r,35,-25,22,-18,30,-28,0,0,-13,-13,-35,-35]),s:1};
}
export function cameraAt(f:number){
 if(f<420)return{x:curve(f,[0,45,85,110,190,250,280,325,375,419],[820,850,1010,1120,1670,2070,2460,2710,2970,3060]),y:curve(f,[0,45,85,280,325,375,419],[570,570,570,570,505,595,620]),z:curve(f,[0,45,85,110,190,250,280,325,375,419],[1.55,1.55,1.02,1.02,1.08,1.05,.96,.96,1.08,1.08])};
 if(f<570)return{x:3110,y:700,z:2.05};
 return{x:curve(f,[570,600,645,700,719],[3040,3040,3030,3030,3030]),y:curve(f,[570,600,645,700,719],[620,620,590,590,590]),z:curve(f,[570,600,645,700,719],[1.15,1.15,1.02,1.02,1.02])};
}
export const birdAt=(f:number)=>({x:3175+curve(f,[505,535],[0,55])+((f<490)?Math.sin(f*2.5)*1.5:0),y:836,visible:f>=405,peek:smooth((f-452)/15)});
export const leafAt=(f:number)=>{const p=heroPose(Math.max(630,f)),j=solve(p,SCALE);const t=smooth((f-625)/38);return{x:mix(2680,j.headC[0]+8,t)+Math.sin((f-625)*.3)*40*(1-t),y:mix(250,j.headC[1]-36,t),r:mix(-140,-20,t),visible:f>=625};};
