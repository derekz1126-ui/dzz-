(() => {
  'use strict';
  const media=matchMedia('(prefers-reduced-motion: reduce)');
  const t=(key,fallback)=>window.DZZI18n?.t(key,fallback)??fallback;
  let paused=media.matches,entrance,decorations,shootFrame=0,shot=null;
  const motionTargets='.panel,.portrait-art,.power-chip,.playbook-card,.comic-title,.panel-caption';
  if(window.gsap&&window.ScrollTrigger)gsap.registerPlugin(ScrollTrigger);
  function animatePage(){
    if(paused||!window.gsap||window.DZZPortal?.isActive())return;
    if(entrance)entrance.kill();
    const panels=[...document.querySelectorAll('.panel')].filter(el=>el.getBoundingClientRect().top<innerHeight);
    entrance=gsap.timeline().fromTo(panels,{y:80,rotation:(i)=>i%2?5:-5,scale:.9,opacity:.2},{y:0,rotation:0,scale:1,opacity:1,duration:.7,stagger:.08,ease:'back.out(1.5)',clearProps:'transform,opacity'},0)
      .fromTo('.comic-title',{scale:1.45,x:25,opacity:0},{scale:1,x:0,opacity:1,duration:.5,ease:'back.out(1.9)',clearProps:'transform,opacity'},.2);
  }
  function setupScroll(){
    if(decorations){decorations.revert();decorations=null;}
    if(paused||!window.gsap||!window.ScrollTrigger)return;
    decorations=gsap.context(()=>{
      document.querySelectorAll('.panel').forEach((panel,i)=>{
        if(panel.getBoundingClientRect().top<innerHeight)return;
        gsap.fromTo(panel,{y:65,rotation:i%2?3:-3,scale:.96},{y:0,rotation:0,scale:1,duration:.65,ease:'back.out(1.4)',clearProps:'transform',scrollTrigger:{trigger:panel,start:'top 92%',once:true}});
      });
    });
    document.fonts.ready.then(()=>ScrollTrigger.refresh());
  }
  function renderMotionLabels(){
    ['motionToggle','introMotion'].forEach(id=>{
      const button=document.getElementById(id);
      button.setAttribute('aria-pressed',String(paused));
      button.textContent=paused?t('motion.off','MOTION OFF'):t('motion.on','MOTION ON');
      button.setAttribute('aria-label',paused?t('motion.enable','Enable motion'):t('motion.pause','Pause motion'));
    });
  }
  function syncMotion(){
    document.body.classList.toggle('motion-paused',paused);
    document.documentElement.style.scrollBehavior=paused?'auto':'';
    renderMotionLabels();
    document.dispatchEvent(new CustomEvent('dzz:motion',{detail:{paused}}));
    window.DZZImpact?.setEnabled(!paused);
    window.DZZPortal?.setEnabled(!paused);
    if(paused){
      if(entrance)entrance.kill();
      if(decorations){decorations.revert();decorations=null;}
      if(window.gsap){gsap.killTweensOf(motionTargets);gsap.set(motionTargets,{clearProps:'transform,opacity,visibility'});}
      clearShot();
      document.querySelectorAll('.portrait-frame').forEach(el=>{el.style.setProperty('--tilt-x','0deg');el.style.setProperty('--tilt-y','0deg');});
    }else setupScroll();
  }
  ['motionToggle','introMotion'].forEach(id=>document.getElementById(id).addEventListener('click',()=>{paused=media.matches||!paused;syncMotion();}));
  media.addEventListener('change',e=>{paused=e.matches;syncMotion();});
  const themes=[['','EARTH-01'],['gwen','EARTH-65'],['noir','EARTH-NOIR']];let themeIndex=0;
  document.getElementById('themeToggle').addEventListener('click',event=>{
    themeIndex=(themeIndex+1)%themes.length;
    document.body.dataset.theme=themes[themeIndex][0];event.currentTarget.textContent=themes[themeIndex][1];
    const r=event.currentTarget.getBoundingClientRect();window.DZZImpact?.burst(r.left-60,r.bottom+70,t('theme.switch','SWITCH!'),'#ffde00');
  });
  const powers={
    learn:['LEARN FAST!','I ask precise questions, test my understanding, and use new knowledge while it is still fresh.'],
    frame:['FIND THE WHY!','I look beyond the immediate request to understand the people, workflow, and problem underneath it.'],
    prototype:['MAKE IT REAL!','I turn an idea into a small working version so assumptions can meet reality.'],
    systems:['CONNECT IT!','I connect tools, information, and decisions into a workflow that makes sense as a whole.'],
    iterate:['ONE MORE TRY!','I use feedback to change what is not working, and keep the useful parts.'],
    communicate:['MAKE IT CLEAR!','I make technical decisions understandable: what matters, what changes, and what happens next.'],
    research:['DIG DEEPER!','I look for primary sources, compare the evidence, and separate a useful fact from an attractive assumption.'],
    ai:['THINK + BUILD!','I explore where AI can help a workflow, then check the result against the real task.'],
    debug:['TRACE IT!','I reproduce the problem, narrow the cause, and verify the fix against the original failure.'],
    connect:['LINK IT UP!','I trace inputs, outputs, and handoffs so separate tools can work together.'],
    feedback:['LISTEN FIRST!','I watch how people use a solution and let that evidence guide the next iteration.'],
    delivery:['INTO THE FIELD!','I think beyond the demo: clear setup, practical constraints, and a result that is useful in its actual setting.']
  };
  document.querySelectorAll('.power-chip').forEach(button=>button.addEventListener('click',event=>{
    document.querySelectorAll('.power-chip').forEach(el=>el.setAttribute('aria-pressed',String(el===button)));
    const [word,description]=powers[button.dataset.power];
    document.getElementById('powerDetail').textContent=t(`power.${button.dataset.power}.description`,description);
    const r=button.getBoundingClientRect();window.DZZImpact?.burst(event.clientX||r.left+r.width/2,event.clientY||r.top+r.height/2,t(`power.${button.dataset.power}.word`,word),'#ffde00');
    if(!paused&&window.gsap)gsap.fromTo(button,{scale:.88,rotation:-6},{scale:1,rotation:0,duration:.38,ease:'back.out(2.5)',clearProps:'transform'});
  }));
  document.querySelectorAll('.playbook-card').forEach(button=>button.addEventListener('click',event=>{
    const expanded=button.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',String(!expanded));button.querySelector('.playbook-extra').hidden=expanded;
    button.querySelector('.playbook-hint').textContent=expanded?t('mission.open','EXPLORE THE APPROACH'):t('mission.close','CLOSE FIELD NOTE');
    const r=button.getBoundingClientRect();window.DZZImpact?.burst(event.clientX||r.left+r.width/2,event.clientY||r.top+40,t(`mission.${button.dataset.step}.word`,['LEARN!','WHY?','BUILD!','CONNECT!','TEST!','CLARITY!'][Number(button.dataset.step)]),'#04dce8');
    if(window.ScrollTrigger)ScrollTrigger.refresh();
  }));
  const quotes=['Curiosity doesn’t clock out.','The fastest way to understand is to build something.','Ask a better question. Find a better next step.','A working prototype starts a better conversation.'];let quoteIndex=-1;
  document.getElementById('noteShuffle').addEventListener('click',event=>{
    quoteIndex=(quoteIndex+1)%quotes.length;document.getElementById('fieldQuote').textContent=t(`quote.${quoteIndex}`,quotes[quoteIndex]);
    const r=event.currentTarget.getBoundingClientRect();window.DZZImpact?.burst(r.left+r.width/2,r.top-40,t('note.new','NEW IDEA!'),'#ff315e');
  });
  document.addEventListener('dzz:language',()=>{
    renderMotionLabels();
    const selected=document.querySelector('.power-chip[aria-pressed="true"]');
    if(selected)document.getElementById('powerDetail').textContent=t(`power.${selected.dataset.power}.description`,powers[selected.dataset.power][1]);
    document.querySelectorAll('.playbook-card').forEach(button=>{const expanded=button.getAttribute('aria-expanded')==='true';button.querySelector('.playbook-hint').textContent=expanded?t('mission.close','CLOSE FIELD NOTE'):t('mission.open','EXPLORE THE APPROACH');});
    document.getElementById('fieldQuote').textContent=quoteIndex<0?t('quote.initial','“The best way to understand something is to try making it work.”'):t(`quote.${quoteIndex}`,quotes[quoteIndex]);
    if(window.ScrollTrigger)ScrollTrigger.refresh();
  });
  document.getElementById('replayUniverse').addEventListener('click',()=>window.DZZPortal?.open());
  document.getElementById('backTop').addEventListener('click',()=>scrollTo({top:0,behavior:paused?'instant':'smooth'}));
  addEventListener('dzz:entered',()=>{animatePage();if(window.ScrollTrigger)ScrollTrigger.refresh();});
  document.querySelectorAll('.portrait-frame').forEach(frame=>{
    frame.addEventListener('pointermove',event=>{if(paused)return;const r=frame.getBoundingClientRect();frame.style.setProperty('--tilt-x',`${-(event.clientY-r.top-r.height/2)/r.height*13}deg`);frame.style.setProperty('--tilt-y',`${(event.clientX-r.left-r.width/2)/r.width*15}deg`);});
    frame.addEventListener('pointerleave',()=>{frame.style.setProperty('--tilt-x','0deg');frame.style.setProperty('--tilt-y','0deg');});
  });
  // A brief web shot responds to an intentional click on the paper, then stops.
  const web=document.createElement('canvas');web.setAttribute('aria-hidden','true');web.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:89;';document.body.append(web);const wctx=web.getContext('2d');
  function sizeWeb(){const d=Math.min(devicePixelRatio||1,2);web.width=innerWidth*d;web.height=innerHeight*d;web.style.width=innerWidth+'px';web.style.height=innerHeight+'px';wctx.setTransform(d,0,0,d,0,0);}
  function clearShot(){if(shootFrame)cancelAnimationFrame(shootFrame);shootFrame=0;shot=null;if(wctx)wctx.clearRect(0,0,innerWidth,innerHeight);}
  function renderShot(now){
    shootFrame=0;if(!shot||paused)return;
    const age=(now-shot.t)/850;if(age>=1){clearShot();return;}
    wctx.clearRect(0,0,innerWidth,innerHeight);
    const travel=Math.min(age/.28,1),x=innerWidth*.5+(shot.x-innerWidth*.5)*travel,y=innerHeight+(shot.y-innerHeight)*travel;
    const alpha=age<.5?1:(1-age)*2;
    wctx.globalAlpha=alpha;wctx.strokeStyle='#111';wctx.lineWidth=4;
    for(let pass=0;pass<2;pass++){
      wctx.strokeStyle=pass?'#fffdf4':'#111';wctx.lineWidth=pass?1.5:4;
      for(let strand=0;strand<4;strand++){
        wctx.beginPath();wctx.moveTo(innerWidth*.5,innerHeight);
        for(let i=1;i<=18;i++){const f=i/18;const wave=Math.sin(f*Math.PI*4+strand)*10*Math.sin(f*Math.PI);wctx.lineTo(innerWidth*.5+(x-innerWidth*.5)*f+wave,y*f+innerHeight*(1-f)+wave*.5);}
        wctx.stroke();
      }
    }
    wctx.globalAlpha=1;shootFrame=requestAnimationFrame(renderShot);
  }
  sizeWeb();addEventListener('resize',()=>{clearShot();sizeWeb();});
  document.addEventListener('click',event=>{
    if(paused||window.DZZPortal?.isActive()||event.target.closest('a,button,input,textarea,select'))return;
    clearShot();shot={x:event.clientX,y:event.clientY,t:performance.now()};shootFrame=requestAnimationFrame(renderShot);
    window.DZZImpact?.burst(event.clientX,event.clientY,t('web.word','THWIP!'),'#ffde00');
  });
  document.addEventListener('visibilitychange',()=>{if(document.hidden)clearShot();});
  syncMotion();
  if(['127.0.0.1','localhost'].includes(location.hostname)){
    let version;
    setInterval(async()=>{try{const response=await fetch('/__dev/version',{cache:'no-store'});if(!response.ok)return;const next=await response.text();if(version&&next!==version){sessionStorage.setItem('dzz-preview-scroll',String(scrollY));location.reload();}version=next;}catch{}},1500);
    const saved=sessionStorage.getItem('dzz-preview-scroll');if(saved){sessionStorage.removeItem('dzz-preview-scroll');requestAnimationFrame(()=>{if(!window.DZZPortal?.isActive())scrollTo({top:Number(saved),behavior:'instant'});});}
  }
})();
