(() => {
  'use strict';

  // A self-contained, local comic impact layer. The page owns its triggers.
  if (window.DZZImpact && typeof window.DZZImpact.destroy === 'function') {
    window.DZZImpact.destroy();
  }

  const MAX_PARTICLES = 200;
  const TAU = Math.PI * 2;
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const star = 'polygon(50% 0%,59% 20%,76% 5%,77% 28%,98% 22%,88% 42%,100% 53%,82% 61%,94% 83%,70% 78%,65% 100%,49% 82%,32% 99%,29% 77%,6% 86%,16% 62%,0% 53%,17% 41%,3% 21%,28% 26%,29% 4%,42% 21%)';
  const particles = [];
  let requestedEnabled = true;
  let destroyed = false;
  let host = null;
  let canvas = null;
  let ctx = null;
  let word = null;
  let frameId = 0;
  let width = window.innerWidth;
  let height = window.innerHeight;

  const random = (min, max) => min + Math.random() * (max - min);
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const enabled = () => requestedEnabled && !media.matches && !destroyed;

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    if (!canvas || !ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (word) placeWord(word);
  }

  function mount() {
    if (host) return;
    host = document.createElement('div');
    host.setAttribute('aria-hidden', 'true');
    host.dataset.dzzImpact = '';
    host.style.cssText = 'position:fixed;inset:0;z-index:90;pointer-events:none;overflow:hidden;contain:layout style paint;isolation:isolate;';
    canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    canvas.style.cssText = 'position:fixed;inset:0;z-index:90;pointer-events:none;';
    host.appendChild(canvas);
    (document.body || document.documentElement).appendChild(host);
    ctx = canvas.getContext('2d', { alpha: true });
    resize();
  }

  function clear() {
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    particles.length = 0;
    if (ctx) ctx.clearRect(0, 0, width, height);
    if (word) word.element.remove();
    word = null;
  }

  function placeWord(item) {
    const safeX = Math.min(item.size * 0.54, width / 2);
    const safeY = Math.min(item.size * 0.37, height / 2);
    item.element.style.left = `${clamp(item.x, safeX, width - safeX)}px`;
    item.element.style.top = `${clamp(item.y, safeY, height - safeY)}px`;
  }

  function makeWord(x, y, label, color, now) {
    if (word) word.element.remove();
    const count = Array.from(label).length;
    const size = Math.min(310, Math.max(180, 148 + count * 11), width * 0.86);
    const element = document.createElement('div');
    element.setAttribute('aria-hidden', 'true');
    element.style.cssText = `position:absolute;z-index:91;width:${size}px;height:${size * 0.69}px;pointer-events:none;will-change:transform,opacity;transform:translate(-50%,-50%) scale(0);`;

    const shadow = document.createElement('div');
    shadow.style.cssText = `position:absolute;inset:0;background:#080a10;clip-path:${star};transform:translate(7px,8px) rotate(-3deg);`;
    const outline = document.createElement('div');
    outline.style.cssText = `position:absolute;inset:0;background:#080a10;clip-path:${star};`;
    const paper = document.createElement('div');
    paper.style.cssText = `position:absolute;inset:5px;clip-path:${star};background-color:${color};background-image:radial-gradient(#080a1036 1px,transparent 1.3px);background-size:5px 5px;`;
    const type = document.createElement('span');
    type.textContent = label;
    const fontSize = Math.min(67, (size * 1.25) / Math.max(4.2, count * 0.64));
    type.style.cssText = `position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:0 12px;font-family:Anton,Impact,'Arial Black',sans-serif;font-size:${fontSize}px;font-weight:900;letter-spacing:-.045em;line-height:1;color:#fff9ed;-webkit-text-stroke:2px #080a10;paint-order:stroke fill;text-shadow:-4px 1px 0 #09e4ed,4px 4px 0 #ff355c,6px 6px 0 #080a10;white-space:nowrap;transform:rotate(-5deg) skew(-7deg);`;
    element.append(shadow, outline, paper, type);
    host.appendChild(element);
    word = { element, start: now, duration: 745, x, y: y - 12, size, tilt: random(-9, -4) };
    placeWord(word);
  }

  function drawParticle(p, now) {
    const age = (now - p.start) / p.life;
    if (age >= 1) return false;
    if (!ctx) return true;
    const travel = 1 - Math.pow(1 - age, 2.6);
    const distance = p.radius + p.distance * travel;
    const x = p.x + p.cos * distance;
    const y = p.y + p.sin * distance + (p.kind === 'paper' ? age * age * 84 : 0);
    const fade = Math.pow(1 - age, 0.75);
    ctx.globalAlpha = fade;
    ctx.fillStyle = p.color;

    if (p.kind === 'ray') {
      const length = p.length * (0.5 + Math.sin(age * Math.PI) * 0.7);
      const halfWidth = p.size * (1 - age * 0.65);
      const backX = x - p.cos * length;
      const backY = y - p.sin * length;
      ctx.beginPath();
      ctx.moveTo(x + p.cos * 9, y + p.sin * 9);
      ctx.lineTo(backX - p.sin * halfWidth, backY + p.cos * halfWidth);
      ctx.lineTo(backX - p.cos * length * 0.15, backY - p.sin * length * 0.15);
      ctx.lineTo(backX + p.sin * halfWidth, backY - p.cos * halfWidth);
      ctx.closePath();
      ctx.fill();
      if (p.inkEdge) {
        ctx.strokeStyle = '#080a10';
        ctx.lineWidth = 1.35;
        ctx.stroke();
      }
    } else {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(p.rotation + p.spin * age);
      const size = p.size * (1 - age * 0.35);
      ctx.beginPath();
      if (p.kind === 'paper') {
        const fold = 0.52 + Math.abs(Math.cos(age * 6 + p.rotation)) * 0.48;
        ctx.scale(fold, 1);
        ctx.moveTo(-size, -size * 0.68);
        ctx.lineTo(size * 0.8, -size * 0.4);
        ctx.lineTo(size * 0.49, size * 0.8);
        ctx.lineTo(-size * 0.72, size * 0.42);
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = '#080a10';
        ctx.lineWidth = 1.7;
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(-size * 0.4, -size * 0.12);
        ctx.lineTo(size * 0.43, size * 0.16);
        ctx.lineWidth = 1;
        ctx.stroke();
      } else {
        ctx.moveTo(-size, -size * 0.3);
        ctx.lineTo(size * 0.7, -size * 0.65);
        ctx.lineTo(size, size * 0.22);
        ctx.lineTo(-size * 0.35, size * 0.6);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    }
    return true;
  }

  function frame(now) {
    frameId = 0;
    if (!enabled()) {
      clear();
      return;
    }
    if (ctx) ctx.clearRect(0, 0, width, height);
    for (let i = particles.length - 1; i >= 0; i -= 1) {
      if (!drawParticle(particles[i], now)) particles.splice(i, 1);
    }
    if (ctx) ctx.globalAlpha = 1;
    if (word) {
      const age = (now - word.start) / word.duration;
      if (age >= 1) {
        word.element.remove();
        word = null;
      } else {
        let scale;
        if (age < 0.13) scale = 0.25 + (1 - Math.pow(1 - age / 0.13, 3)) * 0.92;
        else if (age < 0.27) scale = 1.17 - ((age - 0.13) / 0.14) * 0.17;
        else scale = 1 + Math.max(0, age - 0.66) * 0.25;
        const recoil = Math.sin(age * 20) * Math.exp(-age * 12) * 6;
        word.element.style.transform = `translate(-50%,-50%) translateY(${-age * 18}px) rotate(${word.tilt + recoil}deg) scale(${scale})`;
        word.element.style.opacity = `${age < 0.68 ? 1 : Math.max(0, (1 - age) / 0.32)}`;
      }
    }
    if (particles.length || word) frameId = window.requestAnimationFrame(frame);
  }

  function burst(x, y, label = 'POW!', color = '#eaff46') {
    if (!enabled() || !Number.isFinite(x) || !Number.isFinite(y)) return false;
    mount();
    x = clamp(x, 0, width);
    y = clamp(y, 0, height);
    label = String(label).trim().slice(0, 24) || 'POW!';
    if (typeof color !== 'string' || !window.CSS || !CSS.supports('color', color)) color = '#eaff46';
    const now = performance.now();
    const palette = ['#080a10', color, '#09e4ed', '#ff355c', '#fff9ed'];
    const reach = Math.min(1, Math.max(0.6, width / 1000));

    for (let i = 0; i < 72; i += 1) {
      const kind = i < 38 ? 'ray' : i < 48 ? 'paper' : 'fleck';
      const angle = kind === 'ray' ? (i / 38) * TAU + random(-0.055, 0.055) : random(0, TAU);
      const isLong = i % 3 === 0;
      particles.push({
        kind, x, y, start: now,
        cos: Math.cos(angle), sin: Math.sin(angle),
        radius: kind === 'ray' ? random(32, 56) : random(18, 35),
        distance: (kind === 'ray' ? random(110, isLong ? 325 : 225) : random(95, 230)) * reach,
        length: (isLong ? random(58, 108) : random(24, 54)) * reach,
        size: kind === 'ray' ? random(1.4, isLong ? 4.5 : 3) : kind === 'paper' ? random(5, 10) : random(1.8, 4.4),
        life: kind === 'ray' ? random(370, 620) : random(530, 780),
        rotation: random(0, TAU), spin: random(-5, 5),
        color: kind === 'fleck' ? '#080a10' : palette[i % palette.length],
        inkEdge: kind === 'ray' && i % 5 !== 0
      });
    }
    if (particles.length > MAX_PARTICLES) particles.splice(0, particles.length - MAX_PARTICLES);
    makeWord(x, y, label, color, now);
    if (!frameId) frameId = window.requestAnimationFrame(frame);
    return true;
  }

  function setEnabled(value) {
    requestedEnabled = Boolean(value);
    if (!enabled()) clear();
    return enabled();
  }

  function onMotionChange() {
    if (!enabled()) clear();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    clear();
    window.removeEventListener('resize', resize);
    if (media.removeEventListener) media.removeEventListener('change', onMotionChange);
    else if (media.removeListener) media.removeListener(onMotionChange);
    if (host) host.remove();
    host = canvas = ctx = null;
  }

  window.addEventListener('resize', resize, { passive: true });
  if (media.addEventListener) media.addEventListener('change', onMotionChange);
  else if (media.addListener) media.addListener(onMotionChange);
  window.DZZImpact = { burst, setEnabled, destroy };
})();
