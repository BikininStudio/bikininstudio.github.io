// Engine for the scroll-driven 3D showcase: one WebGL canvas, several chapters, a curtain between them.
// Markup: .story > .stage (canvas, .curtain) + .chapter* (each holds .panel*); optional .loader, .chapnav [data-go], .progress-bar.
// bootChapters(chapters): chapters[i] = { title, load: () => import(scene module) }; a scene module exports
//   create(THREE, ctx, chapterEl) -> { scene, camera, resize(w, h), update(p, dt, time), toneMapping? }
// p = scroll progress through that chapter (0 first panel .. 1 last panel), smoothed.
// No WebGL, reduced motion or ?statis -> html.no3d: no canvas, Three.js is never downloaded, the page shows still posters.
export const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (v) => { v = clamp(v); return v * v * (3 - 2 * v); };
export const mix = (a, b, t) => a + (b - a) * t;
// Progress of s inside [a, b], eased; s is usually p * (panels - 1) so whole numbers sit on panel centres.
export const seg = (s, a, b) => smooth((s - a) / (b - a));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch (e) {
    return false;
  }
}

export async function bootChapters(chapters) {
  const root = document.documentElement;
  const story = document.querySelector(".story");
  const stage = story.querySelector(".stage");
  const canvas = stage.querySelector("canvas");
  const curtain = stage.querySelector(".curtain");
  const els = [...story.querySelectorAll(".chapter")];
  const loader = document.querySelector(".loader");
  const navBtns = [...document.querySelectorAll(".chapnav [data-go]")];
  const bar = document.querySelector(".progress-bar");
  const setLoad = (n) => {
    if (!loader) return;
    loader.style.setProperty("--load", n / 100);
    loader.querySelector(".loader-n").textContent = Math.round(n) + "%";
  };

  // Headings slide up from behind a mask; panels fade in as they arrive (both modes, CSS turns it off for reduced motion)
  story.querySelectorAll(".panel h1, .panel h2").forEach((h) => { h.innerHTML = `<span class="mask"><span>${h.innerHTML}</span></span>`; });
  const pio = new IntersectionObserver((es) => es.forEach((e) => e.target.classList.toggle("on", e.isIntersecting)), { threshold: 0.3 });
  story.querySelectorAll(".panel").forEach((el) => pio.observe(el));

  // Chapter nav + top progress bar (both modes)
  const activeAt = () => {
    const mid = innerHeight * 0.5;
    let a = 0;
    els.forEach((el, i) => { if (el.getBoundingClientRect().top <= mid) a = i; });
    return a;
  };
  const chrome = () => {
    const a = activeAt();
    navBtns.forEach((b, i) => b.toggleAttribute("aria-current", i === a));
    if (bar) bar.style.transform = `scaleX(${clamp(scrollY / (document.documentElement.scrollHeight - innerHeight))})`;
    root.classList.toggle("at-outro", story.getBoundingClientRect().bottom < innerHeight * 0.6);
    return a;
  };
  navBtns.forEach((b) => b.addEventListener("click", () => els[+b.dataset.go].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })));
  addEventListener("scroll", chrome, { passive: true });
  chrome();

  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || new URLSearchParams(location.search).has("statis") || !hasWebGL()) {
    root.classList.add("no3d", "loaded");
    return null;
  }

  // Poster dulu: Three.js (~340 KB) baru diunduh setelah halaman tenang (desktop: idle atau gerak pertama; HP: interaksi pertama), supaya TBT/LCP aman.
  await new Promise((ok) => {
    const evs = ["pointerdown", "touchstart", "keydown", "scroll"];
    const go = () => { evs.forEach((t) => removeEventListener(t, go)); ok(); };
    evs.forEach((t) => addEventListener(t, go, { passive: true }));
    if (matchMedia("(min-width:1024px)").matches) (window.requestIdleCallback || setTimeout)(() => setTimeout(go, 1200), { timeout: 3000 });
  });
  setLoad(12);
  const THREE = await import("three");
  setLoad(45);
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: "high-performance" });
  } catch (e) {
    root.classList.add("no3d", "loaded");
    return null;
  }
  const small = matchMedia("(max-width: 760px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, small ? 1.25 : 1.5));
  renderer.shadowMap.enabled = !small;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Shared state scenes read: pointer (-1..1, smoothed, desktop only) and spin (radians from dragging the canvas, with inertia)
  const ctx = { THREE, renderer, small, stage, pointer: { x: 0, y: 0 }, spin: 0, invalidate: () => kick() };
  const pointerTarget = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { pointerTarget.x = (e.clientX / innerWidth) * 2 - 1; pointerTarget.y = (e.clientY / innerHeight) * 2 - 1; } }, { passive: true });
  let dragging = false, lastX = 0, vel = 0;
  canvas.addEventListener("pointerdown", (e) => { dragging = true; lastX = e.clientX; vel = 0; canvas.setPointerCapture(e.pointerId); stage.classList.add("dragging"); });
  canvas.addEventListener("pointermove", (e) => { if (!dragging) return; vel = (e.clientX - lastX) * 0.012; ctx.spin += vel; lastX = e.clientX; kick(); });
  const endDrag = () => { dragging = false; stage.classList.remove("dragging"); };
  canvas.addEventListener("pointerup", endDrag);
  canvas.addEventListener("pointercancel", endDrag);

  const made = [];
  const make = (i) => (made[i] ||= chapters[i].load().then((m) => m.create(THREE, ctx, els[i])));

  let shown = null, want = 0, switching = false, target = 0, cur = 0, raf = 0, last = 0, visible = true, w = 1, h = 1;
  const measure = () => {
    const r = els[shown ? shown.i : 0].getBoundingClientRect();
    const max = r.height - innerHeight;
    target = max > 0 ? clamp(-r.top / max) : 0;
  };
  const resize = () => {
    w = canvas.clientWidth || stage.clientWidth; h = canvas.clientHeight || stage.clientHeight;
    renderer.setSize(w, h, false);
    if (shown) shown.app.resize(w, h);
  };
  const frame = (t) => {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    cur += (target - cur) * Math.min(1, dt * 7);
    if (Math.abs(target - cur) < 1e-4) cur = target;
    ctx.pointer.x += (pointerTarget.x - ctx.pointer.x) * Math.min(1, dt * 4);
    ctx.pointer.y += (pointerTarget.y - ctx.pointer.y) * Math.min(1, dt * 4);
    if (!dragging) { ctx.spin += vel; vel *= 0.92; }
    const busy = shown.app.update(cur, dt, t / 1000);
    renderer.render(shown.app.scene, shown.app.camera);
    raf = visible && (busy || cur !== target) ? requestAnimationFrame(frame) : 0;
    if (!raf) last = 0;
  };
  function kick() {
    if (!raf && visible && shown) raf = requestAnimationFrame(frame);
  }

  // Swap the scene behind a curtain; if the reader scrolls past several chapters, the latest one wins
  async function show(i) {
    want = i;
    if (switching) return;
    switching = true;
    if (shown) {
      const cn = curtain.querySelector(".curtain-n"); // demo lama: nomor bab; curtain[data-plain] hanya memuat nama
      if (cn && !curtain.hasAttribute("data-plain")) cn.textContent = `0${i + 1} / 0${els.length}`;
      curtain.querySelector(".curtain-t").textContent = chapters[i].title;
      curtain.classList.add("in");
      await wait(480);
    }
    let idx;
    do {
      idx = want;
      const app = await make(idx);
      shown = { i: idx, app };
    } while (idx !== want);
    stage.dataset.ch = idx;
    stage.style.removeProperty("--stage-bg");
    stage.style.removeProperty("--glow");
    renderer.toneMapping = shown.app.toneMapping ?? THREE.NeutralToneMapping;
    ctx.spin = 0; vel = 0;
    resize();
    measure();
    cur = target;
    shown.app.update(cur, 0, performance.now() / 1000);
    renderer.render(shown.app.scene, shown.app.camera);
    if (curtain.classList.contains("in")) {
      curtain.classList.add("out");
      await wait(480);
      curtain.classList.add("reset");
      curtain.classList.remove("in", "out");
      curtain.offsetWidth; // apply the jump back before re-enabling the transition
      curtain.classList.remove("reset");
    }
    switching = false;
    kick();
    if (want !== idx) return show(want);
    if (chapters[idx + 1]) setTimeout(() => make(idx + 1), 300); // warm up the next chapter
  }

  addEventListener("scroll", () => {
    const a = activeAt();
    if (shown && a !== shown.i) show(a);
    else if (shown) { measure(); kick(); }
  }, { passive: true });
  new ResizeObserver(() => { resize(); measure(); kick(); }).observe(stage);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; kick(); }).observe(story);

  await show(activeAt());
  setLoad(100);
  root.classList.add("has3d");
  await wait(250);
  root.classList.add("loaded");
  return ctx;
}

// Canvas texture helper: draw(g, w, h) paints a 2D canvas that becomes a colour texture.
export function canvasTexture(THREE, w, h, draw) {
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  draw(c.getContext("2d"), w, h);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Soft round shadow to put under an object (cheaper than real shadows).
export function blobShadow(THREE, size, opacity = 0.35) {
  const tex = canvasTexture(THREE, 128, 128, (g, w) => {
    const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2);
    r.addColorStop(0, "rgba(0,0,0,1)");
    r.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = r;
    g.fillRect(0, 0, w, w);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

export function loadImage(src) {
  return new Promise((ok, fail) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = fail;
    img.src = src;
  });
}
