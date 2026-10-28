/* Original miniature garden. Native Huashu PAINT + CAM. No raster poses. */
(() => {
const P=PAINT, TAU=Math.PI*2, clamp=U.clamp, lerp=U.lerp;
const G=window.RAIN_GARDEN={};
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const seg=(t,a,b)=>smooth((t-a)/(b-a));
const R=U.rng(23819);
const moss=Array.from({length:1250},()=>({a:R()*TAU,q:R(),s:2+R()*8,c:R(),ph:R()*TAU}));
const lights=Array.from({length:70},()=>({x:R()*2400-240,y:R()*1300-100,r:1+R()*3,ph:R()*TAU}));
const strokes=Array.from({length:300},()=>({x:R()*1280-640,y:R()*320-160,w:8+R()*48,a:R(),ph:R()*TAU}));
const stars=Array.from({length:180},()=>({x:R()*1920,y:R()*1080,s:.6+R()*2,ph:R()*TAU}));
const flowers=[{x:760,y:607,s:1.05,at:7.2},{x:1130,y:660,s:1.25,at:8.3},{x:1330,y:550,s:.83,at:9.4}];
G.state=t=>{
 const fall=clamp((t-2.8));
 return {t,dropX:1000,dropY:350+270*fall*fall,dropVisible:t<3.8,rippleAge:Math.max(0,t-3.8),flowers:flowers.map(f=>seg(t,f.at,f.at+1.05)),camera:CAM.at([{t:0,x:885,y:470,z:1.45},{t:2.7,x:960,y:495,z:1.45},{t:3.8,x:1000,y:570,z:1.45},{t:6.9,x:1040,y:590,z:1.12},{t:10.9,x:1040,y:590,z:1.12},{t:13.8,x:960,y:620,z:.76},{t:15,x:960,y:620,z:.76}],t)};
};
function ellipse(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.01,rx),Math.max(.01,ry),0,0,TAU);c.fill()}
function glow(c,x,y,r,col,alpha=1){c.save();c.globalAlpha=alpha;const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,col);g.addColorStop(1,'rgba(255,226,139,0)');c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);c.restore()}
function bg(c,t){
 const g=c.createLinearGradient(0,0,1920,1080);g.addColorStop(0,'#173f40');g.addColorStop(.48,'#0c353a');g.addColorStop(1,'#081e2c');c.fillStyle=g;c.fillRect(0,0,1920,1080);
 glow(c,360,90,800,'rgba(239,217,147,.27)');glow(c,1520,560,640,'rgba(92,199,162,.12)');
 c.save();c.globalCompositeOperation='screen';
 for(let i=0;i<6;i++){c.fillStyle='rgba(236,221,153,.024)';c.beginPath();c.moveTo(250+i*70,-20);c.lineTo(380+i*170,1080);c.lineTo(550+i*170,1080);c.lineTo(320+i*70,-20);c.fill()}c.restore();
 stars.forEach(p=>{const a=.16+.22*(.5+.5*Math.sin(t*.7+p.ph));ellipse(c,p.x+Math.sin(t*.13+p.ph)*8,p.y,p.s,p.s,`rgba(250,227,161,${a})`)});
}
function island(c,t){
 const tex=P.cached('rg_stone',1920,1080,g=>{
 const body=g.createLinearGradient(0,625,0,1040);body.addColorStop(0,'#315c53');body.addColorStop(.4,'#1b403d');body.addColorStop(1,'#102b31');
 g.fillStyle=body;g.beginPath();g.moveTo(260,600);g.bezierCurveTo(280,870,580,1030,960,1055);g.bezierCurveTo(1335,1030,1640,860,1660,600);g.closePath();g.fill();
 g.save();g.clip();const rr=U.rng(141);for(let i=0;i<1100;i++){const x=250+rr()*1420,y=640+rr()*420;g.strokeStyle=i%3?'rgba(119,159,116,.08)':'rgba(7,25,30,.24)';g.lineWidth=1+rr()*4;g.beginPath();g.moveTo(x,y);g.lineTo(x+rr()*40-20,y+rr()*22);g.stroke()}g.restore();
 ellipse(g,960,600,706,243,'#446c45');ellipse(g,960,594,668,205,'#86a263');
 moss.forEach(p=>{const rr=.89+p.q*.15,x=960+Math.cos(p.a)*692*rr,y=600+Math.sin(p.a)*228*rr;ellipse(g,x,y,p.s*1.5,p.s,['#244d3f','#406a43','#6c914b','#acc078','#d6cc86'][Math.floor(p.c*5)])});
 });c.drawImage(tex,0,0);
 // Fine hanging moss on the outside rim; continuous curves rooted in world coordinates.
 for(let i=0;i<28;i++){const a=.2+i/27*(Math.PI-.4),x=960+Math.cos(a)*690,y=600+Math.sin(a)*230,L=25+((i*31)%105);c.strokeStyle=i%3?'#48714c':'#73975b';c.lineWidth=3;c.beginPath();c.moveTo(x,y);for(let j=1;j<=9;j++){const q=j/9;c.lineTo(x+Math.sin(t*.8+i+q*3)*8*q,y+q*L)}c.stroke()}
}
function water(c,t){
 c.save();c.beginPath();c.ellipse(960,594,642,179,0,0,TAU);c.clip();
 const w=c.createLinearGradient(600,420,1250,780);w.addColorStop(0,'#82b8a2');w.addColorStop(.25,'#3d9a96');w.addColorStop(.65,'#1b646a');w.addColorStop(1,'#124a57');c.fillStyle=w;c.fillRect(290,400,1330,410);
 glow(c,770,505,500,'rgba(251,230,162,.38)');
 c.lineCap='round';for(const p of strokes){const x=960+p.x+Math.sin(t*.9+p.ph)*9,y=594+p.y+Math.cos(t*.65+p.ph)*2;c.strokeStyle=`rgba(${p.a>.7?'241,231,166':'110,199,182'},${.07+.13*(.5+.5*Math.sin(t*1.1+p.ph))})`;c.lineWidth=1+p.a*3;c.beginPath();c.moveTo(x,y);c.lineTo(x+p.w,y+Math.sin(p.ph)*2);c.stroke()}
 for(let i=0;i<5;i++){const age=t-3.8-i*.28;if(age<0)continue;const r=age*88;if(r>1000)continue;c.globalAlpha=Math.max(0,.65-age*.08);c.lineWidth=2.1;c.strokeStyle='#e4e7b4';c.beginPath();c.ellipse(1000,620,r,r*.27,0,0,TAU);c.stroke()}c.restore();
 // Pads drift coherently; all blossoms use these exact anchors.
 flowers.forEach((f,i)=>{const dx=Math.sin(t*.75+i)*3,dy=Math.sin(t*.95+i)*1.7;ellipse(c,f.x+dx,f.y+dy,70*f.s,23*f.s,'#2d6d51');ellipse(c,f.x-8+dx,f.y-3+dy,58*f.s,18*f.s,'#699a62');c.strokeStyle='rgba(210,213,139,.36)';c.lineWidth=1.5;for(let n=-2;n<=2;n++){c.beginPath();c.moveTo(f.x+dx,f.y+dy);c.lineTo(f.x+n*20*f.s+dx,f.y-14*f.s+dy);c.stroke()}});
}
function leaf(c,t){
 c.save(); // Leaf tip is physically fixed; small dew beads travel along its veins.
 const gr=c.createLinearGradient(310,180,900,400);gr.addColorStop(0,'#203e35');gr.addColorStop(.35,'#4e7c4c');gr.addColorStop(.75,'#94b16a');gr.addColorStop(1,'#b0bd73');
 c.fillStyle=gr;c.beginPath();c.moveTo(190,210);c.bezierCurveTo(430,78,780,145,1000,350);c.bezierCurveTo(740,380,420,390,190,210);c.fill();
 c.save();c.clip();const rr=U.rng(6);for(let i=0;i<180;i++){const x=220+rr()*760,y=140+rr()*240;c.strokeStyle='rgba(196,211,137,.10)';c.lineWidth=.8+rr()*2;c.beginPath();c.moveTo(x,y);c.lineTo(x+18+rr()*30,y+rr()*12);c.stroke()}c.restore();
 c.lineWidth=3;c.strokeStyle='#bfd08b';c.beginPath();c.moveTo(190,210);c.bezierCurveTo(480,250,720,300,1000,350);c.stroke();
 for(let i=1;i<9;i++){const x=210+i*83,y=218+i*14;c.lineWidth=1.2;c.strokeStyle='rgba(199,214,151,.42)';c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+15,y-50,x+38,y-90+i*6);c.stroke();c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+16,y+30,x-13,y+90-i*8);c.stroke()}
 // Several minor dew beads glide along the same leaf curve into hero droplet.
 for(let i=0;i<6;i++){let q=clamp(t/2.65-(i*.09));if(q>=1)continue;const x=lerp(440+i*47,995,q),y=lerp(251+i*10,345,q);drop(c,x,y,4+i*.65,1)}c.restore();
}
function drop(c,x,y,r,sy=1){c.save();c.translate(x,y);c.scale(1,sy);const gr=c.createRadialGradient(-r*.25,-r*.4,r*.08,0,0,r);gr.addColorStop(0,'rgba(255,255,229,.96)');gr.addColorStop(.22,'rgba(192,237,216,.7)');gr.addColorStop(.72,'rgba(82,170,163,.43)');gr.addColorStop(1,'rgba(238,255,222,.9)');ellipse(c,0,0,r,r,gr);c.strokeStyle='rgba(230,255,230,.8)';c.lineWidth=1.2;c.beginPath();c.arc(0,0,r,-2.8,-.9);c.stroke();ellipse(c,-r*.28,-r*.32,r*.22,r*.13,'rgba(255,255,245,.96)');c.restore()}
function flower(c,f,i,t){const q=seg(t,f.at,f.at+1.05),dx=Math.sin(t*.75+i)*3,dy=Math.sin(t*.95+i)*1.7,x=f.x+dx,y=f.y+dy;const lift=10+q*35;
 glow(c,x,y-20,110*f.s,'rgba(248,219,111,.36)',q);
 c.save();c.translate(x,y-7);c.scale(f.s,f.s);
 // Petals share fixed base, continuously rotate open; no image replacement.
 for(let layer=0;layer<2;layer++)for(let j=0;j<7;j++){const a=(j-3)*.28+(layer?.12:0),spread=(j-3)*q*14,tipY=-lift-(layer?12:2)+Math.abs(j-3)*q*7;c.fillStyle=layer?'#fff3c6':'#e7d79c';c.strokeStyle='rgba(163,164,99,.38)';c.lineWidth=.8;c.beginPath();c.moveTo(0,0);c.bezierCurveTo(spread-10,-12,spread-14,tipY+5,spread,tipY);c.bezierCurveTo(spread+15,tipY+7,spread+12,-8,0,0);c.fill();c.stroke()}
 ellipse(c,0,-7,7+q*7,4+q*3,'#f5cb60');c.restore();
 if(q>0){for(let j=0;j<8;j++){const age=t-f.at-j*.12;if(age<0)continue;const x2=x+Math.sin(j*2.3+age)*age*12,y2=y-24-age*25;c.globalAlpha=Math.max(0,1-age/4)*q;glow(c,x2,y2,8,'rgba(255,233,145,.7)');ellipse(c,x2,y2,1.3,1.3,'#fff1c3');c.globalAlpha=1}}
}
function draw(c,t){const s=G.state(t);bg(c,t);CAM.with(c,s.camera,()=>{island(c,t);water(c,t);flowers.forEach((f,i)=>flower(c,f,i,t));leaf(c,t);if(s.dropVisible){const attach=0;const r=lerp(13,20,seg(t,0,2.7));drop(c,s.dropX,s.dropY+attach,r,1+.2*seg(t,2.8,3.6))}
 const age=t-3.8;if(age>=0&&age<.65){const q=age/.65;for(let i=0;i<7;i++){const vx=(i-3)*44,vy=-160-Math.abs(i-3)*5;const yy=620+vy*q+175*q*q;drop(c,1000+vx*q,yy,3.5*(1-q)+.5,1.2)}}
 });
 // Near-plane fireflies: gentle parallax, not a substitute for object action.
 lights.forEach(p=>{const x=p.x+Math.sin(t*.4+p.ph)*13,y=p.y-t*3;const a=.15+.23*(.5+.5*Math.sin(t*1.7+p.ph));glow(c,x,y,p.r*5,'rgba(244,221,135,.32)',a);ellipse(c,x,y,p.r*.5,p.r*.5,`rgba(252,234,166,${a})`)});
 c.save();c.globalAlpha=.13;c.drawImage(P.grain('rain-garden',.12,[234,219,166],.2),0,0);c.restore();
}
G.draw=draw;['dew','ripple','bloom','island'].forEach(id=>{SCENES[id]={draw:(c,lt,t)=>draw(c,t)}});
})();
