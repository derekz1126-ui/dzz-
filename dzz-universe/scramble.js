(() => {
  'use strict';

  if (window.DZZScramble) window.DZZScramble.destroy();
  const selector = '.main-nav a, #pageTitle, .mission-title, .dossier-entry h3, .signal-panel h2, .power-chip';
  const media = window.matchMedia('(prefers-reduced-motion: reduce)');
  const active = new Map();
  const textProperties = ['font-family', 'font-size', 'font-weight', 'font-style', 'font-stretch', 'font-variant', 'line-height', 'letter-spacing', 'word-spacing', 'text-transform', 'text-align', 'text-indent', 'white-space', 'word-break', 'overflow-wrap', 'direction', 'color', '-webkit-text-stroke-width', '-webkit-text-stroke-color'];
  let frameId = 0;
  let lastFrame = -Infinity;
  let motionPaused = false;
  let destroyed = false;

  function allowed() {
    return !destroyed && !media.matches && !motionPaused && !document.body.classList.contains('motion-paused');
  }

  function saveStyle(item, element, property, value) {
    item.styles.push([element, property, element.style.getPropertyValue(property), element.style.getPropertyPriority(property)]);
    element.style.setProperty(property, value, 'important');
  }

  function finish(item) {
    item.overlay.remove();
    for (let i = item.styles.length - 1; i >= 0; i -= 1) {
      const [element, property, value, priority] = item.styles[i];
      if (value) element.style.setProperty(property, value, priority);
      else element.style.removeProperty(property);
    }
    if (!item.hadClass) item.target.classList.remove('dzz-scrambling');
    active.delete(item.target);
  }

  function cancelAll() {
    for (const item of Array.from(active.values())) finish(item);
    if (frameId) window.cancelAnimationFrame(frameId);
    frameId = 0;
    lastFrame = -Infinity;
  }

  function glyph(character, tick, index, salt) {
    if (/\s/u.test(character)) return character;
    let bank;
    if (/[\u3400-\u9fff]/u.test(character)) bank = '未来光影宇宙探索未知信号灵感思考星域';
    else if (/[ilI1!|.,:;]/u.test(character)) bank = 'I1!|:';
    else if (/[MWmw@#%]/u.test(character)) bank = 'MW#%';
    else if (/[a-z]/u.test(character)) bank = 'abcdefghjknopqrstuvxyz';
    else bank = 'ABCDEFGHJKLNOPQRSTUVXYZ02356789';
    return bank[(tick * 7 + index * 11 + salt) % bank.length];
  }

  function render(item, progress, now) {
    const revealed = progress > 0.16 ? Math.floor(((progress - 0.16) / 0.72) * item.length) : 0;
    const tick = Math.floor(now / 55);
    let offset = 0;
    for (const run of item.runs) {
      run.node.nodeValue = run.characters.map((character, index) => {
        const position = offset + index;
        return position < revealed ? character : glyph(character, tick, position, item.salt);
      }).join('');
      offset += run.characters.length;
    }
    item.overlay.style.setProperty('--dzz-scramble-split', progress < 0.6 ? '2px' : '0px');
  }

  function frame(now) {
    frameId = 0;
    if (!allowed()) {
      cancelAll();
      return;
    }
    if (now - lastFrame >= 1000 / 30) {
      lastFrame = now;
      for (const item of Array.from(active.values())) {
        const progress = (now - item.started) / item.duration;
        if (progress >= 1 || !item.target.isConnected) finish(item);
        else render(item, progress, now);
      }
    }
    if (active.size) frameId = window.requestAnimationFrame(frame);
  }

  function cloneContent(source, destination, runs) {
    for (const child of source.childNodes) {
      if (child.nodeType === 3) {
        const text = document.createTextNode(child.nodeValue);
        destination.appendChild(text);
        if (child.nodeValue.trim()) runs.push({ node: text, characters: Array.from(child.nodeValue) });
      } else if (child.nodeType === 1) {
        // Icons and other non-text content retain their identity and appearance.
        const clone = child.cloneNode(false);
        clone.removeAttribute('id');
        clone.removeAttribute('tabindex');
        const style = getComputedStyle(child);
        for (const property of [...textProperties, 'display', 'vertical-align', 'margin-left', 'margin-right', 'padding-left', 'padding-right']) {
          clone.style.setProperty(property, style.getPropertyValue(property));
        }
        clone.style.setProperty('-webkit-text-fill-color', style.getPropertyValue('-webkit-text-fill-color') || style.color);
        if (child.getAttribute('aria-hidden') === 'true' || /^(SVG|IMG|CANVAS)$/i.test(child.tagName)) {
          const preserved = child.cloneNode(true);
          preserved.removeAttribute('id');
          preserved.removeAttribute('tabindex');
          preserved.style.cssText = clone.style.cssText;
          destination.appendChild(preserved);
        } else {
          cloneContent(child, clone, runs);
          destination.appendChild(clone);
        }
      }
    }
  }

  function start(target) {
    if (!allowed() || active.has(target) || !target.isConnected) return;
    const style = getComputedStyle(target);
    if (style.display === 'none' || style.visibility === 'hidden' || !target.textContent.trim()) return;
    if (active.size >= 3) finish(active.values().next().value);

    const overlay = document.createElement('div');
    overlay.className = 'dzz-scramble-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    overlay.setAttribute('inert', '');
    overlay.style.cssText = 'position:absolute;inset:0;z-index:2;box-sizing:border-box;pointer-events:none;user-select:none;overflow:hidden;margin:0;border:0;min-width:0;min-height:0;max-width:none;max-height:none;';
    for (const property of textProperties) overlay.style.setProperty(property, style.getPropertyValue(property));
    for (const edge of ['top', 'right', 'bottom', 'left']) overlay.style.setProperty(`padding-${edge}`, style.getPropertyValue(`padding-${edge}`));
    overlay.style.setProperty('-webkit-text-fill-color', style.getPropertyValue('-webkit-text-fill-color') || style.color);
    overlay.style.textShadow = 'calc(-1 * var(--dzz-scramble-split, 2px)) 0 #00f0ff, var(--dzz-scramble-split, 2px) 0 #ff004d';
    const runs = [];
    cloneContent(target, overlay, runs);
    const length = runs.reduce((sum, run) => sum + run.characters.length, 0);
    if (!length) return;

    const item = {
      target, overlay, runs, length, styles: [],
      started: performance.now(), duration: Math.min(640, 450 + length * 5),
      salt: Math.floor(Math.random() * 1000), hadClass: target.classList.contains('dzz-scrambling')
    };
    // The real text and all real child nodes stay untouched and accessible.
    // Only text paint is hidden, so borders, backgrounds and hit areas remain.
    if (style.position === 'static') saveStyle(item, target, 'position', 'relative');
    const originals = [target, ...target.querySelectorAll('*')];
    for (const original of originals) {
      if (original !== target && original.closest('[aria-hidden="true"]')) continue;
      saveStyle(item, original, '-webkit-text-fill-color', 'transparent');
      saveStyle(item, original, '-webkit-text-stroke-color', 'transparent');
      saveStyle(item, original, 'text-shadow', 'none');
    }
    target.classList.add('dzz-scrambling');
    target.appendChild(overlay);
    active.set(target, item);
    render(item, 0, item.started);
    if (!frameId) frameId = window.requestAnimationFrame(frame);
  }

  function onEnter(event) {
    if (!event.target || !event.target.closest) return;
    const card = event.target.closest('.mission-card');
    const target = card ? card.querySelector('.mission-title') : event.target.closest(selector);
    const trigger = card || target;
    if (!target || (event.relatedTarget && trigger.contains(event.relatedTarget))) return;
    start(target);
  }

  function onMotion(event) {
    if (event.detail && typeof event.detail.paused === 'boolean') motionPaused = event.detail.paused;
    if (!allowed()) cancelAll();
  }

  function onVisibility() {
    if (document.hidden) cancelAll();
  }

  function destroy() {
    if (destroyed) return;
    destroyed = true;
    cancelAll();
    document.removeEventListener('pointerenter', onEnter, true);
    document.removeEventListener('focusin', onEnter);
    document.removeEventListener('dzz:before-language', cancelAll);
    document.removeEventListener('dzz:motion', onMotion);
    document.removeEventListener('visibilitychange', onVisibility);
    window.removeEventListener('resize', cancelAll);
    if (media.removeEventListener) media.removeEventListener('change', cancelAll);
    else if (media.removeListener) media.removeListener(cancelAll);
  }

  document.addEventListener('pointerenter', onEnter, true);
  document.addEventListener('focusin', onEnter);
  document.addEventListener('dzz:before-language', cancelAll);
  document.addEventListener('dzz:motion', onMotion);
  document.addEventListener('visibilitychange', onVisibility);
  window.addEventListener('resize', cancelAll, { passive: true });
  if (media.addEventListener) media.addEventListener('change', cancelAll);
  else if (media.addListener) media.addListener(cancelAll);
  window.DZZScramble = { destroy, cancelAll };
})();
