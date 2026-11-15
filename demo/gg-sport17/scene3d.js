/* GG Sport17: adegan 3D.
   Satu kanvas menutupi layar. Dunia 3D memakai koordinat halaman (1 satuan = 1 px),
   kamera ikut turun saat halaman digulir. Semua benda adalah MODEL 3D ASLI dari Blender
   (hasil-3d -> models/, lihat roll3d.js):
   - panel hero: roll pilihan, bisa diputar dengan geser, berganti warna dengan putaran
   - rak: lingkaran roll yang bisa diputar; lepas = roll terdepan terpilih, ketuk = pilih
   - "Sobek, tempel, main": roll Kindmax yang pitanya terurai mengikuti gulir
   - ajakan: tumpukan roll yang melompat bergantian
   Pita cahaya di latar digambar terpisah oleh pita.js. */
import { THREE, studio, buatRoll, buatBuka, buatTumpukan, adaModel, muatAwal } from './roll3d.js?v=9';

window.GG3D = true;
const root = document.documentElement;
const canvas = document.getElementById('gl');
const $ = s => document.querySelector(s);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const easeOut = t => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
const easeInOut = t => (t = clamp(t, 0, 1), t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: devicePixelRatio < 2, powerPreference: 'high-performance' });
} catch (e) { /* tanpa WebGL: gambar render tampil lewat .no3d */ }

if (!renderer) root.classList.add('no3d');
else start();

function start() {
  const FOV = 28;
  let W = 0, Hc = 0, D = 1000, mobile = false, needs = true;
  let dpr = Math.min(devicePixelRatio || 1, innerWidth < 760 ? 2 : 1.5);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 50, 8000);
  const lampu = studio(renderer, scene);
  // Rak punya adegan sendiri: digambar terpotong di dalam panelnya (scissor) dan diberi kabut
  const sceneRak = new THREE.Scene();
  const lampuRak = studio(renderer, sceneRak);
  sceneRak.fog = new THREE.Fog(0x14171a, 4000, 6000);
  renderer.autoClear = false;

  /* ---------- Bayangan sentuh ---------- */
  const shadowTex = (() => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32;
    const g = c.getContext('2d'), gr = g.createRadialGradient(64, 64, 2, 64, 64, 62);
    gr.addColorStop(0, 'rgba(0,0,0,.7)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
    g.setTransform(1, 0, 0, .25, 0, 0); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const shadowMat = new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false, fog: false, toneMapped: false });
  const PLANE = new THREE.PlaneGeometry(1, 1);

  // Pemegang: bayangan + model. Pemegang diberi posisi & skala piksel, model diberi putaran.
  function pegang(obj, bayangan = true) {
    const h = new THREE.Group();
    if (bayangan) {
      const sh = new THREE.Mesh(PLANE, shadowMat);
      sh.scale.set(obj.lebarDepan * 1.05, .2, 1); sh.position.set(0, -.56, -.6); sh.raycast = () => {};
      sh.renderOrder = -1;
      h.add(sh); h.userData.sh = sh;
    }
    h.add(obj.g);
    h.userData.obj = obj;
    return h;
  }
  const lepas = h => { if (h && h.parent) h.parent.remove(h); };

  /* ---------- Pilihan aktif ---------- */
  let st = window.GG && window.GG.get ? window.GG.get() : null;
  if (!st) { root.classList.add('no3d'); return; }
  const warnaBuka = () => (adaModel('kindmax', st.warna) ? st.warna : 'Merah');
  const docRect = sel => { const el = $(sel); if (!el) return null; const b = el.getBoundingClientRect(); return { x: b.left + scrollX, y: b.top + scrollY, w: b.width, h: b.height, el }; };
  const near = (top, h, sy, extra = 0) => top + h > sy - extra && top < sy + Hc + extra;
  const siap = sel => { const el = $(sel); if (el) el.classList.add('siap3d'); };

  /* ---------- Hero: roll pilihan ---------- */
  const hero = { h: null, obj: null, slug: '', born: 0, keluar: null, keluarT: 0, yaw: 0, yawDrag: 0, yawV: 0, pop: 0, r: null, muat: 0 };
  function heroGanti(state) {
    const id = ++hero.muat;
    if (hero.obj && hero.slug === state.slug) {
      hero.obj.ganti(state.slug, state.warna).then(() => { needs = true; });
      if (!reduce) { hero.yawV += 7; hero.pop = 1; }
      return;
    }
    buatRoll(state.slug, state.warna).then(obj => {
      if (id !== hero.muat) return;
      if (hero.keluar) lepas(hero.keluar);
      if (hero.h) { hero.keluar = hero.h; hero.keluarT = performance.now(); hero.keluarS = hero.h.scale.x; }
      hero.obj = obj; hero.slug = state.slug; hero.h = pegang(obj); hero.born = performance.now();
      hero.putar = state.slug !== 'kindmax';
      scene.add(hero.h);
      siap('#hero-stage');
      needs = true;
    });
  }

  /* ---------- Rak: lingkaran roll ---------- */
  const rak = { g: new THREE.Group(), items: [], slug: '', sel: 0, hover: -1, yaw: 0, yawT: 0, touched: -1e9, built: 0, R: 300, S: 100, r: null, muat: 0, aktif: false };
  sceneRak.add(rak.g);
  function bangunRak() {
    const id = ++rak.muat, slug = st.slug, colors = st.colors;
    Promise.all(colors.map(c => buatRoll(slug, c.name))).then(objs => {
      if (id !== rak.muat) return;
      rak.items.forEach(it => lepas(it.h));
      rak.items = objs.map((obj, i) => {
        const h = pegang(obj);
        h.traverse(o => { if (o.isMesh) o.userData.idx = i; });
        obj.waktu(i * .9);
        rak.g.add(h);
        const f = i === st.idx ? 0 : 1;
        obj.fokus(f);
        return { h, obj, k: 1, lift: 0, f, s: reduce ? 1 : 0, delay: i * 45 };
      });
      rak.slug = slug; rak.sel = st.idx; rak.built = performance.now();
      const step = Math.PI * 2 / rak.items.length;
      rak.yaw = rak.yawT = rak.sel * step + (reduce ? 0 : -1.2);
      rak.yawT = rak.sel * step;
      ukurRak();
      siap('#rak-stage');
      needs = true;
    });
  }
  function ukurRak() {
    const r = rak.r = docRect('#rak-stage');
    if (!r || !rak.items.length) return;
    const n = rak.items.length, lebar = Math.max(...rak.items.map(it => it.obj.lebarRoll));
    // di HP lingkaran lebih lebar dari panel: roll di sisi terpotong tepi panel seperti carousel
    rak.R = Math.min(r.w * (mobile ? .62 : .36), 500);
    const tali = 2 * rak.R * Math.sin(Math.PI / n);
    rak.S = Math.min(r.h * (mobile ? .28 : .32), tali * 1.2 / lebar, mobile ? 120 : 200);
    // Kabut menyamakan roll di belakang lingkaran dengan warna panel
    sceneRak.fog.near = D + rak.R * .15; sceneRak.fog.far = D + rak.R * 2.4;
  }
  const dekatkan = (cur, target, per) => target + Math.round((cur - target) / per) * per;
  function pilihDepan(idx) {
    const n = rak.items.length; if (!n) return;
    const step = Math.PI * 2 / n;
    rak.sel = idx;
    rak.yawT = dekatkan(rak.yaw, idx * step, Math.PI * 2);
  }

  /* ---------- Roll terbuka dan tumpukan ---------- */
  const buka = { h: null, obj: null, r: null, muat: false, warna: '' };
  const tutup = { h: null, obj: null, r: null, muat: false };
  function siapkanBuka() {
    buka.muat = true; buka.warna = warnaBuka();
    buatBuka(buka.warna).then(obj => { buka.obj = obj; buka.h = pegang(obj, false); scene.add(buka.h); siap('#pepatah-stage'); needs = true; });
  }
  function siapkanTutup() {
    tutup.muat = true;
    buatTumpukan().then(obj => { tutup.obj = obj; tutup.h = pegang(obj); tutup.h.userData.sh.scale.set(obj.lebarDepan * 1.1, .26, 1); scene.add(tutup.h); siap('#cta-stage'); needs = true; });
  }

  /* ---------- Ukuran dan tata letak ---------- */
  function layout() {
    const wasMobile = mobile;
    W = root.clientWidth; Hc = $('#lvh').offsetHeight || innerHeight; mobile = W < 760;
    D = (Hc / 2) / Math.tan(THREE.MathUtils.degToRad(FOV / 2));
    camera.aspect = W / Hc; camera.far = D + 6000; camera.updateProjectionMatrix();
    camera.position.set(W / 2, 0, D);
    renderer.setPixelRatio(dpr); renderer.setSize(W, Hc, false);
    hero.r = docRect('#hero-stage'); buka.r = docRect('#pepatah-stage'); tutup.r = docRect('#cta-stage');
    ukurRak();
    if (wasMobile !== mobile) needs = true;
    needs = true;
  }

  /* ---------- Geser: hero ---------- */
  const heroEl = $('#hero-stage');
  let hd = null;
  heroEl.addEventListener('pointerdown', e => { hd = { x: e.clientX, y: e.clientY, yaw: hero.yawDrag, lx: e.clientX, lt: performance.now(), v: 0, ok: false }; });
  heroEl.addEventListener('pointermove', e => {
    if (!hd) return;
    const dx = e.clientX - hd.x;
    if (!hd.ok && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - hd.y)) { hd.ok = true; heroEl.classList.add('drag'); }
    if (hd.ok) {
      const now = performance.now();
      hd.v = (e.clientX - hd.lx) / Math.max(8, now - hd.lt) * 16; hd.lx = e.clientX; hd.lt = now;
      hero.yawDrag = hd.yaw + dx * .012; needs = true;
    }
  });
  const heroUp = () => { if (hd && hd.ok && !reduce) hero.yawV += hd.v * .5; hd = null; heroEl.classList.remove('drag'); };
  heroEl.addEventListener('pointerup', heroUp);
  heroEl.addEventListener('pointercancel', heroUp);

  /* ---------- Geser dan ketuk: rak ---------- */
  const stage = $('#rak-stage'), ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  let down = null;
  function hitAt(e) {
    if (!rak.items.length) return -1;
    ndc.set(e.clientX / W * 2 - 1, -(e.clientY / Hc) * 2 + 1);
    camera.position.y = -(scrollY + Hc / 2); camera.updateMatrixWorld();
    rak.g.updateMatrixWorld(true);
    ray.setFromCamera(ndc, camera);
    const hits = ray.intersectObjects(rak.items.map(it => it.h), true);
    return hits.length ? hits[0].object.userData.idx : -1;
  }
  stage.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY, yaw: rak.yawT, moved: false }; });
  stage.addEventListener('pointermove', e => {
    if (down) {
      const dx = e.clientX - down.x;
      if (!down.moved && Math.abs(dx) > 6 && Math.abs(dx) > Math.abs(e.clientY - down.y)) { down.moved = true; stage.classList.add('drag'); }
      if (down.moved) { rak.yawT = down.yaw - dx * (mobile ? .009 : .0055); rak.touched = performance.now(); needs = true; }
    } else if (finePointer) {
      const h = hitAt(e);
      if (h !== rak.hover) { rak.hover = h; stage.classList.toggle('hit', h >= 0); needs = true; }
    }
  });
  const up = e => {
    if (down && rak.items.length) {
      const n = rak.items.length, step = Math.PI * 2 / n;
      let idx = -1;
      if (!down.moved && e.type === 'pointerup') idx = hitAt(e);
      else if (down.moved) idx = ((Math.round(rak.yawT / step) % n) + n) % n;   // roll terdepan terpilih
      if (idx >= 0) {
        pilihDepan(idx);
        document.dispatchEvent(new CustomEvent('gg:pick', { detail: { idx } }));
      }
      rak.touched = performance.now();
      if (down.moved) { const hint = $('#rak-hint'); if (hint) hint.classList.add('pudar'); }
    }
    down = null; stage.classList.remove('drag');
  };
  stage.addEventListener('pointerup', up);
  stage.addEventListener('pointercancel', up);
  stage.addEventListener('pointerleave', () => { if (rak.hover >= 0) { rak.hover = -1; stage.classList.remove('hit'); needs = true; } });

  /* ---------- Warna berganti (dari app.js) ---------- */
  const warnaRak = new THREE.Color(), warnaTepi = new THREE.Color(st.hex);
  function campur(hex, t) { const a = new THREE.Color(hex), b = new THREE.Color('#14171A'); return b.lerp(a, t); }
  document.addEventListener('gg:warna', e => {
    st = e.detail;
    heroGanti(st);
    if (rak.aktif) {
      if (st.slug !== rak.slug) bangunRak();
      else pilihDepan(st.idx);
    }
    if (buka.obj && warnaBuka() !== buka.warna) { buka.warna = warnaBuka(); buka.obj.ganti('kindmax', buka.warna).then(() => { needs = true; }); }
    warnaRak.copy(campur(st.hex, st.warna === 'Putih' ? .2 : .3));
    warnaTepi.set(st.hex);
    needs = true;
  });
  warnaRak.copy(campur(st.hex, .3));

  /* ---------- Kursor ---------- */
  let mx = 0, my = 0;
  if (finePointer && !reduce) addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; }, { passive: true });

  /* ---------- Putaran gambar ---------- */
  let prevSy = -1, last = 0, slow = 0, adaTadi = false;
  const fogKini = new THREE.Color().copy(warnaRak);

  function stepHero(now, dt, sy) {
    const r = hero.r;
    if (hero.keluar) {
      const p = reduce ? 1 : (now - hero.keluarT) / 260;
      if (p >= 1) { lepas(hero.keluar); hero.keluar = null; }
      else { hero.keluar.scale.setScalar(Math.max(.001, hero.keluarS * (1 - easeOut(p)))); hero.keluar.userData.obj.g.rotation.y += dt * 9; needs = true; }
    }
    if (!hero.h || !r) return false;
    const on = near(r.y, r.h, sy);
    hero.h.visible = on;
    if (!on) return false;
    const e = reduce ? 1 : easeOut((now - hero.born) / 700);
    if (!reduce) hero.obj.jalan(dt);
    // putaran: roll polos berputar pelan terus, Kindmax (ada kotaknya) bergoyang menghadap depan
    if (!reduce) hero.yaw = hero.putar ? hero.yaw + dt * .45 : -.45 + Math.sin(now * .0006) * .4;
    else hero.yaw = -.45;
    hero.yawV *= Math.pow(.04, dt);
    hero.yawDrag += hero.yawV * dt;
    if (!hd) hero.yawDrag *= hero.putar ? 1 : Math.pow(.25, dt);
    hero.pop = Math.max(0, hero.pop - dt * 3);
    const o = hero.obj, fit = Math.min(r.h * (mobile ? .74 : .76), r.w * .82 / (hero.putar ? o.lebar : o.lebarDepan * 1.12));
    const s = fit * (.62 + .38 * e) * (1 + Math.sin(hero.pop * Math.PI) * .06);
    hero.h.position.set(r.x + r.w / 2, -(r.y + r.h * .5) + (1 - e) * 60 + (reduce ? 0 : Math.sin(now * .0011) * fit * .015), 0);
    hero.h.scale.setScalar(s);
    o.g.rotation.set(.3 + my * .22, hero.yaw + hero.yawDrag + mx * .5 + (1 - e) * -2.4, mx * -.06);
    return true;
  }

  function stepRak(now, dt, sy) {
    const r = rak.r;
    if (!r) return false;
    const on = near(r.y, r.h, sy, Hc * .6);
    if (!rak.aktif && near(r.y, r.h, sy, Hc * 1.5)) { rak.aktif = true; bangunRak(); }
    rak.g.visible = on && rak.items.length > 0;
    if (!rak.g.visible) return false;
    const n = rak.items.length, step = Math.PI * 2 / n;
    const idle = !reduce && !down && now - rak.touched > 3200;
    if (idle) rak.yawT = dekatkan(rak.yaw, rak.sel * step, Math.PI * 2) + Math.sin(now * .0004) * .1;
    rak.yaw += (rak.yawT - rak.yaw) * (reduce ? 1 : Math.min(1, dt * 5));
    rak.g.position.set(r.x + r.w / 2, -(r.y + r.h * .5), 0);
    rak.g.rotation.x = .12;
    const R = rak.R, S = rak.S;
    rak.items.forEach((it, i) => {
      const on = i === rak.sel, hov = i === rak.hover && !on;
      it.k += ((on ? 1.32 : hov ? 1.08 : 1) - it.k) * (reduce ? 1 : Math.min(1, dt * 8));
      it.lift += ((on ? 1 : 0) - it.lift) * (reduce ? 1 : Math.min(1, dt * 6));
      const p = reduce ? 1 : clamp((now - rak.built - it.delay) / 520, 0, 1);
      it.s = easeOut(p);
      const a = i * step - rak.yaw;
      // lingkaran dipipihkan (elips) supaya roll di belakang tidak terlalu jauh
      const x = Math.sin(a) * R, z = (Math.cos(a) - 1) * R * .6;
      // roll terpilih menampilkan kotaknya (Kindmax), yang lain hanya rollnya
      const ft = on ? 0 : 1;
      if (Math.abs(it.f - ft) > .002) { it.f += (ft - it.f) * (reduce ? 1 : Math.min(1, dt * 7)); it.obj.fokus(it.f); }
      it.h.position.set(x, it.lift * S * .08 + (1 - it.s) * -S * 1.6, z + it.lift * 40);
      it.h.scale.setScalar(Math.max(.001, S * it.k * it.s));
      it.h.rotation.x = -.12;
      if (on && !reduce) it.obj.jalan(dt);
      it.obj.g.rotation.set(.24, -.45 - a * .35 + (on && !reduce ? Math.sin(now * .0009) * .35 : 0), 0);
      it.h.visible = it.s > .01;
    });
    // kabut = warna panel rak
    fogKini.lerp(warnaRak, reduce ? 1 : Math.min(1, dt * 3));
    sceneRak.fog.color.copy(fogKini);
    return true;
  }

  function stepBuka(now, dt, sy) {
    const r = buka.r;
    if (!r) return false;
    if (!buka.muat && near(r.y, r.h, sy, Hc)) siapkanBuka();
    if (!buka.h) return false;
    const on = near(r.y, r.h, sy);
    buka.h.visible = on;
    if (!on) return false;
    // kemajuan gulir: 0 saat panggung masuk dari bawah, 1 saat keluar di atas
    const p = clamp((sy + Hc - r.y) / (Hc + r.h), 0, 1);
    const o = buka.obj, yaw = -.62 + (reduce ? 0 : (p - .5) * .7);
    // pita yang terurai memanjang ke arah kamera: ukur lebar di layar pada sudut terlebar
    // (dikali 1,15 untuk perbesaran perspektif bagian yang mendekat)
    if (!buka.lebar) buka.lebar = Math.max(...[-.97, -.62, -.27].map(y => o.lebarPada(y).w)) * 1.15;
    const fit = Math.min(r.h * .8, r.w * 1.05 / buka.lebar);
    o.waktu(reduce ? o.durasi * .25 : easeInOut((p - .12) / .5) * o.durasi * .5);
    buka.h.position.set(r.x + r.w / 2 - o.lebarPada(yaw).c * fit, -(r.y + r.h * .48), 0);
    buka.h.scale.setScalar(fit);
    o.g.rotation.set(.32, yaw, 0);
    return true;
  }

  function stepTutup(now, dt, sy) {
    const r = tutup.r;
    if (!r) return false;
    if (!tutup.muat && near(r.y, r.h, sy, Hc)) siapkanTutup();
    if (!tutup.h) return false;
    const on = near(r.y, r.h, sy);
    tutup.h.visible = on;
    if (!on) return false;
    const o = tutup.obj, fit = Math.min(r.h * .62, r.w * .84 / o.lebarDepan);
    const lewat = clamp((sy + Hc / 2 - (r.y + r.h / 2)) / Hc, -1, 1);
    if (!reduce) o.jalan(dt); else o.waktu(1.2);
    tutup.h.position.set(r.x + r.w / 2, -(r.y + r.h * .56), 0);
    tutup.h.scale.setScalar(fit);
    o.g.rotation.set(.38, -.25 + (reduce ? 0 : lewat * .5 + Math.sin(now * .0005) * .12), 0);
    return true;
  }

  function frame(now) {
    requestAnimationFrame(frame);
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const sy = scrollY;
    if (sy !== prevSy) { prevSy = sy; needs = true; }

    // lampu tepi mengikuti warna roll pilihan
    if (!lampu.tepi.color.equals(warnaTepi)) { lampu.tepi.color.lerp(warnaTepi, reduce ? 1 : Math.min(1, dt * 4)); lampuRak.tepi.color.copy(lampu.tepi.color); needs = true; }

    const a = stepHero(now, dt, sy);
    const b = stepRak(now, dt, sy);
    const c = stepBuka(now, dt, sy);
    const d = stepTutup(now, dt, sy);
    const ada = a || b || c || d || !!hero.keluar;
    // benda bergerak sendiri (melayang, melompat) hanya bila gerak tidak dikurangi
    if (ada && !reduce) needs = true;
    if (ada !== adaTadi) { needs = true; adaTadi = ada; }
    if (!needs) return;
    needs = false;

    camera.position.y = -(sy + Hc / 2);
    renderer.setScissorTest(false);
    renderer.clear();
    renderer.render(scene, camera);
    if (b) {
      // rak hanya digambar di dalam panggungnya
      const r = rak.r, top = r.y - sy;
      renderer.clearDepth();
      renderer.setScissorTest(true);
      renderer.setScissor(r.x - scrollX, Hc - (top + r.h), r.w, r.h);
      renderer.render(sceneRak, camera);
      renderer.setScissorTest(false);
    }

    // Hemat: bila frame terus lambat, turunkan resolusi kanvas
    if (dt > .034) { if (++slow > 45 && dpr > .8) { dpr = Math.max(.75, dpr - .25); slow = 0; renderer.setPixelRatio(dpr); renderer.setSize(W, Hc, false); } }
    else slow = Math.max(0, slow - 2);
  }

  mobile = root.clientWidth < 760;
  layout();
  heroGanti(st);
  // model jenis lain dimuat diam-diam supaya ganti tab terasa langsung
  const sisa = () => (window.GG.lines || []).forEach(s => muatAwal(s));
  if ('requestIdleCallback' in window) requestIdleCallback(sisa, { timeout: 4000 }); else setTimeout(sisa, 2500);
  let lt = 0;
  const relayout = () => { clearTimeout(lt); lt = setTimeout(layout, 120); };
  addEventListener('resize', () => { if (root.clientWidth !== W || Math.abs(($('#lvh').offsetHeight || innerHeight) - Hc) > 120) relayout(); });
  if ('ResizeObserver' in window) new ResizeObserver(relayout).observe(document.body);
  addEventListener('load', relayout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(relayout);
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); root.classList.add('no3d'); });
  requestAnimationFrame(frame);
}
