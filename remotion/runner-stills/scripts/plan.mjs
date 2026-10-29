export function validatePlan(plan){
 if(!Array.isArray(plan)||plan.length!==2)throw Error('Exactly two stills required');
 const outputs=new Set();
 for(const p of plan){if(typeof p.id!=='string'||!p.id||!Number.isInteger(p.frame)||p.frame<0||!/^[-\w]+\.png$/.test(p.output))throw Error('Invalid still target');if(outputs.has(p.output))throw Error('Duplicate output');outputs.add(p.output);}
 return plan;
}
