import React from 'react';
import {AbsoluteFill,Sequence,useVideoConfig} from 'remotion';
import {SpringScene} from './SpringScene';
import {SummerScene} from './SummerScene';
import {AutumnScene} from './AutumnScene';
import {WinterScene} from './WinterScene';
export const Leaf3D=()=>{const {fps}=useVideoConfig();return <AbsoluteFill><Sequence name="春 · 温室圆窗" from={0} durationInFrames={3.4*fps} premountFor={fps}><SpringScene/></Sequence><Sequence name="夏 · 月门荷塘" from={3.4*fps} durationInFrames={3.6*fps} premountFor={fps}><SummerScene/></Sequence><Sequence name="秋 · 石庭回旋" from={7*fps} durationInFrames={4*fps} premountFor={fps}><AutumnScene/></Sequence><Sequence name="冬 · 灯下归宿" from={11*fps} durationInFrames={4*fps} premountFor={fps}><WinterScene/></Sequence></AbsoluteFill>};
