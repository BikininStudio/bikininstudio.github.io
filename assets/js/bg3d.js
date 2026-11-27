// Latar 3D untuk semua halaman (v8 "meja studio", 2026-11-05).
// Benda-benda dari pekerjaan Bikinin Studio, dibuat dari kaca dan melayang pelan:
// kini hanya logo "b" kaca di beranda (hiasan kursor/pena/swatch sudah dibuang). Latar pasir polos, kalem.
// Hemat: berhenti saat tab tersembunyi, resolusi dibatasi, satu frame diam bila reduced-motion.
const VENDOR = "/assets/vendor/three/";
const GROUND = 0x0a1218, ACCENT = 0x3db4ff;

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
  const gSolid = (c, r = 0.35) => new T.MeshStandardMaterial({ color: c, roughness: r, metalness: 0 });

  const world = new T.Group(); scene.add(world);
  const items = [];
  // fx/fy: posisi relatif lebar/tinggi layar; fs: skala relatif tinggi layar; rot: kemiringan dasar


  // Hiasan kursor/pena/swatch dibuang: beranda 2026-11-12, halaman dalam 2026-11-26 (permintaan Kuro, terasa tempelan).

  // ---- Logo "b" kaca (beranda) ----
  let logo = null;
  if (centre) {
    const { shapes } = await import("/assets/js/hero3d.js?v=mwyxdl67");
    const { body, dot } = shapes(T);
    const ex = { depth: 0.5, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.07, bevelSegments: small ? 3 : 6, curveSegments: small ? 20 : 48 };
    const gB = new T.ExtrudeGeometry(body, ex);
    const bb = new T.Box3().setFromBufferAttribute(gB.attributes.position);
    const cx = (bb.min.x + bb.max.x) / 2, cy = (bb.min.y + bb.max.y) / 2;
    gB.translate(-cx, -cy, -ex.depth / 2);
    const gD = new T.ExtrudeGeometry(dot, ex); gD.translate(-cx, -cy, -ex.depth / 2);
    logo = new T.Group();
    logo.add(new T.Mesh(gB, glass({ thickness: 2.2, transmission: 0.55, roughness: 0.18, color: 0xeef7ff, attenuationColor: new T.Color(0xcfeaff), attenuationDistance: 4, envMapIntensity: 2.6, specularIntensity: 1, iridescence: 0.15, emissive: 0x1b3a52, emissiveIntensity: 0.6 })), new T.Mesh(gD, gSolid(ACCENT, 0.3)));
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
