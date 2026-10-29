import React from 'react';
import {Figure,solve} from './stickman/stick';
import {actorAt,cameraAt,EVENTS,contactPoint,GROUND,SCALE,sm} from './timeline';
const INK='#293c3b', A='#346c73', B='#b34b3d';
export const World:React.FC<{frame:number,fx?:boolean}>=({frame:f,fx=true})=>{
 const a=actorAt('a',f),b=actorAt('b',f),cam=cameraAt(f);const bellSwing=f>=480?Math.sin((f-480)*.3)*18*Math.exp(-(f-480)/45):0;
 const hits=EVENTS.filter(e=>['block','body','clash','kick','post'].includes(e.kind)&&f>=e.f&&f<e.f+8);
 const shake=fx?hits.reduce((s,e)=>s+Math.sin((f-e.f)*3.2)*(8-(f-e.f)),0):0;
 return <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080" style={{display:'block',background:'#f2eadb'}}>
 <defs><pattern id="paper" width="31" height="29" patternUnits="userSpaceOnUse"><circle cx="3" cy="10" r=".8" fill="#665c4c" opacity=".09"/><path d="M18 2h3m-9 18h2" stroke="#897b64" opacity=".08"/></pattern></defs>
 <rect width="1920" height="1080" fill="#f2eadb"/>
 <path d="M0 610 Q350 450 750 560T1600 460L1920 490V1080H0" fill="#d8d8c9"/>
 <g transform={`translate(${960-cam.x*cam.z+shake} ${540-cam.y*cam.z}) scale(${cam.z})`}>
 <path d="M-600 560Q500 380 1400 535T3500 430V900H-600" fill="#c9cfc2"/>
 <g fill="#b7c0b2" opacity=".65">{Array.from({length:12},(_,i)=><g key={i} transform={`translate(${i*300-400} 560)`}><rect x="-7" y="0" width="14" height="225"/><path d="M-130 80L0-130 130 80Z"/></g>)}</g>
 <path d="M-500 740H3100V820H-500" fill="#dfcbb0" stroke="#928c77" strokeWidth="5"/>
 {Array.from({length:18},(_,i)=><g key={i}><path d={`M${i*210-500} 740v80m0-40h210`} fill="none" stroke="#ad9f87" strokeWidth="3" opacity=".6"/></g>)}
 <path d="M-500 820H3100V1250H-500" fill="#c0aa84"/>
 <path d="M-500 880H3100" stroke={INK} strokeWidth="6"/>
 {Array.from({length:24},(_,i)=><path key={i} d={`M${i*145-400} ${935+(i%3)*38}h${40+i%4*12}`} stroke="#9e9178" strokeWidth="3" opacity=".55"/>)}
 {/* Stable courtyard identity: low bench, padded sparring post, hanging brass bell. */}
 <g stroke={INK} strokeWidth="7" strokeLinejoin="round"><path d="M1380 765v55m205-55v55" strokeWidth="18"/><path d="M1345 732L1625 730 1640 765 1335 765Z" fill="#8d9a8e"/><path d="M1350 739h270" stroke="#d4d6bf" strokeWidth="4"/>
 <path d="M2320 880V370H2115" fill="none" stroke="#6d5b49" strokeWidth="22"/><path d="M2320 595v220" stroke="#bd7960" strokeWidth="62"/><path d="M2290 630h60m-60 50h60m-60 50h60m-60 50h60" stroke="#7e4b3d" strokeWidth="4"/>
 <g transform={`rotate(${bellSwing} 2140 370)`}><path d="M2140 370v50" strokeWidth="5"/><path d="M2090 500Q2100 470 2102 445Q2140 400 2178 445Q2180 470 2190 500Z" fill="#c8983e"/><path d="M2080 500h120" strokeWidth="12"/><circle cx="2140" cy="512" r="10" fill="#8b6330"/></g></g>
 {f<40&&<g stroke="#ad8b43" strokeWidth="4" fill="none" opacity={.5+.3*Math.sin(f*.2)}><path d="M2070 450q-25 20 0 40m140-40q25 20 0 40"/></g>}
 <ellipse cx={a.pose.x} cy={GROUND+5} rx="95" ry="12" fill={INK} opacity=".13"/><ellipse cx={b.pose.x} cy={GROUND+5} rx="95" ry="12" fill={INK} opacity=".13"/>
 <Figure pose={b.pose} scale={SCALE} facing={b.facing} color={B} face={f>510?'sad':'angry'}/>
 <Figure pose={a.pose} scale={SCALE} facing={a.facing} color={A} face={f>520?'happy':'angry'}/>
 {fx&&EVENTS.map((event,i)=>{const pt=contactPoint(event),e={...event,x:pt[0],y:pt[1]};const d=f-e.f;if(d<0||d>10)return null;const big=['body','post'].includes(e.kind);if(['whoosh','sweep'].includes(e.kind))return <path key={i} d={`M${e.x-100} ${e.y+30}Q${e.x+20} ${e.y-80} ${e.x+130} ${e.y}`} fill="none" stroke="#f5efe3" strokeWidth={12-d} opacity={(1-d/10)*.6}/>;return <g key={i} opacity={1-d/11}>{Array.from({length:big?9:6},(_,j)=>{const n=big?9:6,ang=j/n*Math.PI*2;return <line key={j} x1={e.x+Math.cos(ang)*(15+d*2)} y1={e.y+Math.sin(ang)*(15+d*2)} x2={e.x+Math.cos(ang)*(45+d*4)} y2={e.y+Math.sin(ang)*(45+d*4)} stroke={big?'#f7e5ad':'#fff7e3'} strokeWidth={big?9:6}/>})}</g>})}
 {fx&&f>=480&&f<555&&<g stroke="#a97c2c" strokeWidth="5" fill="none" opacity={(555-f)/75}><path d={`M${2070-(f-480)*.4} 425q-35 40 0 80m${150+(f-480)*.8} -80q35 40 0 80`}/></g>}
 </g><rect width="1920" height="1080" fill="url(#paper)" pointerEvents="none"/>
 <rect x="12" y="12" width="1896" height="1056" rx="5" fill="none" stroke="#88785d" opacity=".12" strokeWidth="2"/>
 </svg>;
};
