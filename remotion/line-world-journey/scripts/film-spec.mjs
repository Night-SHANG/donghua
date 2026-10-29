import fs from 'node:fs';
export function validateFilmSpec(s){
 for(const key of ['width','height','fps','durationInFrames'])if(!Number.isInteger(s[key])||s[key]<=0)throw Error(`Invalid ${key}`);
 if(!s.id||!/^[-\w]+\.mp4$/.test(s.outputName))throw Error('Invalid identity/outputName');
 return {...s,duration:s.durationInFrames/s.fps};
}
export const readFilmSpec=()=>validateFilmSpec(JSON.parse(fs.readFileSync('film-spec.json','utf8')));
