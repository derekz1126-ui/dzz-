/* Same progress -> same lighting/mask. No clock, WebGL or independent animation. */
(() => {
  'use strict';
  const clamp=p=>Math.max(0,Math.min(1,p));
  const smooth=(a,b,p)=>{const x=clamp((p-a)/(b-a));return x*x*(3-2*x);};
  function state(kind,p){
    if(!['hurricane','nimbus','thunder'].includes(kind)||!Number.isFinite(p))return null;
    p=clamp(p);
    const body=kind==='nimbus'?smooth(.16,.56,p):kind==='thunder'?smooth(.19,.45,p):smooth(.10,.40,p);
    const side=kind==='nimbus'?smooth(.64,.88,p):kind==='thunder'?smooth(.54,.79,p):smooth(.56,.84,p);
    const beam=smooth(.20,.53,p),sideBeam=smooth(.70,.96,p);
    const lamp=kind==='nimbus'?smooth(.18,.37,p):.24+.76*smooth(.01,.11,p);
    const left=kind==='thunder'?smooth(.10,.22,p):lamp;
    const right=kind==='thunder'?smooth(.17,.29,p):lamp;
    const flash=kind==='thunder'?Math.max(0,1-Math.abs(p-.12)/.045)*.16:0;
    return {body,side,left,right,baseOpacity:Math.max(body,flash*2.2),exposure:Math.max(.022+.978*body*body,flash*2.5),edge:68*body,wipe:116-132*side,
      frontOpacity:1-smooth(.96,1,side),sideOpacity:smooth(0,.04,side),
      beam:-90+280*beam,beamOpacity:Math.sin(Math.PI*beam)*.5*body,
      sideBeam:-90+280*sideBeam,sideBeamOpacity:Math.sin(Math.PI*sideBeam)*.45*side,
      fog:kind==='nimbus'?1-smooth(.06,.62,p):0,fogTravel:smooth(.06,.62,p)*28,
      flash,
      intro:1-smooth(kind==='nimbus'?.30:.25,kind==='nimbus'?.44:.38,p)};
  }
  const stages=new Map([...document.querySelectorAll('[data-cinema]')].map(el=>[el.dataset.cinema,el]));
  const cache=new WeakMap();
  function set(kind,p){
    const el=stages.get(kind),s=state(kind,p);if(!el||!s)return;
    const values={
      '--body':s.body.toFixed(3),'--base-opacity':s.baseOpacity.toFixed(3),'--exposure':s.exposure.toFixed(3),'--edge':`${s.edge.toFixed(2)}%`,'--wipe':`${s.wipe.toFixed(2)}%`,
      '--front-opacity':s.frontOpacity.toFixed(3),'--side-opacity':s.sideOpacity.toFixed(3),'--side-progress':s.side.toFixed(3),
      '--lamp-left':s.left.toFixed(3),'--lamp-right':s.right.toFixed(3),
      '--beam':`${s.beam.toFixed(2)}%`,'--beam-opacity':s.beamOpacity.toFixed(3),
      '--side-beam':`${s.sideBeam.toFixed(2)}%`,'--side-beam-opacity':s.sideBeamOpacity.toFixed(3),
      '--fog':s.fog.toFixed(3),'--fog-travel':`${s.fogTravel.toFixed(2)}vw`,'--flash':s.flash.toFixed(3),'--intro':s.intro.toFixed(3),
    };
    const old=cache.get(el)||{};
    for(const [key,value] of Object.entries(values))if(old[key]!==value){el.style.setProperty(key,value);old[key]=value;}
    cache.set(el,old);
  }
  window.FulwinCinema={state,set};
})();
