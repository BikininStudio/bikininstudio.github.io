// Pekan Karya Bukit Rawa (sekolah fiktif): satu kampus isometrik. Kamera mengikuti jalur pengunjung dari gerbang ke enam stan karya
// (urutan ular), lalu mundur ke pandangan jauh. Gambar karya dipakai ulang dari ../pameran-3d/art.js.
// Logika pameran: pengunjung berjalan antar stan, berhenti melihat karya (maks. 2 orang per stan, sisanya mengantre), ada yang memotret;
// tuan rumah hanya menjelaskan saat ada tamu; upacara pengibaran bendera oleh paskibra; meja registrasi; panggung band dengan penonton; lapak jajanan; satpam.
import { seg, mix, canvasTexture } from "../3d/scroll3d.js";
import { KARYA, drawArt } from "../pameran-3d/art.js";
import { createHumans } from "../3d/humans.js";
import { createGlbHumans } from "../3d/humans-glb.js";

const PANELS = 8; // sama dengan jumlah .panel
const C = { navy: "#2B3A55", teal: "#3E7F7C", amber: "#C08A3E", red: "#9E4B3F", cream: "#EDE6D6", sand: "#E6DFD0", plate: "#BFCBB5", road: "#4A525E", white: "#F1EEE6", terra: "#A86F55", wood: "#8C6A45", crate: "#C49A63" };
const STALLS = [[-11, 7], [0, 7], [11, 7], [11, -4], [0, -4], [-11, -4]]; // karya 1..6: baris depan kiri ke kanan, baris belakang kanan ke kiri
const AWN = ["#3E7F7C", "#C08A3E", "#9E4B3F", "#2B3A55", "#7C4F7A", "#5E8A5A"];
const KEYS = [
  { x: 8, z: 6, size: 16.5, turn: -0.22 },
  { x: -11, z: 8, size: 6.6, turn: -0.2 },
  { x: 0, z: 8, size: 6.6, turn: -0.1 },
  { x: 11, z: 8, size: 6.6, turn: 0.05 },
  { x: 11, z: -3, size: 6.6, turn: 0.15 },
  { x: 0, z: -3, size: 6.6, turn: 0.05 },
  { x: -11, z: -3, size: 6.6, turn: -0.1 },
  { x: -2, z: 2, size: 28, turn: 0.1 },
];
// rute pengunjung (berulang): spot v = indeks stan; spot melihat di depan meja, lorong di antaranya
const SPOT = (k) => [STALLS[k][0], k < 3 ? 11.2 : 0.5];
const ROUTE = [
  { p: [0, 18.8] }, { p: [5.8, 16.7], v: 6 }, { p: [0, 14.2] }, { p: [-11, 12.8] }, { p: SPOT(0), v: 0 }, { p: [-11, 12.8] }, { p: [0, 12.8] }, { p: SPOT(1), v: 1 }, { p: [0, 12.8] },
  { p: [11, 12.8] }, { p: SPOT(2), v: 2 }, { p: [11, 12.8] }, { p: [5.5, 12.8] }, { p: [5.5, 2.2] }, { p: [11, 2.2] }, { p: SPOT(3), v: 3 }, { p: [11, 2.2] },
  { p: [0, 2.2] }, { p: SPOT(4), v: 4 }, { p: [0, 2.2] }, { p: [-11, 2.2] }, { p: SPOT(5), v: 5 }, { p: [-11, 2.2] }, { p: [-5.5, 2.2] }, { p: [-5.5, 12.8] }, { p: [0, 14.2] },
];
let seed = 11;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export async function create(THREE, ctx) {
  const { small } = ctx;
  await Promise.all([document.fonts.load('700 30px "Bricolage Grotesque"'), document.fonts.load('700 20px "Hanken Grotesk"'), document.fonts.load('500 20px "Hanken Grotesk"')]).catch(() => {});

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#FFFFFF", "#B7C2B0", 1.6));
  const sun = new THREE.DirectionalLight("#FFF4E2", 1.5);
  sun.position.set(-18, 42, 28);
  sun.castShadow = !small;
  Object.assign(sun.shadow.camera, { left: -44, right: 44, top: 44, bottom: -44, near: 1, far: 120 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0008;
  sun.target.position.set(0, 0, 2);
  scene.add(sun, sun.target);

  const mats = {};
  const mat = (c) => (mats[c] ||= new THREE.MeshLambertMaterial({ color: c }));
  const box = (w, h, d, color, x, y, z, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof color === "string" ? mat(color) : color);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const flat = (w, d, color, x, z, y = 0.01) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), typeof color === "string" ? mat(color) : color);
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const cyl = (rt, rb, h, color, x, y, z, parent = scene, seg2 = 10) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg2), mat(color)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const textTex = (w, h, draw) => canvasTexture(THREE, w, h, draw);
  const label = (w, h, d, text, bg, fg, size, x, y, z, parent = scene, font = "Bricolage Grotesque") => {
    const tx = textTex(Math.round(w * 128), Math.round(h * 128), (g, cw, ch) => { g.fillStyle = bg; g.fillRect(0, 0, cw, ch); g.fillStyle = fg; g.font = `700 ${size}px "${font}", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, cw / 2, ch / 2 + 2); });
    const face = new THREE.MeshLambertMaterial({ map: tx }), edge = mat(bg);
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [edge, edge, edge, edge, face, edge]);
    m.position.set(x, y, z); m.castShadow = true; parent.add(m);
    return m;
  };

  // ---- tanah: rumput bertekstur, plaza berpaving, tepi rendah ----
  const grassTex = textTex(256, 256, (g, w, h) => { g.fillStyle = "#A0B294"; g.fillRect(0, 0, w, h); let s = 3; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647); for (let i = 0; i < 700; i++) { g.fillStyle = ["#94A888", "#AABB9D", "#9AAE8E"][i % 3]; g.fillRect(r() * w, r() * h, 3, 3); } });
  grassTex.wrapS = grassTex.wrapT = THREE.RepeatWrapping; grassTex.repeat.set(40, 40);
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), new THREE.MeshLambertMaterial({ map: grassTex }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.52; scene.add(ground);
  box(76, 0.5, 60, C.plate, 0, -0.25, 0).castShadow = false;
  box(48.6, 0.1, 36.6, "#CFC7B4", 0, 0.03, 3).castShadow = false;
  const payTex = textTex(256, 256, (g, w, h) => { g.fillStyle = "#E6DFD0"; g.fillRect(0, 0, w, h); g.strokeStyle = "rgba(120,108,90,.28)"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64, h); g.moveTo(0, i * 64); g.lineTo(w, i * 64); g.stroke(); } g.fillStyle = "rgba(255,255,255,.22)"; g.fillRect(0, 0, 64, 64); g.fillRect(128, 128, 64, 64); });
  payTex.wrapS = payTex.wrapT = THREE.RepeatWrapping; payTex.repeat.set(12, 9);
  flat(48, 36, new THREE.MeshLambertMaterial({ map: payTex }), 0, 3, 0.09);
  // jalan raya di depan gerbang
  flat(80, 5.5, C.road, 0, 24, 0.02);
  for (let i = -19; i < 20; i++) flat(1.4, 0.16, "#F2EBDD", i * 2, 24, 0.03);
  flat(80, 0.4, "#EEF0F1", 0, 21, 0.025);
  // taman bunga + semak di depan gedung dan di tepi plaza
  const bedSpots = [];
  for (const [bx, bz, w] of [[-9.5, -12.2, 10], [9.5, -12.2, 10]]) { box(w, 0.35, 1.3, "#7FA06E", bx, 0.25, bz); for (let i = 0; i < w * 2.2; i++) bedSpots.push([bx - w / 2 + 0.3 + (i / (w * 2.2)) * (w - 0.6), 0.55, bz + (rnd() - 0.5) * 0.8]); }
  const flowers = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 6, 5), new THREE.MeshLambertMaterial(), bedSpots.length);
  const fcols = ["#D9798A", "#F2C94C", "#F4F1EA", "#C06BD0", "#E8884A"].map((c) => new THREE.Color(c));
  const o = new THREE.Object3D();
  bedSpots.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.scale.set(1, 1, 1); o.updateMatrix(); flowers.setMatrixAt(i, o.matrix); flowers.setColorAt(i, fcols[i % 5]); });
  scene.add(flowers);

  // ---- gedung sekolah ----
  const winTile = textTex(128, 128, (g, w, h) => {
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#5E7A90"; g.fillRect(34, 30, 60, 66);
    g.fillStyle = "rgba(255,255,255,.4)"; g.fillRect(34, 30, 60, 16);
    g.fillStyle = "rgba(0,0,0,.14)"; g.fillRect(30, 96, 68, 6); g.fillRect(62, 30, 4, 66);
  });
  winTile.wrapS = winTile.wrapT = THREE.RepeatWrapping;
  const facade = (w, h, d, x, y, z, cols, rows, color = C.cream) => {
    const side = new THREE.MeshLambertMaterial({ color, map: winTile.clone() });
    side.map.needsUpdate = true;
    side.map.repeat.set(cols, rows);
    const plain = mat(color);
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), [plain, plain, plain, plain, side, plain]);
    b.position.set(x, y, z);
    b.castShadow = b.receiveShadow = true;
    scene.add(b);
    return b;
  };
  facade(30, 6.5, 8, 0, 3.25, -19, 11, 2);
  box(31.5, 0.5, 9.2, C.terra, 0, 6.75, -19);
  box(31.5, 0.18, 0.3, "#8C5B47", 0, 7.1, -19); // bubungan
  box(31.2, 0.3, 0.4, "#E3DAC6", 0, 6.3, -14.85); // list atap
  [-20, 20].forEach((wx) => { facade(10, 4.6, 6.5, wx, 2.3, -16, 4, 1); box(10.8, 0.4, 7.2, C.terra, wx, 4.8, -16); box(10.6, 0.25, 0.3, "#E3DAC6", wx, 4.5, -12.7); });
  [[-8, 7.2], [6, 7.2], [-14, 7.2], [11, 7.2]].forEach(([x, y]) => { box(1.1, 0.5, 0.9, "#C3CBD0", x, y + 0.1, -21); }); // unit AC di atap
  // beranda: tangga, pilar, pintu ganda berbingkai, jam
  [0, 1, 2].forEach((i) => box(8.6 - i * 0.6, 0.18, 1.0, "#CFC7B4", 0, 0.1 + i * 0.18, -12.2 + i * 0.35));
  box(7.4, 4.6, 2.6, "#E3DAC6", 0, 2.4, -14.1);
  box(8.4, 0.4, 3.4, "#8C5B47", 0, 4.9, -14.0);
  box(8.4, 0.3, 0.2, "#8C5B47", 0, 5.2, -12.4);
  [-3.2, -1.1, 1.1, 3.2].forEach((px) => box(0.4, 4.5, 0.4, C.white, px, 2.3, -12.7));
  box(2.9, 3.4, 0.2, "#6B4B36", 0, 1.8, -12.85); box(1.3, 3.0, 0.1, "#3A2B22", -0.7, 1.7, -12.74); box(1.3, 3.0, 0.1, "#3A2B22", 0.7, 1.7, -12.74);
  label(9, 1.1, 0.2, "SMA BUKIT RAWA", C.navy, C.white, 64, 0, 6.05, -12.7);
  const clock = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.12, 20), mat("#F1EEE6")); clock.rotation.x = Math.PI / 2; clock.position.set(0, 7.15, -14.9); scene.add(clock);
  const hands = new THREE.Group(); hands.position.set(0, 7.15, -14.82); scene.add(hands);
  const hand1 = box(0.07, 0.42, 0.03, "#1F2422", 0, 0.2, 0, hands), hand2 = box(0.05, 0.3, 0.03, "#1F2422", 0, 0.14, 0.01, hands);

  // ---- gerbang: pilar berlampu, daun pagar terbuka, pos satpam, spanduk, balon ----
  [-4.6, 4.6].forEach((x) => { box(1.3, 4.2, 1.3, C.cream, x, 2.1, 19); box(1.7, 0.3, 1.7, C.terra, x, 4.3, 19); box(1.0, 0.1, 1.0, "#D9D2C2", x, 4.5, 19); const l = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshBasicMaterial({ color: "#FFE9B0" })); l.position.set(x, 4.8, 19); scene.add(l); });
  [[-4.1, 0.7], [4.1, -0.7]].forEach(([x, rot]) => { const lf = box(2.2, 1.5, 0.08, C.white, x + Math.sin(rot) * 1.1, 0.95, 19 + Math.cos(rot) * 0.0 + (rot > 0 ? 1.0 : 1.0), scene); lf.rotation.y = rot * 1.3; });
  label(11, 1.5, 0.2, "PEKAN KARYA BUKIT RAWA", C.amber, "#1F2422", 70, 0, 3.6, 19.1);
  const fencePosts = [];
  for (const side of [-1, 1]) for (let i = 0; i < 18; i++) fencePosts.push([side * (6.2 + i * 1.5), 19]);
  const fp = new THREE.InstancedMesh(new THREE.BoxGeometry(0.14, 1.3, 0.14), mat(C.white), fencePosts.length);
  fencePosts.forEach(([x, z], i) => { o.position.set(x, 0.65, z); o.updateMatrix(); fp.setMatrixAt(i, o.matrix); });
  fp.castShadow = true; scene.add(fp);
  [-1, 1].forEach((sd) => { box(27, 0.1, 0.1, C.white, sd * 19.7, 1.05, 19); box(27, 0.1, 0.1, C.white, sd * 19.7, 0.5, 19); });
  // pos satpam
  box(2.2, 2.6, 2.0, "#E3DAC6", -8.2, 1.3, 16.6); box(2.8, 0.25, 2.6, C.terra, -8.2, 2.7, 16.6); box(0.05, 1.0, 1.4, "#9FC4D6", -7.08, 1.7, 16.6);
  const balloons = ["#B9483A", "#D6A93A", "#3E7F7C", "#7C4F7A", "#2B3A55", "#E9ECEE"].map((c, k) => {
    const g = new THREE.Group();
    const bl = new THREE.Mesh(new THREE.SphereGeometry(0.42, 10, 8), mat(c)); bl.scale.y = 1.2; bl.position.y = 2.6; bl.castShadow = true; g.add(bl);
    box(0.02, 2.2, 0.02, "#EDEDED", 0, 1.1, 0, g);
    g.position.set((k < 3 ? -5.3 : 5.3) + (k % 3) * 0.55 * (k < 3 ? -1 : 1), 0, 19.8);
    g.userData = { ph: k * 1.3 };
    scene.add(g);
    return g;
  });
  // ---- tiang bendera (sisi timur, tidak tertutup stan) ----
  const PX = 19, PZ = -4;
  cyl(0.6, 0.7, 0.2, "#CFC7B4", PX, 0.15, PZ, scene, 14);
  cyl(0.08, 0.1, 9, "#C3CBD0", PX, 4.5, PZ, scene, 8);
  const flag = new THREE.Group();
  box(2.2, 0.7, 0.05, "#B9483A", 1.1, 0.35, 0, flag); box(2.2, 0.7, 0.05, "#F1EEE6", 1.1, -0.35, 0, flag);
  flag.position.set(PX + 0.05, 1.5, PZ); scene.add(flag);
  // meja registrasi di dekat gerbang
  box(2.6, 0.9, 1.0, C.crate, 5.8, 0.6, 14.8); box(2.7, 0.06, 1.1, "#3E7F7C", 5.8, 1.08, 14.8); box(2.7, 0.7, 0.04, "#3E7F7C", 5.8, 0.78, 15.34);
  [-1.0, 1.0].forEach((dx) => box(0.06, 1.3, 0.06, "#3A424D", 5.8 + dx, 1.75, 14.35));
  label(2.4, 0.5, 0.08, "REGISTRASI", "#F1EEE6", "#1F2422", 36, 5.8, 2.35, 14.35);
  [[-0.7, "#F1EEE6"], [-0.3, "#D6A93A"], [0.1, "#F1EEE6"]].forEach(([dx, c]) => box(0.3, 0.12, 0.4, c, 5.8 + dx, 1.17, 14.7));

  // ---- stan karya ----
  const stripeTex = (c) => textTex(256, 32, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#F1EEE6" : c; g.fillRect(i * 32, 0, 32, h); } });
  const matTex = textTex(128, 128, (g, w, h) => { g.fillStyle = "#D9D2C2"; g.fillRect(0, 0, w, h); g.fillStyle = "#CFC7B4"; g.fillRect(0, 0, 64, 64); g.fillRect(64, 64, 64, 64); });
  matTex.wrapS = matTex.wrapT = THREE.RepeatWrapping; matTex.repeat.set(3, 3);
  const bulbs = [];
  const stallInfo = STALLS.map(([sx, sz], k) => {
    const col = AWN[k];
    const g = new THREE.Group();
    g.position.set(sx, 0, sz);
    scene.add(g);
    const f = new THREE.Mesh(new THREE.PlaneGeometry(6.6, 5.6), new THREE.MeshLambertMaterial({ map: matTex })); f.rotation.x = -Math.PI / 2; f.position.y = 0.12; f.receiveShadow = true; g.add(f);
    [[-2.9, -2.4], [2.9, -2.4], [-2.9, 2.4], [2.9, 2.4]].forEach(([x, z]) => box(0.16, 3.3, 0.16, C.wood, x, 1.65, z, g));
    [-2.4, 2.4].forEach((z) => box(5.9, 0.1, 0.1, C.wood, 0, 3.1, z, g));
    [-2.9, 2.9].forEach((x) => box(0.1, 0.1, 4.7, C.wood, x, 3.1, 0, g));
    // atap pelana: dua bidang miring + bubungan + kain tepi bergaris
    const rl = box(3.45, 0.1, 5.9, col, -1.65, 3.58, 0, g); rl.rotation.z = 0.17;
    const rr = box(3.45, 0.1, 5.9, col, 1.65, 3.58, 0, g); rr.rotation.z = -0.17;
    box(0.2, 0.14, 5.95, "#F1EEE6", 0, 3.88, 0, g);
    const vm = new THREE.MeshLambertMaterial({ map: stripeTex(col) });
    box(6.8, 0.5, 0.06, vm, 0, 3.05, 2.9, g);
    [-3.35, 3.35].forEach((x) => box(0.06, 0.5, 5.7, vm, x, 3.05, 0, g));
    for (let i = 0; i < 9; i++) bulbs.push([sx - 3.0 + i * 0.75, 2.78, sz + 2.88]);
    // dinding belakang kain + papan karya berbingkai kayu di atas kaki penyangga
    box(6.2, 3.0, 0.12, "#EDE6D6", 0, 1.65, -2.55, g);
    const art = textTex(1024, 768, (cg, w, h) => drawArt(k, cg, w, h));
    const board = new THREE.Mesh(new THREE.PlaneGeometry(4.4, 3.3), new THREE.MeshBasicMaterial({ map: art }));
    board.position.set(0, 1.95, -2.42); g.add(board);
    box(4.64, 3.54, 0.07, C.wood, 0, 1.95, -2.46, g);
    [-1.9, 1.9].forEach((x) => box(0.1, 0.5, 0.1, C.wood, x, 0.22, -2.4, g));
    // papan nama stan di atap + spanduk berdiri bernomor
    label(4.6, 0.7, 0.1, `Karya ${k + 1} · ${KARYA[k].judul}`.slice(0, 30), "#F1EEE6", "#1F2422", 34, 0, 4.25, 2.7, g);
    const nm = textTex(128, 384, (cg, w, h) => { cg.fillStyle = col; cg.fillRect(0, 0, w, h); cg.fillStyle = "#F1EEE6"; cg.font = '700 90px "Bricolage Grotesque", sans-serif'; cg.textAlign = "center"; cg.fillText(String(k + 1), w / 2, 130); cg.font = '700 26px "Hanken Grotesk", sans-serif'; cg.fillText("STAN", w / 2, 190); });
    const nmM = new THREE.MeshLambertMaterial({ map: nm }), nmE = mat(col);
    const rb = new THREE.Mesh(new THREE.BoxGeometry(0.8, 2.3, 0.05), [nmE, nmE, nmE, nmE, nmM, nmE]); rb.position.set(3.55, 1.3, 2.5); rb.castShadow = true; g.add(rb);
    box(0.9, 0.06, 0.3, "#3A424D", 3.55, 0.12, 2.5, g);
    // meja berkain + taplak jatuh
    box(4.8, 0.9, 1.3, C.crate, 0, 0.6, 0.9, g);
    box(4.9, 0.06, 1.4, col, 0, 1.08, 0.9, g);
    box(4.9, 0.7, 0.04, col, 0, 0.78, 1.58, g);
    // tanaman pot
    cyl(0.3, 0.22, 0.45, "#B8946A", -3.3, 0.35, 2.4, g, 8);
    const lf2 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 1), new THREE.MeshLambertMaterial({ color: "#5E9E6B", flatShading: true })); lf2.position.set(-3.3, 0.95, 2.4); lf2.castShadow = true; g.add(lf2);
    return { g, art };
  });
  const sG = (k) => stallInfo[k].g;
  const glass = new THREE.MeshLambertMaterial({ color: "#9FC4D6", transparent: true, opacity: 0.55 });
  { // karya 1: akuarium siklus air + awan kapas
    const g = sG(0);
    box(1.4, 0.7, 0.7, glass, -1.0, 1.47, 0.9, g); box(1.3, 0.25, 0.62, "#4F7F95", -1.0, 1.25, 0.9, g);
    const cl = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 6), mat("#F4F1EA")); cl.position.set(-1.0, 2.0, 0.9); cl.scale.y = 0.6; g.add(cl);
    box(0.04, 0.5, 0.04, "#6E98AA", -0.9, 1.78, 0.9, g);
  }
  { // karya 2: toples rempah + karung
    const g = sG(1);
    [["#9E4B3F", -1.4], ["#C08A3E", -0.9], ["#6B4B36", -0.4], ["#5E8A5A", 0.1]].forEach(([c, x]) => { cyl(0.2, 0.2, 0.5, c, x, 1.37, 0.9, g, 10); cyl(0.22, 0.22, 0.08, "#E9E2D2", x, 1.66, 0.9, g, 10); });
    box(0.7, 0.45, 0.5, "#C9B38C", 1.2, 1.35, 0.9, g);
  }
  { // karya 3: maket rumah panggung (tiang, lantai, dinding, atap, tangga)
    const g = sG(2), hm = "#B8946A";
    [[-0.45, -0.3], [0.45, -0.3], [-0.45, 0.3], [0.45, 0.3]].forEach(([x, z]) => box(0.07, 0.45, 0.07, hm, x - 0.9, 1.35, z + 0.9, g));
    box(1.2, 0.07, 0.8, hm, -0.9, 1.6, 0.9, g); box(1.0, 0.5, 0.65, "#D8CBB0", -0.9, 1.88, 0.9, g);
    const rf = new THREE.Mesh(new THREE.ConeGeometry(0.95, 0.5, 4), mat("#8C5B47")); rf.rotation.y = Math.PI / 4; rf.scale.set(1.0, 1, 0.75); rf.position.set(-0.9, 2.4, 0.9); g.add(rf);
    box(0.3, 0.05, 0.7, hm, -0.9, 1.4, 1.4, g).rotation.x = 0.5;
    box(0.7, 0.4, 0.5, "#E9E2D2", 1.3, 1.3, 0.9, g);
  }
  { // karya 4: kartu usulan logo berdiri
    const g = sG(3);
    ["#B9483A", "#3E7F7C", "#D6A93A", "#2B3A55", "#7C4F7A"].forEach((c, i) => { box(0.5, 0.65, 0.06, "#F1EEE6", -1.5 + i * 0.7, 1.45, 0.9, g); box(0.34, 0.34, 0.07, c, -1.5 + i * 0.7, 1.5, 0.9, g); });
    cyl(0.28, 0.28, 0.5, "#F1EEE6", 1.8, 1.35, 0.9, g, 10);
  }
  { // karya 5: laptop + tablet
    const g = sG(4);
    box(0.95, 0.05, 0.65, "#3A424D", 0.9, 1.15, 0.9, g);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.62), new THREE.MeshBasicMaterial({ map: stallInfo[4].art }));
    scr.position.set(0.9, 1.45, 0.62); scr.rotation.x = -0.25; g.add(scr);
    box(0.95, 0.66, 0.04, "#3A424D", 0.9, 1.45, 0.59, g).rotation.x = -0.25;
    box(0.55, 0.04, 0.4, "#3A424D", -0.6, 1.14, 0.95, g); box(0.5, 0.01, 0.35, "#2B3A55", -0.6, 1.17, 0.95, g);
  }
  { // karya 6: foto dijemur di tali
    const g = sG(5);
    box(5.4, 0.03, 0.03, "#8C6A45", 0, 2.55, 2.1, g);
    ["#B8946A", "#7C9A8F", "#C0794F", "#8FA3B7", "#C8B07A", "#A07B8C"].forEach((c, i) => { box(0.55, 0.7, 0.04, "#F1EEE6", -2.2 + i * 0.88, 2.15, 2.1, g); box(0.44, 0.58, 0.05, c, -2.2 + i * 0.88, 2.15, 2.12, g); });
  }
  const bulbMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.1, 6, 5), new THREE.MeshBasicMaterial({ color: "#FFE9B0" }), bulbs.length);
  bulbs.forEach(([x, y, z], i) => { o.position.set(x, y, z); o.updateMatrix(); bulbMesh.setMatrixAt(i, o.matrix); });
  scene.add(bulbMesh);

  // ---- panggung band ----
  box(9, 0.8, 4, "#8C6A45", -24, 0.4, -8); box(9.2, 0.1, 4.2, "#CFC7B4", -24, 0.84, -8);
  label(8.6, 3.2, 0.15, "PENTAS SENI", "#2B3A55", "#F1EEE6", 70, -24, 2.6, -9.9);
  [-27.5, -20.5].forEach((x) => { box(0.9, 1.5, 0.8, "#2A2E36", x, 1.7, -8.6); cyl(0.25, 0.25, 0.1, "#3A424D", x, 1.95, -8.2, scene, 10).rotation.x = Math.PI / 2; });
  cyl(0.5, 0.5, 0.45, "#B9483A", -22.0, 1.3, -9.0, scene, 12); cyl(0.3, 0.3, 0.3, "#E9E2D2", -23.0, 1.65, -9.1, scene, 10); cyl(0.3, 0.3, 0.3, "#E9E2D2", -21.0, 1.65, -9.1, scene, 10);
  const cym = cyl(0.4, 0.4, 0.03, "#D6A93A", -20.9, 2.2, -9.0, scene, 12);
  box(0.4, 0.04, 0.4, "#3A424D", -24.0, 1.05, -6.6); // monitor panggung

  // ---- lapak jajanan + kantin + lapangan basket ----
  function cart(x, z, c) {
    box(2.2, 0.9, 1.2, "#C49A63", x, 0.7, z); box(2.3, 0.12, 1.3, c, x, 1.2, z);
    box(2.2, 0.35, 0.08, c, x, 1.0, z + 0.62);
    cyl(0.04, 0.04, 2.4, "#C3CBD0", x, 2.0, z - 0.4, scene, 6);
    const um = new THREE.Mesh(new THREE.ConeGeometry(1.5, 0.55, 10), mat(c)); um.position.set(x, 3.25, z - 0.4); um.castShadow = true; scene.add(um);
    [-0.8, 0.8].forEach((dx) => { const w = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.1, 12), mat("#1B2028")); w.rotation.z = Math.PI / 2; w.position.set(x + dx, 0.3, z + 0.7); w.castShadow = true; scene.add(w); });
    cyl(0.28, 0.28, 0.4, "#E9E2D2", x - 0.5, 1.45, z, scene, 10);
    box(0.5, 0.3, 0.4, "#D6A93A", x + 0.5, 1.4, z, scene);
  }
  cart(-9, 16, "#B9483A"); cart(9, 16, "#3E7F7C");
  box(8, 3.4, 5.5, "#E3DAC6", -27, 1.7, 4); box(8.8, 0.4, 6.3, C.terra, -27, 3.5, 4); box(7.6, 0.5, 0.1, "#9FC4D6", -27, 2.4, 6.78);
  box(8, 0.2, 2.2, C.amber, -27, 3.0, 7.4); [-30.6, -23.4].forEach((x) => box(0.15, 3, 0.15, C.wood, x, 1.5, 8.3));
  label(4.2, 0.6, 0.1, "KANTIN", C.teal, C.white, 40, -27, 3.3, 8.5);
  [[-26, 9], [-29, 9.5]].forEach(([x, z]) => { box(1.6, 0.12, 1.0, C.crate, x, 0.9, z); [[-0.6, -0.3], [0.6, 0.3]].forEach(([dx, dz]) => box(0.1, 0.8, 0.1, C.wood, x + dx, 0.45, z + dz)); box(0.4, 0.2, 0.3, "#D6A93A", x + 0.2, 1.06, z); });
  flat(10, 18, "#7B93A8", 28.5, 4, 0.16); flat(9.6, 0.12, "#F1EEE6", 28.5, 4, 0.17); flat(0.12, 17.6, "#F1EEE6", 28.5, 4, 0.17);
  [-4.5, 12.5].forEach((z) => { cyl(0.07, 0.07, 3.3, "#3A424D", 28.5, 1.7, z, scene, 6); box(1.6, 1.0, 0.08, "#F1EEE6", 28.5, 3.2, z); box(0.55, 0.05, 0.3, "#B9483A", 28.5, 2.75, z + (z < 0 ? 0.2 : -0.2)); });
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 8), mat("#C4743A")); ball.castShadow = true; scene.add(ball);

  // ---- pohon + bangku + lampu ----
  const treeSpots = [];
  for (let i = 0; i < 44; i++) { const [x, z] = [[-34 + rnd() * 4, -26 + rnd() * 50], [31 + rnd() * 4, -26 + rnd() * 22], [-30 + rnd() * 60, 28 + rnd() * 4], [-34 + rnd() * 68, -27 + rnd() * 2]][i % 4]; treeSpots.push([x, z, 0.8 + rnd() * 0.6]); }
  const pines = treeSpots.filter((_, i) => i % 3 !== 2), rounds = treeSpots.filter((_, i) => i % 3 === 2);
  const fm = () => new THREE.MeshLambertMaterial({ flatShading: true });
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.17, 1, 6), mat("#6B4B36"), treeSpots.length);
  const lowC = new THREE.InstancedMesh(new THREE.ConeGeometry(0.95, 1.5, 8), fm(), pines.length);
  const upC = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 1.3, 8), fm(), pines.length);
  const blobs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.9, 1), fm(), rounds.length);
  const greens = ["#3F7E55", "#4F8F5E", "#5E9E6B", "#6FAE74"].map((c) => new THREE.Color(c)), rg = ["#7DB878", "#6BA865", "#8CBF7E"].map((c) => new THREE.Color(c));
  treeSpots.forEach(([x, z, s], i) => { o.position.set(x, 0.55 * s, z); o.scale.set(s, 1.1 * s, s); o.updateMatrix(); trunks.setMatrixAt(i, o.matrix); });
  pines.forEach(([x, z, s], i) => { const c = greens[i % 4]; o.position.set(x, 1.15 * s, z); o.scale.setScalar(s); o.updateMatrix(); lowC.setMatrixAt(i, o.matrix); lowC.setColorAt(i, c); o.position.set(x, 2.0 * s, z); o.updateMatrix(); upC.setMatrixAt(i, o.matrix); upC.setColorAt(i, c); });
  rounds.forEach(([x, z, s], i) => { o.position.set(x, 1.45 * s, z); o.scale.set(s * 1.1, s * 0.95, s * 1.1); o.updateMatrix(); blobs.setMatrixAt(i, o.matrix); blobs.setColorAt(i, rg[i % 3]); });
  [trunks, lowC, upC, blobs].forEach((m) => { m.castShadow = true; scene.add(m); });
  const lampSpots = [[-5.5, 12], [5.5, 12], [-5.5, 1.5], [5.5, 1.5], [-5.5, -8], [5.5, -8], [-17, 12], [17, 12], [-17, -2], [17, -2]];
  const poles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 2.2, 0.07), mat("#3A424D"), lampSpots.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 8, 6), new THREE.MeshBasicMaterial({ color: "#FFE9B0" }), lampSpots.length);
  lampSpots.forEach(([x, z], i) => { o.position.set(x, 1.1, z); o.scale.set(1, 1, 1); o.updateMatrix(); poles.setMatrixAt(i, o.matrix); o.position.set(x, 2.3, z); o.updateMatrix(); heads.setMatrixAt(i, o.matrix); });
  scene.add(poles, heads);
  [[-17, 5.2], [17, 5.2], [-16, -9], [-3.2, 14.6], [3.2, 14.6]].forEach(([x, z]) => { box(2.2, 0.12, 0.6, C.wood, x, 0.55, z); box(2.2, 0.5, 0.1, C.wood, x, 0.85, z - 0.28); box(0.1, 0.5, 0.5, "#3A424D", x - 0.9, 0.28, z); box(0.1, 0.5, 0.5, "#3A424D", x + 0.9, 0.28, z); });

  // ---- tokoh ----
  const H = (await createGlbHumans(THREE, { small, shadow: !small, base: new URL("../assets/humans/", import.meta.url) })) || createHumans(THREE, { lit: "lambert", shadow: !small, small });
  function person(shirt, x, z, ry = 0, opts = {}) {
    const g = H.person(shirt, { short: true, ...opts, hairStyle: opts.hijab ? "hijab" : opts.long ? "long" : "short" }, rnd);
    g.scale.multiplyScalar((opts.scale || 1.55) * 0.89);
    g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    return g;
  }
  const UNI = C.white, GREY = "#6F7886";
  const act = [];
  const reg = (g, kind, extra = {}) => { Object.assign(g.userData, { kind }, extra); act.push(g); return g; };
  // tuan rumah tiap stan: menjelaskan hanya saat ada tamu
  const hosts = STALLS.map(([sx, sz], k) => reg(person(UNI, sx - 1.2, sz - 0.1, 0, { legs: GREY, long: k % 2 === 1, pack: null }), "host", { stall: k }));
  // pengunjung: agen yang mengikuti rute, melihat karya, mengantre, memotret
  const SHIRTS = ["#B9483A", "#3E7F7C", "#7C4F7A", "#D6A93A", "#2B3A55", "#5E8A5A", "#C58E65", "#8CA0B3", UNI, "#D9798A"];
  const agents = SHIRTS.slice(0, small ? 6 : 10).map((c, n) => {
    const isStudent = c === UNI;
    const g = person(c, 0, 0, 0, { legs: isStudent ? GREY : ["#4A4F5A", "#3B4558", "#6B5B4E"][n % 3], phone: n % 3 === 0, long: n % 2 === 1, pack: isStudent || n % 4 === 1 ? "#3B4558" : null });
    const a = { g, i: (n * 7) % ROUTE.length, ox: ((n % 3) - 1) * 0.55, oz: (n % 2) * 0.35, dwell: 0, wait: false, speed: 1.15 + (n % 4) * 0.12, spot: false, photoT: 0, x: 0, z: 0, vx: 0, vz: 0, heading: Math.PI, amp: 0, phase: n * 1.3 };
    const w = ROUTE[a.i];
    a.x = w.p[0] + a.ox; a.z = w.p[1] + a.oz;
    return a;
  });
  const occ = [0, 0, 0, 0, 0, 0, 0];
  // meja registrasi: dua panitia melayani tamu
  [[5.2, "#F1EEE6"], [6.4, "#F1EEE6"]].forEach(([x, c], i) => reg(person(c, x, 13.6, 0, { legs: "#3B4558", vest: "#D4742C", badge: true, long: i === 1 }), "host", { stall: 6 }));
  // upacara pengibaran bendera: tiga paskibra di kaki tiang + dua baris siswa menghadap tiang
  reg(person("#F1EEE6", PX - 0.9, PZ - 1.0, 0, { legs: "#B9483A", hair: "#1B1B1B" }), "pull");
  reg(person("#F1EEE6", PX + 0.9, PZ - 1.0, 0, { legs: "#B9483A", hair: "#1B1B1B", long: true }), "hold");
  reg(person("#F1EEE6", PX, PZ - 1.9, 0, { legs: "#B9483A", vest: "#B9483A", badge: true }), "cmd");
  for (let r = 0; r < 2; r++) for (let c = 0; c < 4; c++) reg(person(UNI, PX - 2.7 + c * 1.8, PZ - 4.6 - r * 1.3, 0, { legs: GREY, hair: "#1B1B1B", long: (r + c) % 2 === 0 }), "rank");
  // satpam di pos
  reg(person("#2B3A55", -6.2, 17.6, Math.PI * 0.2, { legs: "#2B3A55", hair: "#1B1B1B", badge: true }), "guard");
  // lapak jajanan: penjual + pembeli
  [[-9, 16], [9, 16]].forEach(([x, z], i) => { reg(person(i ? "#E9ECEE" : "#D6A93A", x, z - 1.0, 0, { legs: "#3B4558" }), "vendor"); reg(person(UNI, x - 0.7, z + 1.4, Math.PI * 0.95, { legs: GREY, pack: "#3B4558" }), "buyer"); reg(person(i ? "#7C4F7A" : "#3E7F7C", x + 0.9, z + 1.6, Math.PI * 1.05, { long: true }), "buyer"); });
  // panitia berompi oranye berpatroli di lorong
  const patrol = (g, ax, c, r, sp) => reg(g, "pat", { pat: { ax, c, r, sp } });
  patrol(person("#F1EEE6", -14, 2.2, 0, { vest: "#D4742C", badge: true, hold: true, legs: "#3B4558" }), "x", 0, 15, 0.09);
  patrol(person("#F1EEE6", 5.5, 8, 0, { vest: "#D4742C", badge: true, legs: "#3B4558" }), "z", 7, 5.5, 0.1);
  // guru di depan beranda
  reg(person("#7C4F7A", -2.2, -8.4, Math.PI * 0.4, { legs: "#2B3A55", hold: true }), "talk", { dir: 1 });
  reg(person("#C08A3E", -0.6, -8.4, Math.PI * 1.6, { legs: "#3B4558" }), "talk", { dir: -1 });
  // band: gitaris, vokalis, drummer + penonton
  const band = [reg(person("#B9483A", -26.0, -8.6, 0, { legs: "#2B3A55", hair: "#1B1B1B" }), "guitar"), reg(person("#3E7F7C", -24.2, -7.4, 0, { legs: "#2B3A55", long: true }), "sing"), reg(person("#2B3A55", -21.9, -9.1, 0, { legs: "#3B4558" }), "drum")];
  [[-27.2, -3.4], [-25.4, -2.8], [-23.6, -3.6], [-21.8, -2.9], [-20.2, -3.5], [-24.5, -1.7]].forEach(([x, z], i) => reg(person(SHIRTS[(i + 3) % 10], x, z, Math.PI, { pack: i % 2 ? "#3B4558" : null, long: i % 2 === 0, phone: i === 2 }), i % 3 === 1 ? "cheer" : "clap"));
  // kantin
  [[-26.5, 8.4, 0.3], [-24.5, 9.2, -0.5], [-29.5, 9.8, 0.8], [-30.5, 6.5, 1.4]].forEach(([x, z, r], i) => reg(person(["#7C4F7A", "#3E7F7C", "#D6A93A", UNI][i], x, z, r, { legs: i === 3 ? GREY : "#4A4F5A" }), "eat"));
  // basket
  const hoopers = [0, 1, 2].map((i) => person(["#B9483A", "#2B3A55", "#D6A93A"][i], 28.5, 4, 0, { legs: "#E9E2D2" }));
  hoopers.forEach((g, i) => { g.userData.ph = i * 2; });
  if (small) act.forEach((g, k) => { if (k % 3 === 2 && !["host", "cut", "guitar", "sing", "drum"].includes(g.userData.kind)) g.visible = false; });

  // ---- bus sekolah + mobil: roda berpelek ----
  const gWheel = new THREE.CylinderGeometry(1, 1, 1, 12).rotateX(Math.PI / 2), gHub = new THREE.CylinderGeometry(1, 1, 1, 8).rotateX(Math.PI / 2), gBar = new THREE.BoxGeometry(1, 0.16, 1.12);
  const wheels = [];
  function wheel(parent, x, y, z, r, w) {
    const g = new THREE.Group(); g.position.set(x, y, z);
    const t = new THREE.Mesh(gWheel, mat("#1B2028")); t.scale.set(r, r, w); t.castShadow = true; g.add(t);
    if (!small) { const h = new THREE.Mesh(gHub, mat("#C3CBD0")); h.scale.set(r * 0.55, r * 0.55, w * 1.08); g.add(h); const b = new THREE.Mesh(gBar, mat("#3A424D")); b.scale.set(r * 0.9, r, w); g.add(b); }
    parent.add(g); wheels.push([g, r]);
  }
  function vehicle(len, h, bodyColor, wheelXs, r, bus) {
    const g = new THREE.Group();
    box(len, h, 2.0, bodyColor, 0, 0.55 + h / 2, 0, g);
    box(len - 0.5, 0.5, 2.04, "#9FC4D6", -0.1, 0.55 + h * 0.62, 0, g);
    box(len, 0.14, 2.04, "#F1EEE6", 0, 0.8, 0, g);
    box(0.06, 0.55, 1.7, "#9FC4D6", len / 2 + 0.01, 0.55 + h * 0.6, 0, g);
    [0.6, -0.6].forEach((z) => box(0.06, 0.16, 0.26, "#FFE9B0", len / 2 + 0.02, 0.85, z, g));
    box(0.12, 0.2, 1.9, "#2A313C", len / 2 + 0.03, 0.62, 0, g);
    if (bus) { box(0.8, 0.28, 1.2, "#F1EEE6", len / 2 - 0.9, 0.55 + h + 0.18, 0, g); for (let i = 0; i < 5; i++) box(0.05, 0.4, 1.3, "#1F2422", -len / 2 + 0.9 + i * 1.1, 0.55 + h * 0.62, 1.0, g); }
    wheelXs.forEach((x) => [0.9, -0.9].forEach((z) => wheel(g, x, r, z, r, 0.3)));
    scene.add(g);
    return g;
  }
  const bus = vehicle(6.4, 1.8, "#D6A93A", [-2, 2], 0.5, true);
  const van = vehicle(3.6, 1.1, "#3E7F7C", [-1.1, 1.1], 0.4, false);

  // ---- awan ----
  const cloudMat = new THREE.MeshLambertMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.88 });
  const clouds = [[-20, 15, -34], [10, 16, -38], [30, 14, 40], [-6, 17, 44]].map(([x, y, z], k) => {
    const g = new THREE.Group();
    [[0, 0, 0, 1.6], [1.6, -0.3, 0.4, 1.2], [-1.5, -0.4, -0.2, 1.1], [0.4, 0.5, -0.6, 1.1]].forEach(([a, b, c2, r]) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat); m.position.set(a, b, c2); m.scale.y = 0.6; g.add(m); });
    g.position.set(x, y, z); g.userData = { x, speed: 0.35 + k * 0.08 };
    scene.add(g);
    return g;
  });

  // ---- jalur kunjungan yang menggambar diri ----
  const routePath = new THREE.CurvePath();
  const rp = ROUTE.map((w) => new THREE.Vector3(w.p[0], 0.26, w.p[1]));
  for (let i = 1; i < rp.length; i++) if (rp[i].distanceTo(rp[i - 1]) > 0.01) routePath.add(new THREE.LineCurve3(rp[i - 1], rp[i]));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(routePath, 400, 0.09, 6, false), new THREE.MeshBasicMaterial({ color: "#5E3C0C" }));
  const tubeCount = tube.geometry.index.count;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 12), new THREE.MeshBasicMaterial({ color: "#FFE2A8" }));
  scene.add(tube, head);

  // ---- kamera ortografis isometrik ----
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  const target = new THREE.Vector3(), dir = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  let aspect = 1, lastT = null;
  const sway = (g, sp, amp, time) => H.walk(g, sp, amp, time);
  const still = (g) => H.rest(g);
  const ease = (t) => t * t * (3 - 2 * t);

  return {
    scene, camera, toneMapping: THREE.NoToneMapping,
    resize(w, h) { aspect = w / h; },
    update(p, dtEngine, time) {
      const dt = lastT === null ? 0 : Math.min(0.25, Math.max(0, time - lastT));
      lastT = time;
      const s = p * (PANELS - 1);
      const i = Math.min(PANELS - 2, Math.floor(s)), t = seg(s, i, i + 1);
      const a = KEYS[i], b = KEYS[i + 1];
      const portrait = aspect < 0.9;
      let size = mix(a.size, b.size, t);
      size *= 1 + Math.sin(t * Math.PI) * 0.25;
      if (portrait) size *= 1.35;
      const turn = mix(a.turn, b.turn, t) + Math.PI / 4 + ctx.pointer.x * 0.06;
      dir.set(Math.sin(turn), 1.05 - ctx.pointer.y * 0.05, Math.cos(turn)).normalize();
      target.set(mix(a.x, b.x, t), 0, mix(a.z, b.z, t));
      right.set(Math.cos(turn), 0, -Math.sin(turn));
      up.set(-Math.sin(turn), 0, -Math.cos(turn));
      if (portrait) target.addScaledVector(up, -size * 0.55);
      else target.addScaledVector(right, -size * aspect * 0.32);
      camera.position.copy(target).addScaledVector(dir, 120);
      camera.lookAt(target);
      camera.left = -size * aspect; camera.right = size * aspect; camera.top = size; camera.bottom = -size;
      camera.updateProjectionMatrix();

      const k = Math.max(0.001, seg(s, 0.2, 6.3));
      tube.geometry.setDrawRange(0, Math.floor((tubeCount * k) / 3) * 3);
      head.position.copy(routePath.getPointAt(k));
      head.scale.setScalar(1 + Math.sin(time * 5) * 0.15);

      // lingkungan: bendera naik-turun dan berkibar, jam, balon, awan
      // upacara (70 dtk): 0-8 bersiap, 8-38 bendera naik pelan, 38-52 tegak, 52-64 diturunkan, 64-70 dilipat
      const cp = time % 70;
      let fr = 0;
      if (cp >= 8 && cp < 38) fr = ease((cp - 8) / 30); else if (cp >= 38 && cp < 52) fr = 1; else if (cp >= 52 && cp < 64) fr = 1 - ease((cp - 52) / 12);
      const raising = (cp >= 8 && cp < 38) || (cp >= 52 && cp < 64);
      flag.position.y = 1.5 + 6.9 * fr;
      flag.rotation.y = Math.sin(time * 2.2) * 0.12 * (0.3 + fr);
      hands.children[0].rotation.z = 0; hands.rotation.z = -time * 0.05;
      hand2.rotation.z = 0;
      balloons.forEach((g) => { g.rotation.z = Math.sin(time * 1.4 + g.userData.ph) * 0.08; g.position.y = Math.sin(time * 1.1 + g.userData.ph) * 0.12; });
      clouds.forEach((c) => { c.position.x = ((c.userData.x + time * c.userData.speed + 40) % 100) - 40; });

      // ---- pengunjung: rute, melihat karya (maks. 2 orang per stan, sisanya mengantre), memotret ----
      const present = [0, 0, 0, 0, 0, 0, 0];
      agents.forEach((ag) => {
        const w = ROUTE[ag.i], isSpot = w.v !== undefined, tx = w.p[0] + ag.ox, tz = w.p[1] + ag.oz, g = ag.g, u = g.userData;
        let standing = false;
        const dw = () => (w.v === 6 ? 3 + (u.ph % 2) : 6 + (u.ph % 3) * 2);
        if (ag.dwell > 0) { ag.dwell -= dt; standing = true; if (ag.dwell <= 0) { occ[w.v]--; ag.i = (ag.i + 1) % ROUTE.length; ag.wait = false; ag.spot = false; standing = false; } }
        else if (ag.wait) { standing = true; if (occ[w.v] < 2) { ag.wait = false; occ[w.v]++; ag.dwell = dw(); ag.spot = true; ag.photoT = ag.dwell * 0.55; } }
        else {
          // kemudi: kecepatan dihaluskan, melambat saat mendekati titik berhenti, belok mulus
          let dist = Math.hypot(tx - ag.x, tz - ag.z);
          const want = isSpot ? Math.min(ag.speed, dist * 1.4 + 0.04) : ag.speed;
          const nx = dist > 1e-3 ? (tx - ag.x) / dist : 0, nz = dist > 1e-3 ? (tz - ag.z) / dist : 0, kk = Math.min(1, dt * 3.5);
          ag.vx += (nx * want - ag.vx) * kk; ag.vz += (nz * want - ag.vz) * kk;
          ag.x += ag.vx * dt; ag.z += ag.vz * dt;
          dist = Math.hypot(tx - ag.x, tz - ag.z);
          if (isSpot) { if (dist < 0.1) { ag.vx = ag.vz = 0; if (occ[w.v] < 2) { occ[w.v]++; ag.dwell = dw(); ag.spot = true; ag.photoT = ag.dwell * 0.55; } else ag.wait = true; } }
          else if (dist < 0.7) ag.i = (ag.i + 1) % ROUTE.length;
        }
        if (standing) { const damp = Math.max(0, 1 - dt * 8); ag.vx *= damp; ag.vz *= damp; }
        const spd = Math.hypot(ag.vx, ag.vz);
        if (standing && isSpot && w.v >= 0 && !ag.wait) present[w.v] += 1;
        let face = ag.heading;
        if (spd > 0.18) face = Math.atan2(ag.vx, ag.vz); else if (standing) face = Math.PI + Math.sin(time * 0.6 + u.ph) * 0.2;
        let dr = face - ag.heading; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); ag.heading += dr * Math.min(1, dt * 5);
        g.position.set(ag.x, 0, ag.z + (ag.wait ? 1.0 : 0)); g.rotation.y = ag.heading;
        // langkah mengikuti jarak tempuh; ayunan menyesuaikan kecepatan
        ag.amp += (Math.min(0.55, spd * 0.5) - ag.amp) * Math.min(1, dt * 6);
        ag.phase += spd * dt * 3.4;
        if (ag.amp > 0.04) H.walkPhase(g, ag.phase, ag.amp);
        else {
          still(g);
          const photo = u.phone && ag.spot && ag.dwell > 0 && ag.dwell < ag.photoT && ag.dwell > ag.photoT - 2.2;
          if (photo) { u.arms[0].rotation.x = u.arms[1].rotation.x = -1.7; u.phone.visible = true; u.flash.visible = ag.dwell < ag.photoT - 1.0 && ag.dwell > ag.photoT - 1.18; }
          else { u.arms[0].rotation.x = u.arms[1].rotation.x = 0.1; if (u.phone) { u.phone.visible = false; u.flash.visible = false; } }
        }
      });

      // ---- tokoh lain ----
      act.forEach((g) => {
        const u = g.userData, kd = u.kind;
        if (kd === "host") {
          const guests = present[u.stall] > 0;
          if (guests) { u.arms[1].rotation.x = -1.3 + Math.sin(time * 2.4 + u.ph) * 0.5; u.arms[0].rotation.x = Math.sin(time * 1.7 + u.ph) * 0.3 - 0.4; g.rotation.y = Math.sin(time * 0.8 + u.ph) * 0.25; }
          else { u.arms[0].rotation.x = u.arms[1].rotation.x = 0.05; g.rotation.y = 0; }
          g.position.y = Math.abs(Math.sin(time * 1.4 + u.ph)) * (guests ? 0.03 : 0.012);
        } else if (kd === "pull") {
          if (raising) { const sp = Math.sin(time * 2.6 + u.ph); u.arms[0].rotation.x = -1.6 + sp * 0.6; u.arms[1].rotation.x = -1.6 - sp * 0.6; g.position.y = Math.abs(sp) * 0.03; }
          else { u.arms[0].rotation.x = u.arms[1].rotation.x = 0.05; g.position.y = 0; }
        } else if (kd === "hold") {
          if (cp < 8) u.arms[0].rotation.x = u.arms[1].rotation.x = -1.2;
          else if (raising) { u.arms[1].rotation.x = -2.3; u.arms[0].rotation.x = 0.05; }
          else u.arms[0].rotation.x = u.arms[1].rotation.x = 0.05;
        } else if (kd === "cmd") {
          u.arms[1].rotation.x = raising ? -2.3 : 0.05; u.arms[0].rotation.x = 0.05;
        } else if (kd === "rank") {
          u.arms[1].rotation.x = raising ? -2.3 : 0.05; u.arms[0].rotation.x = 0.05; g.position.y = Math.abs(Math.sin(time * 0.9 + u.ph)) * 0.012;
        } else if (kd === "guard") {
          const wv = (time % 10) < 2.4;
          u.arms[1].rotation.x = wv ? -2.6 + Math.sin(time * 6) * 0.4 : 0.05; u.arms[0].rotation.x = 0.05;
        } else if (kd === "vendor") {
          u.arms[0].rotation.x = Math.sin(time * 2.2 + u.ph) * 0.6 - 0.7; u.arms[1].rotation.x = Math.sin(time * 2.2 + u.ph + 1.5) * 0.6 - 0.7;
        } else if (kd === "buyer") {
          u.arms[1].rotation.x = -0.9 + Math.sin(time * 1.4 + u.ph) * 0.2; u.arms[0].rotation.x = 0.1; g.position.y = Math.abs(Math.sin(time * 1.1 + u.ph)) * 0.02;
        } else if (kd === "pat") {
          const pt = u.pat, v = Math.sin(time * pt.sp + u.ph), dv = Math.cos(time * pt.sp + u.ph), pos = pt.c + pt.r * v;
          if (pt.ax === "x") { g.position.x = pos; g.rotation.y = dv >= 0 ? Math.PI / 2 : -Math.PI / 2; } else { g.position.z = pos; g.rotation.y = dv >= 0 ? 0 : Math.PI; }
          sway(g, 7, 0.5, time);
        } else if (kd === "talk") {
          g.rotation.y = u.dir > 0 ? Math.PI * 0.4 + Math.sin(time * 0.7) * 0.1 : Math.PI * 1.6 + Math.sin(time * 0.7 + 1) * 0.1;
          u.arms[1].rotation.x = -0.9 + Math.sin(time * 2 + u.ph) * 0.5; u.arms[0].rotation.x = 0.1;
        } else if (kd === "guitar") {
          u.arms[0].rotation.x = -1.2; u.arms[1].rotation.x = -0.9 + Math.sin(time * 9) * 0.35; g.position.y = 0.8 + Math.abs(Math.sin(time * 4)) * 0.03; g.rotation.y = Math.sin(time * 1.4) * 0.25;
        } else if (kd === "sing") {
          u.arms[1].rotation.x = -1.3; u.arms[0].rotation.x = Math.sin(time * 2.2) > 0 ? -2.6 : 0.1; g.position.y = 0.8 + Math.abs(Math.sin(time * 4.4)) * 0.06;
        } else if (kd === "drum") {
          u.arms[0].rotation.x = -1.0 + Math.sin(time * 12) * 0.55; u.arms[1].rotation.x = -1.0 + Math.sin(time * 12 + 3.1) * 0.55; g.position.y = 0.8;
          cym.rotation.z = Math.sin(time * 12) * 0.05;
        } else if (kd === "clap") {
          u.arms[0].rotation.x = u.arms[1].rotation.x = -1.2 + Math.sin(time * 8 + u.ph) * 0.3; g.position.y = Math.abs(Math.sin(time * 4 + u.ph)) * 0.05;
          if (u.phone) { u.phone.visible = false; }
        } else if (kd === "cheer") {
          u.arms[0].rotation.x = u.arms[1].rotation.x = -2.6 + Math.sin(time * 6 + u.ph) * 0.4; g.position.y = Math.abs(Math.sin(time * 5 + u.ph)) * 0.12;
        } else if (kd === "eat") {
          u.arms[1].rotation.x = -1.1 + Math.sin(time * 1.8 + u.ph) * 0.35; u.arms[0].rotation.x = 0.1; g.position.y = Math.abs(Math.sin(time * 1.2 + u.ph)) * 0.02;
        }
      });
      agents.forEach((ag) => H.life(ag.g, time)); act.forEach((pg) => H.life(pg, time));
      // basket
      hoopers.forEach((g, n) => {
        const ph = time * 0.7 + n * 2.1;
        g.position.set(28.5 + Math.sin(ph) * 3.2, 0.16, 4 + Math.cos(ph * 0.8 + n) * 6);
        g.rotation.y = Math.atan2(Math.cos(ph) * 3.2 * 0.7, -Math.sin(ph * 0.8 + n) * 6 * 0.56);
        sway(g, 11, 0.7, time);
      });
      hoopers.forEach((pg) => H.life(pg, time));
      const h0 = hoopers[0].position;
      ball.position.set(h0.x + 0.5, 0.45 + Math.abs(Math.sin(time * 6)) * 0.9, h0.z + 0.3);
      // bus dan mobil melintas di jalan depan
      bus.position.set(((time * 2.6 + 20) % 84) - 42, 0, 23.1);
      van.position.set(42 - ((time * 3.2 + 60) % 84), 0, 25.0); van.rotation.y = Math.PI;
      wheels.forEach(([w, r], n) => { w.rotation.z = -time * 2.6 / r * (w.parent === van ? -1.2 : 1); });
      return true;
    },
  };
}
