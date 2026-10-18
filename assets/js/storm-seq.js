/* Native ACT03. Independent portrait camera and the existing bounded decoder. */
(() => {
 const front=document.getElementById('storm-sequence');if(!front||front.dataset.videoFallback==='true'&&window.FulwinCinematicAssets?.thunderstorm)return;
 const media=matchMedia('(max-aspect-ratio: 95/100)');
 const desktop=front.dataset.desktop||'assets/storm/desktop/t-',portrait=front.dataset.portrait||'assets/storm/portrait/t-';
 const create=window.FulwinWeatherFilm?.create||window.FulwinFrames.create;
 const api=create(front,{act:'storm',count:360,url:i=>`${media.matches?portrait:desktop}${String(i).padStart(3,'0')}.webp`,preload:false,onFrame(){window.dispatchEvent(new Event('fulwin:storm-frame'));}});
 window.FulwinStormSeq=api;media.addEventListener('change',()=>api.invalidate());if(media.matches)api.invalidate();
})();
