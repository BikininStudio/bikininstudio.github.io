// Model manusia bersama untuk demo 3D: badan organik (torso lathe, anggota badan meruncing), wajah, rambut, pakaian, bergelombang halus.
// Tiap segmen tubuh digabung jadi satu mesh berwarna-verteks (sekitar 12 mesh per tokoh) supaya tetap ringan di HP.
// Kerangka: userData = { hips, spine, head, legs[2], shins[2], arms[2], fore[2], hands[2], lids[], ph, phone, flash, sit }
// Rotasi sendi memakai rotation.x (ayun maju-mundur). Panggil life() tiap frame untuk napas, berat badan, tengok, kedip, dan tekukan siku otomatis.
export function createHumans(THREE, { lit = "standard", shadow = false, small = false } = {}) {
  const mat = lit === "lambert" ? new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color("#241b16") }) : new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.85, emissive: new THREE.Color("#241b16"), emissiveIntensity: 0.6 });
  const V = THREE.Vector3, M = THREE.Matrix4, Q = THREE.Quaternion, E = THREE.Euler;
  const sphere = new THREE.SphereGeometry(1, 14, 10), hemi = new THREE.SphereGeometry(1, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const sphereHi = new THREE.SphereGeometry(1, 24, 18), hemiHi = new THREE.SphereGeometry(1, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  const sphereHr = new THREE.SphereGeometry(1, 36, 22), hemiHr = new THREE.SphereGeometry(1, 36, 11, 0, Math.PI * 2, 0, Math.PI / 2);
  const box = new THREE.BoxGeometry(1, 1, 1), cone = new THREE.ConeGeometry(1, 1, 10), torus = new THREE.TorusGeometry(1, 0.14, 4, 12, Math.PI);
  const cyl = (rt, rb, h, n = 12, open = false) => new THREE.CylinderGeometry(rt, rb, h, n, 1, open);
  const lathe = (pts, seg = 16) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);
  const torso = lathe([[0.168, 0], [0.164, 0.06], [0.174, 0.15], [0.192, 0.27], [0.206, 0.38], [0.203, 0.45], [0.168, 0.51], [0.1, 0.55], [0.058, 0.575]], 28);
  const thighG = lathe([[0.001, 0], [0.092, 0], [0.1, -0.07], [0.093, -0.2], [0.077, -0.34], [0.067, -0.42], [0.001, -0.42]], 18);
  const shinG = lathe([[0.001, 0], [0.067, 0], [0.071, -0.08], [0.063, -0.2], [0.049, -0.34], [0.046, -0.4], [0.052, -0.42], [0.001, -0.42]], 18);
  const upperG = lathe([[0.001, 0], [0.056, 0], [0.06, -0.06], [0.052, -0.2], [0.045, -0.3], [0.001, -0.3]], 14);
  const foreG = lathe([[0.001, 0], [0.045, 0], [0.047, -0.05], [0.038, -0.2], [0.031, -0.275], [0.032, -0.29], [0.001, -0.29]], 14);
  let blobTex = null;
  const blobMat = () => {
    if (!blobTex) { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, "rgba(0,0,0,.5)"); gr.addColorStop(0.6, "rgba(0,0,0,.2)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c); }
    return new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  };
  const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const skirtG = cyl(0.19, 0.27, 0.42, 18, true);

  const part = (geo, color, px, py, pz, sx = 1, sy = sx, sz = sx, rx = 0, ry = 0, rz = 0, shade, fx) => ({ ...fx, geo, color, shade, m: new M().compose(new V(px, py, pz), new Q().setFromEuler(new E(rx, ry, rz)), new V(sx, sy, sz)) });
  // kepala satu bentuk telur: rahang menyempit ke dagu tanpa sambungan
  const eggify = (g) => { const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i), n = Math.max(0, -y); p.setXYZ(i, p.getX(i) * (1 - 0.27 * n), y * (1 + 0.05 * n), p.getZ(i) * (1 - 0.1 * n) + 0.11 * n * n); } g.computeVertexNormals(); return g; };
  const headGeo = eggify(new THREE.SphereGeometry(1, 40, 30));
  const FT0 = 1.12, FTL = 1.23, FPL = 1.56;
  const faceGeo = eggify(new THREE.SphereGeometry(1, 36, 28, Math.PI / 2 - 0.78, FPL, FT0, FTL));
  const faceCache = {};
  // koordinat kepala (meter, y ke atas) -> koordinat tekstur 0..1 pada tambalan wajah (mengikuti bentuk telur)
  const faceUV = (xm, ym) => {
    let y0 = (ym - 0.118) / 0.12;
    for (let i = 0; i < 5; i++) y0 = (ym - 0.118) / 0.12 / (1 + 0.05 * Math.max(0, -y0));
    y0 = Math.max(-0.99, Math.min(0.99, y0));
    const n = Math.max(0, -y0), sx = 0.1 * (1 - 0.27 * n) * Math.sqrt(1 - y0 * y0);
    const d = Math.asin(Math.max(-1, Math.min(1, xm / sx)));
    return [0.5 + d / FPL, (Math.acos(y0) - FT0) / FTL];
  };
  const rgba = (hex, a) => { const c = new THREE.Color(hex); return `rgba(${Math.round(c.r * 255)},${Math.round(c.g * 255)},${Math.round(c.b * 255)},${a})`; };
  function faceMat(skin, iris, hair, lip, lite) {
    const key = skin + iris + hair + lip + (lite ? "s" : "d");
    if (faceCache[key]) return faceCache[key];
    const W = lite ? 256 : 384, S = W / 0.156, dk = (k) => darker(skin, k);
    const cv = document.createElement("canvas"); cv.width = cv.height = W;
    const g = cv.getContext("2d");
    const P = (x, y) => { const [u, v] = faceUV(x, y); return [u * W, v * W]; };
    let sd0 = 11; const r = () => ((sd0 = (sd0 * 16807) % 2147483647) / 2147483647);
    const soft = (x, y, rx, ry, col, a) => { const [px, py] = P(x, y); g.save(); g.translate(px, py); g.scale(rx * S, ry * S); const gr = g.createRadialGradient(0, 0, 0, 0, 0, 1); gr.addColorStop(0, rgba(col, a)); gr.addColorStop(1, rgba(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 1, 0, 7); g.fill(); g.restore(); };
    const path = (pts, close) => { g.beginPath(); const q = pts.map(([x, y]) => P(x, y)); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length - 1; i++) g.quadraticCurveTo(q[i][0], q[i][1], (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2); g.lineTo(q[q.length - 1][0], q[q.length - 1][1]); if (close) g.closePath(); };
    const stroke = (pts, col, a, w) => { path(pts, false); g.strokeStyle = rgba(col, a); g.lineWidth = Math.max(0.6, w * S); g.lineCap = "round"; g.lineJoin = "round"; g.stroke(); };
    // bintik dan semburat kulit
    for (let i = 0; i < (lite ? 140 : 380); i++) { g.fillStyle = r() > 0.5 ? rgba(dk(0.82), 0.05) : "rgba(255,255,255,.04)"; g.beginPath(); g.arc(r() * W, r() * W, 0.6 + r() * 1.8, 0, 7); g.fill(); }
    soft(0, 0.19, 0.045, 0.015, "#ffffff", 0.07); soft(0, 0.03, 0.011, 0.006, "#ffffff", 0.07);
    [-1, 1].forEach((sd) => {
      soft(sd * 0.05, 0.083, 0.022, 0.017, "#D8665A", 0.2); soft(sd * 0.047, 0.1, 0.02, 0.009, "#ffffff", 0.05); soft(sd * 0.052, 0.046, 0.02, 0.014, dk(0.7), 0.12);
      stroke([[sd * 0.0215, 0.083], [sd * 0.0245, 0.067], [sd * 0.0232, 0.055]], dk(0.6), 0.1, 0.0022);
      // mata
      const ex = sd * 0.036, ey = 0.125, hw = 0.0166;
      soft(ex, ey + 0.001, 0.03, 0.02, dk(0.7), 0.38); soft(ex, ey - 0.017, 0.02, 0.006, dk(0.8), 0.16);
      stroke([[ex - hw, ey + 0.0095], [ex, ey + 0.0215], [ex + hw, ey + 0.009]], dk(0.6), 0.5, 0.0008);
      g.save(); path([[ex - hw, ey], [ex, ey + 0.0135], [ex + hw, ey], [ex, ey - 0.0075], [ex - hw, ey]], true); g.clip();
      const [cx, cy] = P(ex, ey);
      g.fillStyle = "#E8E1D7"; g.fillRect(cx - 0.02 * S, cy - 0.02 * S, 0.04 * S, 0.04 * S);
      let gr = g.createLinearGradient(0, cy - 0.0095 * S, 0, cy + 0.006 * S); gr.addColorStop(0, "rgba(70,45,35,.55)"); gr.addColorStop(0.5, "rgba(70,45,35,0)"); gr.addColorStop(1, "rgba(120,80,70,.16)"); g.fillStyle = gr; g.fillRect(cx - 0.02 * S, cy - 0.02 * S, 0.04 * S, 0.04 * S);
      gr = g.createRadialGradient(cx, cy, 1, cx, cy, 0.0059 * S); gr.addColorStop(0, rgba(darker(iris, 1.9), 1)); gr.addColorStop(0.55, rgba(iris, 1)); gr.addColorStop(1, rgba(darker(iris, 0.45), 1));
      g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, 0.0059 * S, 0, 7); g.fill();
      g.fillStyle = "#0A0A0A"; g.beginPath(); g.arc(cx, cy, 0.0027 * S, 0, 7); g.fill();
      g.fillStyle = "rgba(255,255,255,.92)"; g.beginPath(); g.arc(cx - 0.0021 * S, cy - 0.0027 * S, 0.0013 * S, 0, 7); g.fill();
      g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(cx - 0.02 * S, cy - 0.011 * S, 0.04 * S, 0.0055 * S);
      g.restore();
      stroke([[ex - hw, ey], [ex, ey + 0.0132], [ex + hw, ey]], "#1A110D", 0.95, 0.0012);
      for (let i = 0; i < 6; i++) { const x = ex + (i - 2.5) * 0.0055, y = ey + 0.0108 - Math.abs(i - 2.5) * 0.0015; stroke([[x, y], [x + sd * 0.0016, y + 0.0036]], "#1A110D", 0.7, 0.0005); }
      stroke([[ex - 0.0145, ey - 0.002], [ex, ey - 0.0095], [ex + 0.0145, ey - 0.002]], dk(0.7), 0.4, 0.0006);
      soft(ex - sd * 0.0158, ey - 0.0004, 0.0022, 0.0018, "#D98F86", 0.55);
      // alis berbulu
      soft(sd * 0.037, 0.15, 0.027, 0.005, hair, 0.18);
      for (let i = 0; i < (lite ? 40 : 80); i++) {
        const t = r(), x = sd * (0.0125 + 0.052 * t), y = 0.1465 + 0.0075 * Math.sin(Math.PI * Math.min(1, t * 0.92)) * (1 - 0.3 * t) + (r() - 0.5) * 0.003;
        stroke([[x, y], [x + sd * (0.003 + r() * 0.003), y + 0.0016 + (t > 0.55 ? -0.0016 * t : 0)]], hair, 0.35 + r() * 0.5, 0.0004 + r() * 0.0004);
      }
      // hidung
      soft(sd * 0.0095, 0.099, 0.004, 0.016, dk(0.7), 0.12); soft(sd * 0.0105, 0.0775, 0.0055, 0.0045, "#4A2820", 0.42);
      g.fillStyle = "rgba(40,18,14,.75)"; { const [px, py] = P(sd * 0.0066, 0.0742); g.beginPath(); g.ellipse(px, py, 0.0027 * S, 0.0015 * S, 0, 0, 7); g.fill(); }
    });
    soft(0, 0.0715, 0.017, 0.0035, "#3A1E18", 0.26); soft(0, 0.0835, 0.0055, 0.005, "#ffffff", 0.2);
    stroke([[-0.004, 0.069], [-0.0045, 0.0585]], dk(0.6), 0.08, 0.0014); stroke([[0.004, 0.069], [0.0045, 0.0585]], dk(0.6), 0.08, 0.0014);
    // bibir
    const lipUp = darker(lip, 0.93), lipLo = darker(lip, 1.1);
    path([[-0.0195, 0.0514], [-0.0105, 0.0562], [-0.0042, 0.0574], [0, 0.0562], [0.0042, 0.0574], [0.0105, 0.0562], [0.0195, 0.0514], [0.007, 0.0508], [0, 0.0506], [-0.007, 0.0508], [-0.0195, 0.0514]], true); g.fillStyle = rgba(lipUp, 0.95); g.fill();
    path([[-0.0192, 0.0513], [-0.011, 0.0452], [0, 0.0418], [0.011, 0.0452], [0.0192, 0.0513], [0.007, 0.0508], [0, 0.0506], [-0.007, 0.0508], [-0.0192, 0.0513]], true); g.fillStyle = rgba(lipLo, 0.95); g.fill();
    soft(0, 0.0456, 0.0078, 0.0024, "#ffffff", 0.26); soft(0, 0.0385, 0.012, 0.0026, dk(0.65), 0.2);
    stroke([[-0.0205, 0.0515], [-0.008, 0.0507], [0, 0.0505], [0.008, 0.0507], [0.0205, 0.0515]], "#43211B", 0.85, 0.0009);
    // tepi mengabur
    g.globalCompositeOperation = "destination-in";
    let m = g.createLinearGradient(0, 0, W, 0); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(0.14, "#000"); m.addColorStop(0.86, "#000"); m.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = m; g.fillRect(0, 0, W, W);
    m = g.createLinearGradient(0, 0, 0, W); m.addColorStop(0, "rgba(0,0,0,0)"); m.addColorStop(0.1, "#000"); m.addColorStop(0.9, "#000"); m.addColorStop(1, "rgba(0,0,0,0)"); g.fillStyle = m; g.fillRect(0, 0, W, W);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = lite ? 1 : 4;
    const o = { map: tex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
    return (faceCache[key] = lite ? new THREE.MeshLambertMaterial(o) : new THREE.MeshStandardMaterial({ ...o, roughness: 0.6 }));
  }
  const gs = (x, y, z, cx, cy, cz, sg) => Math.exp(-((x - cx) ** 2 + (y - cy) ** 2 + (z - cz) ** 2) / (2 * sg * sg));
  const headTint = (x, y, z) => { const ax = Math.abs(x); const w = Math.min(1, gs(ax, y, z, 0.55, -0.25, 0.8, 0.3) * 0.8 + gs(x, y, z, 0, -0.3, 1.0, 0.16) * 0.8 + gs(ax, y, z, 1.0, -0.05, 0.0, 0.2) * 0.9 + gs(x, y, z, 0, -0.9, 0.55, 0.25) * 0.4); return [1 + 0.07 * w, 1 - 0.11 * w, 1 - 0.16 * w]; };
  const hash = (x, y, z) => { const t = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return t - Math.floor(t); };
  function merge(parts) {
    const pos = [], nor = [], col = [], idx = []; let off = 0;
    const c = new THREE.Color();
    for (const p of parts) {
      const g = p.geo.clone();
      g.computeBoundingBox();
      const minY = g.boundingBox.min.y, span = g.boundingBox.max.y - minY || 1, pa = g.attributes.position, cnt = pa.count;
      c.set(p.color);
      const lo = p.shade ? p.shade[0] : 1, hi = p.shade ? p.shade[1] : 1;
      for (let i = 0; i < cnt; i++) {
        let f = lo + (hi - lo) * ((pa.getY(i) - minY) / span);
        const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
        if (p.noise) f *= 1 + (hash(x * 53, y * 53, z * 53) - 0.5) * p.noise;
        if (p.streak) f *= 0.88 + 0.12 * Math.sin(Math.atan2(x, z) * p.streak + y * 7);
        let cr = c.r * f, cg = c.g * f, cb = c.b * f;
        if (p.tint) { const t = p.tint(x, y, z); cr *= t[0]; cg *= t[1]; cb *= t[2]; }
        col.push(cr, cg, cb);
      }
      g.applyMatrix4(p.m);
      const pp = g.attributes.position.array, nn = g.attributes.normal.array;
      for (let i = 0; i < pp.length; i++) { pos.push(pp[i]); nor.push(nn[i]); }
      if (g.index) { const ia = g.index.array; for (let i = 0; i < ia.length; i++) idx.push(ia[i] + off); } else for (let i = 0; i < cnt; i++) idx.push(i + off);
      off += cnt; g.dispose();
    }
    const out = new THREE.BufferGeometry();
    out.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    out.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    out.setAttribute("color", new THREE.Float32BufferAttribute(col, 3));
    out.setIndex(idx);
    return out;
  }
  const darker = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return "#" + c.getHexString(); };
  const SKINS = ["#F0CDAE", "#E4B48F", "#D49C74", "#BC8460", "#F6DCC6"], HAIRS = ["#3A2B22", "#4A3426", "#2F241E", "#5A4030", "#6B4A32"];

  function person(shirt, opts = {}, rnd = Math.random) {
    const skin = opts.skin || SKINS[Math.floor(rnd() * SKINS.length)], skinDk = darker(skin, 0.9);
    const trousers = opts.legs || "#3B4558", shoeC = opts.shoe || "#2A2522", hairC = opts.hair || HAIRS[Math.floor(rnd() * HAIRS.length)];
    const hairStyle = opts.hairStyle || (opts.long ? "long" : "short");
    const ws = (opts.build || 0.94 + rnd() * 0.12), bodyScale = (opts.height || 1) * (0.96 + rnd() * 0.08);
    const g = new THREE.Group();
    const hips = new THREE.Group(); hips.position.y = 0.93; g.add(hips);
    const mk = (parts, parent, px = 0, py = 0, pz = 0, fx = null, cs = true) => { if (fx) parts.forEach((p) => { if (p.noise === undefined) p.noise = fx; }); const m = new THREE.Mesh(merge(parts), mat); m.position.set(px, py, pz); m.castShadow = shadow && cs; parent.add(m); return m; };

    // panggul (+ rok bila ada)
    const pelvis = [part(sphere, trousers, 0, 0.02, 0, 0.185 * ws, 0.12, 0.135)];
    if (opts.skirt) pelvis.push(part(skirtG, opts.skirt, 0, -0.17, 0, ws, 1, 0.9, 0, 0, 0, [0.85, 1]));
    mk(pelvis, hips, 0, 0, 0, 0.08);
    // kaki: paha, lutut, betis, pergelangan + sepatu
    const legs = [], shins = [], feet = [];
    [-1, 1].forEach((sd) => {
      const hip = new THREE.Group(); hip.position.set(sd * 0.095 * ws, 0, 0); hips.add(hip);
      mk([part(thighG, trousers, 0, 0, 0, 1, 1, 1, 0, 0, 0, [0.8, 1])], hip, 0, 0, 0, 0.1);
      const knee = new THREE.Group(); knee.position.y = -0.42; hip.add(knee);
      mk([part(shinG, trousers, 0, 0, 0, 1, 1, 1, 0, 0, 0, [0.78, 1]), part(sphere, trousers, 0, 0, 0.006, 0.07, 0.065, 0.07)], knee, 0, 0, 0, 0.1);
      const foot = new THREE.Group(); foot.position.y = -0.42; knee.add(foot);
      mk([
        part(sphere, shoeC, 0, -0.045, 0.045, 0.054, 0.042, 0.115), part(sphere, shoeC, 0, -0.055, 0.13, 0.05, 0.03, 0.06), part(sphere, shoeC, 0, -0.05, -0.035, 0.05, 0.04, 0.05),
        part(box, "#E9E3D6", 0, -0.07, 0.05, 0.112, 0.02, 0.27), part(box, darker(shoeC, 2.2), 0, -0.012, 0.07, 0.04, 0.006, 0.07),
      ], foot, 0, 0, 0, null, false);
      legs.push(hip); shins.push(knee); feet.push(foot);
    });
    // badan
    const spine = new THREE.Group(); spine.position.y = 0.06; hips.add(spine);
    const sp = [
      part(torso, shirt, 0, 0, 0, 1.05 * ws, 1, 0.72, 0, 0, 0, [0.84, 1]),
      part(cyl(0.17, 0.17, 0.035, 22), "#2A2E36", 0, 0.02, 0, 1.05 * ws, 1, 0.72), part(box, "#B79A5C", 0, 0.02, 0.124, 0.03, 0.024, 0.01),
      part(cyl(0.062, 0.078, 0.03, 12), opts.collar || "#F4F1EA", 0, 0.55, 0.005, 1, 1, 0.9),
      part(cyl(0.045, 0.052, 0.13, 12), skin, 0, 0.6, 0.004), part(sphere, shirt, -0.212 * ws, 0.465, 0, 0.058, 0.062, 0.058), part(sphere, shirt, 0.212 * ws, 0.465, 0, 0.058, 0.062, 0.058),
    ];
    if (opts.vest) sp.push(part(cyl(0.205, 0.2, 0.4, 18, true), opts.vest, 0, 0.24, 0, 1.08 * ws, 1, 0.8), part(cyl(0.208, 0.208, 0.035, 18, true), "#F4F1EA", 0, 0.22, 0, 1.08 * ws, 1, 0.8));
    if (opts.badge) sp.push(part(box, "#3E7F7C", 0, 0.34, 0.14 * 0.72 + 0.04, 0.08, 0.1, 0.012), part(box, "#2A2E36", 0, 0.45, 0.13, 0.012, 0.18, 0.01));
    if (opts.pack) {
      const pk = opts.pack, pd = darker(pk, 0.82), pl = darker(pk, 1.22);
      sp.push(
        part(sphereHi, pk, 0, 0.3, -0.2, 0.165 * ws, 0.215, 0.085, 0, 0, 0, [0.78, 1.04]), part(sphereHi, pd, 0, 0.44, -0.205, 0.15 * ws, 0.07, 0.088),
        part(sphereHi, pl, 0, 0.2, -0.275, 0.1 * ws, 0.1, 0.03), part(box, pd, 0, 0.2, -0.303, 0.006, 0.16, 0.004), part(box, pd, 0, 0.3, -0.29, 0.05, 0.012, 0.01),
        part(sphereHi, pd, -0.15 * ws, 0.17, -0.2, 0.032, 0.07, 0.04), part(sphereHi, pd, 0.15 * ws, 0.17, -0.2, 0.032, 0.07, 0.04),
        part(box, pd, -0.105 * ws, 0.34, -0.1, 0.04, 0.34, 0.03, -0.4), part(box, pd, 0.105 * ws, 0.34, -0.1, 0.04, 0.34, 0.03, -0.4),
        part(box, pd, -0.105 * ws, 0.52, -0.02, 0.045, 0.02, 0.2), part(box, pd, 0.105 * ws, 0.52, -0.02, 0.045, 0.02, 0.2),
      );
    }
    mk(sp, spine, 0, 0, 0, 0.07);
    // lengan: bahu, siku, tangan
    const arms = [], fore = [], hands = [];
    [-1, 1].forEach((sd) => {
      const sh = new THREE.Group(); sh.position.set(sd * 0.215 * ws, 0.47, 0); sh.rotation.z = sd * 0.07; spine.add(sh);
      mk([part(upperG, shirt, 0, 0, 0, 1, 1, 1, 0, 0, 0, [0.85, 1])], sh, 0, 0, 0, 0.07);
      const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
      mk([part(foreG, opts.short ? skin : shirt, 0, 0, 0, 1, 1, 1, 0, 0, 0, [0.85, 1])].concat(opts.short ? [] : [part(cyl(0.037, 0.037, 0.03, 14), darker(shirt, 0.88), 0, -0.272, 0)]), el, 0, 0, 0, opts.short ? 0.03 : 0.07);
      const hd = new THREE.Group(); hd.position.y = -0.29; el.add(hd);
      mk([part(sphere, skin, 0, -0.05, 0, 0.034, 0.05, 0.017), part(sphere, skin, 0, -0.115, 0.006, 0.03, 0.052, 0.013, 0.12, 0, 0), part(sphere, skinDk, -sd * 0.029, -0.062, 0.012, 0.011, 0.032, 0.011, 0.25, 0, -sd * 0.2)], hd, 0, 0, 0, null, false);
      arms.push(sh); fore.push(el); hands.push(hd);
    });
    // kepala: bentuk, telinga, hidung, mata, alis, senyum, rambut
    const head = new THREE.Group(); head.position.y = 0.64; head.scale.setScalar(1.02); spine.add(head);
    const lipC = new THREE.Color(skin).lerp(new THREE.Color("#B5665C"), 0.5 + rnd() * 0.15).getStyle(), lipLo = darker(lipC, 1.08);
    const irisC = ["#3A2B22", "#2A211C", "#4A3426"][Math.floor(rnd() * 3)], browC = darker(hairC, 1.1);
    let tail = null;
    const hp = [
      part(headGeo, skin, 0, 0.118, 0, 0.1, 0.12, 0.111, 0, 0, 0, [0.96, 1.02], { tint: headTint }),
      part(sphere, skinDk, -0.1, 0.108, -0.004, 0.012, 0.027, 0.019), part(sphere, skinDk, 0.1, 0.108, -0.004, 0.012, 0.027, 0.019),
      part(sphere, skin, 0, 0.108, 0.103, 0.009, 0.026, 0.01), part(sphere, skin, 0, 0.083, 0.108, 0.0125, 0.0105, 0.0125),
      
    ];
    [-1, 1].forEach((sd) => hp.push(part(sphere, darker(skin, 0.8), sd * 0.103, 0.108, 0.0, 0.007, 0.016, 0.01)));
    if (hairStyle === "hijab") {
      const hj = typeof opts.hijab === "string" ? opts.hijab : "#EDE8DD";
      const hf = { noise: 0.05 };
      hp.push(
        part(hemiHr, hj, 0, 0.176, -0.008, 0.121, 0.088, 0.127, 0, 0, 0, [0.85, 1.03], hf), part(sphereHr, hj, 0, 0.1, -0.05, 0.116, 0.118, 0.098, 0, 0, 0, [0.8, 1], hf),
        part(sphereHr, hj, -0.096, 0.1, -0.005, 0.016, 0.07, 0.06, 0, 0, 0, undefined, hf), part(sphereHr, hj, 0.096, 0.1, -0.005, 0.016, 0.07, 0.06, 0, 0, 0, undefined, hf),
        part(sphereHr, hj, 0, 0.012, -0.02, 0.098, 0.05, 0.09, 0, 0, 0, [0.8, 1], hf),
        part(cyl(0.112, 0.17, 0.2, 28, true), hj, 0, -0.06, -0.035, 1, 1, 0.88, 0, 0, 0, [0.82, 1], hf),
      );
    } else {
      const fx = { streak: 14, noise: 0.05 };
      hp.push(
        part(hemiHr, hairC, 0, 0.176, -0.008, 0.117, 0.082, 0.124, -0.16, 0, 0, [0.82, 1.04], fx),
        part(sphereHr, hairC, 0, 0.128, -0.056, 0.105, 0.088, 0.082, 0, 0, 0, [0.8, 1], fx),
        part(sphereHr, hairC, 0.012, 0.19, 0.066, 0.096, 0.026, 0.03, -0.32, 0, 0.12, undefined, fx),
        part(sphereHi, hairC, -0.1, 0.145, 0.0, 0.012, 0.034, 0.03), part(sphereHi, hairC, 0.1, 0.145, 0.0, 0.012, 0.034, 0.03),
      );
      if (hairStyle === "long") {
        hp.push(part(sphereHi, hairC, -0.104, 0.07, 0.022, 0.014, 0.05, 0.022), part(sphereHi, hairC, 0.104, 0.07, 0.022, 0.014, 0.05, 0.022));
        tail = new THREE.Group(); tail.position.set(0, 0.062, -0.07); head.add(tail);
        mk([part(cyl(0.097, 0.083, 0.15, 28), hairC, 0, -0.066, -0.008, 1, 1, 0.78, 0, 0, 0, [0.8, 1.02], fx), part(sphereHr, hairC, 0, -0.144, -0.008, 0.083, 0.032, 0.065, 0, 0, 0, undefined, fx)], tail, 0, 0, 0, null, false);
      }
      if (hairStyle === "bun") hp.push(part(sphereHr, hairC, 0, 0.25, -0.06, 0.058, 0.058, 0.058, 0, 0, 0, undefined, fx));
    }
    mk(hp, head, 0, 0, 0, 0.025);
    const fm = new THREE.Mesh(faceGeo, faceMat(skin, irisC, darker(hairC, 1.1), lipC, small)); fm.scale.set(0.1 * 1.012, 0.12 * 1.012, 0.111 * 1.012); fm.position.set(0, 0.118, 0); fm.renderOrder = 2; head.add(fm);
    const lids = [];
    if (!small) [-1, 1].forEach((sd) => { const l = new THREE.Mesh(sphere, new THREE.MeshLambertMaterial({ color: darker(skin, 0.97), emissive: new THREE.Color("#241b16") })); l.scale.set(0.02, 0.0125, 0.011); l.position.set(sd * 0.036, 0.1255, 0.1); l.visible = false; head.add(l); lids.push(l); });
    // ponsel dan papan jalan di tangan
    let phone = null, flash = null;
    if (opts.phone) {
      phone = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: "#1B2028" })); phone.scale.set(0.07, 0.13, 0.012); phone.position.set(0, -0.08, 0.04); phone.visible = false; hands[1].add(phone);
      flash = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: "#FFFFFF" })); flash.scale.setScalar(0.06); flash.position.set(0, -0.06, 0.12); flash.visible = false; hands[1].add(flash);
    }
    if (opts.hold) { const cb = new THREE.Mesh(box, new THREE.MeshBasicMaterial({ color: "#E9E2D2" })); cb.scale.set(0.2, 0.28, 0.012); cb.position.set(0, -0.1, 0.06); hands[0].add(cb); }
    if (opts.sit) { hips.position.y = 0.6; legs.forEach((l) => { l.rotation.x = -1.5; }); shins.forEach((k) => { k.rotation.x = 1.5; }); }
    const blob = new THREE.Mesh(blobGeo, blobMat()); blob.scale.set(0.95, 1, 0.95); blob.position.y = 0.012; blob.renderOrder = 1; g.add(blob);
    g.scale.setScalar(0.95 * bodyScale);
    g.userData = { tail, hips, spine, head, legs, shins, feet, arms, fore, hands, lids, stance: rnd() * 2 - 1, ph: rnd() * 6.28, phone, flash, sit: !!opts.sit, bob: 0.93 };
    return g;
  }

  // telapak kaki: rata dengan lantai (mengimbangi pinggul + lutut), ujung jari terangkat/menekan saat melangkah
  function setFeet(u, k = 0.85) {
    for (let i = 0; i < 2; i++) {
      const l = u.legs[i].rotation.x, n = u.shins[i].rotation.x;
      u.feet[i].rotation.x = u.sit ? 0 : -(l + n) * k + (l > 0.12 ? (l - 0.12) * 1.4 : 0);
    }
  }
  // gerak hidup: napas, bergeser berat badan, menengok, berkedip, siku mengikuti ayunan bahu
  function life(g, time, gaze = 1) {
    const u = g.userData, ph = u.ph;
    const b = Math.sin(time * 1.6 + ph);
    u.spine.scale.set(1 + b * 0.008, 1 + b * 0.012, 1 + b * 0.01);
    if (!u.skipLife && u.walkT !== time) {
      const shift = Math.sin(time * 0.3 + ph);
      u.spine.rotation.z = Math.sin(time * 0.35 + ph) * 0.02 - shift * 0.02; u.spine.rotation.x = 0.03 + Math.sin(time * 0.5 + ph) * 0.012;
      u.hips.rotation.z = shift * 0.03; u.hips.position.x = shift * 0.014;
    }
    u.head.rotation.y = Math.sin(time * 0.4 + ph * 1.3) * 0.25 * gaze - u.spine.rotation.y * 0.8; u.head.rotation.x = Math.sin(time * 0.31 + ph) * 0.05 - u.spine.rotation.x * 0.5;
    u.head.rotation.z = -u.spine.rotation.z * 0.6;
    if (u.tail && !u.tailW) u.tail.rotation.x = 0.04 + Math.sin(time * 0.9 + ph) * 0.03 + b * 0.01;
    u.tailW = false;
    if (u.lids.length) { const t = (time * 0.5 + ph) % 4, on = t < 0.12; u.lids[0].visible = u.lids[1].visible = on; }
    for (let i = 0; i < 2; i++) { const sd = i ? 1 : -1; u.arms[i].rotation.z = sd * (0.07 + 0.012 * b + (u.sit ? 0 : 0.015 * Math.sin(time * 0.6 + ph + i * 2))); u.arms[i].rotation.y = -sd * 0.08; }
    if (!u.skipLife && u.elbowT !== time) for (let i = 0; i < 2; i++) u.fore[i].rotation.x = u.elbow ? u.elbow[i] : -(0.22 + Math.max(0, -u.arms[i].rotation.x - 0.6) * 0.7);
    u.skipLife = false;
  }
  function walk(g, sp, amp, time) {
    const u = g.userData, w = Math.sin(time * sp + u.ph) * amp, c = Math.cos(time * sp + u.ph);
    u.legs[0].rotation.x = w; u.legs[1].rotation.x = -w;
    u.shins[0].rotation.x = Math.max(0, -w) * 1.3 + 0.05; u.shins[1].rotation.x = Math.max(0, w) * 1.3 + 0.05;
    u.arms[0].rotation.x = -w * 0.75; u.arms[1].rotation.x = w * 0.75;
    u.fore[0].rotation.x = -0.3 - Math.max(0, w) * 0.5; u.fore[1].rotation.x = -0.3 - Math.max(0, -w) * 0.5;
    u.hips.position.y = u.bob + Math.abs(c) * amp * 0.035; u.hips.rotation.y = w * 0.18; u.spine.rotation.y = -w * 0.22; u.spine.rotation.z = c * 0.02; u.spine.rotation.x = 0.06;
    setFeet(u);
    u.elbowT = time; u.walkT = time;
  }
  // langkah berdasarkan fase (mis. jarak tempuh): amp 0..~0.6 = dari diam sampai berjalan cepat; transisi halus
  function walkPhase(g, phase, amp) {
    const u = g.userData, s0 = Math.sin(phase), w = s0 * amp, c = Math.cos(phase);
    u.legs[0].rotation.x = w; u.legs[1].rotation.x = -w;
    u.shins[0].rotation.x = Math.max(0, -Math.sin(phase + 0.6)) * amp * 1.5 + 0.04; u.shins[1].rotation.x = Math.max(0, Math.sin(phase + 0.6)) * amp * 1.5 + 0.04;
    u.arms[0].rotation.x = -w * 0.8; u.arms[1].rotation.x = w * 0.8;
    u.fore[0].rotation.x = -0.28 - Math.max(0, w) * 0.7; u.fore[1].rotation.x = -0.28 - Math.max(0, -w) * 0.7;
    u.hips.position.y = u.bob + (Math.abs(c) - 0.5) * amp * 0.05; u.hips.position.x = s0 * amp * 0.04;
    u.hips.rotation.y = w * 0.3; u.hips.rotation.z = s0 * amp * 0.1;
    u.spine.rotation.y = -w * 0.35; u.spine.rotation.z = -s0 * amp * 0.07; u.spine.rotation.x = 0.04 + amp * 0.08;
    setFeet(u);
    if (u.tail) { u.tail.rotation.x = 0.1 + amp * 0.25 + Math.sin(phase * 2 - 0.9) * amp * 0.35; u.tail.rotation.z = Math.sin(phase - 0.5) * amp * 0.3; u.tailW = true; }
    u.skipLife = true;
  }
  // berdiri: bobot bertumpu pada satu kaki, kaki lain sedikit maju dan menekuk
  function rest(g) {
    const u = g.userData;
    u.hips.rotation.y = 0; u.spine.rotation.y = 0; u.hips.position.y = u.sit ? 0.6 : u.bob;
    if (u.sit) { u.hips.position.x = 0; return; }
    const s = u.stance;
    u.legs[0].rotation.x = -0.07 * s; u.legs[1].rotation.x = 0.04 * s;
    u.shins[0].rotation.x = 0.03 + Math.max(0, s) * 0.12; u.shins[1].rotation.x = 0.03 + Math.max(0, -s) * 0.12;
    setFeet(u, 1);
  }
  function arms(g, a0, a1, e0, e1) {
    const u = g.userData; u.arms[0].rotation.x = a0; u.arms[1].rotation.x = a1;
    u.elbow = e0 === undefined ? null : [e0, e1];
  }
  return { person, life, walk, walkPhase, rest, arms };
}
