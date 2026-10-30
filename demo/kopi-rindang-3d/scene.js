// Kopi Rindang 3D: kebun -> jemur -> sangrai -> jalan setapak -> kedai di bawah pohon rindang -> pandangan jauh.
// Kamera ortografis terbang antar area mengikuti scroll; langit bergeser dari pagi ke senja, lampu gantung menyala bertahap.
// Model dibuat dengan kode: tekstur kanvas (kayu, genteng, batu, karung), pohon organik dari gumpalan daun, manusia bersama (../3d/humans*.js).
import { seg, mix, canvasTexture } from "../3d/scroll3d.js";
import { applyEnv } from "../3d/kit3d.js";
import { createHumans } from "../3d/humans.js";
import { createGlbHumans } from "../3d/humans-glb.js";
import { mergeVertices, mergeGeometries } from "../3d/BufferGeometryUtils.js";

const PANELS = 6; // samakan dengan jumlah .panel di bab ini
// Nada menengah, kejenuhan rendah (docs/DESIGN.md 11.4)
const C = { bark: "#6B4A34", bark2: "#85644A", wood: "#A57B55", lamp: "#F2C97A" };
const KEYS = [
  { x: -24, z: -8, size: 10, turn: -0.2 },
  { x: -8, z: 1.5, size: 9, turn: 0.15 },
  { x: 6, z: 1.5, size: 8.5, turn: 0.25 },
  { x: 13, z: 5, size: 9, turn: 0 },
  { x: 19, z: 12, size: 11.5, turn: -0.25 },
  { x: 0, z: 2, size: 27, turn: 0.1 },
];

// Acak berbenih supaya pemandangan sama di setiap kunjungan
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const sn = (x, z) => Math.sin(x * 0.31 + Math.sin(z * 0.23) * 1.7) * 0.5 + Math.sin(z * 0.19 - x * 0.11) * 0.3 + Math.sin((x + z) * 0.07) * 0.2; // noise halus -1..1

export async function create(THREE, ctx) {
  const { small } = ctx;
  try { await document.fonts.load('600 60px "Fraunces"'); } catch (e) { /* font cadangan */ }
  const scene = new THREE.Scene();
  const bgDay = new THREE.Color("#CBD6C6"), bgDusk = new THREE.Color("#C9987A");
  scene.background = bgDay.clone();
  scene.fog = new THREE.Fog(bgDay.clone(), 150, 235);
  const hemi = new THREE.HemisphereLight("#FFFFFF", "#8F9A7C", 1.0);
  const sun = new THREE.DirectionalLight("#FFF1D6", 2.3);
  sun.position.set(-20, 40, 25);
  sun.castShadow = !small;
  Object.assign(sun.shadow.camera, { left: -52, right: 52, top: 52, bottom: -52, near: 1, far: 150 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.04;
  sun.target.position.set(0, 0, 2);
  scene.add(hemi, sun, sun.target);
  const sunDay = new THREE.Color("#FFF1D6"), sunDusk = new THREE.Color("#F0AA6A");
  if (!small) await applyEnv(THREE, ctx, scene, 0.28);

  // ---------- bahan & tekstur ----------
  const mats = {};
  const mat = (c, o = {}) => {
    const key = c + JSON.stringify(o);
    return (mats[key] ||= small
      ? new THREE.MeshLambertMaterial({ color: c, ...(o.map ? { map: o.map } : {}), ...(o.vertexColors ? { vertexColors: true } : {}) })
      : new THREE.MeshStandardMaterial({ color: c, roughness: 0.88, metalness: 0, ...o }));
  };
  const M = (m) => (typeof m === "string" ? mat(m) : m);
  const texCache = {};
  const tex = (key, w, h, draw, rx = 1, ry = 1) => {
    const k = `${key}|${rx}|${ry}`;
    if (!texCache[k]) {
      const t = (texCache[key] ||= canvasTexture(THREE, w, h, draw)).clone();
      t.needsUpdate = true;
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(rx, ry);
      texCache[k] = t;
    }
    return texCache[k];
  };
  const speck = (g, w, h, n, cols, rmin, rmax) => { for (let i = 0; i < n; i++) { g.fillStyle = cols[(rnd() * cols.length) | 0]; g.beginPath(); g.ellipse(rnd() * w, rnd() * h, rmin + rnd() * (rmax - rmin), (rmin + rnd() * (rmax - rmin)) * 0.7, rnd() * 3, 0, 7); g.fill(); } };
  const drawPlank = (base) => (g, w, h) => {
    const rows = 6, ph = h / rows;
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    for (let r = 0; r < rows; r++) {
      g.fillStyle = `rgba(${rnd() > 0.5 ? "255,235,200" : "40,25,10"},${0.05 + rnd() * 0.1})`; g.fillRect(0, r * ph, w, ph);
      for (let i = 0; i < 14; i++) { g.strokeStyle = `rgba(50,30,15,${0.08 + rnd() * 0.12})`; g.lineWidth = 1; const y = r * ph + rnd() * ph; g.beginPath(); g.moveTo(rnd() * w * 0.3, y); g.bezierCurveTo(w * 0.3, y + rnd() * 3 - 1.5, w * 0.7, y + rnd() * 3 - 1.5, w, y); g.stroke(); }
      g.fillStyle = "rgba(30,18,8,.55)"; g.fillRect(0, r * ph, w, 2);
      if (rnd() > 0.6) { g.fillStyle = "rgba(40,22,10,.35)"; g.beginPath(); g.ellipse(rnd() * w, r * ph + ph / 2, 6, 3, 0, 0, 7); g.fill(); }
    }
  };
  const drawTile = (g, w, h) => {
    g.fillStyle = "#98583B"; g.fillRect(0, 0, w, h);
    const cols = 10, rows = 8, cw = w / cols, rh = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const x = c * cw + (r % 2 ? cw / 2 : 0), tone = 0.82 + rnd() * 0.3;
      g.fillStyle = `rgb(${(160 * tone) | 0},${(92 * tone) | 0},${(62 * tone) | 0})`; g.fillRect(x, r * rh, cw - 1, rh - 1);
      const gr = g.createLinearGradient(0, r * rh, 0, (r + 1) * rh); gr.addColorStop(0, "rgba(0,0,0,.28)"); gr.addColorStop(0.35, "rgba(0,0,0,0)"); gr.addColorStop(1, "rgba(0,0,0,.12)");
      g.fillStyle = gr; g.fillRect(x, r * rh, cw - 1, rh - 1);
    }
    speck(g, w, h, 40, ["rgba(90,100,60,.35)"], 2, 6);
  };
  const drawStone = (g, w, h) => {
    g.fillStyle = "#70685D"; g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 26) { let x = -rnd() * 30; while (x < w) { const sw = 34 + rnd() * 40, tone = 0.8 + rnd() * 0.4; g.fillStyle = `rgb(${(150 * tone) | 0},${(142 * tone) | 0},${(128 * tone) | 0})`; g.fillRect(x + 2, y + 2, sw - 3, 22); x += sw; } }
  };
  const drawBurlap = (g, w, h) => {
    g.fillStyle = "#BBA37B"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < w; i += 3) { g.fillStyle = `rgba(80,55,30,${0.05 + rnd() * 0.08})`; g.fillRect(i, 0, 1, h); }
    for (let j = 0; j < h; j += 3) { g.fillStyle = `rgba(80,55,30,${0.05 + rnd() * 0.08})`; g.fillRect(0, j, w, 1); }
    g.fillStyle = "#4F3320"; g.textAlign = "center";
    [0.12, 0.45, 0.78].forEach((u) => { g.font = '600 26px "Fraunces", Georgia, serif'; g.fillText("KOPI", w * u, h * 0.5); g.fillText("RINDANG", w * u, h * 0.5 + 28); g.font = "500 14px sans-serif"; g.fillText("ARABIKA · 25 KG", w * u, h * 0.5 + 52); });
  };
  const drawBeans = (dark) => (g, w, h) => {
    g.fillStyle = dark ? "#4E3223" : "#8E9560"; g.fillRect(0, 0, w, h);
    speck(g, w, h, 900, dark ? ["#6B4630", "#3F281B", "#5A3A28", "#7A5238"] : ["#A5AB74", "#7D8656", "#9AA06C", "#B7B986"], 3, 6);
  };
  const drawBoard = (lines, bg = "#262E29", fg = "#EDE6D6") => (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.strokeStyle = "#8A6A4A"; g.lineWidth = 14; g.strokeRect(7, 7, w - 14, h - 14);
    g.fillStyle = fg; g.textAlign = "center";
    lines.forEach(([t, size, y, weight]) => { g.font = `${weight || 600} ${size}px "Fraunces", Georgia, serif`; g.fillText(t, w / 2, y); });
  };
  const woodMat = (base = "#A57B55", rx = 1, ry = 1) => mat("#FFFFFF", { map: tex("plank" + base, 256, 256, drawPlank(base), rx, ry) });
  const tileMat = (rx = 1, ry = 1) => mat("#FFFFFF", { map: tex("tile", 256, 256, drawTile, rx, ry) });
  const stoneMat = (rx = 1, ry = 1) => mat("#FFFFFF", { map: tex("stone", 256, 256, drawStone, rx, ry) });
  const glow = canvasTexture(THREE, 64, 64, (g, w) => { const r = g.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2); r.addColorStop(0, "rgba(255,226,160,1)"); r.addColorStop(0.3, "rgba(255,200,120,.45)"); r.addColorStop(1, "rgba(255,190,100,0)"); g.fillStyle = r; g.fillRect(0, 0, w, w); });

  // ---------- pembantu bentuk ----------
  const shade = (m) => { m.castShadow = m.receiveShadow = true; return m; };
  const box = (w, h, d, m, x, y, z, parent = scene) => { const o = shade(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), M(m))); o.position.set(x, y, z); parent.add(o); return o; };
  const cyl = (rt, rb, h, m, x, y, z, parent = scene, n = 14) => { const o = shade(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), M(m))); o.position.set(x, y, z); parent.add(o); return o; };
  const ball = (r, m, x, y, z, parent = scene, sy = 1) => { const o = shade(new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), M(m))); o.position.set(x, y, z); o.scale.y = sy; parent.add(o); return o; };
  const up = new THREE.Vector3(0, 1, 0);
  // batang meruncing antara dua titik
  const limb = (p0, p1, r0, r1, m, parent = scene) => {
    const d = new THREE.Vector3().subVectors(p1, p0), len = d.length();
    const o = shade(new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 8), M(m)));
    o.position.copy(p0).addScaledVector(d, 0.5);
    o.quaternion.setFromUnitVectors(up, d.normalize());
    parent.add(o);
    return o;
  };
  const jitter = (geo, amt, k = 1) => { const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = 1 + Math.sin(x * 3.1 * k + y * 2.3) * Math.cos(z * 2.7 * k + x) * amt; p.setXYZ(i, x * n, y * n, z * n); } geo.computeVertexNormals(); return geo; };

  // ---------- tanah & bukit ----------
  const gGeo = new THREE.PlaneGeometry(260, 260, small ? 24 : 110, small ? 24 : 110);
  gGeo.rotateX(-Math.PI / 2);
  { const p = gGeo.attributes.position, col = new Float32Array(p.count * 3), a = new THREE.Color("#8FA074"), b = new THREE.Color("#B1B98C"), c = new THREE.Color("#7E9065"), t = new THREE.Color();
    for (let i = 0; i < p.count; i++) { const n = sn(p.getX(i) * 1.7, p.getZ(i) * 1.7) + Math.sin(p.getX(i) * 1.3) * Math.sin(p.getZ(i) * 1.1) * 0.25; t.copy(a).lerp(n > 0 ? b : c, Math.min(1, Math.abs(n) * 0.9)); col.set([t.r, t.g, t.b], i * 3); }
    gGeo.setAttribute("color", new THREE.BufferAttribute(col, 3)); }
  const ground = new THREE.Mesh(gGeo, mat("#FFFFFF", { vertexColors: true }));
  ground.receiveShadow = true;
  scene.add(ground);
  [[-48, -34, 24, 16], [-20, -48, 28, 20], [14, -50, 26, 14], [46, -32, 22, 15], [-62, -4, 20, 14], [64, 6, 20, 12], [-8, -62, 30, 22], [34, -58, 26, 16]].forEach(([x, z, r, h], k) => {
    const geo = jitter(new THREE.ConeGeometry(r, h, 18, 6), 0.1, 0.6);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), lo = new THREE.Color(k % 2 ? "#86996F" : "#7B8F6B"), hi = new THREE.Color("#A9B393"), t = new THREE.Color();
    for (let i = 0; i < p.count; i++) { t.copy(lo).lerp(hi, Math.max(0, p.getY(i) / h + 0.4)); col.set([t.r, t.g, t.b], i * 3); }
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const m = new THREE.Mesh(geo, mat("#FFFFFF", { vertexColors: true }));
    m.position.set(x, h / 2 - 0.4, z); m.scale.z = 0.8;
    scene.add(m);
  });

  // ---------- jalan setapak ----------
  const pathPts = [[-17, -3], [-12, 1], [-6, 3.5], [0, 3.2], [6, 4.8], [11, 5.2], [14.2, 6.8]].map(([x, z]) => new THREE.Vector3(x, 0, z));
  const route = new THREE.CatmullRomCurve3(pathPts, false, "catmullrom", 0.4);
  const gravel = mat("#FFFFFF", { map: tex("gravel", 128, 128, (g, w, h) => { g.fillStyle = "#B09370"; g.fillRect(0, 0, w, h); speck(g, w, h, 260, ["#C8B08C", "#9A7F5C", "#D6C3A2", "#8A6F50"], 1.5, 4); }, 1, 1) });
  { const N = 70, pos = [], uv = [], idx = [];
    for (let i = 0; i <= N; i++) { const t = i / N, p = route.getPointAt(t), tg = route.getTangentAt(t), nx = -tg.z, nz = tg.x, w = 0.95 + Math.sin(t * 17) * 0.12; pos.push(p.x + nx * w, 0.04, p.z + nz * w, p.x - nx * w, 0.04, p.z - nz * w); uv.push(0, t * 18, 1, t * 18); if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, gravel); m.receiveShadow = true; scene.add(m); }
  const pathSamples = Array.from({ length: 60 }, (_, i) => route.getPointAt(i / 59));
  // area terlarang untuk rumput dan batu: [x0, z0, x1, z1]
  const NO = [[-34, -17, -14, -1], [-14, -3, -2, 11], [0, -6, 14, 8], [14, 3, 36, 19], [22, -2, 34, 8]];
  const blocked = (x, z) => NO.some(([a, b, c, d]) => x > a && x < c && z > b && z < d) || pathSamples.some((p) => Math.hypot(p.x - x, p.z - z) < 1.7);

  // rumput liar berumpun (bergoyang tertiup angin), bunga, batu
  const grassU = { value: 0 };
  { const clusters = small ? 170 : 540, per = small ? 7 : 9, N = clusters * per;
    const gm = mat("#FEFEFE", {});
    gm.onBeforeCompile = (sh) => { sh.uniforms.uT = grassU; sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform float uT;").replace("#include <begin_vertex>", "#include <begin_vertex>\n#ifdef USE_INSTANCING\nvec2 ip = vec2(instanceMatrix[3][0], instanceMatrix[3][2]);\n#else\nvec2 ip = vec2(0.0);\n#endif\ntransformed.x += sin(uT * 1.7 + ip.x * 0.8 + ip.y * 0.5) * 0.14 * position.y;\ntransformed.z += cos(uT * 1.3 + ip.x * 0.5 + ip.y * 0.9) * 0.09 * position.y;"); };
    const im = new THREE.InstancedMesh(new THREE.ConeGeometry(0.09, 0.9, 4, 3).translate(0, 0.45, 0), gm, N), o = new THREE.Object3D(), c = new THREE.Color(), cols = ["#6E8754", "#7C9660", "#92A56C", "#A4B278", "#5E7A4A", "#869C5B"];
    let n = 0;
    for (let k = 0; k < clusters * 5 && n < N - per; k++) {
      const cx = (rnd() - 0.5) * 130, cz = (rnd() - 0.5) * 110 + 4;
      if (blocked(cx, cz)) continue;
      const base = cols[(rnd() * cols.length) | 0], sc = 0.7 + rnd() * 0.9;
      for (let j = 0; j < per; j++) { const a = rnd() * 6.28, d = rnd() * 0.45; o.position.set(cx + Math.cos(a) * d, 0, cz + Math.sin(a) * d); o.rotation.set((rnd() - 0.5) * 0.6, rnd() * 6, (rnd() - 0.5) * 0.6); o.scale.set(1, sc * (0.6 + rnd() * 0.8), 1); o.updateMatrix(); im.setMatrixAt(n, o.matrix); im.setColorAt(n++, c.set(base).offsetHSL(0, 0, (rnd() - 0.5) * 0.06)); }
    }
    im.count = n; im.receiveShadow = true; scene.add(im); }
  const flowerSpots = [];
  { const patches = small ? 22 : 56, per = 7, N = patches * per, stems = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.012, 0.012, 0.4, 4).translate(0, 0.2, 0), mat("#5E7F4D"), N), heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 6, 5), mat("#FFFFFF", {}), N), o = new THREE.Object3D(), c = new THREE.Color(), cols = ["#E9DCA0", "#EFEBE2", "#D58FA8", "#E0A63E", "#B58BCB", "#E27D5F"];
    let n = 0;
    for (let k = 0; k < patches * 6 && n < N - per; k++) {
      const b = pathSamples[(rnd() * 60) | 0], a = rnd() * 6.28, d = 2.4 + rnd() * 5, cx = b.x + Math.cos(a) * d, cz = b.z + Math.sin(a) * d;
      if (blocked(cx, cz)) continue;
      const col = cols[(rnd() * cols.length) | 0];
      if (flowerSpots.length < 10 && rnd() < 0.3) flowerSpots.push([cx, cz]);
      for (let j = 0; j < per; j++) { const px = cx + (rnd() - 0.5) * 1.4, pz = cz + (rnd() - 0.5) * 1.4, sc = 0.7 + rnd() * 0.7; o.position.set(px, 0, pz); o.rotation.set(0, 0, 0); o.scale.set(1, sc, 1); o.updateMatrix(); stems.setMatrixAt(n, o.matrix); o.position.y = 0.4 * sc; o.scale.setScalar(1); o.updateMatrix(); heads.setMatrixAt(n, o.matrix); heads.setColorAt(n++, c.set(col)); }
    }
    stems.count = heads.count = n; scene.add(stems, heads); }
  { const N = 46, im = new THREE.InstancedMesh(jitter(new THREE.IcosahedronGeometry(1, 1), 0.2), mat("#FFFFFF", {}), N), o = new THREE.Object3D(), c = new THREE.Color();
    let n = 0;
    for (let tries = 0; tries < 600 && n < N; tries++) { const b = pathSamples[(rnd() * 60) | 0], a = rnd() * 6.28, d = 2.8 + rnd() * 2.4, x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d, s = 0.15 + rnd() * 0.35; if (blocked(x, z) || x > 12 || z > 12) continue; o.position.set(x, s * 0.35, z); o.rotation.set(rnd(), rnd() * 6, rnd()); o.scale.set(s * 1.3, s * 0.8, s); o.updateMatrix(); im.setMatrixAt(n, o.matrix); im.setColorAt(n, c.set(["#8E8A80", "#7A766C", "#A29E92"][n % 3])); n++; }
    im.count = n; im.castShadow = im.receiveShadow = true; scene.add(im); }

  // ---------- pohon organik ----------
  const crownGeo = (() => { const g0 = new THREE.IcosahedronGeometry(1, small ? 1 : 2); g0.deleteAttribute("normal"); g0.deleteAttribute("uv"); return jitter(mergeVertices(g0), 0.2, 1.4); })();
  const leafCols = ["#4F6F42", "#5E7F4D", "#6E8C57", "#7A9760", "#43633A"];
  function makeTree({ h, spread, clumps, r0 = 0.6, bark = C.bark, tint = 0, lite = false }) {
    const g = new THREE.Group(), barkM = mat(bark);
    // batang: bagian bawah melebar, permukaan bergelombang
    const prof = [[r0 * 1.9, 0], [r0 * 1.35, h * 0.06], [r0 * 0.95, h * 0.18], [r0 * 0.85, h * 0.45], [r0 * 0.7, h * 0.75], [r0 * 0.55, h]].map(([r, y]) => new THREE.Vector2(r, y));
    g.add(shade(new THREE.Mesh(jitter(new THREE.LatheGeometry(prof, 12, 0, Math.PI * 2), 0.07, 2.2), barkM)));
    for (let i = 0; i < (lite ? 0 : 5); i++) { const a = i * 1.26 + rnd() * 0.5; limb(new THREE.Vector3(Math.cos(a) * r0 * 0.7, h * 0.12, Math.sin(a) * r0 * 0.7), new THREE.Vector3(Math.cos(a) * r0 * 3, 0.05, Math.sin(a) * r0 * 3), r0 * 0.38, r0 * 0.1, barkM, g); }
    // dahan melengkung dan gumpalan daun di ujungnya
    const ends = [], nb = lite ? 4 : 5 + Math.round(spread / 1.6);
    for (let i = 0; i < nb; i++) {
      const a = (i / nb) * 6.28 + rnd() * 0.6, el = 0.45 + rnd() * 0.5, len = spread * (0.55 + rnd() * 0.35);
      const p0 = new THREE.Vector3(0, h * (0.72 + rnd() * 0.25), 0), p1 = p0.clone().add(new THREE.Vector3(Math.cos(a) * len * 0.5, len * 0.35 * el, Math.sin(a) * len * 0.5)), p2 = p1.clone().add(new THREE.Vector3(Math.cos(a + 0.3) * len * 0.5, len * 0.3 * el, Math.sin(a + 0.3) * len * 0.5));
      limb(p0, p1, r0 * 0.34, r0 * 0.2, barkM, g); limb(p1, p2, r0 * 0.2, r0 * 0.09, barkM, g);
      ends.push(p1, p2);
    }
    const crown = new THREE.InstancedMesh(crownGeo, mat("#FFFFFF", {}), clumps), o = new THREE.Object3D(), c = new THREE.Color();
    for (let k = 0; k < clumps; k++) {
      const e = ends[k % ends.length], r = (0.7 + rnd() * 0.7) * (spread / 5.2);
      o.position.set(e.x + (rnd() - 0.5) * spread * 0.45, e.y + (rnd() - 0.3) * spread * 0.28, e.z + (rnd() - 0.5) * spread * 0.45);
      o.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); o.scale.set(r * (1 + rnd() * 0.3), r * (0.7 + rnd() * 0.25), r * (1 + rnd() * 0.3)); o.updateMatrix();
      crown.setMatrixAt(k, o.matrix);
      crown.setColorAt(k, c.set(leafCols[(rnd() * leafCols.length) | 0]).offsetHSL(0, 0, tint + (o.position.y - h) * 0.004));
    }
    crown.castShadow = crown.receiveShadow = true;
    const sway = new THREE.Group(); sway.add(crown); g.add(sway);
    g.userData = { sway, ends, barkM };
    return g;
  }
  const trees = [];
  const placeTree = (x, z, opts, ry = 0) => { const t = makeTree(opts); t.position.set(x, 0, z); t.rotation.y = ry; scene.add(t); trees.push(t); return t; };

  // ---------- kebun terasering ----------
  const rows = 4, perRow = 9, TERR_X = -24;
  const terrY = (r) => (rows - r) * 0.55, terrZ = (r) => -14 + r * 3.6 + 0.2;
  for (let r = 0; r < rows; r++) {
    const Y = terrY(r), z = terrZ(r);
    box(18.4, Y, 3.3, stoneMat(5, Math.max(1, Y * 1.4)), TERR_X, Y / 2 - 0.02, z, scene);
    box(18.6, 0.1, 3.5, "#7F9568", TERR_X, Y + 0.02, z, scene);
    for (let k = 0; k < (small ? 0 : 7); k++) box(0.1, 0.35, 0.1, C.bark, TERR_X - 8.4 + k * 2.8, Y + 0.17, z + 1.7); // tiang pagar rendah
  }
  { const leafGeo = new THREE.SphereGeometry(1, 6, 4), per = small ? 9 : 24, cher = small ? 5 : 9, total = rows * perRow * 2;
    const leaves = new THREE.InstancedMesh(leafGeo, mat("#FFFFFF", {}), total * per), cherries = new THREE.InstancedMesh(new THREE.SphereGeometry(0.075, 7, 5), mat("#FFFFFF", {}), total * cher), o = new THREE.Object3D(), c = new THREE.Color();
    const lc = ["#3F5F35", "#4B6C3C", "#587A44", "#35542E"], cc = ["#A8473A", "#B5523F", "#9A3B30", "#C9A04A"];
    let li = 0, ci = 0;
    for (let r = 0; r < rows; r++) {
      const Y = terrY(r) + 0.07, z = terrZ(r);
      for (let k = 0; k < perRow; k++) for (let side = 0; side < 2; side++) {
        const x = TERR_X - 8 + k * 2 + side * 0.55, zz = z - 0.45 + side * 1.75, s = 0.8 + rnd() * 0.35;
        cyl(0.04 * s, 0.07 * s, 0.9 * s, "#6B5640", x, Y + 0.4 * s, zz, scene, 6).castShadow = false;
        for (let l = 0; l < per; l++) {
          const hh = 0.35 + (l / per) * 0.95, rad = (0.15 + Math.sin((l / per) * 2.6) * 0.55) * s, a = l * 2.4 + rnd();
          o.position.set(x + Math.cos(a) * rad, Y + hh * s, zz + Math.sin(a) * rad); o.rotation.set(0.25 + rnd() * 0.3, a, (rnd() - 0.5) * 0.4); o.scale.set(0.34 * s, 0.05, 0.17 * s); o.updateMatrix();
          leaves.setMatrixAt(li, o.matrix); leaves.setColorAt(li++, c.set(lc[(rnd() * 4) | 0]));
        }
        for (let b = 0; b < cher; b++) { const a = rnd() * 6.28, rad = (0.3 + rnd() * 0.4) * s; o.position.set(x + Math.cos(a) * rad, Y + (0.5 + rnd() * 0.6) * s, zz + Math.sin(a) * rad); o.rotation.set(0, 0, 0); o.scale.setScalar(1); o.updateMatrix(); cherries.setMatrixAt(ci, o.matrix); cherries.setColorAt(ci++, c.set(cc[b % 3 === 0 ? (rnd() * 4) | 0 : b % 2])); }
      }
    }
    leaves.castShadow = true; leaves.receiveShadow = true; cherries.castShadow = true;
    scene.add(leaves, cherries); }
  // pohon pelindung kebun
  placeTree(-35, -9, { h: 7, spread: 5, clumps: small ? 22 : 40, r0: 0.34 }, 0.5);
  placeTree(-14.5, -14, { h: 6, spread: 4.4, clumps: small ? 18 : 32, r0: 0.3 }, 2);

  // ---------- orang ----------
  const H = (await createGlbHumans(THREE, { small, shadow: !small, base: new URL("../assets/humans/", import.meta.url) })) || createHumans(THREE, { lit: "lambert", shadow: !small, small });
  const person = (shirt, x, y, z, ry = 0, opts = {}) => {
    const g = H.person(shirt, { short: true, hairStyle: opts.hijab ? "hijab" : opts.long ? "long" : "short", ...opts }, rnd);
    g.scale.multiplyScalar(1.1);
    g.position.set(x, y, z); g.rotation.y = ry; scene.add(g);
    return g;
  };
  const basket = (g) => { const b = new THREE.Group(); const wv = mat("#FFFFFF", { map: tex("weave", 128, 128, (c, w, h) => { c.fillStyle = "#B8935C"; c.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 8) { c.fillStyle = "rgba(60,35,10,.35)"; c.fillRect(i, 0, 2, h); c.fillRect(0, i, w, 2); } }, 2, 1) }); cyl(0.3, 0.2, 0.55, wv, 0, 0, 0, b, 12).castShadow = false; ball(0.28, "#8E2F28", 0, 0.28, 0, b, 0.5); b.position.set(0, 1.25, -0.36); b.rotation.x = -0.12; g.add(b); };
  const pickers = [[-27.5, 1, "#7C5A8F", { long: true }], [-20.5, 3, "#B26A4E", {}], [-31.5, 2, "#5F7F6A", { hijab: true }]].map(([x, r, col, o]) => {
    const g = person(col, x, terrY(r) + 0.07, terrZ(r) + 0.5, 1 + rnd(), { legs: "#4A4A52", ...o });
    basket(g);
    return g;
  });

  // ---------- para-para jemur ----------
  const beanDark = mat("#FFFFFF", { map: tex("beanD", 256, 128, drawBeans(true), 2, 1) }), beanGreen = mat("#FFFFFF", { map: tex("beanG", 256, 128, drawBeans(false), 2, 1) });
  [0, 1, 2].forEach((k) => {
    const g = new THREE.Group();
    g.position.set(k === 2 ? -10 : -8, 0, [6.4, 9.6, -1.6][k]);
    [[-2.3, -0.9], [2.3, -0.9], [-2.3, 0.9], [2.3, 0.9]].forEach(([x, z]) => box(0.14, 0.9, 0.14, C.bark, x, 0.45, z, g));
    box(4.9, 0.08, 0.1, C.bark2, 0, 0.5, -0.9, g); box(4.9, 0.08, 0.1, C.bark2, 0, 0.5, 0.9, g);
    const frame = woodMat(C.wood, 3, 1); box(5, 0.1, 2.2, frame, 0, 0.9, 0, g);
    [-2.45, 2.45].forEach((x) => box(0.1, 0.22, 2.2, frame, x, 1.0, 0, g)); [-1.05, 1.05].forEach((z) => box(5, 0.22, 0.1, frame, 0, 1.0, z, g));
    box(4.7, 0.14, 1.95, k === 0 ? beanGreen : beanDark, 0, 0.99, 0, g);
    scene.add(g);
  });
  const rake = new THREE.Group(); rake.position.set(-5.3, 0, 7.4); rake.rotation.set(0.2, 0.6, -0.35);
  cyl(0.03, 0.03, 2.4, C.bark2, 0, 1.2, 0, rake, 6); box(0.7, 0.05, 0.12, C.bark2, 0, 0.04, 0, rake); scene.add(rake);
  const sackGeo = (() => { const pts = [[0.001, 0], [0.4, 0.02], [0.5, 0.25], [0.53, 0.5], [0.47, 0.76], [0.3, 0.93], [0.14, 1.0], [0.17, 1.1], [0.1, 1.2], [0.001, 1.22]].map(([r, y]) => new THREE.Vector2(r, y)); return jitter(new THREE.LatheGeometry(pts, 20), 0.04, 3); })();
  const sackM = mat("#FFFFFF", { map: tex("burlap", 256, 128, drawBurlap, 1, 1) });
  const sack = (x, y, z, ry = 0, s = 0.9, parent = scene) => { const o = shade(new THREE.Mesh(sackGeo, sackM)); o.position.set(x, y, z); o.rotation.y = ry; o.scale.setScalar(s); parent.add(o); return o; };
  sack(-3.2, 0, 7.0, 0.5); sack(-2.2, 0, 7.4, 2.2); sack(-2.9, 0, 6.2, 4.1);
  const dryer = person("#9A5F3E", -4.3, 0, 9.2, 0.9, { legs: "#40444F" });
  const sign = (x, z, ry, lines) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; box(0.12, 1.5, 0.12, C.bark, -0.9, 0.75, 0, g); box(0.12, 1.5, 0.12, C.bark, 0.9, 0.75, 0, g); box(2.2, 0.8, 0.1, mat("#FFFFFF", { map: tex("sign" + lines[0][0], 512, 180, drawBoard(lines, "#4C3524", "#EBDDC0")) }), 0, 1.35, 0, g); scene.add(g); };
  sign(-13.5, 8.6, 0.2, [["Para-para Jemur", 46, 78], ["Kopi Rindang · hari ke-9", 28, 128, 400]]);
  sign(-17, -6.6, -0.4, [["Kebun Lereng Utara", 44, 78], ["1.250 mdpl", 30, 128, 400]]);

  // ---------- tempat sangrai ----------
  const hut = new THREE.Group();
  hut.position.set(6, 0, -2.5);
  const wall = woodMat("#C4AB86", 3, 1);
  box(7.4, 0.55, 5, stoneMat(3, 0.5), 0, 0.27, 0, hut);
  box(7, 3, 4.6, wall, 0, 2.05, 0, hut);
  [[-3.5, -2.3], [3.5, -2.3], [-3.5, 2.3], [3.5, 2.3]].forEach(([x, z]) => box(0.22, 3.1, 0.22, C.bark, x, 2.1, z, hut)); // rangka kayu
  box(7.3, 0.2, 0.24, C.bark, 0, 3.55, 2.3, hut); box(7.3, 0.2, 0.24, C.bark, 0, 3.55, -2.3, hut);
  const roofFn = (parent, w, d, h, y0, ov, rm, gm) => {
    const th = Math.atan2(h, d / 2), L = (d / 2 + ov) / Math.cos(th);
    [1, -1].forEach((s) => { const sl = shade(new THREE.Mesh(new THREE.BoxGeometry(w + 0.8, 0.16, L), rm)); sl.position.set(0, y0 + h - ((d / 2 + ov) / 2) * Math.tan(th), s * ((d / 2 + ov) / 2)); sl.rotation.x = s * th; parent.add(sl); });
    box(w + 0.9, 0.22, 0.4, "#7C4A33", 0, y0 + h + 0.1, 0, parent);
    [1, -1].forEach((s) => { const tri = new THREE.Shape(); tri.moveTo(-d / 2, 0); tri.lineTo(d / 2, 0); tri.lineTo(0, h); const m = new THREE.Mesh(new THREE.ShapeGeometry(tri), gm); m.position.set(s * (w / 2 + 0.01), y0, 0); m.rotation.y = (s * Math.PI) / 2; m.castShadow = m.receiveShadow = true; parent.add(m); });
  };
  roofFn(hut, 7, 4.6, 1.9, 3.6, 0.6, tileMat(4, 3), wall);
  box(1.3, 2.3, 0.1, "#4A3626", -2.1, 1.7, 2.31, hut); box(1.5, 0.12, 0.16, C.bark, -2.1, 2.9, 2.31, hut); box(0.12, 2.4, 0.16, C.bark, -2.8, 1.75, 2.31, hut); box(0.12, 2.4, 0.16, C.bark, -1.4, 1.75, 2.31, hut); // pintu
  box(1.5, 1.1, 0.08, "#8FA9AE", 2, 2.0, 2.31, hut); // jendela depan dengan bingkai dan daun jendela
  box(1.62, 0.1, 0.14, C.bark, 2, 2.6, 2.31, hut); box(1.62, 0.1, 0.14, C.bark, 2, 1.4, 2.31, hut); box(0.1, 1.3, 0.14, C.bark, 1.2, 2.0, 2.31, hut); box(0.1, 1.3, 0.14, C.bark, 2.8, 2.0, 2.31, hut); box(0.06, 1.1, 0.1, C.bark, 2, 2.0, 2.34, hut);
  box(0.5, 1.1, 0.06, "#6E8561", 0.85, 2.0, 2.35, hut); box(0.5, 1.1, 0.06, "#6E8561", 3.15, 2.0, 2.35, hut);
  box(0.08, 1.1, 1.5, "#8FA9AE", 3.53, 2.0, 0, hut); box(0.14, 1.3, 0.1, C.bark, 3.55, 2.0, -0.8, hut); box(0.14, 1.3, 0.1, C.bark, 3.55, 2.0, 0.8, hut);
  const brick = mat("#FFFFFF", { map: tex("brick", 128, 128, (g, w, h) => { g.fillStyle = "#8A5A44"; g.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 14) for (let x = (y / 14) % 2 ? -16 : 0; x < w; x += 32) { const t = 0.8 + rnd() * 0.3; g.fillStyle = `rgb(${(170 * t) | 0},${(98 * t) | 0},${(72 * t) | 0})`; g.fillRect(x + 1, y + 1, 30, 12); } }, 1, 2) });
  box(0.9, 3.6, 0.9, brick, 2.2, 4.9, -1.2, hut); box(1.15, 0.22, 1.15, "#6A5648", 2.2, 6.75, -1.2, hut);
  scene.add(hut);
  // mesin sangrai: lemari baja, drum berputar, corong, pipa, tray pendingin
  const roastG = new THREE.Group(); roastG.position.set(6, 0, 1.3);
  box(2.6, 1.15, 1.4, "#46525A", 0, 0.58, 0, roastG);
  box(2.7, 0.08, 1.5, "#2E373C", 0, 1.17, 0, roastG);
  [-0.8, -0.2, 0.4].forEach((x) => { cyl(0.12, 0.12, 0.05, "#E8E2D2", x, 0.85, 0.72, roastG).rotation.x = Math.PI / 2; box(0.02, 0.08, 0.02, "#B33A2A", x, 0.86, 0.76, roastG); });
  box(0.5, 0.3, 0.05, "#2B3338", 1.0, 0.8, 0.72, roastG);
  const drum = shade(new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 1.7, 24).rotateZ(Math.PI / 2), mat("#9AA3A6", { metalness: 0.5, roughness: 0.4 }))); drum.position.set(0, 1.9, 0); roastG.add(drum);
  [0, 1.57, 3.14, 4.71].forEach((a) => { box(1.72, 0.05, 0.09, "#C2C9CB", 0, Math.sin(a) * 0.67, Math.cos(a) * 0.67, drum).rotation.x = -a; });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.05, 8, 24), mat("#6D767A")); ring.rotation.y = Math.PI / 2; ring.position.set(0.86, 1.9, 0); roastG.add(ring);
  box(0.06, 0.9, 0.06, "#6D767A", -0.9, 1.5, 0.3, roastG); box(0.06, 0.9, 0.06, "#6D767A", 0.9, 1.5, 0.3, roastG);
  cyl(0.5, 0.15, 0.7, "#6B7478", -0.2, 2.9, 0, roastG, 16); cyl(0.55, 0.5, 0.1, "#4E575B", -0.2, 3.3, 0, roastG, 16);
  cyl(0.09, 0.09, 1.6, "#6D767A", 0.9, 2.1, -0.45, roastG, 10); cyl(0.12, 0.12, 0.12, "#4E575B", 0.9, 2.95, -0.45, roastG, 10);
  const tray = new THREE.Group(); tray.position.set(2.6, 0, 0.2); cyl(0.12, 0.2, 0.9, "#4E575B", 0, 0.45, 0, tray, 8);
  cyl(1.0, 1.0, 0.14, "#8A9396", 0, 1.0, 0, tray, 28); const rim = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.05, 8, 28), mat("#6D767A")); rim.rotation.x = Math.PI / 2; rim.position.y = 1.07; tray.add(rim);
  cyl(0.9, 0.9, 0.05, "#5A3A28", 0, 1.1, 0, tray, 28);
  const arm = new THREE.Group(); arm.position.y = 1.16; box(1.8, 0.05, 0.08, "#C2C9CB", 0, 0, 0, arm); tray.add(arm); roastG.add(tray);
  scene.add(roastG);
  [[2.0, 0.5], [3.0, 0.2], [10.2, 1.0], [10.9, 1.9]].forEach(([x, z], i) => sack(x, 0, z, i * 1.3, 0.85));
  box(1.1, 0.7, 0.9, woodMat(C.wood, 1, 1), 9.2, 0.35, 0.4); box(1.1, 0.7, 0.9, woodMat(C.wood, 1, 1), 9.3, 1.05, 0.5);
  const roaster = person("#6D7F58", 8.4, 0, 2.3, 3.6, { legs: "#4A4F58" });
  const smokeM = new THREE.MeshLambertMaterial({ color: "#E4DED2", transparent: true, opacity: 0.6, depthWrite: false });
  const smoke = Array.from({ length: 7 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), smokeM.clone()); m.userData.o = i / 7; scene.add(m); return m; });
  const roastSmoke = Array.from({ length: 4 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6), smokeM.clone()); m.userData.o = i / 4; scene.add(m); return m; });
  sign(-1.6, 0.6, 0.3, [["Sangrai Kecil", 50, 80], ["Batch #128 · medium", 28, 130, 400]]);

  // ---------- gerobak karung + pengantar ----------
  const cart = new THREE.Group();
  box(1.0, 0.12, 1.7, woodMat(C.wood, 1, 2), 0, 0.75, 0, cart);
  [-0.5, 0.5].forEach((x) => box(0.08, 0.4, 1.7, C.bark2, x, 0.95, 0, cart)); box(1.0, 0.4, 0.08, C.bark2, 0, 0.95, 0.85, cart); box(1.0, 0.4, 0.08, C.bark2, 0, 0.95, -0.85, cart);
  [-0.3, 0.3].forEach((x) => limb(new THREE.Vector3(x, 0.8, -0.5), new THREE.Vector3(x, 1.08, -1.95), 0.05, 0.04, C.bark2, cart));
  cart.userData.wheels = [-0.62, 0.62].map((x) => { const w = new THREE.Group(); w.position.set(x, 0.42, 0.1); const tire = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 20), mat("#2E2A27")); tire.rotation.y = Math.PI / 2; w.add(tire); for (let a = 0; a < 6; a++) box(0.04, 0.8, 0.04, C.bark2, 0, 0, 0, w).rotation.x = (a * Math.PI) / 6; cart.add(w); return w; });
  sack(-0.2, 0.8, 0.3, 1, 0.75, cart); sack(0.25, 0.8, -0.35, 2, 0.7, cart); sack(0.05, 1.45, 0.0, 0.4, 0.65, cart);
  scene.add(cart);
  const porter = person("#C8B28A", 0, 0, 0, 0, { legs: "#4B4036" });

  // ---------- kedai kayu terbuka ----------
  const cafe = new THREE.Group(); cafe.position.set(18, 0, 8.6);
  const plank = woodMat(C.wood, 3, 1), plankDk = woodMat("#7C5A3E", 3, 1);
  box(7, 0.32, 4.6, woodMat("#8E6A48", 3, 2), 0, 0.16, 0, cafe);
  [[-3.2, -1.9], [3.2, -1.9], [-3.2, 1.9], [3.2, 1.9], [0, 1.9]].forEach(([x, z]) => box(0.22, 3.8, 0.22, C.bark, x, 2.2, z, cafe));
  box(6.8, 3.1, 0.14, plankDk, 0, 1.9, -2.0, cafe); // dinding belakang
  [[-2.2, 1.9], [0.5, 1.9], [2.6, 1.9]].forEach(([x, y]) => { box(1.3, 0.07, 0.4, C.bark2, x, y, -1.85, cafe); [0, 1, 2].forEach((i) => cyl(0.1, 0.1, 0.22, ["#D9CBB0", "#9A5A3E", "#E6D8B8"][i], x - 0.4 + i * 0.4, y + 0.15, -1.85, cafe, 10)); });
  box(5.4, 1.1, 0.8, plank, -0.4, 0.87, -0.7, cafe); box(5.6, 0.1, 1.0, woodMat("#6E4C34", 3, 1), -0.4, 1.47, -0.7, cafe); // meja bar
  box(1.1, 0.55, 0.6, "#5E6A70", -1.5, 1.82, -0.8, cafe); box(1.15, 0.1, 0.65, "#394247", -1.5, 2.12, -0.8, cafe); [-1.8, -1.2].forEach((x) => cyl(0.07, 0.07, 0.2, "#BFC6C8", x, 1.62, -0.52, cafe, 8)); // mesin espresso
  cyl(0.04, 0.04, 0.4, "#BFC6C8", -0.85, 1.9, -0.55, cafe, 6);
  box(0.4, 0.5, 0.4, "#2F363A", 0.2, 1.77, -0.8, cafe); cyl(0.2, 0.08, 0.32, "#5A3A28", 0.2, 2.2, -0.8, cafe, 10); // penggiling
  [0.9, 1.1, 1.3].forEach((x) => cyl(0.09, 0.07, 0.14, "#F2EBDD", x, 1.59, -0.55, cafe, 10));
  const pend = [];
  [-2.2, 0.2, 2.0].forEach((x) => { limb(new THREE.Vector3(x, 4.0, 0.2), new THREE.Vector3(x, 2.9, 0.2), 0.012, 0.012, "#2E2A27", cafe); const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 12, 10), new THREE.MeshBasicMaterial({ color: "#8A7F6A" })); b.position.set(x, 2.82, 0.2); cafe.add(b); pend.push(b); });
  roofFn(cafe, 7, 4.6, 1.8, 4.1, 0.75, tileMat(4, 3), plankDk); // atap genteng penuh menutupi seluruh kedai
  box(7.3, 0.2, 0.24, C.bark, 0, 4.0, 2.3, cafe); box(7.3, 0.2, 0.24, C.bark, 0, 4.0, -2.3, cafe);
  [-1.4, 1.4].forEach((x) => { box(1.3, 0.34, 0.36, C.bark2, x * 1.7, 0.5, 2.9, cafe); ball(0.34, "#5E7F4D", x * 1.7, 0.85, 2.9, cafe, 0.8); [-0.3, 0, 0.3].forEach((dx, q) => ball(0.07, ["#E27D5F", "#EFEBE2", "#E0A63E"][q], x * 1.7 + dx, 1.12, 2.9, cafe)); }); // pot bunga di teras
  box(2.9, 0.75, 0.1, mat("#FFFFFF", { map: tex("kedaisign", 512, 130, drawBoard([["KOPI RINDANG", 62, 88]], "#3E2A1D", "#EBDDC0")) }), 0, 3.3, 2.4, cafe);
  scene.add(cafe);
  const barista = person("#C4A24C", 16.9, 0.08, 12.85, 0, { legs: "#3E4048" });
  const aframe = new THREE.Group(); aframe.position.set(21.9, 0, 11.4); aframe.rotation.y = -0.5;
  box(0.9, 1.4, 0.07, mat("#FFFFFF", { map: tex("menuboard", 256, 360, drawBoard([["MENU", 48, 70], ["Kopi Hitam   15", 24, 130, 400], ["Kopi Susu     22", 24, 175, 400], ["Es Aren       24", 24, 220, 400], ["V60          28", 24, 265, 400], ["Roti Bakar   18", 24, 310, 400]])) }), 0, 0.85, 0.2, aframe).rotation.x = -0.12;
  box(0.07, 1.4, 0.06, C.bark, -0.4, 0.7, -0.15, aframe).rotation.x = 0.15; box(0.07, 1.4, 0.06, C.bark, 0.4, 0.7, -0.15, aframe).rotation.x = 0.15; scene.add(aframe);

  // pohon rindang besar + ayunan, bangku melingkar, lampion
  const big = placeTree(30, 1.2, { h: 6.8, spread: 7.2, clumps: small ? 34 : 120, r0: 0.75, bark: C.bark }, 0.8);
  { const ba = mat("#9B7B5E");
    for (let i = 0; i < 9; i++) { const e = big.userData.ends[(i * 2 + 1) % big.userData.ends.length], len = 2.2 + rnd() * 2.6; limb(new THREE.Vector3(e.x + (rnd() - 0.5) * 0.6, e.y - 0.1, e.z + (rnd() - 0.5) * 0.6), new THREE.Vector3(e.x + (rnd() - 0.5) * 0.7, Math.max(0.3, e.y - len), e.z + (rnd() - 0.5) * 0.7), 0.05, 0.015, ba, big); }
    const sw = big.userData.ends[3]; [-0.35, 0.35].forEach((dx) => limb(new THREE.Vector3(sw.x + dx, sw.y, sw.z), new THREE.Vector3(sw.x + dx, 0.75, sw.z), 0.02, 0.02, "#8C7A60", big)); box(0.9, 0.08, 0.38, woodMat(C.wood, 1, 1), sw.x, 0.72, sw.z, big);
    big.userData.lanterns = big.userData.ends.slice(0, 6).map((e) => { const l = new THREE.Group(); l.position.set(e.x + (rnd() - 0.5), e.y - 1.0 - rnd() * 0.5, e.z + (rnd() - 0.5)); limb(new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.9, 0), 0.01, 0.01, "#2E2A27", l); const body = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.3, 8), new THREE.MeshBasicMaterial({ color: "#8A7F6A" })); body.position.y = -0.05; l.add(body); cyl(0.14, 0.14, 0.04, "#2E2A27", 0, 0.12, 0, l, 8); big.add(l); return body; });
    for (let i = 0; i < 6; i++) { const a = 1.5 + i * 0.55, r = 2.1, s = box(1.15, 0.12, 0.45, woodMat(C.wood, 1, 1), Math.cos(a) * r, 0.5, Math.sin(a) * r, big); s.rotation.y = -a + Math.PI / 2; box(0.1, 0.5, 0.1, C.bark, Math.cos(a) * r, 0.25, Math.sin(a) * r, big); } }

  // meja, kursi, cangkir, tamu
  const steam = [], tableLamps = [];
  const makeTable = (x, z, ry = 0) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry;
    cyl(0.78, 0.78, 0.08, woodMat("#8E6A48", 1, 1), 0, 1.0, 0, g, 24); cyl(0.1, 0.14, 0.95, C.bark, 0, 0.5, 0, g, 10); cyl(0.38, 0.4, 0.05, C.bark, 0, 0.03, 0, g, 12);
    cyl(0.2, 0.12, 0.05, "#F2EBDD", 0.28, 1.06, 0.18, g, 14); cyl(0.1, 0.075, 0.14, "#F6F0E4", 0.28, 1.16, 0.18, g, 14); cyl(0.088, 0.088, 0.01, "#3A2418", 0.28, 1.235, 0.18, g, 14);
    const hd = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.012, 6, 10), mat("#F6F0E4")); hd.position.set(0.39, 1.16, 0.18); g.add(hd);
    const lam = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.22, 10), new THREE.MeshBasicMaterial({ color: "#8A7F6A" })); lam.position.set(-0.25, 1.15, -0.2); g.add(lam); cyl(0.11, 0.11, 0.04, "#2E2A27", -0.25, 1.28, -0.2, g, 10); cyl(0.11, 0.11, 0.04, "#2E2A27", -0.25, 1.03, -0.2, g, 10); tableLamps.push(lam);
    cyl(0.1, 0.07, 0.14, "#9A5A3E", -0.05, 1.11, 0.4, g, 10); ball(0.14, "#5E7F4D", -0.05, 1.28, 0.4, g, 0.8);
    for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshLambertMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.5, depthWrite: false })); s.userData = { o: i / 3, x: 0.28, z: 0.18, y0: 1.27 }; g.add(s); steam.push(s); }
    scene.add(g); return g;
  };
  const chair = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; const w = woodMat("#8E6A48", 1, 1); box(0.5, 0.06, 0.5, w, 0, 0.6, 0, g); [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].forEach(([a, b]) => box(0.05, 0.6, 0.05, C.bark, a, 0.3, b, g)); box(0.5, 0.07, 0.05, w, 0, 1.0, -0.24, g); box(0.5, 0.07, 0.05, w, 0, 0.84, -0.24, g); [-0.22, 0.22].forEach((a) => box(0.05, 0.45, 0.05, C.bark, a, 0.85, -0.24, g)); scene.add(g); return g; };
  const seat = (tx, tz, ang, shirt, o = {}) => { const cx = tx + Math.sin(ang) * 1.15, cz = tz + Math.cos(ang) * 1.15; chair(cx, cz, ang + Math.PI); return person(shirt, cx, 0.02, cz, ang + Math.PI, { sit: true, ...o }); };
  [[20.8, 12.8, 0.1], [26.5, 13.2, 0.5], [31, 7.8, 0.2], [25.8, 8, 0.6]].forEach(([x, z, r]) => makeTable(x, z, r));
  const guests = [seat(20.8, 12.8, -1.3, "#5E7F8F", { legs: "#3B4558" }), seat(20.8, 12.8, 1.9, "#C98F6E", { long: true }), seat(26.5, 13.2, 0.2, "#A9566B", { hijab: true, legs: "#4A3F44" }), seat(31, 7.8, 2.4, "#7C8A4A", { legs: "#3B3F4A" }), seat(25.8, 8, -2.2, "#D1B26A", { long: true })];

  // bar depan kedai: kasir + barista terlihat dari atas, antrean pelanggan, pelayan mengantar pesanan, kucing di teras
  const bar = new THREE.Group(); bar.position.set(15.2, 0, 13.4); scene.add(bar);
  const qrTex = mat("#FFFFFF", { map: tex("qr", 128, 128, (g, w, h) => { g.fillStyle = "#F4F1EA"; g.fillRect(0, 0, w, h); g.fillStyle = "#1E1E1E"; const n = 17, c = (w - 16) / n; for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) { const corner = (x < 5 && y < 5) || (x > n - 6 && y < 5) || (x < 5 && y > n - 6); if (corner ? (x % 4 === 0 || y % 4 === 0 || (x % 4 === 2 && y % 4 === 2)) : rnd() > 0.52) g.fillRect(8 + x * c, 8 + y * c, c, c); } }) });
  box(6.6, 0.08, 3.8, woodMat("#8E6A48", 3, 2), 0, 0.04, 0.2, bar); // lantai papan
  box(5.4, 1.05, 0.9, woodMat(C.wood, 3, 1), 0, 0.6, 0, bar);
  box(5.6, 0.1, 1.1, woodMat("#6E4C34", 3, 1), 0, 1.17, 0, bar);
  [-2.6, 2.6].forEach((x) => box(0.16, 3.0, 0.16, C.bark, x, 1.5, -1.3, bar));
  box(5.4, 2.4, 0.12, woodMat("#7C5A3E", 3, 1), 0, 1.25, -1.35, bar);
  box(5.0, 0.07, 0.36, C.bark2, 0, 1.9, -1.15, bar);
  [-2, -1, 0, 1, 2].forEach((x, q) => cyl(0.12, 0.12, 0.3, q % 2 ? "#D9CBB0" : "#9A5A3E", x * 0.95, 2.1, -1.15, bar, 10));
  box(2.6, 0.7, 0.08, mat("#FFFFFF", { map: tex("barsign", 512, 140, drawBoard([["KASIR  ·  BAR", 62, 92]], "#3E2A1D", "#EBDDC0")) }), 0, 2.85, -1.25, bar);
  [-2.6, 2.6].forEach((x) => box(0.1, 0.1, 0.75, C.bark2, x, 3.0, -0.95, bar)); box(5.4, 0.1, 0.1, C.bark2, 0, 3.0, -0.6, bar);
  [-1.8, 0.2, 2.0].forEach((x) => { limb(new THREE.Vector3(x, 3.0, -0.6), new THREE.Vector3(x, 2.55, -0.6), 0.012, 0.012, "#2E2A27", bar); const b = new THREE.Mesh(new THREE.SphereGeometry(0.15, 12, 10), new THREE.MeshBasicMaterial({ color: "#8A7F6A" })); b.position.set(x, 2.45, -0.6); bar.add(b); pend.push(b); });
  // sisi kasir: tablet kasir, printer struk, laci uang, QR, toples tip
  box(0.5, 0.34, 0.04, "#1E2326", -1.8, 1.5, -0.1, bar).rotation.x = -0.5; box(0.44, 0.28, 0.01, "#9FC4D0", -1.8, 1.5, -0.075, bar).rotation.x = -0.5; box(0.08, 0.2, 0.08, "#2A2F32", -1.8, 1.32, -0.2, bar);
  box(0.3, 0.16, 0.26, "#2A2F32", -1.2, 1.3, -0.1, bar); box(0.55, 0.14, 0.4, "#4A4F52", -0.6, 1.29, -0.1, bar);
  box(0.4, 0.5, 0.04, qrTex, -2.35, 1.47, 0.3, bar); box(0.12, 0.2, 0.08, C.bark2, -2.35, 1.27, 0.28, bar);
  cyl(0.1, 0.1, 0.24, "#CFE0DC", -0.1, 1.34, 0.3, bar, 10); cyl(0.1, 0.1, 0.03, "#8A6A4A", -0.1, 1.47, 0.3, bar, 10);
  // sisi barista: mesin espresso, penggiling, cangkir, teko susu
  box(1.1, 0.55, 0.6, "#5E6A70", 1.5, 1.5, -0.15, bar); box(1.15, 0.1, 0.65, "#394247", 1.5, 1.83, -0.15, bar); [1.2, 1.8].forEach((x) => cyl(0.07, 0.07, 0.2, "#BFC6C8", x, 1.3, 0.12, bar, 8)); cyl(0.04, 0.04, 0.4, "#BFC6C8", 2.0, 1.45, 0.1, bar, 6);
  box(0.4, 0.5, 0.4, "#2F363A", 0.5, 1.48, -0.2, bar); cyl(0.2, 0.08, 0.32, "#5A3A28", 0.5, 1.9, -0.2, bar, 10);
  [2.3, 2.5].forEach((x) => cyl(0.09, 0.07, 0.14, "#F2EBDD", x, 1.29, 0.3, bar, 10)); cyl(0.08, 0.1, 0.22, "#BFC6C8", 1.0, 1.33, 0.3, bar, 10);
  for (let q = 0; q < 3; q++) { const sm = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshLambertMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.5, depthWrite: false })); sm.userData = { o: q / 3, x: 2.0, z: 0.1, y0: 1.7 }; bar.add(sm); steam.push(sm); }
  const kasir = person("#B2503C", 14.0, 0.08, 12.85, 0.1, { legs: "#3B4558", hijab: true });
  const customers = [[14.2, 14.9, Math.PI, "#6F8FA8", { legs: "#3E4048" }], [13.3, 16.1, Math.PI * 0.92, "#C98F6E", { long: true }], [14.9, 17.1, Math.PI * 1.05, "#7C8A4A", { legs: "#4A3F44", phone: true }]].slice(0, small ? 2 : 3).map(([x, z, ry, col, o]) => person(col, x, 0.02, z, ry, o));
  // pelayan membawa nampan berkeliling meja
  const waiterCurve = new THREE.CatmullRomCurve3([[17.8, 12.0], [19.0, 10.9], [22.3, 10.9], [24.4, 11.6], [27.0, 11.2], [29.2, 11.9], [29.0, 10.2], [26.6, 10.0], [23.6, 10.0], [20.6, 10.0], [18.4, 10.8]].map(([x, z]) => new THREE.Vector3(x, 0, z)), true, "catmullrom", 0.4);
  const waiterLen = waiterCurve.getLength();
  const waiter = person("#E9E2D2", 17.8, 0.02, 12.0, 0, { legs: "#2E3138" });
  { const tray = new THREE.Group(); tray.position.set(0, 1.28, 0.5); cyl(0.3, 0.3, 0.03, "#C9A97A", 0, 0, 0, tray, 14); cyl(0.07, 0.055, 0.1, "#F6F0E4", 0.1, 0.07, 0.05, tray, 10); cyl(0.07, 0.055, 0.1, "#F6F0E4", -0.1, 0.07, -0.05, tray, 10); waiter.add(tray); }
  // kucing berjemur di teras kedai
  const catTail = new THREE.Group();
  { const cat = new THREE.Group(); cat.position.set(15.5, 0.32, 10.2); cat.rotation.y = 2.2; const fur = "#C98F5A";
    ball(0.22, fur, 0, 0.2, 0, cat, 0.75); ball(0.14, fur, 0.2, 0.32, 0, cat); [-0.06, 0.06].forEach((z) => cyl(0.0, 0.05, 0.1, fur, 0.2, 0.47, z, cat, 4));
    catTail.position.set(-0.2, 0.17, 0); limb(new THREE.Vector3(0, 0, 0), new THREE.Vector3(-0.28, 0.12, 0.05), 0.04, 0.025, fur, catTail); cat.add(catTail); scene.add(cat); }

  // lampu gantung: kabel melengkung + bohlam + cahaya
  const bulbM = new THREE.MeshBasicMaterial({ color: "#8A7F6A" });
  const glowM = new THREE.SpriteMaterial({ map: glow, color: "#FFFFFF", transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 });
  const anchors = { A: [14, 4.4, 16], B: [34, 4.4, 16], C: [35, 4.4, 10], E: [21.4, 3.8, 10.8], F: [14.7, 3.8, 10.8] };
  [anchors.A, anchors.B, anchors.C].forEach(([x, , z]) => { cyl(0.08, 0.13, 4.4, C.bark, x, 2.2, z, scene, 8); box(0.9, 0.1, 0.1, C.bark2, x, 4.35, z); });
  const bulbs = [], wireM = mat("#2A2623");
  const strand = (a, b, n, sag) => {
    const pts = []; for (let i = 0; i <= 14; i++) { const t = i / 14; pts.push(new THREE.Vector3(mix(a[0], b[0], t), mix(a[1], b[1], t) - Math.sin(t * Math.PI) * sag, mix(a[2], b[2], t))); }
    const curve = new THREE.CatmullRomCurve3(pts); scene.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 28, 0.018, 4), wireM));
    for (let i = 1; i < n; i++) { const p = curve.getPointAt(i / n), m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), bulbM); m.position.set(p.x, p.y - 0.12, p.z); scene.add(m); const sp = new THREE.Sprite(glowM); sp.position.copy(m.position); sp.scale.setScalar(0.01); scene.add(sp); bulbs.push({ sp, u: 0 }); }
  };
  strand(anchors.A, anchors.B, 12, 0.9); strand(anchors.B, anchors.C, 8, 0.8); strand(anchors.C, anchors.E, 8, 0.7); strand(anchors.A, anchors.F, 4, 0.5); strand(anchors.E, anchors.F, 6, 0.5);
  bulbs.forEach((b, i) => (b.u = i / bulbs.length));
  const warmLight = small ? null : new THREE.PointLight("#FFB866", 0, 22, 1.6);
  if (warmLight) { warmLight.position.set(24, 3.4, 10.5); scene.add(warmLight); }

  // kunang-kunang
  const flyM = new THREE.MeshBasicMaterial({ color: "#F6E3A1", transparent: true, opacity: 0 });
  const flies = Array.from({ length: small ? 10 : 22 }, () => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), flyM); m.userData = { x: 25 + (rnd() - 0.5) * 14, y: 1.2 + rnd() * 4, z: 10 + (rnd() - 0.5) * 12, ph: rnd() * 6, sp: 0.5 + rnd() * 0.8 }; scene.add(m); return m; });

  // pepohonan: pohon sedang, hutan di latar, semak, pisang, bambu, kelapa
  [[-16, 12], [14, -10], [-5, -9], [24, -12], [38, -6], [-30, 6], [0, -14], [34, -14]].forEach(([x, z]) => placeTree(x, z, { h: 3.4 + rnd() * 2.2, spread: 3.2 + rnd() * 1.6, clumps: small ? 12 : 22, r0: 0.28, tint: (rnd() - 0.5) * 0.06 }, rnd() * 6));
  [[-38, -18], [-30, -24], [-16, -27], [-2, -25], [12, -26], [28, -24], [42, -19], [52, -6], [-46, -12], [-52, 4], [53, 14], [-9, -31], [36, -31], [-24, -35], [20, -35], [-42, 14]].forEach(([x, z]) => placeTree(x, z, { h: 6 + rnd() * 3.5, spread: 5 + rnd() * 2, clumps: small ? 14 : 30, r0: 0.4, tint: (rnd() - 0.5) * 0.08, lite: true }, rnd() * 6));
  { const N = small ? 34 : 70, im = new THREE.InstancedMesh(crownGeo, mat("#FFFFFF", {}), N), o = new THREE.Object3D(), c = new THREE.Color();
    let n = 0;
    for (let tries = 0; tries < 1200 && n < N; tries++) {
      const b = pathSamples[(rnd() * 60) | 0];
      let a = rnd() * 6.28; if (Math.cos(a) + Math.sin(a) > 0 && rnd() < 0.8) a += Math.PI; // utamakan sisi jauh dari kamera supaya jalan tetap terlihat
      const d = 3.1 + rnd() * 3.2, x = b.x + Math.cos(a) * d, z = b.z + Math.sin(a) * d, r = 0.45 + rnd() * 0.55;
      if (blocked(x, z) || x > 13) continue;
      o.position.set(x, r * 0.45, z); o.rotation.set(rnd(), rnd() * 6, rnd()); o.scale.set(r * 1.2, r * 0.8, r * 1.2); o.updateMatrix(); im.setMatrixAt(n, o.matrix); im.setColorAt(n++, c.set(leafCols[n % 5]));
    }
    im.count = n; im.castShadow = im.receiveShadow = true; scene.add(im); }
  const banana = (x, z, sc = 1) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rnd() * 6;
    cyl(0.14 * sc, 0.22 * sc, 2.3 * sc, "#8FA66A", 0, 1.15 * sc, 0, g, 8);
    for (let i = 0; i < 8; i++) { const piv = new THREE.Group(); piv.position.y = 2.3 * sc; piv.rotation.y = i * 0.8 + rnd() * 0.4; const arm = new THREE.Group(); arm.rotation.x = 0.35 + rnd() * 0.45; box(0.95 * sc, 0.03, 3 * sc, ["#6F9A4A", "#5F8A42", "#7BA352"][i % 3], 0, 0, 1.5 * sc, arm); piv.add(arm); g.add(piv); }
    scene.add(g); return g;
  };
  [[-1, -9.5, 1], [13, -7.5, 1.1], [-27.5, 10, 1], [37, -2, 1.1], [18, -7, 0.9], [-12, -9, 1]].forEach(([x, z, sc]) => banana(x, z, sc));
  [[-31, 9], [40, 1], [-20, 16], [22, -17], [-6, -17]].forEach(([x, z]) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); const leaves = [];
    for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, rr = rnd() * 1.1, h = 7 + rnd() * 4, la = rnd() * 6.28, p0 = new THREE.Vector3(Math.cos(a) * rr, 0, Math.sin(a) * rr), p1 = new THREE.Vector3(p0.x + Math.cos(la) * h * 0.18, h, p0.z + Math.sin(la) * h * 0.18); limb(p0, p1, 0.1, 0.05, ["#8BA05A", "#7D9450", "#98AC62"][i % 3], g); for (let k = 0; k < 4; k++) leaves.push([p1.x + (rnd() - 0.5) * 1.2, p1.y - rnd() * 1.6, p1.z + (rnd() - 0.5) * 1.2]); }
    const im = new THREE.InstancedMesh(crownGeo, mat("#FFFFFF", {}), leaves.length), o = new THREE.Object3D(), c = new THREE.Color();
    leaves.forEach(([lx, ly, lz], k) => { o.position.set(lx, ly, lz); o.rotation.set(rnd() * 0.5, rnd() * 6, rnd() * 0.5); o.scale.set(1.1, 0.3, 1.1); o.updateMatrix(); im.setMatrixAt(k, o.matrix); im.setColorAt(k, c.set(["#6E9A48", "#7FA856", "#5F8A42"][k % 3])); });
    im.castShadow = true; g.add(im); scene.add(g);
  });
  const palms = [[-42, -8], [-38, 16], [46, -8], [48, 10], [-4, -26], [22, -24], [-24, -28]].map(([x, z], k) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = rnd() * 6; const sc = 0.9 + rnd() * 0.5, lean = 0.5 + rnd() * 0.6, pts = [];
    for (let i = 0; i <= 5; i++) { const t = i / 5; pts.push(new THREE.Vector3(Math.sin(t * 1.3) * lean * 1.6 * sc, t * 8.5 * sc, 0)); }
    for (let i = 0; i < 5; i++) limb(pts[i], pts[i + 1], 0.26 * sc * (1 - i * 0.1), 0.26 * sc * (1 - (i + 1) * 0.1), "#7A6248", g);
    const top = new THREE.Group(); top.position.copy(pts[5]);
    for (let i = 0; i < 10; i++) { const piv = new THREE.Group(); piv.rotation.y = i * 0.63; const arm = new THREE.Group(); arm.rotation.x = 0.2 + (i % 3) * 0.28; box(0.42 * sc, 0.04, 4.2 * sc, ["#5F8A45", "#6E9A4E"][i % 2], 0, 0, 2.1 * sc, arm); piv.add(arm); top.add(piv); }
    [0, 1, 2].forEach((q) => ball(0.2 * sc, "#6B4A2E", Math.cos(q * 2.1) * 0.3, -0.35, Math.sin(q * 2.1) * 0.3, top));
    g.add(top); scene.add(g); g.userData.top = top; g.userData.k = k; return g;
  });
  // satwa: burung terbang melingkar, kupu-kupu di sekitar bunga
  const birds = Array.from({ length: 5 }, (_, i) => { const g = new THREE.Group(), bm = mat("#2C2A28"); ball(0.16, bm, 0, 0, 0, g, 0.7).castShadow = false; const wings = [-1, 1].map((sd) => { const w = new THREE.Group(); const b = box(0.7, 0.02, 0.24, bm, sd * 0.35, 0, 0, w); b.castShadow = false; g.add(w); return w; }); g.userData = { wings, r: 16 + i * 4, y: 12 + i * 1.1, sp: 0.1 + i * 0.015, ph: i * 1.3, cx: 4 + i * 5 }; scene.add(g); return g; });
  const flutters = (flowerSpots.length ? flowerSpots : [[0, 6]]).slice(0, small ? 4 : 8).map(([fx, fz], i) => { const g = new THREE.Group(), col = ["#E9B44C", "#F0EBE0", "#D58FA8", "#7FA8D6"][i % 4], m = new THREE.MeshBasicMaterial({ color: col, side: THREE.DoubleSide }); const wings = [-1, 1].map((sd) => { const w = new THREE.Group(), mesh = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.16), m); mesh.rotation.x = -Math.PI / 2; mesh.position.x = sd * 0.1; w.add(mesh); g.add(w); return w; }); g.userData = { wings, fx, fz, ph: i * 1.7 }; scene.add(g); return g; });

  // kabut tipis pagi di kebun + awan
  const mistM = new THREE.SpriteMaterial({ map: glow, color: "#F4F6F0", transparent: true, depthWrite: false, opacity: 0 });
  Array.from({ length: 7 }, (_, i) => { const s = new THREE.Sprite(mistM); s.position.set(-34 + i * 4.5, 1.2 + (i % 3) * 0.6, -12 + (i % 4) * 3.2); s.scale.setScalar(13); scene.add(s); return s; });
  const cloudMat = new THREE.MeshLambertMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.85, fog: false });
  const clouds = [[-6, 14, -36], [14, 15, -42], [32, 14, 52], [2, 16, 58]].map(([x, y, z], k) => {
    const g = new THREE.Group();
    [[0, 0, 0, 1.6], [1.6, -0.3, 0.4, 1.2], [-1.5, -0.4, -0.2, 1.1], [0.3, 0.4, -0.5, 1.2]].forEach(([a, b, c, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat); m.position.set(a, b, c); m.scale.y = 0.6; g.add(m); });
    g.position.set(x, y, z); g.userData = { x, speed: 0.4 + k * 0.08 }; scene.add(g); return g;
  });

  // Gabungkan semua benda diam jadi sedikit mesh per bahan dan per petak (24 x 24) supaya jumlah draw call turun; yang bergerak tidak ikut digabung.
  [drum, arm, ...smoke, ...roastSmoke, ...steam, ...flies, ...clouds, ...birds, ...flutters, cart, ...palms.map((g) => g.userData.top), porter, dryer, roaster, barista, kasir, waiter, catTail, ...customers, ...pickers, ...guests].forEach((o) => { o.userData.dyn = true; });
  { scene.updateMatrixWorld(true);
    const isDyn = (o) => { for (let q = o; q; q = q.parent) if (q.userData && q.userData.dyn) return true; return false; };
    const buckets = new Map(), pos = new THREE.Vector3();
    scene.traverse((o) => {
      if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || Array.isArray(o.material) || o.material.transparent || o.geometry.attributes.color || isDyn(o)) return;
      pos.setFromMatrixPosition(o.matrixWorld);
      const key = `${o.material.uuid}|${o.castShadow ? 1 : 0}${o.receiveShadow ? 1 : 0}|${Math.floor(pos.x / 24)}|${Math.floor(pos.z / 24)}`;
      (buckets.get(key) || buckets.set(key, []).get(key)).push(o);
    });
    let before = 0, after = 0;
    buckets.forEach((list) => {
      before += list.length;
      if (list.length < 2) { after += list.length; return; }
      let geos = list.map((m) => { const g = m.geometry.clone(); g.applyMatrix4(m.matrixWorld); Object.keys(g.attributes).forEach((k) => { if (k !== "position" && k !== "normal" && k !== "uv") g.deleteAttribute(k); }); g.clearGroups(); return g; });
      if (geos.some((g) => !g.index) && geos.some((g) => g.index)) geos = geos.map((g) => (g.index ? g.toNonIndexed() : g));
      const merged = mergeGeometries(geos);
      if (!merged) { after += list.length; return; }
      const mesh = new THREE.Mesh(merged, list[0].material);
      mesh.castShadow = list[0].castShadow; mesh.receiveShadow = list[0].receiveShadow;
      scene.add(mesh);
      list.forEach((m) => m.parent.remove(m));
      after += 1;
    });
    console.info(`[kopi-rindang-3d] mesh statis ${before} -> ${after}`);
  }

  // Kamera ortografis "isometrik"
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  const target = new THREE.Vector3(), dir = new THREE.Vector3(), right = new THREE.Vector3(), upv = new THREE.Vector3();
  let aspect = 1;
  const sunDayPos = new THREE.Vector3(-20, 40, 25), sunDuskPos = new THREE.Vector3(-36, 16, 22);
  const lampOff = new THREE.Color("#8A7F6A"), lampOn = new THREE.Color(C.lamp);
  const cartLen = route.getLength();

  return {
    scene, camera, toneMapping: THREE.NoToneMapping,
    resize(w, h) { aspect = w / h; },
    update(p, dtEngine, time) {
      const s = p * (PANELS - 1);
      const i = Math.min(PANELS - 2, Math.floor(s)), t = seg(s, i, i + 1);
      const a = KEYS[i], b = KEYS[i + 1];
      const portrait = aspect < 0.9;
      let size = mix(a.size, b.size, t);
      size *= 1 + Math.sin(t * Math.PI) * 0.3;
      if (portrait) size *= 1.35;
      const turn = mix(a.turn, b.turn, t) + Math.PI / 4 + ctx.pointer.x * 0.06;
      dir.set(Math.sin(turn), 1.05 - ctx.pointer.y * 0.05, Math.cos(turn)).normalize();
      target.set(mix(a.x, b.x, t), 0, mix(a.z, b.z, t));
      right.set(Math.cos(turn), 0, -Math.sin(turn));
      upv.set(-Math.sin(turn), 0, -Math.cos(turn));
      if (portrait) target.addScaledVector(upv, -size * 0.55);
      else target.addScaledVector(right, -size * aspect * 0.32);
      camera.position.copy(target).addScaledVector(dir, 120);
      camera.lookAt(target);
      camera.left = -size * aspect; camera.right = size * aspect; camera.top = size; camera.bottom = -size;
      camera.updateProjectionMatrix();

      // pagi -> senja
      const d = seg(s, 2.6, 4.8);
      scene.background.copy(bgDay).lerp(bgDusk, d);
      scene.fog.color.copy(scene.background);
      sun.color.copy(sunDay).lerp(sunDusk, d);
      sun.intensity = mix(2.3, 1.7, d);
      hemi.intensity = mix(1.0, 0.85, d);
      sun.position.lerpVectors(sunDayPos, sunDuskPos, d);
      const on = seg(s, 3.3, 4.5);
      bulbM.color.copy(lampOff).lerp(lampOn, on);
      glowM.opacity = on * 0.85;
      bulbs.forEach((bb) => { const k = Math.max(0, Math.min(1, on * 1.5 - bb.u * 0.5)); bb.sp.scale.setScalar(0.01 + k * 1.4 * (1 + Math.sin(time * 2 + bb.u * 9) * 0.05)); });
      [...pend, ...tableLamps, ...big.userData.lanterns].forEach((m) => m.material.color.copy(lampOff).lerp(lampOn, on));
      if (warmLight) warmLight.intensity = on * 55;
      flyM.opacity = d * 0.9;
      flies.forEach((f) => { const u = f.userData; f.position.set(u.x + Math.sin(time * u.sp + u.ph) * 0.8, u.y + Math.sin(time * u.sp * 1.3 + u.ph) * 0.4, u.z + Math.cos(time * u.sp + u.ph) * 0.8); });
      mistM.opacity = (1 - seg(s, 0.3, 1.8)) * 0.45;

      // gerak lingkungan
      grassU.value = time;
      birds.forEach((g) => { const u = g.userData, an = time * u.sp + u.ph; g.position.set(u.cx + Math.cos(an) * u.r, u.y + Math.sin(an * 2) * 0.5, Math.sin(an) * u.r * 0.7); g.rotation.y = Math.atan2(-Math.sin(an), Math.cos(an) * 0.7); u.wings[0].rotation.z = Math.sin(time * 8 + u.ph) * 0.7; u.wings[1].rotation.z = -u.wings[0].rotation.z; });
      flutters.forEach((g) => { const u = g.userData, an = time * 0.6 + u.ph; g.position.set(u.fx + Math.sin(an) * 1.8, 0.8 + Math.sin(time * 1.9 + u.ph) * 0.3, u.fz + Math.cos(an * 0.8) * 1.8); g.rotation.y = an; u.wings[0].rotation.z = Math.sin(time * 16 + u.ph) * 0.9; u.wings[1].rotation.z = -u.wings[0].rotation.z; });
      palms.forEach((g) => { g.userData.top.rotation.z = Math.sin(time * 0.7 + g.userData.k) * 0.03; });
      clouds.forEach((c) => { c.position.x = ((c.userData.x + time * c.userData.speed + 30) % 80) - 30; });
      trees.forEach((tr, k) => { tr.userData.sway.rotation.z = Math.sin(time * 0.6 + k) * 0.012; tr.userData.sway.rotation.x = Math.sin(time * 0.5 + k * 1.7) * 0.01; });
      drum.rotation.x = time * 1.6;
      arm.rotation.y = time * 0.9;
      smoke.forEach((m) => { const u = (time * 0.16 + m.userData.o) % 1; m.position.set(8.2 + u * 1.6, 7.0 + u * 4, -3.7 + u * 0.8); m.scale.setScalar(0.5 + u * 1.7); m.material.opacity = 0.5 * (1 - u); });
      roastSmoke.forEach((m) => { const u = (time * 0.3 + m.userData.o) % 1; m.position.set(6.9, 5.2 + u * 1.8, 0.85 - u * 0.2); m.scale.setScalar(0.4 + u); m.material.opacity = 0.32 * (1 - u); });
      steam.forEach((m) => { const u = (time * 0.35 + m.userData.o) % 1; m.position.set(m.userData.x + Math.sin(u * 6) * 0.04, m.userData.y0 + u * 0.7, m.userData.z); m.scale.setScalar(0.6 + u); m.material.opacity = 0.5 * (1 - u); });
      // gerobak dan pengantar mengikuti jalan setapak
      const cp = (time * 0.018 + 0.08) % 0.98, cpt = route.getPointAt(cp), ctg = route.getTangentAt(cp);
      cart.position.set(cpt.x, 0, cpt.z);
      cart.rotation.y = Math.atan2(ctg.x, ctg.z);
      cart.userData.wheels.forEach((w) => { w.rotation.x = (cp * cartLen) / 0.4; });
      const pp = Math.max(0, cp - 2.5 / cartLen), ppt = route.getPointAt(pp), ptg = route.getTangentAt(pp);
      porter.position.set(ppt.x, 0, ppt.z); porter.rotation.y = Math.atan2(ptg.x, ptg.z);
      H.walkPhase(porter, cp * cartLen * 3.2, 0.5);
      { const u = porter.userData; [0, 1].forEach((k) => { u.arms[k].rotation.x = -1.1; u.arms[k].rotation.z = (k ? 1 : -1) * 0.04; if (u.fore) u.fore[k].rotation.x = -0.1; }); } // kedua tangan memegang gagang
      H.life(porter, time); // lengan diatur sebelum life() karena model GLB membacanya di sana
      const idleArm = (g, ph) => { if (g.userData.arms) g.userData.arms[0].rotation.x = -0.7 + Math.sin(time * 2.2 + ph) * 0.35; };
      pickers.forEach((g, k) => { H.life(g, time); g.rotation.x = 0.1 + Math.sin(time * 0.9 + k) * 0.06; idleArm(g, k); });
      [dryer, roaster, barista, kasir].forEach((g, k) => { H.life(g, time); idleArm(g, k * 2); });
      customers.forEach((g, k) => { if (k === 0) { g.userData.arms[0].rotation.x = -0.9 + Math.sin(time * 1.2) * 0.15; g.userData.arms[1].rotation.x = -0.9; } H.life(g, time); });
      { const wp = (time * 0.02) % 1, wpt = waiterCurve.getPointAt(wp), wtg = waiterCurve.getTangentAt(wp);
        waiter.position.set(wpt.x, 0.02, wpt.z); waiter.rotation.y = Math.atan2(wtg.x, wtg.z);
        H.walkPhase(waiter, wp * waiterLen * 3.0, 0.45);
        [0, 1].forEach((k) => { waiter.userData.arms[k].rotation.x = -1.05; waiter.userData.arms[k].rotation.z = (k ? 1 : -1) * 0.05; if (waiter.userData.fore) waiter.userData.fore[k].rotation.x = -0.1; });
        H.life(waiter, time); }
      catTail.rotation.y = Math.sin(time * 1.6) * 0.5;
      guests.forEach((g) => H.life(g, time));
      return true;
    },
  };
}
