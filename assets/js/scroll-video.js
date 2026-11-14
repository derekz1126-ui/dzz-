/* Paused video, one seek in flight. Scroll supplies the clock; no playback loop. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FulwinScrollVideo=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=v=>Math.max(0,Math.min(1,v));
 function create(video,{source,fps=24,flashWindow=null,onFrame=()=>{},onStatus=()=>{}},win=globalThis){
  let p=0,active=false,warm=false,staticMode=false,loaded=false,failed=false,busy=false,ready=false,raf=0,seekTimer=0,loadTimer=0,releaseTimer=0,status='',src='',seeks=0,decoded=0;
  const doc=win.document,step=1/Math.max(1,fps),notify=s=>{if(status!==s){status=s;onStatus(s);}};
  video.muted=true;video.defaultMuted=true;video.playsInline=true;video.preload='none';video.setAttribute('playsinline','');video.pause();
  const clear=k=>{if(k)win.clearTimeout(k);};
  const end=()=>Math.max(0,video.duration-step);
  const target=()=>Math.min(end(),Math.round(p*end()/step)*step);
  const safe=()=>{if(!flashWindow||!Number.isFinite(video.duration)||end()<=0)return true;const flash=v=>v>=flashWindow[0]&&v<=flashWindow[1];return flash(video.currentTime/end())===flash(p);};
  function cancel(){if(raf)win.cancelAnimationFrame(raf);raf=0;}
  function wake(){if(!raf&&active&&!staticMode&&!failed&&!doc.hidden)raf=win.requestAnimationFrame(render);}
  function error(){if(!loaded)return;failed=true;busy=false;ready=false;clear(seekTimer);clear(loadTimer);cancel();notify('error');}
  function watch(){clear(seekTimer);seekTimer=win.setTimeout(error,1600);}
  function present(){if(!loaded||!active||staticMode||doc.hidden||failed||video.readyState<2)return;if(!safe()){ready=false;notify('seeking');return;}ready=true;decoded++;notify('ready');onFrame(video.currentTime,target());}
  function render(){
   raf=0;if(!active||staticMode||doc.hidden||failed||!loaded||!Number.isFinite(video.duration)||video.duration<=0||busy||video.seeking)return;
   const time=target();
   if(Math.abs(video.currentTime-time)<step*.45){present();return;}
   if(Math.abs(video.currentTime-time)>.75){ready=false;notify('seeking');}
   busy=true;watch();
   try{video.currentTime=time;seeks++;}catch(e){error();}
  }
  function release(){
   clear(releaseTimer);releaseTimer=0;clear(seekTimer);clear(loadTimer);cancel();busy=false;ready=false;
   if(loaded){loaded=false;video.pause();video.removeAttribute('src');video.load();}
   src='';notify('idle');
  }
  function ensure(){
   const next=typeof source==='function'?source():source;
   if(loaded&&src!==next){release();failed=false;}
   if(loaded||failed||!next||doc.hidden)return;
   loaded=true;src=next;video.preload=active?'auto':'metadata';video.src=src;notify('loading');video.load();clear(loadTimer);loadTimer=win.setTimeout(error,4500);
  }
  video.addEventListener('loadedmetadata',()=>{clear(loadTimer);loadTimer=0;if(!Number.isFinite(video.duration)||video.duration<=0){error();return;}if(loaded)wake();});
  video.addEventListener('loadeddata',()=>{if(loaded)wake();});
  video.addEventListener('seeked',()=>{clear(seekTimer);seekTimer=0;busy=false;if(!loaded||failed)return;present();if(active&&Math.abs(video.currentTime-target())>=step*.45)wake();});
  video.addEventListener('error',error);
  doc.addEventListener('visibilitychange',()=>{
   if(doc.hidden){video.pause();cancel();clear(seekTimer);clear(loadTimer);}
   else if(active||warm){ensure();if(loaded&&!Number.isFinite(video.duration)){clear(loadTimer);loadTimer=win.setTimeout(error,4500);}if(busy)watch();else wake();}
  });
  const api={set(value,options={active:true}){
   if(!Number.isFinite(value))return;p=clamp(value);active=!!options.active;warm=!!options.warm;staticMode=!!options.static;
   if(ready&&!safe()){ready=false;notify('seeking');}
   if(staticMode){release();return;}
   if(active||warm){clear(releaseTimer);releaseTimer=0;ensure();if(active)wake();else{cancel();video.pause();}}
   else{cancel();video.pause();if(loaded&&!releaseTimer)releaseTimer=win.setTimeout(release,2200);}
  },retry(){failed=false;release();api.set(p,{active,warm,static:staticMode});},release,
  get loaded(){return loaded;},get ready(){return ready;},get progress(){return Number.isFinite(video.duration)&&video.duration>step?clamp(video.currentTime/end()):0;},
  get stats(){return {seeks,decoded,pending:busy,targetProgress:p,loaded,status};}};
  return api;
 }
 return {create};
});
