import React from 'react';
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{const x=clamp(v);return x*x*(3-2*x)};
export const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
export const rand=(n:number)=>{const v=Math.sin(n*127.1+31.7)*43758.5453;return v-Math.floor(v)};
export const Leaf:React.FC<{x:number;y:number;rotation?:number;scale?:number;fold?:number;color?:string;frost?:number}> = ({x,y,rotation=0,scale=1,fold=1,color='#82a455',frost=0})=><g transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scale})`}><g transform={`scale(${fold} 1)`}>
<path d="M0 94 C-15 55 -100 6 -76 -60 C-59 -113 -12 -128 0 -163 C16 -124 94 -92 85 -35 C79 23 16 55 0 94Z" fill={color} stroke="#455846" strokeWidth="2"/>
<path d="M0 80 C-9 18 13 -65 0 -154" fill="none" stroke="#fff6cf" strokeWidth="2.3" opacity=".75"/>
{[-65,-35,-5,25].map((v,i)=><g key={v} stroke="#f4efc4" fill="none" strokeWidth="1.4" opacity=".6"><path d={`M0 ${v+18} Q-30 ${v} ${-56+i*8} ${v-28}`}/><path d={`M3 ${v+12} Q36 ${v-8} ${65-i*8} ${v-32}`}/></g>)}
<path d="M0 90 Q-5 113 12 135" stroke="#6e6848" strokeWidth="4" fill="none"/>
{frost>0&&<g opacity={frost} fill="none" stroke="#fff"><path d="M0 94 C-15 55 -100 6 -76 -60 C-59 -113 -12 -128 0 -163 C16 -124 94 -92 85 -35 C79 23 16 55 0 94" strokeWidth="5"/>{Array.from({length:20},(_,i)=><circle key={i} cx={(rand(i)-.5)*100} cy={-100+rand(i+30)*145} r={2+rand(i+70)*3} fill="#fff"/>)}</g>}
</g></g>;
export const Flower:React.FC<{x:number;y:number;s?:number;color?:string;angle?:number}>=({x,y,s=1,color='#e5a4ae',angle=0})=><g transform={`translate(${x} ${y}) rotate(${angle}) scale(${s})`}>{[0,72,144,216,288].map(a=><ellipse key={a} cx="0" cy="-15" rx="12" ry="21" fill={color} opacity=".85" transform={`rotate(${a})`}/>)}<circle r="7" fill="#f7e6af"/><circle r="3" fill="#b89655"/></g>;
export const Paper:React.FC<{id:string}>=({id})=><><defs><filter id={id}><feTurbulence type="fractalNoise" baseFrequency=".7" numOctaves="3" seed="21"/><feColorMatrix type="saturate" values="0"/></filter><radialGradient id={`${id}-v`}><stop offset=".5" stopColor="#fff" stopOpacity="0"/><stop offset="1" stopColor="#b9a17b" stopOpacity=".15"/></radialGradient></defs><rect width="1920" height="1080" filter={`url(#${id})`} opacity=".055" style={{mixBlendMode:'multiply'}}/><rect width="1920" height="1080" fill={`url(#${id}-v)`}/></>;
export const Svg:React.FC<{children:React.ReactNode;bg:string}>=({children,bg})=><svg viewBox="0 0 1920 1080" style={{width:'100%',height:'100%',display:'block',background:bg}}>{children}</svg>;
export const Reed:React.FC<{x:number;y:number;h:number;t:number;color?:string}>=({x,y,h,t,color='#80988b'})=><g stroke={color} fill={color} opacity=".65"><path d={`M${x} ${y} Q${x-30+Math.sin(t)*12} ${y-h*.6} ${x+Math.sin(t)*20} ${y-h}`} strokeWidth="3" fill="none"/><path d={`M${x-6} ${y-h*.35} Q${x-100} ${y-h*.8} ${x-56} ${y-h*.76} Q${x-2} ${y-h*.63} ${x-6} ${y-h*.35}`}/><path d={`M${x} ${y-h*.55} Q${x+90} ${y-h} ${x+70} ${y-h*.67} Z`}/></g>;
