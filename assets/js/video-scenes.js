/* Thin adapter over the existing seven physical layers / ten logical acts. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else{root.FulwinVideoSceneTools=api;if(root.document)root.FulwinVideoScenes=api.mount(root);}})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=v=>Math.max(0,Math.min(1,v)),smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 function mapProgress(stops,p){p=clamp(p);if(!stops)return p;const i=Math.max(1,stops.findIndex(s=>p<=s[0]));const a=stops[i-1],b=stops[i];return a[1]+(b[1]-a[1])*clamp((p-a[0])/(b[0]-a[0]));}
 function actAt(layer,p,assets){return assets.acts.find(a=>a.layer===layer&&p>=a.start&&(p<a.end||a.end===1))||assets.acts[0];}
 function plan(states,reading,assets){
  const state=i=>states[i]||{p:0,v:0},opening=state(0),out={};
  for(const key of ['wind','clouds','thunderstorm','hurricaneReveal','nimbusReveal','thunderReveal'])if(assets[key])out[key]={p:0,active:false,warm:false,static:!!reading,opacity:0};
  if(reading){for(const item of Object.values(out))item.p=1;if(out.clouds)out.clouds.opacity=1;return out;}
  const t=opening.p,times=assets.opening||{wind:[0,.29],clouds:[.24,.59],storm:[.59,.92],cloudBlend:[.24,.34],stormBlend:[.59,.64],windFuse:[.06,.14]};
  const at=span=>clamp((t-span[0])/(span[1]-span[0])),cloudMix=smooth(...times.cloudBlend,t),stormMix=smooth(...times.stormBlend,t);
  if(out.wind)Object.assign(out.wind,{p:at(times.wind),active:opening.v>.001&&t>.025&&t<times.cloudBlend[1],warm:opening.v>.001&&t<=.025,opacity:(1-cloudMix)*smooth(...times.windFuse,t)*(1-stormMix)});
  if(out.clouds)Object.assign(out.clouds,{p:at(times.clouds),active:opening.v>.001&&t>=times.clouds[0]&&t<times.stormBlend[1],warm:opening.v>.001&&t>=times.clouds[0]-.08&&t<times.clouds[0],opacity:cloudMix*(1-stormMix)});
  if(out.thunderstorm)Object.assign(out.thunderstorm,{p:at(times.storm),active:opening.v>.001&&t>=times.storm[0],warm:opening.v>.001&&t>=times.storm[0]-.07&&t<times.storm[0],opacity:stormMix});
  if(out.hurricaneReveal){const s=state(3);Object.assign(out.hurricaneReveal,{p:mapProgress(assets.hurricaneReveal.scrollMap,s.p),active:s.v>.001,warm:state(2).v>.001&&state(2).p>.7,opacity:s.v});}
  if(out.nimbusReveal){const s=state(4);Object.assign(out.nimbusReveal,{p:mapProgress(assets.nimbusReveal.scrollMap,s.p),active:s.v>.001,warm:state(3).v>.001&&state(3).p>.7,opacity:s.v});}
  if(out.thunderReveal){const s=state(5);Object.assign(out.thunderReveal,{p:mapProgress(assets.thunderReveal.scrollMap,s.p),active:s.v>.001,warm:state(4).v>.001&&state(4).p>.7,opacity:s.v});}
  return out;
 }
 function mount(win){
  const assets=win.FulwinCinematicAssets,doc=win.document,entries=new Map();if(!assets||!win.FulwinScrollVideo)return null;
  const mobile=()=>win.innerWidth<900||(win.navigator?.deviceMemory||8)<=4;
  function add(key,host,car=false){
   const asset=assets[key];if(!asset||!host)return;
   const wrap=doc.createElement('div');wrap.className='scroll-video '+(car?'car-film':key==='wind'?'wind-film':key==='thunderstorm'?'storm-film':'cloud-film');wrap.dataset.asset=key;wrap.dataset.status='idle';
   const viewport=doc.createElement('div');viewport.className='media-viewport';
   const still=doc.createElement('img');still.className='media-still';still.src=asset.poster;still.alt='';still.decoding='async';still.width=asset.width;still.height=asset.height;still.style.objectFit=asset.fit;
   const video=doc.createElement('video');video.className='media-video';video.setAttribute('aria-hidden','true');video.setAttribute('tabindex','-1');video.poster=asset.poster;video.width=asset.width;video.height=asset.height;video.style.objectFit=asset.fit;
   if(car){const surface=doc.createElement('div');surface.className='media-surface';surface.append(still,video);viewport.append(surface);}else viewport.append(still,video);
   let atmosphere=null;
   if(key==='nimbusReveal'||key==='thunderReveal'){atmosphere=doc.createElement('img');atmosphere.className='media-atmosphere';atmosphere.src=asset.poster;atmosphere.alt='';atmosphere.decoding='async';viewport.prepend(atmosphere);}
   wrap.append(viewport);
   const shade=doc.createElement('div');shade.className='media-shade';wrap.append(shade);
   let side=null,beat=null;
   if(asset.sideReference){side=doc.createElement('figure');side.className='video-side';const im=doc.createElement('img');im.src=asset.sideReference;im.alt='飓风概念设计侧面参考';im.width=1120;im.height=290;side.append(im);wrap.append(side);}
   if(car){beat=doc.createElement('p');beat.className='video-beat';beat.setAttribute('aria-hidden','true');wrap.append(beat);host.closest('.layer').classList.add('has-video');}
   host.prepend(wrap);
   const controller=win.FulwinScrollVideo.create(video,{source:()=>asset.sources[mobile()?'mobile':'desktop'],fps:asset.fps,flashWindow:asset.flashWindow,onStatus:s=>{wrap.dataset.status=s;},onFrame:()=>{}},win);
   entries.set(key,{asset,wrap,still,atmosphere,controller,side,beat,lastStill:''});
  }
  const field=doc.querySelector('.prologue-native-field');
  add('thunderstorm',field?.dataset.videoStorm==='true'?field:null);add('clouds',field?.dataset.videoCloud==='true'?field:null);add('wind',field?.dataset.videoWind==='true'?field:null);
  add('hurricaneReveal',doc.querySelector('#s3[data-video-section=hurricaneReveal] .sticky'),true);add('nimbusReveal',doc.querySelector('#s4[data-video-section=nimbusReveal] .sticky'),true);add('thunderReveal',doc.querySelector('#s5[data-video-section=thunderReveal] .sticky'),true);
  if(entries.has('clouds'))doc.documentElement.dataset.videoWeather='true';
  function update(states,reading=false){
   const desired=plan(states,reading,assets);
   for(const [key,e] of entries){
    const mode=desired[key],at=mode.static?1:mode.p;
    const still=e.asset.stills.reduce((a,b)=>Math.abs(b.p-at)<Math.abs(a.p-at)?b:a);
    if((mode.active||mode.static||mode.warm)&&e.lastStill!==still.src){e.still.src=still.src;if(e.atmosphere)e.atmosphere.src=still.src;e.lastStill=still.src;}
    if(key==='wind'||key==='clouds'||key==='thunderstorm')e.wrap.style.opacity=mode.opacity.toFixed(4);
    if(e.asset.fadeToBlack)e.wrap.style.setProperty('--end-light',(1-smooth(...e.asset.fadeToBlack,mode.p)).toFixed(4));
    e.controller.set(at,mode);
    if(e.side){const side=reading?0:smooth(.8,.94,states[3]?.p||0);e.wrap.style.setProperty('--side-mix',side.toFixed(4));}
    if(e.beat){const p=states[key==='hurricaneReveal'?3:key==='nimbusReveal'?4:5]?.p||0;const beat=e.asset.beats.find(b=>p<=b.end)||e.asset.beats.at(-1);if(e.beat.textContent!==beat.label)e.beat.textContent=beat.label;}
   }
  }
  return {update,hasWind:entries.has('wind'),hasCloud:entries.has('clouds'),hasStorm:entries.has('thunderstorm'),hasCar:kind=>entries.has(kind+'Reveal'),retry(){for(const e of entries.values())e.controller.retry();},get stats(){return Object.fromEntries([...entries].map(([k,e])=>[k,e.controller.stats]));}};
 }
 return {mapProgress,actAt,plan,mount};
});
