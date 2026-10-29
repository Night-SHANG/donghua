export type P={x:number;y:number};
export type Joint='hip'|'shoulder'|'neck'|'head'|'elbowA'|'elbowB'|'wristA'|'wristB'|'kneeA'|'kneeB'|'footA'|'footB';
export const dist=(a:P,b:P)=>Math.hypot(a.x-b.x,a.y-b.y);
export const clamp=(v:number)=>Math.max(0,Math.min(1,v));
export const smooth=(v:number)=>{v=clamp(v);return v*v*(3-2*v)};
export const mix=(a:number,b:number,t:number)=>a+(b-a)*t;
export const bones:[Joint,Joint,number][]=[['hip','shoulder',105],['shoulder','neck',20],['neck','head',22],['shoulder','elbowA',65],['elbowA','wristA',65],['shoulder','elbowB',65],['elbowB','wristB',65],['hip','kneeA',87],['kneeA','footA',87],['hip','kneeB',87],['kneeB','footB',87]];
export type Event={name:string;frame:number;hold:number;kind:'hit'|'block';attacker:number;limb:Joint;target:Joint;power:number};
export const events:Event[]=[{name:'jab-block',frame:84,hold:3,kind:'block',attacker:0,limb:'wristA',target:'wristA',power:.5},{name:'air-counter',frame:174,hold:4,kind:'hit',attacker:1,limb:'footA',target:'shoulder',power:.8},{name:'descending-block',frame:294,hold:3,kind:'block',attacker:0,limb:'footA',target:'wristA',power:.65},{name:'body-shot',frame:350,hold:3,kind:'hit',attacker:1,limb:'wristA',target:'shoulder',power:.65},{name:'uppercut',frame:455,hold:5,kind:'hit',attacker:0,limb:'wristA',target:'head',power:1}];
export function frameTime(f:number){for(const e of events)if(f>=e.frame&&f<e.frame+e.hold)return e.frame;return f;}
type Pose={hands:[P,P];feet:[P,P]};
const pt=(x:number,y:number):P=>({x,y});
const poses:Record<string,Pose>={
 guard:{hands:[pt(66,-128),pt(-26,-102)],feet:[pt(65,153),pt(-63,153)]},
 crouch:{hands:[pt(80,-70),pt(-40,-67)],feet:[pt(86,120),pt(-76,120)]},
 dash:{hands:[pt(-80,-63),pt(-120,-15)],feet:[pt(90,100),pt(-100,115)]},
 run:{hands:[pt(92,-105),pt(-100,-45)],feet:[pt(96,110),pt(-75,110)]},
 jab:{hands:[pt(155,-98),pt(18,-80)],feet:[pt(80,153),pt(-60,153)]},
 block:{hands:[pt(100,-115),pt(65,-148)],feet:[pt(70,153),pt(-60,153)]},
 cross:{hands:[pt(155,-118),pt(20,-85)],feet:[pt(50,153),pt(-70,153)]},
 duck:{hands:[pt(65,95),pt(-25,-38)],feet:[pt(85,95),pt(-75,95)]},
 sweep:{hands:[pt(80,95),pt(55,-45)],feet:[pt(164,27),pt(-50,95)]},
 jump:{hands:[pt(70,-130),pt(-53,-138)],feet:[pt(95,45),pt(-55,70)]},
 kick:{hands:[pt(-20,-125),pt(-90,-50)],feet:[pt(145,35),pt(-55,90)]},
 hurt:{hands:[pt(70,-80),pt(-80,-105)],feet:[pt(70,115),pt(-80,150)]},
 plant:{hands:[pt(-82,65),pt(45,-90)],feet:[pt(90,65),pt(-70,65)]},
 dropkick:{hands:[pt(-50,-120),pt(-95,-60)],feet:[pt(125,95),pt(-55,75)]},
 body:{hands:[pt(140,-95),pt(45,-145)],feet:[pt(65,153),pt(-65,153)]},
 charge:{hands:[pt(45,-40),pt(-45,-66)],feet:[pt(85,122),pt(-70,122)]},
 uppercut:{hands:[pt(110,-155),pt(-30,-65)],feet:[pt(70,153),pt(-60,153)]},
 tumble:{hands:[pt(45,-100),pt(-30,-80)],feet:[pt(70,35),pt(-50,60)]},
 land:{hands:[pt(80,108),pt(-45,-40)],feet:[pt(85,115),pt(-65,115)]},
};
type Key={f:number;x:number;y:number;tilt:number;spin:number;pose:string;dir:number};
const k=(f:number,x:number,y:number,pose:string,tilt=0,spin=0,dir=1):Key=>({f,x,y,pose,tilt,spin,dir});
const black:Key[]=[k(0,610,697,'guard',3),k(25,610,697,'guard',3),k(40,605,730,'charge',24),k(48,650,730,'dash',48),k(54,715,660,'run',34),k(60,780,700,'run',34),k(72,865,697,'guard',12),k(79,875,705,'charge',22),k(84,895,697,'jab',19),k(87,895,697,'jab',19),k(98,895,697,'guard',9),k(116,905,725,'crouch',16),k(126,915,755,'duck',75),k(140,925,755,'duck',80),k(150,930,755,'sweep',75),k(160,925,715,'guard',12),k(174,925,697,'hurt',-10),k(178,925,697,'hurt',-10),k(191,850,713,'hurt',-40),k(205,780,785,'plant',-65),k(218,785,735,'land',-20),k(240,820,697,'guard',8),k(255,830,730,'charge',30),k(266,885,660,'jump',24),k(280,985,545,'jump',35),k(294,1025,555,'dropkick',-12),k(297,1025,555,'dropkick',-12),k(310,995,660,'jump',-12),k(321,975,730,'land',12),k(333,975,697,'guard',8),k(350,975,697,'hurt',-9),k(353,975,697,'hurt',-9),k(368,920,710,'hurt',-25),k(390,880,730,'land',-12),k(410,930,720,'crouch',25),k(429,960,730,'charge',35),k(446,975,730,'charge',42),k(455,1000,697,'uppercut',18),k(460,1000,697,'uppercut',18),k(477,1030,685,'uppercut',22),k(498,1060,697,'guard',5),k(530,1080,697,'guard',5),k(600,1080,697,'guard',3),k(719,1080,697,'guard',3)];
const red:Key[]=[k(0,1170,697,'guard',4,0,-1),k(60,1170,697,'guard',6,0,-1),k(74,1170,697,'guard',8,0,-1),k(84,1150,697,'block',20,0,-1),k(87,1150,697,'block',20,0,-1),k(106,1155,697,'charge',22,0,-1),k(120,1135,697,'cross',28,0,-1),k(126,1130,697,'cross',32,0,-1),k(138,1135,725,'crouch',8,0,-1),k(149,1130,650,'jump',10,0,-1),k(163,1095,565,'jump',-4,0,-1),k(174,1080,570,'kick',-15,0,-1),k(178,1080,570,'kick',-15,0,-1),k(193,1100,630,'jump',-8,0,-1),k(211,1135,730,'land',18,0,-1),k(236,1160,697,'guard',4,0,-1),k(275,1175,697,'block',13,0,-1),k(294,1170,697,'block',18,0,-1),k(297,1170,697,'block',18,0,-1),k(316,1185,713,'crouch',12,0,-1),k(333,1160,705,'charge',25,0,-1),k(344,1125,697,'body',22,0,-1),k(350,1110,697,'body',20,0,-1),k(353,1110,697,'body',20,0,-1),k(372,1135,697,'guard',5,0,-1),k(410,1150,697,'guard',7,0,-1),k(446,1140,697,'cross',20,0,-1),k(455,1140,697,'hurt',20,0,-1),k(460,1140,697,'hurt',20,0,-1),k(477,1200,570,'hurt',-30,-20,-1),k(495,1270,490,'tumble',-30,-100,-1),k(520,1340,570,'tumble',-15,-235,-1),k(541,1390,690,'tumble',0,-335,-1),k(550,1410,735,'land',25,-360,-1),k(570,1460,735,'land',25,-360,-1),k(600,1470,735,'land',12,-360,-1),k(642,1450,697,'guard',4,-360,-1),k(719,1450,697,'guard',4,-360,-1)];
function sample(f:number,id:number){const keys=id===0?black:red;let a=keys[0],b=a;for(let i=1;i<keys.length;i++){b=keys[i];if(f<=b.f)break;a=b;}const u=smooth((f-a.f)/(b.f-a.f||1));const pa=poses[a.pose],pb=poses[b.pose];return {x:mix(a.x,b.x,u),y:mix(a.y,b.y,u),tilt:mix(a.tilt,b.tilt,u),spin:mix(a.spin,b.spin,u),dir:a.dir,hands:pa.hands.map((p,i)=>pt(mix(p.x,pb.hands[i].x,u),mix(p.y,pb.hands[i].y,u))),feet:pa.feet.map((p,i)=>pt(mix(p.x,pb.feet[i].x,u),mix(p.y,pb.feet[i].y,u)))};}
function ik(a:P,target:P,len:number,bend:number):[P,P]{const d0=dist(a,target),d=Math.min(len*2-.0001,Math.max(.001,d0)),dx=(target.x-a.x)/(d0||1),dy=(target.y-a.y)/(d0||1);const end=pt(a.x+dx*d,a.y+dy*d),mid=pt(a.x+dx*d/2,a.y+dy*d/2),h=Math.sqrt(Math.max(0,len*len-d*d/4));return [pt(mid.x-dy*h*bend,mid.y+dx*h*bend),end];}
function base(f:number,id:number){const s=sample(frameTime(f),id),r=s.tilt*Math.PI/180,hip=pt(s.x,s.y),shoulder=pt(s.x+Math.sin(r)*105*s.dir,s.y-Math.cos(r)*105),neck=pt(shoulder.x+Math.sin(r)*20*s.dir,shoulder.y-Math.cos(r)*20),head=pt(neck.x+Math.sin(r)*22*s.dir,neck.y-Math.cos(r)*22);const targets={wristA:pt(s.x+s.hands[0].x*s.dir,s.y+s.hands[0].y),wristB:pt(s.x+s.hands[1].x*s.dir,s.y+s.hands[1].y),footA:pt(s.x+s.feet[0].x*s.dir,s.y+s.feet[0].y),footB:pt(s.x+s.feet[1].x*s.dir,s.y+s.feet[1].y)};return {s,hip,shoulder,neck,head,targets};}
const locks:[number,number,number,number][]=[[0,0,48,547],[0,72,98,815],[1,74,126,1210],[0,116,150,850],[0,333,353,915],[1,333,353,1180],[0,410,460,920]];
function build(f:number,id:number,applyContact:boolean){const b=base(f,id),{s,hip,shoulder,neck,head}=b;for(const [who,start,end,x] of locks){const edge=5;if(id===who&&f>=start-edge&&f<=end+edge){const w=f<start?smooth((f-start+edge)/edge):f>end?1-smooth((f-end)/edge):1;b.targets.footB=pt(mix(b.targets.footB.x,x,w),mix(b.targets.footB.y,850,w));}} if(id===0&&f>=59&&f<=103){const w=f<64?smooth((f-59)/5):f>98?1-smooth((f-98)/5):1;b.targets.footA=pt(mix(b.targets.footA.x,880,w),mix(b.targets.footA.y,850,w));} if(applyContact)for(const e of events){const delta=Math.abs(frameTime(f)-e.frame);if(e.attacker===id&&delta<7){const other=build(e.frame,1-id,false),target=other.joints[e.target],w=1-smooth(delta/7);const limb=e.limb as keyof typeof b.targets;if(b.targets[limb])b.targets[limb]=pt(mix(b.targets[limb].x,target.x,w),mix(b.targets[limb].y,target.y,w));}}
 for(const name of ['footA','footB'] as const)b.targets[name].y=Math.min(850,b.targets[name].y);
 const [elbowA,wristA]=ik(shoulder,b.targets.wristA,65,s.dir),[elbowB,wristB]=ik(shoulder,b.targets.wristB,65,-s.dir),[kneeA,footA]=ik(hip,b.targets.footA,87,-s.dir),[kneeB,footB]=ik(hip,b.targets.footB,87,-s.dir);let joints:Record<Joint,P>={hip,shoulder,neck,head,elbowA,elbowB,wristA,wristB,kneeA,kneeB,footA,footB};if(s.spin){const a=s.spin*Math.PI/180;for(const key of Object.keys(joints) as Joint[]){const p=joints[key],x=p.x-hip.x,y=p.y-hip.y;joints[key]=pt(hip.x+x*Math.cos(a)-y*Math.sin(a),hip.y+x*Math.sin(a)+y*Math.cos(a));}}return {joints,dir:s.dir};}
export function skeletonAt(frame:number,id:number){return build(clamp(frame/719)*719,id,true);}
export function cameraAt(frame:number){let x=1000,scale=1.25;if(frame>=270&&frame<390){x=1060;scale=1.4;}if(frame>=430&&frame<480){x=1100;scale=1.5;}if(frame>=480){x=1260;scale=1.25;}let dx=0,dy=0;for(const e of events){const age=frame-e.frame;if(age>=0&&age<12){dx+=Math.sin(age*2.4)*e.power*8*(1-age/12);dy+=Math.cos(age*2.0)*e.power*5*(1-age/12);}}return{x:x+dx,y:610+dy,scale};}
