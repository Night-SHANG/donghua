import React from 'react';
import {registerRoot, Still} from 'remotion';
import {RunnerScene} from './scene';
const Root=()=>React.createElement(React.Fragment,null,
 React.createElement(Still,{id:'RunnerFront',component:RunnerScene,width:1600,height:900,defaultProps:{turn:false}}),
 React.createElement(Still,{id:'RunnerTurn',component:RunnerScene,width:1600,height:900,defaultProps:{turn:true}}));
registerRoot(Root);
