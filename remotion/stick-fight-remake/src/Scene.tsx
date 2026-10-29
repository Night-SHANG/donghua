import React from 'react';import {AbsoluteFill,Audio,staticFile,useCurrentFrame} from 'remotion';import {svgFrame} from './visual';
export const Scene=({fx=true}:{fx?:boolean})=>{const f=useCurrentFrame();return <AbsoluteFill style={{background:'#d1d2cf'}}><div dangerouslySetInnerHTML={{__html:svgFrame(f,fx)}}/><Audio src={staticFile('audio/exit-fight.wav')}/></AbsoluteFill>};
