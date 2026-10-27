// Chapter 3 · Arunika Logistik (perusahaan fiktif): a low-poly logistics town (warehouse, port, road + rail, city).
// An orthographic camera flies between the areas as the page scrolls; a glowing route draws itself from the warehouse
// to the city, ships, trucks, the train, vans and a few clouds move while the stage is on screen.
import { seg, mix, canvasTexture } from "../../3d/scroll3d.js";

const PANELS = 6; // keep in sync with the .panel count in this chapter
// Nada menengah, kejenuhan rendah (docs/DESIGN.md 11.4): peta kabut pelabuhan, bukan kota neon
const C = { navy: "#2B3A55", navy2: "#34445F", teal: "#3E7F7C", amber: "#C08A3E", red: "#9E4B3F", gray: "#C3CBD0", white: "#E9ECEE", ground: "#C9CFD3", grass: "#B9C4B0", road: "#5B6470", water: "#8FA9B4" };
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
  const water = new THREE.Mesh(new THREE.PlaneGeometry(300, 300), new THREE.MeshLambertMaterial({ color: C.water }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.6;
  scene.add(water);
  const land = box(56, 1.2, 62, C.ground, 17, -0.6, 5);
  land.castShadow = false;
  flat(9, 12, C.grass, 15, -16);
  flat(14, 7, C.grass, 38, 15);
  flat(10, 6, C.grass, -4, 28);
  [[5, 17.5, 3, 17], [17.5, 26, 25, 3], [30, 17.5, 3, 17], [17.5, 9, 25, 3], [29.5, -1, 18, 2.2], [29.5, -9.5, 18, 2.2], [29.5, 7, 18, 2.2], [21.3, -1, 2.2, 19], [29.5, -1, 2.2, 19], [37.7, -1, 2.2, 19]].forEach(([x, z, w, d]) => flat(w, d, C.road, x, z, 0.02));
  // quay edge
  box(1, 1.4, 62, C.gray, -10.5, -0.5, 5).castShadow = false;

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
    for (let i = 0; i < 3; i++) box(1.6, 1.9, 0.1, C.amber, 1 + i * 3, 0.95, z + d / 2 + 0.05);
  }

  // Containers (one instanced mesh for all of them)
  const spots = [];
  for (let x = -8.5; x <= -3; x += 2.8) for (let z = -15; z <= 2; z += 1.15) { const n = 1 + Math.floor(rnd() * 3); for (let k = 0; k < n; k++) spots.push([x, 0.5 + k * 1.02, z, 0]); }
  for (let z = -3; z <= 6; z += 1.15) spots.push([11, 0.5, z, 0], [13.6, 0.5, z, 0]);
  // rail terminal inside the road loop
  for (let x = 9; x <= 17.5; x += 2.8) for (let z = 20.6; z <= 23.6; z += 1.15) { const n = 1 + Math.floor(rnd() * 2); for (let k = 0; k < n; k++) spots.push([x, 0.5 + k * 1.02, z, 0]); }
  const shipSpots = [];
  for (let x = -5; x <= 5; x += 2.5) for (let z = -0.55; z <= 0.6; z += 1.1) for (let k = 0; k < 2; k++) shipSpots.push([x, 1.9 + k * 1.02, z, 0]);
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
  for (const z of [-11, -3]) {
    const g = new THREE.Group();
    box(0.5, 7, 0.5, C.amber, -7, 3.5, -1.6, g); box(0.5, 7, 0.5, C.amber, -7, 3.5, 1.6, g);
    box(0.5, 7, 0.5, C.amber, -3.5, 3.5, -1.6, g); box(0.5, 7, 0.5, C.amber, -3.5, 3.5, 1.6, g);
    box(12, 0.6, 0.6, C.amber, -9, 7.2, -1.6, g); box(12, 0.6, 0.6, C.amber, -9, 7.2, 1.6, g);
    box(1.4, 0.9, 3.8, C.red, -10.5, 6.5, 0, g);
    g.position.z = z;
    scene.add(g);
  }

  // Ships: one alongside the quay (bobs), one sailing past (loops)
  function ship(len) {
    const g = new THREE.Group();
    box(len, 1.6, 3.4, C.navy, 0, 0.5, 0, g);
    box(len, 0.25, 3.45, C.red, 0, -0.2, 0, g);
    box(2.2, 2.6, 3, C.white, len / 2 - 1.8, 2.4, 0, g);
    box(0.5, 1.2, 0.5, C.amber, len / 2 - 1.8, 4.2, 0, g);
    containers(shipSpots, g);
    g.rotation.y = Math.PI / 2;
    scene.add(g);
    return g;
  }
  const docked = ship(15);
  docked.position.set(-13.2, -0.4, -6);
  const sailing = ship(13);
  sailing.position.set(-26, -0.4, 0);

  // Rail with a container train
  box(60, 0.12, 0.15, C.navy2, 17, 0.06, 17.4).castShadow = false;
  box(60, 0.12, 0.15, C.navy2, 17, 0.06, 18.6).castShadow = false;
  const train = new THREE.Group();
  box(3.2, 1.8, 1.6, C.teal, 0, 1.1, 0, train);
  box(1.2, 0.8, 1.6, C.amber, 0.9, 2.3, 0, train);
  const wagons = [];
  for (let i = 1; i <= 5; i++) wagons.push([-i * 3.1, 0.95, 0, 0]);
  wagons.forEach((w) => box(2.9, 0.3, 1.5, C.navy2, w[0], 0.35, 0, train));
  containers(wagons, train);
  train.position.z = 18;
  scene.add(train);

  // Trucks on the road loop, vans in town
  function truck(trailer) {
    const g = new THREE.Group();
    box(1.2, 1.1, 1.1, C.amber, 1.5, 0.75, 0, g);
    box(2.5, 1.2, 1.1, trailer, -0.5, 0.8, 0, g);
    scene.add(g);
    return g;
  }
  const trucks = [C.white, C.teal, C.navy, C.white].map(truck);
  // truck yard + depot office inside the loop
  flat(10, 5, "#CDD4DC", 23.5, 13.5, 0.015);
  [20, 22.4, 24.8, 27.2].forEach((x, k) => { const t = truck(k % 2 ? C.teal : C.white); t.position.set(x, 0, 13.5); t.rotation.y = Math.PI / 2; });
  box(4.5, 2.4, 3.2, C.white, 11.5, 1.2, 13.5);
  box(4.7, 0.25, 3.4, C.teal, 11.5, 2.5, 13.5);
  box(4.55, 0.6, 0.1, C.navy, 11.5, 1.8, 15.15);
  const vans = [C.teal, C.amber, C.teal].map((c) => {
    const g = new THREE.Group();
    box(1.5, 0.9, 0.8, c, 0, 0.55, 0, g);
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

  // Town blocks + trees
  const pastel = ["#D8D2C4", "#C6CFD6", "#D4BFB0", "#BFCFC6", "#CBC8D3", C.white];
  for (const bx of [25.4, 33.6]) for (const bz of [-5.25, 3]) {
    for (let i = 0; i < 4; i++) {
      const h = 1.2 + rnd() * 4;
      const x = bx + ((i % 2) - 0.5) * 3.2, z = bz + (Math.floor(i / 2) - 0.5) * 3.2;
      box(2.6, h, 2.6, pastel[Math.floor(rnd() * pastel.length)], x, h / 2, z);
      box(2.7, 0.2, 2.7, i % 3 ? C.navy2 : C.teal, x, h + 0.1, z);
    }
  }
  const treeSpots = [];
  for (let i = 0; i < 60; i++) {
    const [x, z] = [[11 + rnd() * 9, -21 + rnd() * 10], [32 + rnd() * 12, 12 + rnd() * 6], [-8 + rnd() * 9, 25 + rnd() * 6], [40 + rnd() * 4, -12 + rnd() * 20]][i % 4];
    treeSpots.push([x, z, 0.7 + rnd() * 0.6]);
  }
  const crowns = new THREE.InstancedMesh(new THREE.ConeGeometry(0.8, 2, 7), mat("#5E9E6B"), treeSpots.length);
  const o = new THREE.Object3D();
  treeSpots.forEach(([x, z, s], i) => { o.position.set(x, 1.3 * s, z); o.scale.setScalar(s); o.updateMatrix(); crowns.setMatrixAt(i, o.matrix); });
  crowns.castShadow = true;
  scene.add(crowns);

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

      // route grows with the chapter; the head pulses
      const k = Math.max(0.001, seg(s, 0.4, 4.4));
      tube.geometry.setDrawRange(0, Math.floor((tubeCount * k) / 3) * 3);
      head.position.copy(route.getPointAt(k));
      head.scale.setScalar(1 + Math.sin(time * 5) * 0.15);
      head.visible = k > 0.002;
      pins.forEach((pin) => { const on = k >= pin.userData.u - 0.01; pin.material.opacity = on ? 1 : 0.25; pin.scale.setScalar(on ? 1 + Math.sin(time * 3 + pin.userData.u * 6) * 0.08 : 0.8); });
      clouds.forEach((c) => { c.position.x = ((c.userData.x + time * c.userData.speed + 30) % 80) - 30; });

      // traffic
      docked.position.y = -0.4 + Math.sin(time * 1.2) * 0.08;
      sailing.position.z = ((time * 1.6) % 70) - 35;
      sailing.position.y = -0.4 + Math.sin(time * 1.1 + 1) * 0.08;
      train.position.x = ((time * 4) % 62) - 10;
      trucks.forEach((tr, k2) => place(tr, roadLoop, time * 0.025 + k2 / trucks.length, 0.6));
      vans.forEach((v, k2) => place(v, townLoop, time * 0.03 + k2 / vans.length, 0.5));
      return true;
    },
  };
}
