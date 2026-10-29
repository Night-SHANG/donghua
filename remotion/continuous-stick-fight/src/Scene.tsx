import React from 'react';
import {AbsoluteFill,staticFile,useCurrentFrame,useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {svgFrame} from './visual';
export const Scene=({fx=true}:{fx?:boolean})=>{const f=useCurrentFrame();const {fps}=useVideoConfig();return <AbsoluteFill style={{background:'#d1d2cf'}}><div dangerouslySetInnerHTML={{__html:svgFrame(f,fx)}}/><Audio src={staticFile('audio/continuous-fight.wav')} premountFor={fps}/></AbsoluteFill>};
