// Objek hero 3D: logo "b" + titik (docs/DESIGN.md 11.1). Modul ini dimuat dinamis oleh main.js, tidak pernah pada jalur render pertama.
// Bentuk dibangun dari kode (tanpa GLB/tekstur). Poster webp di markup tampil lebih dulu dan tetap dipakai bila WebGL / reduced-motion.
const VENDOR = "/assets/vendor/three/";
const S = 1 / 150, CX = 239.5, CY = 209.5; // koordinat SVG logo (viewBox 440) -> unit dunia, tinggi ~1,9
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
let T = null, ENV = null; // modul three + RoomEnvironment (dimuat sekali)

export async function loadThree(small) {
  if (!T) T = await import(VENDOR + "three.module.min.js");
  if (!small && !ENV) ENV = (await import(VENDOR + "RoomEnvironment.js")).RoomEnvironment;
  return T;
}

// Satu Shape untuk batang + mangkuk (tanpa dua ekstrusi bertumpuk), titik terpisah.
function shapes(THREE) {
  const P = (x, y) => new THREE.Vector2((x - CX) * S, -(y - CY) * S);
  const c1 = P(154, 102), cb = P(219, 263), cd = P(314, 99);
  const a0 = Math.atan2(Math.sqrt(95 * 95 - 35 * 35), -35); // titik potong batang-mangkuk di x=184
  const bot = P(124, 358), r = P(184, 358);
  const body = new THREE.Shape();
  body.moveTo(bot.x, bot.y);
  body.lineTo(bot.x, c1.y);
  body.absarc(c1.x, c1.y, 30 * S, Math.PI, 0, true);       // puncak batang
  body.absarc(cb.x, cb.y, 95 * S, a0, -a0, true);          // mangkuk searah jarum jam (menyambung otomatis dari puncak)
  body.lineTo(r.x, r.y);
  const hole = new THREE.Path();
  hole.absarc(cb.x, cb.y, 38 * S, 0, Math.PI * 2, false);
  body.holes.push(hole);
  const dot = new THREE.Shape();
  dot.absarc(cd.x, cd.y, 41 * S, 0, Math.PI * 2, false);
  return { body, dot };
}

export function createRig(THREE, { small, renderer }) {
  const { body: b, dot } = shapes(THREE);
  const opt = { depth: 50 * S, bevelEnabled: true, bevelThickness: 6 * S, bevelSize: 6 * S, bevelSegments: small ? 1 : 4, curveSegments: small ? 10 : 28 };
  const gBody = new THREE.ExtrudeGeometry(b, opt), gDot = new THREE.ExtrudeGeometry(dot, opt);
  gBody.translate(0, 0, -opt.depth / 2); gDot.translate(0, 0, -opt.depth / 2);

  const mBody = small ? new THREE.MeshStandardMaterial({ color: "#D9CDBF", roughness: 0.45 })
    : new THREE.MeshPhysicalMaterial({ color: "#D9CDBF", roughness: 0.42, clearcoat: 0.5, clearcoatRoughness: 0.25 });
  const mDot = small ? new THREE.MeshStandardMaterial({ color: "#33505E", roughness: 0.35 })
    : new THREE.MeshPhysicalMaterial({ color: "#33505E", roughness: 0.3, clearcoat: 0.8, clearcoatRoughness: 0.2 });
  const logo = new THREE.Group();
  logo.add(new THREE.Mesh(gBody, mBody), new THREE.Mesh(gDot, mDot));

  // bayangan blob (tanpa shadow map)
  const cv = document.createElement("canvas"); cv.width = cv.height = 64;
  const g = cv.getContext("2d"), rg = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  rg.addColorStop(0, "rgba(43,32,25,1)"); rg.addColorStop(1, "rgba(43,32,25,0)");
  g.fillStyle = rg; g.fillRect(0, 0, 64, 64);
  const tShadow = new THREE.CanvasTexture(cv);
  const mShadow = new THREE.MeshBasicMaterial({ map: tShadow, transparent: true, opacity: 0.28, depthWrite: false });
  const gShadow = new THREE.PlaneGeometry(1, 1);
  const shadow = new THREE.Mesh(gShadow, mShadow);
  shadow.rotation.x = -Math.PI / 2; shadow.scale.set(2.3, 2.3, 1); shadow.position.y = -1.18;

  const scene = new THREE.Scene();
  scene.add(shadow, logo);
  let pmrem = null, envTex = null;
  if (small) {
    scene.add(new THREE.HemisphereLight("#F4EFE8", "#8F7F70", 1.1));
  } else {
    pmrem = new THREE.PMREMGenerator(renderer);
    envTex = pmrem.fromScene(new ENV(), 0.04).texture;
    scene.environment = envTex; scene.environmentIntensity = 0.55;
  }
  const key = new THREE.DirectionalLight("#FFE3C8", small ? 1.8 : 2.2); key.position.set(-3, 4, 5);
  scene.add(key);
  if (!small) { const rim = new THREE.DirectionalLight("#CFE0E8", 1.0); rim.position.set(3, 2, -4); scene.add(rim); }

  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  camera.position.set(0, 0.4, 6.5); camera.lookAt(0, -0.02, 0);

  return {
    scene, camera, logo, shadow,
    tris: (gBody.attributes.position.count + gDot.attributes.position.count) / 3,
    pose(rotX, rotY, y) { logo.rotation.set(rotX, rotY, 0); logo.position.y = y; shadow.material.opacity = 0.28 - y * 0.25; },
    dispose() {
      [gBody, gDot, gShadow, mBody, mDot, mShadow, tShadow, envTex].forEach((o) => o && o.dispose());
      pmrem && pmrem.dispose();
      scene.clear();
    },
  };
}

// Mulai objek di dalam `stage` (.h3d). Mengembalikan pengendali { destroy() } atau null bila WebGL tidak tersedia.
export async function start(stage, hero, { small }) {
  const THREE = await loadThree(small);
  let renderer = null, rig = null, alive = true, running = false, killTimer = 0, canvas = null, ro = null;
  let px = 0, py = 0, tx = 0, ty = 0, prog = 0, heroH = 1, t0 = 0, last = 0;
  const onMove = (e) => { if (e.pointerType === "mouse") { tx = (e.clientX / innerWidth) * 2 - 1; ty = (e.clientY / innerHeight) * 2 - 1; } };
  const onScroll = () => { prog = clamp(scrollY / heroH); };

  const build = () => {
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !small, alpha: true, powerPreference: "low-power" });
    } catch (e) { canvas = null; renderer = null; return false; }
    renderer.setPixelRatio(small ? 1 : Math.min(devicePixelRatio || 1, 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    rig = createRig(THREE, { small, renderer });
    stage.appendChild(canvas);
    ro = new ResizeObserver(() => { renderer.setSize(stage.clientWidth, stage.clientHeight, false); heroH = hero.offsetHeight || 1; onScroll(); });
    ro.observe(stage);
    t0 = 0; px = py = tx = ty = 0;
    return true;
  };
  const frame = (ms) => {
    if (!t0) { t0 = ms; last = ms; }
    const t = (ms - t0) / 1000, k = 1 - Math.pow(0.92, Math.min(3, (ms - last) / 16.7)); // lerp 0,08 per frame @60fps
    last = ms;
    px += (tx - px) * k; py += (ty - py) * k;
    const sway = Math.sin(t * 0.35), bob = 0.04 * Math.sin(t * 0.8);
    let rx, ry;
    if (small) { rx = 0.05 + 0.3 * prog; ry = -0.2 + 0.7 * prog + 0.175 * sway; }
    else { rx = 0.05 - py * 0.15 + 0.3 * prog; ry = -0.15 + 0.35 * sway + px * 0.25; }
    rig.pose(rx, ry, bob + prog * 0.28);
    renderer.render(rig.scene, rig.camera);
    if (!stage.classList.contains("is-live")) stage.classList.add("is-live");
  };
  const run = (on) => {
    if (!renderer || on === running) return;
    running = on;
    renderer.setAnimationLoop(on ? frame : null);
  };
  const teardown = () => {
    run(false);
    ro && ro.disconnect(); ro = null;
    if (rig) { rig.dispose(); rig = null; }
    if (renderer) { renderer.dispose(); renderer.forceContextLoss(); renderer = null; }
    if (canvas) { canvas.remove(); canvas = null; }
    stage.classList.remove("is-live");
  };
  // Satu sumber kebenaran visibilitas: kelas .fx-off pada hero (di luar layar / tab tersembunyi), diatur main.js.
  const sync = () => {
    if (!alive) return;
    if (hero.classList.contains("fx-off")) {
      run(false);
      if (!killTimer) killTimer = setTimeout(() => { killTimer = 0; if (hero.classList.contains("fx-off")) teardown(); }, 20000); // lepas WebGL bila lama tak terlihat
    } else {
      clearTimeout(killTimer); killTimer = 0;
      if (!renderer && !build()) { destroy(); return; }
      run(true);
    }
  };
  const mo = new MutationObserver(sync);
  const destroy = () => {
    alive = false; mo.disconnect(); clearTimeout(killTimer);
    hero.removeEventListener("pointermove", onMove); removeEventListener("scroll", onScroll);
    teardown();
  };
  if (!build()) return null;
  hero.addEventListener("pointermove", onMove, { passive: true });
  addEventListener("scroll", onScroll, { passive: true });
  mo.observe(hero, { attributes: true, attributeFilter: ["class"] });
  sync();
  return { destroy };
}
