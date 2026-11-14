/* Shared double-buffer image sequence. One decode in flight; latest intent wins. */
(() => {
  'use strict';
  function create(front,{count,url,preload=false,deadzone=.25,onFrame=()=>{}}){
    const back=front.cloneNode(false);back.removeAttribute('id');back.style.opacity='0';front.after(back);
    const buffers=[{el:front,visible:true},{el:back,visible:false}];
    let current=0,desired=0,loading=false,revision=0,currentRevision=0,ready=1,next=1;
    const pump=()=>{
      if(next>=count)return;
      const im=new Image();im.decoding='async';
      im.onload=()=>{ready++;setTimeout(pump,0);};im.onerror=()=>setTimeout(pump,0);im.src=url(next++);
    };
    if(preload)(window.requestIdleCallback||(f=>setTimeout(f,120)))(pump);
    function decode(el,src){
      if(typeof el.decode==='function'){el.src=src;return el.decode();}
      return new Promise((resolve,reject)=>{
        const clear=()=>{el.removeEventListener('load',loaded);el.removeEventListener('error',failed);};
        const loaded=()=>{clear();resolve();},failed=()=>{clear();reject(new Error('Sequence image unavailable'));};
        el.addEventListener('load',loaded);el.addEventListener('error',failed);el.src=src;
      });
    }
    async function show(){
      if(loading)return;loading=true;
      try{
        while(desired!==current||revision!==currentRevision){
          const i=desired,rev=revision,hidden=buffers.find(b=>!b.visible);
          try{await decode(hidden.el,url(i));}
          catch(error){if(desired!==i||revision!==rev)continue;break;}
          if(desired!==i||revision!==rev)continue;
          const visible=buffers.find(b=>b.visible);
          hidden.el.style.opacity='1';visible.el.style.opacity='0';hidden.visible=true;visible.visible=false;
          current=i;currentRevision=rev;onFrame(i);
        }
      }finally{loading=false;}
    }
    return {set(p){
      if(!Number.isFinite(p))return;
      const f=Math.max(0,Math.min(count-1,p*(count-1)));
      desired=f===0||f===count-1?f:Math.abs(f-current)<deadzone?current:Math.round(f);show();
    },invalidate(){revision++;show();},get sourceReady(){return revision===currentRevision;},get frame(){return current;},get total(){return count;},get ready(){return ready;}};
  }
  window.FulwinFrames={create};
})();
