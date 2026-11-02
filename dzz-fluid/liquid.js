/* Original distance-field liquid lettering. No runtime dependencies. */
(() => {
  'use strict';

  const canvas = document.getElementById('liquid-canvas');
  const fallback = document.getElementById('liquid-fallback');
  if (!canvas) return;

  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = motion.matches;
  let destroyed = false;
  let visible = true;
  let lost = false;
  let ready = false;
  let frame = 0;
  let gl, program, buffer, texture, uniforms;
  let width = 1, height = 1;
  let progress = 0, targetProgress = 0;
  let theme = 0, targetTheme = 0;
  let lastTime = 0;
  let animationTime = 0;
  let resizeObserver, intersectionObserver;
  const trails = new Float32Array(24);
  let lastPointer = null;
  for (let i = 0; i < 6; i++) trails[i * 4 + 3] = -100;

  const vertexSource = `
    attribute vec2 a_position;
    varying vec2 v_uv;
    void main() {
      v_uv = a_position * 0.5 + 0.5;
      gl_Position = vec4(a_position, 0.0, 1.0);
    }
  `;

  const fragmentSource = `
    precision highp float;
    varying vec2 v_uv;
    uniform sampler2D u_text;
    uniform vec2 u_resolution;
    uniform float u_time;
    uniform float u_progress;
    uniform float u_theme;
    uniform float u_motion;
    uniform vec4 u_trails[6];

    float distanceAt(vec2 uv) {
      vec2 encoded = texture2D(u_text, clamp(uv, 0.0, 1.0)).rg;
      return (dot(encoded, vec2(65280.0, 255.0)) / 65535.0 - 0.5) * 2.0;
    }

    void main() {
      float shortSide = min(u_resolution.x, u_resolution.y);
      vec2 ratio = u_resolution / shortSide;
      vec2 p = (v_uv - 0.5) * ratio;
      float t = u_time;
      float swell = smoothstep(0.0, 0.95, u_progress);

      // Broad, continuous currents keep the word legible between interactions.
      vec2 flow = vec2(
        sin(p.y * 6.4 + t * 0.42) + 0.45 * sin(p.x * 9.0 - t * 0.31),
        cos(p.x * 5.3 - t * 0.36) + 0.40 * sin(p.y * 8.0 + t * 0.27)
      ) * (0.012 + 0.018 * swell) * u_motion;

      // Each pointer sample leaves a spreading wake which relaxes over time.
      for (int i = 0; i < 6; i++) {
        vec4 trail = u_trails[i];
        float age = max(0.0, t - trail.w);
        vec2 delta = p - trail.xy;
        float radius = length(delta);
        float envelope = exp(-age * 1.7 - radius * radius * 10.0);
        float wave = sin(radius * 28.0 - age * 7.5);
        vec2 direction = delta / max(radius, 0.025);
        vec2 curl = vec2(-direction.y, direction.x);
        flow += (direction * wave + curl * 0.65) *
          envelope * trail.z * 0.038 * u_motion;
      }

      float textDistance = distanceAt((p + flow) / ratio + 0.5);
      float edge = 1.15 / shortSide;
      float spread = pow(swell, 1.6) * 0.77;
      float ink = 1.0 - smoothstep(spread - edge, spread + edge, textDistance);
      // The final part closes every counter and reaches a flat, solid field.
      ink = mix(ink, 1.0, smoothstep(0.80, 0.95, u_progress));
      vec3 paper = vec3(246.0, 245.0, 242.0) / 255.0;
      vec3 black = vec3(8.0 / 255.0);
      vec3 background = mix(paper, black, u_theme);
      vec3 foreground = mix(black, paper, u_theme);
      gl_FragColor = vec4(mix(background, foreground, ink), 1.0);
    }
  `;

  function showFallback() {
    canvas.style.visibility = 'hidden';
    if (fallback) {
      fallback.hidden = false;
      fallback.style.visibility = '';
    }
  }

  function shader(type, source) {
    const result = gl.createShader(type);
    gl.shaderSource(result, source);
    gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
      gl.deleteShader(result);
      throw new Error('Liquid shader could not compile.');
    }
    return result;
  }

  function makeTextTexture() {
    const scale = Math.min(1, 1100 / Math.max(width, height));
    const w = Math.max(2, Math.round(width * scale));
    const h = Math.max(2, Math.round(height * scale));
    const surface = document.createElement('canvas');
    surface.width = w;
    surface.height = h;
    const ctx = surface.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas 2D is unavailable.');
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    ctx.font = '900 300px "Archivo", "Arial Black", sans-serif';
    const metrics = ctx.measureText('DZZ');
    const left = metrics.actualBoundingBoxLeft || 0;
    const right = metrics.actualBoundingBoxRight || metrics.width;
    const ascent = metrics.actualBoundingBoxAscent || 220;
    const descent = metrics.actualBoundingBoxDescent || 0;
    ctx.translate(w * 0.5, h * 0.5);
    ctx.scale(w * 0.88 / (left + right), h * 0.55 / (ascent + descent));
    ctx.fillStyle = '#fff';
    ctx.fillText('DZZ', (left - right) * 0.5, (ascent - descent) * 0.5);
    const pixels = ctx.getImageData(0, 0, w, h).data;
    const field = new Float32Array(w * h);
    const inside = new Uint8Array(w * h);
    const diagonal = Math.SQRT2;
    for (let i = 0; i < field.length; i++) {
      inside[i] = pixels[i * 4] > 127 ? 1 : 0;
      field[i] = 1e6;
    }
    // A chamfer distance field is computed once per resize, never per frame.
    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const i = y * w + x;
        if (inside[i] !== inside[i - 1] || inside[i] !== inside[i + 1] ||
            inside[i] !== inside[i - w] || inside[i] !== inside[i + w]) {
          field[i] = 0.5;
        }
      }
    }
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = y * w + x;
        let d = field[i];
        if (x) d = Math.min(d, field[i - 1] + 1);
        if (y) {
          d = Math.min(d, field[i - w] + 1);
          if (x) d = Math.min(d, field[i - w - 1] + diagonal);
          if (x < w - 1) d = Math.min(d, field[i - w + 1] + diagonal);
        }
        field[i] = d;
      }
    }
    for (let y = h - 1; y >= 0; y--) {
      for (let x = w - 1; x >= 0; x--) {
        const i = y * w + x;
        let d = field[i];
        if (x < w - 1) d = Math.min(d, field[i + 1] + 1);
        if (y < h - 1) {
          d = Math.min(d, field[i + w] + 1);
          if (x) d = Math.min(d, field[i + w - 1] + diagonal);
          if (x < w - 1) d = Math.min(d, field[i + w + 1] + diagonal);
        }
        field[i] = d;
      }
    }
    const rgba = new Uint8Array(w * h * 4);
    const shortSide = Math.min(w, h);
    for (let i = 0; i < field.length; i++) {
      const signed = field[i] * (inside[i] ? -1 : 1) / shortSide;
      const packed = Math.round(Math.min(1, Math.max(0, 0.5 + signed * 0.5)) * 65535);
      rgba[i * 4] = packed >> 8;
      rgba[i * 4 + 1] = packed & 255;
      rgba[i * 4 + 3] = 255;
    }
    gl.bindTexture(gl.TEXTURE_2D, texture);
    // Flip top-down canvas rows into WebGL's bottom-up texture coordinates.
    const flipped = new Uint8Array(rgba.length);
    for (let y = 0; y < h; y++) {
      flipped.set(rgba.subarray(y * w * 4, (y + 1) * w * 4), (h - 1 - y) * w * 4);
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, flipped);
  }

  function resize() {
    if (!ready || destroyed || lost) return;
    const rect = canvas.getBoundingClientRect();
    const nextWidth = Math.max(1, Math.round(rect.width));
    const nextHeight = Math.max(1, Math.round(rect.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    if (nextWidth === width && nextHeight === height && canvas.width === Math.round(width * dpr)) return;
    width = nextWidth;
    height = nextHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    gl.viewport(0, 0, canvas.width, canvas.height);
    makeTextTexture();
    requestDraw();
  }

  function draw(now) {
    frame = 0;
    if (destroyed || lost || !ready || !visible || document.hidden) return;
    const delta = lastTime ? Math.min((now - lastTime) / 1000, 0.05) : 1 / 60;
    lastTime = now;
    if (!reduced) animationTime += delta;
    const ease = reduced ? 1 : 1 - Math.exp(-delta * 12);
    progress += (targetProgress - progress) * ease;
    theme += (targetTheme - theme) * ease;
    gl.useProgram(program);
    gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
    gl.uniform1f(uniforms.time, animationTime);
    gl.uniform1f(uniforms.progress, progress);
    gl.uniform1f(uniforms.theme, theme);
    gl.uniform1f(uniforms.motion, reduced ? 0 : 1);
    gl.uniform4fv(uniforms.trails, trails);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
    if (canvas.style.visibility !== 'visible') {
      if (gl.getError() !== gl.NO_ERROR) {
        showFallback();
        ready = false;
        return;
      }
      canvas.style.visibility = 'visible';
      if (fallback) {
        fallback.hidden = true;
        fallback.style.visibility = 'hidden';
      }
    }
    if (!reduced) requestDraw();
  }

  function requestDraw() {
    if (!frame && ready && !destroyed && !lost && visible && !document.hidden) {
      frame = requestAnimationFrame(draw);
    }
  }

  function pointerMove(event) {
    if (reduced || !visible || destroyed) return;
    const rect = canvas.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) return;
    const shortSide = Math.min(width, height);
    const x = (event.clientX - rect.left - width * 0.5) / shortSide;
    const y = (height * 0.5 - event.clientY + rect.top) / shortSide;
    const distance = lastPointer ? Math.hypot(x - lastPointer.x, y - lastPointer.y) : 0.03;
    if (lastPointer && distance < 0.008) return;
    trails.copyWithin(4, 0, 20);
    trails[0] = x;
    trails[1] = y;
    trails[2] = Math.min(1.4, 0.4 + distance * 8);
    trails[3] = animationTime;
    lastPointer = { x, y };
  }

  function visibilityChange() {
    lastTime = 0;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else requestDraw();
  }

  function motionChange(event) {
    reduced = event.matches;
    lastTime = 0;
    requestDraw();
  }

  function contextLost(event) {
    event.preventDefault();
    lost = true;
    ready = false;
    cancelAnimationFrame(frame);
    frame = 0;
    showFallback();
  }

  function initialize() {
    if (destroyed) return;
    try {
      gl = canvas.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' });
      if (!gl) { showFallback(); return; }
      lost = false;
      const vertex = shader(gl.VERTEX_SHADER, vertexSource);
      const fragment = shader(gl.FRAGMENT_SHADER, fragmentSource);
      program = gl.createProgram();
      gl.attachShader(program, vertex);
      gl.attachShader(program, fragment);
      gl.linkProgram(program);
      gl.deleteShader(vertex);
      gl.deleteShader(fragment);
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('Liquid shader could not link.');
      gl.useProgram(program);
      buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
      const position = gl.getAttribLocation(program, 'a_position');
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
      uniforms = {};
      for (const name of ['resolution', 'time', 'progress', 'theme', 'motion', 'trails']) {
        uniforms[name] = gl.getUniformLocation(program, `u_${name}${name === 'trails' ? '[0]' : ''}`);
      }
      texture = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.uniform1i(gl.getUniformLocation(program, 'u_text'), 0);
      ready = true;
      width = 0;
      height = 0;
      resize();
      requestDraw();
    } catch (error) {
      ready = false;
      showFallback();
      console.warn('Liquid lettering is using its static fallback.', error.message);
    }
  }

  window.DZZLiquid = {
    setProgress(value) {
      if (!Number.isFinite(value)) return;
      targetProgress = Math.max(0, Math.min(1, value));
      requestDraw();
    },
    setTheme(dark) {
      targetTheme = dark ? 1 : 0;
      requestDraw();
    },
    destroy() {
      destroyed = true;
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', pointerMove);
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', visibilityChange);
      motion.removeEventListener('change', motionChange);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', initialize);
      if (resizeObserver) resizeObserver.disconnect();
      if (intersectionObserver) intersectionObserver.disconnect();
      if (gl && !lost) {
        gl.deleteTexture(texture);
        gl.deleteBuffer(buffer);
        gl.deleteProgram(program);
      }
      showFallback();
    }
  };

  canvas.addEventListener('webglcontextlost', contextLost);
  canvas.addEventListener('webglcontextrestored', initialize);
  window.addEventListener('pointermove', pointerMove, { passive: true });
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', visibilityChange);
  motion.addEventListener('change', motionChange);
  if ('ResizeObserver' in window) {
    resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
  }
  if ('IntersectionObserver' in window) {
    intersectionObserver = new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      lastTime = 0;
      if (visible) requestDraw();
      else { cancelAnimationFrame(frame); frame = 0; }
    });
    intersectionObserver.observe(canvas);
  }
  showFallback();
  Promise.resolve(document.fonts && document.fonts.ready).then(initialize, initialize);
})();
