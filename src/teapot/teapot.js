/* Original enamel teapot. Body proportions stay fixed; only the feet and lid overlap.
 * Painted using the upstream medium and expression helpers, never a raster puppet. */
window.TEAPOT = (() => {
  const C = { mint:'#91C6AE', shade:'#55A092', light:'#D6E2BF', lid:'#EBAA73', lidDark:'#C77C50', ink:'#3B4142', wall:'#D9DDCA', floor:'#D8AD8E' };
  function draw(x,y,u,o={}) {
    const id=o.id||'hero', sw=clamp(u/24,.65,1.6), P=p=>p.map(([a,b])=>[a*u,b*u]);
    push(); translate(x,y); rotate(o.rot||0); scale(1+(o.sq||0),1-(o.sq||0));
    // Feet have a fixed short length; hanging/paddling rotates rather than stretching.
    for(const s of [-1,1]) {
      boilSeed(id+'foot'+s); push(); translate(s*2.65*u,-.75*u); rotate((o.hang||0)*s*.42+(s<0?o.footL||0:o.footR||0));
      paint(ellPts(s*.3*u,0,1.35*u,.72*u,18,.025*u),{wash:C.lid,fill:C.lidDark,fillOp:55,ink:C.ink,sw:sw*.8}); pop();
    }
    // Handle is an open C, entirely outside the body's silhouette: no hidden contour bleed.
    boilSeed(id+'handle');
    // One open C-shaped painted band: the concavity leaves the real background visible.
    // Unlike a fat marker stroke this has bounded enamel edges, not a pigment halo.
    paint(P([[-4.7,-8.8],[-6.85,-9.05],[-8.1,-8.6],[-8.75,-7.45],
      [-8.8,-6.1],[-8.15,-4.45],[-6.8,-3.65],[-5.34,-3.7],
      [-5.72,-4.6],[-6.65,-4.65],[-7.35,-5.15],[-7.75,-6.35],
      [-7.7,-7.25],[-7.25,-7.9],[-6.55,-8.1],[-5.3,-7.9]]),
      {wash:C.mint,fill:C.shade,fillOp:72,bleed:.12,tex:.7,ink:C.ink,sw,curv:.3});
    boilSeed(id+'spout');
    paint(P([[4.6,-7.8],[6.25,-8.6],[7.3,-10.8],[8.9,-10.3],[8.3,-7.6],[6.0,-5.6],[4.7,-5.8]]),{wash:C.mint,fill:C.shade,fillOp:70,ink:null,curv:.3});
    // Only exposed spout edges; body covers base without leaving internal ink seams.
    inkLine(P([[5.45,-8.1],[6.25,-8.6],[7.3,-10.8],[8.9,-10.3],[8.3,-7.6],[6.05,-5.65]]),sw,C.ink,'ink',.3);
    boilSeed(id+'body');
    paint(ellPts(0,-5.8*u,5.9*u,4.9*u,38,.035*u),{wash:C.mint,fill:C.shade,fillOp:72,bleed:.12,tex:.7,ink:C.ink,sw});
    boilSeed(id+'glaze');
    paint(ellPts(-2.8*u,-7.8*u,1.15*u,1.6*u,18,.02*u),{fill:C.light,fillOp:95,bleed:.22,ink:null});
    // Apricot lid remains rigid and arrives late after impact.
    boilSeed(id+'lid'); push(); translate(0,(-10.45-(o.lidLift||0))*u); rotate(o.lidRot||0);
    paint(ellPts(0,0,3.65*u,.72*u,24,.02*u),{wash:C.lid,fill:C.lidDark,fillOp:68,ink:C.ink,sw:sw*.85});
    paint(ellPts(0,-.85*u,.82*u,.68*u,18,.015*u),{wash:C.lid,fill:C.lidDark,fillOp:50,ink:C.ink,sw:sw*.75}); pop();
    boilSeed(id+'face');
    const view=o.view||'front'; push(); translate(view==='threequarter'?1.1*u:0,0); scale(view==='profile'?.6:view==='threequarter'?.87:1,1);
    if(view==='profile') translate(3.0*u,0);
    push(); translate(0,-.7*u);
    eyes(u*.77,{...o,seed:17},sw*.95,view==='profile'?[1]:[-1,1]); pop();
    // eyes()'s natural centre is raised to a readable face; mouth separated below it.
    mouth(u*.9,o.mouth||'smile',sw*.95);
    if(o.blush>.15) for(const s of [-1,1]) paint(ellPts(s*3.1*u,-3.9*u,.6*u,.27*u,12),{fill:PAL.rose,fillOp:80*o.blush,ink:null,bleed:.2});
    pop(); pop();
  }
  function tip(p){const a=p.rot||0, sx=1+(p.sq||0),sy=1-(p.sq||0),xx=8.15*p.u*sx,yy=-10.55*p.u*sy;return [p.x+xx*Math.cos(a)-yy*Math.sin(a),p.y+xx*Math.sin(a)+yy*Math.cos(a)];}
  function bubble(x,y,r,t,id='bubble') {
    if(r<1)return; boilSeed(id); const wobble=1+.028*Math.sin(t*7);
    paint(ellPts(x,y,r*wobble,r/wobble,36,r*.012),{fill:'#D3DEE4',fillOp:38,bleed:.08,ink:'#8AABB0',sw:clamp(r/100,.55,1.3)});
    const arc=(a,b,rr)=>Array.from({length:9},(_,i)=>[x+Math.cos(lerp(a,b,i/8))*r*rr,y+Math.sin(lerp(a,b,i/8))*r*rr]);
    inkLine(arc(3.65,4.6,.82),1.7,PAL.cream,'ink',.6);
    inkLine(arc(.3,1.25,.89),.85,'#D8A0A5','inkfine',.6);
  }
  function burst(x,y,r,t,at,id='burst') {
    const q=seg(t,at,at+.35); if(t<at||q>=1)return;
    for(let k=0;k<7;k++){boilSeed(id+k);const a=k*TAU/7+.2,rr=r*(1+.4*q);inkLine([[x+Math.cos(a)*rr,y+Math.sin(a)*rr],[x+Math.cos(a)*(rr+18*(1-q)),y+Math.sin(a)*(rr+18*(1-q))]],1.2*(1-q),k%2?PAL.cream:'#91B4B8','ink',0);}
  }
  return {draw,tip,bubble,burst,C};
})();
