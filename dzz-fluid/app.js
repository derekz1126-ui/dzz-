(() => {
 'use strict';
 const $ = s => document.querySelector(s), reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
 let lang = 'en'; try { lang = localStorage.getItem('dzz-fluid-lang') === 'zh' ? 'zh' : 'en'; } catch {}
 const dialog = $('#project-dialog'); let project = null;
 const projects = {
  universe: {en:['PERSONAL PROJECT','DZZ Universe','A comic-inspired personal universe built around learning and an FDE mindset. Explore the opening portal, web interactions, motion and bilingual navigation.'],zh:['个人项目','DZZ Universe','围绕学习能力和 FDE 思维构建的漫画风个人宇宙。包含开场入口、蛛丝交互、动画和中英文导航。'],url:'https://derekz1126-ui.github.io/dzz-/dzz-universe/'},
  flow: {en:['GENERATIVE STUDY','Order from motion','An original generative study made for this portfolio. A single repeated rule creates a complex moving form. Move your pointer across the artwork to change its orientation: a small experiment in understanding a system through interaction.'],zh:['生成艺术实验','流动中的秩序','为这个网站创作的生成艺术实验。同一条规则重复执行，形成复杂的流动形态。移动鼠标改变它的方向，通过交互理解一个系统。']},
  signal: {en:['INTERACTIVE STUDY','Signal, not noise','An original visual experiment about focus. Thousands of points form a changing surface. Moving your pointer changes the wave, making the relationship between input, behavior and feedback visible.'],zh:['交互实验','从噪声中找到信号','为这个网站创作的视觉实验。数千个点构成不断变化的曲面。移动鼠标改变波动，让输入、行为与反馈之间的关系变得可见。']}
 };
 function setLanguage() {
  document.documentElement.lang=lang;
  document.querySelectorAll('[data-en]').forEach(el=>{el.innerHTML=el.dataset[lang]});
  $('#language').textContent=lang==='en'?'中文':'EN';
  $('#language').setAttribute('aria-label',lang==='en'?'Switch to Chinese':'Switch to English');
  $('#close-project').textContent=lang==='en'?'Close ×':'关闭 ×';
  if(project) setProjectText(project);
  if(window.ScrollTrigger) ScrollTrigger.refresh();
 }
 $('#language').addEventListener('click',()=>{lang=lang==='en'?'zh':'en';try{localStorage.setItem('dzz-fluid-lang',lang)}catch{}setLanguage()});
 setLanguage();
 function setProjectText(key){const data=projects[key][lang];$('#project-kind').textContent=data[0];$('#project-title').textContent=data[1];$('#project-description').textContent=data[2];$('#project-link').hidden=!projects[key].url;$('#project-link').href=projects[key].url||'#';$('#project-link').textContent=lang==='en'?'Open DZZ Universe ↗':'打开 DZZ Universe ↗'}
 let modalArt=null;
 document.querySelectorAll('[data-project]').forEach(button=>button.addEventListener('click',()=>{
  project=button.dataset.project;setProjectText(project);$('#project-preview').replaceChildren();
  if(project==='universe'){const img=new Image();img.src='assets/hero-city.webp';img.alt='DZZ Universe comic city';$('#project-preview').append(img)}
  else{const canvas=document.createElement('canvas');canvas.setAttribute('aria-label',projects[project][lang][1]);$('#project-preview').append(canvas);modalArt=createArt(canvas,project)}
  dialog.showModal();if(modalArt)modalArt.resize();
 }));
 function closeProject(){dialog.close()}
 $('#close-project').addEventListener('click',closeProject);
 dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closeProject()}});
 dialog.addEventListener('close',()=>{modalArt?.destroy();modalArt=null;project=null});
 $('#copy-email').addEventListener('click',async()=>{let text;try{await navigator.clipboard.writeText('derek1126z@163.com');text=lang==='en'?'Email copied.':'邮箱已复制。'}catch{text=lang==='en'?'Email: derek1126z@163.com':'邮箱：derek1126z@163.com'}$('#toast').textContent=text;$('#toast').classList.add('visible');setTimeout(()=>$('#toast').classList.remove('visible'),2600)});
 $('#invert').addEventListener('click',()=>{const dark=document.body.classList.toggle('inverted');window.DZZLiquid?.setTheme(dark)});
 const gallery=$('.work-window');
 $('#prev-work').addEventListener('click',()=>gallery.scrollBy({left:-innerWidth*.6,behavior:reduced?'instant':'smooth'}));
 $('#next-work').addEventListener('click',()=>gallery.scrollBy({left:innerWidth*.6,behavior:reduced?'instant':'smooth'}));
 if(window.gsap && window.ScrollTrigger && !reduced){
  gsap.registerPlugin(ScrollTrigger);
  const ink={progress:0};
  gsap.to(ink,{progress:1,ease:'none',scrollTrigger:{trigger:'.opening',start:'top top',end:'bottom bottom',scrub:.5},onUpdate:()=>window.DZZLiquid?.setProgress(ink.progress)});
  gsap.to('.hero-corner, .hero-bottom',{opacity:0,scrollTrigger:{trigger:'.opening',start:'top top',end:'20% top',scrub:true}});
  gsap.from('.type-line',{xPercent:-12,opacity:0,stagger:.12,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:'.manifesto-type',start:'top 85%'}});
  document.querySelectorAll('.about-heading, .approach-grid article, .contact-title').forEach(el=>gsap.from(el,{y:55,opacity:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 90%',once:true}}));
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
 }
 function createArt(canvas,kind){
  const ctx=canvas.getContext('2d'); if(!ctx)return{resize(){},destroy(){}};
  let w=1,h=1,frame=0,active=false,dead=false,mx=.5,my=.5,t=0;
  const resize=()=>{const r=canvas.getBoundingClientRect();w=r.width||600;h=r.height||400;const d=Math.min(devicePixelRatio,1.5);canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform(d,0,0,d,0,0);draw()};
  function draw(){
   ctx.clearRect(0,0,w,h);
   if(kind==='flow'){
    ctx.fillStyle='#deddd8';ctx.fillRect(0,0,w,h);ctx.save();ctx.translate(w*.5,h*.5);ctx.rotate(-.35+(mx-.5)*.5);
    const scale=Math.min(w,h)*.34,angle=t*.07+(my-.5)*.5;
    for(let j=0;j<105;j++){
     const phi=j/105*Math.PI*2;ctx.beginPath();
     for(let i=0;i<=160;i++){
      const theta=i/160*Math.PI*2,rad=1+.32*Math.cos(phi),x=rad*Math.cos(theta),y=rad*Math.sin(theta),z=.32*Math.sin(phi)+.21*Math.sin(theta*3+angle);
      const ry=y*Math.cos(.9+angle)-z*Math.sin(.9+angle),rz=y*Math.sin(.9+angle)+z*Math.cos(.9+angle);
      const px=x*scale*(1+rz*.11),py=ry*scale*(1+rz*.11);
      if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);
     }ctx.strokeStyle=`rgba(10,10,10,${.2+.4*Math.sin(phi*.5)**2})`;ctx.lineWidth=.65;ctx.stroke();
    }ctx.restore();
   }else{
    ctx.fillStyle='#161616';ctx.fillRect(0,0,w,h);const s=Math.min(w,h)*.011;
    for(let y=-32;y<=32;y++)for(let x=-32;x<=32;x++){
     const r=Math.hypot(x,y),wave=Math.sin(r*.18-t*.8-mx*4)*Math.exp(-r/40)*9;
     const px=w*.5+(x-y*.4)*s,py=h*.5+(y*.48-wave)*s;
     const a=Math.max(.12,1-r/52);ctx.fillStyle=`rgba(239,239,232,${a})`;ctx.beginPath();ctx.arc(px,py,Math.max(.4,s*.13*(1+wave*.025)),0,Math.PI*2);ctx.fill();
    }
   }
  }
  function tick(){frame=0;if(dead||!active||document.hidden||reduced)return;t+=.017;draw();frame=requestAnimationFrame(tick)}
  function start(){if(!frame&&!dead&&active&&!document.hidden&&!reduced)frame=requestAnimationFrame(tick)}
  const observer=new IntersectionObserver(es=>{active=es[0].isIntersecting;if(active)start();else{cancelAnimationFrame(frame);frame=0}});observer.observe(canvas);
  const ro=new ResizeObserver(resize);ro.observe(canvas);
  const move=e=>{const r=canvas.getBoundingClientRect();mx=(e.clientX-r.left)/r.width;my=(e.clientY-r.top)/r.height;if(reduced)draw()};canvas.addEventListener('pointermove',move);
  const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0}else start()};document.addEventListener('visibilitychange',visibility);resize();
  return{resize,destroy(){dead=true;cancelAnimationFrame(frame);observer.disconnect();ro.disconnect();canvas.removeEventListener('pointermove',move);document.removeEventListener('visibilitychange',visibility)}};
 }
 createArt($('#flow-art'),'flow');createArt($('#signal-art'),'signal');
})();
