(() => {
  'use strict';
  const t=(key,fallback)=>window.DZZI18n?.t(key,fallback)??fallback;
  const intro=document.getElementById('universeIntro');
  const warp=document.getElementById('warpTransition');
  const site=document.getElementById('siteContent');
  const canvas=document.getElementById('universeCanvas');
  const ctx=canvas.getContext('2d');
  const enter=document.getElementById('enterUniverse');
  const webCanvas=document.createElement('canvas');
  webCanvas.className='intro-web-canvas';
  webCanvas.setAttribute('aria-hidden','true');
  webCanvas.style.cssText='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:8;';
  webCanvas.hidden=true;intro.appendChild(webCanvas);
  const webCtx=webCanvas.getContext('2d');
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  let enabled=!media.matches,active=false,jumping=false,raf=0,transition,ambientShot,previousFocus;
  let width=innerWidth,height=innerHeight,last=0,time=0;
  let pointer={x:0,y:0};
  const points=Array.from({length:72},(_,i)=>({x:((i*73+29)%997)/997,y:((i*137+71)%991)/991,phase:i*1.72,size:1.5+(i%4)*.7}));
  const colors=['#04dce8','#ff315e','#8a65fb'];
  function resize(){
    width=innerWidth;height=innerHeight;
    const dpr=Math.min(devicePixelRatio||1,2);
    canvas.width=width*dpr;canvas.height=height*dpr;
    canvas.style.width=`${width}px`;canvas.style.height=`${height}px`;
    ctx.setTransform(dpr,0,0,dpr,0,0);
    webCanvas.width=width*dpr;webCanvas.height=height*dpr;webCtx.setTransform(dpr,0,0,dpr,0,0);
    if(active&&!enabled)draw(0);
  }
  function draw(now){
    ctx.clearRect(0,0,width,height);
    const p=points.map(n=>({x:n.x*width+Math.sin(time*.23+n.phase)*13+pointer.x*(n.size*3),y:n.y*height+Math.cos(time*.18+n.phase)*16+pointer.y*(n.size*3),size:n.size}));
    const radius=Math.min(width*.19,260);
    for(let i=0;i<p.length;i++){
      const a=p[i];
      for(let j=i+1;j<p.length;j++){
        const b=p[j],d=Math.hypot(a.x-b.x,a.y-b.y);
        if(d<radius){ctx.strokeStyle=i%4===0?`rgba(255,49,94,${(1-d/radius)*.25})`:`rgba(4,220,232,${(1-d/radius)*.23})`;ctx.lineWidth=.7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
      }
      ctx.fillStyle=colors[i%3];ctx.globalAlpha=.4+Math.sin(time*.9+i)*.18;ctx.beginPath();ctx.arc(a.x,a.y,a.size,0,Math.PI*2);ctx.fill();
      if(i%9===0){ctx.strokeStyle=colors[i%3];ctx.globalAlpha=.2;ctx.beginPath();ctx.arc(a.x,a.y,12+Math.sin(time+i)*3,0,Math.PI*2);ctx.stroke();}
    }
    const r=enter.getBoundingClientRect();const x=r.left+r.width/2,y=r.top+r.height/2;
    ctx.globalAlpha=.22;ctx.strokeStyle='#ffde00';ctx.lineWidth=1;
    p.filter((_,i)=>i%6===0).forEach(n=>{ctx.beginPath();ctx.moveTo(n.x,n.y);ctx.lineTo(x,y);ctx.stroke();});
    ctx.globalAlpha=1;
    if(enabled&&active&&!document.hidden)raf=requestAnimationFrame(frame);
  }
  function frame(now){raf=0;if(!active||!enabled||document.hidden)return;if(now-last<25){raf=requestAnimationFrame(frame);return;}last=now;time=now*.001;draw(now);}
  function stop(){if(raf)cancelAnimationFrame(raf);raf=0;}
  function start(){stop();if(active){resize();if(enabled)raf=requestAnimationFrame(frame);else draw(0);}}
  function drawWeb(progress,target){
    webCtx.clearRect(0,0,width,height);
    const origin={x:width*.5,y:height+25};
    const travel=1-Math.pow(1-Math.min(progress/.48,1),2);
    const end={x:origin.x+(target.x-origin.x)*travel,y:origin.y+(target.y-origin.y)*travel};
    const dx=target.x-origin.x,dy=target.y-origin.y,length=Math.hypot(dx,dy)||1;
    const perpendicular={x:-dy/length,y:dx/length};
    const coil=(1-Math.min(progress/.8,1))*17;
    webCtx.lineCap='round';webCtx.lineJoin='round';
    for(let layer=0;layer<3;layer++){
      webCtx.strokeStyle=['#04060d','#00f0ff','#fffef6'][layer];
      webCtx.lineWidth=[8,4.5,2.8][layer];
      for(let strand=-1;strand<=1;strand++){
        webCtx.beginPath();webCtx.moveTo(origin.x+strand*7,origin.y);
        for(let i=1;i<=40;i++){
          const f=i/40;
          const ripple=(Math.sin(f*Math.PI*7-progress*12+strand*.8)*coil+strand*7)*Math.sin(f*Math.PI);
          webCtx.lineTo(origin.x+(end.x-origin.x)*f+perpendicular.x*ripple,origin.y+(end.y-origin.y)*f+perpendicular.y*ripple);
        }
        webCtx.stroke();
      }
    }
    if(progress>.43){
      const spread=Math.min((progress-.43)/.23,1),radius=82*spread;
      for(let layer=0;layer<2;layer++){
        webCtx.strokeStyle=layer?'#fffef6':'#04060d';webCtx.lineWidth=layer?2:5;
        for(let spoke=0;spoke<10;spoke++){
          const angle=spoke*Math.PI/5+.2;
          webCtx.beginPath();webCtx.moveTo(target.x,target.y);webCtx.lineTo(target.x+Math.cos(angle)*radius,target.y+Math.sin(angle)*radius);webCtx.stroke();
        }
        for(let ring=1;ring<=4;ring++){
          const r=radius*ring/4;webCtx.beginPath();
          for(let spoke=0;spoke<=10;spoke++){
            const angle=spoke*Math.PI/5+.2,x=target.x+Math.cos(angle)*r,y=target.y+Math.sin(angle)*r;
            if(!spoke)webCtx.moveTo(x,y);
            else{const mid=angle-Math.PI/10;webCtx.quadraticCurveTo(target.x+Math.cos(mid)*r*.76,target.y+Math.sin(mid)*r*.76,x,y);}
          }
          webCtx.stroke();
        }
      }
    }
  }
  function stopAmbientShot(){
    if(ambientShot){ambientShot.kill();ambientShot=null;}
    webCanvas.hidden=true;webCanvas.style.opacity='1';webCtx.clearRect(0,0,width,height);
  }
  function fireWebAt(x,y,showWord=true){
    if(!active||!enabled||jumping||!window.gsap)return;
    stopAmbientShot();webCanvas.hidden=false;
    const shotProgress={value:0};
    if(showWord)window.DZZImpact?.burst(x,y,t('web.word','THWIP!'),'#ffde00');
    ambientShot=gsap.timeline({onComplete:()=>{ambientShot=null;webCanvas.hidden=true;webCtx.clearRect(0,0,width,height);}})
      .to(shotProgress,{value:1,duration:.64,ease:'none',onUpdate:()=>drawWeb(shotProgress.value,{x,y})})
      .to(webCanvas,{opacity:0,duration:.3},1.05);
  }
  function finish(){
    stopAmbientShot();
    if(window.gsap)gsap.killTweensOf('.portal-heading');
    if(transition){transition.kill();transition=null;}
    active=false;jumping=false;stop();
    intro.hidden=true;warp.hidden=true;webCanvas.hidden=true;webCtx.clearRect(0,0,width,height);site.inert=false;
    document.body.classList.remove('portal-open');
    if(window.gsap){gsap.set([intro,warp,enter],{clearProps:'all'});gsap.set('.portal-heading,.warp-ring,.warp-word',{clearProps:'all'});}
    try{sessionStorage.setItem('dzz-entered-v2','yes');}catch{}
    scrollTo({top:0,behavior:'instant'});
    document.getElementById('pageTitle').focus({preventScroll:true});
    dispatchEvent(new CustomEvent('dzz:entered'));
  }
  function close(withWarp=true){
    if(!active||jumping)return;
    stopAmbientShot();
    jumping=true;
    if(window.gsap)gsap.killTweensOf('.portal-heading');
    if(!enabled||!window.gsap||!withWarp){finish();return;}
    stop();webCanvas.hidden=false;
    const circle=enter.querySelector('.node-circle').getBoundingClientRect();
    const target={x:circle.left+circle.width/2,y:circle.top+circle.height/2};
    const shotProgress={value:0};
    transition=gsap.timeline({onComplete:finish})
      .call(()=>window.DZZImpact?.burst(width*.5,height-140,t('web.word','THWIP!'),'#ffde00'),[],0)
      .to(shotProgress,{value:1,duration:.78,ease:'none',onUpdate:()=>drawWeb(shotProgress.value,target)},0)
      .to(enter,{scale:1.16,duration:.16,ease:'power2.out'},.38)
      .to(enter,{scale:1,duration:.18,ease:'back.out(2)'},.54)
      .to('.portal-heading',{scale:2.6,opacity:0,duration:.5,ease:'power3.in'},.72)
      .to(intro,{scale:1.13,opacity:0,duration:.45,ease:'power3.in'},.82)
      .call(()=>{warp.hidden=false;},[],.81)
      .fromTo(warp,{opacity:0},{opacity:1,duration:.18},.82)
      .fromTo('.warp-ring',{scale:.025,rotation:-35,opacity:.95},{scale:11,rotation:25,opacity:0,duration:1.25,stagger:.12,ease:'power2.in'},.84)
      .fromTo('.warp-word',{scale:.05,rotation:-30,opacity:0},{scale:1.2,rotation:-9,opacity:1,duration:.48,ease:'back.out(1.8)'},1.02)
      .to('.warp-word',{scale:3,opacity:0,duration:.32,ease:'power3.in'},1.59)
      .to(warp,{opacity:0,duration:.28},1.87);
  }
  function open(){
    stopAmbientShot();
    if(window.gsap)gsap.killTweensOf('.portal-heading');
    if(transition){transition.kill();transition=null;}
    previousFocus=document.activeElement;
    active=true;jumping=false;intro.hidden=false;warp.hidden=true;webCanvas.hidden=true;site.inert=true;
    document.body.classList.add('portal-open');
    if(window.gsap){gsap.set([intro,'.portal-heading'],{clearProps:'all'});if(enabled)gsap.fromTo('.portal-heading',{scale:.85,opacity:0,y:25},{scale:1,opacity:1,y:0,duration:.75,ease:'back.out(1.1)'});}
    document.getElementById('portalMessage').textContent='';
    enter.focus({preventScroll:true});start();
  }
  function setEnabled(value){enabled=value&&!media.matches;if(!enabled){stopAmbientShot();if(window.gsap){gsap.killTweensOf('.portal-heading');gsap.set('.portal-heading',{clearProps:'transform,opacity'});}}if(!enabled&&jumping){finish();return;}start();}
  enter.addEventListener('click',()=>close(true));
  document.getElementById('skipIntro').addEventListener('click',()=>close(false));
  intro.addEventListener('keydown',event=>{
    if(event.key==='Escape'){event.preventDefault();close(false);}
    if(event.key==='Tab'){
      const controls=[...intro.querySelectorAll('button')].filter(b=>!b.hidden);
      const first=controls[0],last=controls[controls.length-1];
      if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
      else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
    }
  });
  intro.addEventListener('pointermove',event=>{if(enabled){pointer.x=(event.clientX/width-.5)*2;pointer.y=(event.clientY/height-.5)*2;intro.style.setProperty('--px',`${pointer.x*13}px`);intro.style.setProperty('--py',`${pointer.y*9}px`);}});
  intro.addEventListener('click',event=>{
    if(event.target.closest('#enterUniverse,#skipIntro,#introMotion,#introLanguage')||event.detail===0)return;
    fireWebAt(event.clientX,event.clientY,!event.target.closest('.decoy-node'));
  });
  intro.querySelectorAll('.decoy-node').forEach((button,i)=>button.addEventListener('click',event=>{
    const words=['NOT HERE!','KEEP LOOKING!','ALMOST!'];
    document.getElementById('portalMessage').textContent=t('portal.hint','Follow the yellow signal. That’s where you’ll find DZZ.');
    window.DZZImpact?.burst(event.clientX||width*.5,event.clientY||height*.5,t(`portal.decoy.${i%3}`,words[i%3]),i%2?'#04dce8':'#ff315e');
  }));
  document.addEventListener('dzz:language',()=>{const message=document.getElementById('portalMessage');if(active&&message.textContent)message.textContent=t('portal.hint','Follow the yellow signal. That’s where you’ll find DZZ.');});
  addEventListener('resize',resize);
  document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopAmbientShot();}else start();});
  window.DZZPortal={open,c