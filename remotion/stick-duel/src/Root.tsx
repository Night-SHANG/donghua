import React from 'react';import {Composition} from 'remotion';import {Scene} from './Scene';
export const Root=()=> <><Composition id="StickDuel" component={Scene} durationInFrames={720} fps={60} width={1920} height={1080}/><Composition id="StickDuelClean" component={Scene} defaultProps={{fx:false}} durationInFrames={720} fps={60} width={1920} height={1080}/></>;
