import React from 'react';
import {AbsoluteFill,Sequence,useCurrentFrame,useVideoConfig} from 'remotion';
import {Spring} from './Spring';
import {Summer} from './Summer';
import {Autumn} from './Autumn';
import {Winter} from './Winter';
import {smooth} from './art';
// Scene components remain independently registerable in Studio. Reveal masks are
// semantic transitions (ripple, turning leaf, white page), not camera translation.
const Reveal:React.FC<{kind:'ripple'|'leaf'|'page';children:React.ReactNode}>=({kind,children})=>{const t=useCurrentFrame()/useVideoConfig().fps;const p=smooth(t/.6);return <AbsoluteFill style={{clipPath:kind==='ripple'?`circle(${p*125}% at 60% 40%)`:kind==='leaf'?`polygon(0 0, ${p*180}% 0, ${p*180-80}% 100%, 0 100%)`:`inset(0 ${100-p*100}% 0 0)`,background:kind==='page'?'#fff8e9':undefined}}>{children}</AbsoluteFill>};
export const Leaf2D:React.FC=()=>{const{fps}=useVideoConfig();return <AbsoluteFill style={{background:'#ecebdc'}}>
<Sequence name="Spring — the rain releases a leaf" from={0} durationInFrames={3.9*fps} premountFor={fps}><Spring/></Sequence>
<Sequence name="Summer — orbit of a water garden" from={3.3*fps} durationInFrames={4.2*fps} premountFor={fps}><Reveal kind="ripple"><Summer/></Reveal></Sequence>
<Sequence name="Autumn — a book lends its wings" from={6.9*fps} durationInFrames={4.6*fps} premountFor={fps}><Reveal kind="leaf"><Autumn/></Reveal></Sequence>
<Sequence name="Winter — a promise of blossom" from={10.9*fps} durationInFrames={4.1*fps} premountFor={fps}><Reveal kind="page"><Winter/></Reveal></Sequence>
</AbsoluteFill>};
export {Spring,Summer,Autumn,Winter};
export {leaf2DMotion} from './motion';
