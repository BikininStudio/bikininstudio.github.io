// Latar 3D untuk semua halaman (v8 "meja studio", 2026-11-05).
// Benda-benda dari pekerjaan Bikinin Studio, dibuat dari kaca dan melayang pelan:
// kursor kaca, kurva pen tool dengan titik jangkar,
// contoh warna (swatch), dan di beranda logo "b" kaca yang bisa diseret. Latar pasir polos, kalem.
// Hemat: berhenti saat tab tersembunyi, resolusi dibatasi, satu frame diam bila reduced-motion.
const VENDOR = "/assets/vendor/three/";
const GROUND = 0x0a1218, ORANGE = 0x3db4ff, INK = 0x0a1620, SAND = 0xf4f1ec;

export async function start(opts = {}) {
  const T = await import(VENDOR + "three.module.min.js");
  const small = matchMedia("(max-width: 767px)").matches || (navigator.hardwareConcurrency || 8) <= 4;
  const still = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const centre = opts.layout === "centre" && document.body.classList.contains("home");

  const canvas = document.createElement("canvas");
  canvas.className = "bg3d"; canvas.setAttribute("aria-hidden", "true");
  let renderer;
  try { renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: small ? "low-power" : "high-performance" }); }
  catch (e) { return null; }
  document.body.prepend(canvas);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1.25 : 1.6));
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95;

  const scene = new T.Scene();
  scene.background = new T.Color(GROUND);
  const { RoomEnvironment } = await import(VENDOR + "RoomEnvironment.js");
  const pm = new T.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), 0.03).texture;
  scene.environmentIntensity = 0.8;
  const key = new T.DirectionalLight(0xfff4ea, 1.8); key.position.set(-5, 7, 8); scene.add(key);
  // tema gelap 2026-11-12: cahaya tepi biru es dari kanan belakang supaya kaca menyala di latar gelap
  const rim = new T.DirectionalLight(0x3db4ff, 3.2); rim.position.set(6, 3, -6); scene.add(rim);
  const fill = new T.DirectionalLight(0xeef7ff, centre ? 2.2 : 0.8); fill.position.set(-4, 2, 7); scene.add(fill);

  const FOV = 22;
  const camera = new T.PerspectiveCamera(FOV, 1, 0.1, 100);
  camera.position.set(0, 0, 24);

  const glass = (o = {}) => new T.MeshPhysicalMaterial(Object.assign({
    color: 0xffffff, metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.6, ior: 1.5,
    clearcoat: 1, clearcoatRoughness: 0.05, specularIntensity: 0.9, envMapIntensity: 1.1,
    iridescence: small ? 0.1 : 0.3, iridescenceIOR: 1.3, iridescenceThicknessRange: [200, 500],
  }, o));
  const gPane = glass({ envMapIntensity: 0.55, specularIntensity: 0.5, iridescence: 0.12, thickness: 0.4 });
  const gSolid = (c, r = 0.35) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });

  const world = new T.Group(); scene.add(world);
  const items = [];
  // fx/fy: posisi relatif lebar/tinggi layar; fs: skala relatif tinggi layar; rot: kemiringan dasar
  const put = (obj, fx, fy, z, fs, rot, depth, spin = 0.15) => { obj.userData = { fx, fy, z, fs, rot, depth, spin, ph: Math.random() * 6.3 }; world.add(obj); items.push(obj); return obj; };

  const rrect = (w, h, r) => { const s = new T.Shape(), x = -w / 2, y = -h / 2; s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const bev = (d) => ({ depth: d, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: small ? 2 : 4, curveSegments: small ? 6 : 12 });

  // ---- Kursor kaca ----
  const cursor = () => {
    const s = new T.Shape(); s.moveTo(0, 0); s.lineTo(0, -1); s.lineTo(0.27, -0.76); s.lineTo(0.46, -1.15); s.lineTo(0.6, -1.08); s.lineTo(0.41, -0.7); s.lineTo(0.74, -0.68); s.closePath();
    const geo = new T.ExtrudeGeometry(s, bev(0.12)); geo.center();
    return new T.Mesh(geo, glass({ thickness: 1, attenuationColor: new T.Color(0x9fb1bc), attenuationDistance: 1.6 }));
  };

  // ---- Kurva pen tool: garis oranye, titik jangkar putih, pegangan kaca ----
  const pen = () => {
    const g = new T.Group();
    const p0 = new T.Vector3(-1, -0.4, 0), c1 = new T.Vector3(-0.4, 0.9, 0), c2 = new T.Vector3(0.4, -1, 0), p1 = new T.Vector3(1, 0.35, 0);
    const curve = new T.CubicBezierCurve3(p0, c1, c2, p1);
    g.add(new T.Mesh(new T.TubeGeometry(curve, small ? 60 : 120, 0.035, 12, false), gSolid(ORANGE, 0.3)));
    const anchor = new T.BoxGeometry(0.13, 0.13, 0.13), hnd = new T.SphereGeometry(0.07, 24, 12);
    const line = new T.MeshStandardMaterial({ color: INK, roughness: 0.5 });
    [[p0, c1], [p1, c2]].forEach(([a, c]) => {
      const m = new T.Mesh(anchor, gSolid(0xffffff, 0.4)); m.position.copy(a); g.add(m);
      const h = new T.Mesh(hnd, glass({ thickness: 0.3 })); h.position.copy(c); g.add(h);
      const l = new T.Mesh(new T.CylinderGeometry(0.008, 0.008, a.distanceTo(c), 6), line);
      l.position.copy(a).add(c).multiplyScalar(0.5); l.lookAt(c); l.rotateX(Math.PI / 2); g.add(l);
    });
    return g;
  };

  // ---- Contoh warna brand ----
  const swatches = () => {
    const g = new T.Group(), geo = new T.ExtrudeGeometry(rrect(0.42, 0.42, 0.08), bev(0.08));
    [ORANGE, INK, SAND].forEach((c, i) => { const m = new T.Mesh(geo, gSolid(c, 0.4)); m.position.set(i * 0.5 - 0.5, 0, 0); g.add(m); });
    const cover = new T.Mesh(new T.ExtrudeGeometry(rrect(1.56, 0.62, 0.12), bev(0.06)), gPane); cover.position.z = 0.14; g.add(cover);
    return g;
  };

  if (centre) {
    // beranda: hanya logo "b" (hiasan kursor/pena/swatch dibuang 2026-11-12 agar fokus)
  } else {
    put(cursor(), 0.43, -0.36, 1, 0.05, [0, 0, 0.35], 1.1, 0.3);
    // kanan atas: kiri atas tempat judul halaman, kurva tadinya memotong label dan judul
    put(pen(), 0.44, 0.3, 0, 0.08, [0.2, 0.1, 0.1], 1.0);
  }

  // ---- Logo "b" kaca (beranda) ----
  let logo = null;
  if (centre) {
    const { shapes } = await import("/assets/js/hero3d.js");
    const { body, dot } = shapes(T);
    const ex = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: small ? 3 : 6, curveSegments: small ? 20 : 48 };
    const gB = new T.ExtrudeGeometry(body, ex);
    const bb = new T.Box3().setFromBufferAttribute(gB.attributes.position);
    const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
    gB.translate(-cx, -cy, -ex.depth / 2);
    const gD = new T.ExtrudeGeometry(dot, ex); gD.translate(-cx, -cy, -ex.depth / 2);
    logo = new T.Group();
    logo.add(new T.Mesh(gB, glass({ thickness: 2.2, transmission: 0.55, roughness: 0.18, color: 0xeef7ff, attenuationColor: new T.Color(0xcfeaff), attenuationDistance: 4, envMapIntensity: 2.6, specularIntensity: 1, iridescence: 0.15, emissive: 0x1b3a52, emissiveIntensity: 0.6 })), new T.Mesh(gD, gSolid(ORANGE, 0.3)));
    world.add(logo);
  }

  let W = 1, H = 1, portrait = false;
  const vh0 = () => 2 * camera.position.z * Math.tan((FOV * Math.PI) / 360);
  const resize = () => { W = innerWidth; H = innerHeight; portrait = W / H < 0.8; renderer.setSize(W, H, false); camera.aspect = W / H; camera.updateProjectionMatrix(); };
  addEventListener("resize", resize); resize();
  // ruang logo di hero beranda (dokumen), diukur ulang saat tata letak berubah
  const space = centre && opts.hero ? opts.hero.querySelector(".bh-space") : null;
  let sp = null;
  const measureSpace = () => { if (!space) return; const r = space.getBoundingClientRect(); sp = r.height > 40 ? { cx: r.left + r.width / 2, cy: r.top + scrollY + r.height / 2, w: r.width, h: r.height } : null; };
  if (space) { measureSpace(); addEventListener("resize", measureSpace); if (window.ResizeObserver) new ResizeObserver(measureSpace).observe(opts.hero); if (document.fonts) document.fonts.ready.then(measureSpace); }

  let mx = 0, my = 0, tmx = 0, tmy = 0, dragY = 0, dragV = 0;
  addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") { tmx = e.clientX / W * 2 - 1; tmy = e.clientY / H * 2 - 1; } }, { passive: true });
  const grab = opts.grab;
  if (grab && logo) {
    let down = false, lx = 0;
    grab.addEventListener("pointerdown", (e) => { if (e.target.closest("a,button,input,select,textarea")) return; down = true; lx = e.clientX; grab.classList.add("grabbing"); });
    addEventListener("pointermove", (e) => { if (!down) return; dragV = (e.clientX - lx) * 0.012; dragY += dragV; lx = e.clientX; });
    addEventListener("pointerup", () => { down = false; grab.classList.remove("grabbing"); });
  }

  const clock = new T.Clock();
  let raf = 0;
  const enterT = (t) => { const k = Math.min(1, Math.max(0, (t - 0.15) / 1.4)); return 1 - Math.pow(1 - k, 4); };
  const frame = () => {
    const dt = Math.min(clock.getDelta(), 0.05), t = still ? 0 : clock.elapsedTime;
    mx += (tmx - mx) * Math.min(1, dt * 3); my += (tmy - my) * Math.min(1, dt * 3);
    dragV *= 0.93; dragY += dragV * 0.15;
    const vh = vh0(), vw = vh * camera.aspect, sP = scrollY / Math.max(1, H);
    for (const m of items) {
      const u = m.userData, span = vh * 1.7;
      const base = u.fy * vh + sP * vh * 0.32 * u.depth;
      const yy = ((base + span / 2) % span + span) % span - span / 2;
      const fx = portrait ? Math.sign(u.fx) * Math.max(Math.abs(u.fx), 0.56) : u.fx;
      m.position.set(fx * vw + mx * 0.35 * u.depth, yy - my * 0.25 * u.depth + Math.sin(t * 0.5 + u.ph) * 0.18, u.z);
      m.scale.setScalar(u.fs * vh * (portrait ? 0.6 : 1));
      m.rotation.set(u.rot[0] + Math.sin(t * u.spin + u.ph) * 0.08 + my * 0.08, u.rot[1] + Math.cos(t * u.spin * 0.8 + u.ph) * 0.12 + mx * 0.12, u.rot[2]);
    }
    if (logo) {
      // 2026-11-12: logo mengikuti ruang .bh-space di hero (bukan pecahan tinggi layar),
      // jadi selalu utuh di bawah header pada layar lebar-pendek maupun tinggi.
      const kz = (camera.position.z - 2) / camera.position.z, vz = vh * kz;
      let s, lx = 0, ly;
      if (sp) {
        s = Math.max(0.5, Math.min(sp.h * 0.7, sp.w * 0.5, H * 0.26) / H * vz);
        lx = (sp.cx / W - 0.5) * vz * camera.aspect;
        ly = (0.5 - (sp.cy - scrollY) / H) * vz;
      } else {
        s = portrait ? Math.min(vw * 0.36, vh * 0.17) : Math.min(vh * 0.23, vw * 0.16);
        ly = (portrait ? 0.25 : 0.19) * vh + Math.min(sP, 0.7) * vh * 0.9;
      }
      logo.scale.setScalar(s / 1.9);
      logo.position.set(lx + mx * 0.3 + (still ? 0 : (1 - enterT(clock.elapsedTime)) * vw * 0.55), ly + Math.sin(t * 0.6) * s * 0.04, 2);
      logo.rotation.set(0.08 + my * 0.15, (still ? -0.4 : Math.sin(t * 0.35) * 0.5 - 0.25) + dragY + mx * 0.35, 0);
    }
    renderer.render(scene, camera);
  };
  const loop = () => { cancelAnimationFrame(raf); if (document.hidden) return; frame(); if (!still) raf = requestAnimationFrame(loop); };
  document.addEventListener("visibilitychange", loop);
  if (still) { frame(); addEventListener("scroll", () => requestAnimationFrame(frame), { passive: true }); addEventListener("resize", () => requestAnimationFrame(frame)); setTimeout(frame, 800); }
  else loop();
  document.documentElement.classList.add("has-bg3d");
  return { renderer };
}
