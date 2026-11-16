'use strict';
const boys = new URLSearchParams(location.search).get('pool') === 'boys';
const poolId = boys ? 'boys' : 'girls';
const groupLabel = boys ? '男团' : '女团';
const idols = boys ? window.BOYS_SHORTLIST : window.SHORTLIST;
const covers = boys ? window.BOYS_PHOTO_SETS : window.PHOTO_SETS;
const pastMembers = boys ? [] : window.PAST_MEMBERS;
const byId = new Map([...pastMembers, ...idols].map(idol => [idol.id, idol]));
const photoSet = new Map(covers.map(set => [set.group,set]));
let coverIndex = 0;
const main = document.querySelector('#main');
const modal = document.querySelector('#modal');
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const icon = (key, cls = '') => '<svg aria-hidden="true" class="ic ' + cls + '"><use href="#i-' + key + '"/></svg>';
const img = (item, eager = false) => item.image ? '<img src="' + esc(item.image) + '" alt="' + esc(item.latin || item.name) + '" ' + (eager ? '' : 'loading="lazy" ') + 'decoding="async">' : '<span class="archive-name" aria-label="往期成员">'+esc(item.latin)+'</span>';
const storageKey = boys ? 'pickbeat.topnine.boys.v1' : 'pickbeat.topnine.v1';
const podiumOrder = [3,4,5,1,0,2,6,7,8];
const groups = [...new Set(covers.flatMap(set => set.family ? [set.family,set.group] : [set.group]))];
const memberLabel = item => item.units ? item.units.join(' · ') : item.group;
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
try {
  const filters=JSON.parse(sessionStorage.getItem(storageKey+'.filters') || '{}');
  if(typeof filters.query==='string') query=filters.query;
  if(groups.includes(filters.group)) groupFilter=filters.group;
} catch { /* Filters can still be used without browser storage. */ }
function saveFilters(){
  try { sessionStorage.setItem(storageKey+'.filters',JSON.stringify({query,group:groupFilter})); }
  catch { /* The current page already holds both values. */ }
}
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
  return [esc(item.credit), link(item.source, '发布来源'), link(item.original, '高清原图')].join(' · ');
}
function heatNote(set){
  if(!set?.heat) return '';
  const {platform, metric, choices, scope}=set.heat;
  return '<details class="heat-note"><summary>为什么选这套写真？</summary><p>'+esc(platform)+' · '+esc(scope || '套图帖')+' · '+esc(metric)+'快照</p><ul>'+choices.map(c=>'<li>'+link(c.url,c.label)+'<b>'+esc(c.score.toLocaleString('zh-CN'))+'</b></li>').join('')+'</ul></details>';
}
function galleryPhoto(item){
  const version = item.unitPhotos?.[groupFilter];
  return version ? {...item,...version} : item;
}
function detail(id){
  const member = byId.get(id);
  if(!member) return;
  const item = location.hash.split('/')[0] === '#library' ? galleryPhoto(member) : member;
  const set=photoSet.get(item.group);
  showModal(item.latin, '<img class="detail-img" src="'+esc(item.full || item.image)+'" alt="'+esc(item.latin)+'"><div class="detail-group">'+esc(memberLabel(item))+'</div><div class="detail-credit">'+esc(item.series || set?.name)+' · '+credit(item)+'</div>'+heatNote(item.series ? item : set)+(set ? (item.units || [item.group]).map(group=>'<button class="outline group-open" data-action="group-photo" data-id="'+esc(group)+'">'+icon('image')+(item.units?.length>1 ? esc(group)+' 团照' : '查看完整团体写真')+'</button>').join('') : ''));
}
function groupPhoto(group){
  const set=photoSet.get(group);
  if(set) showModal(set.group+' 团体写真','<img class="group-full" src="'+esc(set.image)+'" alt="'+esc(set.group)+' 完整合照"><p class="detail-group">'+esc(set.name)+'</p><div class="detail-credit">'+credit(set)+'</div>'+heatNote(set));
}
function coverCard(){
  const set=covers[coverIndex];
  return '<div class="group-print"><button class="group-shot" data-action="group-photo" data-id="'+esc(set.group)+'" aria-label="放大 '+esc(set.group)+' 团体写真">'+img(set,true)+'</button><div class="print-caption"><div><b>'+esc(set.group)+'</b><span>'+esc(set.name)+'</span></div><div class="cover-nav"><button data-action="prev-cover" aria-label="上一组团体写真">'+icon('left')+'</button><span>'+(coverIndex+1)+' / '+covers.length+'</span><button data-action="next-cover" aria-label="下一组团体写真">'+icon('arrow')+'</button></div></div></div>';
}
function featured(){
  const picked = [];
  const preferred = boys ? ['jung kook','jaemin','felix','yeonjun','mingyu','wonbin','sunghoon'] : ['wonyoung','karina','jennie','sana','yuqi','yuna','sakura'];
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
  return '<'+tag+' class="idol-card'+(chosen?' chosen':'')+'"'+(interactive ? ' data-action="'+action+'" data-id="'+esc(item.id)+'"' : '')+pressed+'><div class="idol-face">'+img(item,eager)+rank+symbol+'</div><div class="card-info"><strong class="card-name">'+esc(item.latin)+'</strong><span class="group">'+esc(memberLabel(item))+'</span></div></'+tag+'>';
}
function home(){
  main.innerHTML = '<div class="wrap"><section class="hero"><div class="hero-copy"><div class="feature-line"><span class="feature-tag">'+icon('spark')+'团体写真特辑</span><span class="eng">K-POP '+(boys?'BOY GROUPS':'GIRL GROUPS')+'</span></div><h1><span class="latin-hero">K-POP</span> '+groupLabel+'<br><span class="popword">心动九选</span></h1><p>翻开'+groupLabel+'写真集。<br>从成员小卡里，选出你的专属 TOP 9。</p><div class="hero-actions"><button class="primary" data-action="start">'+icon('heart')+(session.draft?.format===2?'继续上次挑选':session.draft?'继续旧版挑选':'开始心动挑战')+icon('arrow')+'</button>'+(session.draft && session.draft.format!==2?'<button class="outline" data-action="restart-ask">开始新版挑战</button>':'')+'</div></div><div class="editorial-art"><div id="cover-card">'+coverCard()+'</div></div></section><section class="preview-section"><div class="section-head"><div><div class="section-kicker" lang="en">IDOL ARCHIVE</div><h2>'+groupLabel+'图鉴<span class="count-label">共 '+idols.length+' 位成员</span></h2></div><a class="small-link" href="#library">查看全部 '+icon('arrow')+'</a></div><div class="preview-grid">'+featured().map(item => card(item,'detail',{eager:true})).join('')+'</div></section></div>';
}
const backHome = '<a href="#home" class="back">'+icon('left')+'返回首页</a>';
function library(){
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">IDOL ARCHIVE</div><h1>'+groupLabel+'图鉴</h1><p>浏览 '+idols.length+' 位成员的小卡，点开照片查看详情。</p></div><div class="page-tools"><label class="searchbox">'+icon('search')+'<input id="search" type="search" value="'+esc(query)+'" aria-label="搜索成员或组合" placeholder="搜索成员或组合"></label><select aria-label="按组合筛选" id="group-filter"><option value="">全部组合</option>'+groups.map(g=>'<option '+(groupFilter===g?'selected ':'')+'value="'+esc(g)+'">'+esc(g==='NCT'?'NCT（全团）':g)+'</option>').join('')+'</select><span class="status-text" id="found" aria-live="polite"></span></div><div id="lib-cards" class="library-grid"></div></div>';
  filterCards();
  document.querySelector('#search').addEventListener('input', e=>{query=e.target.value;filterCards();saveFilters();});
  document.querySelector('#group-filter').addEventListener('change',e=>{
    groupFilter=e.target.value;
    if(location.hash.startsWith('#library/')) history.replaceState(null,'','#library');
    filterCards();saveFilters();
  });
}
function filterCards(){
  const normal = s => s.normalize('NFKD').replace(/\p{M}/gu,'').toLowerCase().replace(/[\s_-]/g,'');
  const needle = normal(query);
  const list = idols.filter(item => {
    const memberships = item.units || [item.group];
    const matchesGroup = !groupFilter || item.family === groupFilter || memberships.includes(groupFilter);
    const terms = [item.name,item.latin,...memberships,...(item.aliases || [])];
    if(item.family) terms.push(item.family);
    return matchesGroup && terms.some(value=>normal(value).includes(needle));
  });
  document.querySelector('#lib-cards').innerHTML = list.length ? list.map(i=>card(galleryPhoto(i))).join('') : '<p>没有找到匹配的成员。<button class="plain" data-action="clear-filter">清除筛选</button></p>';
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
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">FINAL LINEUP</div><h1>排出你的心动顺位</h1><p>依次点两张小卡交换位置，左上角就是你的第一名。</p></div><div class="rank-prompt" role="status">'+(selectedSlot?'已选 '+esc(byId.get(selectedSlot).latin)+'，点另一张交换位置。':'当前顺序从左到右、从上到下。')+'</div><div class="sort-grid">'+draft.ids.map((id,index)=>'<div class="sort-slot '+(selectedSlot===id?'selected':'')+'">'+card(byId.get(id),'swap',{index,chosen:selectedSlot===id})+'</div>').join('')+'</div><div class="actions"><button class="primary" data-action="finish">生成我的九宫格 '+icon('arrow')+'</button><button class="outline" data-action="revise">调整入选成员</button></div></div>';
}
function finish(ids=session.draft?.ids){
  if(!session.draft || !exactBoard(ids)) return;
  const id = 'b'+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
  const board = {id,date:Date.now(),ids:[...ids]};
  session.boards.unshift(board);session.draft=null;persist();go('result/'+id);
}
function results(board){
  currentBoard=board;
  const date = new Date(board.date).toLocaleDateString('zh-CN');
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">MY TOP NINE</div><h1>我的心动九宫格</h1><p>'+esc(date)+' · K-POP '+groupLabel+'心动九选</p></div><div class="result-layout"><div class="result-grid">'+podiumOrder.map(index=>'<div class="sort-slot">'+card(byId.get(board.ids[index]),'static',{index,eager:true})+'</div>').join('')+'</div><aside class="result-info"><h2>把心动存下来</h2><p>保存一张带名字的九宫格，发给朋友看看你们有几位同担。</p><div class="actions"><button class="primary" data-action="poster">'+icon('download')+'保存结果图</button><button class="outline" data-action="copy">复制榜单文字</button></div><a class="plain" href="#boards">查看我的榜单</a></aside></div></div>';
}
function boards(){
  main.innerHTML = '<div class="wrap page">'+backHome+'<div class="page-head"><div class="section-kicker">MY COLLECTION</div><h1>我的'+groupLabel+'榜单</h1><p>这台设备上完成的九宫格，都收在这里。</p></div>'+(session.boards.length?'<div class="board-list">'+session.boards.map(b=>'<article class="board-card"><a href="#result/'+esc(b.id)+'" aria-label="查看 '+esc(byId.get(b.ids[0]).latin)+' 居首的榜单"><div class="board-mini">'+podiumOrder.map(index=>img(byId.get(b.ids[index]))).join('')+'</div><h3>'+esc(byId.get(b.ids[0]).latin)+' 领衔的 TOP 9</h3></a><div class="status-text">'+esc(new Date(b.date).toLocaleString('zh-CN',{hour12:false}))+'</div><div class="actions"><a class="small-link" href="#result/'+esc(b.id)+'">查看榜单 '+icon('arrow')+'</a><button class="plain" data-action="delete-ask" data-id="'+esc(b.id)+'">删除</button></div></article>').join('')+'</div>':'<div class="empty">'+icon('grid','big')+'<p>这里还没有榜单。先挑出让你心动的九位成员吧。</p><button class="primary" data-action="start">开始挑选 '+icon('arrow')+'</button></div>')+'</div>';
}
async function makePoster(){
  const board=currentBoard;
  if(!board) return;
  showModal('保存结果图','<p role="status">正在排版九宫格…</p>');
  const portraits = board.ids.map(id=>byId.get(id));
  try {
    const photos=await Promise.all(portraits.map(item=>item.image ? new Promise((resolve,reject)=>{const photo=new Image();photo.onload=()=>resolve(photo);photo.onerror=reject;photo.src=item.image;}) : null));
    const canvas=document.createElement('canvas');
    canvas.width=1080;canvas.height=1450;
    const ctx=canvas.getContext('2d');
    ctx.fillStyle='#eee4fa';ctx.fillRect(0,0,1080,1450);
    ctx.fillStyle='#7847be';ctx.font='bold 24px Arial';ctx.fillText('PICKBEAT  /  MY TOP NINE',48,57);
    ctx.fillStyle='#30213d';ctx.font='bold 60px "Microsoft YaHei", sans-serif';ctx.fillText('我的心动九宫格',43,134);
    const size=316, gap=18;
    podiumOrder.forEach((index,slot)=>{
      const item=portraits[index],photo=photos[index];
      const x=48+slot%3*(size+gap),y=175+Math.floor(slot/3)*379;
      ctx.fillStyle='#fff';ctx.fillRect(x,y,size,360);
      if(photo){
        const crop=Math.min(photo.naturalWidth,photo.naturalHeight);
        ctx.drawImage(photo,(photo.naturalWidth-crop)/2,Math.max(0,(photo.naturalHeight-crop)*.3),crop,crop,x,y,size,size);
      } else {
        ctx.fillStyle='#e7daef';ctx.fillRect(x,y,size,size);
        ctx.fillStyle='#704c87';ctx.font='bold 35px Arial';ctx.textAlign='center';ctx.fillText(item.latin,x+size/2,y+size/2,size-28);ctx.textAlign='left';
      }
      ctx.fillStyle=index===0?'#dcfa8c':'#372540';ctx.fillRect(x+9,y+9,50,40);
      ctx.fillStyle=index===0?'#30213d':'#fff';ctx.font='bold 25px Arial';ctx.fillText(String(index+1).padStart(2,'0'),x+19,y+38);
      ctx.fillStyle='#2a1e33';ctx.font='bold 22px "Microsoft YaHei",sans-serif';ctx.fillText(item.latin,x+12,y+346,size*.59);
      ctx.textAlign='right';ctx.fillStyle='#71647d';ctx.font='bold 13px Arial';ctx.fillText(item.group,x+size-10,y+344,size*.34);ctx.textAlign='left';
    });
    ctx.fillStyle='#58496a';ctx.font='bold 22px "Microsoft YaHei",sans-serif';ctx.fillText('心动研究所  /  K-POP '+groupLabel+'心动九选',48,1335);
    ctx.font='15px "Microsoft YaHei",sans-serif';
    portraits.forEach((item,i)=>{if(!item.image) return;const x=48+(i%3)*334,y=1371+Math.floor(i/3)*23;ctx.fillText((i+1)+'. '+item.credit,x,y,312);});
    if(posterURL.startsWith('blob:')) URL.revokeObjectURL(posterURL);
    posterURL = await new Promise((resolve,reject)=>canvas.toBlob(blob=>blob?resolve(URL.createObjectURL(blob)):reject(new Error('export')),'image/png'));
    if(!modal.open) return;
    showModal('保存结果图','<img class="poster-preview" src="'+esc(posterURL)+'" alt="我的心动九宫格海报"><p class="poster-note">手机上可以长按图片保存或分享。</p><a class="primary" href="'+esc(posterURL)+'" download="我的'+groupLabel+'心动九宫格.png">'+icon('download')+'下载 PNG</a>');
  } catch {
    if(modal.open) showModal('图片暂时无法导出','<p>可直接截取结果页的九宫格，或复制榜单文字发给朋友。</p><button class="outline" data-action="close">返回结果</button>');
  }
}
async function copyBoard(){
  if(!currentBoard) return;
  const message='我的 K-POP '+groupLabel+'心动 TOP 9\n'+currentBoard.ids.map((id,i)=>{const item=byId.get(id);return (i+1)+'. '+item.latin+' · '+item.group;}).join('\n')+'\n来自「心动研究所」';
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
  document.title='心动研究所 · K-POP '+groupLabel+'心动九选';
  for(const link of document.querySelectorAll('[data-pool]')){
    const current=link.dataset.pool===poolId;
    const target=new URL(location.href);
    target.searchParams.set('pool',link.dataset.pool);
    if(!current && view==='result') target.hash='boards';
    if(!current && view==='library') target.hash='library';
    link.href=target.href;
    if(current) link.setAttribute('aria-current','true');
    else link.removeAttribute('aria-current');
  }
  currentBoard=null; selectedSlot=null;
  const nav = view==='result'?'boards':view==='play'?'home':view;
  document.querySelectorAll('[data-nav]').forEach(a=>{if(a.dataset.nav===nav)a.setAttribute('aria-current','page');else a.removeAttribute('aria-current');});
  if(view==='library'){
    const linked = id && groups.find(group=>encodeURIComponent(group)===id);
    if(linked){groupFilter=linked;query='';saveFilters();}
    library();
  }
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
  else if(action==='group-photo') groupPhoto(id);
  else if(action==='prev-cover'||action==='next-cover'){
    coverIndex=(coverIndex+(action==='next-cover'?1:-1)+covers.length)%covers.length;
    document.querySelector('#cover-card').innerHTML=coverCard();
    document.querySelector('#cover-card [data-action="'+action+'"]').focus({preventScroll:true});
  }
  else if(action==='credits') {
    const all=[...idols,...covers].filter((p,i,a)=>a.findIndex(x=>x.source===p.source && x.image===p.image)===i);
    showModal('图片来源','<p class="privacy">封面使用组合合照，小卡取自成员单人写真。点击来源可查看发布记录，照片版权归各自权利人。</p><ol class="credits">'+all.map(p=>'<li><b>'+esc(p.latin || p.name)+'</b><br>'+credit(p)+'</li>').join('')+'</ol>');
  } else if(action==='detail') detail(id);
  else if(action==='clear-filter'){query='';groupFilter='';history.replaceState(null,'','#library');library();saveFilters();}
  else if(action==='swap') swapSlot(id);
  else if(action==='finish') finish();
  else if(action==='poster') makePoster();
  else if(action==='copy') copyBoard();
  else if(action==='delete-ask') showModal('删除这张榜单？','<p>删除后无法从本机恢复。</p><div class="actions"><button class="outline" data-action="close">保留</button><button class="primary" data-action="delete" data-id="'+esc(id)+'">确认删除</button></div>');
  else if(action==='delete'){session.boards=session.boards.filter(b=>b.id!==id);persist();modal.close();boards();}
  else if(action==='restart-ask') showModal('重新开始挑选？','<p>本轮进度将清空，已完成的榜单会保留。</p><div class="actions"><button class="outline" data-action="close">继续本轮</button><button class="primary" data-action="restart">重新开始</button></div>');
  else if(action==='restart'){modal.close();resetDraft();}
  else if(action==='retry-photos'){
    const cards=main.querySelector('.match-cards');
    if(cards){
      cards.querySelectorAll('img').forEach(image=>{if(!image.naturalWidth) image.src=image.src;});
      enablePhotoChoices();
    }
  }
  else playAction(action,id);
});
document.addEventListener('keydown',event=>{
  if(modal.open || event.repeat || event.altKey || event.ctrlKey || event.metaKey || event.shiftKey ||
     !/^[1-4]$/.test(event.key) || event.target.closest?.('input, select, textarea, [contenteditable="true"]')) return;
  const option=main.querySelectorAll('[data-action="vote"]')[Number(event.key)-1];
  if(option && !option.disabled){event.preventDefault();option.click();}
});

// Preserve rounds that were started before four-way voting was introduced.
function replayLegacy(deck, history){
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
  return {format:2,deck,history:[]};
}
// Every level contains winners of adjacent groups of four from the level below.
function replay(deck, history){
  const levels=[[...deck]];
  while(levels.at(-1).length>1){
    levels.push(Array(Math.ceil(levels.at(-1).length/4)).fill(undefined));
  }
  const ranked=[];
  let used=0;
  while(ranked.length<Math.min(deck.length,9)){
    for(let level=1;level<levels.length;level++){
      const children=levels[level-1], winners=levels[level];
      for(let group=winners.length-1;group>=0;group--){
        if(winners[group]!==undefined) continue;
        const match=children.slice(group*4,group*4+4).filter(id=>id!==null);
        if(match.length>1){
          if(!match.includes(history[used])) return {ranked,match,used};
          winners[group]=history[used++];
        } else winners[group]=match[0] ?? null;
      }
    }
    const winner=levels.at(-1)[0];
    ranked.push(winner);
    let slot=deck.indexOf(winner);
    levels[0][slot]=null;
    for(let level=1;level<levels.length;level++){
      slot=Math.floor(slot/4);
      levels[level][slot]=undefined;
    }
  }
  return {ranked,match:[],used};
}
function roundPercent(picks,total){
  let bound=0;
  for(let count=total;count>1;count=Math.ceil(count/4)){
    bound+=Math.floor(count/4)+(count%4>1?1:0)+Math.min(total-1,8);
  }
  return Math.min(99,Math.floor(100*picks/bound));
}
function restoreDraft(raw){
  if(!raw || !Array.isArray(raw.deck) || !Array.isArray(raw.history)) return null;
  const deck=ordered(raw.deck);
  if(deck.length<9 || deck.length!==raw.deck.length || deck.some(id=>!byId.get(id).image)) return null;
  if(raw.format===2){
    const state=replay(deck,raw.history);
    return {format:2,deck,history:raw.history.slice(0,state.used)};
  }
  if(raw.format!==undefined) return null;
  const state=replayLegacy(deck,raw.history);
  const draft={deck,history:raw.history.slice(0,state.used),ids:[],stage:'match'};
  if(state.ranked.length===9){
    draft.ids=exactBoard(raw.ids) && raw.ids.length===9 && raw.ids.every(id=>state.ranked.includes(id)) ? [...raw.ids] : state.ranked;
    draft.stage='sort';
  }
  return draft;
}
function showHelp(){
  showModal('怎么玩','<ol class="help-steps"><li><b><span>01</span>每轮选一张</b>从两到四张小卡中，点选最让你心动的那张。键盘也可以按 1 到 4 选择。</li><li><b><span>02</span>逐位选出前九名</b>各组胜者继续比较。每确定一名，只重赛受影响的小组。选错可以撤销上一轮。</li><li><b><span>03</span>看你的心动九宫格</b>第九名确定后自动生成榜单，第一名在正中央。</li></ol><p class="privacy">'+icon('lock')+' 选择和榜单仅保存在当前浏览器。</p><button class="primary" data-action="close">知道了</button>');
}
async function enablePhotoChoices(){
  const choices=[...main.querySelectorAll('[data-action="vote"]')];
  const status=main.querySelector('.photo-status');
  if(!status || !choices.length) return;
  choices.forEach(button=>button.disabled=true);
  status.textContent='';
  const hint=setTimeout(()=>{if(status.isConnected) status.textContent='正在加载本轮写真…';},700);
  try {
    await Promise.all(choices.map(button=>button.querySelector('img').decode()));
    if(status.isConnected){
      choices.forEach(button=>button.disabled=false);
      status.textContent='';
    }
  } catch {
    if(status.isConnected) status.innerHTML='本轮有照片未能加载。 <button class="plain" data-action="retry-photos">重新加载</button>';
  } finally {clearTimeout(hint);}
}
function play(){
  const draft=session.draft;
  if(draft.stage==='sort') return sortView();
  const state=(draft.format===2?replay:replayLegacy)(draft.deck,draft.history);
  if(state.ranked.length===9){
    if(draft.format===2){finish(state.ranked);return;}
    draft.ids=state.ranked;draft.stage='sort';persist();return sortView();
  }
  const rank=state.ranked.length+1;
  const percentage=roundPercent(draft.history.length,draft.deck.length);
  main.innerHTML='<div class="wrap page match-page">'+backHome+'<div class="match-title"><div class="page-head"><div class="section-kicker">PICK YOUR BIAS</div><h1>谁让你更心动？</h1><p>点选最喜欢的一张小卡。</p></div><span class="round-badge">第 '+(draft.history.length+1)+' 轮</span></div>'+(draft.format===2?'<div class="round-progress"><progress value="'+percentage+'" max="100" aria-label="挑选进度"></progress><span>'+percentage+'%</span></div>':'')+'<div class="match-meta"><span>正在选第 <b>'+String(rank).padStart(2,'0')+'</b> 位</span><span>已确定 '+(rank-1)+' / 9</span></div><div class="match-cards">'+state.match.map(id=>card(byId.get(id),'vote',{eager:true})).join('')+'</div><div class="photo-status" role="status"></div><div class="match-controls"><button class="outline" data-action="undo" '+(draft.history.length?'':'disabled')+'>'+icon('back')+'撤销上次选择</button><button class="plain" data-action="restart-ask">重新开始</button></div></div>';
  enablePhotoChoices();
}
function playAction(action,id){
  const draft=session.draft;
  if(!draft) return;
  if(action==='vote' && (draft.format===2 || draft.stage==='match')){
    if(!(draft.format===2?replay:replayLegacy)(draft.deck,draft.history).match.includes(id))return;
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
