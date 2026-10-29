import React from 'react';
import {AbsoluteFill, Composition, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import rawPoses from './poses.json';
import spec from '../film-spec.json';
type Point=[number,number];
type Pose=Record<'hip'|'waist'|'shoulder'|'head'|'handL'|'handR'|'elbowL'|'elbowR'|'kneeL'|'kneeR'|'footL'|'footR',Point>;
type Frame={A:Pose;B:Pose};
const poses=rawPoses as Frame[];
const points=(p:Point[])=>p.map(v=>v.join(',')).join(' ');
const Line=({p,color,width}:{p:Point[];color:string;width:number})=><polyline points={points(p)} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round"/>;
export const Fighter=({p,who}:{p:Pose;who:'A'|'B'})=>{
 const color=who==='A'?'#a3493d':'#226773',back=who==='A'?'#b7786b':'#609098',face=who==='A'?-1:1;
 return <g data-actor={who}>
  {(['L','R'] as const).map(side=><g key={'leg'+side}><Line p={[p.hip,p['knee'+side as keyof Pose],p['foot'+side as keyof Pose]]} color={side==='L'?back:color} width={14}/><Line p={[p['foot'+side as keyof Pose],[p['foot'+side as keyof Pose][0]+face*12,p['foot'+side as keyof Pose][1]]]} color={color} width={12}/></g>)}
  {(['L','R'] as const).map(side=><Line key={'arm'+side} p={[p.shoulder,p['elbow'+side as keyof Pose],p['hand'+side as keyof Pose]]} color={side==='L'?back:color} width={13}/>)}
  <Line p={[p.hip,p.waist,p.shoulder,p.head]} color={color} width={17}/>
  <circle cx={p.head[0]} cy={p.head[1]} r={24} fill={color}/>
  <circle cx={p.head[0]+face*10} cy={p.head[1]-3} r={3} fill="#fff5df"/><circle cx={p.head[0]+face*17} cy={p.head[1]-2} r={2.5} fill="#fff5df"/>
 </g>;
};
export const Courtyard=()=> <g>
 <defs><linearGradient id="wall" x2="0" y2="1"><stop stopColor="#e8dfce"/><stop offset="1" stopColor="#d3c8b4"/></linearGradient><linearGradient id="floor" x2="0" y2="1"><stop stopColor="#c5bba7"/><stop offset="1" stopColor="#e0d4bd"/></linearGradient></defs>
 <rect width="1280" height="720" fill="url(#wall)"/>
 <path d="M0 150L300 95L610 160L935 100L1280 165V330H0Z" fill="#b5b8ad" opacity=".28"/>
 <rect x="0" y="350" width="1280" height="190" fill="#d4c9b6"/><path d="M0 350H1280M0 530H1280" stroke="#a89f8e" strokeWidth="3"/>
 <rect y="540" width="1280" height="180" fill="url(#floor)"/>
 <path d="M0 540H1280" stroke="#7e827b" strokeWidth="2"/>
 <path d="M640 540L380 720M640 540L900 720M0 632H1280" stroke="#b8ae99" opacity=".45" strokeWidth="1"/>
 <path d="M0 175L185 140V540H0ZM1280 175L1095 140V540H1280Z" fill="#5f716c" opacity=".14"/>
</g>;
export const Fight=({fx=true}:{fx?:boolean})=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig();const pose=poses[frame];
 if(!pose)throw Error(`Missing frozen pose ${frame}`);
 const burst=fx&&frame>=26&&frame<=29;
 const hit=poses[26].B.handR;
 return <AbsoluteFill style={{background:'#e8dfce'}}>
 <svg viewBox="0 0 1280 720" width="100%" height="100%"><Courtyard/>
 <Fighter p={pose.A} who="A"/><Fighter p={pose.B} who="B"/>
 {burst&&<g stroke="#fff2bd" strokeWidth="3" strokeLinecap="round" opacity={1-(frame-26)/4}>{Array.from({length:7},(_,i)=>{const a=i*Math.PI*2/7,r=13+(frame-26)*5;return <line key={i} x1={hit[0]+Math.cos(a)*r} y1={hit[1]+Math.sin(a)*r} x2={hit[0]+Math.cos(a)*(r+13)} y2={hit[1]+Math.sin(a)*(r+13)}/>;})}</g>}
 </svg><Audio src={staticFile('audio/master-safe.wav')} premountFor={fps}/>
 </AbsoluteFill>;
};
export const Root=()=> <Composition id="AuthoredFight" component={Fight} width={1280} height={720} fps={30} durationInFrames={spec.durationInFrames} defaultProps={{fx:true}}/>;
