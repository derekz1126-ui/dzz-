'use strict';
const idols = [...(window.SHORTLIST || []), ...(window.IDOLS || [])].filter((item,index,list) => list.findIndex(other => other.id === item.id || (other.latin.toLowerCase() === item.latin.toLowerCase() && other.group.toLowerCase() === item.group.toLowerCase())) === index);
const byId = new Map(idols.map(idol => [idol.id, idol]));
const covers = window.COVERS?.length ? window.COVERS.slice(0, 3) : ['karina','wonyoung','yuqi'].map(id=>byId.get(id)).filter(Boolean);
const main = document.querySelector('#main');
const modal = document.querySelector('#modal');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = (key, cls = '') => '<svg aria-hidden="true" class="ic ' + cls + '"><use href="#i-' + key + '"/></svg>';
const img = (item, eager = false) => '<img src="' + esc(item.image) + '" alt="' + esc(item.name) + '" ' + (eager ? '' : 'loading="lazy" ') + 'decoding="async">';
const storageKey = 'pickbeat.topnine.v1';
const groups = [...new Set(idols.map(i => i.group))];
const ordered = (ids) => [...new Set(Array.isArray(ids) ? ids : [])].filter(id => byId.has(id));
const exactBoard = ids => ordered(ids).length === 9;
let session = {draft:null,boards:[]};
let storageWarning = false;
try {
  const saved = JSON.parse(localStorage.getItem(storageKey) || '{}');
  session.boards = (Array.isArray(saved.boards) ? saved.boards : []).filter(b => b && typeof b.id === 'string' && Number.isFinite(b.date) && exactBoard(b.ids)).map(b => ({...b,ids:ordered(b.ids)}));
  session.draft = restoreDraft(saved.draft);
} catch { /* A new session also works when browser storage is unavailable. */ }
let selectedSlot = null;
let query = '', groupFilter = '', currentBoard = null, posterURL = '', toastTimer;
function persist(){
  try { localStorage.setItem(storageKey, JSON.stringify(session)); }
  catch { if(!storageWarning){storageWarning = true; toast('浏览器存储不可用，可在本次浏览中继续并保存结果图。');} }
}
function toast(message){
  const notice = document.querySelector('#notice');
  notice.textContent = message; notice.className = 'toast-show';
  clearTimeout(toastTimer); toastTimer = setTimeout(() => notice.className = '', 3100);
}
function showModal(title, html){
  if(modal.open) modal.close();
  document.querySelector('#modal-title').textContent = title;
  document.querySelector('#modal-body').innerHTML = html;
  modal.showModal();
}
modal.addEventListener('click', e => {if(e.target === modal && !e.target.closest('#modal-body') && (e.clientX < modal.getBoundingClientRect().left || e.clientX > modal.getBoundingClientRect().right || e.clientY < modal.getBoundingClientRect().top || e.clientY > modal.getBoundingClientRect().bottom)) modal.close();});
function link(url, label){
  return /^https?:\/\//i.test(url || '') ? '<a href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+'</a>' : esc(label);
}
function credit(item){
  return link(item.source, '原图') + ' · ' + esc(item.credit) + ' · ' + link(item.licenseUrl,item.license || '许可');
}
function detail(id){
  const item = byId.get(id);
  if(item) showModal(item.name, '<img class="detail-img" src="'+esc(item.image)+'" alt="'+esc(item.name)+'"><div class="detail-group">'+esc(item.latin)+' · '+esc(item.group)+'</div><div class="detail-credit">'+credit(item)+'</div>');
}
function featured(){
  const picked = [];
  const preferred = ['wonyoung','karina','jennie','sana','yuqi','yuna','sakura'];
  const pool = [...preferred.map(name => idols.find(i => i.latin?.toLowerCase() === name)).filter(Boolean),...idols];
  for(const idol of pool) if(!picked.some(i => i.group === idol.group)) picked.push(idol);
  for(const idol of pool) if(!picked.includes(idol)) picked.push(idol);
  return picked.slice(0,5);
}
function card(item, action='detail', {chosen=false,eager=false,index=null}={}){
  const interactive = action !== 'static';
  const tag = interactive ? 'button' : 'div';
  const pressed = ['pick','swap','nominate'].includes(action) ? ' aria-pressed="'+chosen+'"' : '';
  const rank = index === null ? '' : '<b class="rank-pin">'+String(index+1).padStart(2,'0')+'</b>';
  const symbol = ['pick','nominate'].includes(action) ? '<span class="pick-toggle">'+icon(chosen ? 'check' : 'heart')+'</span>' : action === 'detail' ? '<span class="photo-icon">'+icon('up')+'</span>' : '';
  return '<'+tag+' class="idol-card'+(chosen?' chosen':'')+'"'+(interactive ? ' data-action="'+action+'" data-id="'+esc(item.id)+'"' : '')+pressed+'><div class="idol-face">'+img(item,eager)+rank+symbol+'</div><div class="card-info"><strong class="card-name">'+esc(item.name)+'</strong><span class="group">'+esc(item.group)+'</span></div></'+tag+'>';
}
function home(){
  const line = ['one','two','three'];
  const photos = covers.map((p,i) => '<figure class="polaroid photo-'+line[i]+'">'+img(p,true)+'<figcaption><span>'+esc(p.latin || p.name)+'</span>'+icon('heart')+'</figcaption></figure>').join('');
  main.innerHTML = '<div class="wrap"><section class="hero"><div class="hero-copy"><div class="feature-line"><span class="feature-tag">'+icon('spark')+'本期主打</span><span class="eng">K-POP GIRL GROUPS</span></div><h1><span class="latin-hero">K-POP</span> 女团<br><span class="popword">心动九选</span></h1><p>哪一张脸，让你一眼心动？<br>翻开爱豆小卡，选出你的专属 TOP 9。</p><div class="hero-actions"><button class="primary" data-action="start">'+icon('heart')+(session.draft?'继续上次挑选':'开始心动挑战')+icon('arrow')+'</button></div></div><div class="hero-art"><div class="collage">'+photos+'<img aria-hidden="true" class="spark-art" src="assets/doodle.svg" alt=""><img aria-hidden="true" class="sticker top-sticker" src="assets/top-nine.svg" alt=""><img aria-hidden="true" class="sticker heart-art" src="assets/heart.svg" alt="">'+icon('spark','spark-small')+'</div></div></section><section class="preview-section"><div class="section-head"><div><div class="section-kicker" lang="en">IDOL ARCHIVE</div><h2>爱豆图鉴<span class="count-label">共 '+idols.length+' 位成员</span></h2></div><a class="small-link" href="#library">查看全部 '+icon('arrow')+'</a></div><div class="preview-grid">'+featured().map(item => card(item,'detail',{eager:true})).join('')+'</div></section></div>';
}
const backHome = '<a href="#home" class="back">'+icon('left')+'返回首页</a>';
function library(){
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">IDOL ARCHIVE</div><h1>爱豆图鉴</h1><p>浏览 '+idols.length+' 位成员的小卡，点开照片查看详情。</p></div><div class="page-tools"><label class="searchbox">'+icon('search')+'<input id="search" type="search" value="'+esc(query)+'" aria-label="搜索成员或组合" placeholder="搜索成员或组合"></label><select aria-label="按组合筛选" id="group-filter"><option value="">全部组合</option>'+groups.map(g=>'<option '+(groupFilter===g?'selected ':'')+'value="'+esc(g)+'">'+esc(g)+'</option>').join('')+'</select><span class="status-text" id="found" aria-live="polite"></span></div><div id="lib-cards" class="library-grid"></div></div>';
  filterCards();
  document.querySelector('#search').addEventListener('input', e=>{query=e.target.value;filterCards();});
  document.querySelector('#group-filter').addEventListener('change',e=>{groupFilter=e.target.value;filterCards();});
}
function filterCards(){
  const normal = s => (s || '').toLowerCase().replace(/[\s\-_]/g,'');
  const list = idols.filter(i => (!groupFilter || i.group === groupFilter) && [i.name,i.latin,i.group,i.aliases?.toString()].some(v=>normal(v).includes(normal(query))));
  document.querySelector('#lib-cards').innerHTML = list.length ? list.map(i=>card(i)).join('') : '<p>没有找到匹配的成员。<button class="plain" data-action="clear-filter">清除筛选</button></p>';
  document.querySelector('#found').textContent = list.length+' 位成员';
}
function swapSlot(id){
  const draft = session.draft;
  if(!draft || !draft.ids.includes(id)) return;
  if(selectedSlot && selectedSlot !== id){
    const a=draft.ids.indexOf(selectedSlot), b=draft.ids.indexOf(id);
    [draft.ids[a],draft.ids[b]]=[draft.ids[b],draft.ids[a]];
    selectedSlot=null;persist();
  } else selectedSlot = selectedSlot ? null : id;
  sortView();
  main.querySelector('[data-id="'+CSS.escape(id)+'"]')?.focus({preventScroll:true});
}
function sortView(){
  const draft = session.draft;
  if(!draft || !exactBoard(draft.ids)) return go('play');
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">FINAL LINEUP</div><h1>排出你的心动顺位</h1><p>依次点两张小卡交换位置，左上角就是你的第一名。</p></div><div class="rank-prompt" role="status">'+(selectedSlot?'已选 '+esc(byId.get(selectedSlot).name)+'，点另一张交换位置。':'当前顺序从左到右、从上到下。')+'</div><div class="sort-grid">'+draft.ids.map((id,index)=>'<div class="sort-slot '+(selectedSlot===id?'selected':'')+'">'+card(byId.get(id),'swap',{index,chosen:selectedSlot===id})+'</div>').join('')+'</div><div class="actions"><button class="primary" data-action="finish">生成我的九宫格 '+icon('arrow')+'</button><button class="outline" data-action="revise">调整入选成员</button></div></div>';
}
function finish(){
  if(!session.draft || !exactBoard(session.draft.ids)) return;
  const id = 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const board = {id,date:Date.now(),ids:[...session.draft.ids]};
  session.boards.unshift(board);session.draft=null;persist();go('result/'+id);
}
function results(board){
  currentBoard=board;
  const date = new Date(board.date).toLocaleDateString('zh-CN');
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">MY TOP NINE</div><h1>我的心动九宫格</h1><p>'+esc(date)+' · K-POP 女团心动九选</p></div><div class="result-layout"><div class="result-grid">'+board.ids.map((id,index)=>'<div class="sort-slot">'+card(byId.get(id),'static',{index,eager:true})+'</div>').join('')+'</div><aside class="result-info"><h2>把心动存下来</h2><p>保存一张带名字的九宫格，发给朋友看看你们有几位同担。</p><div class="actions"><button class="primary" data-action="poster">'+icon('download')+'保存结果图</button><button class="outline" data-action="copy">复制榜单文字</button></div><a class="plain" href="#boards">查看我的榜单</a></aside></div></div>';
}
function boards(){
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">MY COLLECTION</div><h1>我的榜单</h1><p>这台设备上完成的九宫格，都收在这里。</p></div>'+(session.boards.length?'<div class="board-list">'+session.boards.map(b=>'<article class="board-card"><a href="#result/'+esc(b.id)+'" aria-label="查看 '+esc(byId.get(b.ids[0]).name)+' 居首的榜单"><div class="board-mini">'+b.ids.map(id=>img(byId.get(id))).join('')+'</div><h3>'+esc(byId.get(b.ids[0]).name)+' 领衔的 TOP 9</h3></a><div class="status-text">'+esc(new Date(b.date).toLocaleString('zh-CN',{hour12:false}))+'</div><div class="actions"><a class="small-link" href="#result/'+esc(b.id)+'">查看榜单 '+icon('arrow')+'</a><button class="plain" data-action="delete-ask" data-id="'+esc(b.id)+'">删除</button></div></article>').join('')+'</div>':'<div class="empty">'+icon('grid','big')+'<p>这里还没有榜单。先挑出让你心动的九位成员吧。</p><button class="primary" data-action="start">开始挑选 '+icon('arrow')+'</button></div>')+'</div>';
}
async function makePoster(){
  const board=currentBoard;
  if(!board) return;
  showModal('保存结果图','<p role="status">正在排版九宫格…</p>');
  const portraits = board.ids.map(id=>byId.get(id));
  try {
    const photos=await Promise.all(portraits.map(item=>new Promise((resolve,reject)=>{const photo=new Image();photo.onload=()=>resolve(photo);photo.onerror=reject;photo.src=item.image;})));
    const canvas=document.createElement('canvas');
    canvas.width=1080;canvas.height=1450;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#eee4fa';ctx.fillRect(0,0,1080,1450);
    ctx.fillStyle='#7847be';ctx.font='bold 24px Arial';ctx.fillText('PICKBEAT  /  MY TOP NINE',48,57);
    ctx.fillStyle='#30213d';ctx.font='bold 60px "Microsoft YaHei", sans-serif';ctx.fillText('我的心动九宫格',43,134);
    const size=316, gap=18;
    portraits.forEach((item,index)=>{
      const x=48+index%3*(size+gap),y=175+Math.floor(index/3)*379,photo=photos[index];
      const crop=Math.min(photo.naturalWidth,photo.naturalHeight);
      ctx.fillStyle='#fff';ctx.fillRect(x,y,size,360);
      ctx.drawImage(photo,(photo.naturalWidth-crop)/2,Math.max(0,(photo.naturalHeight-crop)*.3),crop,crop,x,y,size,size);
      ctx.fillStyle=index===0?'#dcfa8c':'#372540';ctx.fillRect(x+9,y+9,50,40);
      ctx.fillStyle=index===0?'#30213d':'#fff';ctx.font='bold 25px Arial';ctx.fillText(String(index+1).padStart(2,'0'),x+19,y+38);
      ctx.fillStyle='#2a1e33';ctx.font='bold 22px "Microsoft YaHei",sans-serif';ctx.fillText(item.name,x+12,y+346,size*.59);
      ctx.textAlign='right';ctx.fillStyle='#71647d';ctx.font='bold 13px Arial';ctx.fillText(item.group,x+size-10,y+344,size*.34);ctx.textAlign='left';
    });
    ctx.fillStyle='#58496a';ctx.font='bold 22px "Microsoft YaHei",sans-serif';ctx.fillText('心动研究所  /  K-POP 女团心动九选',48,1335);
    ctx.font='15px "Microsoft YaHei",sans-serif';
    portraits.forEach((item,i)=>{const x=48+(i%3)*334,y=1371+Math.floor(i/3)*23;ctx.fillText((i+1)+'. '+item.credit+' · '+item.license,x,y,312);});
    if(posterURL.startsWith('blob:')) URL.revokeObjectURL(posterURL);
    posterURL = await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(URL.createObjectURL(blob)):reject(new Error('export')),'image/png'));
    if(!modal.open) return;
    showModal('保存结果图','<img class="poster-preview" src="'+esc(posterURL)+'" alt="我的心动九宫格海报"><p class="poster-note">手机上可以长按图片保存或分享。</p><a class="primary" href="'+esc(posterURL)+'" download="我的心动九宫格.png">'+icon('download')+'下载 PNG</a>');
  } catch {
    if(modal.open) showModal('图片暂时无法导出','<p>可直接截取结果页的九宫格，或复制榜单文字发给朋友。</p><button class="outline" data-action="close">返回结果</button>');
  }
}
async function copyBoard(){
  if(!currentBoard) return;
  const message='我的 K-POP 女团心动 TOP 9\n'+currentBoard.ids.map((id,i)=>{const item=byId.get(id);return (i+1)+'. '+item.name+' · '+item.group;}).join('\n')+'\n来自「心动研究所」';
  try {await navigator.clipboard.writeText(message);toast('榜单文字已复制');}
  catch {showModal('复制榜单文字','<textarea aria-label="榜单文字" readonly style="width:100%;height:260px">'+esc(message)+'</textarea>');modal.querySelector('textarea').select();}
}
function resetDraft(){
  session.draft=newDraft();selectedSlot=null;persist();go('play');
}
function go(route){
  if(location.hash === '#'+route) routePage();
  else location.hash=route;
}
function routePage(){
  if(modal.open) modal.close();
  const [view, id]=(location.hash.slice(1)||'home').split('/');
  currentBoard=null; selectedSlot=null;
  const nav = view==='result'?'boards':view==='play'?'home':view;
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(view==='library') library();
  else if(view==='boards') boards();
  else if(view==='result'){const b=session.boards.find(b=>b.id===id);if(b) results(b);else return go('boards');}
  else if(view==='play'){
    if(idols.length<9){home();toast('成员小卡尚未载入，请刷新后再试。');return;}
    if(!session.draft){session.draft=newDraft();persist();}
    play();
  }
  else home();
  window.scrollTo({top:0,behavior:'instant'});
}
window.addEventListener('hashchange',()=>{routePage();main.focus({preventScroll:true});});
document.addEventListener('click',e=>{
  const btn=e.target.closest('[data-action]');
  if(!btn || btn.disabled) return;
  const {action,id}=btn.dataset;
  if(action==='close') modal.close();
  else if(action==='start') go('play');
  else if(action==='help') showHelp();
  else if(action==='credits') {
    const all=[...idols,...covers].filter((p,i,a)=>a.findIndex(x=>x.source===p.source && x.image===p.image)===i);
    showModal('图片来源与许可','<p class="privacy">成员与封面照片均附原始文件和授权链接。站内小卡和结果图对照片做了裁切或缩放。</p><ol class="credits">'+all.map(p=>'<li><b>'+esc(p.name)+'</b><br>'+credit(p)+'</li>').join('')+'</ol>');
  } else if(action==='detail') detail(id);
  else if(action==='clear-filter'){query='';groupFilter='';library();}
  else if(action==='swap') swapSlot(id);
  else if(action==='finish') finish();
  else if(action==='poster') makePoster();
  else if(action==='copy') copyBoard();
  else if(action==='delete-ask') showModal('删除这张榜单？','<p>删除后无法从本机恢复。</p><div class="actions"><button class="outline" data-action="close">保留</button><button class="primary" data-action="delete" data-id="'+esc(id)+'">确认删除</button></div>');
  else if(action==='delete'){session.boards=session.boards.filter(b=>b.id!==id);persist();modal.close();boards();}
  else if(action==='restart-ask') showModal('重新开始挑选？','<p>本轮进度将清空，已完成的榜单会保留。</p><div class="actions"><button class="outline" data-action="close">继续本轮</button><button class="primary" data-action="restart">重新开始</button></div>');
  else if(action==='restart'){modal.close();resetDraft();}
  else playAction(action,id);
});

// Each loss links a member to the preferred member. Once the winner takes
// a rank, everyone they directly beat returns to compete for the next rank.
function replay(deck, history){
  const pending=[...deck], defeated=new Map(deck.map(id=>[id,[]])), ranked=[];
  let used=0;
  while(pending.length && ranked.length<9){
    if(pending.length===1){
      const winner=pending.shift();
      ranked.push(winner);
      pending.push(...defeated.get(winner));
      continue;
    }
    const match=pending.slice(0,Math.min(3,pending.length));
    const winner=history[used];
    if(!match.includes(winner)) return {ranked,match,used,remaining:pending.length};
    used++;
    pending.splice(0,match.length);
    defeated.get(winner).push(...match.filter(id=>id!==winner));
    pending.push(winner);
  }
  return {ranked,match:[],used,remaining:pending.length};
}
function newDraft(){
  const deck=idols.map(i=>i.id);
  for(let i=deck.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [deck[i],deck[j]]=[deck[j],deck[i]];
  }
  return {deck,history:[],ids:[],stage:'match'};
}
function restoreDraft(raw){
  if(!raw || !Array.isArray(raw.deck) || !Array.isArray(raw.history)) return null;
  const deck=ordered(raw.deck);
  if(deck.length<9 || deck.length!==raw.deck.length) return null;
  const state=replay(deck,raw.history);
  const draft={deck,history:raw.history.slice(0,state.used),ids:[],stage:'match'};
  if(state.ranked.length===9){
    draft.ids=exactBoard(raw.ids) && raw.ids.length===9 && raw.ids.every(id=>state.ranked.includes(id)) ? [...raw.ids] : state.ranked;
    draft.stage='sort';
  }
  return draft;
}
function showHelp(){
  showModal('怎么玩','<ol class="help-steps"><li><b><span>01</span>凭第一眼选小卡</b>每轮会出现两到三位成员，点一下最让你心动的那张。</li><li><b><span>02</span>选出九位本命</b>暂时落选的成员还有机会争取后续名次。选完后，可以交换小卡调整最终顺位。</li><li><b><span>03</span>生成你的九宫格</b>保存结果图或复制文字，把你的 TOP 9 分享给朋友。</li></ol><p class="privacy">'+icon('lock')+' 选择和榜单仅保存在当前浏览器。</p><button class="primary" data-action="close">知道了</button>');
}
function play(){
  const draft=session.draft;
  if(draft.stage==='sort') return sortView();
  const state=replay(draft.deck,draft.history);
  if(state.ranked.length===9){
    draft.ids=state.ranked;draft.stage='sort';persist();return sortView();
  }
  const rank=state.ranked.length+1;
  main.innerHTML='<div class="wrap page match-page">'+backHome+'<div class="match-title"><div class="page-head"><div class="section-kicker">PICK YOUR BIAS</div><h1>谁让你更心动？</h1><p>点选最喜欢的一张小卡。</p></div><span class="round-badge">第 '+(draft.history.length+1)+' 轮</span></div><div class="match-progress" aria-label="已选出 '+(rank-1)+' 位，共九位">'+Array.from({length:9},(_,i)=>'<span class="'+(i<rank-1?'done':i===rank-1?'working':'')+'"></span>').join('')+'</div><div class="match-meta"><span>正在选第 <b>'+String(rank).padStart(2,'0')+'</b> 位</span><span>已确定 '+(rank-1)+' / 9</span></div><div class="match-cards">'+state.match.map(id=>card(byId.get(id),'vote',{eager:true})).join('')+'</div><div class="match-controls"><button class="outline" data-action="undo" '+(draft.history.length?'':'disabled')+'>'+icon('back')+'撤销上次选择</button><button class="plain" data-action="restart-ask">重新开始</button></div></div>';
}
function playAction(action,id){
  const draft=session.draft;
  if(!draft) return;
  if(action==='vote' && draft.stage==='match'){
    if(!replay(draft.deck,draft.history).match.includes(id))return;
    draft.history.push(id);
  } else if(action==='undo' && draft.history.length){
    draft.history.pop();
  } else if(action==='revise'){
    draft.history.pop();draft.stage='match';draft.ids=[];selectedSlot=null;
  } else return;
  persist();play();
  if(action==='vote' || action==='revise') main.querySelector('.match-title h1, .page-head h1')?.setAttribute('tabindex','-1');
  if(action==='vote' || action==='revise') main.querySelector('h1')?.focus({preventScroll:true});
}
routePage();
