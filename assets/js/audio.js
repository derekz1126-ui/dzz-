/* User-provided local MP3. Music starts on open when the browser allows it;
   if audible autoplay is blocked, the first pointer/key/scroll gesture starts it. */
(() => {
  'use strict';
  const button=document.getElementById('sound');
  const audio=document.getElementById('background-music');
  const hint=document.getElementById('sound-hint');
  if(!button||!audio)return;
  let enabled=true,suspended=false,blocked=false,generation=0,unlockArmed=false;
  audio.volume=.35;
  audio.muted=false;
  function reflect(){
    button.setAttribute('aria-pressed',String(enabled));
    button.querySelector('.sound-label').textContent=enabled?'音乐开':'音乐关';
    const action=enabled?'暂停':'播放';
    button.setAttribute('aria-label',`${action}背景音乐《千年之后》`);
    button.title=`${action}背景音乐：艾拉拉、Luv4 — 千年之后`;
  }
  function showHint(text){
    if(!hint)return;
    hint.textContent=text;
    hint.hidden=!text;
  }
  function wanted(){
    return enabled&&!suspended&&!document.hidden&&
      !document.getElementById('concept')?.open&&
      !document.getElementById('design-dialog')?.open;
  }
  function pause(){generation++;audio.pause();}
  function unavailable(){
    enabled=false;pause();blocked=false;reflect();showHint('');
    button.querySelector('.sound-label').textContent='音乐不可用';
    document.getElementById('experience-status').textContent='暂时无法播放背景音乐，可继续静音体验。';
  }
  async function start(){
    if(!wanted()){pause();return;}
    const request=++generation;
    try {
      await audio.play();
      if(request!==generation)return;
      blocked=false;
      showHint('');
      if(!wanted())audio.pause();
    } catch(error){
      if(request!==generation)return;
      if(error&&error.name==='NotAllowedError'){
        blocked=true;
        armUnlock();
        showHint('浏览器限制自动播放 · 点按任意处开始音乐');
      } else if(error&&error.name!=='AbortError'){
        unavailable();
      }
    }
  }
  function disarmUnlock(){
    ['pointerdown','touchstart','keydown','wheel'].forEach(name=>removeEventListener(name,unlock,true));
    unlockArmed=false;
  }
  function unlock(event){
    if(event?.target?.closest?.('#sound'))return;
    disarmUnlock();
    if(!blocked)return;
    blocked=false;
    void start();
  }
  function armUnlock(){
    if(unlockArmed)return;
    unlockArmed=true;
    ['pointerdown','touchstart','keydown','wheel'].forEach(name=>addEventListener(name,unlock,{capture:true,passive:true}));
  }
  function attempt(){
    if(enabled&&!blocked&&wanted())void start();
  }
  button.addEventListener('click',()=>{
    if(enabled&&blocked){
      blocked=false;
      void start();
      return;
    }
    enabled=!enabled;reflect();
    if(enabled)void start();else{pause();showHint('');}
  });
  hint?.addEventListener('click',()=>{
    if(!enabled||!blocked)return;
    blocked=false;
    void start();
  });
  audio.addEventListener('playing',()=>{
    blocked=false;
    showHint('');
  });
  audio.addEventListener('error',()=>{if(enabled)unavailable();});
  window.FulwinSound={
    suspend(){suspended=true;pause();showHint('');},
    resume(){suspended=false;if(enabled)void start();}
  };
  addEventListener('pageshow',attempt);
  reflect();
  attempt();
  document.addEventListener('DOMContentLoaded',attempt,{once:true});
  addEventListener('load',attempt,{once:true});
})();
