import React from 'react';
import {Composition,registerRoot,useCurrentFrame,useVideoConfig,staticFile} from 'remotion';
import {Audio} from '@remotion/media';
import {JourneyFrame} from './scene';
export function Film({withAudio=true}:{withAudio?:boolean}){const frame=useCurrentFrame(),{fps}=useVideoConfig();return React.createElement(React.Fragment,null,React.createElement(JourneyFrame,{frame}),withAudio?React.createElement(Audio,{src:staticFile('audio/master-safe.wav'),premountFor:fps}):null);}
const Root=()=>React.createElement(Composition,{id:'LineWorldJourney',component:Film,width:1600,height:900,fps:30,durationInFrames:720,defaultProps:{withAudio:true}});
registerRoot(Root);
