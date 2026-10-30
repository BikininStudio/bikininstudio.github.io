// Chapter 3 · Arunika Logistik (perusahaan fiktif): a low-poly logistics town (warehouse, port, road + rail, city).
// An orthographic camera flies between the areas as the page scrolls; a route draws itself from the warehouse
// to the city, ships, trucks, the train, vans, cranes, wind turbines, a cargo plane and a few clouds move while the stage is on screen.
// Static props are merged per colour (few draw calls); moving ones stay separate.
import { seg, mix, canvasTexture } from "../../3d/scroll3d.js";
import { mergeGeometries } from "../../3d/BufferGeometryUtils.js";

const PANELS = 6; // keep in sync with the .panel count in this chapter
// Nada menengah, kejenuhan rendah (docs/DESIGN.md 11.4): peta kabut pelabuhan, bukan kota neon
const C = { navy: "#2B3A55", navy2: "#34445F", teal: "#3E7F7C", amber: "#C08A3E", red: "#9E4B3F", gray: "#C3CBD0", white: "#E9ECEE", ground: "#C9CFD3", grass: "#B9C4B0", road: "#5B6470", water: "#8FA9B4", dark: "#2A2F37", glass: "#8FA7B5", line: "#DDE0E2" };
// Camera stops: target x/z, half-height of the view, extra turn around the vertical axis
const KEYS = [
  { x: 12, z: 5, size: 25, turn: 0 },
  { x: 4, z: 1, size: 9.5, turn: -0.3 },
  { x: -11, z: -6, size: 12, turn: 0.3 },
  { x: 15, z: 18, size: 10.5, turn: -0.12 },
  { x: 30, z: -2, size: 10, turn: 0.28 },
  { x: 12, z: 5, size: 27, turn: 0.1 },
];

// Simple seeded random so the town looks the same on every visit
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

export async function create(THREE, ctx) {
  const { small } = ctx;
  seed = 7;
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
  const basic = (c, extra = {}) => new THREE.MeshBasicMaterial({ color: c, ...extra });

  // Static batching: every sb()/decal() box is merged with the others of its colour at the end
  const buckets = new Map();
  const put = (key, g) => { if (!buckets.has(key)) buckets.set(key, []); buckets.get(key).push(g); };
  const sb = (w, h, d, color, x, y, z, ry = 0) => {
    const g = new THREE.BoxGeometry(w, h, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    put(color, g);
  };
  const decal = (w, d, color, x, z, y = 0.03, ry = 0) => { // flat marking: no shadow casting ("!" suffix)
    const g = new THREE.BoxGeometry(w, 0.02, d);
    if (ry) g.rotateY(ry);
    g.translate(x, y, z);
    put(color + "!", g);
  };
  const flushStatic = () => {
    for (const [key, list] of buckets) {
      const flat = key.endsWith("!");
      const m = new THREE.Mesh(mergeGeometries(list), mat(flat ? key.slice(0, -1) : key));
      m.castShadow = !flat;
      m.receiveShadow = true;
      scene.add(m);
      list.forEach((g) => g.dispose());
    }
    buckets.clear();
  };
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
  const tiled = (tex, rx, ry) => { tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(rx, ry); return tex; };

  // Textures: wavy water streaks, pavement joints, container ribs, wall cladding, windows
  const waterTex = tiled(canvasTexture(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(120,160,175,.28)"; g.lineWidth = 3; g.lineCap = "round";
    for (let i = 0; i < 26; i++) {
      const x = rnd() * w, y = rnd() * h, l = 14 + rnd() * 26;
      for (const dx of [-w, 0, w]) { g.beginPath(); g.moveTo(x + dx, y); g.quadraticCurveTo(x + dx + l / 2, y - 3, x + dx + l, y); g.stroke(); }
    }
  }), 26, 26);
  const padTex = tiled(canvasTexture(THREE, 128, 128, (g, w, h) => {
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(90,100,110,.16)"; g.fillRect(0, 0, w, 2); g.fillRect(0, 0, 2, h);
  }), 7, 7.75);
  const ribTex = tiled(canvasTexture(THREE, 128, 32, (g, w, h) => {
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(0,0,0,.2)";
    for (let x = 0; x < w; x += 8) g.fillRect(x, 0, 2.5, h);
    g.fillStyle = "rgba(0,0,0,.28)"; g.fillRect(0, 0, w, 3); g.fillRect(0, h - 3, w, 3);
  }), 1, 1);
  const claddingTex = tiled(canvasTexture(THREE, 128, 64, (g, w, h) => {
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(40,55,75,.18)"; g.fillRect(0, h - 3, w, 3); g.fillRect(0, 0, 2, h);
  }), 1, 1);
  const windowTex = tiled(canvasTexture(THREE, 128, 128, (g, w, h) => {
    g.fillStyle = "#FFFFFF"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#7B8FA2"; g.fillRect(24, 28, 80, 60);
    g.fillStyle = "rgba(255,255,255,.35)"; g.fillRect(24, 28, 80, 14);
    g.fillStyle = "rgba(60,70,85,.55)"; g.fillRect(20, 88, 88, 6); g.fillRect(62, 28, 4, 60);
  }), 1, 1);

  // Ground, water, shore foam, grass, roads
  const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshLambertMaterial({ color: C.water, map: waterTex }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.6;
  scene.add(water);
  const foam = new THREE.Mesh(new THREE.PlaneGeometry(60, 66), new THREE.MeshBasicMaterial({ color: "#F4F8F9", transparent: true, opacity: 0.4, depthWrite: false }));
  foam.rotation.x = -Math.PI / 2;
  foam.position.set(17, -0.57, 5);
  scene.add(foam);
  const land = new THREE.Mesh(new THREE.BoxGeometry(56, 1.2, 62), new THREE.MeshLambertMaterial({ color: C.ground, map: padTex }));
  land.position.set(17, -0.6, 5);
  land.receiveShadow = true;
  scene.add(land);
  flat(9, 12, C.grass, 15, -16);
  flat(14, 7, C.grass, 38, 15);
  flat(10, 6, C.grass, -4, 28);
  const ROADS = [[5, 17.5, 3, 17], [17.5, 26, 25, 3], [30, 17.5, 3, 17], [17.5, 9, 25, 3], [29.5, -1, 18, 2.2], [29.5, -9.5, 18, 2.2], [29.5, 7, 18, 2.2], [21.3, -1, 2.2, 19], [29.5, -1, 2.2, 19], [37.7, -1, 2.2, 19]];
  ROADS.forEach(([x, z, w, d]) => flat(w, d, C.road, x, z, 0.02));
  const inRoad = (x, z, m = 0, skip = -1) => ROADS.some(([cx, cz, w, d], i) => i !== skip && Math.abs(x - cx) < w / 2 + m && Math.abs(z - cz) < d / 2 + m);
  // lane dashes (skipped at crossings), road-edge lines, lamp posts
  const lamps = [];
  ROADS.forEach(([cx, cz, w, d], i) => {
    const alongX = w > d, len = alongX ? w : d;
    for (let t = -len / 2 + 1; t < len / 2 - 0.5; t += 1.7) {
      const x = alongX ? cx + t : cx, z = alongX ? cz : cz + t;
      if (!inRoad(x, z, 0.9, i)) decal(alongX ? 0.8 : 0.12, alongX ? 0.12 : 0.8, C.line, x, z);
    }
    for (let t = -len / 2 + 2; t < len / 2 - 1; t += 5.2) {
      const side = (i % 2 ? 1 : -1) * ((alongX ? d : w) / 2 + 0.35);
      const x = alongX ? cx + t : cx + side, z = alongX ? cz + side : cz + t;
      if (!inRoad(x, z, 0.2)) lamps.push([x, z]);
    }
  });
  // zebra crossings at the town junctions
  for (const [x, z] of [[21.3, 3.6], [29.5, 3.6], [37.7, 3.6], [21.3, -5.2], [29.5, -5.2]]) for (let k = -3; k <= 3; k++) decal(0.38, 1.5, C.line, x + k * 0.28, z);
  // quay edge
  const quay = box(1, 1.4, 62, C.gray, -10.5, -0.5, 5);
  quay.castShadow = false;
  // bollards along the quay
  for (let z = -22; z <= 30; z += 4) sb(0.35, 0.4, 0.35, C.dark, -10.2, 0.2, z);

  // Warehouses: ribbed walls, dock doors with canopy, branded roof
  const roofTex = canvasTexture(THREE, 1024, 512, (g, w, h) => {
    g.fillStyle = C.navy; g.fillRect(0, 0, w, h);
    g.fillStyle = "rgba(255,255,255,.06)";
    for (let x = 0; x < w; x += 32) g.fillRect(x, 0, 3, h);
    g.fillStyle = C.amber;
    g.font = '800 120px "Montserrat", sans-serif';
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("ARUNIKA", w / 2, h / 2);
  });
  const wallMat = new THREE.MeshLambertMaterial({ color: C.white, map: claddingTex });
  for (const [z, d] of [[-2, 5.5], [5, 5]]) {
    const wg = new THREE.BoxGeometry(9, 3.2, d), uv = wg.attributes.uv;
    const fw = [d, d, 0, 0, 9, 9];
    for (const f of [0, 1, 4, 5]) for (let v = 0; v < 4; v++) uv.setXY(f * 4 + v, uv.getX(f * 4 + v) * fw[f] / 2.2, uv.getY(f * 4 + v) * 3.2);
    const wall = new THREE.Mesh(wg, [wallMat, wallMat, mat(C.navy), mat(C.navy), wallMat, wallMat]);
    wall.position.set(4, 1.6, z);
    wall.castShadow = wall.receiveShadow = true;
    scene.add(wall);
    const roof = new THREE.Mesh(new THREE.BoxGeometry(9.4, 0.35, d + 0.4), [mat(C.navy), mat(C.navy), new THREE.MeshLambertMaterial({ map: roofTex }), mat(C.navy), mat(C.navy), mat(C.navy)]);
    roof.position.set(4, 3.35, z);
    roof.castShadow = roof.receiveShadow = true;
    scene.add(roof);
    sb(9.05, 0.35, d + 0.05, C.teal, 4, 2.4, z);
    const fz = z + d / 2;
    for (let i = 0; i < 3; i++) {
      const x = 1 + i * 3;
      sb(1.6, 1.9, 0.1, C.amber, x, 0.95, fz + 0.05);
      for (let k = 0; k < 4; k++) sb(1.6, 0.05, 0.12, "#8A6228", x, 0.35 + k * 0.4, fz + 0.06); // roll-up door slats
      sb(1.9, 0.12, 0.7, C.dark, x, 2.05, fz + 0.35); // canopy
      sb(0.3, 0.3, 0.2, C.dark, x - 0.7, 0.15, fz + 0.18); sb(0.3, 0.3, 0.2, C.dark, x + 0.7, 0.15, fz + 0.18); // dock bumpers
    }
    // rooftop vents, tucked at the back edge so the logo stays readable
    for (let i = 0; i < 3; i++) { sb(0.8, 0.35, 0.6, C.gray, 1.2 + i * 2.8, 3.7, z - d / 2 + 0.3); sb(0.5, 0.12, 0.5, C.dark, 1.2 + i * 2.8, 3.95, z - d / 2 + 0.3); }
  }
  // flagpole at the gate
  sb(0.06, 3.2, 0.06, C.gray, 9.4, 1.6, 0.4);
  sb(0.7, 0.4, 0.04, C.amber, 9.75, 2.9, 0.4);

  // Containers: ribbed, one instanced mesh per area
  const spots = [];
  for (let x = -8.5; x <= -3; x += 2.8) for (let z = -15; z <= 2; z += 1.15) { const n = 1 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) spots.push([x, 0.5 + k * 1.02, z, 0]); }
  for (let z = -3; z <= 6; z += 1.15) spots.push([11, 0.5, z, 0], [13.6, 0.5, z, 0]);
  // rail terminal inside the road loop
  for (let x = 9; x <= 17.5; x += 2.8) for (let z = 20.6; z <= 23.6; z += 1.15) { const n = 1 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) spots.push([x, 0.5 + k * 1.02, z, 0]); }
  const shipSpots = [];
  for (let x = -5; x <= 5; x += 2.5) for (let z = -0.55; z <= 0.6; z += 1.1) for (let k = 0; k < 2; k++) shipSpots.push([x, 1.9 + k * 1.02, z, 0]);
  const palette = [C.navy, C.teal, C.amber, C.red, C.gray, C.navy2].map((c) => new THREE.Color(c));
  const ribMat = new THREE.MeshLambertMaterial({ map: ribTex });
  const boxGeo = new THREE.BoxGeometry(2.4, 1, 1);
  function containers(list, parent) {
    const im = new THREE.InstancedMesh(boxGeo, ribMat, list.length);
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

  // Gantry cranes on the quay: fixed frame + a trolley that carries a container back and forth
  const trolleys = [];
  const hangGeo = new THREE.BoxGeometry(2.4, 1, 1);
  for (const z of [-11, -3]) {
    const g = new THREE.Group();
    box(0.5, 7, 0.5, C.amber, -7, 3.5, -1.6, g); box(0.5, 7, 0.5, C.amber, -7, 3.5, 1.6, g);
    box(0.5, 7, 0.5, C.amber, -3.5, 3.5, -1.6, g); box(0.5, 7, 0.5, C.amber, -3.5, 3.5, 1.6, g);
    box(12, 0.6, 0.6, C.amber, -9, 7.2, -1.6, g); box(12, 0.6, 0.6, C.amber, -9, 7.2, 1.6, g);
    box(0.4, 0.4, 3.6, C.amber, -7, 5, 0, g); box(0.4, 0.4, 3.6, C.amber, -3.5, 5, 0, g);
    box(1.4, 0.9, 3.8, C.red, -10.5, 6.5, 0, g);
    box(0.25, 0.5, 0.25, C.red, -7, 7.75, -1.6, g);
    g.position.z = z;
    scene.add(g);
    const t = new THREE.Group();
    box(1.1, 0.5, 3.8, C.navy2, 0, 0, 0, t);
    const rope = box(0.06, 1, 0.06, C.dark, 0, -0.5, 0, t);
    const load = new THREE.Mesh(hangGeo, new THREE.MeshLambertMaterial({ color: z < -5 ? C.teal : C.red, map: ribTex }));
    load.castShadow = true;
    t.add(load);
    t.position.z = z;
    scene.add(t);
    trolleys.push({ t, rope, load, ph: z });
  }

  // Ships: hull with a pointed bow, one alongside the quay (bobs), one sailing past (loops, leaves a wake)
  const hullShape = (len, k) => {
    const s = new THREE.Shape(), hw = 1.7 * k;
    s.moveTo(len / 2, -hw); s.lineTo(-len / 2 + 1.8, -hw); s.lineTo(-len / 2 - 1.1, 0); s.lineTo(-len / 2 + 1.8, hw); s.lineTo(len / 2, hw); s.closePath();
    return s;
  };
  function ship(len, wake) {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape(len, 1), { depth: 1.35, bevelEnabled: false }), mat(C.navy));
    hull.rotation.x = -Math.PI / 2;
    hull.position.y = 0;
    const keel = new THREE.Mesh(new THREE.ExtrudeGeometry(hullShape(len, 1.02), { depth: 0.35, bevelEnabled: false }), mat(C.red));
    keel.rotation.x = -Math.PI / 2;
    keel.position.y = -0.35;
    hull.castShadow = hull.receiveShadow = keel.receiveShadow = true;
    g.add(hull, keel);
    box(len - 3, 0.12, 3.2, C.gray, -0.4, 1.38, 0, g); // deck
    box(2.2, 2.6, 3, C.white, len / 2 - 1.8, 2.7, 0, g); // bridge
    box(2.3, 0.35, 3.1, C.teal, len / 2 - 1.8, 1.5, 0, g);
    box(1.3, 0.5, 3.1, C.glass, len / 2 - 2.3, 3.4, 0, g); // bridge windows
    box(0.55, 1.3, 0.55, C.amber, len / 2 - 1.2, 4.5, 0, g); // funnel
    box(0.6, 0.18, 0.6, C.navy, len / 2 - 1.2, 5.2, 0, g);
    containers(shipSpots.filter(([x]) => x < len / 2 - 3.2 && x > -len / 2 + 2.2), g);
    if (wake) {
      const ws = new THREE.Shape();
      ws.moveTo(len / 2, -1.5); ws.lineTo(len / 2 + 11, -3.4); ws.lineTo(len / 2 + 11, 3.4); ws.lineTo(len / 2, 1.5); ws.closePath();
      const w = new THREE.Mesh(new THREE.ShapeGeometry(ws), new THREE.MeshBasicMaterial({ color: "#F4F8F9", transparent: true, opacity: 0.35, depthWrite: false }));
      w.rotation.x = -Math.PI / 2;
      w.position.y = 0.63;
      g.add(w);
    }
    g.rotation.y = Math.PI / 2;
    scene.add(g);
    return g;
  }
  const docked = ship(15, false);
  docked.position.set(-13.2, -0.4, -6);
  const sailing = ship(13, true);
  sailing.position.set(-26, -0.4, 0);

  // Rail with sleepers, ballast bed and a container train
  flat(60, 3.4, "#B2B4B1", 17, 18, 0.015);
  for (let x = -13; x <= 47; x += 0.65) sb(0.22, 0.08, 2, "#6B6258", x, 0.06, 18);
  sb(60, 0.12, 0.15, C.navy2, 17, 0.14, 17.4);
  sb(60, 0.12, 0.15, C.navy2, 17, 0.14, 18.6);
  const wheelGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.26, 12).rotateX(Math.PI / 2);
  const wheelMat = mat(C.dark);
  const wheel = (parent, x, y, z, s = 1) => { const m = new THREE.Mesh(wheelGeo, wheelMat); m.position.set(x, y, z); m.scale.setScalar(s); parent.add(m); };
  const train = new THREE.Group();
  box(3.2, 1.8, 1.6, C.teal, 0, 1.1, 0, train);
  box(1.2, 0.8, 1.6, C.amber, 0.9, 2.3, 0, train);
  box(0.06, 0.45, 1.4, C.glass, 1.52, 2.3, 0, train);
  box(3.25, 0.18, 1.65, C.amber, 0, 0.55, 0, train);
  box(0.4, 0.25, 0.4, C.dark, -1, 2.1, 0, train);
  box(0.12, 0.2, 0.3, "#F3E3B8", 1.62, 1.1, 0.5, train); box(0.12, 0.2, 0.3, "#F3E3B8", 1.62, 1.1, -0.5, train);
  [-1, 0, 1].forEach((x) => { wheel(train, x, 0.3, 0.7, 0.8); wheel(train, x, 0.3, -0.7, 0.8); });
  const wagons = [];
  for (let i = 1; i <= 5; i++) wagons.push([-i * 3.1, 0.95, 0, 0]);
  wagons.forEach((w) => {
    box(2.9, 0.3, 1.5, C.navy2, w[0], 0.35, 0, train);
    box(0.4, 0.06, 0.06, C.dark, w[0] + 1.65, 0.4, 0, train); // coupling
    wheel(train, w[0] - 0.9, 0.2, 0.7, 0.7); wheel(train, w[0] - 0.9, 0.2, -0.7, 0.7); wheel(train, w[0] + 0.9, 0.2, 0.7, 0.7); wheel(train, w[0] + 0.9, 0.2, -0.7, 0.7);
  });
  containers(wagons, train);
  train.position.z = 18;
  scene.add(train);

  // Trucks on the road loop (cab, windshield, lights, wheels, branded trailer), vans in town
  const sideTex = (bg, fg) => canvasTexture(THREE, 256, 96, (g, w, h) => {
    g.fillStyle = bg; g.fillRect(0, 0, w, h);
    g.fillStyle = fg; g.font = '800 40px "Montserrat", sans-serif'; g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText("ARUNIKA", w / 2, h / 2 + 2);
  });
  const trailerMats = {
    [C.white]: new THREE.MeshLambertMaterial({ map: sideTex(C.white, C.navy) }),
    [C.teal]: new THREE.MeshLambertMaterial({ map: sideTex(C.teal, "#F2E9D6") }),
    [C.navy]: new THREE.MeshLambertMaterial({ map: sideTex(C.navy, "#E0B268") }),
  };
  const lightMat = basic("#F3E3B8"), glassMat = mat(C.glass);
  function truck(trailer) {
    const g = new THREE.Group();
    const tm = trailerMats[trailer], plain = mat(trailer);
    const tr = new THREE.Mesh(new THREE.BoxGeometry(2.7, 1.3, 1.15), [plain, plain, plain, plain, tm, tm]);
    tr.position.set(-0.55, 0.95, 0);
    tr.castShadow = true;
    g.add(tr);
    box(4.2, 0.18, 0.8, C.dark, -0.1, 0.32, 0, g);
    box(1.1, 1, 1.1, C.amber, 1.45, 0.8, 0, g);
    box(0.5, 0.55, 1.1, C.amber, 1.85, 0.52, 0, g);
    const ws = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.9), glassMat); ws.position.set(2.0, 1.05, 0); g.add(ws);
    [0.4, -0.4].forEach((zz) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.12, 0.2), lightMat); l.position.set(2.12, 0.5, zz); g.add(l); });
    [-1.4, -0.7, 1.5].forEach((x) => { wheel(g, x, 0.3, 0.58); wheel(g, x, 0.3, -0.58); });
    scene.add(g);
    return g;
  }
  const trucks = [C.white, C.teal, C.navy, C.white].map(truck);
  // truck yard + bay lines + depot office inside the loop
  flat(10, 5, "#CDD4DC", 23.5, 13.5, 0.015);
  [20, 22.4, 24.8, 27.2].forEach((x, k) => { const t = truck(k % 2 ? C.teal : C.white); t.position.set(x, 0, 13.5); t.rotation.y = Math.PI / 2; });
  for (let x = 18.8; x <= 28.4; x += 2.4) decal(0.1, 3.6, C.line, x, 13.5, 0.03);
  const dock1 = truck(C.white); dock1.position.set(1, 0, 9.4); dock1.rotation.y = -Math.PI / 2; // backed into a dock
  const dock2 = truck(C.navy); dock2.position.set(7, 0, 9.4); dock2.rotation.y = -Math.PI / 2;
  sb(4.5, 2.4, 3.2, C.white, 11.5, 1.2, 13.5);
  sb(4.7, 0.25, 3.4, C.teal, 11.5, 2.5, 13.5);
  sb(4.55, 0.6, 0.1, C.navy, 11.5, 1.8, 15.15);
  sb(3.4, 0.9, 0.06, C.glass, 11.5, 1.0, 15.13);
  sb(0.7, 0.4, 0.6, C.gray, 10.5, 2.8, 13.5); sb(0.7, 0.4, 0.6, C.gray, 12.5, 2.8, 13.5);
  const vans = [C.teal, C.amber, C.teal].map((c) => {
    const g = new THREE.Group();
    box(1.5, 0.8, 0.8, c, 0, 0.55, 0, g);
    box(0.7, 0.45, 0.76, c, 0.35, 1.15, 0, g);
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.32, 0.64), glassMat); w.position.set(0.72, 1.17, 0); g.add(w);
    [0.5, -0.5].forEach((x) => { wheel(g, x, 0.25, 0.4, 0.8); wheel(g, x, 0.25, -0.4, 0.8); });
    scene.add(g);
    return g;
  });
  const loop = (x0, z0, x1, z1) => {
    const p = new THREE.CurvePath();
    [[x0, z0, x0, z1], [x0, z1, x1, z1], [x1, z1, x1, z0], [x1, z0, x0, z0]].forEach(([a, b, c, d]) => p.add(new THREE.LineCurve3(new THREE.Vector3(a, 0, b), new THREE.Vector3(c, 0, d))));
    return p;
  };
  const roadLoop = loop(5, 9, 30, 26), townLoop = loop(21.3, -9.5, 37.7, 7);
  const place = (obj, path, t, side) => {
    const p = path.getPointAt(t % 1), d = path.getTangentAt(t % 1);
    obj.position.set(p.x + d.z * side, 0, p.z - d.x * side);
    obj.rotation.y = Math.atan2(-d.z, d.x);
  };

  // Town blocks: pavement, window facades (floor-snapped), roof gear; a few taller towers
  const pastel = ["#D8D2C4", "#C6CFD6", "#D4BFB0", "#BFCFC6", "#CBC8D3", C.white];
  const facade = {};
  const facadeMat = (c) => (facade[c] ||= new THREE.MeshLambertMaterial({ color: c, map: windowTex }));
  function tower(w, h, d, color, x, z, roofColor) {
    h = Math.max(2, Math.round(h / 1.3)) * 1.3;
    const g = new THREE.BoxGeometry(w, h, d), uv = g.attributes.uv;
    const fw = [d, d, 0, 0, w, w];
    for (const f of [0, 1, 4, 5]) for (let v = 0; v < 4; v++) uv.setXY(f * 4 + v, uv.getX(f * 4 + v) * fw[f] / 1.3, uv.getY(f * 4 + v) * h / 1.3);
    const side = facadeMat(color), top = mat(roofColor);
    const m = new THREE.Mesh(g, [side, side, top, top, side, side]);
    m.position.set(x, h / 2, z);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    // roof gear
    if (h > 3) sb(0.7, 0.4, 0.7, C.gray, x - w / 4, h + 0.2, z + d / 4);
    if (h > 4.5) { sb(0.9, 0.9, 0.9, "#8A7258", x + w / 4, h + 0.45, z - d / 4); sb(0.05, 1.2, 0.05, C.dark, x - w / 4, h + 0.6, z - d / 4); }
    return h;
  }
  for (const bx of [25.4, 33.6]) for (const bz of [-5.25, 3]) {
    flat(6.6, 6.6, "#D6DADD", bx, bz, 0.022);
    for (let i = 0; i < 4; i++) {
      const tall = i === 0 && (bx + bz) % 2 > 0.5;
      const h = tall ? 5.5 + rnd() * 2 : 1.2 + rnd() * 3.6;
      const x = bx + ((i % 2) - 0.5) * 3.2, z = bz + (Math.floor(i / 2) - 0.5) * 3.2;
      tower(2.6, h, 2.6, pastel[Math.floor(rnd() * pastel.length)], x, z, i % 3 ? C.navy2 : C.teal);
    }
  }
  // small park with a pond and benches next to the town
  flat(5, 5, "#A8B79F", 38, 15, 0.014);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1.6, 24), new THREE.MeshLambertMaterial({ color: C.water }));
  pond.rotation.x = -Math.PI / 2; pond.position.set(38.5, 0.04, 15.5); scene.add(pond);
  sb(1.1, 0.14, 0.4, "#8A7258", 36.3, 0.1, 17.4); sb(1.1, 0.14, 0.4, "#8A7258", 40.7, 0.1, 13.2);

  // Trees: round and pine crowns with trunks, instanced
  const treeSpots = [];
  for (let i = 0; i < 70; i++) {
    const [x, z] = [[11 + rnd() * 9, -21 + rnd() * 10], [32 + rnd() * 12, 12 + rnd() * 6], [-8 + rnd() * 9, 25 + rnd() * 6], [40 + rnd() * 4, -12 + rnd() * 20]][i % 4];
    if (inRoad(x, z, 1.2)) continue;
    treeSpots.push([x, z, 0.7 + rnd() * 0.6]);
  }
  const greens = ["#6B9A6E", "#5E8F63", "#7BA27A", "#4F8159"].map((c) => new THREE.Color(c));
  const round = treeSpots.filter((_, i) => i % 3 !== 0), pines = treeSpots.filter((_, i) => i % 3 === 0);
  const o = new THREE.Object3D();
  const crownMat = new THREE.MeshLambertMaterial({ flatShading: true });
  const crowns = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(0.85, 0), crownMat, round.length);
  const cones = new THREE.InstancedMesh(new THREE.ConeGeometry(0.8, 2.2, 7), crownMat, pines.length);
  const trunks = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.1, 0.14, 1, 6), mat("#6E5A47"), treeSpots.length);
  round.forEach(([x, z, s], i) => { o.position.set(x, 1.45 * s, z); o.scale.set(s, s * 0.9, s); o.rotation.y = rnd() * 3; o.updateMatrix(); crowns.setMatrixAt(i, o.matrix); crowns.setColorAt(i, greens[i % 4]); });
  pines.forEach(([x, z, s], i) => { o.position.set(x, 1.55 * s, z); o.scale.setScalar(s); o.rotation.y = 0; o.updateMatrix(); cones.setMatrixAt(i, o.matrix); cones.setColorAt(i, greens[(i + 2) % 4]); });
  [...round, ...pines].forEach(([x, z, s], i) => { o.position.set(x, 0.5 * s, z); o.scale.set(s, s, s); o.rotation.y = 0; o.updateMatrix(); trunks.setMatrixAt(i, o.matrix); });
  crowns.castShadow = cones.castShadow = trunks.castShadow = true;
  scene.add(crowns, cones, trunks);

  // Lamp posts along the roads
  const lampPole = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.05, 0.06, 2.4, 6), mat(C.dark), lamps.length);
  const lampHead = new THREE.InstancedMesh(new THREE.SphereGeometry(0.17, 8, 6), basic("#F3E3B8"), lamps.length);
  lamps.forEach(([x, z], i) => {
    o.rotation.set(0, 0, 0); o.scale.setScalar(1);
    o.position.set(x, 1.2, z); o.updateMatrix(); lampPole.setMatrixAt(i, o.matrix);
    o.position.set(x, 2.45, z); o.updateMatrix(); lampHead.setMatrixAt(i, o.matrix);
  });
  lampPole.castShadow = true;
  scene.add(lampPole, lampHead);

  // Wind turbines on the grass in the north
  const rotors = [];
  for (const [x, z, ph] of [[12.5, -19, 0], [17, -14.5, 1.3], [17.5, -20, 2.6]]) {
    const g = new THREE.Group();
    const tw = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.22, 5.2, 8), mat(C.white));
    tw.position.y = 2.6; tw.castShadow = true; g.add(tw);
    box(0.5, 0.4, 0.8, C.white, 0, 5.3, 0.15, g);
    const rotor = new THREE.Group();
    rotor.position.set(0, 5.3, 0.65);
    for (let k = 0; k < 3; k++) {
      const arm = new THREE.Group();
      arm.rotation.z = (k * Math.PI * 2) / 3;
      const blade = box(0.16, 2.3, 0.05, C.white, 0, 1.2, 0, arm);
      blade.castShadow = true;
      rotor.add(arm);
    }
    box(0.22, 0.22, 0.22, C.gray, 0, 0, 0.05, rotor);
    g.add(rotor);
    g.position.set(x, 0, z);
    g.rotation.y = Math.PI / 4;
    scene.add(g);
    rotors.push({ rotor, ph });
  }

  // Cargo plane crossing high above, and a few soft clouds (no shadows, so they never darken the focus)
  const plane = new THREE.Group();
  const fus = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.3, 4.2, 10).rotateZ(Math.PI / 2), mat(C.white)); plane.add(fus);
  box(0.9, 0.12, 5, C.gray, 0.2, -0.05, 0, plane);
  box(0.6, 0.1, 1.9, C.gray, -1.9, 0.05, 0, plane);
  box(0.6, 0.9, 0.1, C.teal, -1.9, 0.5, 0, plane);
  box(0.5, 0.32, 0.5, C.navy2, 0.5, -0.32, 1.4, plane); box(0.5, 0.32, 0.5, C.navy2, 0.5, -0.32, -1.4, plane);
  plane.scale.setScalar(1.5);
  plane.position.y = 19;
  scene.add(plane);
  const cloudMat = new THREE.MeshLambertMaterial({ color: "#FFFFFF", transparent: true, opacity: 0.6, depthWrite: false });
  const clouds = [[-6, 14, -10], [14, 15, 2], [32, 13, 20], [2, 16, 26], [40, 15, -14]].map(([x, y, z], k) => {
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

  flushStatic();

  // Delivery route: warehouse -> port -> rail terminal -> city, drawn progressively with the scroll
  const route = new THREE.CatmullRomCurve3([[4, 3.5, 1], [-2, 7, -4], [-9, 4.5, -7], [2, 7.5, 8], [15, 4, 19], [24, 7, 9], [30, 4.5, -2]].map(([x, y, z]) => new THREE.Vector3(x, y, z)));
  const tube = new THREE.Mesh(new THREE.TubeGeometry(route, 360, 0.13, 8, false), basic("#5E3C0C")); // garis rute tegas seperti peta, tanpa cahaya
  const tubeCount = tube.geometry.index.count;
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.42, 16, 12), basic("#F0D9A8"));
  const ringGeo = new THREE.RingGeometry(0.55, 0.85, 28).rotateX(-Math.PI / 2);
  const poleGeo = new THREE.CylinderGeometry(0.04, 0.04, 1, 6);
  const pins = [0, 0.33, 0.66, 1].map((u) => {
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.12, 24), basic(C.amber, { transparent: true }));
    const p = route.getPointAt(u);
    pin.position.copy(p);
    pin.userData.u = u;
    const pole = new THREE.Mesh(poleGeo, basic("#5E3C0C", { transparent: true }));
    pole.scale.y = p.y; pole.position.set(p.x, p.y / 2, p.z);
    const ring = new THREE.Mesh(ringGeo, basic(C.amber, { transparent: true }));
    ring.position.set(p.x, 0.06, p.z);
    pin.userData.extra = [pole, ring];
    scene.add(pin, pole, ring);
    return pin;
  });
  const pulses = [0, 1, 2].map(() => new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), basic("#F0D9A8")));
  scene.add(tube, head, ...pulses);

  // Orthographic "isometric" camera
  const camera = new THREE.OrthographicCamera(-10, 10, 10, -10, 0.1, 400);
  const target = new THREE.Vector3(), dir = new THREE.Vector3(), right = new THREE.Vector3(), up = new THREE.Vector3();
  let aspect = 1;

  return {
    scene, camera, toneMapping: THREE.NoToneMapping,
    resize(w, h) { aspect = w / h; },
    update(p, dt, time) {
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

      // route grows with the chapter; the head pulses and small dots run along the drawn part
      const k = Math.max(0.001, seg(s, 0.4, 4.4));
      tube.geometry.setDrawRange(0, Math.floor((tubeCount * k) / 3) * 3);
      head.position.copy(route.getPointAt(k));
      head.scale.setScalar(1 + Math.sin(time * 5) * 0.15);
      head.visible = k > 0.002;
      pulses.forEach((m, n) => { m.visible = k > 0.05; m.position.copy(route.getPointAt(Math.min(0.999, ((time * 0.14 + n / 3) % 1) * k))); });
      pins.forEach((pin) => {
        const on = k >= pin.userData.u - 0.01;
        pin.material.opacity = on ? 1 : 0.25;
        pin.scale.setScalar(on ? 1 + Math.sin(time * 3 + pin.userData.u * 6) * 0.08 : 0.8);
        const [pole, ring] = pin.userData.extra;
        pole.material.opacity = on ? 1 : 0.2;
        ring.material.opacity = on ? 0.9 - ((time * 0.7 + pin.userData.u) % 1) * 0.7 : 0.15;
        ring.scale.setScalar(on ? 1 + ((time * 0.7 + pin.userData.u) % 1) * 0.8 : 1);
      });
      clouds.forEach((c) => { c.position.x = ((c.userData.x + time * c.userData.speed + 30) % 80) - 30; });

      // water, foam, traffic
      waterTex.offset.set(time * 0.004, time * 0.0025);
      foam.material.opacity = 0.34 + Math.sin(time * 0.9) * 0.08;
      docked.position.y = -0.4 + Math.sin(time * 1.2) * 0.08;
      sailing.position.z = ((time * 1.6) % 70) - 35;
      sailing.position.y = -0.4 + Math.sin(time * 1.1 + 1) * 0.08;
      train.position.x = ((time * 4) % 62) - 10;
      trucks.forEach((tr, k2) => place(tr, roadLoop, time * 0.025 + k2 / trucks.length, 0.6));
      vans.forEach((v, k2) => place(v, townLoop, time * 0.03 + k2 / vans.length, 0.5));

      // crane trolleys carry boxes between ship and quay
      trolleys.forEach(({ t: tr, rope, load, ph }) => {
        const u = Math.sin(time * 0.45 + ph);
        tr.position.set(-9 + u * 4, 6.7, tr.position.z);
        const drop = 2.2 + (Math.sin(time * 0.9 + ph) + 1) * 1.1;
        rope.scale.y = drop; rope.position.y = -0.25 - drop / 2;
        load.position.y = -0.25 - drop - 0.5;
      });
      rotors.forEach(({ rotor, ph }) => { rotor.rotation.z = time * 1.3 + ph; });
      plane.position.set(((time * 3 + 20) % 130) - 45, 19 + Math.sin(time * 0.5) * 0.4, 6 + Math.sin(time * 0.2) * 3);
      return true;
    },
  };
}
