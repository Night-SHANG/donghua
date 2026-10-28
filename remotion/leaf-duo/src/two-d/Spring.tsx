import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {Svg,Paper,Leaf,Flower,Reed,rand,smooth} from './art';
import {leaf2DMotion} from './motion';
export const Spring:React.FC=()=>{const t=useCurrentFrame()/useVideoConfig().fps;const leaf=leaf2DMotion(0,t);return <Svg bg="#ecebdc"><defs><radialGradient id="spring-wash"><stop stopColor="#f9f4df"/><stop offset="1" stopColor="#b9c9b3"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#spring-wash)"/>
<g transform={`translate(960 540) scale(${1+.035*t}) translate(-960 -540)`}>
{[0,1,2].map(i=><path key={i} d={`M-100 ${850+i*90} Q400 ${550+i*90} 950 ${830+i*30} T2050 ${670+i*100} L2050 1200H-100Z`} fill={['#ced3b9','#b6c6ab','#8aa78d'][i]} opacity=".6"/>)}
{Array.from({length:24},(_,i)=><Reed key={i} x={i*90-50} y={1130+rand(i)*80} h={160+rand(i+20)*260} t={t*1.8+i} color={i%2?'#6a927d':'#8ba482'}/>)}
<path d="M-50 100 Q420 160 730 520 Q810 620 968 753" stroke="#7c8e72" strokeWidth="13" fill="none"/>
{Array.from({length:18},(_,i)=><Flower key={i} x={120+i*42} y={150+i*27+Math.sin(i)*45} s={.45+rand(i)*.5} color={i%2?'#faf0e8':'#deaab4'} angle={i*41+Math.sin(t+i)*5}/>)}
{Array.from({length:35},(_,i)=>{let a=i*2.4+t*.3, r=140+rand(i)*450;return <ellipse key={i} cx={960+Math.cos(a)*r} cy={450+Math.sin(a)*r*.6} rx={5+rand(i)*8} ry="4" fill={i%3?'#f8e2d9':'#e5b6bd'} opacity=".7" transform={`rotate(${i*23+t*30} ${960+Math.cos(a)*r} ${450+Math.sin(a)*r*.6})`}/>})}
<Leaf {...leaf} color="#82a65e"/>
{t<1.35&&<path d="M0 -20 Q-20 5 0 14 Q20 5 0 -20" transform={`translate(912 ${310+310*smooth(t/1.1)})`} fill="#f5ffff" opacity=".85" stroke="#9ebcbc" strokeWidth="2"/>}
{t>1&&t<2&&Array.from({length:7},(_,i)=><circle key={i} cx={912+Math.cos(i)*100*(t-1)} cy={620+Math.sin(i)*80*(t-1)} r={5*(2-t)} fill="#fff"/>)}
</g><Paper id="paper-spring"/></Svg>};
