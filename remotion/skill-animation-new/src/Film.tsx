import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {World} from './World';
export type FilmProps={fx?:boolean,audio?:boolean};
export const Scene:React.FC<FilmProps>=({fx=true})=>{const frame=useCurrentFrame();return <World frame={frame} fx={fx}/>};
export const HatBorrowed:React.FC<FilmProps>=({fx=true,audio=true})=><AbsoluteFill style={{backgroundColor:'#f4eedf'}}><Scene fx={fx}/>{audio&&<Audio src={staticFile('audio/master.wav')} volume={1} premountFor={30}/>}</AbsoluteFill>;
