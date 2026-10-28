import React from 'react';
import {useCurrentFrame,useVideoConfig} from 'remotion';
import {Svg,Paper,Leaf,rand,Flower,smooth} from './art';
import {leaf2DMotion} from './motion';
export const Winter:React.FC=()=>{const t=useCurrentFrame()/useVideoConfig().fps;const l=leaf2DMotion(3,t);return <Svg bg="#e7e9e4"><defs><radialGradient id="winter-light"><stop stopColor="#fcf5e8"/><stop offset="1" stopColor="#ccd9d8"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#winter-light)"/>
<circle cx="580" cy="230" r="102" fill="#fff7e4" opacity=".75"/>
{Array.from({length:15},(_,i)=>{const x=i*156-70;return <g key={i} opacity=".18" stroke="#8fa5a4" fill="none"><path d={`M${x} 900 Q${x-25} 450 ${x+20} 130 M${x} 600L${x-70} 460 M${x+4} 440L${x+95} 320`} strokeWidth="9"/></g>})}
<path d="M0 850Q420 720 980 860T1920 800V1080H0Z" fill="#f6f4eb"/>
<path d="M0 970Q700 810 1260 1000T1920 900V1080H0Z" fill="#fffaf0"/>
<g transform={`translate(960 540) scale(${1+.025*t}) translate(-960 -540)`}>
<path d="M1920 900 Q1530 830 1190 720 Q1080 670 1030 690 M1335 770 Q1290 630 1370 540 M1130 700 Q1110 610 1140 570" stroke="#82968c" strokeWidth="13" fill="none" strokeLinecap="round"/>
<path d="M1920 891 Q1530 820 1190 711 Q1080 661 1030 681 M1335 761 Q1300 630 1370 530" stroke="#fffdf2" strokeWidth="9" fill="none" strokeLinecap="round"/>
<Leaf {...l} color="#b6b9a3"/>
<g opacity={smooth((t-2.7)/.7)}><ellipse cx="1141" cy="566" rx="10" ry="20" fill="#98b189" transform="rotate(25 1141 566)"/><Flower x={1372} y={531} s={.35} color="#edc6c6"/></g></g>
{Array.from({length:90},(_,i)=>{const p=(rand(i)+t*(.025+rand(i+99)*.03))%1;return <circle key={i} cx={rand(i+30)*1980-30+Math.sin(t+i)*20} cy={p*1180-50} r={1.5+rand(i+70)*4} fill="#fffdf3" opacity={.35+rand(i)*.5}/>})}
<Paper id="paper-winter"/></Svg>};
