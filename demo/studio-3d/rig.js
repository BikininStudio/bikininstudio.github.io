// Kamera untuk tiap bab di atas dunia meja yang sama.
import { mix, seg, clamp } from "../3d/kit3d.js";
import { getWorld, ITEMS } from "./world.js";
import { setLayanan } from "./state.js";

export async function createApp(THREE, ctx, mode) {
  const W = await getWorld(THREE, ctx);
  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 120);
  const V = new THREE.Vector3(), L = new THREE.Vector3();
  let portrait = false;
  const over = (t) => (portrait ? [0, 15.5 + t * 2, 26] : [0, 9.2 + t * 1.5, 15.8 + t * 2]);
  const overLook = () => (portrait ? [0, 0, 0] : [0, 0.2, 0.2]);
  const focus = (k) => {
    const p = W.items[k].position;
    return { cam: portrait ? [p.x, 6.4, p.z + 12] : [p.x * 0.85, 4.0, p.z + 7.0], look: [p.x, 0.55, p.z] };
  };
  const lerp3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  const pose = (name, p, s, time) => {
    if (name === "meja") { const f = focus(0), t = seg(p, 0.35, 1); return { c: lerp3(over(0), f.cam, t), l: lerp3(overLook(), f.look, t), w: [0, 0, 0, 0] }; }
    if (name === "pesan") return { c: over(0.6), l: overLook(), w: [1, 1, 1, 1].map((x) => x * 0.55) };
    const i = Math.min(2, Math.floor(s)), t = seg(s - i, 0.2, 0.8);
    const a = focus(i), b = focus(i + 1);
    return { c: lerp3(a.cam, b.cam, t), l: lerp3(a.look, b.look, t), w: [0, 1, 2, 3].map((k) => clamp(1 - Math.abs(s - k) * 1.4)) };
  };
  return {
    scene: W.scene, camera,
    resize(w, h) {
      const a = w / h; portrait = a < 0.9;
      if (W.portrait !== portrait) W.layout(portrait);
      camera.aspect = a;
      if (portrait) camera.setViewOffset(w, h, 0, h * (mode === "meja" ? 0.14 : 0.27), w, h);
      else if (w > 900) camera.setViewOffset(w, h, -w * 0.2, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
      W.camera = camera;
    },
    update(p, dt, time) {
      W.camera = camera; W.mode = mode;
      const s = p * 3;
      const o = pose(mode, p, s, time);
      camera.position.set(o.c[0] + Math.sin(time * 0.25) * 0.25, o.c[1], o.c[2]);
      camera.lookAt(V.set(o.l[0], o.l[1], o.l[2]));
      W.tick(time, o.w);
      if (mode === "layanan") setLayanan(ITEMS[Math.round(s)].layanan);
      return true;
    },
  };
}
