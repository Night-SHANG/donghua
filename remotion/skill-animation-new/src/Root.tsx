import React from 'react';
import {Composition} from 'remotion';
import {HatBorrowed} from './Film';
import spec from '../film-spec.json';
export const Root:React.FC=()=> <Composition id={spec.id} component={HatBorrowed} width={spec.width} height={spec.height} fps={spec.fps} durationInFrames={spec.durationInFrames} defaultProps={{fx:true,audio:true}}/>;
