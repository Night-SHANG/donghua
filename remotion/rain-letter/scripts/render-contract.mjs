export function validatePlan(p){
 if(!['preview','final'].includes(p.phase))throw Error('Unknown phase');
 for(const [k,v] of Object.entries({fps:60,durationInFrames:1800,width:1920,height:1080,composition:'RainLetter',artifactByteCap:14000000}))if(p[k]!==v)throw Error(`Invalid ${k}`);
 if(p.phase==='final'&&!/^[a-f0-9]{40}$/.test(p.approvedPreviewCommit||''))throw Error('Final requires explicitly reviewed preview commit');
 if(p.keyframes.length!==11||new Set(p.keyframes).size!==11||p.keyframes.some(f=>!Number.isInteger(f)||f<0||f>=1800))throw Error('11 valid unique keyframes required');
 if(JSON.stringify(p.clips)!==JSON.stringify([{id:'umbrella',start:612,endExclusive:750},{id:'paper-window',start:1020,endExclusive:1170}]))throw Error('Transformation review windows changed');
 return p;
}
