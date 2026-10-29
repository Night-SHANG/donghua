import React from 'react';
export type V=[number,number,number];
type Face={p:V[];fill:string;stroke:string;w:number;bias:number};
const add=(a:V,b:V):V=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]], sub=(a:V,b:V):V=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]], mul=(a:V,n:number):V=>a.map(x=>x*n) as V;
const dot=(a:V,b:V)=>a.reduce((s,x,i)=>s+x*b[i],0), cross=(a:V,b:V):V=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],unit=(a:V)=>mul(a,1/Math.hypot(...a));
const mix=(a:number,b:number,t:number)=>a+(b-a)*t, ease=(t:number)=>t*t*(3-2*t), clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const SHOTS=[0,120,240,360,480,600,720];
export function state(frame:number){
 const t=frame/30,s=Math.min(5,Math.floor(t/4)),u=(t-s*4)/4;
 let x=0,z=t*3,y=1.55;
 if(t<1){z=.2*t;y=.42-.09*Math.sin(t*Math.PI);}else if(t<2.4){z=.2+(t-1)*4.5;y=mix(.42,1.55,ease((t-1)/1.4));}else if(t<8){z=6.5+(t-2.4)*3.125;}
 if(t>=8&&t<12){const q=(t-8)/4;x=12*ease(q);z=24+10*q;}
 if(t>=12){x=12;z=34+(t-12)*3.5;}
 if(t>=16)y=1.55+8*ease(clamp((t-16)/7));
 y+=t>1?.11*Math.sin(t*2*Math.PI/1.6):0;
 const dx=t>=8&&t<12?18*((t-8)/4)*(1-(t-8)/4):0;const yaw=Math.atan2(dx,t>=8&&t<12?2.5:3.5);
 const p:V=[x,y,z];let eye:V,aim:V=add(p,[0,.1,0]);let focal=1250;
 if(s===0){eye=add(p,[1.3,1.6,8]);aim=add(p,[0,.2,0]);focal=1450;}
 else if(s===1){eye=add(p,[2.6,1.5,-2.8]);aim=add(p,[0,.2,1.1]);focal=950;}
 else if(s===2){eye=add(p,[-6,12,6]);aim=add(p,[0,-.4,0]);focal=1180;}
 else if(s===3){eye=add(p,[1.4,2.1,8.5-1.2*u]);focal=1450;}
 else if(s===4){eye=[29,13,70];aim=[12,4+u*2,53+u*6];focal=1200;}
 else {eye=add(p,[-8,4,-12]);aim=add(p,[1,0,3]);focal=1330;}
 return {t,s,u,p,eye,aim,focal,yaw};
}
export function JourneyFrame({frame=0}:{frame?:number}){
 const st=state(frame),{t,s,p,eye,aim,focal,yaw}=st;const faces:Face[]=[];
 const poly=(p:V[],fill='#faf9f5',stroke='#303735',w=1.25,bias=0)=>faces.push({p,fill,stroke,w,bias});
 const line=(a:V,b:V,c='#7d8780',w=1,bias=-.005)=>poly([a,b],'none',c,w,bias);
 const box=(c:V,d:V,colors=['#e5e7df','#faf9f5','#d6dcd3'])=>{const [x,y,z]=c,[w,h,l]=d;const pts:V[]=[[-w/2,0,-l/2],[w/2,0,-l/2],[w/2,h,-l/2],[-w/2,h,-l/2],[-w/2,0,l/2],[w/2,0,l/2],[w/2,h,l/2],[-w/2,h,l/2]].map(v=>add(v as V,[x,y,z]));for(const [i,f]of [[0,1,2,3],[4,7,6,5],[0,3,7,4],[1,5,6,2],[3,2,6,7]].entries())poly(f.map(k=>pts[k]),colors[i===4?0:i%2?1:2]);};
 // Tile the ground rather than dropping a giant near-plane-crossing polygon.
 for(let z=-24;z<100;z+=8)for(let x=-36;x<48;x+=8)poly([[x,-.1,z],[x+8,-.1,z],[x+8,-.1,z+8],[x,-.1,z+8]],z>=40?'#e6eae2':'#f2f2eb','none',0,100000);
 // Street opens into a narrower back lane. Buildings are solid, window faces share world coordinates.
 for(let j=-2;j<4;j++)for(const side of [-1,1]){const z=j*7+2-(j===3?1.2:0);const x=side*(j>=2?5.7:7.7);const h=5+(j*j+3)%4;const w=j>=2?5:6;box([x,0,z],[w,h,5.6]);for(let level=1.2;level<h-.8;level+=1.6)for(let k=-1;k<=1;k++){const a=x-side*(w/2+.014),zz=z+k*1.5;poly([[a,level,zz-.4],[a,level+.75,zz-.4],[a,level+.75,zz+.4],[a,level,zz+.4]],'#dce1d8','#89938b',.8);line([a,level+.16,zz-.4],[a,level+.16,zz+.4],'#aeb8ac',.6);}box([x,h,z],[w+.15,.13,5.75]);}
 for(let z=-18;z<30;z+=3){for(const sign of [-1,1]){line([sign*3.1,.02,z],[sign*3.1,.02,z+3],'#aab4a8',1);line([sign*3.1,.02,z],[sign*4.5,.02,z],'#aab4a8',1);}if(z<12)poly([[-.06,0,z],[.06,0,z],[.06,0,z+1.4],[-.06,0,z+1.4]],'#bcc6b7','none');}
 // Causal corner: the lane turns right around this low warehouse, opening onto bridge.
 box([18,0,29],[5.6,3.5,4.5]);for(let z=27;z<31;z+=.9)line([15.19,1.1,z],[15.19,2.7,z],'#a2aca0',.8);box([-4,0,29],[3,5.5,5]);
 for(let x=0;x<16;x+=2)line([x,.015,33],[x,.015,37],'#b3beb0',.8);
 // Bridge: deck, sparse rails and towers, below-deck water stays visibly separate.
 for(let z=34;z<53;z+=2){box([12,0,z+1],[7,.25,2],['#f5f5ed','#d4dbd0','#cad3c8']);for(const side of [-1,1]){box([12+side*3.3,.25,z],[.09,.95,.09],['#d6ded1','#e4e9de','#68786a']);line([12+side*3.3,1.2,z],[12+side*3.3,1.2,z+2],'#556857',1.3);line([12+side*3.3,.7,z],[12+side*3.3,.7,z+2],'#8e9e8c',.8);}}
 for(const z of [35,50])for(const side of [-1,1])box([12+side*3.3,.25,z],[.5,2.9,.5],['#e1e7d8','#f8f8ef','#bccab7']);
 // Water plane with controlled graphic horizontal ripples, distant stepped silhouette and open plaza.
 for(let z=40;z<95;z+=3)for(let x=-28;x<45;x+=7){if(x>7&&x<16&&z<54)continue;const phase=Math.sin(t*.7+x+z)*.25;line([x+phase,-.06,z],[x+4+phase,-.06,z],'#b5c5b5',.85,90000);}
 for(let z=54;z<72;z+=4)box([12,0,z],[8,.23,4],['#eef0e7','#dbe2d4','#c5d0c0']);
 for(let i=0;i<7;i++)box([-25+i*10,0,88+(i%2)*4],[6,3+(i%3)*1.3,5],['#e8ece1','#f3f4e9','#d9e0d2']);
 // A destination lantern on the water-side plinth.
 box([12,.24,67],[2,.35,2]);box([12,.59,67],[.14,2.8,.14],['#899b83','#a0af96','#71876b']);box([12,3.3,67],[.8,.65,.8],['#f6f3d8','#ffffeb','#e0e5c8']);
 // Airborne folded bird: contiguous triangular facets, a coherent hinge for each wing.
 const flap=t<1?.12: .25*Math.sin(t*2*Math.PI/ .8)*(t>20?.35:1);const bank=t>=8&&t<12?-.25*Math.sin((t-8)/4*Math.PI):.035*Math.sin(t*1.5);
 const tr=(v:V):V=>{let [x,y,z]=v;const xx=x*Math.cos(bank)-y*Math.sin(bank),yy=x*Math.sin(bank)+y*Math.cos(bank);return add(p,[xx*Math.cos(yaw)+z*Math.sin(yaw),yy,z*Math.cos(yaw)-xx*Math.sin(yaw)]);};
 const bird=(q:V[],fill:string)=>poly(q.map(tr),fill,'#29362f',1.8,-.02);
 const nose:V=[0,.12,.95],back:V=[0,.03,-.72],keel:V=[0,-.26,.0],left:V=[-.24,.10,.22],right:V=[.24,.1,.22],crest:V=[0,.42,.23];
 bird([nose,left,crest],'#fffef5');bird([nose,crest,right],'#e1e8d9');bird([nose,keel,left],'#d1ddc8');bird([nose,right,keel],'#bdcfb7');bird([back,left,keel],'#e7ecdf');bird([back,keel,right],'#b6c7ae');bird([back,crest,left],'#fdfdf3');bird([back,right,crest],'#dee7d4');
 for(const side of [-1,1]){const tip:V=[side*1.5,.14+flap,-.25],fold:V=[side*.9,.28+flap*.6,-.40],root:V=[side*.18,.12,.3];bird([root,tip,fold],'#fbfbef');bird([root,fold,back],'#dbe5d1');}
 // Black ink eyes sit on visible outer head faces rather than floating screen-space dots.
 for(const side of [-1,1]){const e:V=[side*.105,.235,.57];bird([[e[0],e[1]+.035,e[2]],[e[0]+side*.025,e[1],e[2]+.025],[e[0],e[1]-.025,e[2]]],'#26352b');}
 // Contact shadow fades and shrinks with height; only on bridge/road/plaza, not a flying decal.
 const sy=t>=12?.27:.025;if(p[1]<3.1){const r=.6+Math.min(p[1],2)*.16;poly([[p[0]-r,sy,p[2]-.3],[p[0],sy,p[2]+.6],[p[0]+r,sy,p[2]-.3],[p[0],sy,p[2]-.8]],'#c5cec0','none',0,10000);}
 const fwd=unit(sub(aim,eye)),rightCam=unit(cross(fwd,[0,1,0])),up=cross(rightCam,fwd);const cam=(v:V):V=>{const d=sub(v,eye);return [dot(d,rightCam),dot(d,up),dot(d,fwd)];};
 // Near-plane clipping avoids whole-face pops and infinite projections.
 const clip=(points:V[]):V[]=>{let out:V[]=[];for(let i=0;i<points.length;i++){const a=points[i],b=points[(i+1)%points.length],ia=a[2]>=.3,ib=b[2]>=.3;if(ia)out.push(a);if(ia!==ib)out.push(add(a,mul(sub(b,a),(.3-a[2])/(b[2]-a[2]))));}return out;};
 const projected=faces.map(f=>({...f,q:clip(f.p.map(cam))})).filter(f=>f.q.length>=2).sort((a,b)=>b.q.reduce((sum,v)=>sum+v[2],0)/b.q.length+b.bias-a.q.reduce((sum,v)=>sum+v[2],0)/a.q.length-a.bias);
 const pr=(q:V)=>[800+focal*q[0]/q[2],450-focal*q[1]/q[2]];
 // Short bright exposure bridges architectural enclosure to open water at 16 s.
 const wipeX=800+(frame-240)*330;
 const light= Math.max(0,1-Math.abs(frame-480)/7)*.72;
 return <svg xmlns="http://www.w3.org/2000/svg" width="1600" height="900" viewBox="0 0 1600 900"><rect width="1600" height="900" fill="#faf9f5"/>{projected.map((f,i)=>{const q=f.q.map(pr);return f.p.length===2?<line key={i} x1={q[0][0]} y1={q[0][1]} x2={q[1][0]} y2={q[1][1]} stroke={f.stroke} strokeWidth={f.w}/>:<polygon key={i} points={q.map(p=>p.join(',')).join(' ')} fill={f.fill} stroke={f.stroke} strokeWidth={f.w} strokeLinejoin="round"/>;})}{frame>=233&&frame<=247?<g aria-label="foreground architectural corner wipe"><polygon points={`${wipeX-1000},-150 ${wipeX+820},-65 ${wipeX+820},1020 ${wipeX-1000},1150`} fill="#faf9f5" stroke="#303735" strokeWidth="2"/><polygon points={`${wipeX+820},-65 ${wipeX+1000},-160 ${wipeX+1000},1130 ${wipeX+820},1020`} fill="#d6dcd3" stroke="#303735" strokeWidth="2"/><path d={`M${wipeX-1000} 240 L${wipeX+820} 290 M${wipeX-1000} 675 L${wipeX+820} 640`} fill="none" stroke="#d0d6cd" strokeWidth="1.2"/></g>:null}<rect width="1600" height="900" fill="#faf9f5" opacity={light}/>{frame>697?<rect width="1600" height="900" fill="#faf9f5" opacity={clamp((frame-697)/22)}/>:null}</svg>;
}
