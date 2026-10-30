// Arunika 3D: satu dunia logistik utuh; kamera terbang gudang -> pelabuhan -> truk -> kereta -> kurir -> pandangan jauh mengikuti scroll (adegan diturunkan dari website-3d/scenes/kota.js).
// An orthographic camera flies between the areas as the page scrolls; a glowing route draws itself from the warehouse
// to the city, ships, trucks, the train, vans and a few clouds move while the stage is on screen.
import { seg, mix, canvasTexture } from "../3d/scroll3d.js";

const PANELS = 6; // keep in sync with the .panel count in this chapter
// Nada menengah, kejenuhan rendah (docs/DESIGN.md 11.4): peta kabut pelabuhan, bukan kota neon
const C = { navy: "#2B3A55", navy2: "#34445F", teal: "#3E7F7C", amber: "#C08A3E", red: "#9E4B3F", gray: "#C3CBD0", white: "#E9ECEE", ground: "#C9CFD3", grass: "#B9C4B0", road: "#5B6470", water: "#8FA9B4" };
// Camera stops: target x/z, half-height of the view, extra turn around the vertical axis
const KEYS = [
  { x: 3, z: 5.5, size: 10.5, turn: -0.3 },
  { x: -22, z: -4, size: 13, turn: 0.3 },
  { x: 17.5, z: 9, size: 12, turn: 0.1 },
  { x: 15, z: 18, size: 10.5, turn: -0.12 },
  { x: 30, z: -2, size: 10, turn: 0.28 },
  { x: 12, z: 5, size: 27, turn: 0.1 },
];

// Simple seeded random so the town looks the same on every visit
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export async function create(THREE, ctx) {
  const { small } = ctx;
  await document.fonts.load('800 120px "Montserrat"');

  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight("#FFFFFF", "#AEB9C8", 1.6));
  const sun = new THREE.DirectionalLight("#FFF4E2", 1.5);
  sun.position.set(-20, 40, 25);
  sun.castShadow = !small;
  Object.assign(sun.shadow.camera, { left: -45, right: 45, top: 45, bottom: -45, near: 1, far: 120 });
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0008;
  sun.target.position.set(12, 0, 5);
  scene.add(sun, sun.target);

  const mats = {};
  const mat = (c) => (mats[c] ||= new THREE.MeshLambertMaterial({ color: c }));
  const box = (w, h, d, color, x, y, z, parent = scene) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    parent.add(m);
    return m;
  };
  const flat = (w, d, color, x, z, y = 0.01) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(color));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x, y, z);
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };

  // Ground, water, grass, roads
  const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshLambertMaterial({ color: "#5F92A8" }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.6;
  scene.add(water);
  // riak air: satu InstancedMesh garis putih tipis yang bergeser pelan (random terpisah agar tata letak kota tidak berubah)
  let ws = 11;
  const wr = () => (ws = (ws * 16807) % 2147483647) / 2147483647;
  const waveList = [];
  for (let i = 0; i < 900 && waveList.length < 420; i++) { const x = -80 + wr() * 170, z = -75 + wr() * 150; if (x > -12.5 && x < 46.5 && z > -27.5 && z < 37.5) continue; waveList.push([x, z, 0.6 + wr() * 1.6]); }
  const waves = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.02, 0.14), new THREE.MeshBasicMaterial({ color: "#DCEBF0", transparent: true, opacity: 0.6 }), waveList.length);
  const wo = new THREE.Object3D();
  waveList.forEach(([x, z, k], i) => { wo.position.set(x, -0.575, z); wo.scale.set(k, 1, 1); wo.updateMatrix(); waves.setMatrixAt(i, wo.matrix); });
  scene.add(waves);
  // bidang air yang lebih terang: memberi kedalaman pada laut
  const patchList = [];
  for (let i = 0; i < 160 && patchList.length < 44; i++) { const x = -85 + wr() * 175, z = -80 + wr() * 160; if (x > -13 && x < 47 && z > -28 && z < 38) continue; patchList.push([x, z, 5 + wr() * 7, 3 + wr() * 4]); }
  const patches = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: "#86B8CC", transparent: true, opacity: 0.3 }), patchList.length);
  patchList.forEach(([x, z, w, d], i) => { wo.position.set(x, -0.59, z); wo.scale.set(w, 1, d); wo.updateMatrix(); patches.setMatrixAt(i, wo.matrix); });
  wo.scale.set(1, 1, 1);
  scene.add(patches);
  // pelampung penanda alur kapal
  const buoys = [-12, 0, 12].map((z, k) => {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.42, 0.7, 10), mat(k % 2 ? C.red : C.white)); body.position.y = 0.35; body.castShadow = true; g.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.36, 0.2, 10), mat(k % 2 ? C.white : C.red)); band.position.y = 0.4; g.add(band);
    const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: "#FFE9B0" })); lamp.position.y = 0.95; g.add(lamp);
    g.position.set(-31, -0.55, z);
    scene.add(g);
    return g;
  });
  // pulau karang kecil dengan mercusuar
  const isl = new THREE.Group();
  [[0, 0, 7, 5.5, "#B9B09A"], [0.4, 0.35, 5, 3.8, "#8FAE86"]].forEach(([x, y, w, d, c]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.9, d), mat(c)); b.position.set(x, y - 0.2, 0); b.receiveShadow = true; isl.add(b); });
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.72, 4.2, 12), mat(C.white)); tower.position.set(0.4, 2.5, 0); tower.castShadow = true; isl.add(tower);
  const towerBand = new THREE.Mesh(new THREE.CylinderGeometry(0.56, 0.62, 0.7, 12), mat(C.red)); towerBand.position.set(0.4, 2.7, 0); isl.add(towerBand);
  const lampRoom = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.55, 10), new THREE.MeshBasicMaterial({ color: "#FFE9B0" })); lampRoom.position.set(0.4, 4.85, 0); isl.add(lampRoom);
  const lampRoof = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.7, 10), mat(C.red)); lampRoof.position.set(0.4, 5.45, 0); isl.add(lampRoof);
  isl.position.set(-42, -0.1, 14);
  scene.add(isl);
  const land = box(56, 1.2, 62, C.ground, 17, -0.6, 5);
  land.castShadow = false;
  flat(9, 12, C.grass, 15, -16);
  flat(14, 7, C.grass, 38, 15);
  flat(10, 6, C.grass, -4, 28);
  const dashes = [];
  [[5, 17.5, 3, 17], [17.5, 26, 25, 3], [30, 17.5, 3, 17], [17.5, 9, 25, 3], [1, 9, 8, 3], [-3, 11, 3, 6], [1, 13, 8, 3], [29.5, -1, 18, 2.2], [29.5, -9.5, 18, 2.2], [29.5, 7, 18, 2.2], [21.3, -1, 2.2, 19], [29.5, -1, 2.2, 19], [37.7, -1, 2.2, 19]].forEach(([x, z, w, d]) => {
    flat(w + 0.7, d + 0.7, "#EEF0F1", x, z, 0.02); // tepi jalan terang
    flat(w, d, "#3F4753", x, z, 0.04);
    // marka tengah putus-putus
    const lng = w > d, len = lng ? w : d, n = Math.floor(len / 1.6);
    for (let i = 0; i < n; i++) dashes.push(lng ? [x - len / 2 + 0.8 + i * 1.6, z, 0] : [x, z - len / 2 + 0.8 + i * 1.6, 1]);
  });
  // marka jalan: satu InstancedMesh untuk semua garis putus-putus
  const dashMesh = new THREE.InstancedMesh(new THREE.BoxGeometry(0.8, 0.02, 0.14), mat("#F2EBDD"), dashes.length);
  const dm = new THREE.Object3D();
  dashes.forEach(([x, z, turn], i) => { dm.position.set(x, 0.06, z); dm.rotation.y = turn ? Math.PI / 2 : 0; dm.updateMatrix(); dashMesh.setMatrixAt(i, dm.matrix); });
  scene.add(dashMesh);
  // quay edge
  box(1, 1.4, 62, C.gray, -10.5, -0.5, 5).castShadow = false;
  flat(0.8, 62, "#EEF6F8", -11.4, 5, -0.585); // buih di tepi dermaga
  flat(0.9, 22, "#E6DFD0", -10.5, -3, 0.215); // jalur pekerja di dermaga

  let bayDoor = null;
  // Warehouses with a branded roof
  const roofTex = canvasTexture(THREE, 1024, 512, (g, w, h) => {
    g.fillStyle = C.navy; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.06)";
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 3, h);
    g.fillStyle = C.amber;
    g.font = '800 120px "Montserrat", sans-serif';
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("ARUNIKA", w / 2, h / 2);
  });
  for (const [z, d] of [[-2, 5.5], [5, 5]]) {
    box(9, 3.2, d, C.white, 4, 1.6, z);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.35, d + 0.4), [mat(C.navy), mat(C.navy), new THREE.MeshLambertMaterial({ map: roofTex }), mat(C.navy), mat(C.navy), mat(C.navy)]);
    roof.position.set(4, 3.35, z);
    roof.castShadow = roof.receiveShadow = true;
    scene.add(roof);
    box(9.05, 0.35, d + 0.05, C.teal, 4, 2.4, z);
    for (let i = 0; i < 3; i++) {
      const dx = 1 + i * 3, dz = z + d / 2 + 0.05;
      if (z === 5 && i === 0) {
        // pintu bay: panel menggulung ke atas (skala y dari atas) dan memperlihatkan lubang gelap
        box(1.5, 1.8, 0.06, "#14181F", dx, 0.9, dz - 0.02);
        const sh = new THREE.Group();
        sh.position.set(dx, 1.9, dz);
        box(1.6, 1.9, 0.1, C.amber, 0, -0.95, 0, sh);
        scene.add(sh);
        bayDoor = sh;
      } else box(1.6, 1.9, 0.1, C.amber, dx, 0.95, dz);
    }
  }

  // Containers (one instanced mesh for all of them)
  const spots = [];
  for (let x = -8.5; x <= -3; x += 2.8) for (let z = -15; z <= 2; z += 1.15) { const n = 1 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) spots.push([x, 0.5 + k * 1.02, z, 0]); }
  for (let z = -3; z <= 6; z += 1.15) spots.push([11, 0.5, z, 0], [13.6, 0.5, z, 0]);
  // rail terminal inside the road loop
  for (let x = 9; x <= 17.5; x += 2.8) for (let z = 20.6; z <= 23.6; z += 1.15) { const n = 1 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) spots.push([x, 0.5 + k * 1.02, z, 0]); }
  const shipSpots = [];
  for (let x = -2.9; x <= 2.2; x += 2.5) for (let z = -0.55; z <= 0.6; z += 1.1) for (let k = 0; k < 2; k++) shipSpots.push([x, 1.8 + k * 1.02, z, 0]);
  const palette = [C.navy, C.teal, C.amber, C.red, C.gray, C.navy2].map((c) => new THREE.Color(c));
  function containers(list, parent) {
    const im = new THREE.InstancedMesh(new THREE.BoxGeometry(2.4, 1, 1), new THREE.MeshLambertMaterial(), list.length);
    const o = new THREE.Object3D();
    list.forEach(([x, y, z, r], i) => {
      o.position.set(x, y, z); o.rotation.y = r; o.updateMatrix();
      im.setMatrixAt(i, o.matrix);
      im.setColorAt(i, palette[Math.floor(rnd() * palette.length)]);
    });
    im.castShadow = im.receiveShadow = true;
    parent.add(im);
    return im;
  }
  containers(spots, scene);

  // Gantry cranes on the quay
  const trolleys = [];
  for (const z of [-11, -3]) {
    const g = new THREE.Group();
    box(0.5, 7, 0.5, C.amber, -7, 3.5, -1.6, g); box(0.5, 7, 0.5, C.amber, -7, 3.5, 1.6, g);
    box(0.5, 7, 0.5, C.amber, -3.5, 3.5, -1.6, g); box(0.5, 7, 0.5, C.amber, -3.5, 3.5, 1.6, g);
    box(12, 0.6, 0.6, C.amber, -9, 7.2, -1.6, g); box(12, 0.6, 0.6, C.amber, -9, 7.2, 1.6, g);
    box(1.4, 0.9, 3.8, C.red, -10.5, 6.5, 0, g);
    const tr = new THREE.Group();
    box(1.2, 0.4, 3.8, C.red, 0, 0, 0, tr);
    const cable = box(0.06, 1, 0.06, "#222A36", 0, -1, 0, tr);
    const hang = box(2.4, 1, 1, [C.teal, C.amber][trolleys.length % 2], 0, -2, 0, tr);
    tr.position.set(-9, 7.2, 0);
    g.add(tr);
    trolleys.push({ tr, cable, hang });
    g.position.z = z;
    scene.add(g);
  }

  // Ships: one alongside the quay (bobs), one sailing past (loops)
  // roda: ban hitam + pelek abu dengan batang penanda putaran; diputar di update() sesuai kecepatan kendaraan
  const gWheel = new THREE.CylinderGeometry(1, 1, 1, 14).rotateX(Math.PI / 2), gHub = new THREE.CylinderGeometry(1, 1, 1, 10).rotateX(Math.PI / 2), gBar = new THREE.BoxGeometry(1, 0.16, 1.12);
  const wheels = [];
  const crateGeo = new THREE.BoxGeometry(0.5, 0.45, 0.5);
  function wheel(parent, x, y, z, r, w, sp) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    const t = new THREE.Mesh(gWheel, mat("#1B2028")); t.scale.set(r, r, w); t.castShadow = true; g.add(t);
    if (!small) {
      const h = new THREE.Mesh(gHub, mat("#C3CBD0")); h.scale.set(r * 0.55, r * 0.55, w * 1.08); g.add(h);
      const b = new THREE.Mesh(gBar, mat("#3A424D")); b.scale.set(r * 0.9, r, w); g.add(b);
    }
    parent.add(g);
    if (sp) { g.userData.sp = sp; wheels.push(g); }
    return g;
  }

  const smokers = [];
  // lambung runcing di haluan (diekstrusi dari denah atas), garis air merah, geladak, anjungan bertingkat, cerobong, tiang radar
  function hullGeo(len, wid, h, bow) {
    const sh = new THREE.Shape();
    sh.moveTo(len / 2, -wid / 2);
    sh.lineTo(-len / 2 + bow, -wid / 2);
    sh.quadraticCurveTo(-len / 2 + 0.5, -wid / 2 + 0.1, -len / 2, 0);
    sh.quadraticCurveTo(-len / 2 + 0.5, wid / 2 - 0.1, -len / 2 + bow, wid / 2);
    sh.lineTo(len / 2, wid / 2);
    sh.lineTo(len / 2, -wid / 2);
    return new THREE.ExtrudeGeometry(sh, { depth: h, bevelEnabled: false, curveSegments: 6 }).rotateX(-Math.PI / 2);
  }
  function ship(len, wake = true) {
    const g = new THREE.Group();
    const part2 = (geo, c, y) => { const m = new THREE.Mesh(geo, mat(c)); m.position.y = y; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
    part2(hullGeo(len, 3.5, 0.3, 3.2), C.red, -0.3);
    part2(hullGeo(len, 3.4, 1.3, 3.2), C.navy, 0);
    part2(hullGeo(len - 0.5, 3.0, 0.06, 3), "#9AA5AE", 1.3);
    const bx = len / 2 - 1.8;
    box(2.2, 2.2, 3, C.white, bx, 2.4, 0, g);
    box(2.24, 0.4, 3.04, "#7FA6B8", bx, 3.1, 0, g);
    box(1.4, 0.7, 2.4, C.white, bx, 4.0, 0, g);
    box(1.44, 0.3, 2.44, "#7FA6B8", bx, 4.05, 0, g);
    box(1.6, 0.1, 2.6, C.navy, bx, 4.45, 0, g);
    box(0.6, 1.0, 0.6, C.red, bx + 0.7, 5.0, 0, g);
    box(0.62, 0.2, 0.62, "#1B2028", bx + 0.7, 5.55, 0, g);
    const puffs = [0, 1, 2].map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.5, 8, 6), new THREE.MeshLambertMaterial({ color: "#F4F4F2", transparent: true, opacity: 0.5 })); g.add(m); return m; });
    smokers.push({ puffs, x: bx + 0.7 });
    box(0.08, 1.3, 0.08, "#3A424D", bx - 0.3, 5.1, 0, g);
    box(0.9, 0.06, 0.08, "#3A424D", bx - 0.3, 5.6, 0, g);
    box(0.12, 0.7, 0.12, C.amber, -len / 2 + 1.2, 1.7, 0, g); // tiang lampu haluan
    containers(shipSpots, g);
    if (wake) { box(9, 0.03, 2.4, "#EEF6F8", len / 2 + 5.2, -0.17, 0, g).castShadow = false; box(5, 0.03, 4.2, "#DCEBF0", len / 2 + 7.5, -0.18, 0, g).castShadow = false; }
    g.rotation.y = Math.PI / 2;
    scene.add(g);
    return g;
  }
  const docked = ship(15, false);
  docked.position.set(-13.2, -0.4, -6);
  const sailing = ship(13);
  sailing.position.set(-26, -0.4, 0);

  const sailing2 = ship(12);
  sailing2.rotation.y = -Math.PI / 2;
  sailing2.position.set(-36, -0.4, 0);
  // kapal tunda kecil di perairan dekat dermaga
  function tug(hull) {
    const g = new THREE.Group();
    box(2.6, 0.7, 1.3, hull, 0, 0.1, 0, g);
    box(2.65, 0.15, 1.35, C.red, 0, -0.2, 0, g);
    box(1.1, 0.9, 1, C.white, -0.4, 0.9, 0, g);
    box(1.14, 0.3, 1.04, "#7FA6B8", -0.4, 1.05, 0, g);
    box(0.7, 0.1, 1.2, C.navy, -0.4, 1.4, 0, g);
    box(0.3, 0.6, 0.3, C.amber, -0.4, 1.6, 0, g);
    scene.add(g);
    return g;
  }
  const tugs = [tug(C.teal), tug(C.navy2)];
  tugs[0].position.set(-19, -0.35, -10); tugs[1].position.set(-18, -0.35, 6); tugs[1].rotation.y = 2.4;

  // Rail with a container train
  flat(54, 3.4, "#B3AA9A", 17, 18, 0.09); // hamparan kerikil
  const ties = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.1, 2.3), mat("#6B4B36"), 68);
  const tm = new THREE.Object3D();
  for (let i = 0; i < 68; i++) { tm.position.set(-9.6 + i * 0.8, 0.15, 18); tm.updateMatrix(); ties.setMatrixAt(i, tm.matrix); }
  scene.add(ties);
  box(54, 0.2, 0.26, "#222A36", 17, 0.3, 17.35).castShadow = false;
  box(54, 0.2, 0.26, "#222A36", 17, 0.3, 18.65).castShadow = false;
  const train = new THREE.Group();
  const trainWheels = [];
  // roda kereta diputar mengikuti posisi: dist/r, arah dibalik untuk lokomotif yang menghadap barat
  const tw = (parent, x, y, z, r, w, flip) => { const g = wheel(parent, x, y, z, r, w, 0); g.userData.r = r; g.userData.flip = flip; trainWheels.push(g); };
  function loco(x, flip) {
    const lg = new THREE.Group();
    lg.position.x = x;
    lg.rotation.y = flip ? Math.PI : 0;
    box(3.6, 1.1, 1.5, C.teal, 0, 1.0, 0, lg);
    box(3.62, 0.16, 1.52, C.amber, 0, 0.72, 0, lg);
    box(1.4, 0.95, 1.5, "#2A3B55", 0.95, 2.0, 0, lg);
    box(0.05, 0.5, 1.25, "#9FC4D6", 1.66, 2.1, 0, lg);
    box(0.8, 0.35, 1.54, "#9FC4D6", 0.9, 2.1, 0, lg);
    box(1.5, 0.1, 1.55, C.white, 0.95, 2.52, 0, lg);
    box(1.0, 0.25, 0.8, "#3A424D", -0.9, 1.65, 0, lg);
    box(0.06, 0.18, 0.3, "#FFE9B0", 1.82, 1.2, 0.4, lg); box(0.06, 0.18, 0.3, "#FFE9B0", 1.82, 1.2, -0.4, lg);
    [-1.1, 0, 1.1].forEach((dx) => [0.65, -0.65].forEach((z) => tw(lg, dx, 0.32, z, 0.3, 0.14, flip)));
    train.add(lg);
  }
  loco(0, true); // ujung barat: menghadap barat
  const wagons = [];
  for (let i = 0; i < 4; i++) wagons.push([3.35 + i * 3.1, 0.95, 0, 0]);
  wagons.forEach((w) => {
    box(2.9, 0.2, 1.5, C.navy2, w[0], 0.5, 0, train);
    [1.0, -1.0].forEach((dx) => [0.65, -0.65].forEach((z) => tw(train, w[0] + dx, 0.32, z, 0.28, 0.13, false)));
  });
  for (let i = 0; i < 5; i++) box(0.34, 0.12, 0.12, "#222A36", 1.85 + i * 3.1, 0.5, 0, train); // kopling
  containers(wagons.slice(0, 3), train); // gerbong ke-4 terbuka: berisi dus yang dipindahkan kru
  const wagonCrates = [];
  for (let k = 0; k < 6; k++) { const m = new THREE.Mesh(crateGeo, mat("#C49A63")); m.position.set(12.65 + ((k % 3) - 1) * 0.9, 0.82 + Math.floor(k / 3) * 0.46, 0.5); m.castShadow = true; train.add(m); wagonCrates.push(m); }
  loco(16.0, false); // ujung timur: menghadap timur

  // gunung dengan terowongan di timur: kereta keluar dan masuk dari dalamnya, jadi tidak muncul dari laut
  const rockMat = (c) => c;
  box(23, 4.6, 10, rockMat("#8E9186"), 51.5, 1.7, 18);
  box(21, 0.3, 8.2, "#7FA878", 51.5, 4.15, 18);
  box(17, 1.4, 7.4, "#9AA08F", 53.5, 4.9, 18);
  box(15, 0.3, 6.2, "#8FB584", 53.5, 5.7, 18);
  box(10, 1.2, 5.4, "#A9AF9A", 55.5, 6.45, 18);
  box(0.5, 3.6, 3.6, "#6F7469", 39.85, 1.2, 18); // bingkai portal
  box(0.55, 3.0, 2.3, "#14181F", 39.75, 1.5, 18); // mulut terowongan
  box(0.3, 0.3, 3.9, "#B7BEC5", 39.55, 3.1, 18); // ambang
  // penyangga ujung rel di barat
  box(0.4, 0.8, 2.2, C.red, -10.3, 0.5, 18);
  box(0.5, 0.2, 2.4, "#222A36", -10.3, 0.15, 18);

  // palang perlintasan di dua jalan yang memotong rel: turun, lampu merah berkedip, truk berhenti menunggu
  const crossings = [5, 30].map((cx) => {
    const arms = [], lamps = [];
    [15.7, 20.3].forEach((z) => {
      box(0.2, 0.9, 0.2, "#3A424D", cx - 1.7, 0.45, z);
      const arm = new THREE.Group();
      arm.position.set(cx - 1.7, 0.95, z);
      for (let i = 0; i < 4; i++) box(0.8, 0.1, 0.1, i % 2 ? C.white : C.red, 0.4 + i * 0.8, 0, 0, arm);
      scene.add(arm);
      arms.push(arm);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.13, 8, 6), new THREE.MeshBasicMaterial({ color: "#3a1512" }));
      lamp.position.set(cx - 1.7, 1.2, z);
      scene.add(lamp);
      lamps.push(lamp);
    });
    return { cx, arms, lamps, amt: 0 };
  });
  train.position.z = 18;
  scene.add(train);

  // Trucks on the road loop, vans in town
  function truck(trailer, moving = true) {
    const g = new THREE.Group();
    const sp = moving ? 7 : 0;
    box(4.4, 0.18, 0.9, "#2A313C", -0.1, 0.46, 0, g);
    box(1.2, 1.05, 1.1, C.amber, 1.6, 1.0, 0, g); // kabin
    box(0.05, 0.5, 0.95, "#9FC4D6", 2.22, 1.2, 0, g); // kaca depan
    box(0.7, 0.36, 1.12, "#9FC4D6", 1.6, 1.25, 0, g); // kaca samping
    box(1.24, 0.1, 1.14, "#8C6228", 1.6, 1.58, 0, g); // atap
    box(0.1, 0.22, 1.05, "#2A313C", 2.24, 0.62, 0, g); // bumper
    box(0.06, 0.14, 0.22, "#FFE9B0", 2.25, 0.85, 0.38, g); box(0.06, 0.14, 0.22, "#FFE9B0", 2.25, 0.85, -0.38, g);
    box(3.0, 1.35, 1.15, trailer, -0.65, 1.2, 0, g); // bak
    box(3.02, 0.18, 1.17, C.amber, -0.65, 0.88, 0, g); // garis aksen
    box(0.04, 1.2, 1.0, "#B7BEC5", -2.17, 1.2, 0, g); // pintu belakang
    // palang samping (sisi menghadap gudang) membuka seperti kanopi; di baliknya panel gelap dan dus tampak saat dibongkar/dimuat
    box(2.9, 1.15, 0.02, "#2B2F36", -0.65, 1.2, -0.6, g);
    const flap = new THREE.Group();
    flap.position.set(-0.65, 1.82, -0.64);
    box(2.9, 1.15, 0.05, trailer, 0, -0.58, 0, flap);
    g.add(flap);
    g.userData.flap = flap; g.userData.fl = 0;
    g.userData.crates = [];
    for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const m = new THREE.Mesh(crateGeo, mat("#C49A63")); m.position.set(-1.7 + c * 0.7, 0.9 + r * 0.46, -0.86); m.castShadow = true; m.visible = false; g.add(m); g.userData.crates.push(m); }
    g.userData.ws = [];
    [1.75, 0.8, -1.3, -2.0].forEach((x) => [0.56, -0.56].forEach((z) => g.userData.ws.push(wheel(g, x, 0.3, z, 0.3, 0.22, 0))));
    scene.add(g);
    return g;
  }
  const trucks = [C.white, C.teal, C.navy, C.white].map((c) => truck(c));
  // truck yard + depot office inside the loop
  flat(10, 5, "#CDD4DC", 23.5, 13.5, 0.015);
  [20, 22.4, 24.8, 27.2].forEach((x, k) => { const t = truck(k % 2 ? C.teal : C.white, false); t.position.set(x, 0, 13.5); t.rotation.y = Math.PI / 2; });
  box(4.5, 2.4, 3.2, C.white, 11.5, 1.2, 13.5);
  box(4.7, 0.25, 3.4, C.teal, 11.5, 2.5, 13.5);
  box(4.55, 0.6, 0.1, C.navy, 11.5, 1.8, 15.15);
  box(4.0, 0.5, 0.06, "#9FC4D6", 11.5, 1.55, 15.12); box(0.06, 0.5, 2.6, "#9FC4D6", 13.77, 1.55, 13.5);
  const vans = [C.teal, C.amber, C.teal].map((c) => {
    const g = new THREE.Group();
    box(1.2, 0.85, 0.85, c, -0.1, 0.72, 0, g);
    box(0.5, 0.6, 0.85, c, 0.75, 0.6, 0, g);
    box(0.04, 0.4, 0.75, "#9FC4D6", 1.01, 0.72, 0, g);
    box(0.5, 0.26, 0.87, "#9FC4D6", 0.75, 0.78, 0, g);
    box(1.22, 0.14, 0.87, C.white, -0.1, 0.78, 0, g);
    box(0.05, 0.12, 0.2, "#FFE9B0", 1.02, 0.48, 0.28, g); box(0.05, 0.12, 0.2, "#FFE9B0", 1.02, 0.48, -0.28, g);
    [0.65, -0.6].forEach((x) => [0.4, -0.4].forEach((z) => wheel(g, x, 0.22, z, 0.22, 0.16, 9)));
    scene.add(g);
    return g;
  });
  const loop = (x0, z0, x1, z1) => {
    const p = new THREE.CurvePath();
    [[x0, z0, x0, z1], [x0, z1, x1, z1], [x1, z1, x1, z0], [x1, z0, x0, z0]].forEach(([a, b, c, d]) => p.add(new THREE.LineCurve3(new THREE.Vector3(a, 0, b), new THREE.Vector3(c, 0, d))));
    return p;
  };
  const roadLoop = loop(5, 9, 30, 26), townLoop = loop(21.3, -9.5, 37.7, 7);
  // rute truk antar barang: jalan raya, lajur bongkar-muat di depan gudang (bay di x=4), lalu kembali bergabung ke jalan
  const poly = (pts) => { const pa = new THREE.CurvePath(); pts.forEach((a, i) => { const b = pts[(i + 1) % pts.length]; pa.add(new THREE.LineCurve3(new THREE.Vector3(a[0], 0, a[1]), new THREE.Vector3(b[0], 0, b[1]))); }); return pa; };
  const truckLoop = poly([[5, 26], [30, 26], [30, 9], [-3, 9], [-3, 13], [5, 13]]);
  const dock = { by: null, t: 0, unload: false };
  let doorOpen = 0;
  const place = (obj, path, t, side) => {
    const p = path.getPointAt(t % 1), d = path.getTangentAt(t % 1);
    obj.position.set(p.x + d.z * side, 0, p.z - d.x * side);
    obj.rotation.y = Math.atan2(-d.z, d.x);
  };

  // Town blocks + trees
  const pastel = ["#D8D2C4", "#C6CFD6", "#D4BFB0", "#BFCFC6", "#CBC8D3", C.white];
  // tekstur satu lantai: dinding putih + tiga jendela kaca biru; diulang per lantai dan diwarnai pastel per gedung
  const winTex = canvasTexture(THREE, 192, 128, (g, w, h) => {
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#5E7A90";
    for (let i = 0; i < 3; i++) g.fillRect(16 + i * 60, 28, 40, 64);
    g.fillStyle = "rgba(255,255,255,.35)";
    for (let i = 0; i < 3; i++) g.fillRect(16 + i * 60, 28, 40, 14);
    g.fillStyle = "rgba(0,0,0,.1)"; g.fillRect(0, h - 6, w, 6);
  });
  winTex.wrapS = winTex.wrapT = THREE.RepeatWrapping;
  const roofUnits = [], antennas = [];
  for (const bx of [25.4, 33.6]) for (const bz of [-5.25, 3]) {
    box(6, 0.16, bz < 0 ? 6.3 : 5.8, "#E6DFD0", bx, 0.08, bz).castShadow = false; // trotoar: khusus pejalan
    for (let i = 0; i < 4; i++) {
      const h = 1.2 + rnd() * 4;
      const x = bx + ((i % 2) - 0.5) * 2, z = bz + (Math.floor(i / 2) - 0.5) * 2;
      const col = pastel[Math.floor(rnd() * pastel.length)];
      const side = new THREE.MeshLambertMaterial({ color: col, map: winTex.clone() });
      side.map.needsUpdate = true;
      side.map.repeat.set(1, Math.max(1, Math.round(h / 1.1)));
      const plain = mat(col);
      const b = new THREE.Mesh(new THREE.BoxGeometry(1.6, h, 1.6), [side, side, plain, plain, side, side]);
      b.position.set(x, h / 2, z);
      b.castShadow = b.receiveShadow = true;
      scene.add(b);
      box(1.7, 0.2, 1.7, i % 3 ? C.navy2 : C.teal, x, h + 0.1, z);
      roofUnits.push([x + (wr() - 0.5) * 0.6, h + 0.35, z + (wr() - 0.5) * 0.6]);
      if (i % 2) antennas.push([x + (wr() - 0.5) * 0.5, h + 0.65, z + (wr() - 0.5) * 0.5]);
    }
  }
  const units = new THREE.InstancedMesh(new THREE.BoxGeometry(0.5, 0.3, 0.4), mat("#8E98A3"), roofUnits.length);
  const masts = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.9, 0.06), mat("#3A424D"), antennas.length);
  const uo = new THREE.Object3D();
  roofUnits.forEach(([x, y, z], i) => { uo.position.set(x, y, z); uo.updateMatrix(); units.setMatrixAt(i, uo.matrix); });
  antennas.forEach(([x, y, z], i) => { uo.position.set(x, y, z); uo.updateMatrix(); masts.setMatrixAt(i, uo.matrix); });
  units.castShadow = masts.castShadow = true;
  scene.add(units, masts);
  const treeSpots = [];
  for (let i = 0; i < 60; i++) {
    const [x, z] = [[11 + rnd() * 9, -21 + rnd() * 10], [32 + rnd() * 12, 12 + rnd() * 6], [-8 + rnd() * 9, 25 + rnd() * 6], [40 + rnd() * 4, -12 + rnd() * 20]][i % 4];
    treeSpots.push([x, z, 0.7 + rnd() * 0.6]);
  }
  treeSpots.forEach((t) => { if (t[0] > 37.5 && t[1] > 12.5 && t[1] < 23.5) t[1] = 11.9 + (t[0] % 1); });
  const pines = treeSpots.filter((_, i) => i % 3 !== 2), rounds = treeSpots.filter((_, i) => i % 3 === 2);
  const flatMat = () => new THREE.MeshLambertMaterial({ flatShading: true });
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.11, 0.17, 1, 6), mat("#6B4B36"), treeSpots.length);
  const lowCone = new THREE.InstancedMesh(new THREE.ConeGeometry(0.95, 1.5, 8), flatMat(), pines.length);
  const upCone = new THREE.InstancedMesh(new THREE.ConeGeometry(0.7, 1.3, 8), flatMat(), pines.length);
  const blobs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.9, 1), flatMat(), rounds.length);
  const greens = ["#3F7E55", "#4F8F5E", "#5E9E6B", "#6FAE74"].map((c) => new THREE.Color(c));
  const roundGreens = ["#7DB878", "#6BA865", "#8CBF7E"].map((c) => new THREE.Color(c));
  const o = new THREE.Object3D();
  treeSpots.forEach(([x, z, s], i) => { o.position.set(x, 0.55 * s, z); o.scale.set(s, 1.1 * s, s); o.updateMatrix(); trunks.setMatrixAt(i, o.matrix); });
  pines.forEach(([x, z, s], i) => {
    const c = greens[i % 4];
    o.position.set(x, 1.15 * s, z); o.scale.setScalar(s); o.updateMatrix(); lowCone.setMatrixAt(i, o.matrix); lowCone.setColorAt(i, c);
    o.position.set(x, 2.0 * s, z); o.updateMatrix(); upCone.setMatrixAt(i, o.matrix); upCone.setColorAt(i, c);
  });
  rounds.forEach(([x, z, s], i) => { o.position.set(x, 1.45 * s, z); o.scale.set(s * 1.1, s * 0.95, s * 1.1); o.updateMatrix(); blobs.setMatrixAt(i, o.matrix); blobs.setColorAt(i, roundGreens[i % 3]); });
  [trunks, lowCone, upCone, blobs].forEach((m) => { m.castShadow = true; scene.add(m); });

  // penyeberangan zebra di jalan z=-1 pada tiap jalur pejalan
  [23, 27.8, 31.2, 36].forEach((cx) => { for (let i = 0; i < 5; i++) flat(0.22, 2, "#F2EBDD", cx - 0.52 + i * 0.26, -1, 0.065); });
  // jalur pekerja di area gudang dan terminal (lantai krem, garis tepi kuning), terpisah dari jalan truk
  const walkway = (w, d, x, z) => { flat(w, d, "#E6DFD0", x, z, 0.06); flat(w, 0.12, "#D6A93A", x, z - d / 2 + 0.06, 0.07); flat(w, 0.12, "#D6A93A", x, z + d / 2 - 0.06, 0.07); };
  walkway(9.4, 1.5, 4, 1.62);
  flat(1.3, 11.4, "#E6DFD0", 9.25, 1.7, 0.06);
  walkway(21, 1.1, 19.5, 15.8);

  // Tokoh kecil (gaya boneka): pekerja gudang, buruh dermaga, sopir, petugas terminal, kurir, dan warga kota
  const skins = ["#E0B48F", "#C58E65", "#A8714A", "#F0CBA8"];
  const gLeg = new THREE.BoxGeometry(0.24, 0.5, 0.24), gTorso = new THREE.BoxGeometry(0.46, 0.58, 0.3), gArm = new THREE.BoxGeometry(0.14, 0.5, 0.14);
  const gHead = new THREE.SphereGeometry(0.2, 12, 10), gHelm = new THREE.SphereGeometry(0.225, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  const part = (g, c, x, y, z, parent) => { const m = new THREE.Mesh(g, mat(c)); m.position.set(x, y, z); m.castShadow = true; parent.add(m); return m; };
  const gBoot = new THREE.BoxGeometry(0.28, 0.1, 0.36), gStripe = new THREE.BoxGeometry(0.5, 0.08, 0.34), gHand = new THREE.SphereGeometry(0.085, 8, 6), gHair = new THREE.SphereGeometry(0.215, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
  function person(shirt, x, z, ry = 0, opts = {}) {
    const g = new THREE.Group();
    const legs = [part(gLeg, "#27303F", -0.12, 0.25, 0, g), part(gLeg, "#27303F", 0.12, 0.25, 0, g)];
    part(gBoot, "#1B2028", -0.12, 0.05, 0.04, g); part(gBoot, "#1B2028", 0.12, 0.05, 0.04, g);
    part(gTorso, shirt, 0, 0.79, 0, g);
    if (opts.vest !== false) part(gStripe, "#F4F1EA", 0, 0.86, 0, g);
    const skin = skins[Math.floor(rnd() * skins.length)];
    const arms = [part(gArm, shirt, -0.3, 0.8, 0, g), part(gArm, shirt, 0.3, 0.8, 0, g)];
    arms.forEach((a) => part(gHand, skin, 0, -0.29, 0, a)); // tangan menempel di ujung lengan
    part(gHead, skin, 0, 1.3, 0, g);
    if (opts.helmet) part(gHelm, opts.helmet, 0, 1.33, 0, g); else part(gHair, "#2A211C", 0, 1.32, -0.01, g);
    const carry = opts.box ? part(new THREE.BoxGeometry(0.5, 0.4, 0.4), "#B8946A", 0, 0.9, 0.38, g) : null;
    g.position.set(x, 0, z);
    g.rotation.y = ry;
    g.scale.setScalar(opts.scale || 1.9);
    g.userData = { legs, arms, ph: rnd() * 6.28, y0: opts.y || 0, carry };
    scene.add(g);
    return g;
  }
  const hv = "#D4742C", hi = "#F4F1EA";
  const idle = [
    // jalur pekerja antar-gudang
    person(hv, 1.4, 1.62, 1.57, { helmet: hi }), person(C.teal, 4.2, 1.62, -1.57, { helmet: "#D4742C", box: true }), person(hv, 7, 1.62, 1.57, { helmet: hi }),
    // jalur pekerja di halaman samping gudang
    person(hv, 9.25, -1.4, 3.14, { helmet: hi }), person(C.teal, 9.25, 2.4, 0, { helmet: "#D4742C", box: true }), person(hv, 9.25, 5.6, 3.14, { helmet: hi }),
    // dermaga
    person(hv, -10.5, -9.5, 0, { helmet: hi, y: 0.2 }), person(C.white, -10.5, -4.8, 3.14, { helmet: "#D4742C", y: 0.2 }), person(hv, -10.5, -1.2, 0, { helmet: hi, y: 0.2 }),
    // terminal kereta dan truk
    person(hv, 11.5, 15.8, 3.14, { helmet: hi }), person(C.teal, 16.5, 15.8, 0, { helmet: "#D4742C" }), person(hv, 22, 15.8, 3.14, { helmet: hi }), person(C.white, 28, 15.8, 0, { helmet: "#D4742C" }),
    // depot
    person(C.teal, 14.6, 11.2, 0.2), person(C.white, 8.4, 15.9, 2.2),
  ];
  // pekerja area kerja tidak berdiam: patroli bolak-balik di jalur kerja, atau memberi aba-aba kepada operator derek
  const pat = (g, ax, c, r, sp) => { g.userData.pat = { ax, c, r, sp }; };
  pat(idle[0], "x", 2.4, 1.5, 0.5); pat(idle[1], "x", 4.4, 1.2, 0.42); pat(idle[2], "x", 6.6, 1.2, 0.46);
  pat(idle[3], "z", -0.8, 1.6, 0.4); pat(idle[4], "z", 2.4, 1.4, 0.5); pat(idle[5], "z", 5.6, 1.2, 0.45);
  idle[6].userData.wave = true; pat(idle[7], "z", -4.8, 1.8, 0.4); idle[8].userData.wave = true;
  pat(idle[9], "x", 11.5, 2.5, 0.4); pat(idle[10], "x", 16.5, 2.5, 0.45); pat(idle[11], "x", 22, 2.5, 0.38); pat(idle[12], "x", 27.5, 1.2, 0.5);
  idle[13].userData.wave = true;
  // warga dan kurir berjalan hanya di trotoar (jalur pejalan), menyeberang di zebra
  const LANES = [23, 27.8, 31.2, 36];
  const shirts = ["#3E7F7C", "#B9483A", "#E9ECEE", "#7C4F7A", "#D6A93A", "#2B3A55", "#3E7F7C", "#B9483A"];
  const walkers = shirts.map((c, k) => {
    const courier = k % 3 === 0;
    const w = person(c, LANES[k % 4], 0, 0, { scale: 1.45, vest: false, helmet: courier ? C.teal : null, box: courier });
    w.userData.dir = k < 4 ? 1 : -1; w.userData.t = k * 1.7; w.userData.lane = LANES[k % 4];
    return w;
  });
  if (small) [...idle, ...walkers].forEach((g, k) => { if (k % 2) g.visible = false; });

  // marka bay bongkar-muat di depan pintu gudang
  flat(0.12, 3, "#F2EBDD", 1.7, 9.5, 0.065); flat(0.12, 3, "#F2EBDD", 6.4, 9.5, 0.065);
  // dua petugas keluar-masuk lewat pintu gulung gudang (tersembunyi saat berada di dalam)
  const loaders = [0, 1].map((w) => { const g = person(w ? "#3E7F7C" : "#D4742C", 1.0, 7.5, Math.PI, { helmet: w ? "#D4742C" : "#F4F1EA", box: true, scale: 1.6 }); g.rotation.order = "YXZ"; g.userData.carry.visible = false; g.visible = false; return g; });

  // sisi selatan rel: jalur kerja + palet tujuan/asal dus dari gerbong terbuka, dengan dua petugas kereta
  walkway(10, 1.1, 23.5, 20.3);
  box(1.9, 0.15, 0.8, "#8C6A45", 24.4, 0.08, 21.0).castShadow = false;
  const tpalCrates = [];
  for (let r = 0; r < 2; r++) for (let c = 0; c < 3; c++) { const m = new THREE.Mesh(crateGeo, mat("#C49A63")); m.position.set(24.4 + (c - 1) * 0.6, 0.38 + r * 0.46, 21.0); m.castShadow = true; scene.add(m); tpalCrates.push(m); }
  const trainCrew = [0, 1].map((w) => { const g = person(w ? "#4F6D8A" : "#D4742C", w ? 25.8 : 23.0, 20.35, Math.PI / 2, { helmet: w ? "#D4742C" : "#F4F1EA", box: true, scale: 1.6 }); g.rotation.order = "YXZ"; g.userData.carry.visible = false; return g; });

  // mobil warga di jalur kota, melaju berlawanan arah dengan van
  function car(c) {
    const g = new THREE.Group();
    box(1.5, 0.45, 0.8, c, 0, 0.42, 0, g);
    box(0.8, 0.4, 0.76, c, -0.1, 0.84, 0, g);
    box(0.82, 0.22, 0.78, "#9FC4D6", -0.1, 0.86, 0, g);
    box(0.05, 0.1, 0.18, "#FFE9B0", 0.76, 0.5, 0.26, g); box(0.05, 0.1, 0.18, "#FFE9B0", 0.76, 0.5, -0.26, g);
    [0.5, -0.5].forEach((x) => [0.4, -0.4].forEach((z) => wheel(g, x, 0.17, z, 0.17, 0.14, -10)));
    scene.add(g);
    return g;
  }
  const cars = ["#B9483A", "#2B3A55", "#D6A93A", "#E9ECEE"].map(car);

  // lampu jalan di tepi trotoar
  const lampSpots = [];
  for (const bx of [25.4, 33.6]) for (const bz of [-5.25, 3]) for (const dx of [-2.85, 2.85]) for (const dz of [-1.5, 1.5]) lampSpots.push([bx + dx, bz + dz]);
  const poles = new THREE.InstancedMesh(new THREE.BoxGeometry(0.07, 1.7, 0.07), mat("#3A424D"), lampSpots.length);
  const heads = new THREE.InstancedMesh(new THREE.SphereGeometry(0.15, 8, 6), new THREE.MeshBasicMaterial({ color: "#FFE9B0" }), lampSpots.length);
  const lo = new THREE.Object3D();
  lampSpots.forEach(([x, z], i) => { lo.position.set(x, 1.0, z); lo.updateMatrix(); poles.setMatrixAt(i, lo.matrix); lo.position.set(x, 1.9, z); lo.updateMatrix(); heads.setMatrixAt(i, lo.matrix); });
  scene.add(poles, heads);

  // camar berputar di atas pelabuhan dan laut
  const gullWing = new THREE.BoxGeometry(0.5, 0.03, 0.2), gullBody = new THREE.BoxGeometry(0.34, 0.12, 0.14);
  const gulls = [[-20, -6, 9, 7], [-30, 10, 11, 8.5], [-9, -14, 7, 6.5], [-24, 24, 8, 7.5], [5, -22, 10, 8], [-14, 6, 6, 9]].slice(0, small ? 4 : 6).map(([cx, cz, r, y], k) => {
    const g = new THREE.Group();
    const wl = new THREE.Mesh(gullWing, mat("#F4F1EA")), wr2 = new THREE.Mesh(gullWing, mat("#F4F1EA"));
    wl.position.z = 0.25; wr2.position.z = -0.25;
    g.add(new THREE.Mesh(gullBody, mat("#F4F1EA")), wl, wr2);
    g.scale.setScalar(1.6);
    g.userData = { cx, cz, r, y, k, wl, wr: wr2 };
    scene.add(g);
    return g;
  });

  // sorot mercusuar berputar
  const beam = new THREE.Group();
  [1, -1].forEach((d) => { const b = new THREE.Mesh(new THREE.BoxGeometry(8, 0.1, 0.9), new THREE.MeshBasicMaterial({ color: "#FFE9B0", transparent: true, opacity: 0.2, depthWrite: false })); b.position.x = 4.3 * d; beam.add(b); });
  beam.position.set(0.4, 4.85, 0);
  isl.add(beam);

  // Glowing delivery route: warehouse -> port -> rail terminal -> city, drawn progressively with the scroll
  const route = new THREE.CatmullRomCurve3([[4, 3.5, 1], [-2, 7, -4], [-9, 4.5, -7], [2, 7.5, 8], [15, 4, 19], [24, 7, 9], [30, 4.5, -2]].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(route, 360, 0.13, 8, false), new THREE.MeshBasicMaterial({ color: "#5E3C0C" })); // garis rute tegas seperti peta, tanpa cahaya
  const tubeCount = tube.geometry.index.count;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), new THREE.MeshBasicMaterial({ color: "#FFE2A8" }));
  const pins = [0, 0.33, 0.66, 1].map((u) => {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 24), new THREE.MeshBasicMaterial({ color: C.amber, transparent: true }));
    pin.position.copy(route.getPointAt(u));
    pin.userData.u = u;
    scene.add(pin);
    return pin;
  });
  scene.add(tube, head);

  // A few soft clouds drifting over the town (no shadows, so they never darken the focus)
  const cloudMat = new THREE.MeshLambertMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.88 });
  const clouds = [[-6, 14, -36], [14, 15, -42], [32, 14, 52], [2, 16, 58], [40, 15, -32]].map(([x, y, z], k) => {
    const g = new THREE.Group();
    [[0, 0, 0, 1.6], [1.6, -0.3, 0.4, 1.2], [-1.5, -0.4, -0.2, 1.1], [0.4, 0.5, -0.6, 1.1]].forEach(([a, b, c, r]) => {
      const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 10), cloudMat);
      m.position.set(a, b, c);
      m.scale.y = 0.6;
      g.add(m);
    });
    g.position.set(x, y, z);
    g.userData = { x, speed: 0.4 + k * 0.08 };
    scene.add(g);
    return g;
  });

  // Orthographic "isometric" camera
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  const target = new THREE.Vector3(), dir = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  let aspect = 1;

  let lastT = null;
  return {
    scene, camera, toneMapping: THREE.NoToneMapping,
    resize(w, h) { aspect = w / h; },
    update(p, dtEngine, time) {
      // dt dari jam nyata (dt mesin dibatasi 0,05 sehingga gerakan jadi lambat saat frame rate turun)
      const dt = lastT === null ? 0 : Math.min(0.25, Math.max(0, time - lastT));
      lastT = time;
      const s = p * (PANELS - 1);
      const i = Math.min(PANELS - 2, Math.floor(s)), t = seg(s, i, i + 1);
      const a = KEYS[i], b = KEYS[i + 1];
      const portrait = aspect < 0.9;
      let size = mix(a.size, b.size, t);
      // a slight zoom-out half way between stops reads as "flying" between areas
      size *= 1 + Math.sin(t * Math.PI) * 0.35;
      if (portrait) size *= 1.35;
      const turn = mix(a.turn, b.turn, t) + Math.PI / 4 + ctx.pointer.x * 0.06;
      dir.set(Math.sin(turn), 1.05 - ctx.pointer.y * 0.05, Math.cos(turn)).normalize();
      target.set(mix(a.x, b.x, t), 0, mix(a.z, b.z, t));
      // keep the focus clear of the text: right of it on desktop, above it on phones
      right.set(Math.cos(turn), 0, -Math.sin(turn));
      up.set(-Math.sin(turn), 0, -Math.cos(turn));
      if (portrait) target.addScaledVector(up, -size * 0.55);
      else target.addScaledVector(right, -size * aspect * 0.32);
      camera.position.copy(target).addScaledVector(dir, 120);
      camera.lookAt(target);
      camera.left = -size * aspect; camera.right = size * aspect; camera.top = size; camera.bottom = -size;
      camera.updateProjectionMatrix();

      // route grows with the chapter; the head pulses
      const k = Math.max(0.001, seg(s, 0.25, 4.6));
      tube.geometry.setDrawRange(0, Math.floor((tubeCount * k) / 3) * 3);
      head.position.copy(route.getPointAt(k));
      head.scale.setScalar(1 + Math.sin(time * 5) * 0.15);
      head.visible = k > 0.002;
      pins.forEach((pin) => { const on = k >= pin.userData.u - 0.01; pin.material.opacity = on ? 1 : 0.25; pin.scale.setScalar(on ? 1 + Math.sin(time * 3 + pin.userData.u * 6) * 0.08 : 0.8); });
      clouds.forEach((c) => { c.position.x = ((c.userData.x + time * c.userData.speed + 30) % 80) - 30; });

      // tokoh: pekerja bergoyang pelan, warga berjalan di trotoar, kurir mengikuti jalur kota
      const sway = (g, sp, amp) => { const u = g.userData; const w = Math.sin(time * sp + u.ph) * amp; u.legs[0].rotation.x = w; u.legs[1].rotation.x = -w; u.arms[0].rotation.x = -w; u.arms[1].rotation.x = w; };
      idle.forEach((g) => {
        const u = g.userData, pt = u.pat;
        if (pt) {
          const v = Math.sin(time * pt.sp + u.ph), dv = Math.cos(time * pt.sp + u.ph), pos = pt.c + pt.r * v;
          if (pt.ax === "x") { g.position.x = pos; g.rotation.y = dv >= 0 ? Math.PI / 2 : -Math.PI / 2; } else { g.position.z = pos; g.rotation.y = dv >= 0 ? 0 : Math.PI; }
          g.position.y = u.y0;
          sway(g, 7, 0.5);
        } else if (u.wave) {
          g.position.y = u.y0;
          u.arms[1].rotation.x = -2.5 + Math.sin(time * 5 + u.ph) * 0.4;
        } else {
          g.position.y = u.y0 + Math.abs(Math.sin(time * 1.6 + u.ph)) * 0.04;
          u.arms[1].rotation.x = Math.sin(time * 1.6 + u.ph) * 0.5;
        }
      });
      walkers.forEach((g) => {
        const u = g.userData, L = 13.8, ph = (time * 0.5 + u.t) % L;
        const z = u.dir > 0 ? -8.1 + ph : 5.7 - ph;
        g.position.z = z; g.position.x = u.lane; g.rotation.y = u.dir > 0 ? 0 : Math.PI;
        g.position.y = z > -2.1 && z < 0.1 ? 0.06 : 0.16; // turun ke jalan hanya di zebra
        sway(g, 7, 0.55);
      });
      // derek: troli bergeser, kontainer naik-turun
      trolleys.forEach((t, k2) => {
        t.tr.position.x = -9 + Math.sin(time * 0.35 + k2 * 1.7) * 2.8;
        const L = 1.6 + (Math.sin(time * 0.6 + k2 * 2.3) + 1) * 1.5;
        t.cable.scale.y = L; t.cable.position.y = -L / 2 - 0.2;
        t.hang.position.y = -L - 0.7;
      });
      // asap cerobong
      smokers.forEach((sm, k2) => sm.puffs.forEach((pf, i) => {
        const k = (time * 0.3 + i / 3 + k2 * 0.17) % 1;
        pf.position.set(sm.x - k * 0.2, 6.0 + k * 3.2, k * 1.2);
        pf.scale.setScalar(0.35 + k * 1.1);
        pf.material.opacity = (1 - k) * 0.5;
      }));
      // camar
      gulls.forEach((g) => {
        const u = g.userData, a = time * (0.28 + u.k * 0.03) + u.k * 1.9;
        g.position.set(u.cx + Math.cos(a) * u.r, u.y + Math.sin(time * 0.7 + u.k) * 0.4, u.cz + Math.sin(a) * u.r * 0.8);
        g.rotation.y = -a - Math.PI / 2 + Math.PI;
        const f = Math.sin(time * 7 + u.k * 2) * 0.55;
        u.wl.rotation.x = f; u.wr.rotation.x = -f;
      });
      // sorot mercusuar
      beam.rotation.y = time * 0.9;
      // mobil warga (arah berlawanan dengan van)
      cars.forEach((cr, k2) => { place(cr, townLoop, 1 - ((time * 0.028 + k2 / cars.length) % 1), -0.5); cr.rotation.y += Math.PI; });
      wheels.forEach((w) => { w.rotation.z = -time * w.userData.sp; });
      buoys.forEach((b, k2) => { b.position.y = -0.55 + Math.sin(time * 1.3 + k2 * 2) * 0.07; b.rotation.z = Math.sin(time * 1.1 + k2) * 0.06; });
      // traffic
      waves.position.x = Math.sin(time * 0.4) * 1.2; waves.position.z = Math.cos(time * 0.3) * 0.7;
      docked.position.y = -0.4 + Math.sin(time * 1.2) * 0.08;
      sailing.position.z = ((time * 1.6) % 70) - 35;
      sailing.position.y = -0.4 + Math.sin(time * 1.1 + 1) * 0.08;
      sailing2.position.z = 35 - ((time * 1.2) % 70);
      sailing2.position.y = -0.4 + Math.sin(time * 1.3 + 2) * 0.08;
      tugs[0].position.z = -10 + Math.sin(time * 0.35) * 4; tugs[0].rotation.y = Math.cos(time * 0.35) > 0 ? 0 : Math.PI;
      tugs[1].position.y = -0.35 + Math.sin(time * 1.5 + 1) * 0.06; tugs[1].position.x = -18 + Math.sin(time * 0.3) * 1.5;
      tugs[0].position.y = -0.35 + Math.sin(time * 1.4) * 0.06;
      // jadwal kereta: keluar dari terowongan timur, berhenti di terminal, mundur kembali (lokomotif di kedua ujung)
      // jadwal kereta (64 dtk): palang menutup 6 dtk sebelum kereta keluar dari terowongan, tiba, berhenti 30 dtk untuk bongkar/muat, palang menutup lagi, lalu berangkat
      const TT = 64, tph = time % TT, warn = tph < 6;
      let tx = 42, moving = false;
      if (tph >= 6 && tph < 18) { tx = 42 - 33.3 * (1 - Math.pow(1 - (tph - 6) / 12, 3)); moving = true; }
      else if (tph >= 18 && tph < 48) tx = 8.7;
      else if (tph >= 48 && tph < 60) { tx = 8.7 + 33.3 * Math.pow((tph - 48) / 12, 3); moving = true; }
      train.position.x = tx;
      train.visible = tph < 60;
      trainWheels.forEach((w) => { w.rotation.z = (w.userData.flip ? 1 : -1) * tx / w.userData.r; });
      crossings.forEach((c) => {
        const closed = warn || (moving && tx - 2 < c.cx + 12 && tx + 18 > c.cx - 12) || (c.cx === 30 && tph >= 43 && tph < 48);
        c.amt += ((closed ? 1 : 0) - c.amt) * Math.min(1, dt * 3);
        c.arms.forEach((a) => { a.rotation.z = (1 - c.amt) * 1.3; });
        const on = c.amt > 0.1 && Math.floor(time * 3) % 2 === 0;
        c.lamps.forEach((l, i) => l.material.color.set(c.amt > 0.1 && (Math.floor(time * 3) + i) % 2 === 0 ? "#FF5A4D" : "#3a1512"));
      });
      // truk antar barang: melambat di area bay, berhenti, palang samping terbuka, petugas memindahkan dus ke/dari palet di pintu gudang
      const LOOP = 100, DOCK_S = 68, VMAX = 2.1, VSLOW = 0.8, DOCK_TIME = 27.5, STOPS = [[87, 0], [28.2, 1]];
      const T0 = 1.5, GAP = 5.0, TRIP = 10.0;
      trucks.forEach((tr, k2) => {
        const u = tr.userData;
        if (u.s === undefined) { u.s = (k2 / trucks.length) * LOOP; u.v = 0; u.dist = 0; u.served = false; }
        if (u.s < 20) u.served = false;
        let dist = 1e9;
        const near = (bs) => { dist = Math.min(dist, (bs - u.s + LOOP) % LOOP); };
        trucks.forEach((o2) => { if (o2 === tr || o2.userData.s === undefined) return; const gap = (o2.userData.s - u.s + LOOP) % LOOP; dist = Math.min(dist, gap < 5.6 ? 0 : gap - 5.6); });
        STOPS.forEach(([ss, ci]) => { if (crossings[ci].amt > 0.2) near(ss); });
        if (!u.served) near(DOCK_S);
        const cap = !u.served && u.s > DOCK_S - 9 && u.s < DOCK_S ? VSLOW : VMAX; // melambat hanya saat mendekati bay
        const target = Math.min(cap, Math.max(0, dist - 0.05) * 1.3);
        u.v += (target - u.v) * Math.min(1, dt * 3);
        u.s = (u.s + u.v * dt) % LOOP;
        u.dist += u.v * dt;
        if (!u.served && dock.by === null && dist < 0.15 && (DOCK_S - u.s + LOOP) % LOOP < 0.2) { dock.by = tr; dock.t = 0; dock.unload = !dock.unload; }
        if (dock.by === tr) {
          dock.t += dt;
          if (dock.t > DOCK_TIME) { dock.by = null; u.served = true; }
        }
        // bergeser ke tengah jalan di depan bay: parkir rapat ke gudang, sisi kerja menghadap kamera
        const lane = 0.5 - 0.5 * seg(u.s, 56, 62) * (1 - seg(u.s, 70, 76));
        place(tr, truckLoop, u.s / LOOP, lane);
        u.ws.forEach((w) => { w.rotation.z = -u.dist / 0.3; });
      });

      // jumlah dus di truk dihitung dari jadwal pemindahan (tanpa status tambahan)
      const dk = dock.by !== null ? dock.t : -1;
      const NC = 4;
      let truckN = 0;
      if (dk >= 0) {
        let a = 0;
        for (let i = 0; i < NC; i++) if (dk > T0 + i * GAP + (dock.unload ? 4.4 : 5.4)) a++;
        truckN = dock.unload ? NC - a : a;
      }
      trucks.forEach((tr) => {
        const u = tr.userData, open = dock.by === tr && dk > 0.6 && dk < DOCK_TIME - 0.8;
        u.fl += ((open ? 1.9 : 0) - u.fl) * Math.min(1, dt * 3);
        u.flap.rotation.x = u.fl;
        u.crates.forEach((m, k) => { m.visible = dock.by === tr && k < truckN; });
      });
      // pintu gulung bay terbuka selama bongkar-muat
      doorOpen += (((dock.by !== null && dk > 0.6 && dk < DOCK_TIME - 1) ? 1 : 0) - doorOpen) * Math.min(1, dt * 2.5);
      bayDoor.scale.y = 1 - 0.92 * doorOpen;

      // dua petugas: bongkar = ambil dus dari sisi truk (menghadap kamera), mengitari ujung truk, masuk lewat pintu; muat = sebaliknya
      const ease = (t) => t * t * (3 - 2 * t);
      const stB = (i) => (dock.unload ? NC - 1 - i : i) % 3;
      const bayRoute = (i) => [[1.0, 7.5], [1.0, 8.5], [0.9, 10.5], [5.7 - stB(i) * 0.7, 10.5]];
      const along = (pts, u) => {
        let tot = 0; const seg2 = [];
        for (let k = 1; k < pts.length; k++) { const l = Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); seg2.push(l); tot += l; }
        let d = u * tot;
        for (let k = 0; k < seg2.length; k++) { if (d <= seg2[k] || k === seg2.length - 1) { const f = seg2[k] ? Math.min(1, d / seg2[k]) : 0; return [pts[k][0] + (pts[k + 1][0] - pts[k][0]) * f, pts[k][1] + (pts[k + 1][1] - pts[k][1]) * f]; } d -= seg2[k]; }
      };
      loaders.forEach((g, w) => {
        const u = g.userData;
        let pos = [1.0, 7.5], face = Math.PI, carry = false, pause = false, walking = false, active = false;
        if (dk >= 0) for (let i = w; i < NC; i += 2) {
          const p = dk - (T0 + i * GAP);
          if (p < 0) break;
          if (p >= TRIP) continue;
          active = true;
          const pts = bayRoute(i);
          if (dock.unload) {
            if (p < 4.0) { pos = along(pts, ease(p / 4.0)); walking = true; }
            else if (p < 4.8) { pos = pts[3]; pause = true; face = Math.PI; }
            else if (p < 8.8) { pos = along(pts, 1 - ease((p - 4.8) / 4.0)); walking = true; }
            carry = p >= 4.4 && p < 9.0;
          } else {
            if (p >= 1.0 && p < 5.0) { pos = along(pts, ease((p - 1.0) / 4.0)); walking = true; }
            else if (p >= 5.0 && p < 5.8) { pos = pts[3]; pause = true; face = Math.PI; }
            else if (p >= 5.8 && p < 9.8) { pos = along(pts, 1 - ease((p - 5.8) / 4.0)); walking = true; }
            carry = p < 5.4;
          }
          break;
        }
        g.visible = active && pos[1] > 7.95;
        if (!g.visible) return;
        const dx = pos[0] - g.position.x, dz = pos[1] - g.position.z;
        if (walking && Math.hypot(dx, dz) > 0.0005) face = Math.atan2(dx, dz);
        g.position.set(pos[0], 0, pos[1]);
        let dr = face - g.rotation.y;
        dr = Math.atan2(Math.sin(dr), Math.cos(dr));
        g.rotation.y += dr * Math.min(1, dt * 10);
        u.carry.visible = carry;
        if (walking) sway(g, 9, carry ? 0.35 : 0.6); else { u.legs[0].rotation.x = u.legs[1].rotation.x = 0; }
        if (carry || pause) { u.arms[0].rotation.x = u.arms[1].rotation.x = pause ? -1.5 : -1.15; }
        else if (!walking) { u.arms[0].rotation.x = u.arms[1].rotation.x = 0; }
        g.rotation.x = pause ? 0.3 : 0;
      });
      // kru kereta: saat kereta berhenti, dua petugas memindahkan dus antara gerbong terbuka dan palet di sisi selatan rel
      const tUnload = Math.floor(time / TT) % 2 === 0;
      const tdk = tph - 18, TN = 6, TT0 = 1.5, TGAP = 3.5, TTRIP = 7.0;
      const tl = (m, n, t) => [m[0] + (n[0] - m[0]) * t, m[1] + (n[1] - m[1]) * t];
      const wagonX = (k) => tx + 12.65 + ((k % 3) - 1) * 0.9;
      const palX = (k) => 24.4 + ((k % 3) - 1) * 0.6;
      const stations = (i) => ({ W: [wagonX(tUnload ? TN - 1 - i : i), 19.4], P: [palX(tUnload ? i : TN - 1 - i), 20.35] });
      let wN, pN;
      if (tph < 18) { wN = tUnload ? TN : 0; pN = tUnload ? 0 : TN; }
      else if (tph >= 48) { wN = tUnload ? 0 : TN; pN = tUnload ? TN : 0; }
      else {
        let a1 = 0, a2 = 0;
        for (let i = 0; i < TN; i++) { const t0 = TT0 + i * TGAP; if (tdk > t0 + 3.0) a1++; if (tdk > t0 + 6.3) a2++; }
        wN = tUnload ? TN - a1 : a2; pN = tUnload ? a2 : TN - a1;
      }
      wagonCrates.forEach((m, k) => { m.visible = k < wN; });
      tpalCrates.forEach((m, k) => { m.visible = k < pN; });
      const REST = [[23.0, 20.35], [25.8, 20.35]];
      trainCrew.forEach((g, w) => {
        const u = g.userData;
        let pos = REST[w], face = Math.PI / 2, carry = false, pause = false, walking = false;
        if (tph >= 18 && tph < 48) {
          let S = REST[w], endT = -1;
          for (let i = w; i < TN; i += 2) {
            const p = tdk - (TT0 + i * TGAP), st = stations(i), A = tUnload ? st.W : st.P, B = tUnload ? st.P : st.W;
            if (p < 0) { pos = S; break; }
            if (p >= TTRIP) { S = B; endT = TT0 + i * TGAP + TTRIP; pos = B; continue; }
            if (p < 2.6) { pos = tl(S, A, ease(p / 2.6)); walking = true; }
            else if (p < 3.3) { pos = A; pause = true; face = tUnload ? Math.PI : 0; }
            else if (p < 5.9) { pos = tl(A, B, ease((p - 3.3) / 2.6)); walking = true; }
            else { pos = B; pause = true; face = tUnload ? 0 : Math.PI; }
            carry = p >= 3.0 && p < 6.3;
            endT = -1;
            break;
          }
          if (endT > 0 && tdk > endT) { const te = tdk - endT; pos = te < 2.5 ? tl(pos, REST[w], ease(te / 2.5)) : REST[w]; walking = te < 2.5; }
        }
        const dx = pos[0] - g.position.x, dz = pos[1] - g.position.z;
        if (walking && Math.hypot(dx, dz) > 0.0005) face = Math.atan2(dx, dz);
        g.position.set(pos[0], 0, pos[1]);
        let dr = face - g.rotation.y;
        dr = Math.atan2(Math.sin(dr), Math.cos(dr));
        g.rotation.y += dr * Math.min(1, dt * 10);
        u.carry.visible = carry;
        if (walking) sway(g, 9, carry ? 0.35 : 0.6); else { u.legs[0].rotation.x = u.legs[1].rotation.x = 0; }
        if (carry || pause) { u.arms[0].rotation.x = u.arms[1].rotation.x = pause ? -1.5 : -1.15; }
        else if (!walking) { u.arms[0].rotation.x = u.arms[1].rotation.x = 0; }
        g.rotation.x = pause ? 0.3 : 0;
      });
      vans.forEach((v, k2) => place(v, townLoop, time * 0.03 + k2 / vans.length, 0.5));
      return true;
    },
  };
}
