// Kamera berjalan di sepanjang lorong, berhenti satu panel per karya. Tanpa ayunan kepala (mencegah mabuk gerak).
import { mix, seg, clamp } from "../3d/kit3d.js";
import { getWorld, ZK, WX } from "./world.js";
import { setKarya } from "./state.js";

export async function createApp(THREE, ctx, mode) {
  const W = await getWorld(THREE, ctx);
  const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 80);
  const V = new THREE.Vector3();
  let portrait = false;
  const stop = (k) => ({ c: [-0.7, 1.7, ZK[k] + (portrait ? 5.6 : 4.6)], l: [WX, 1.7, ZK[k]] });
  const l3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];
  const pose = (p, s) => {
    if (mode === "pintu") { const a = { c: [0, 1.7, 5.2], l: [0, 1.7, -12] }, b = stop(0), t = seg(p, 0.1, 1); return { c: l3(a.c, b.c, t), l: l3(a.l, b.l, t), w: [0, 0, 0, 0, 0, 0] }; }
    if (mode === "pesan") return { c: [0, 1.8, -35.6], l: [0, 1.7, -8], w: [1, 1, 1, 1, 1, 1].map((x) => x * 0.6) };
    const i = Math.min(4, Math.floor(s)), t = seg(s - i, 0.15, 0.85), a = stop(i), b = stop(i + 1);
    return { c: l3(a.c, b.c, t), l: l3(a.l, b.l, t), w: [0, 1, 2, 3, 4, 5].map((k) => clamp(1 - Math.abs(s - k) * 1.5)) };
  };
  return {
    scene: W.scene, camera,
    resize(w, h) {
      const a = w / h; portrait = a < 0.9;
      camera.aspect = a; camera.fov = portrait ? 62 : 52;
      if (portrait) camera.setViewOffset(w, h, 0, h * (mode === "galeri" ? 0.24 : 0.14), w, h);
      else if (w > 900 && mode === "galeri") camera.setViewOffset(w, h, -w * 0.16, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    },
    update(p, dt, time) {
      const s = p * 5, o = pose(p, s);
      camera.position.set(o.c[0], o.c[1], o.c[2]);
      camera.lookAt(V.set(o.l[0], o.l[1], o.l[2]));
      W.tick(time, o.w);
      if (mode === "galeri") setKarya(Math.round(s));
      return true;
    },
  };
}
