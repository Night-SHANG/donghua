import React from 'react';
import {progress,mix,umbrellaOpen,windowOpen,umbrellaCenter} from './motion';
const ink='#434b4b';
export const PaperMagic:React.FC<{t:number}>=({t})=>{
 const u=umbrellaOpen(t),w=windowOpen(t),center=umbrellaCenter(t);
 const tilt=progress(t,15.2,16.6)*16*(1-progress(t,24.8,25.5));
 const stampCorners=[[-64,-31],[64,-31],[68,31],[-68,31]];
 const canopyCorners=[[-167,59],[-76,-39],[92,-31],[170,63]];
 const vertices=stampCorners.map((p,i)=>[mix(p[0],canopyCorners[i][0],u),mix(p[1],canopyCorners[i][1],u)]);
 const river=progress(t,5.3,7.8),vapor=progress(t,20.3,24.3);
 const foldY=mix(728,543,w),foldX=mix(1330,1301,w);
 return <g stroke={ink} strokeLinejoin="round" strokeLinecap="round">
 {/* water is drawn along its ink route, never a different replacement object */}
 <path d="M885 720C900 748 940 726 962 742S1012 726 1029 700S1061 677 1100 666" fill="none" stroke="#467b8c" strokeWidth={7-3*vapor} pathLength="1" strokeDasharray={`${river} 1`} opacity={1-vapor*.85}/>
 <path d="M885 718C900 746 940 724 962 740S1012 724 1029 698S1061 675 1100 664" fill="none" stroke="#c7e8db" strokeWidth="2" pathLength="1" strokeDasharray={`${river} 1`} opacity={1-vapor}/>
 {Array.from({length:7},(_,i)=>{const a=progress(t,20.4+i*.2,23.5+i*.1);return <path key={i} d={`M${912+i*24} ${725-a*112}q-15-13 1-22t-2-23`} fill="none" stroke="#ede6c8" strokeWidth="2" opacity={Math.sin(a*Math.PI)*.7}/>})}
 {/* envelope sits on desk; triangular flap has one invariant horizontal hinge */}
 <path d="M1180 744L1428 700L1504 816L1250 864Z" fill="#605647" opacity=".15" stroke="none"/>
 <path d="M1165 730L1405 687L1480 794L1230 838Z" fill="#e7d7b8" strokeWidth="2"/>
 <path d="M1165 730L1330 766L1405 687M1230 838L1292 756M1480 794L1380 744" fill="none" strokeWidth="1.3"/>
 <path d={`M1165 730L1405 687L${foldX} ${foldY}Z`} fill={w>.5?'#fbebc6':'#eddfc4'} strokeWidth="2"/>
 <path d={`M1179 728L1391 691L${mix(1329,1300,w)} ${mix(722,557,w)}Z`} fill="none" stroke="#c5b598" strokeWidth="1"/>
 <defs><clipPath id="paper-window"><path d={`M${mix(1285,1190,w)} ${mix(708,712,w)}L${mix(1285,1380,w)} ${mix(708,681,w)}L${mix(1285,1300,w)} ${mix(708,571,w)}Z`}/></clipPath></defs>
 <g clipPath="url(#paper-window)" strokeWidth="1.2">
 <path d="M1160 540H1420V735H1160Z" fill="#f3d492"/>
 <circle cx="1308" cy="622" r="19" fill="#fff4bc" stroke="none"/>
 <path d="M1160 719Q1220 652 1270 682T1420 663V735H1160Z" fill="#a9b28a"/>
 <path d="M1160 735Q1225 674 1285 709T1420 690V755H1160Z" fill="#779d8a"/>
 <path d="M1283 568V727M1180 676L1405 639" stroke="#f9e9c9" strokeWidth="5"/>
 </g>
 <ellipse cx={mix(1330,1301,w)} cy={mix(728,566,w)} rx="12" ry={mix(7,11,w)} fill="#bd8170" stroke="#8f6159"/>
 <path d="M1165 730L1405 687" stroke="#8e806c" strokeWidth="2.4"/>
 {/* umbrella/stamp: identical four connected facets at every frame */}
 <ellipse cx="1100" cy="679" rx={mix(72,127,u)} ry={mix(14,28,u)} fill="#3a5353" opacity={.15-u*.06} stroke="none"/>
 <g transform={`translate(${center.x} ${center.y}) rotate(${tilt})`}>
 <path d={`M0 0L${7*u} ${220*u}q${-2*u} ${25*u} ${-22*u} ${24*u}q${-20*u} ${-1*u} ${-20*u} ${-22*u}`} fill="none" stroke="#655b48" strokeWidth={2+2*u}/>
 {vertices.map((v,i)=>{const n=vertices[(i+1)%4];return <g key={i}><path d={`M0 0L${v[0]} ${v[1]}L${n[0]} ${n[1]}Z`} fill={['#d6ab90','#e6c6a1','#adbbac','#88a6a2'][i]} strokeWidth="2"/><path d={`M0 0L${(v[0]+n[0])*.5} ${(v[1]+n[1])*.5}`} fill="none" stroke="#faf0cf" strokeWidth="1" opacity=".6"/>{Array.from({length:8},(_,j)=>{const f=(j+1)/9;return <circle key={j} cx={v[0]+(n[0]-v[0])*f} cy={v[1]+(n[1]-v[1])*f} r="1.8" fill="#fff0cd" stroke="none"/>})}</g>})}
 <circle r={7-3*u} fill="#e9d9af" strokeWidth="1.2"/>
 <path d={`M${-30*(1-u)} ${-9*(1-u)}q${8*(1-u)} ${-13*(1-u)} ${17*(1-u)} 0t${17*(1-u)} 0`} fill="none" stroke="#6f877f" opacity={1-u}/>
 </g>
 {/* contact drops */}
 {t>2.8&&t<4.2&&(()=>{const p=progress(t,2.8,3.6);return <g><path d={`M${mix(560,885,p)} ${mix(590,720,p)-12}q-13 22 0 22q13 0 0-22`} fill="#b7d8d7" stroke="#6d959f" strokeWidth="1" opacity={1-progress(t,3.6,3.75)}/><ellipse cx="885" cy="720" rx={progress(t,3.6,4.2)*37} ry={progress(t,3.6,4.2)*11} fill="none" stroke="#9ac4c1" opacity={1-progress(t,3.65,4.2)}/></g>})()}
 {t>16.1&&t<17.3&&(()=>{const p=progress(t,16.1,16.8);return <g><path d={`M${mix(1244,1330,p)} ${mix(528,728,p)-10}q-10 18 0 18q10 0 0-18`} fill="#c0ded6" stroke="#63939b" strokeWidth="1" opacity={1-progress(t,16.8,16.94)}/><ellipse cx="1330" cy="728" rx={progress(t,16.8,17.3)*28} ry={progress(t,16.8,17.3)*9} fill="none" stroke="#61969c" opacity={1-progress(t,16.85,17.3)}/></g>})()}
 <g transform="translate(885 720)" opacity={progress(t,27.2,27.8)} stroke="#c7a45f" fill="none" strokeWidth="1.4"><ellipse rx="22" ry="11"/>{Array.from({length:12},(_,i)=>{const a=i*Math.PI/6;return <path key={i} d={`M${Math.cos(a)*29} ${Math.sin(a)*15}L${Math.cos(a)*37} ${Math.sin(a)*19}`}/>})}</g>
 </g>
};
