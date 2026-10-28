import React from 'react';
import {AbsoluteFill, Audio, Composition, staticFile} from 'remotion';
import {RainLetter} from './RainLetter';
const Film: React.FC = () => <AbsoluteFill><RainLetter/><Audio src={staticFile('audio/master.wav')}/></AbsoluteFill>;
export const Root: React.FC = () => <Composition id="RainLetter" component={Film} durationInFrames={1800} fps={60} width={1920} height={1080}/>;
