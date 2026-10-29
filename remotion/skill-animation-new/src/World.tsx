import React from 'react';
import {Figure,solve} from './stickman/stick';
import {heroPose,hatAt,cameraAt,birdAt,leafAt,curve,clamp,SCALE,GROUND} from './timeline';
const C={paper:'#f4eedf',ink:'#304847',gold:'#dca949',rust:'#ab5f45',sage:'#a5af87',hill:'#c6cfb6',blue:'#cad8d2'};
const rnd=(n:number)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
const Leaf:React.FC<{x:number,y:number,r?:number,s?:number,c?:string}>=({x,y,r=0,s=1,c=C.rust})=><g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}><path d="M-32 2 Q-22-35 12-31 L42-23 Q31 8 0 19 Z" fill={c} stroke={C.ink} strokeWidth="2.2"/><path d="M-39 21 Q-4-4 31-23 M-5-2 L-10-19 M8-10 L24-3" fill="none" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round"/></g>;
const Hat:React.FC<{x:number,y:number,r:number,s:number}>=({x,y,r,s})=><g transform={`translate(${x} ${y}) rotate(${r}) scale(${s})`}><ellipse cy="3" rx="98" ry="17" fill="#8e673c" stroke={C.ink} strokeWidth="4"/><path d="M-64 0 L-52-58 Q-39-84 5-80 Q46-80 56-51 L66 0Z" fill={C.gold} stroke={C.ink} strokeWidth="4" strokeLinejoin="round"/><path d="M-61-20 Q0-5 61-22 L66-5 Q0 12-65-4Z" fill={C.rust}/><path d="M-91 0 Q-10 25 96 0" fill="none" stroke="#f4ce7c" strokeWidth="5" strokeLinecap="round"/><path d="M-41-61 Q-4-75 28-63" fill="none" stroke="#ecc16d" strokeWidth="6" opacity=".65"/></g>;
const Tree:React.FC<{x:number,y:number,s:number,seed:number,fore?:boolean}>=({x,y,s,seed,fore=false})=><g transform={`translate(${x} ${y}) scale(${s})`}><path d="M-20 0 L-11-280 -67-354 -54-366 7-302 63-390 77-382 22-282 30 0Z" fill={fore?'#645b48':'#8c8165'} stroke={C.ink} strokeWidth={fore?4:2} strokeLinejoin="round"/>{Array.from({length:12},(_,i)=>{const xx=(rnd(seed+i)-.5)*300,yy=-340+(rnd(seed+i+41)-.5)*170,rr=55+rnd(seed+i+78)*45;return <path key={i} d={`M${xx-rr} ${yy} q${rr*.1} ${-rr*.9} ${rr} ${-rr*.72} q${rr*.9} ${-rr*.1} ${rr*.85} ${rr*.8} q${-rr*.2} ${rr*.8} ${-rr} ${rr*.7} q${-rr*.9} ${rr*.1} ${-rr*.85} ${-rr*.78}Z`} fill={['#b76c48','#c78750','#a95d45','#ce9b61'][i%4]} stroke={fore?C.ink:'#a37e55'} strokeWidth={fore?3:1.3}/>})}</g>;
function Environment({f}:{f:number}){return <>
 <rect x="-1600" y="-1300" width="7200" height="3000" fill={C.paper}/>
 <path d="M-1600 380 Q-900 150-100 380 T1500 350 T3200 360 T5600 300 L5600 1000H-1600Z" fill={C.blue}/>
 <path d="M-1600 540 Q-800 330 100 510 T1700 490 T3400 470 T5600 520 L5600 1000H-1600Z" fill={C.hill}/>
 {Array.from({length:28},(_,i)=>{const x=-800+i*220;return <g key={i} opacity=".46"><path d={`M${x} 690 l4 -145`} stroke="#87957d" strokeWidth="5"/><ellipse cx={x} cy={540+rnd(i)*70} rx={25+rnd(i+22)*20} ry={45+rnd(i+44)*30} fill={i%2?'#bd9873':'#98a084'}/></g>})}
 <path d="M-1600 785 Q0 720 1200 800 T3400 775 T5600 805 V1600H-1600Z" fill="#b5bc91"/>
 <path d="M-1600 860 Q100 850 900 865 T2400 854 T5600 858 V1600H-1600Z" fill="#ddd0a2"/>
 <path d="M-1600 860 Q100 850 900 865 T2400 854 T5600 858" fill="none" stroke="#7d8264" strokeWidth="4"/>
 <Tree x={125} y={862} s={1.9} seed={2} fore/>
 <Tree x={1660} y={860} s={1.33} seed={22}/>
 <path d="M1668 580 Q1770 555 1938 577" fill="none" stroke="#75664c" strokeWidth="25" strokeLinecap="round"/>
 <path d="M1730 565 L1780 518 M1840 569 L1870 526" fill="none" stroke="#75664c" strokeWidth="10" strokeLinecap="round"/>
 <Leaf x={1810} y={534} r={-40} s={1.2}/><Leaf x={1895} y={566} r={40}/>
 <ellipse cx="2530" cy="870" rx="225" ry="27" fill="#96b3ac" stroke="#6f928b" strokeWidth="3"/>
 <path d="M2390 865 Q2500 851 2630 863 M2470 880 Q2550 869 2680 875" stroke="#e2e5cf" strokeWidth="5" fill="none" strokeLinecap="round"/>
 <Tree x={3570} y={860} s={1.8} seed={62}/>
 {Array.from({length:110},(_,i)=>{const x=-450+i*43;const y=878+rnd(i+31)*90;return <g key={i}>{i%3===0?<Leaf x={x} y={y} r={rnd(i+9)*360} s={.16+rnd(i)*.14} c={i%2?C.rust:'#b4a260'}/>:<path d={`M${x} ${y} l-4 -${10+rnd(i)*20} m4 ${10+rnd(i)*20} l6 -${12+rnd(i+3)*15}`} stroke="#92946b" strokeWidth="2" opacity=".65"/>}</g>})}
 <path d="M3150 856 l-17-35 m17 35 l8-42 m-8 42 l29-25" stroke="#7c8968" strokeWidth="3" fill="none"/>
 </>}
const wind=(f:number)=>clamp((f-55)/20)*(1-clamp((f-400)/25));
function Wind({f}:{f:number}){const a=wind(f);return <g opacity={a*.55} stroke="#f7f2df" strokeWidth="5" fill="none" strokeLinecap="round">{Array.from({length:8},(_,i)=>{const x=400+((f*15+i*360)%3400),y=270+i%4*130;return <path key={i} d={`M${x-150} ${y} q100 -25 150 -5 q90 40 155 0`}/>})}</g>}
function Dust({f,fx}:{f:number,fx:boolean}){const t=f-358;if(!fx||t<0||t>30)return null;return <g opacity={1-t/30}>{[0,1,2,3,4].map(i=><ellipse key={i} cx={2850+(i-2)*t*3} cy={855-t*(i%2+1)} rx={8+t*.6} ry={5+t*.35} fill="#eee3c5" stroke="#c8b487" strokeWidth="2"/>)}</g>}
function Bird({f}:{f:number}){const b=birdAt(f);if(!b.visible)return null;const t=b.peek;return <g transform={`translate(${b.x} ${b.y})`}>
 <ellipse cx="0" cy="20" rx="34" ry="7" fill="#756e52" opacity=".18"/>
 <path d="M-28 12 Q-43-5-26-18 Q-25-50 4-48 Q35-45 31-16 Q45 1 25 14Z" fill="#8c9c84" stroke={C.ink} strokeWidth="3.5"/>
 <path d="M-22 4 Q-5-19 15 0" fill="#d7d9b8" stroke={C.ink} strokeWidth="2"/>
 <path d="M24-30 L44-22 25-16Z" fill={C.gold} stroke={C.ink} strokeWidth="2.5"/>
 {f<510&&<><circle cx="13" cy="-31" r="4" fill={C.ink}/><circle cx="14" cy="-32" r="1.2" fill="#fff"/></>}
 <path d="M-12 15 l-4 8 m23-8 l5 7" stroke={C.ink} strokeWidth="3"/>
 {f<490&&f>455&&<g stroke="#7c9b9b" strokeWidth="2.5" fill="none" opacity={t}><path d="M-42-30 l-5 8 6 7 -5 8 M48-45 l5 8 -6 7 5 8"/></g>}
 {f>510&&<path d="M9-32 q5 5 10 0" stroke={C.ink} strokeWidth="3" fill="none"/>}
 </g>}
export const World:React.FC<{frame:number,fx?:boolean,camera?:boolean}>=({frame:f,fx=true,camera=true})=>{
 const p=heroPose(f),j=solve(p,SCALE),hat=hatAt(f),cam=cameraAt(f),leaf=leafAt(f);const blink=f%117>=34&&f%117<38;
 return <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
 <defs><pattern id="grain" width="137" height="113" patternUnits="userSpaceOnUse">{Array.from({length:80},(_,i)=><circle key={i} cx={rnd(i+88)*137} cy={rnd(i+192)*113} r={.35+rnd(i+9)*.65} fill="#594e37" opacity={.07+rnd(i+3)*.04}/>)}</pattern></defs>
 <g transform={camera?`translate(960 540) scale(${cam.z}) translate(${-cam.x} ${-cam.y})`:undefined}>
 <Environment f={f}/><Wind f={f}/>
 {f>=76&&f<390&&[0,1,2,3].map(i=><Leaf key={i} x={hat.x-100-i*150} y={hat.y+70+Math.sin(f*.07+i)*70} r={f*2+i*80} s={.3+i*.07} c={i%2?'#ae7050':'#c49e57'}/>)}
 <ellipse cx={p.x+8} cy={GROUND+6} rx={58} ry={12} fill="#6d7054" opacity={f>294&&f<358?.10:.18}/>
 <Dust f={f} fx={fx}/>
 <Figure pose={p} scale={SCALE} color={C.ink} face={f>505?'happy':f>76&&f<395?'eyes':'eyes'}>
 {q=><>
 <path d={`M${q.neck[0]-13} ${q.neck[1]+5} Q${q.neck[0]-40} ${q.neck[1]+22} ${q.neck[0]-72-wind(f)*25} ${q.neck[1]+12+Math.sin(f*.21)*7} L${q.neck[0]-60-wind(f)*20} ${q.neck[1]+33+Math.sin(f*.21)*8} Q${q.neck[0]-24} ${q.neck[1]+35} ${q.neck[0]+10} ${q.neck[1]+13}Z`} fill={C.rust} stroke={C.ink} strokeWidth="3"/>
 <path d={`M${q.neck[0]-13} ${q.neck[1]+1} Q${q.neck[0]} ${q.neck[1]+12} ${q.neck[0]+16} ${q.neck[1]+2}`} stroke={C.rust} strokeWidth="14" strokeLinecap="round" fill="none"/>
 {blink&&<path d={`M${q.headC[0]+5} ${q.headC[1]-5} l30 0`} stroke={C.ink} strokeWidth="17"/>}
 {f>=540&&f<=570&&<path d={`M${q.rHand[0]} ${q.rHand[1]} l10 -8 m-10 8 l13 0 m-13 0 l7 9`} stroke={C.ink} strokeWidth="6" strokeLinecap="round"/>}
 </>}
 </Figure>
 <Bird f={f}/><Hat {...hat}/>
 
 {leaf.visible&&<Leaf x={leaf.x} y={leaf.y} r={leaf.r} s={1.08} c="#b27b42"/>}
 {f>675&&<path d={`M${j.headC[0]-59} ${j.headC[1]-6} q-12-10-17-1 m17 1 q-10 4-14 12`} stroke="#af8553" strokeWidth="3" fill="none" opacity={clamp((690-f)/15)}/>}
 </g>
 <rect width="1920" height="1080" fill="url(#grain)" pointerEvents="none"/>
 <rect x="12" y="12" width="1896" height="1056" rx="2" fill="none" stroke="#a69877" strokeWidth="2" opacity=".18"/>
 </svg>
};
