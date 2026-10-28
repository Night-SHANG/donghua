import React from 'react';
import {progress,mix} from './motion';
const ink='#373c43';
export const Definitions=()=> <defs>
 <linearGradient id="wall" x2="0" y2="1"><stop stopColor="#626f7b"/><stop offset="1" stopColor="#b0b1a7"/></linearGradient>
 <linearGradient id="sky" x2="0" y2="1"><stop stopColor="#899fa9"/><stop offset="1" stopColor="#d6d9cb"/></linearGradient>
 <linearGradient id="wood" x2=".4" y2="1"><stop stopColor="#ba9879"/><stop offset=".5" stopColor="#cca98b"/><stop offset="1" stopColor="#957a68"/></linearGradient>
 <linearGradient id="paper" x2=".8" y2="1"><stop stopColor="#fff6da"/><stop offset="1" stopColor="#d9d3b7"/></linearGradient>
 <radialGradient id="glow"><stop stopColor="#ffe4a0" stopOpacity=".8"/><stop offset="1" stopColor="#ffe4a0" stopOpacity="0"/></radialGradient>
 <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".48" numOctaves="3" seed="7"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".065"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
 <filter id="soft"><feGaussianBlur stdDeviation="10"/></filter>
 <clipPath id="opening"><path d="M205 82H940V595H205Z"/></clipPath>
 </defs>;
export const RoomArt:React.FC<{t:number}>=({t})=>{
 const sun=progress(t,18,24),rain=1-progress(t,20,25);
 return <g stroke={ink} strokeWidth="2.2" strokeLinejoin="round">
 <path d="M0 0H1920V1080H0Z" fill="url(#wall)"/>
 <path d="M1440 0V690M1460 0V680" stroke="#7b807f"/>
 <g clipPath="url(#opening)">
 <path d="M205 82H940V595H205Z" fill="url(#sky)"/>
 <path d="M205 82H940V595H205Z" fill="#f7d998" opacity={sun*.8}/>
 <g fill="#849597" stroke="#5e7178"><path d="M180 460L320 316L466 460V630H180Z"/><path d="M431 415L610 275L803 415V630H431Z"/><path d="M700 484L866 344L1026 484V630H700Z"/></g>
 <g stroke="#53676e" opacity=".6">{Array.from({length:8},(_,i)=><path key={i} d={`M${240+i*27} ${399-i*12}l125 114M${470+i*29} ${394-i*18}l140 100`}/>)}</g>
 <g fill="#d5c8a2">{[260,365,530,650,790,891].map((x,i)=><g key={x}><path d={`M${x} 475h42v68h-42z`}/><path d={`M${x+21} 475v68m-21-34h42`} fill="none"/></g>)}</g>
 <path d="M744 590C754 470 777 431 819 411M770 483l-49-46m63 11 45-60m-29 47 61 4" fill="none" stroke="#526b65" strokeWidth="6"/>
 {Array.from({length:85},(_,i)=>{const x=210+(i*139.1)%730,y=85+((i*61+t*310)%510);return <path key={i} d={`M${x} ${y}l-7 26`} stroke="#e3eee8" strokeWidth="1.6" opacity={rain*(.2+(i%4)*.12)}/>})}
 </g>
 <g fill="#d4c8af"><path d="M178 56H966V80H178Z"/><path d="M178 80H205V620H178Z"/><path d="M940 80H966V620H940Z"/><path d="M164 595H982V625H164Z"/></g>
 <g fill="#acb3a5"><path d="M205 84L104 130V630L205 593Z"/><path d="M217 96L117 141V610L217 579Z" fill="#c6d5cd" fillOpacity=".26"/><path d="M114 152l81-33m-81 238 81-16m-81 231 81-23" fill="none"/></g>
 <path d="M0 738L1260 600L1920 826V1080H0Z" fill="url(#wood)"/>
 <path d="M0 946L1920 974V1080H0Z" fill="#796553"/>
 <path d="M0 946L1920 974" stroke="#e0bb96" strokeWidth="5"/>
 {[0,1,2,3,4,5].map(i=><path key={i} d={`M0 ${755+i*34}Q850 ${620+i*63} 1920 ${840+i*24}`} fill="none" stroke="#795f4e" strokeWidth="1" opacity=".35"/>)}
 <path d="M480 799L1260 633L1520 822L719 962Z" fill="#5b5548" opacity=".25" filter="url(#soft)" stroke="none"/>
 <path d="M470 765L1240 622L1480 799L704 934Z" fill="url(#paper)"/>
 <path d="M480 775L1239 634M711 924L1467 793" stroke="#faf4dc" fill="none"/>
 <g stroke="#6b7371" opacity=".6" strokeWidth="1.4" fill="none">{[0,1,2,3,4].map(i=><path key={i} d={`M${626+i*18} ${762+i*20}q65-23 99-14t78-20t80-11t78-17`}/>)}<path d="M660 741q18-33 26-7t38-12m-36 175q49-26 112-20"/></g>
 <g transform="translate(1540 715) rotate(17)"><ellipse rx="75" ry="20" cy="58" fill="#534f45" opacity=".25" stroke="none"/><path d="M-55-45Q-60 40-36 58Q0 73 42 55L57-45Z" fill="#c7d1c5"/><ellipse cy="-45" rx="57" ry="17" fill="#788d86"/><path d="M57-26C120-52 113 52 49 32" fill="none" stroke="#d9dbca" strokeWidth="12"/><path d="M-40-35l5 75" stroke="#eef0db" strokeWidth="5" opacity=".5"/></g>
 <g transform="translate(390 618)"><ellipse cy="38" rx="53" ry="12" fill="#4e574b" opacity=".3" stroke="none"/><path d="M-33-45Q-61 22-21 36Q11 48 35 26Q47 8 24-45Z" fill="#92a59c"/><ellipse cy="-45" rx="29" ry="9" fill="#536b65"/><path d="M-3-44Q8-119-28-190M2-65q64-60 67-119M-3-90q-54-23-56-63" fill="none" stroke="#465d51" strokeWidth="3"/><path d="M-25-177q-42-34-17-43q29 4 17 43M46-142q36-40 40-17q0 19-40 17M-42-136q-36-14-27-32q24-1 27 32" fill="#769475"/></g>
 <g transform="translate(780 898) rotate(-12)"><path d="M0 0h263v13H0Z" fill="#3b5357"/><path d="M263 0l35 7-35 6Z" fill="#b7a788"/><path d="M287 5l11 2-11 2Z" fill="#333b40"/><path d="M15 2h225" stroke="#7c9190"/></g>
 <ellipse cx="1250" cy="600" rx="650" ry="550" fill="url(#glow)" stroke="none" opacity={sun*.65}/>
 </g>
};
