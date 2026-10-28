export type Season = 'spring'|'summer'|'autumn'|'winter';
export const CUTS = [0,204,420,660,900] as const;
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{const t=clamp(v);return t*t*(3-2*t)};
export const lerp=(a:number,b:number,t:number)=>a+(b-a)*t;
export function motion(season:Season,t:number){
 const q=clamp(t/({spring:3.4,summer:3.6,autumn:4,winter:4}[season]));
 if(season==='spring')return {p:[-.9+1.1*smooth(q)+.3*Math.sin(q*8), .8+1.9*smooth(q)+.1*Math.sin(q*19),.6-4.7*smooth(q)] as [number,number,number],r:[.35+.36*Math.sin(t*5),.2+q*5.1,.3+Math.sin(t*4.3)*.52] as [number,number,number],camera:[2.1-q*1.3,2.2+q*.5,7.3+q*.6] as [number,number,number],target:[0,1.55,-.7] as [number,number,number]};
 if(season==='summer'){const a=q*Math.PI*1.5;return {p:[1.45*Math.sin(a+.35),1.15+.35*Math.cos(a*1.8),.3-1.1*Math.cos(a)] as [number,number,number],r:[.35+Math.sin(a*2)*.5,1.0+q*2.4,Math.sin(a*1.6)*.9] as [number,number,number],camera:[3.5-q*3.8,1.8+q*.8,7.7] as [number,number,number],target:[0,1.15,-.6] as [number,number,number]};}
 if(season==='autumn'){const a= q<.65?q*8.5:5.525+(q-.65)*1.2; const r=1.3-.6*smooth(q);return {p:[Math.cos(a)*r,1.2+1.15*Math.sin(q*Math.PI)+.12*Math.sin(t*8),Math.sin(a)*r] as [number,number,number],r:[.4+Math.sin(t*4)*.65,q*8.2,.8*Math.sin(t*6)] as [number,number,number],camera:[2.4-q*3,4.2-q*1.9,7.3] as [number,number,number],target:[0,1.4,0] as [number,number,number]};}
 const settle=smooth((q-.62)/.205);return {p:[-.9+.8*smooth(q/.825)+.16*Math.sin(q*14)*(1-settle),(1.6+.65*Math.sin(q*Math.PI))*(1-settle)+.57*settle,.4-.2*clamp(q/.825)] as [number,number,number],r:[.35+(1.43-.35)*settle+.2*Math.sin(t*3)*(1-settle),.2+Math.sin(t*2.3)*.75*(1-settle),.25*Math.sin(t*4)*(1-settle)] as [number,number,number],camera:[2.9-q*.7,2.4-q*.25,7.2-q*.6] as [number,number,number],target:[.25,1.15,0] as [number,number,number]};
}
export const hash=(n:number)=>{const v=Math.sin(n*127.1+311.7)*43758.5453;return v-Math.floor(v)};
