/* 帧率自适应：连续掉帧就挂 html.perf-low，关掉最贵的动效与混合模式
   —— 目标是"能跑满就全开，跑不动就自动减配"，而不是让用户自己猜 */
(() => {
  const root = document.documentElement;
  let acc = 0, n = 0, last = performance.now();
  let low = false;

  const tick = (now) => {
    const dt = now - last;
    last = now;
    if (dt > 0 && dt < 500) { acc += dt; n++; }
    if (n >= 72) {
      const avg = acc / n;
      acc = 0; n = 0;
      if (!low && avg > 27) {          // 持续低于约 37fps
        low = true;
        root.classList.add('perf-low');
        console.info('[fulwin] 帧率偏低（约 ' + Math.round(1000 / avg) + ' fps），已自动降级动效');
      } else if (low && avg < 16) {    // 回到 60fps 以上再恢复
        low = false;
        root.classList.remove('perf-low');
        console.info('[fulwin] 帧率恢复，重新开启动效');
      }
    }
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
})();
