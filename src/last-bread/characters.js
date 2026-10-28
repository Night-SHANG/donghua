// Hand-drawn, layered character art. No p5 calls in geometry; no random/stateful animation.
// Pose angles are radians. x/y is ground origin; u is pixels per drawing unit.
// Positive squash widens/shortens around that origin. Flip precedes body rotation.
// Anchors are WORLD pixels and are transformed by exactly the same map as drawing points.
(() => {
  const C = Bread.palette;
  const ellipse = (x,y,rx,ry,n=20) => Array.from({length:n},(_,i)=>{
    const a=i*Math.PI*2/n; return [x+rx*Math.cos(a),y+ry*Math.sin(a)];
  });
  const rotate = (pts,origin,a) => pts.map(([x,y])=>{
    const dx=x-origin[0],dy=y-origin[1];
    return [origin[0]+dx*Math.cos(a)-dy*Math.sin(a),origin[1]+dx*Math.sin(a)+dy*Math.cos(a)];
  });
  const move = (pts,x,y) => pts.map(p=>[p[0]+x,p[1]+y]);
  const shape = (layers,id,points,color,opts={}) => {
    // Real opaque underpaint handles painter-order occlusion. Pigment is an overlay,
    // not a replacement for opacity (p5.brush wash mixes with what is underneath).
    const feature=/mask|pupil|nose|mouth/.test(id);
    layers.push({id,kind:'paint',points,base:color,
      style:{fill:color,fillOp:feature?8:24,bleed:.025,tex:.25,border:.12,ink:C.ink,sw:.32,curv:.12,...opts}});
  };
  const line = (layers,id,points,color=C.ink,sw=.14) => layers.push({id,kind:'line',points,style:{ink:color,sw}});
  const noInk={ink:null};

  // Each angle has its own cheek, nape, belly and muzzle silhouette, not a scaled front sprite.
  const raccoonViews = {
    front:{head:[[-2.55,-7.8],[-2.15,-8.7],[-1.1,-9.03],[-.5,-9.18],[-.62,-8.96],[0,-9.15],[.24,-8.98],[1.35,-8.8],[2.35,-8.05],[2.82,-7.49],[2.62,-7.48],[3,-7.12],[2.7,-7.16],[2.82,-6.85],[2.5,-6.92],[2.15,-6.4],[1.15,-6.02],[0,-5.89],[-1.3,-6.1],[-2.38,-6.52],[-2.8,-6.88],[-2.56,-6.9],[-2.99,-7.2],[-2.63,-7.22],[-2.9,-7.54]],
      body:[[-1.65,-6.2],[-2.27,-5.45],[-2.55,-4.2],[-2.46,-2.1],[-2.1,-1.0],[-.85,-.63],[.75,-.7],[2.05,-1.1],[2.45,-2.7],[2.25,-4.6],[1.65,-6.2]],ears:[[-1.95,-8.6],[1.95,-8.6]], eyes:[[-1.1,-7.5,.49],[1.1,-7.5,.49]],nose:[0,-7.0], shoulders:[[-1.86,-5.65],[1.86,-5.65]], apron:[[-1.35,-5.72],[1.35,-5.72],[1.84,-1.42],[0,-1.15],[-1.84,-1.42]],rear:false},
    q:{head:[[-2.55,-7.48],[-2.18,-8.42],[-1.3,-8.93],[-.8,-9.12],[-.8,-8.94],[-.22,-9.13],[.05,-8.94],[1.2,-8.65],[2.0,-7.99],[2.71,-7.55],[3.05,-7.45],[2.8,-7.19],[3.04,-7.02],[2.7,-6.95],[2.78,-6.73],[2.35,-6.77],[1.65,-6.12],[.4,-5.85],[-1.03,-6.03],[-2.05,-6.48],[-2.67,-6.9],[-2.4,-6.9],[-2.85,-7.2],[-2.51,-7.19]],
      body:[[-1.4,-6.15],[-2.15,-5.56],[-2.51,-4.2],[-2.45,-2.4],[-2.05,-1.2],[-.8,-.62],[.65,-.65],[1.9,-1.1],[2.2,-2.7],[2.12,-4.6],[1.3,-6.1]],ears:[[-1.77,-8.48],[1.4,-8.48]],eyes:[[-.62,-7.52,.52],[1.37,-7.47,.38]],nose:[1.03,-7.0],shoulders:[[-1.85,-5.55],[1.78,-5.48]],apron:[[-.92,-5.72],[1.45,-5.6],[2,-1.5],[.43,-1.13],[-1.37,-1.4]],rear:false},
    side:{head:[[-2,-7.9],[-1.6,-8.7],[-.6,-8.96],[.1,-8.94],[.8,-8.6],[1.4,-8.05],[2.1,-7.65],[2.82,-7.42],[2.9,-7.08],[2.35,-6.86],[2.0,-6.37],[1.15,-5.98],[-.12,-6.0],[-1.5,-6.35],[-2.03,-6.73],[-1.82,-6.78],[-2.25,-7.06],[-2.01,-7.15],[-2.27,-7.45]],
      body:[[-1.05,-6.15],[-2.05,-5.34],[-2.49,-3.7],[-2.15,-1.88],[-1.32,-.93],[.1,-.66],[1.3,-1.15],[1.76,-2.6],[1.67,-4.7],[.8,-6.14]],ears:[[-1.19,-8.5],[.08,-8.45]],eyes:[[1.03,-7.6,.49]],nose:[2.67,-7.29],shoulders:[[-.73,-5.6],[1.17,-5.3]],apron:[[1,-5.56],[1.51,-5.38],[2.01,-1.59],[1.01,-1.34],[.7,-1.56]],rear:false},
    qback:{head:[[-2.5,-7.5],[-2.12,-8.42],[-1.1,-8.95],[-.42,-9.15],[-.43,-8.97],[.21,-9.08],[1.4,-8.67],[2.12,-7.94],[2.65,-7.62],[2.89,-7.26],[2.6,-7.09],[2.65,-6.77],[2.3,-6.79],[1.65,-6.2],[.45,-5.94],[-.92,-6.13],[-2.1,-6.6],[-2.62,-6.98],[-2.37,-7.03],[-2.76,-7.31]],
      body:[[-1.4,-6.13],[-2.25,-5.42],[-2.62,-4.03],[-2.42,-2],[-1.73,-1.05],[-.35,-.63],[1.12,-.91],[2.17,-1.7],[2.33,-3.3],[1.95,-5.16],[1,-6.1]],ears:[[-1.8,-8.5],[1.42,-8.48]],eyes:[],nose:[2.57,-7.28],shoulders:[[-1.82,-5.5],[1.72,-5.35]],apron:[[1.17,-5.56],[1.54,-5.48],[2.15,-1.56],[1.5,-1.29],[1.27,-1.43]],rear:true},
    back:{head:[[-2.55,-7.75],[-2.12,-8.48],[-1.25,-8.89],[-.45,-9.07],[-.6,-8.87],[.1,-9.03],[1.35,-8.85],[2.25,-8.12],[2.68,-7.44],[2.48,-7.43],[2.84,-7.07],[2.57,-7.12],[2.67,-6.85],[2.26,-6.92],[1.2,-6.19],[0,-6.02],[-1.28,-6.24],[-2.32,-6.73],[-2.68,-7.07],[-2.43,-7.07],[-2.83,-7.43]],
      body:[[-1.5,-6.25],[-2.25,-5.5],[-2.6,-4.17],[-2.51,-2.4],[-2.03,-1.15],[-.8,-.64],[.7,-.64],[2.0,-1.15],[2.53,-2.35],[2.5,-4.3],[1.56,-6.25]],ears:[[-1.9,-8.5],[1.9,-8.5]],eyes:[],nose:[0,-7.1],shoulders:[[-1.94,-5.6],[1.94,-5.6]],apron:[[-1.35,-5.72],[1.35,-5.72],[1.84,-1.42],[0,-1.15],[-1.84,-1.42]],rear:true}
  };

  function tail(layers,p,rear) {
    const pivot=[-1.6,-2.4], a=p.tailAngle;
    const draw=(id,pts,color,opts)=>shape(layers,id,rotate(pts,pivot,a),color,opts);
    draw('tail',[[-1.6,-1.65],[-2.63,-1.48],[-3.63,-2],[-4.45,-2.9],[-5.0,-4.05],[-5.05,-5.2],[-4.65,-6.0],[-4.25,-6.23],[-4.1,-6.05],[-3.93,-6.2],[-3.45,-5.82],[-3.2,-5.2],[-3.29,-4.6],[-3,-3.63],[-2.2,-3],[-1.3,-2.75]],C.furLight);
    draw('tail/ring1',[[-2.3,-1.54],[-3.03,-1.65],[-3.59,-2.07],[-3.07,-3.64],[-2.5,-3.18],[-2.04,-2.95]],C.furDark,noInk);
    draw('tail/ring2',[[-4.2,-2.57],[-4.69,-3.39],[-4.94,-4.14],[-3.31,-4.6],[-3.18,-4.03],[-3.02,-3.64]],C.furDark,noInk);
    draw('tail/tip',[[-5.05,-5.03],[-4.95,-5.61],[-4.65,-6],[-4.25,-6.23],[-4.1,-6.05],[-3.93,-6.2],[-3.45,-5.82],[-3.2,-5.2]],C.furDark,noInk);
    line(layers,'tail/fur',rotate([[-4.65,-5.75],[-4.44,-5.83],[-4.33,-5.61]],pivot,a),C.furLight);
  }
  function raccoonLeg(layers,side,phase,view,target) {
    const sign=side==='L'?-1:1, s=Math.sin(phase)*sign;
    const hip=[sign*(view==='side'?.57:1.12),-1.8], foot=target||[hip[0]+s*.95,-Math.max(0,s)*.8];
    const knee=target?[(hip[0]+foot[0])*.5-.15,(-1.8+foot[1])*.5-.15]:[hip[0]+s*.48,-.9-Math.max(0,s)*.25];
    shape(layers,'leg'+side,[[hip[0]-.49,hip[1]],[hip[0]+.48,hip[1]], [knee[0]+.38,knee[1]], [foot[0]+.31,foot[1]-.16],[foot[0]-.38,foot[1]-.08],[knee[0]-.43,knee[1]]],C.fur);
    shape(layers,'foot'+side,[[foot[0]-.43,foot[1]-.25],[foot[0]-.08,foot[1]-.4],[foot[0]+.45,foot[1]-.27],[foot[0]+.74,foot[1]-.1],[foot[0]+.67,foot[1]],foot,[foot[0]-.48,foot[1]]],C.furDark);
    line(layers,'foot'+side+'/toes',[[foot[0]+.3,foot[1]-.23],[foot[0]+.43,foot[1]-.08]],C.furLight,.1);
    return foot;
  }
  function raccoonArm(layers,id,origin,angle,far) {
    // Wrist/tip landmark is a vertex of the actual paw, not a detached proxy point.
    const pts=[[0,-.18],[.43,-.06],[.67,.5],[.66,1.19],[.51,1.65],[.59,1.86],[.43,2.02],[.33,1.95],[.19,2.13],[.03,2.06],[-.08,2.2],[-.25,2.08],[-.42,1.87],[-.53,1.28],[-.47,.48],[-.3,.02]];
    const local=rotate(move(pts,...origin),origin,angle);
    shape(layers,id,local,far?C.furDark:C.fur);
    shape(layers,id+'/paw',rotate(move([[.57,1.36],[.51,1.65],[.59,1.86],[.43,2.02],[.33,1.95],[.19,2.13],[.03,2.06],[-.08,2.2],[-.25,2.08],[-.42,1.87],[-.48,1.42]],...origin),origin,angle),C.furDark,noInk);
    line(layers,id+'/fur',rotate(move([[-.31,.44],[-.2,.68],[-.29,.82]],...origin),origin,angle),C.furLight,.12);
    line(layers,id+'/digits',rotate(move([[.36,1.66],[.16,1.79],[.07,1.95]],...origin),origin,angle),C.furLight,.1);
    return local[10];
  }
  function eye(layers,id,x,y,r,p) {
    const happy=p.mood==='laugh'||p.mood==='relieved';
    if(happy) {line(layers,id,[[x-r*.7,y+.05],[x,y-.18],[x+r*.7,y+.03]],C.ink,.25);return;}
    const ry=p.mood==='surprised'?.69:p.mood==='determined'?.39:.58;
    shape(layers,id,ellipse(x,y,r,ry),C.creamLight,{sw:.16});
    const px=x+.08+Math.max(-1,Math.min(1,p.lookX))*.15, py=y+.06+Math.max(-1,Math.min(1,p.lookY))*.16;
    shape(layers,id+'/pupil',ellipse(px,py,r*.48,ry*.7),C.ink,noInk);
    shape(layers,id+'/glint',ellipse(px+.065,py-.19,.07,.1,10),C.white,noInk);
    line(layers,id+'/brow',[[x-r*.8,y-ry-.2],[x,y-ry-(p.mood==='worried'?.47:.29)],[x+r*.7,y-ry-.17]],C.furDark,.17);
  }
  function tuantuan(p) {
    const v=raccoonViews[p.view], L=[], A={feet:[],hands:[],apron:[]};
    if(!v.rear) tail(L,p,false);
    A.feet=[raccoonLeg(L,'L',p.legPhase,p.view,p._feet?.[0]),raccoonLeg(L,'R',p.legPhase,p.view,p._feet?.[1])];
    A.hands[1]=raccoonArm(L,'armR',v.shoulders[1],p.armR-.14,true);
    shape(L,'body',v.body,C.fur);
    // Do not draw a hidden front bib on the back. The qback panel is the narrow
    // exposed side hem, not a front bib painted under a supposedly opaque torso.
    if(p.view!=='back') shape(L,'apron',v.apron,C.apron);
    if(!v.rear) {
      const x=p.view==='front'?0:p.view==='side'?1.28:.43;
      if(p.view!=='side') {
        shape(L,'apron/pocket',[[x-.91,-3.1],[x+.95,-3.1],[x+.84,-1.93],[x+.15,-1.76],[x-.82,-1.98]],C.apronLight,{sw:.15});
        line(L,'apron/pocket-seam',[[x-.72,-2.96],[x-.65,-2.12],[x+.15,-1.95],[x+.66,-2.08],[x+.75,-2.95]],C.apronDark,.09);
      }
      line(L,'apron/hem',v.apron.slice(2),C.apronLight,.15);
      line(L,'apron/strapL',[[v.apron[0][0]-.25,-5.97],v.apron[0],[v.apron[0][0]+.18,-4.65]],C.apronLight,.32);
      line(L,'apron/strapR',[[v.apron[1][0]-.16,-5.93],v.apron[1],[v.apron[1][0]-.1,-4.57]],C.apronLight,.26);
      shape(L,'apron/button',ellipse(v.apron[0][0]+.1,-5.08,.08,.08,10),C.cream,noInk);
    } else {
      line(L,'apron/back-straps',[[-1.5,-5.9],[-.25,-4.1],[1.45,-5.88]],C.apron,.38);
      line(L,'apron/waist',[[-2.33,-3.4],[0,-3.18],[2.23,-3.48]],C.apron,.38);
    }
    const tx=v.rear?-.3:-2.05,ty=-3.4;
    shape(L,'apron/tieL',[[tx,ty],[tx-.71,ty-.38],[tx-1,ty-.2],[tx-.78,ty+.1],[tx,ty+.13]],C.apron);
    shape(L,'apron/tieR',[[tx,ty],[tx+.51,ty-.48],[tx+.81,ty-.37],[tx+.58,ty+.04],[tx,ty+.13]],C.apron);
    shape(L,'apron/tie-ends',[[tx-.1,ty],[tx+.13,ty],[tx+.02,ty+1.05],[tx-.27,ty+.83],[tx-.5,ty+1.01]],C.apron);
    if(v.rear) tail(L,p,true);
    A.hands[0]=raccoonArm(L,'armL',v.shoulders[0],p.armL+.2,false);
    // Ears: soft rounded triangles with inset dark fur, behind the broad face.
    v.ears.forEach(([x,y],i)=>{
      const e=[[x-.57,y+.4],[x-.55,y-.51],[x-.29,y-1.13],[x-.01,y-1.23],[x+.39,y-.93],[x+.65,y-.24],[x+.6,y+.43]];
      shape(L,'ear'+i,e,C.fur);
      shape(L,'ear'+i+'/cream',[[x-.41,y+.13],[x-.35,y-.58],[x-.1,y-.96],[x+.19,y-.73],[x+.43,y-.11]],C.cream,{ink:null});
      shape(L,'ear'+i+'/inner',[[x-.23,y+.11],[x-.2,y-.52],[x-.03,y-.72],[x+.23,y-.36],[x+.33,y+.09]],C.furDark,noInk);
    });
    shape(L,'head',v.head,C.furLight);
    if(!v.rear) {
      let face;
      if(p.view==='side') face=[[-1.8,-7.6],[-1,-7.8],[.35,-8.41],[1.14,-7.92],[2.1,-7.57],[2.78,-7.4],[2.85,-7.12],[2.31,-6.84],[1.96,-6.38],[1.1,-6.1],[-.1,-6.13],[-1.51,-6.51],[-1.96,-6.85],[-1.69,-6.83],[-2.03,-7.13]];
      else face=[[-2.53,-7.49],[-1.61,-7.95],[-.75,-8.55],[-.33,-8.6],[-.6,-8.2],[.15,-7.68],[.67,-8.51],[1.17,-8.47],[1.9,-7.95],[2.7,-7.52],[2.79,-7.15],[2.49,-6.84],[2.15,-6.5],[1.14,-6.1],[.1,-6.03],[-1.15,-6.23],[-2.32,-6.74],[-2.65,-7.05],[-2.36,-7.03]];
      shape(L,'face/cream',face,C.cream,{sw:.1});
      v.eyes.forEach(([x,y,r],i)=>{
        const outward=x<0?-1:1;
        shape(L,'mask'+i,[[x-outward*.55,y-.44],[x-outward*.16,y-.81],[x+outward*.32,y-.72],[x+outward*.77,y-.32],[x+outward*1.02,y+.14],[x+outward*.81,y+.46],[x+outward*.99,y+.46],[x+outward*.54,y+.63],[x+outward*.1,y+.49],[x-outward*.5,y+.27]],C.mask,noInk);
        eye(L,'eye'+i,x,y,r,p);
      });
      const [nx,ny]=v.nose;
      shape(L,'muzzle',ellipse(nx-.09,ny+.48,p.view==='side'?.55:.77,.47),C.creamLight,noInk);
      shape(L,'nose',[[nx-.22,ny-.11],[nx+.12,ny-.16],[nx+.27,ny-.01],[nx+.08,ny+.19],[nx-.08,ny+.2],[nx-.27,ny+.03]],C.ink,{sw:.1});
      shape(L,'nose/shine',ellipse(nx-.09,ny-.04,.07,.035,10),C.cream,noInk);
      if(p.mood==='surprised') shape(L,'mouth',ellipse(nx-.02,ny+.69,.26,.4),C.ink,{sw:.12});
      else if(p.mood==='happy'||p.mood==='laugh') {
        shape(L,'mouth',[[nx-.4,ny+.43],[nx,ny+.56],[nx+.39,ny+.39],[nx+.19,ny+.98],[nx-.12,ny+1.03]],C.furDark,{sw:.12});
        shape(L,'mouth/tongue',[[nx-.14,ny+.76],[nx+.12,ny+.78],[nx+.19,ny+.98],[nx-.12,ny+1.03]],C.tongue,noInk);
      } else line(L,'mouth',[[nx-.42,ny+.65],[nx-.05,ny+(p.mood==='worried'?.49:.68)],[nx+.29,ny+.54]],C.ink,.15);
      line(L,'muzzle/philtrum',[[nx,ny+.16],[nx,ny+.46],[nx-.13,ny+.55]],C.ink,.11);
      line(L,'cheek/furL',[[-1.92,-6.88],[-1.58,-6.68],[-1.68,-6.87]],C.furLight,.1);
      line(L,'cheek/furR',[[1.75,-6.75],[1.95,-6.94],[1.94,-6.75]],C.furLight,.1);
    } else {
      line(L,'head/nape',[[-1.02,-6.67],[-.63,-6.41],[-.7,-6.63],[-.27,-6.37],[.29,-6.42]],C.furDark,.14);
      line(L,'head/crown',[[-.83,-8.57],[-.51,-8.75],[-.5,-8.56],[.07,-8.71]],C.furDark,.12);
      if(p.view==='qback') {
        shape(L,'cheek/sliver',[[1.5,-8.1],[2.14,-7.84],[2.65,-7.55],[2.78,-7.24],[2.43,-6.95],[1.97,-6.53],[2.16,-7.2]],C.cream,noInk);
        shape(L,'nose',ellipse(2.65,-7.28,.18,.13,12),C.ink,noInk);
      }
    }
    A.apron=[v.apron[4],v.apron[2]];
    return {layers:L,anchors:A};
  }

  const birdViews={
    front:{body:[[-1.3,-3.9],[-1.5,-3.1],[-1.48,-2.1],[-.98,-1.22],[0,-.96],[1.02,-1.22],[1.5,-2.15],[1.46,-3.18],[1.18,-3.95]],head:[[-1.25,-3.18],[-1.48,-4.02],[-1.06,-4.82],[-.24,-5.17],[.72,-5.03],[1.35,-4.36],[1.38,-3.51],[.6,-3.09],[-.4,-3.0]],eyes:[[-.65,-4.04,.33],[.65,-4.04,.33]],beak:[0,-3.64],wing:[[-1.15,-3.3],[1.15,-3.3]],rear:false},
    q:{body:[[-1.25,-3.85],[-1.65,-2.99],[-1.5,-1.91],[-.86,-1.19],[.27,-.94],[1.29,-1.41],[1.58,-2.39],[1.45,-3.45],[.78,-4.02]],head:[[-1.31,-3.39],[-1.38,-4.17],[-.85,-4.94],[.12,-5.18],[1.08,-4.91],[1.62,-4.2],[1.51,-3.39],[.64,-2.97],[-.46,-3.1]],eyes:[[-.19,-4.05,.38],[1.06,-4.06,.27]],beak:[1.3,-3.65],wing:[[-1.24,-3.31],[1.2,-3.25]],rear:false},
    side:{body:[[-1.35,-3.66],[-1.74,-2.75],[-1.48,-1.85],[-.55,-1.14],[.54,-1.05],[1.34,-1.6],[1.59,-2.53],[1.13,-3.66],[.1,-4]],head:[[-1.18,-3.43],[-1.23,-4.25],[-.55,-4.98],[.36,-5.16],[1.17,-4.82],[1.56,-4.16],[1.38,-3.47],[.6,-3.05],[-.44,-3.1]],eyes:[[.84,-4.1,.4]],beak:[1.66,-3.68],wing:[[-.85,-3.3],[.59,-3.21]],rear:false},
    qback:{body:[[-1.4,-3.87],[-1.66,-2.8],[-1.35,-1.72],[-.42,-1.06],[.71,-1.12],[1.5,-1.9],[1.54,-3.02],[.92,-3.95]],head:[[-1.38,-3.51],[-1.44,-4.21],[-.89,-4.9],[.14,-5.2],[1.12,-4.88],[1.53,-4.12],[1.42,-3.5],[.73,-3.15],[-.39,-3.04]],eyes:[],beak:[1.6,-3.75],wing:[[-1.19,-3.36],[1.12,-3.25]],rear:true},
    back:{body:[[-1.18,-3.94],[-1.54,-3.1],[-1.48,-2.07],[-.9,-1.31],[0,-1.0],[.98,-1.31],[1.49,-2.12],[1.54,-3.12],[1.13,-3.96]],head:[[-1.24,-3.42],[-1.47,-4.17],[-.91,-4.94],[0,-5.14],[.96,-4.92],[1.47,-4.15],[1.23,-3.43],[.51,-3.13],[-.52,-3.13]],eyes:[],beak:[0,-3.7],wing:[[-1.15,-3.36],[1.15,-3.36]],rear:true}
  };
  function birdLeg(L,side,phase,target) {
    const sign=side==='L'?-1:1, s=Math.sin(phase)*sign, hip=[sign*.63,-1.55];
    const foot=target||[hip[0]+s*.62,-Math.max(0,s)*.58], ankle=[foot[0]-.08,foot[1]-.22];
    line(L,'leg'+side,[hip,target?[(hip[0]+foot[0])*.5-.15,(-1.55+foot[1])*.5]:[hip[0]-.15+s*.2,-.8],ankle],C.ink,.6);
    line(L,'foot'+side,[[foot[0]-.4,foot[1]+.02],ankle,foot,[foot[0]+.44,foot[1]+.02]],C.ink,.55);
    line(L,'foot'+side+'/toe',[[foot[0]-.02,foot[1]-.11],[foot[0]+.2,foot[1]+.1]],C.ink,.4);
    return foot;
  }
  function birdWing(L,id,origin,angle,right,far) {
    const sign=right?-1:1;
    // Tapered primary feathers, never fingers or palms. Rotation pivots at the shoulder.
    const pts=[[0,0],[-.36,-.03],[-.82,.25],[-1.14,.73],[-1.65,1.58],[-1.13,1.38],[-1.28,1.82],[-.76,1.56],[-.77,1.95],[-.27,1.59],[.09,1.1],[.25,.5]];
    const tr=ps=>rotate(move(ps.map(([x,y])=>[x*sign,y]),...origin),origin,angle);
    shape(L,id,tr(pts),far?C.birdDark:C.bird,{sw:.2});
    shape(L,id+'/coverts',tr([[0,.1],[-.35,.12],[-.75,.44],[-.94,.83],[-.62,.72],[-.68,1.1],[-.27,.91],[.12,.53]]),C.birdLight,noInk);
    for(let i=0;i<3;i++) line(L,id+'/feather'+i,tr([[-.18-i*.19,.65+i*.13],[-.48-i*.25,1.14+i*.16],[-.76-i*.22,1.5+i*.08]]),C.birdDark,.11);
  }
  function jiujiao(p) {
    const v=birdViews[p.view],L=[],A={feet:[],beak:null};
    const tailX=p.view==='front'||p.view==='back'?0:-1.2;
    shape(L,'tail',[[tailX,-2.13],[tailX-1.51,-2.41],[tailX-2.05,-2.2],[tailX-1.73,-1.96],[tailX-2.2,-1.77],[tailX-1.85,-1.61],[tailX-1.3,-1.59],[tailX-.4,-1.71]],C.birdDark);
    line(L,'tail/feathers',[[tailX-1.81,-2.1],[tailX-.8,-1.95],[tailX-.25,-1.83]],C.birdLight,.13);
    A.feet=[birdLeg(L,'L',p.legPhase,p._feet?.[0]),birdLeg(L,'R',p.legPhase,p._feet?.[1])];
    birdWing(L,'wingR',v.wing[1],p.wingR,true,true);
    const [bx,by]=v.beak;
    const front=p.view==='front'||p.view==='back';
    const beakTip=front?[bx,by+.53]:[bx+.71,by-.05];
    const beak=front?[[bx-.35,by],[bx+.34,by],beakTip]:[[bx-.19,by-.27],beakTip,[bx+.01,by+.38]];
    shape(L,'body',v.body,C.bird);
    if(!v.rear) {
      const dx=p.view==='front'?0:.36;
      shape(L,'breast',[[dx-.85,-3.6],[dx+.79,-3.56],[dx+1.02,-2.87],[dx+.94,-2.05],[dx+.59,-1.45],[dx+.1,-1.18],[dx-.62,-1.44],[dx-.69,-1.67],[dx-.92,-1.64],[dx-.92,-1.91],[dx-1.12,-2.06],[dx-1.03,-2.42]],C.cream,{sw:.09});
      line(L,'breast/down',[[dx-.26,-2.08],[dx-.11,-1.92],[dx-.08,-2.14],[dx+.13,-1.96]],C.paperShade,.11);
    }
    birdWing(L,'wingL',v.wing[0],p.wingL,false,false);
    shape(L,'head',v.head,C.bird);
    if(!v.rear) {
      shape(L,'face/cream',p.view==='front'?[[-1.19,-4.1],[-.76,-4.51],[-.21,-4.3],[0,-3.96],[.25,-4.36],[.84,-4.5],[1.22,-4.04],[1.18,-3.47],[.55,-3.17],[0,-3.15],[-.7,-3.3]]:[[-.99,-3.94],[-.4,-4.37],[.35,-4.5],[1.18,-4.45],[1.48,-4.12],[1.46,-3.52],[.8,-3.1],[.08,-3.17],[-.69,-3.44]],C.cream,noInk);
      v.eyes.forEach(([x,y,r],i)=>eye(L,'eye'+i,x,y,r,p));
      shape(L,'beak',beak,C.beak,{sw:.14});
      if(p.mood==='surprised'||p.mood==='happy') {
        shape(L,'mouth',front?[[bx-.17,by+.12],[bx+.17,by+.12],[bx,by+.4]]:[[bx+.02,by+.02],[bx+.52,by+.02],[bx+.04,by+.24]],C.birdDark,noInk);
      } else line(L,'mouth',front?[[bx-.18,by+.12],[bx+.18,by+.12]]:[[bx,by+.05],[bx+.49,by]],C.ink,.1);
      line(L,'cheek/down',[[-.82,-3.49],[-.58,-3.35],[-.59,-3.52]],C.birdLight,.11);
    } else {
      line(L,'head/nape',[[-.61,-3.64],[-.3,-3.43],[-.3,-3.62],[.08,-3.45],[.48,-3.56]],C.birdDark,.12);
      line(L,'back/feathers',[[-.49,-2.6],[-.2,-2.35],[-.12,-2.64],[.21,-2.37]],C.birdLight,.14);
    }
    A.beak=beakTip;
    // Folded paper, not a rounded toque: broad uneven crown and overlapping angular band.
    // hatDrop is in drawing units, positive slides down over the eyes. Motion owns any lag.
    const hatDx=p.view==='side'?.18:p.view==='qback'?-.12:0;
    const hat=ps=>move(ps,hatDx,p.hatDrop);
    const crown=p.view==='front'||p.view==='back'?[[-1.49,-4.75],[-1.9,-5.86],[-1.67,-6.77],[-.79,-6.88],[-.37,-6.68],[.35,-7.04],[1.5,-6.72],[1.77,-5.62],[1.39,-4.74]]:[[-1.35,-4.8],[-2.05,-5.79],[-1.79,-6.66],[-.98,-6.9],[-.49,-6.73],[.37,-7.11],[1.38,-6.78],[1.65,-5.59],[1.39,-4.81]];
    shape(L,'hat/crown',hat(crown),C.white,{sw:.2});
    shape(L,'hat/fold-shadow',hat([crown[1],crown[2],[-.81,-5.65],[-.56,-5.04],crown[0]]),C.paperShade,{ink:null,fillOp:32});
    shape(L,'hat/fold-light',hat([[-.98,-6.78],[-.43,-6.15],[.37,-7.02],[1.28,-6.71],[.82,-5.51]]),C.creamLight,{ink:null,fillOp:32});
    line(L,'hat/fold1',hat([crown[2],[-.78,-5.85],[.83,-5.2]]),C.paperShade,.17);
    line(L,'hat/fold2',hat([[.37,-6.99],[.57,-6.12],[1.44,-5.61]]),C.paperShade,.14);
    line(L,'hat/crease',hat([[-.97,-6.74],[-.65,-6.17],[-.72,-5.91]]),C.birdLight,.07);
    shape(L,'hat/band',hat([[-1.51,-5.18],[-.59,-5.55],[.47,-5.55],[1.54,-5.09],[1.35,-4.48],[.42,-4.87],[-.54,-4.88],[-1.33,-4.5]]),C.white,{sw:.19});
    line(L,'hat/band-seam',hat([[-1.34,-5.07],[-.54,-5.36],[.45,-5.36],[1.35,-4.98]]),C.paperShade,.1);
    return {layers:L,anchors:A};
  }

  Bread.characterGeometry = (species,pose={}) => {
    if(!['tuantuan','jiujiao'].includes(species)) throw new RangeError(`Unknown Bread species: ${species}`);
    const p={...Bread.poseDefaults,...pose};
    if(!Bread.views.includes(p.view)) throw new RangeError(`Unknown Bread view: ${p.view}`);
    for(const key of Object.keys(Bread.poseDefaults)) if(typeof Bread.poseDefaults[key]==='number'&&!Number.isFinite(p[key])) throw new TypeError(`Non-finite pose.${key}`);
    if(p.u<=0||Math.abs(p.squash)>=1) throw new RangeError('u must be positive and squash must be between -1 and 1');
    const c=Math.cos(p.bodyRot),s=Math.sin(p.bodyRot),ax=species==='tuantuan'?1.14:1,ay=species==='tuantuan'?.9:1;
    // Optional explicit WORLD foot contacts. Inverse affine mapping only: no IK solver.
    // The same target becomes an actual foot vertex, with hip/knee art connecting to it.
    if(p.footTargets!==undefined) {
      if(!Array.isArray(p.footTargets)||p.footTargets.length!==2||p.footTargets.some(a=>!Array.isArray(a)||a.length!==2||a.some(v=>!Number.isFinite(v)))) throw new TypeError('footTargets must be two finite world points');
      p._feet=p.footTargets.map(([x,y])=>{const dx=x-p.x,dy=y-p.y;return [(dx*c+dy*s)/(p.u*(p.flip?-1:1)*(1+p.squash)*ax),(-dx*s+dy*c)/(p.u*(1-p.squash)*ay)];});
    }
    const g=species==='tuantuan'?tuantuan(p):jiujiao(p);
    const world=([x,y])=>{
      const xx=x*ax*p.u*(p.flip?-1:1)*(1+p.squash), yy=y*ay*p.u*(1-p.squash);
      return [p.x+xx*c-yy*s,p.y+xx*s+yy*c];
    };
    g.layers=g.layers.map(l=>({...l,points:l.points.map(world)}));
    for(const key of Object.keys(g.anchors)) g.anchors[key]=key==='beak'?world(g.anchors[key]):g.anchors[key].map(world);
    return g;
  };
  function draw(species,pose) {
    const g=Bread.characterGeometry(species,pose);
    for(const l of g.layers) {
      boilSeed(`bread/${species}/${l.id}`);
      if(l.kind==='line') inkLine(l.points,l.style.sw,l.style.ink,'ink',.18);
      else {
        // Drain deferred brush masks BEFORE native p5 underpaint, preserving the
        // actual layer stack. The original engine's flush helper is unchanged.
        flushBrush();push();noStroke();fill(l.base);beginShape();
        for(const [x,y] of l.points) vertex(x,y);
        endShape(CLOSE);pop();
        paint(l.points,l.style);
      }
    }
    return g;
  }
  Bread.drawTuantuan=pose=>draw('tuantuan',pose);
  Bread.drawJiuJiao=pose=>draw('jiujiao',pose);
  // One second per angle. Two mirrored pairs remain large enough for 1080p face inspection.
  // At half seconds the same view shows a surprised expression and an articulated reach/flap.
  LOOPS.breadViews=t=>{
    const index=((Math.floor(t)%5)+5)%5, view=Bread.views[index], action=t-Math.floor(t)>=.5;
    for(const flip of [false,true]) {
      const x=flip?1320:430;
      const common={view,flip,mood:action?'surprised':'happy',lookX:action?.7:0};
      Bread.drawTuantuan({...common,x,y:800,u:55,armL:action?-.95:0,armR:action?.7:0,tailAngle:action?-.12:0});
      Bread.drawJiuJiao({...common,x:x+(flip?-240:240),y:850,u:44,wingL:action?1.3:0,wingR:action?-1.2:0,hatDrop:action?.24:0});
    }
  };
  LOOPS.breadViews.len=5;
})();
