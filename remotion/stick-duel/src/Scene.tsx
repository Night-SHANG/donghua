import React from 'react';import {AbsoluteFill,staticFile,useCurrentFrame} from 'remotion';import {Audio} from '@remotion/media';import {skeletonAt,cameraAt,events,mix,clamp,dist,type P} from './motion';
const colors=['#192b35','#d3554a'];
const line=(p:P[])=>p.map((v,i)=>`${i?'L':'M'}${v.x.toFixed(2)} ${v.y.toFixed(2)}`).join(' ');
export function Fighter({frame,id,opacity=1,ghost=false}:{frame:number;id:number;opacity?:number;ghost?:boolean}){const {joints:j}=skeletonAt(frame,id),color=colors[id];return <g opacity={opacity} fill="none" stroke={color} strokeWidth={15} strokeLinecap="round" strokeLinejoin="round">
 <path d={line([j.hip,j.kneeB,j.footB])} stroke={ghost?color:id?'#a8423c':'#42545c'}/><path d={line([j.shoulder,j.elbowB,j.wristB])} stroke={ghost?color:id?'#a8423c':'#42545c'}/>
 <path d={line([j.hip,j.shoulder,j.neck])}/><path d={line([j.hip,j.kneeA,j.footA])}/><path d={line([j.shoulder,j.elbowA,j.wristA])}/>
 <circle cx={j.head.x} cy={j.head.y} r={25} fill={color} stroke="none"/>
 {!ghost&&<><circle cx={j.wristA.x} cy={j.wristA.y} r={8.2} fill={color} stroke="none"/><circle cx={j.wristB.x} cy={j.wristB.y} r={7.5} fill={color} stroke="none"/></>}
 </g>}
function Impact({frame}:{frame:number}){return <g>{events.map(e=>{const age=frame-e.frame;if(age<0||age>15)return null;const p=skeletonAt(e.frame,e.attacker).joints[e.limb],u=age/15;return <g key={e.name} transform={`translate(${p.x} ${p.y})`} opacity={Math.pow(1-u,1.4)}>
 <ellipse rx={8+age*4*e.power} ry={12+age*6*e.power} stroke={e.kind==='block'?'#e3b859':'#dc6751'} strokeWidth={Math.max(1,5-age*.25)} fill="none"/>
 {Array.from({length:9},(_,i)=>{const a=i/9*Math.PI*2+.2,near=12+age*2,far=near+15+e.power*35*(1-u);return <path key={i} d={`M${Math.cos(a)*near} ${Math.sin(a)*near} L${Math.cos(a)*far} ${Math.sin(a)*far}`} stroke={i%3?'#dfb767':'#fff8df'} strokeWidth={i%3?3:6} strokeLinecap="round"/>})}
 </g>})}</g>}
export function World({frame,fx=true}:{frame:number;fx?:boolean}){const c=cameraAt(frame),shakeFree=fx?c:{...c};if(!fx){const noShake=cameraAt(frame);shakeFree.x=frame<270?1000:frame<390?1060:frame<430?1000:frame<480?1100:1260;shakeFree.y=610;}
 const af=skeletonAt(frame,0),bf=skeletonAt(frame,1);return <svg xmlns="http://www.w3.org/2000/svg" width="1920" height="1080" viewBox="0 0 1920 1080">
 <defs><linearGradient id="sky" x2="0" y2="1"><stop stopColor="#f3f1e9"/><stop offset="1" stopColor="#e3e8e3"/></linearGradient><linearGradient id="floor" x2="0" y2="1"><stop stopColor="#d5ddd7"/><stop offset="1" stopColor="#b8c8c1"/></linearGradient></defs>
 <rect width="1920" height="1080" fill="url(#sky)"/>
 <g transform={`translate(${960-shakeFree.x*shakeFree.scale} ${540-shakeFree.y*shakeFree.scale}) scale(${shakeFree.scale})`}>
 <path d="M-1000 850 H3000 V1600 H-1000Z" fill="url(#floor)"/>
 <path d="M-1000 850 H3000" stroke="#596d6d" strokeWidth="3"/>
 <path d="M-500 930 H2400 M-500 1120 H2400 M0 850 L-600 1600 M600 850 L280 1600 M1200 850 L1480 1600 M1800 850 L2440 1600" stroke="#6d8580" strokeWidth="2" opacity=".15"/>
 <path d="M-200 720 L-200 250 L250 250 L250 720 M1700 720 L1700 250 L2100 250" fill="none" stroke="#b3c1ba" strokeWidth="18" opacity=".22"/>
 {[af,bf].map((s,i)=><ellipse key={i} cx={s.joints.hip.x} cy="852" rx={75-clamp((697-s.joints.hip.y)/250)*30} ry="8" fill="#213b3c" opacity={.13-clamp((697-s.joints.hip.y)/250)*.06}/>)}
 {fx&&[0,1].map(id=>{const a=skeletonAt(frame,id).joints.hip,b=skeletonAt(Math.max(0,frame-2),id).joints.hip;return dist(a,b)>11?[8,5,3].map((delay,i)=><Fighter key={`${id}-${delay}`} frame={Math.max(0,frame-delay)} id={id} opacity={.045+i*.025} ghost/>):null})}
 <Fighter frame={frame} id={0}/><Fighter frame={frame} id={1}/>
 {fx&&<Impact frame={frame}/>}
 {fx&&[191,205,321,550,570].map((f,i)=>{const age=frame-f;if(age<0||age>30)return null;const id=f>=550?1:0,x=skeletonAt(f,id).joints.hip.x;return <g key={f} opacity={.3*(1-age/30)}>{Array.from({length:6},(_,j)=><ellipse key={j} cx={x+(j-2.5)*(age+8)*1.8} cy={845-Math.sin(age/30*Math.PI)*(8+j%3*6)} rx={7+age*.4} ry={3+age*.12} fill="#607a73"/>)}</g>})}
 {fx&&frame>=455&&frame<462&&<path d="M1025 730 Q990 630 1112 540" fill="none" stroke="#f0bc64" strokeWidth={16-(frame-455)} strokeLinecap="round" opacity={.32}/>} 
 </g></svg>}
export function Scene({fx=true}:{fx?:boolean}){const f=useCurrentFrame();return <AbsoluteFill><World frame={f} fx={fx}/><Audio src={staticFile('audio/master.wav')}/></AbsoluteFill>}
