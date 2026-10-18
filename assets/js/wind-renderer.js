/* FULWIN ACT 01. Seeded curl-field curves, analytic particles and thin mist.
   Native vector geometry at the target resolution; no images, clock or accumulated simulation. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FulwinWind=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
  const lerp=(a,b,t)=>a+(b-a)*t;
  function state(value){
    const p=clamp(Number.isFinite(value)?value:0);
    return {progress:p,phase:p<.15?0:p<.4?1:p<.7?2:3,
      build:smooth(.15,.4,p),spread:smooth(.4,.78,p),
      lineOpacity:smooth(.015,.13,p)*(1-smooth(.64,.92,p)),
      mist:smooth(.42,1,p),particles:smooth(.4,.6,p)*(1-.5*smooth(.78,1,p))};
  }
  function create(canvas,options={}){
    const ctx=canvas.getContext('2d',{alpha:false});
    if(!ctx)throw new Error('Canvas 2D is unavailable');
    let seed=(options.seed??20261018)>>>0;
    const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    const low=options.quality==='low';
    const modes=Array.from({length:7},(_,i)=>{
      const angle=random()*Math.PI*2,k=1.2+i*.79;
      return {kx:Math.cos(angle)*k,ky:Math.sin(angle)*k,a:.22/(1+i*.9),phase:random()*Math.PI*2};
    });
    // Curl of a multi-frequency scalar potential: coherent, divergence-free eddies.
    function velocity(x,y,z){
      let vx=1.15,vy=0;
      for(const m of modes){
        const ax=m.kx*x+m.phase+z*.7,ay=m.ky*y-m.phase+z*.3;
        vx+=m.a*m.ky*Math.sin(ax)*Math.cos(ay);
        vy-=m.a*m.kx*Math.cos(ax)*Math.sin(ay);
      }
      vy+=-.10*Math.exp(-(((x+.9)/.85)**2))+.13*Math.exp(-(((x-.65)/.8)**2))-.09*y;
      return [Math.max(.55,vx),vy];
    }
    const strands=Array.from({length:low?30:46},(_,i)=>{
      const group=i===0?0:i%3;
      const depth=i===0?.82:.12+random()*.88;
      const origin=i===0?.04:[.02,-.48,.48][group]+(random()-.5)*.27;
      const phase=random()*Math.PI*2;
      const points=[];let y=origin;
      for(let j=0;j<=240;j++){
        const x=-3.4+j*.029;
        points.push([x,y]);
        const a=velocity(x,y,depth*2.8+group*1.7),midY=y+.0145*a[1]/a[0];
        const b=velocity(x+.0145,midY,depth*2.8+group*1.7);
        y+=.029*b[1]/b[0];
      }
      return {points,depth,origin,phase,group,birth:i===0?0:.155+random()*.20,
        brightness:i===0?1:.24+random()*.76,thickness:i===0?1.1:.6+random()*1.1,offset:random()*.5};
    });
    const particles=Array.from({length:low?100:260},()=>({
      path:Math.floor(random()*strands.length),u:random(),v:random()-.5,
      depth:random(),size:.25+random()*.7,phase:random()*Math.PI*2}));
    let last=-1,lastW=0,lastH=0;
    function point(q,u,p,spread){
      const f=clamp(u)*240,k=Math.min(239,Math.floor(f)),t=f-k;
      const a=q.points[k],b=q.points[k+1];
      const x=lerp(a[0],b[0],t)+p*.12;
      const y=lerp(a[1],b[1],t)*(1+spread*.9)
        +Math.sin(x*1.3+q.phase+p*2)*spread*.11;
      return [x,y];
    }
    function render(value){
      if(!Number.isFinite(value))return false;
      const p=clamp(value),w=canvas.width,h=canvas.height;
      if(p===last&&w===lastW&&h===lastH)return false;
      last=p;lastW=w;lastH=h;
      const s=state(p),portrait=w/h<.95,unit=Math.min(w,h)/1080;
      ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.globalCompositeOperation='source-over';ctx.filter='none';
      ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);
      if(p===0)return true;
      function project(x,y,depth){
        const d=.68+depth*.40;
        return portrait
          ? [w*(.5+(x*.22+y*.085)*d),h*(.51+(-x*.145+y*.24)*d)]
          : [w*(.5+x*.235*d),h*(.51+y*.34*d-x*.026)];
      }
      ctx.lineCap='round';ctx.lineJoin='round';
      const mistPaths=[];
      for(let i=strands.length-1;i>=0;i--){
        const q=strands[i];
        const born=smooth(q.birth,q.birth+(i===0?.12:.085),p);
        if(born===0)continue;
        const length=i===0?lerp(.14,.48,smooth(0,.4,p)):.22+q.depth*.32;
        const head=lerp(i===0?.51:.41,.94,smooth(0,1,p))+(i===0?0:(q.offset-.25)*.58+q.group*.035);
        const tail=head-length;
        const pts=[];
        for(let j=0;j<=90;j++){
          const u=tail+j/90*length;
          if(u<0||u>1)continue;
          const [x,y]=point(q,u,p,s.spread);
          pts.push(project(x,y,q.depth));
        }
        if(pts.length<2)continue;
        const first=pts[0],end=pts[pts.length-1];
        const a=born*s.lineOpacity*q.brightness*(.24+.54*q.depth);
        const grad=ctx.createLinearGradient(first[0],first[1],end[0],end[1]);
        grad.addColorStop(0,'rgba(210,220,229,0)');
        grad.addColorStop(.24,`rgba(177,193,207,${a*.34})`);
        grad.addColorStop(.67,`rgba(222,231,239,${a})`);
        grad.addColorStop(.90,`rgba(238,244,247,${a*.83})`);
        grad.addColorStop(1,'rgba(220,234,244,0)');
        ctx.beginPath();pts.forEach((v,j)=>j?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));
        if(s.mist>0&&i%2===0)mistPaths.push(pts);
        const thickness=unit*q.thickness*(.5+q.depth*.72);
        ctx.strokeStyle=grad;ctx.lineWidth=thickness*5;ctx.globalAlpha=.045;ctx.stroke();
        ctx.lineWidth=thickness;ctx.globalAlpha=1;ctx.stroke();
      }
      if(mistPaths.length){
        // Widen the original vector paths at full target resolution. One neutral
        // soft pass avoids low-alpha RGB quantization from repeated colored strokes.
        // This is procedural 2D thin mist, not the volumetric ACT 02 cloud.
        ctx.beginPath();
        for(const pts of mistPaths)pts.forEach((v,j)=>j?ctx.lineTo(v[0],v[1]):ctx.moveTo(v[0],v[1]));
        const fog=ctx.createLinearGradient(0,0,w,0);
        fog.addColorStop(0,'rgba(205,205,205,0)');
        fog.addColorStop(.25,'rgba(205,205,205,1)');
        fog.addColorStop(.72,'rgba(205,205,205,1)');
        fog.addColorStop(1,'rgba(205,205,205,0)');
        ctx.strokeStyle=fog;ctx.globalAlpha=.17*s.mist;
        ctx.lineWidth=unit*(5+s.mist*36);
        ctx.filter=`blur(${unit*(3+s.mist*12)}px)`;ctx.stroke();ctx.filter='none';ctx.globalAlpha=1;
      }
      if(s.particles>0){
        for(const v of particles){
          const q=strands[v.path],u=(v.u+p*.22)%1;
          const [x,y]=point(q,u,p,s.spread);
          const [px,py]=project(x,y+v.v*s.spread*1.3,q.depth);
          const edge=Math.sin(u*Math.PI)**2;
          ctx.fillStyle=`rgba(216,228,238,${s.particles*edge*(.06+v.depth*.22)})`;
          ctx.beginPath();ctx.arc(px,py,Math.max(.35,unit*v.size),0,Math.PI*2);ctx.fill();
        }
      }
      // Clear screen edges leave the arrival and disappearance outside the frame.
      const edge=ctx.createLinearGradient(0,0,w,0);
      edge.addColorStop(0,'rgba(0,0,0,.95)');edge.addColorStop(.16,'rgba(0,0,0,0)');
      edge.addColorStop(.85,'rgba(0,0,0,0)');edge.addColorStop(1,'rgba(0,0,0,.95)');
      ctx.fillStyle=edge;ctx.fillRect(0,0,w,h);
      return true;
    }
    function resize(width,height){
      if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return false;
      const w=Math.round(width),h=Math.round(height);
      if(canvas.width===w&&canvas.height===h)return false;
      canvas.width=w;canvas.height=h;last=-1;return true;
    }
    return {render,resize,state,seed:options.seed??20261018};
  }
  return {create,state,version:'ACT01-r1',seed:20261018};
});
