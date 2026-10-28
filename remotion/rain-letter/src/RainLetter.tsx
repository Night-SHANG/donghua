import React from 'react';
import {AbsoluteFill,useCurrentFrame,useVideoConfig} from 'remotion';
import {Definitions,RoomArt} from './RoomArt';
import {PaperMagic} from './PaperMagic';
import {camera,progress} from './motion';
export const RainLetter:React.FC=()=>{
 const frame=useCurrentFrame(),{fps}=useVideoConfig(),t=frame/fps,c=camera(t);
 return <AbsoluteFill style={{background:'#b1aca0'}}><svg viewBox="0 0 1920 1080" width="100%" height="100%">
 <Definitions/>
 <g filter="url(#grain)"><g transform={`translate(960 540) scale(${c.scale}) translate(${-c.x} ${-c.y})`}><RoomArt t={t}/><PaperMagic t={t}/></g></g>
 <path d="M0 0H1920V1080H0Z" fill="#f3d79b" opacity={progress(t,20,25)*.035}/>
 <g fill="#f2e3bf" opacity={.3*progress(t,19,23)}>{Array.from({length:22},(_,i)=><circle key={i} cx={(i*193.7+t*(5+i%3))%1920} cy={100+(i*83.9-t*8)%870} r={1+(i%3)*.5}/>)}</g>
 </svg></AbsoluteFill>;
};
