// Bab 3 · Pesan: kemasan rasa terpilih di depan, deretan di belakangnya mengikuti jumlah bungkus (maksimal 6 terlihat).
import { applyEnv } from "../../3d/kit3d.js";
import { pouchAssets, pouchInstance, chipsMesh, ground } from "../pouch.js";
import { state } from "../state.js";

const SLOTS = [[0, 0, 0.6], [-1.6, 0, -0.5], [1.6, 0, -0.5], [-2.9, 0, -1.5], [2.9, 0, -1.5], [0, 0, -1.9]];

export async function create(THREE, ctx, el) {
  const A = await pouchAssets(THREE);
  const scene = new THREE.Scene();
  await applyEnv(THREE, ctx, scene, 0.8);
  scene.add(new THREE.HemisphereLight(0xfff0d2, 0x6b5a40, 0.85));
  const key = new THREE.DirectionalLight(0xfff0d0, 1.5); key.position.set(-3, 6, 5); scene.add(key);
  scene.add(ground(THREE, "#C9A987", "#BF9F7E"));
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const nodes = [0, 1, 2].map((fi) => SLOTS.map((s) => {
    const g = pouchInstance(THREE, A, fi); g.position.set(s[0], 0, s[2]); g.rotation.y = -s[0] * 0.08; g.scale.setScalar(0.001); g.visible = false; scene.add(g);
    return { g, w: 0, s };
  }));
  const chips = chipsMesh(THREE, 14);
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler();
  for (let i = 0; i < 14; i++) { E.set(0, i * 1.9, 0); Q.setFromEuler(E); M.compose(new THREE.Vector3(-2.5 + i * 0.4, 0.03, 1.9 + (i % 3) * 0.3), Q, new THREE.Vector3(1, 1, 1)); chips.setMatrixAt(i, M); }
  scene.add(chips);
  let portrait = false;
  return {
    scene, camera,
    resize(w, h) {
      const a = w / h; portrait = a < 0.9; camera.aspect = a;
      if (portrait) camera.setViewOffset(w, h, 0, h * 0.14, w, h);
      else if (w > 900) camera.setViewOffset(w, h, -w * 0.24, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    },
    update(p, dt, time) {
      const n = Math.min(state.qty, SLOTS.length);
      nodes.forEach((row, fi) => row.forEach((o, j) => {
        const want = fi === state.rasa && j < n ? 1 : 0;
        o.w += (want - o.w) * Math.min(1, dt * 7);
        if (Math.abs(want - o.w) < 0.002) o.w = want;
        o.g.visible = o.w > 0.01;
        o.g.scale.setScalar(Math.max(0.001, o.w));
        o.g.position.y = Math.sin(time * 0.9 + j) * 0.02 + (1 - o.w) * 0.8;
        o.g.rotation.y = -o.s[0] * 0.08 + (j === 0 ? ctx.spin : ctx.spin * 0.4) + Math.sin(time * 0.5 + j) * 0.04;
      }));
      const dist = portrait ? 12.5 : 9.6;
      camera.position.set(Math.sin(time * 0.2) * 0.3, 2.6, dist);
      camera.lookAt(0, 1.0, 0);
      return true;
    },
  };
}
