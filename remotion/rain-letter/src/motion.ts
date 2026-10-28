export const clamp=(x:number)=>Math.max(0,Math.min(1,x));
export const smooth=(x:number)=>{x=clamp(x);return x*x*(3-2*x)};
export const progress=(t:number,a:number,b:number)=>smooth((t-a)/(b-a));
export const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export const umbrellaOpen=(t:number)=>progress(t,10.4,12.2)*(1-progress(t,25.5,27));
export const windowOpen=(t:number)=>progress(t,17.2,19.2);
export const warmLight=(t:number)=>progress(t,18,23);
export const umbrellaCenter=(t:number)=>({x:1100,y:mix(650,420,umbrellaOpen(t))-6*progress(t,8.8,9.15)*(1-progress(t,9.4,10.35))});
export const camera=(t:number)=>{
 if(t<5)return {x:960+12*Math.sin(t*.35),y:540,scale:1+.025*t};
 if(t<10)return {x:980,y:675,scale:1.65+.035*(t-5)};
 if(t<15)return {x:1100,y:535,scale:1.72-.025*(t-10)};
 if(t<20)return {x:1250,y:690,scale:1.72+.025*(t-15)};
 if(t<25)return {x:1230,y:610,scale:1.55+.045*(t-20)};
 return {x:960,y:540,scale:1.08-.016*(t-25)};
};
