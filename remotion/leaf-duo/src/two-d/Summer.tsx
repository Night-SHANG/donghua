import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {Svg,Paper,Leaf,Flower,Reed,rand} from './art';
import {leaf2DMotion} from './motion';
export const Summer:React.FC=()=>{const t=useCurrentFrame()/useVideoConfig().fps;const l=leaf2DMotion(1,t);return <Svg bg="#b7d2ca"><defs><radialGradient id="pond"><stop stopColor="#e3e8d0"/><stop offset="1" stopColor="#739f9c"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#pond)"/>
{Array.from({length:21},(_,i)=><path key={i} d={`M${rand(i)*1500-100} ${60+i*49} q200 ${Math.sin(t+i)*9} 420 0`} fill="none" stroke="#e3ebd9" strokeWidth={i%3+1} opacity=".35"/>)}
<g transform={`translate(960 540) rotate(${-3+t*1.6}) scale(${1+t*.018}) translate(-960 -540)`}>
{Array.from({length:14},(_,i)=>{const x=130+rand(i)*1700,y=170+rand(i+40)*750,s=.55+rand(i+70);return <g key={i} transform={`translate(${x} ${y}) scale(${s})`} opacity=".8"><ellipse cy="13" rx="100" ry="42" fill="#577f79" opacity=".2"/><path d="M0 0 L80 -20 A90 48 0 1 1 63 -34Z" fill={i%2?'#739e8a':'#92b19a'} stroke="#d0d8b6" strokeWidth="2"/>{i%3===0&&<Flower x={0} y={-24} s={1.1} color="#faeee0" angle={i*15}/>}</g>})}
{[0,1,2,3].map(i=><ellipse key={i} cx="960" cy="570" rx={220+i*70+(t*40)%70} ry={90+i*28+(t*16)%28} fill="none" stroke="#f5efda" strokeWidth="2" opacity={.18}/>) }
<Leaf {...l} y={l.y+30} color="#4d8872" scale={l.scale} fold={l.fold} />
{Array.from({length:9},(_,i)=><ellipse key={i} cx={l.x-15-i*13} cy={l.y+95+i*4} rx={10+i*4} ry="2" fill="#f8f6df" opacity={.35-i*.03}/>)}
<g transform={`translate(${400+t*350} ${300+Math.sin(t*3)*65}) rotate(10)`} stroke="#657f79" strokeWidth="4"><path d="M-32 0H35"/><ellipse cx="0" cy="-15" rx="27" ry={8+Math.sin(t*55)*4} fill="#eef5e3" opacity=".7"/><ellipse cx="0" cy="15" rx="27" ry={8+Math.sin(t*55)*4} fill="#eef5e3" opacity=".7"/></g>
</g>{Array.from({length:10},(_,i)=><Reed key={i} x={i<5?i*45:1750+(i-5)*40} y={1100} h={300+rand(i)*260} t={t+i} color="#446d62"/>)}<Paper id="paper-summer"/></Svg>};
