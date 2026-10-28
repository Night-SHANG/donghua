import {clamp,mix,smooth} from './art';
export function leaf2DMotion(scene:number,t:number){
 if(scene===0){let p=smooth((t-1.3)/2);return {x:mix(900,1220,p)+Math.sin(p*Math.PI*2)*95,y:620+Math.sin(clamp((t-.8)/.5)*Math.PI)*24-470*Math.sin(p*Math.PI*.7),rotation:mix(-25,118,p)+Math.sin(t*5)*8,scale:1.05,fold:.87+.13*Math.cos(t*5),frost:0};}
 if(scene===1){let p=clamp(t/3.9),a=p*Math.PI*2;return {x:960+Math.sin(a)*340,y:600-Math.cos(a)*105-230*smooth((t-2.2)/1.4),rotation:30+Math.sin(a)*60+160*smooth((t-2.2)/1.4),scale:.72+.3*smooth((t-2.3)/1.4),fold:.75+.25*Math.cos(t*4),frost:0};}
 if(scene===2){const p=smooth((t-2.1)/1.6);return {x:960-180*Math.sin(p*Math.PI),y:mix(300,650,smooth(t/1.5))-420*p,rotation:mix(95,-80,smooth(t/1.5))-200*p,scale:.85,fold:.8+.2*Math.cos(t*3),frost:0};}
 const p=smooth(t/3.2),q=Math.sin(p*Math.PI);return{x:mix(1180,1050,p)-330*q,y:mix(360,620,p)+160*Math.sin(p*Math.PI*2),rotation:mix(110,-38,p)+170*q,scale:mix(.82,.75,p),fold:.87+.13*Math.cos(t*3)*(1-p),frost:smooth((t-.5)/2.1)};
}
