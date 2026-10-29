import React from 'react';import {Composition} from 'remotion';import {Scene} from './Scene';import data from './poses.json';import spec from '../film-spec.json';
if(data.frames.length!==spec.durationInFrames||data.fps!==spec.fps)throw new Error('Film specification does not match generated motion');
export const Root=()=> <Composition id="ContinuousFight" component={Scene} durationInFrames={spec.durationInFrames} fps={spec.fps} width={spec.width} height={spec.height}/>;
