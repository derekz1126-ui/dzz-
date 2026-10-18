/* Scroll-driven weather film: bounded decoded frames, subframe blending,
   continuous shot paths and two-depth composition. No autonomous playback. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FulwinWeatherFilm=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
 'use strict';
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const shots={
  cloud:[{end:.2,name:'余风未散'},{end:.45,name:'轻雾穿行'},{end:.75,name:'云层铺展'},{end:1,name:'云海打开'}],
  storm:[{end:.25,name:'云压低'},{end:.5,name:'暗流涌动'},{end:.7,name:'电光潜伏'},{end:.88,name:'主雷乍现'},{end:1,name:'雷后余响'}]
 };
 const paths={
  cloud:[[0,0,1.04,0,.018],[-.02,.008,1.12,.014,.05],[.016,-.01,1.19,-.012,.038],[-.014,.006,1.12,.018,.025],[0,0,1.06,0,.02]],
  storm:[[0,0,1.06,0,.02],[-.016,-.004,1.13,.018,.028],[.014,.012,1.19,-.014,.016],[-.01,.005,1.16,.01,.01],[.006,0,1.10,-.006,.006],[0,-.002,1.06,0,.008]]
 };
 function motion(act,p){
  p=clamp(p);const keys=paths[act],times=[0,...shots[act].map(s=>s.end)];
  let i=Math.max(0,times.findIndex((t,j)=>j>0&&p<=t)-1);if(p===1)i=keys.length-2;
  const span=times[i+1]-times[i],t=clamp((p-times[i])/span),t2=t*t,t3=t2*t;
  const values=keys[i].map((a,k)=>{
   const b=keys[i+1][k],lo=Math.max(0,i-1),hi=Math.min(keys.length-1,i+2);
   const m0=i===0?0:(b-keys[lo][k])/(times[i+1]-times[lo])*span;
   const m1=i+1===keys.length-1?0:(keys[hi][k]-a)/(times[hi]-times[i])*span;
   return (2*t3-3*t2+1)*a+(t3-2*t2+t)*m0+(-2*t3+3*t2)*b+(t3-t2)*m1;
  });
  return {x:values[0],y:values[1],scale:values[2],near:values[3],fog:values[4]};
 }
 function draw(g,w,h,a,b,mix,p,act,near){
  if(!a)return;const camera=motion(act,p),flow=p+(act==='storm'?1:0);
  function image(ctx,img,alpha,foreground=false){
   if(!img||alpha<=0)return;
   const iw=img.naturalWidth||img.width||1920,ih=img.naturalHeight||img.height||1080;
   const s=Math.max(w/iw,h/ih)*camera.scale*(foreground?1.018:1),dw=iw*s,dh=ih*s;
   ctx.globalAlpha=alpha;ctx.drawImage(img,(w-dw)/2+w*(camera.x+(foreground?camera.near:0)),(h-dh)/2+h*camera.y,dw,dh);ctx.globalAlpha=1;
  }
  g.clearRect(0,0,w,h);image(g,a,1);image(g,b,mix);
  if(near){
   if(near.width!==w||near.height!==h){near.width=w;near.height=h;}
   const n=near.getContext('2d');n.clearRect(0,0,w,h);image(n,a,1,true);image(n,b,mix,true);
   n.globalCompositeOperation='destination-in';const mask=n.createLinearGradient(0,h*.42,0,h*.78);mask.addColorStop(0,'#0000');mask.addColorStop(1,'#000');n.fillStyle=mask;n.fillRect(0,0,w,h);n.globalCompositeOperation='source-over';g.drawImage(near,0,0);
  }
  // Three wide, low-opacity veils move at different depth rates, never smoke puffs.
  for(let i=0;i<3;i++){
   const cx=w*(.16+i*.36+.14*Math.sin(flow*3.2+i*1.7)),cy=h*(.72+.07*Math.cos(flow*2.6+i));
   g.save();g.translate(cx,cy);g.scale(w*.58,h*.18);
   const mist=g.createRadialGradient(0,0,0,0,0,1);mist.addColorStop(0,`rgba(210,223,234,${camera.fog})`);mist.addColorStop(1,'rgba(210,223,234,0)');g.fillStyle=mist;g.fillRect(-1,-1,2,2);g.restore();
  }
 }
 function create(front,{count,url,act='cloud',onFrame=()=>{}},win=globalThis){
  const doc=win.document,canvas=doc.createElement('canvas'),g=canvas.getContext('2d');
  if(!g)return win.FulwinFrames.create(front,{count,url,preload:false,onFrame});
  const near=doc.createElement('canvas');canvas.className='weather-film';canvas.setAttribute('aria-hidden','true');front.after(canvas);front.style.opacity='0';
  const limit=(win.navigator?.deviceMemory||8)<=4?6:12,cache=new Map(),loading=new Set(),failed=new Set(),safeId=act==='storm'?Math.round(.4*(count-1)):null;
  let revision=0,shownRevision=-1,current=0,desired=0,position=0,last=0,raf=0,active=0,direction=1;
  function wake(){if(!raf&&!doc.hidden)raf=win.requestAnimationFrame(render);}
  function order(){
   const n=Math.round(desired),r=Math.floor((limit-2)/2),list=[n,...(safeId===null?[]:[safeId]),Math.floor(desired),Math.ceil(desired)];
   for(let d=1;d<=r;d++)list.push(n+direction*d,n-direction*d);
   return [...new Set(list.filter(i=>i>=0&&i<count))].slice(0,limit);
  }
  function trim(){
   const keys=[...cache.keys()].sort((a,b)=>a===safeId?-1:b===safeId?1:Math.abs(a-desired)-Math.abs(b-desired));
   for(const key of keys.slice(limit))cache.delete(key);
  }
  function pump(){
   const wanted=order();
   while(active<2){
    const i=wanted.find(i=>!cache.has(i)&&!loading.has(revision+':'+i)&&!failed.has(i));if(i===undefined)break;
    const rev=revision,key=rev+':'+i,img=new win.Image();img.decoding='async';loading.add(key);active++;
    const done=()=>{
     if(rev===revision){cache.set(i,img);trim();wake();}
    };
    let promise;
    if(typeof img.decode==='function'){img.src=url(i);promise=img.decode();}
    else promise=new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=reject;img.src=url(i);});
    promise.then(done,()=>{if(rev===revision)failed.add(i);}).finally(()=>{loading.delete(key);active--;pump();});
   }
  }
  function render(now){
   raf=0;if(doc.hidden){last=0;return;}
   const dt=last?clamp(now-last,1,64):16.7;last=now;
   if(Math.abs(desired-position)>40)position=desired;
   else position+=(desired-position)*(1-Math.exp(-dt/70));
   if(Math.abs(desired-position)<.001)position=desired;
   const flash=i=>act==='storm'&&i/(count-1)>=.755&&i/(count-1)<=.812;
   const keys=[...cache.keys()].filter(i=>flash(i)===flash(desired));if(!keys.length){g.clearRect(0,0,canvas.width,canvas.height);g.fillStyle='#101820';g.fillRect(0,0,canvas.width,canvas.height);shownRevision=-1;last=0;return;}
   const nearest=keys.reduce((a,b)=>Math.abs(b-position)<Math.abs(a-position)?b:a);
   const lo=Math.floor(position),hi=Math.ceil(position),pair=cache.has(lo)&&cache.has(hi)&&flash(lo)===flash(desired)&&flash(hi)===flash(desired);
   const index=pair?Math.round(position):nearest;
   const container=front.parentElement,w0=container.clientWidth||win.innerWidth,h0=container.clientHeight||win.innerHeight;
   const ratio=Math.min(win.devicePixelRatio||1,1.5,Math.sqrt(2073600/(w0*h0))),w=Math.max(1,Math.floor(w0*ratio)),h=Math.max(1,Math.floor(h0*ratio));
   if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
   draw(g,w,h,cache.get(pair?lo:nearest),pair?cache.get(hi):null,pair?position-lo:0,position/(count-1),act,near);
   const changed=current!==index||shownRevision!==revision;current=index;shownRevision=revision;
   if(changed)onFrame(index);
   if(position!==desired)wake();else last=0;
  }
  const api={set(p){
   if(!Number.isFinite(p))return;const target=clamp(p)*(count-1);direction=target>=desired?1:-1;desired=target;failed.clear();pump();wake();
  },invalidate(){revision++;cache.clear();failed.clear();pump();wake();},
  isReadyFor(p){const flash=v=>act==='storm'&&v>=.755&&v<=.812;return shownRevision===revision&&Math.abs(current-clamp(p)*(count-1))<=12&&flash(current/(count-1))===flash(p);},
  get progress(){return position/(count-1);},
  get sourceReady(){return shownRevision===revision;},get frame(){return current;},get total(){return count;},get ready(){return cache.size;},
  get stats(){return {cached:cache.size,pending:active,desired,revision};}};
  win.addEventListener('resize',wake);doc.addEventListener('visibilitychange',()=>{if(doc.hidden){if(raf)win.cancelAnimationFrame(raf);raf=0;last=0;}else wake();});
  return api;
 }
 return {shots,motion,draw,create};
});
