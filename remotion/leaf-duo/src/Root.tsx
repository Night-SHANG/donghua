import React from 'react';
import {AbsoluteFill, Composition, staticFile, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {Leaf2D} from './two-d/Leaf2D';
import {Leaf3D} from './three-d/Leaf3D';
const Leaf2DFilm: React.FC = () => {const {fps}=useVideoConfig();return <AbsoluteFill><Leaf2D/><Audio src={staticFile('audio/two-d.wav')} premountFor={fps}/></AbsoluteFill>};
const Leaf3DFilm: React.FC = () => {const {fps}=useVideoConfig();return <AbsoluteFill><Leaf3D/><Audio src={staticFile('audio/three-d.wav')} premountFor={fps}/></AbsoluteFill>};
export const RemotionRoot: React.FC = () => <>
  <Composition id="Leaf2D" component={Leaf2DFilm} durationInFrames={900} fps={60} width={1920} height={1080}/>
  <Composition id="Leaf3D" component={Leaf3DFilm} durationInFrames={900} fps={60} width={1920} height={1080}/>
</>;
