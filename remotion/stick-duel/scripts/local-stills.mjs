import esbuild from 'esbuild';import fs from 'node:fs';import React from 'react';import {renderToStaticMarkup} from 'react-dom/server';import {Resvg} from '@resvg/resvg-js';
fs.mkdirSync('out/local-review',{recursive:true});fs.mkdirSync('out/clean-sequence',{recursive:true});
await esbuild.build({entryPoints:['src/Scene.tsx'],outfile:'out/review-scene.mjs',bundle:true,platform:'node',format:'esm',packages:'external'});
const {World}=await import('../out/review-scene.mjs');
const frames=process.argv.includes('--dense')?Array.from({length:360},(_,i)=>i*2):[0,40,60,84,110,126,150,174,205,240,280,294,321,350,390,429,455,480,495,520,550,600,719];
for(const f of frames){for(const fx of process.argv.includes('--dense')?[false]:[false,true]){const svg=renderToStaticMarkup(React.createElement(World,{frame:f,fx})).replace('width="1920" height="1080"',process.argv.includes('--dense')?'width="640" height="360"':'width="960" height="540"');fs.writeFileSync(process.argv.includes('--dense')?`out/clean-sequence/${String(f/2).padStart(3,'0')}.png`:`out/local-review/${fx?'fx':'clean'}-${String(f).padStart(3,'0')}.png`,new Resvg(svg).render().asPng());}console.log(f);}
