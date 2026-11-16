/* One progress input: wind -> native cloud -> native storm -> brand.
   No separate scroll listener or animation clock. */
(() => {
 'use strict';
 const stage=document.getElementById('prologue-native'),canvas=document.getElementById('native-wind');if(!stage||!canvas)return;
 const clamp=v=>Math.max(0,Math.min(1,v)),smooth=(a,b,v)=>{const t=clamp((v-a)/(b-a));return t*t*(3-2*t);};
 const low=(window.navigator.hardwareConcurrency||4)<=4||(window.navigator.deviceMemory||8)<=4;
 const opening=window.FulwinCinematicAssets?.opening||{wind:[0,.29],clouds:[.24,.59],storm:[.59,.92],cloudBlend:[.24,.34],stormBlend:[.59,.64]};
 let scene,p=0,reading=false,dirty=true,cloudShown=false,stormShown=false;
 const cache={};
 try{scene=window.FulwinWind.create(canvas,{seed:20261018,quality:low?'low':'high'});stage.dataset.canvas='ready';}catch(error){stage.dataset.canvas='fallback';}
 const write=(key,value)=>{const s=Number(value).toFixed(5);if(cache[key]!==s){stage.style.setProperty(key,s);cache[key]=s;}};
 const spanP=span=>clamp((p-span[0])/(span[1]-span[0]));
 const cloudP=()=>reading?.85:spanP(opening.clouds),stormP=()=>spanP(opening.storm);
 const shotText={cloud:[['风，渐无界。','第二幕 · 云生'],['轻雾穿行。','近与远，渐渐分开。'],['云层铺展。','柔和，自有分量。'],['云海初成。','万物，被温柔托住。']],storm:[['云层积势。','第三幕 · 雷动'],['暗流，涌动。','力量，在深处汇聚。'],['电光，潜伏。','锋芒，未露。'],['蓄而后发。','让光显出力量。'],['雷后，无声。','力量，有分寸。']]};
 function caption(act,at){
  const videoAsset=act==='storm'&&window.FulwinVideoScenes?.hasStorm?window.FulwinCinematicAssets?.thunderstorm:null;
  const shots=videoAsset?.beats||window.FulwinWeatherFilm?.shots[act],el=document.getElementById(act+'-copy');if(!shots||!el?.querySelector)return;
  const i=Math.max(0,shots.findIndex(s=>at<=s.end)),start=i?shots[i-1].end:0,u=clamp((at-start)/(shots[i].end-start));
  const box=el.querySelector('.weather-caption');if(!box)return;
  if(box.dataset.beat!==String(i)){box.dataset.beat=String(i);box.querySelector('p').textContent=videoAsset?shots[i].label:shotText[act][i][0];box.querySelector('span').textContent=videoAsset?'第三幕 · 雷动':shotText[act][i][1];}
  let alpha=(i? smooth(0,.14,u):1)*(i===shots.length-1?1:1-smooth(.84,1,u));
  if(videoAsset)alpha*=1-smooth(.47,.52,at)+smooth(.88,.94,at);
  else if(act==='storm')alpha*=1-smooth(.71,.755,at)+smooth(.812,.87,at);
  box.style.setProperty('--beat-copy',alpha.toFixed(4));
 }
 function paint(){
  const windP=reading?.75:spanP(opening.wind);
  if(scene){
   if(dirty){const w=Math.max(1,canvas.clientWidth||window.innerWidth),h=Math.max(1,canvas.clientHeight||window.innerHeight);const ratio=Math.min(window.devicePixelRatio||1,2,Math.sqrt((low||window.FulwinVideoScenes?.hasWind?2073600:8294400)/(w*h)));scene.resize(Math.max(1,Math.floor(w*ratio)),Math.max(1,Math.floor(h*ratio)));dirty=false;}
   scene.render(window.FulwinVideoScenes?.hasWind?Math.min(windP,.55):windP);
  }
  const cloud=window.FulwinCloudSeq,storm=window.FulwinStormSeq;
  const videoCloud=!!window.FulwinVideoScenes?.hasCloud,videoStorm=!!window.FulwinVideoScenes?.hasStorm;
  caption('cloud',videoCloud?cloudP():(cloud?.progress??cloudP()));caption('storm',videoStorm?stormP():(storm?.progress??stormP()));
  const cloudDecoded=videoCloud||cloud&&(cloud.isReadyFor?cloud.isReadyFor(cloudP()):cloud.sourceReady!==false&&Math.abs(cloud.frame-Math.round(cloudP()*359))<=2);
  if(!reading&&p<=opening.clouds[0])cloudShown=false;else if(cloudDecoded)cloudShown=true;
  const stormDecoded=videoStorm||storm&&(storm.isReadyFor?storm.isReadyFor(stormP()):storm.sourceReady!==false&&Math.abs(storm.frame-Math.round(stormP()*359))<=2);
  if(reading||p<opening.storm[0])stormShown=false;else if(stormDecoded)stormShown=true;
  const cloudMix=cloudShown?(reading?1:smooth(...opening.cloudBlend,p)):0,stormMix=!reading&&stormShown?smooth(...opening.stormBlend,p):0;
  write('--wind-opacity',(1-cloudMix)*(1-stormMix));write('--cloud-opacity',!videoCloud&&cloudMix>0?1-stormMix:0);write('--storm-opacity',!videoStorm&&stormMix>0?1:0);
  write('--cloud-copy-ink',cloudShown&&!reading?smooth(.28,.36,p)*(1-smooth(.60,.66,p)):0);
  write('--emblem-opacity',reading?.42:.72*smooth(.42,.86,windP)*(1-smooth(...opening.cloudBlend,p)));
  write('--emblem-scale',1.018-.018*smooth(.42,.86,windP));
 }
 function set(value){
  if(!Number.isFinite(value))return;p=clamp(value);
  if(!window.FulwinVideoScenes?.hasCloud)window.FulwinCloudSeq?.set(cloudP());if(!window.FulwinVideoScenes?.hasStorm&&!reading&&p>=opening.storm[0]-.03)window.FulwinStormSeq?.set(stormP());paint();
 }
 window.FulwinPrologue={set,setReading(value){reading=!!value;dirty=true;if(!window.FulwinVideoScenes?.hasCloud)window.FulwinCloudSeq?.set(cloudP());paint();}};
 window.addEventListener('fulwin:cloud-frame',paint);window.addEventListener('fulwin:storm-frame',paint);window.addEventListener('resize',()=>{dirty=true;paint();});paint();
})();
