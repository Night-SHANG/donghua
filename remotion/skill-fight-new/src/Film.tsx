import React from 'react';import {AbsoluteFill,useCurrentFrame,staticFile} from 'remotion';import {Audio} from '@remotion/media';import {World} from './World';
export const BellDuel:React.FC<{fx?:boolean,audio?:boolean}>=({fx=true,audio=true})=><AbsoluteFill><World frame={useCurrentFrame()} fx={fx}/>{audio&&<Audio src={staticFile('audio/master.wav')} volume={1} premountFor={30}/>}</AbsoluteFill>;
