/* Retained storm sequence; uses the shared verified decode policy. */
(() => {
  const front=document.getElementById('seq');if(!front)return;
  window.FulwinSeq=window.FulwinFrames.create(front,{count:144,url:i=>`assets/seq/p-${String(i).padStart(3,'0')}.webp`,preload:true,deadzone:1.1,
    onFrame(){window.dispatchEvent?.(new Event('fulwin:sequence-frame'));}});
})();
