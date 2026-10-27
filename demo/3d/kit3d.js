// Pembantu bersama demo 3D bergulir (dimuat oleh scene, jadi tidak diunduh pada mode gambar diam).
import { canvasTexture, blobShadow, clamp, smooth, mix, seg } from "./scroll3d.js";
export { canvasTexture, blobShadow, clamp, smooth, mix, seg };

// Cahaya lingkungan murah (PMREM dari RoomEnvironment), dibuat sekali per renderer.
export async function applyEnv(THREE, ctx, scene, intensity = 0.7) {
  if (!ctx._env) {
    const { RoomEnvironment } = await import("./RoomEnvironment.js");
    const pm = new THREE.PMREMGenerator(ctx.renderer);
    ctx._env = pm.fromScene(new RoomEnvironment(), 0.04).texture;
    pm.dispose();
  }
  scene.environment = ctx._env;
  scene.environmentIntensity = intensity;
}

// Kotak bersudut membulat (ExtrudeGeometry), berpusat di asal; sisi tebal d pada sumbu z.
export function roundedBox(THREE, w, h, d, r = 0.05, seg = 4) {
  const s = new THREE.Shape();
  const x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const b = Math.min(r * 0.5, d * 0.25);
  const g = new THREE.ExtrudeGeometry(s, { depth: d - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: seg, curveSegments: 6 });
  g.translate(0, 0, -(d - 2 * b) / 2);
  // UV bidang depan/belakang = proporsi kotak
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + w / 2) / w, (p.getY(i) + h / 2) / h);
  return g;
}

export const lerp3 = (a, b, t) => [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)];

// Hapus objek 3D dari memori
export function disposeTree(o) {
  o.traverse((n) => {
    if (n.geometry) n.geometry.dispose();
    if (n.material) [].concat(n.material).forEach((m) => { Object.values(m).forEach((v) => v && v.isTexture && v.dispose()); m.dispose(); });
  });
}
