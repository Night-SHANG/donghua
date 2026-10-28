import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {Svg,Paper,Leaf,rand,smooth} from './art';
import {leaf2DMotion} from './motion';
export const Autumn:React.FC=()=>{const t=useCurrentFrame()/useVideoConfig().fps;const l=leaf2DMotion(2,t);const page=smooth((t-2.0)/1.45);return <Svg bg="#ead4b2"><defs><radialGradient id="autumn-light"><stop stopColor="#fff3d4"/><stop offset="1" stopColor="#d1b18e"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#autumn-light)"/>
<circle cx="1460" cy="210" r="140" fill="#fff4d6" opacity=".7"/>
{Array.from({length:10},(_,i)=>{const x=i*240-160,y=850;return <g key={i} opacity={.17+rand(i)*.15}><path d={`M${x} 1100 Q${x+40} 600 ${x-40} 120 M${x+15} 670L${x+150} 390 M${x} 410L${x-140} 250`} fill="none" stroke="#99785c" strokeWidth="14"/>{Array.from({length:12},(_,j)=><ellipse key={j} cx={x-170+rand(i*100+j)*340} cy={120+rand(i*100+j+35)*400} rx="100" ry="65" fill={j%2?'#c18e58':'#d0a369'}/> )}</g>})}
<path d="M0 940 Q480 780 960 930T1920 880V1080H0Z" fill="#b58d6e" opacity=".25"/>
<g transform={`translate(960 660) rotate(${-3+Math.sin(t)*2}) scale(${1+.025*t})`}>
<ellipse cy="230" rx="480" ry="32" fill="#795e45" opacity=".13"/>
<path d="M-500 30 Q-220 -30 0 60 Q220 -30 500 30 L510 175 Q200 120 0 195 Q-200 120 -510 175Z" fill="#8c7760"/>
{[6,3,0].map(i=><path key={i} d={`M-490 ${15+i*4} Q-220 -55 0 40 Q220 -55 490 ${15+i*4} L490 ${150+i*4} Q230 85 0 178 Q-230 85 -490 ${150+i*4}Z`} fill="#f7e8c8" stroke="#c2a989" strokeWidth="2"/>)}
{Array.from({length:7},(_,i)=><g key={i} stroke="#c8b394" strokeWidth="2" opacity=".6"><path d={`M-410 ${20+i*16} Q-210 ${-10+i*17} -55 ${45+i*17}`}/><path d={`M55 ${45+i*17} Q210 ${-10+i*17} 410 ${20+i*16}`}/></g>)}
{page>0&&<path d={`M0 40 Q${440*(1-page)} ${-90-330*Math.sin(page*Math.PI)} ${470*Math.cos(page*Math.PI)} ${10-300*Math.sin(page*Math.PI)} L${470*Math.cos(page*Math.PI)} ${145-300*Math.sin(page*Math.PI)} Q${220*(1-page)} ${100-250*Math.sin(page*Math.PI)} 0 178Z`} fill="#fff3d7" stroke="#bfa78a" strokeWidth="2"/>}
</g>
{Array.from({length:15},(_,i)=>{const p=(t*.16+rand(i))%1;return <Leaf key={i} x={100+rand(i+40)*1700+Math.sin(p*7+i)*70} y={-150+p*1300} rotation={i*57+p*180} scale={.15+rand(i)*.18} fold={.8} color={i%2?'#c29652':'#b77756'}/>})}
<Leaf {...l} color="#cf9d4c"/><Paper id="paper-autumn"/></Svg>};
