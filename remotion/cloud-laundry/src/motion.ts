export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
const seg=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
export type State={x:number;y:number;rx:number;ry:number;rotation:number;linen:number;grow:number;warm:number;wet:number;time:number};
export function stateAt(t:number):State {
 const a=seg(t,0,6),b=seg(t,6,12),c=seg(t,12,19),d=seg(t,18,22);
 const squeeze=Math.exp(-Math.pow((t-8.9)/.9,2));
 const linen=d;
 return {x:210+450*a+770*b+30*c,y:(440-80*Math.sin(a*Math.PI)-2*b+12*Math.sin(t*1.5))*(1-linen)+305*linen,rx:(150+50*squeeze)*(1-linen)+222*linen,ry:(82-25*squeeze)*(1-linen)+142*linen,rotation:(-7*Math.sin(t*1.2)*(1-linen)),linen,grow:seg(t,12.6,16.8),warm:seg(t,18,26),wet:1-seg(t,7,12),time:t};
}
export function cloudPath(s:State):string {
 const pts:Array<[number,number]>=[];
 const curves=[[[1,0],[1.23,.08],[1.1,.55],[.72,.55]],[[.72,.55],[.3,.68],[-.4,.6],[-.72,.5]],[[-.72,.5],[-1.15,.5],[-1.25,-.15],[-.9,-.35]],[[-.9,-.35],[-.98,-.85],[-.4,-1.2],[-.15,-.65]],[[-.15,-.65],[.1,-1.3],[.8,-1.1],[.73,-.5]],[[.73,-.5],[1.1,-.6],[1.3,-.1],[1,0]]];
 for(let i=0;i<96;i++){const a=i/96*Math.PI*2,ca=Math.cos(a),sa=Math.sin(a),curve=curves[Math.floor(i/16)],u=(i%16)/16,v=1-u;
 const px=v*v*v*curve[0][0]+3*v*v*u*curve[1][0]+3*v*u*u*curve[2][0]+u*u*u*curve[3][0];
 const py=v*v*v*curve[0][1]+3*v*v*u*curve[1][1]+3*v*u*u*curve[2][1]+u*u*u*curve[3][1];
 let x=mix(px*s.rx,Math.sign(ca)*Math.pow(Math.abs(ca),2/9)*s.rx,s.linen);
 let y=mix(py*s.ry,Math.sign(sa)*Math.pow(Math.abs(sa),2/9)*s.ry,s.linen);
 if(s.linen>0){const depth=(y+s.ry)/(s.ry*2);x+=s.linen*depth*9*Math.sin(s.time*1.8+depth*2);y+=s.linen*(depth*5*Math.sin(x/45+s.time*1.4)-.04*x*(1-depth));}
 pts.push([x,y]); }
 let out=`M ${pts[0][0].toFixed(2)} ${pts[0][1].toFixed(2)}`;
 for(let i=0;i<96;i++){let p0=pts[(i+95)%96],p1=pts[i],p2=pts[(i+1)%96],p3=pts[(i+2)%96];out+=` C ${(p1[0]+(p2[0]-p0[0])/6).toFixed(2)} ${(p1[1]+(p2[1]-p0[1])/6).toFixed(2)} ${(p2[0]-(p3[0]-p1[0])/6).toFixed(2)} ${(p2[1]-(p3[1]-p1[1])/6).toFixed(2)} ${p2[0].toFixed(2)} ${p2[1].toFixed(2)}`;}return out+' Z';
}
function rawCameraAt(t:number){const shot=Math.min(4,Math.floor(t/6)),u=(t-shot*6)/6;
 if(shot===0)return {shot,scale:1.02+.10*smooth(u),x:mix(880,850,smooth(u)),y:510};
 if(shot===1)return {shot,scale:1.65+.10*smooth(u),x:1000+80*smooth(u),y:490};
 if(shot===2)return {shot,scale:2.1-.10*smooth(u),x:1430,y:640-25*smooth(u)};
 if(shot===3)return {shot,scale:1.6-.12*smooth(u),x:1435,y:350};
 return {shot,scale:1.10-.08*smooth(u),x:960,y:540};
}

export function cameraAt(t:number){const c=rawCameraAt(t);return {...c,x:Math.max(960/c.scale,Math.min(1920-960/c.scale,c.x)),y:Math.max(540/c.scale,Math.min(1080-540/c.scale,c.y))};}
