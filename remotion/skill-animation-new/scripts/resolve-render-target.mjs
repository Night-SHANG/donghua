/** Resolve composition props for EACH variant; renderMedia uses resolved props. */
export async function resolveRenderTarget(selectComposition,base,id,fx){
 const inputProps={fx};
 const composition=await selectComposition({...base,id,inputProps});
 if(composition.props?.fx!==fx)throw Error('Resolved composition fx mismatch');
 return {...base,composition,inputProps};
}
