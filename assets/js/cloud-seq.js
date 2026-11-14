/* New native ACT02. Portrait frames have their own Blender camera. */
(() => {
  const front=document.getElementById('cloud-sequence');if(!front||front.dataset.videoFallback==='true'&&window.FulwinCinematicAssets?.clouds)return;
  const media=matchMedia('(max-aspect-ratio: 95/100)');
  const desktop=front.dataset.desktop||'assets/cloud/desktop/c-',portrait=front.dataset.portrait||'assets/cloud/portrait/c-';
  const create=window.FulwinWeatherFilm?.create||window.FulwinFrames.create;
  const api=create(front,{act:'cloud',count:360,url:i=>`${media.matches?portrait:desktop}${String(i).padStart(3,'0')}.webp`,preload:false,
    onFrame(){window.dispatchEvent(new Event('fulwin:cloud-frame'));}});
  window.FulwinCloudSeq=api;
  media.addEventListener('change',()=>api.invalidate());
  if(media.matches)api.invalidate();
})();
