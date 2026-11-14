/* Original local concept boards. The links still work if dialog is unavailable. */
(() => {
  'use strict';
  const dialog=document.getElementById('design-dialog');
  if(!dialog||typeof dialog.showModal!=='function')return;
  const image=document.getElementById('design-image');
  const title=document.getElementById('design-title');
  const original=document.getElementById('design-original');
  const close=document.getElementById('close-design');
  const status=document.getElementById('design-status');
  const caption=document.getElementById('design-caption');
  let opener;
  document.querySelectorAll('[data-design]').forEach(link=>link.addEventListener('click',e=>{
    e.preventDefault();
    opener=link;
    const name=link.dataset.design;
    const reference=link.dataset.designKind==='reference';
    title.textContent=`${name} · ${reference?'实车参考':'概念设计'}`;
    if(caption)caption.textContent=reference?'现有车型实拍 · 仅作品牌气质参考，不代表概念车型':'概念设计探索 · 图中参数仅为概念设定';
    image.hidden=false;
    image.alt=reference?`风云 ${name} 实车参考照片`:`${name} 正面、侧面与尾部三视图`;
    image.src=link.getAttribute('href');
    original.href=link.getAttribute('href');
    status.textContent='';
    dispatchEvent(new Event('fulwin:design-open'));
    window.FulwinSound?.suspend();
    dialog.showModal();
    close.focus();
  }));
  close.addEventListener('click',()=>dialog.close());
  dialog.addEventListener('close',()=>{
    const target=opener&&!opener.closest('[inert]')&&opener.getClientRects().length?opener:document.querySelector('.mark');
    target?.focus({preventScroll:true});
    window.FulwinSound?.resume();
  });
  dialog.addEventListener('keydown',e=>{
    if(e.key!=='Tab')return;
    const items=[...dialog.querySelectorAll('button,a[href]')].filter(el=>!el.disabled&&el.getClientRects().length);
    const first=items[0],last=items[items.length-1];
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}
  });
  dialog.addEventListener('click',e=>{
    if(e.target!==dialog)return;
    const r=dialog.getBoundingClientRect();
    if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();
  });
  image.addEventListener('error',()=>{image.hidden=true;status.textContent='暂时无法显示图片，请检查本地文件或使用原尺寸链接。';});
})();
