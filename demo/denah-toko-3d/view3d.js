// Tampilan 3D denah: Three.js lokal, kamera orbit tulis sendiri (seret ruang kosong = putar, gulir/cubit = zoom),
// seret objek = geser di lantai (raycast ke bidang lantai, menempel kisi). Render hanya saat ada perubahan dan berhenti saat tab tersembunyi.
import * as THREE from "three";
import { roundedBox, canvasTexture } from "../3d/kit3d.js";
import { ROOM, TYPES, foot } from "./model.js";

const COL = { floor: "#A88B6C", wood: "#8C6B52", fabric: "#5B6B5A", metal: "#6B6560", counter: "#7A5238", wall: "#D9CFBC", sel: "#2F4A3A", bad: "#8A4426" };

function build(it) {
  const g = new THREE.Group();
  const t = TYPES[it.type];
  const std = (c, r = 0.65, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
  const w = t.w, d = t.d;
  if (t.kind === "meja") {
    const top = new THREE.Mesh(roundedBox(THREE, w, d, 0.06, 0.04), std(COL.wood, 0.55)); top.rotation.x = -Math.PI / 2; top.position.y = 0.72; g.add(top);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.7, 8), std("#5A4636", 0.7)); l.position.set(a * (w / 2 - 0.07), 0.35, b * (d / 2 - 0.07)); g.add(l); });
  } else if (t.kind === "kursi") {
    const seat = new THREE.Mesh(roundedBox(THREE, w, d, 0.07, 0.04), std(COL.fabric, 0.9)); seat.rotation.x = -Math.PI / 2; seat.position.y = 0.45; g.add(seat);
    const back = new THREE.Mesh(roundedBox(THREE, w, 0.38, 0.05, 0.03), std(COL.fabric, 0.9)); back.position.set(0, 0.7, -d / 2 + 0.03); g.add(back);
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.43, 6), std("#4A3C30", 0.7)); l.position.set(a * (w / 2 - 0.05), 0.215, b * (d / 2 - 0.05)); g.add(l); });
  } else if (t.kind === "rak") {
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, 1.7, d), std("#8A847C", 0.6, 0.05)); frame.position.y = 0.85; g.add(frame);
    for (let i = 0; i < 4; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(w * 1.01, 0.04, d * 1.02), std("#6A645E", 0.7, 0.05)); s.position.y = 0.3 + i * 0.45; g.add(s); }
  } else {
    const body = new THREE.Mesh(roundedBox(THREE, w, 0.95, d, 0.05), std(COL.counter, 0.6)); body.position.y = 0.475; g.add(body);
    const slab = new THREE.Mesh(new THREE.BoxGeometry(w + 0.06, 0.05, d + 0.06), std("#D8CDB9", 0.4)); slab.position.y = 0.98; g.add(slab);
    const pos = new THREE.Mesh(roundedBox(THREE, 0.4, 0.3, 0.05, 0.03), std("#2B2B2B", 0.4)); pos.position.set(-w * 0.25, 1.15, 0); pos.rotation.x = -0.3; g.add(pos);
  }
  const f = foot(it);
  // cincin petak di lantai (terlihat saat terpilih)
  const ring = new THREE.Group();
  const bar = (bw, bd, x, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(bw, 0.012, bd), new THREE.MeshBasicMaterial({ color: COL.sel, toneMapped: false })); b.position.set(x, 0.008, z); ring.add(b); };
  const rw = (t.w) + 0.14, rd = (t.d) + 0.14;
  bar(rw, 0.05, 0, -rd / 2); bar(rw, 0.05, 0, rd / 2); bar(0.05, rd, -rw / 2, 0); bar(0.05, rd, rw / 2, 0);
  ring.visible = false; g.add(ring);
  g.userData = { id: it.id, ring, body: g.children.slice(0, -1), foot: f };
  return g;
}

export async function createView3D(host, ctrl, { small }) {
  const canvas = document.createElement("canvas");
  canvas.className = "denah-canvas";
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", "Denah kedai Kopi Rindang dalam 3D (proyek konsep). Daftar objek ada di panel samping.");
  host.appendChild(canvas);
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, small ? 1 : 1.5));
  renderer.toneMapping = THREE.NeutralToneMapping;
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff4e2, 0x7b6a55, 1.0));
  const sun = new THREE.DirectionalLight(0xfff0d8, 1.6); sun.position.set(4, 9, 7); scene.add(sun);

  // lantai papan kayu (selisih nada) + kisi 0,5 m + dinding rendah di dua sisi
  const planks = canvasTexture(THREE, 512, 512, (g, w, h) => {
    const n = 13; for (let i = 0; i < n; i++) { g.fillStyle = i % 2 ? "#A38666" : "#AC8F70"; g.fillRect(0, (i * h) / n, w, h / n); }
    g.fillStyle = "rgba(90,70,50,.22)"; for (let i = 0; i < n; i++) g.fillRect(0, (i * h) / n, w, 2);
  });
  planks.wrapS = planks.wrapT = THREE.RepeatWrapping; planks.repeat.set(1, 1);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.w, ROOM.d), new THREE.MeshStandardMaterial({ map: planks, roughness: 0.85 }));
  floor.rotation.x = -Math.PI / 2; floor.position.set(ROOM.w / 2, 0, ROOM.d / 2); scene.add(floor);
  const pts = [];
  for (let x = 0; x <= ROOM.w + 1e-6; x += 0.5) pts.push(x, 0.004, 0, x, 0.004, ROOM.d);
  for (let z = 0; z <= ROOM.d + 1e-6; z += 0.5) pts.push(0, 0.004, z, ROOM.w, 0.004, z);
  const gg = new THREE.BufferGeometry(); gg.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
  scene.add(new THREE.LineSegments(gg, new THREE.LineBasicMaterial({ color: "#8F7F70", transparent: true, opacity: 0.35 })));
  const wallMat = new THREE.MeshStandardMaterial({ color: COL.wall, roughness: 0.9 });
  const w1 = new THREE.Mesh(new THREE.BoxGeometry(ROOM.w + 0.24, 1.6, 0.12), wallMat); w1.position.set(ROOM.w / 2, 0.8, -0.06);
  const w2 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.6, ROOM.d), wallMat); w2.position.set(-0.06, 0.8, ROOM.d / 2);
  scene.add(w1, w2);

  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 80);
  const target = new THREE.Vector3(ROOM.w / 2, 0, ROOM.d / 2);
  const cam = { th: 0.45, ph: 0.95, z: 1, tth: 0.45, tph: 0.95 };
  let top = false, aspect = 1.4, dirty = true, raf = 0, visible = true;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fit = () => { const t = Math.tan((35 / 2) * Math.PI / 180); return Math.max((ROOM.d * 1.18) / (2 * t), (ROOM.w * 1.18) / (2 * t * aspect)); };
  const place = () => {
    const r = fit() * cam.z;
    camera.position.set(target.x + r * Math.sin(cam.ph) * Math.sin(cam.th), target.y + r * Math.cos(cam.ph), target.z + r * Math.sin(cam.ph) * Math.cos(cam.th));
    camera.up.set(0, 1, 0); camera.lookAt(target);
  };

  const groups = new Map();
  const rays = new THREE.Raycaster(), ndc = new THREE.Vector2(), plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hitPt = new THREE.Vector3();
  const setNdc = (e) => { const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); rays.setFromCamera(ndc, camera); };
  const floorPt = (e) => { setNdc(e); return rays.ray.intersectPlane(plane, hitPt) ? hitPt : null; };
  const pick = (e) => { setNdc(e); const h = rays.intersectObjects([...groups.values()], true)[0]; if (!h) return null; let o = h.object; while (o && !o.userData.id) o = o.parent; return o ? o.userData.id : null; };

  const draw = () => { raf = 0; if (!visible || document.hidden) return; let moving = false;
    if (reduce) { cam.th = cam.tth; cam.ph = cam.tph; } else {
      const dth = cam.tth - cam.th, dph = cam.tph - cam.ph;
      if (Math.abs(dth) > 0.002 || Math.abs(dph) > 0.002) { cam.th += dth * 0.18; cam.ph += dph * 0.18; moving = true; } else { cam.th = cam.tth; cam.ph = cam.tph; }
    }
    place(); renderer.render(scene, camera); dirty = false;
    if (moving) raf = requestAnimationFrame(draw);
  };
  const kick = () => { dirty = true; if (!raf) raf = requestAnimationFrame(draw); };
  document.addEventListener("visibilitychange", () => { if (!document.hidden) kick(); });
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(host);

  // ---- pointer: pilih/geser objek, putar kamera, zoom ----
  const ptrs = new Map();
  let mode = null, drag = null, orbit = null, pinch = 0;
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (ptrs.size === 2) { mode = "pinch"; const [a, b] = [...ptrs.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); if (drag) { ctrl.endDrag(); drag = null; } return; }
    const id = pick(e);
    if (id) {
      const it = ctrl.items().find((o) => o.id === id), p = floorPt(e);
      ctrl.select(id); ctrl.beginDrag(id);
      drag = { dx: p ? it.x - p.x : 0, dz: p ? it.z - p.z : 0 }; mode = "drag";
    } else { ctrl.select(null); mode = top ? null : "orbit"; orbit = { x: e.clientX, y: e.clientY }; }
    canvas.classList.add("grabbing");
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!ptrs.has(e.pointerId)) { canvas.style.cursor = pick(e) ? "grab" : ""; return; }
    ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (mode === "pinch" && ptrs.size === 2) { const [a, b] = [...ptrs.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); cam.z = Math.min(1.4, Math.max(0.45, cam.z * (pinch / d))); pinch = d; kick(); }
    else if (mode === "drag") { const p = floorPt(e); if (p) ctrl.dragTo(p.x + drag.dx, p.z + drag.dz); }
    else if (mode === "orbit") { cam.tth -= (e.clientX - orbit.x) * 0.008; cam.th = cam.tth; cam.tph = Math.min(1.35, Math.max(0.35, cam.tph - (e.clientY - orbit.y) * 0.006)); cam.ph = cam.tph; orbit = { x: e.clientX, y: e.clientY }; kick(); }
  });
  const up = (e) => { ptrs.delete(e.pointerId); if (mode === "drag") ctrl.endDrag(); if (!ptrs.size) { mode = null; drag = null; canvas.classList.remove("grabbing"); } else if (ptrs.size < 2 && mode === "pinch") mode = null; };
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); cam.z = Math.min(1.4, Math.max(0.45, cam.z * (1 + Math.sign(e.deltaY) * 0.08))); kick(); }, { passive: false });

  return {
    kind: "3d",
    sync(items, sel, invalid) {
      const ids = new Set(items.map((i) => i.id));
      groups.forEach((g, id) => { if (!ids.has(id)) { scene.remove(g); groups.delete(id); } });
      items.forEach((it) => {
        let g = groups.get(it.id);
        if (!g) { g = build(it); scene.add(g); groups.set(it.id, g); }
        const on = it.id === sel;
        g.position.set(it.x, on ? 0.02 : 0, it.z); g.rotation.y = (it.rot * Math.PI) / 180;
        g.userData.ring.visible = on;
        g.userData.ring.children.forEach((b) => b.material.color.set(it.id === invalid ? COL.bad : COL.sel));
      });
      kick();
    },
    resize() { const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix(); kick(); },
    setTop(v) { top = v; cam.tph = v ? 0.02 : 0.95; cam.tth = v ? 0 : 0.45; if (reduce) { cam.ph = cam.tph; cam.th = cam.tth; } kick(); },
    dispose() { renderer.dispose(); canvas.remove(); },
  };
}
