// Homepage-only effects: WebGL hero, scroll-scrubbed manifesto,
// pinned horizontal showcase, particle typography, counters.
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ======================================================== intro */
const start = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
(document.fonts?.ready ?? Promise.resolve()).then(start);
setTimeout(start, 1200); // never hold the intro hostage to font loading

/* ======================================================== rotating word */
const swap = $("[data-swap]");
if (swap && !reduceMotion) {
  const words = swap.dataset.swap.split("|");
  let i = 0;
  setInterval(() => {
    swap.classList.add("is-out");
    setTimeout(() => {
      i = (i + 1) % words.length;
      swap.textContent = words[i];
      swap.classList.remove("is-out");
    }, 450);
  }, 2800);
}

/* ======================================================== hero shader */
const FRAG = `
precision highp float;
uniform vec2 u_res;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_scroll;

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * u_res) / u_res.y;
  vec2 m = (u_mouse - 0.5 * u_res) / u_res.y;
  float t = u_time * 0.05;
  float d = length(uv - m);

  vec2 p = uv * 1.5 + vec2(0.0, u_scroll * 0.6);
  p += 0.35 * (m - uv) * exp(-d * 2.2);

  vec2 q = vec2(fbm(p + vec2(0.0, t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 3.5 * q + vec2(1.7, 9.2) + 0.6 * t), fbm(p + 3.5 * q + vec2(8.3, 2.8) - 0.5 * t));
  float f = fbm(p + 3.0 * r);

  vec3 base   = vec3(0.025, 0.025, 0.035);
  vec3 ember  = vec3(1.0, 0.40, 0.20);
  vec3 violet = vec3(0.45, 0.32, 1.0);
  vec3 teal   = vec3(0.08, 0.72, 0.62);

  vec3 col = base;
  col = mix(col, violet * 0.85, smoothstep(0.15, 0.85, length(q)));
  col = mix(col, ember, smoothstep(0.42, 0.85, f));
  col = mix(col, teal * 0.9, smoothstep(0.5, 0.9, r.y) * 0.55);
  col = mix(col, vec3(1.0, 0.82, 0.7), smoothstep(0.78, 1.0, f) * 0.5);
  col *= 0.35 + 1.6 * f * f;
  col += ember * 0.22 * exp(-d * 3.0);

  // fine contour lines for a "topographic" read
  float bands = abs(fract(f * 9.0) - 0.5);
  col += smoothstep(0.03, 0.0, bands) * 0.06 * smoothstep(0.35, 0.8, f);

  // vignette, darker on the left where the copy sits
  col *= 1.0 - 0.4 * dot(uv * 0.7, uv * 0.7);
  col *= mix(0.6, 1.0, smoothstep(-0.9, 0.3, uv.x));
  col += (hash(gl_FragCoord.xy + fract(u_time)) - 0.5) * 0.025;
  gl_FragColor = vec4(col, 1.0);
}`;
const VERT = `attribute vec2 a; void main(){ gl_Position = vec4(a, 0.0, 1.0); }`;

function initShader(canvas) {
  const gl = canvas.getContext("webgl", { antialias: false, alpha: false, powerPreference: "high-performance" });
  if (!gl) { canvas.classList.add("is-fallback"); return; }
  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  };
  const prog = gl.createProgram();
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  gl.useProgram(prog);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const uRes = gl.getUniformLocation(prog, "u_res");
  const uTime = gl.getUniformLocation(prog, "u_time");
  const uMouse = gl.getUniformLocation(prog, "u_mouse");
  const uScroll = gl.getUniformLocation(prog, "u_scroll");

  // Render below native resolution — the image is soft anyway and this keeps it cheap.
  const scale = Math.min(devicePixelRatio, 2) * (innerWidth < 800 ? 0.5 : 0.6);
  const resize = () => {
    canvas.width = Math.round(canvas.clientWidth * scale);
    canvas.height = Math.round(canvas.clientHeight * scale);
    gl.viewport(0, 0, canvas.width, canvas.height);
  };
  resize();
  addEventListener("resize", resize);

  const mouse = { x: canvas.width * 0.7, y: canvas.height * 0.6, tx: canvas.width * 0.7, ty: canvas.height * 0.6 };
  addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.tx = (e.clientX - r.left) * scale;
    mouse.ty = (r.height - (e.clientY - r.top)) * scale;
  }, { passive: true });

  let visible = true;
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) requestAnimationFrame(frame); }).observe(canvas);

  const t0 = performance.now();
  function frame(now) {
    if (!visible) return;
    mouse.x += (mouse.tx - mouse.x) * 0.05;
    mouse.y += (mouse.ty - mouse.y) * 0.05;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, reduceMotion ? 20 : (now - t0) / 1000 + 20);
    gl.uniform2f(uMouse, mouse.x, mouse.y);
    gl.uniform1f(uScroll, scrollY / innerHeight);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!reduceMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
  if (reduceMotion) addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true });
}
const shaderCanvas = $("[data-shader]");
if (shaderCanvas) {
  try { initShader(shaderCanvas); } catch (err) { console.warn("Shader disabled:", err); }
}

/* ======================================================== manifesto word scrub */
const manifesto = $("[data-scrub-words]");
if (manifesto) {
  const wrapWords = (node) => {
    for (const child of [...node.childNodes]) {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        child.textContent.split(/(\s+)/).forEach((part) => {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.append(part);
          else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.append(s); }
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1) wrapWords(child);
    }
  };
  wrapWords(manifesto);
  const words = $$(".w", manifesto);
  if (reduceMotion) words.forEach((w) => w.classList.add("is-lit"));
  else {
    const update = () => {
      const r = manifesto.getBoundingClientRect();
      const p = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      const lit = Math.round(p * words.length);
      words.forEach((w, i) => w.classList.toggle("is-lit", i < lit));
    };
    addEventListener("scroll", update, { passive: true });
    update();
  }
}

/* ======================================================== pinned horizontal showcase */
const showcase = $("[data-showcase]");
if (showcase) {
  const track = $("[data-showcase-track]");
  const bar = $("[data-showcase-progress]");
  const mq = matchMedia("(max-width: 820px), (prefers-reduced-motion: reduce)");
  let distance = 0;
  const measure = () => {
    if (mq.matches) { showcase.style.height = ""; track.style.transform = ""; return; }
    distance = Math.max(0, track.scrollWidth - innerWidth);
    showcase.style.height = `${distance + innerHeight * 1.15}px`;
    update();
  };
  const update = () => {
    if (mq.matches) return;
    const r = showcase.getBoundingClientRect();
    const total = showcase.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, -r.top / Math.max(total, 1)));
    track.style.transform = `translate3d(${-distance * p}px, 0, 0)`;
    if (bar) bar.style.transform = `scaleX(${p})`;
  };
  addEventListener("resize", measure);
  addEventListener("scroll", update, { passive: true });
  mq.addEventListener?.("change", measure);
  addEventListener("load", measure);
  measure();
}

/* ======================================================== particle typography */
const pCanvas = $("[data-particles]");
if (pCanvas) {
  const ctx = pCanvas.getContext("2d");
  const words = pCanvas.dataset.words.split("|");
  const dpr = Math.min(devicePixelRatio, 2);
  let W = 0, H = 0, particles = [], wordIndex = 0, running = false;
  const pointer = { x: -9999, y: -9999 };
  const styles = getComputedStyle(document.body);
  const fg = styles.getPropertyValue("--fg").trim() || "#f2eee7";
  const accent = styles.getPropertyValue("--accent").trim() || "#ff6a3d";

  function targetsFor(word) {
    const off = document.createElement("canvas");
    off.width = W; off.height = H;
    const o = off.getContext("2d");
    let size = Math.min(H * 0.62, (W * 0.92) / (word.length * 0.62));
    o.font = `italic 400 ${size}px "Instrument Serif", Georgia, serif`;
    const measured = o.measureText(word).width;
    if (measured > W * 0.9) { size *= (W * 0.9) / measured; o.font = `italic 400 ${size}px "Instrument Serif", Georgia, serif`; }
    o.textAlign = "center"; o.textBaseline = "middle";
    o.fillStyle = "#fff";
    o.fillText(word, W / 2, H / 2);
    const data = o.getImageData(0, 0, W, H).data;
    const step = Math.max(4, Math.round((W < 900 * dpr ? 4 : 5) * dpr));
    const pts = [];
    for (let y = 0; y < H; y += step) for (let x = 0; x < W; x += step) if (data[(y * W + x) * 4 + 3] > 128) pts.push([x, y]);
    // shuffle so particles travel to scattered new homes when morphing
    for (let i = pts.length - 1; i > 0; i--) { const j = (Math.random() * (i + 1)) | 0; [pts[i], pts[j]] = [pts[j], pts[i]]; }
    return pts;
  }

  function setWord(word) {
    const pts = targetsFor(word);
    while (particles.length < pts.length) {
      particles.push({ x: Math.random() * W, y: Math.random() * H, vx: 0, vy: 0, tx: 0, ty: 0, a: 0, hot: Math.random() < 0.12 });
    }
    particles.forEach((p, i) => {
      if (i < pts.length) { p.tx = pts[i][0]; p.ty = pts[i][1]; p.alive = true; }
      else { p.tx = Math.random() * W; p.ty = H + 40 + Math.random() * 80; p.alive = false; }
    });
  }

  function resize() {
    const r = pCanvas.getBoundingClientRect();
    W = Math.round(r.width * dpr); H = Math.round(r.height * dpr);
    pCanvas.width = W; pCanvas.height = H;
    setWord(words[wordIndex]);
  }

  function tick() {
    if (!running) return;
    ctx.clearRect(0, 0, W, H);
    const R = 90 * dpr;
    for (const p of particles) {
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < R * R) {
        const d = Math.sqrt(d2) || 1;
        const f = (1 - d / R) * 6;
        p.vx += (dx / d) * f; p.vy += (dy / d) * f;
      }
      p.vx += (p.tx - p.x) * 0.012; p.vy += (p.ty - p.y) * 0.012;
      p.vx *= 0.86; p.vy *= 0.86;
      p.x += p.vx; p.y += p.vy;
      p.a += ((p.alive ? 1 : 0) - p.a) * 0.06;
      if (p.a < 0.02) continue;
      const speed = Math.min(1, Math.abs(p.vx) + Math.abs(p.vy));
      ctx.globalAlpha = p.a * (0.75 + 0.25 * speed);
      ctx.fillStyle = p.hot || speed > 0.6 ? accent : fg;
      const s = (p.hot ? 2.4 : 1.9) * dpr;
      ctx.fillRect(p.x - s / 2, p.y - s / 2, s, s);
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }

  pCanvas.addEventListener("pointermove", (e) => {
    const r = pCanvas.getBoundingClientRect();
    pointer.x = (e.clientX - r.left) * dpr; pointer.y = (e.clientY - r.top) * dpr;
  });
  pCanvas.addEventListener("pointerleave", () => { pointer.x = pointer.y = -9999; });

  let timer;
  new IntersectionObserver(([e]) => {
    if (e.isIntersecting && !running) {
      running = true; tick();
      if (!reduceMotion) timer = setInterval(() => { wordIndex = (wordIndex + 1) % words.length; setWord(words[wordIndex]); }, 3200);
    } else if (!e.isIntersecting) { running = false; clearInterval(timer); }
  }).observe(pCanvas);

  (document.fonts?.ready ?? Promise.resolve()).then(resize);
  let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 150); });
}

/* ======================================================== counters */
const counters = $$("[data-count]");
if (counters.length) {
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      const el = e.target, end = Number(el.dataset.count), suffix = el.dataset.suffix || "";
      if (reduceMotion) { el.textContent = end + suffix; return; }
      const t0 = performance.now(), dur = 1800;
      const step = (now) => {
        const t = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(2, -10 * t);
        el.textContent = Math.round(end * (t === 1 ? 1 : eased)) + suffix;
        if (t < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => cio.observe(c));
}
