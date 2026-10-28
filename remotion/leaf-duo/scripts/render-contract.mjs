export function validateWebgl(records,frames){
 for(const frame of frames){const matches=records.filter(r=>r.frame===frame);if(!matches.some(r=>r.contextLost===false&&r.drawCalls>0&&r.triangles>0&&r.cameraType==='PerspectiveCamera'&&r.width===1920&&r.height===1080&&String(r.webglVersion).includes('WebGL')&&typeof r.unmaskedRenderer==='string'&&r.unmaskedRenderer.length>0))throw Error(`Missing real rendered WebGL geometry evidence for frame ${frame}`);}
}
