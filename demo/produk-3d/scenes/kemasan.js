// Bab 1 · Kemasan: tiga kemasan berderet di sawah bertingkat. Gulir memfokuskan satu rasa; seret memutar kemasan.
import { mix, applyEnv } from "../../3d/kit3d.js";
import { pouchAssets, pouchInstance, chipsMesh, ground } from "../pouch.js";
import { state, setRasa } from "../state.js";

const PANELS = 4; // samakan dengan jumlah .panel pada bab ini

export async function create(THREE, ctx, el) {
  const A = await pouchAssets(THREE);
  const scene = new THREE.Scene();
  await applyEnv(THREE, ctx, scene, 0.8);
  scene.add(new THREE.HemisphereLight(0xfff0d2, 0x6b6040, 0.8));
  const key = new THREE.DirectionalLight(0xfff0d0, 1.5); key.position.set(3, 6, 5); scene.add(key);
  scene.add(ground(THREE, "#BDB08A", "#B3A680"));
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);

  const ps = [0, 1, 2].map((i) => { const g = pouchInstance(THREE, A, i); scene.add(g); return g; });
  const f = [0, 0, 0];

  // keripik berserakan di depan kemasan (posisi tetap, acak berbenih)
  const chips = chipsMesh(THREE, 22);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 22; i++) {
    e.set((rnd() - 0.5) * 0.4, rnd() * 6.28, (rnd() - 0.5) * 0.4);
    q.setFromEuler(e);
    m.compose(new THREE.Vector3((rnd() - 0.5) * 7, 0.03 + (i % 3) * 0.002, 1.1 + rnd() * 1.6), q, new THREE.Vector3(1, 1, 1).multiplyScalar(0.8 + rnd() * 0.5));
    chips.setMatrixAt(i, m);
  }
  scene.add(chips);

  let aspect = 1.6, sp = 2, lastK = 0, portrait = false;
  const look = new THREE.Vector3();
  return {
    scene, camera,
    resize(w, h) {
      aspect = w / h; portrait = aspect < 0.9;
      sp = portrait ? 1.25 : 1.75;
      camera.aspect = aspect;
      if (portrait) camera.setViewOffset(w, h, 0, h * 0.12, w, h);
      else if (w > 900) camera.setViewOffset(w, h, -w * 0.24, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    },
    update(p, dt, time) {
      const s = p * (PANELS - 1);
      const k = Math.round(s);
      if (k !== lastK) { lastK = k; if (k >= 1) setRasa(k - 1, false); }
      const focusIdx = s >= 0.5 || state.manual ? state.rasa : -1;
      let any = 0;
      for (let i = 0; i < 3; i++) {
        f[i] += ((focusIdx === i ? 1 : 0) - f[i]) * Math.min(1, dt * 5);
        any = Math.max(any, f[i]);
      }
      ps.forEach((g, i) => {
        const rest = (i - 1) * sp;
        const bx = rest * (1 + 0.45 * any), bz = -1.3 * any, bs = mix(1, 0.8, any);
        g.position.set(mix(bx, 0, f[i]), Math.sin(time * 0.9 + i * 2) * 0.025, mix(bz, 0.5, f[i]));
        g.scale.setScalar(mix(bs, 1.18, f[i]));
        g.rotation.y = (1 - i) * 0.3 * (1 - f[i]) * (1 - 0.7 * any) + ctx.spin + Math.sin(time * 0.6 + i) * 0.05;
      });
      const dRest = portrait ? 14.5 : 9.8, dFoc = portrait ? 10.5 : 8.6;
      const d = mix(dRest, dFoc, any);
      camera.position.set(Math.sin(time * 0.2) * 0.25, mix(2.4, 2.1, any), d);
      look.set(0, 1.15, 0); camera.lookAt(look);
      return true;
    },
  };
}
