/* FULWIN · one stage, one scroll timeline. No requests or saved visitor data. */
(() => {
  'use strict';
  const root = document.documentElement;
  const layers = [...document.querySelectorAll('.layer')];
  const cache = layers.map(()=>({v:null,t:null,dy:null,sc:null,live:null,inert:null,aria:null}));
  const rail = [...document.querySelectorAll('.rail a')];
  const track = document.querySelector('.track');
  const play = document.getElementById('play');
  const dialog = document.getElementById('concept');
  const status = document.getElementById('experience-status');
  const media = matchMedia('(prefers-reduced-motion: reduce)');
  const chapters = [['序章','PROLOGUE'],['拆解','DEFINE'],['感觉','FEEL'],['飓风','HURRICANE'],['云冕','NIMBUS'],['奔雷','THUNDER'],['归一','CONVERGENCE']];
  const story=window.FulwinCinematicAssets?.acts;
  const layout=window.FulwinCinematicAssets?.layout||{weights:[72,36,38,42,40,42,34],trackVh:1740,demoMs:180000};
  const weights = layout.weights;
  const total = weights.reduce((a,b) => a+b, 0);
  const ranges = weights.map((w,i) => {
    const s = weights.slice(0,i).reduce((a,b)=>a+b,0)/total;
    return {s,e:s+w/total};
  });
  ranges[6].e = 1;
  const overlap = 32/layout.trackVh;
  const clamp = v => Math.max(0,Math.min(1,v));
  const visits = [0,.12,.12,.075,.075,.075,.78];
  const maxScroll = () => Math.max(1,root.scrollHeight-innerHeight);
  let reading = media.matches, manualReading = false, playing = false;
  let progress = 0, active = -1, activeAct=-1, frameId = 0, lastTime = 0, restoreFocus, pendingFocus=-1, playPosition=0;
  let oldWidth = innerWidth, oldHeight = innerHeight, resizeTimer;
  track.style.height = layout.trackVh+'vh';

  function chapterOf(p) {
    const i=ranges.findIndex(r=>p<r.e);
    return i<0?6:i;
  }
  function setActive(i,t=0) {
    const act=story?window.FulwinVideoSceneTools.actAt(i,t,window.FulwinCinematicAssets):null,n=act?story.indexOf(act):i;
    if (i===active&&n===activeAct) return;
    active = i;
    activeAct=n;
    document.querySelector('.where__no').textContent = String(n+1).padStart(2,'0');
    document.querySelector('.where__cn').textContent = act?act.name:chapters[i][0];
    document.querySelector('.where__cn').classList.toggle('has-brand-name',(act?act.name:chapters[i][0]).includes('风云'));
    document.querySelector('.where__en').textContent = act?act.en:chapters[i][1];
    rail.forEach((a,k)=>{
      const on=act?a.dataset.act===act.id:k===i;
      a.classList.toggle('is-on',on);
      if(on) a.setAttribute('aria-current','step'); else a.removeAttribute('aria-current');
    });
  }
  function paint() {
    if(reading) {
      window.FulwinVideoScenes?.update([],true);
      let i = 0;
      layers.forEach((l,k)=>{if(l.getBoundingClientRect().top<=innerHeight*.45)i=k;});
      setActive(i);
      return;
    }
    const index = chapterOf(progress);
    const videoStates=[];
    layers.forEach((l,i)=>{
      const {s,e}=ranges[i];
      const vin=i===0?1:clamp((progress-(s-.30*overlap))/(.85*overlap));
      const vout=i===6?0:clamp((progress-(e-(i===0?.35:.95)*overlap))/(.80*overlap));
      const v=clamp(vin-vout),t=clamp((progress-s)/(e-s));
      videoStates.push({p:t,v});

      /* 只在数值真的变了才写样式：每帧无脑写会触发整棵子树重算，是卡顿主因 */
      const st=cache[i];
      const vs=v.toFixed(3),ts=t.toFixed(3);
      const dys=`${((1-vin)*28-vout*24).toFixed(0)}px`, scs=(1-(1-vin)*.008-vout*.008).toFixed(3);
      if(st.v!==vs){ l.style.setProperty('--v',vs); st.v=vs; }
      if(st.t!==ts){ l.style.setProperty('--t',ts); st.t=ts; }
      if(st.dy!==dys){ l.style.setProperty('--dy',dys); st.dy=dys; }
      if(st.sc!==scs){ l.style.setProperty('--sc',scs); st.sc=scs; }
      const live=v>.001?'1':'0';
      if(st.live!==live){ l.dataset.live=live; st.live=live; }
      const inert=i!==index;
      if(st.inert!==inert){ l.inert=inert; st.inert=inert; }
      if(st.aria!==inert){ l.setAttribute('aria-hidden',String(inert)); st.aria=inert; }

      /* 不可见的层不再逐帧遍历它的 .fx */
      if(v>.001){
        l.querySelectorAll('.fx').forEach(el=>{
          const cs=el.style;
          const start=parseFloat(cs.getPropertyValue('--i'))||0;
          const end=parseFloat(cs.getPropertyValue('--oi'))||2;
          const duration=parseFloat(cs.getPropertyValue('--od'))||.1;
          const hidden=t<=start||t>=end+duration;
          if(el._h!==hidden){ el.inert=hidden; el.setAttribute('aria-hidden',String(hidden)); el._h=hidden; }
        });
        if(i===0) window.FulwinPrologue?.set(t);
        if(i>=3&&i<=5&&!window.FulwinVideoScenes?.hasCar(chapters[i][1].toLowerCase()))window.FulwinCinema?.set(chapters[i][1].toLowerCase(),t);
      }
    });
    window.FulwinVideoScenes?.update(videoStates,false);
    const t=clamp((progress-ranges[1].s)/(ranges[1].e-ranges[1].s));
    layers[1].dataset.stage=t<.32?'1':t<.67?'2':'3';
    root.style.setProperty('--scroll',progress.toFixed(5));
    document.querySelector('.rail__fill').style.height=`${progress*100}%`;
    document.getElementById('progress-label').value=`${Math.round(progress*100)}%`;
    setActive(index,videoStates[index].p);
    if(pendingFocus===index&&+layers[index].style.getPropertyValue('--v')>.95){
      layers[index].focus({preventScroll:true});pendingFocus=-1;
    }
  }
  function frame(now) {
    frameId=0;
    if(document.hidden) {lastTime=0;return;}
    const dt=lastTime?Math.min(60,now-lastTime):16.7;
    lastTime=now;
    let target=clamp(scrollY/maxScroll());
    if(playing) {
      playPosition=clamp(playPosition+dt/layout.demoMs);
      target=playPosition;
      scrollTo({top:target*maxScroll(),behavior:'instant'});
      if(target>=.99999) {target=1;setPlaying(false);status.textContent='演示结束，可重新体验。';}
    }
    progress=reading?target:progress+(target-progress)*(1-Math.pow(.85,dt/16.7));
    if(Math.abs(progress-target)<.000002)progress=target;
    paint();
    if(playing||Math.abs(progress-target)>.000002)wake();else lastTime=0;
  }
  function wake() {if(!frameId)frameId=requestAnimationFrame(frame);}
  function setPlaying(value) {
    if(value&&!playing)playPosition=clamp(scrollY/maxScroll());
    playing=!!value&&!reading&&!document.querySelector('dialog[open]');
    play.setAttribute('aria-pressed',String(playing));
    play.querySelector('.play-symbol').textContent=playing?'Ⅱ':'▷';
    play.querySelector('.play-label').textContent=playing?'暂停演示':'自动演示';
    if(playing)wake();
  }
  function goTo(i,focus=false,at) {
    setPlaying(false);
    i=Math.max(0,Math.min(6,i));
    if(reading) {
      layers[i].scrollIntoView({behavior:'instant',block:'start'});
      setActive(i);
    } else {
      const {s,e}=ranges[i];
      scrollTo({top:(s+(e-s)*(Number.isFinite(at)?clamp(at):visits[i]))*maxScroll(),behavior:'smooth'});
      wake();
    }
    if(focus){if(reading)layers[i].focus({preventScroll:true});else pendingFocus=i;}
  }
  document.querySelectorAll('[data-go]').forEach(a=>a.addEventListener('click',e=>{
    e.preventDefault();goTo(Number(a.dataset.go),a.classList.contains('skip'),a.dataset.at===undefined?undefined:Number(a.dataset.at));
  }));
  function togglePlaying(){
    if(!playing&&progress>.998){scrollTo({top:0,behavior:'instant'});progress=0;}
    setPlaying(!playing);
  }
  play.addEventListener('click',togglePlaying);
  addEventListener('fulwin:design-open',()=>setPlaying(false));
  function openConcept(e) {
    restoreFocus=e.currentTarget;
    setPlaying(false);
    dialog.showModal();
    window.FulwinSound?.suspend();
  }
  document.querySelectorAll('[data-read]').forEach(b=>b.addEventListener('click',openConcept));
  document.getElementById('close-concept').addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    restoreFocus?.focus({preventScroll:true});
    window.FulwinSound?.resume();
    wake();
  });
  dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
  dialog.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const items=[...dialog.querySelectorAll('button,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  function syncMode() {
    const wasReading=reading;
    reading=manualReading||media.matches||innerHeight<540||(innerWidth<700&&innerHeight<700);
    root.classList.toggle('reading',reading);
    window.FulwinPrologue?.setReading(reading);
    if(reading)window.FulwinSound?.suspend();else if(wasReading)window.FulwinSound?.resume();
    if(reading) {
      setPlaying(false);
      layers.forEach(l=>{
        l.inert=false;l.removeAttribute('aria-hidden');
        l.querySelectorAll('.fx').forEach(el=>{el.inert=false;el.removeAttribute('aria-hidden');});
      });
    }
    if(wasReading!==reading&&active>=0) {
      if(reading)layers[active].scrollIntoView({behavior:'instant'});
      else {const r=ranges[active];progress=r.s+(r.e-r.s)*visits[active];scrollTo({top:progress*maxScroll(),behavior:'instant'});}
    }
    document.getElementById('reading-mode').textContent=manualReading?'返回沉浸体验':'切换静态阅读模式';
    document.getElementById('reading-mode').hidden=media.matches||innerHeight<540||(innerWidth<700&&innerHeight<700);
    paint();wake();
  }
  document.getElementById('reading-mode').addEventListener('click',()=>{
    manualReading=!manualReading;dialog.close();syncMode();
    status.textContent=reading?'已切换到静态阅读模式。':'已返回沉浸式体验。';
  });
  media.addEventListener('change',syncMode);
  document.addEventListener('keydown',e=>{
    if(document.querySelector('dialog[open]')||e.altKey||e.ctrlKey||e.metaKey||e.target.closest('input,textarea,select,[contenteditable="true"]'))return;
    if(e.key==='Escape'){setPlaying(false);return;}
    if(['ArrowDown','ArrowUp','PageDown','PageUp','Home','End'].includes(e.key))setPlaying(false);
    if(e.target.closest('button'))return;
    if(e.code==='Space'&&!reading){e.preventDefault();if(!e.repeat)togglePlaying();}
    else if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)&&!reading){
      e.preventDefault();
      if(story){const n=e.key==='Home'?0:e.key==='End'?story.length-1:Math.max(0,Math.min(story.length-1,activeAct+(e.key==='ArrowRight'?1:-1)));const act=story[n];goTo(act.layer,false,act.start+(act.end-act.start)*.12);}
      else goTo(e.key==='Home'?0:e.key==='End'?6:active+(e.key==='ArrowRight'?1:-1));
    } else if(['ArrowDown','ArrowUp','PageDown','PageUp'].includes(e.key))setPlaying(false);
  });
  ['wheel','touchstart','pointerdown'].forEach(name=>window.addEventListener(name,e=>{
    if(name==='wheel'||!e.target.closest('#play'))setPlaying(false);
  },{passive:true}));
  addEventListener('touchmove',()=>setPlaying(false),{passive:true});
  addEventListener('scroll',wake,{passive:true});
  addEventListener('resize',()=>{
    const widthChanged=innerWidth!==oldWidth;
    /* 手机地址栏伸缩只改变高度：不重排整页，也不反复切换阅读模式 */
    if(!reading&&(widthChanged||Math.abs(innerHeight-oldHeight)>140))scrollTo({top:progress*maxScroll(),behavior:'instant'});
    oldWidth=innerWidth;oldHeight=innerHeight;
    clearTimeout(resizeTimer);
    resizeTimer=setTimeout(()=>{
      const nextReading=manualReading||media.matches||innerHeight<540||(innerWidth<700&&innerHeight<700);
      if(widthChanged||nextReading!==reading)syncMode();
      else{paint();wake();}
    },120);
  });
  document.addEventListener('visibilitychange',()=>{
    setPlaying(false);lastTime=0;
    if(document.hidden)window.FulwinSound?.suspend();
    else {window.FulwinSound?.resume();wake();}
  });
  root.classList.add('js');
  syncMode();
  const requested=new URLSearchParams(location.search).get('at');
  const match=requested&&/^(\d+)@((?:\d+(?:\.\d*)?)|(?:\.\d+))$/.exec(requested);
  const hash=/^#s([0-6])$/.exec(location.hash);
  if(match&&!reading){
    const i=Math.min(6,Number(match[1])),r=ranges[i];
    progress=r.s+(r.e-r.s)*clamp(Number(match[2]));
    scrollTo({top:progress*maxScroll(),behavior:'instant'});
  } else if(hash)goTo(Number(hash[1]));
  else if(!reading)progress=clamp(scrollY/maxScroll());
  paint();wake();
})();


