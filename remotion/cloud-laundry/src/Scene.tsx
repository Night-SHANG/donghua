import React from 'react';
import {AbsoluteFill,Img,staticFile,useCurrentFrame,useVideoConfig,interpolateColors} from 'remotion';
import {Audio} from '@remotion/media';
import {stateAt,cloudPath,cameraAt,smooth,clamp,mix} from './motion';

const Leaf=({x,y,a,size=1}:{x:number;y:number;a:number;size?:number})=><g transform={`translate(${x} ${y}) rotate(${a}) scale(${size})`}><path d="M0 0 C-35 -3 -66 -35 -62 -60 C-25 -60 3 -34 0 0Z" fill="url(#leaf)" stroke="#72866b" strokeWidth=".7"/><path d="M0 0 Q-28 -27 -55 -53" fill="none" stroke="#b7bf89" strokeWidth="1.8" opacity=".75"/><path d="M-15 -18 l-23 -2 M-30 -34 l-20 -2" stroke="#c7cc9b" fill="none" opacity=".4"/></g>;
function Plant({grow,t}:{grow:number;t:number}){const h=126*grow, sway=Math.sin(t*1.6)*3*grow;return <g transform="translate(1430 682)" filter="url(#paint)">
 <ellipse cy="49" rx="62" ry="12" fill="#3d3a29" opacity=".23" filter="url(#shadow)"/>
 <path d="M-49 -2 L-38 47 Q0 60 38 47 L49 -2Z" fill="url(#pot)" stroke="#806c53" strokeWidth="2"/>
 <path d="M-30 4 L-24 43 M-13 7 L-10 48 M8 7 L7 49 M28 4 L23 44" stroke="#ddc8a4" strokeWidth="3" opacity=".35"/>
 <ellipse cy="-3" rx="51" ry="14" fill="#b4a385" stroke="#776c56" strokeWidth="2"/><ellipse cy="-5" rx="42" ry="8" fill="#4b4433"/>
 {Array.from({length:18},(_,i)=><circle key={i} cx={Math.sin(i*2.8)*35} cy={-6+Math.cos(i*4)*4} r={1+i%2} fill="#9b8a68"/>)}
 <path d={`M0 -7 C ${-5+sway} ${-h*.4-10} ${14+sway} ${-h*.7-10} ${sway} ${-h-7}`} stroke="#657c59" strokeWidth="5" strokeLinecap="round" fill="none"/>
 <Leaf x={sway*.5} y={-h*.45-7} a={-15-30*grow} size={smooth((grow-.08)/.6)*.8}/><Leaf x={sway*.8+5} y={-h*.68-7} a={95+20*grow} size={smooth((grow-.25)/.65)*.75}/>
 <g transform={`translate(${sway} ${-h-7}) scale(${smooth((grow-.6)/.4)})`}>
 {[0,60,120,180,240,300].map(a=><ellipse key={a} cx="0" cy="-12" rx="8" ry="15" fill="#eee7d0" stroke="#c7bba0" strokeWidth="1" transform={`rotate(${a})`}/>)}<circle r="7" fill="#cbaa52"/><circle cx="-2" cy="-2" r="2" fill="#f4df99"/>
 </g></g>}
function Hoop({front=false}:{front?:boolean}){return <g filter="url(#paint)">
 {!front&&<><ellipse cx="1000" cy="693" rx="63" ry="13" fill="#322d24" opacity=".24" filter="url(#shadow)"/><path d="M1000 505 L1000 678" stroke="#66512e" strokeWidth="13"/><path d="M997 505 L997 677" stroke="#c6a15d" strokeWidth="4"/><ellipse cx="1000" cy="679" rx="44" ry="9" fill="url(#brass)" stroke="#6e5431" strokeWidth="3"/></>}
 <path d={front?'M1000 359 A43 79 0 0 1 1000 517':'M1000 517 A43 79 0 0 1 1000 359'} fill="none" stroke="#6f522d" strokeWidth="15"/><path d={front?'M1000 359 A43 79 0 0 1 1000 517':'M1000 517 A43 79 0 0 1 1000 359'} fill="none" stroke="url(#brass)" strokeWidth="10"/><path d={front?'M1000 362 A39 75 0 0 1 1000 514':'M1000 514 A39 75 0 0 1 1000 362'} fill="none" stroke="#f2d69a" strokeWidth="2" opacity=".6"/>
 </g>}
function Drops({t}:{t:number}){return <g>{[8.7,9.1,9.5,12.0].map((start,i)=>{const u=clamp((t-start)/.6);if(t<start||t>start+.95)return null;const x=stateAt(start).x;const y=mix(stateAt(start).y+stateAt(start).ry*.75,i===3?675:662,u*u);return <g key={i}>{u<1?<g transform={`translate(${x} ${y})`}><path d="M0 -14 C-4 -6 -8 1 -6 6 C-3 14 6 11 7 5 C7 -1 2 -10 0 -14Z" fill="#a5b7bd" stroke="#e6eeeb" strokeWidth="2"/><ellipse cx="-2" cy="2" rx="1.5" ry="4" fill="#fff" opacity=".8"/></g>:<ellipse cx={stateAt(start).x} cy={i===3?675:662} rx={8+(t-start-.6)*80} ry={2+(t-start-.6)*15} stroke="#cbd5c7" strokeWidth="2" fill="none" opacity={1-clamp((t-start-.6)/.35)}/>}</g>})}</g>}
function Pins({t}:{t:number}){const p=smooth((t-21.3)/.7);if(p===0)return null;return <g opacity={p}>{[[1330,168],[1590,158]].map(([x,y],i)=><g key={i} transform={`translate(${x} ${y-24*(1-p)}) rotate(${(1-p)*(i?20:-20)})`}><path d="M-6 -17 L5 -17 L8 23 L-6 23Z" fill="#b89461" stroke="#755d3d" strokeWidth="2"/><path d="M-2 -14 L-1 18" stroke="#ead5a7" strokeWidth="2"/><circle cy="3" r="3" fill="#6c654f"/></g>)}</g>}
export function World({t,backgroundHref=staticFile('attic-background.jpg')}:{t:number;backgroundHref?:string}) {const s=stateAt(t),camera=cameraAt(t),path=cloudPath(s),reveal=smooth(t/1.1);
 return ( <div style={{position:'absolute',width:1920,height:1080,transformOrigin:'0 0',transform:`translate(${960-camera.x*camera.scale}px, ${540-camera.y*camera.scale}px) scale(${camera.scale})`}}>
 <Img src={backgroundHref} style={{position:'absolute',width:1920,height:1080,filter:`saturate(${.82+.12*s.warm}) brightness(${.86+.14*s.warm})`}}/>
 <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{position:'absolute',inset:0}}>
 <defs>
 <linearGradient id="brass"><stop stopColor="#8d6735"/><stop offset=".3" stopColor="#edc87c"/><stop offset=".55" stopColor="#a47c3f"/><stop offset=".8" stopColor="#e6bd6d"/><stop offset="1" stopColor="#76552e"/></linearGradient>
 <linearGradient id="pot"><stop stopColor="#978b71"/><stop offset=".35" stopColor="#d2c3a5"/><stop offset=".7" stopColor="#b9aa8d"/><stop offset="1" stopColor="#8d8067"/></linearGradient>
 <linearGradient id="leaf" x2=".9" y2="1"><stop stopColor="#9cae78"/><stop offset=".5" stopColor="#6c8867"/><stop offset="1" stopColor="#536c58"/></linearGradient>
 <radialGradient id="cloud" cx="35%" cy="24%" r="83%"><stop stopColor={interpolateColors(s.wet,[0,1],['#fff8e7','#e9e7df'])}/><stop offset=".5" stopColor={interpolateColors(s.wet,[0,1],['#ede8d6','#bbc6c9'])}/><stop offset="1" stopColor={interpolateColors(s.wet,[0,1],['#b4c1b6','#778c99'])}/></radialGradient>
 <linearGradient id="sun"><stop stopColor="#ffe9a3" stopOpacity=".35"/><stop offset="1" stopColor="#ffe9a3" stopOpacity="0"/></linearGradient>
 <filter id="shadow"><feGaussianBlur stdDeviation="7"/></filter>
 <filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
 <filter id="paint" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".18" numOctaves="3" seed="8" result="grain"/><feColorMatrix in="grain" type="saturate" values="0" result="gray"/><feComponentTransfer in="gray" result="faint"><feFuncA type="linear" slope=".2"/></feComponentTransfer><feComposite in="faint" in2="SourceGraphic" operator="in" result="texture"/><feBlend in="SourceGraphic" in2="texture" mode="multiply" result="painted"/><feDisplacementMap in="painted" in2="grain" scale="1.8" xChannelSelector="R" yChannelSelector="G"/></filter>
 <clipPath id="cloudClip"><path d={path}/></clipPath>
 <clipPath id="windowClip"><rect x="180" y="45" width="505" height="490"/></clipPath>
 </defs>
 <g clipPath="url(#windowClip)" opacity={.24*(1-s.warm*.7)}>{Array.from({length:65},(_,i)=>{const x=180+(i*67%510),y=45+((i*103+t*160)%490);return <path key={i} d={`M${x} ${y} l-6 23`} stroke="#e9eff3" strokeWidth="1.2"/>})}</g>
 <path d="M180 380 L730 530 L1750 1080 L700 1080Z" fill="url(#sun)" opacity={s.warm}/>
 <g filter="url(#paint)"><ellipse cx="1040" cy="690" rx="125" ry="17" fill="#514734" opacity=".2" filter="url(#shadow)"/><path d="M910 663 Q925 704 1040 706 Q1155 704 1170 663Z" fill="#d2c5aa" stroke="#887a61" strokeWidth="3"/><ellipse cx="1040" cy="663" rx="130" ry="18" fill="#a8b7b1" stroke="#e3d5b9" strokeWidth="6"/></g><Hoop/><Plant grow={s.grow} t={t}/>
 <g transform={`translate(${s.x+16} ${s.y+19}) rotate(${s.rotation})`} opacity={.2*reveal}><path d={path} fill="#4c4b3b" filter="url(#shadow)"/></g>
 <g transform={`translate(${s.x} ${s.y}) rotate(${s.rotation})`} opacity={reveal} filter="url(#paint)">
 <path d={path} fill="url(#cloud)" stroke="#c7cfc7" strokeWidth="1.5"/>
 <g clipPath="url(#cloudClip)"><path d={path} fill="none" stroke="#fff5d6" strokeWidth="12" opacity=".24" transform="translate(-6 -5)"/>
 {Array.from({length:13},(_,i)=><ellipse key={i} cx={Math.sin(i*1.7)*s.rx*.75} cy={Math.cos(i*2.4)*s.ry*.65} rx={40+i%4*12} ry={25+i%3*12} fill={i%2?'#fffbea':'#8096a1'} opacity={(i%2?.12:.08)*(1-s.linen*.7)} filter="url(#soft)"/>)}
 {Array.from({length:9},(_,i)=><path key={i} d={`M${-190+i*46} -160 Q${-210+i*46+Math.sin(t+i)*8} 0 ${-185+i*46+Math.sin(t+i)*10} 170`} fill="none" stroke={i%2?'#ffffff':'#7e968b'} strokeWidth={i%2?24:12} opacity={s.linen*(i%2?.30:.24)}/>)}
 <image href={staticFile('linen-texture.jpg')} x={-s.rx} y={-s.ry} width={s.rx*2} height={s.ry*2} preserveAspectRatio="none" opacity={s.linen*.27} style={{mixBlendMode:'multiply'}}/><path d={`M-220 115 Q0 ${130+Math.sin(t)*7} 220 115`} stroke="#97a89a" strokeWidth="2" fill="none" opacity={s.linen*.5}/>
 {Array.from({length:120},(_,i)=><path key={i} d={`M${Math.sin(i*34.1)*s.rx} ${Math.cos(i*11.7)*s.ry} l${4+i%7} ${i%3-1}`} stroke={i%2?'#fff9e8':'#708b8c'} opacity=".08" strokeWidth="1"/>)}
 </g></g>
 <Hoop front/><Drops t={t}/><Pins t={t}/>
 <g opacity={s.warm*.33}>{Array.from({length:20},(_,i)=><circle key={i} cx={450+(i*83%1220)+Math.sin(t*.5+i)*15} cy={220+(i*53%440)-t*2} r={1.5+i%3*.4} fill="#ffedbf"/>)}</g>
 </svg></div>);
}
export function Scene(){const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps;return <AbsoluteFill style={{background:'#c9bfaa',overflow:'hidden'}}><Audio src={staticFile('audio/master.wav')} premountFor={fps}/><World t={t}/><AbsoluteFill style={{background:'radial-gradient(ellipse at 48% 45%, transparent 40%, rgba(53,44,31,.2) 100%)',pointerEvents:'none'}}/></AbsoluteFill>;}
