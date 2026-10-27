// Bab 2 · Proses: papan iris singkong, wajan penggorengan, lalu keripik yang dibumbui dan dikemas. Satu benda utama per panel.
import { mix, seg, applyEnv } from "../../3d/kit3d.js";
import { pouchAssets, pouchInstance, chipsMesh, ground } from "../pouch.js";

const PANELS = 3;

export async function create(THREE, ctx, el) {
  const A = await pouchAssets(THREE);
  const scene = new THREE.Scene();
  await applyEnv(THREE, ctx, scene, 0.7);
  scene.add(new THREE.HemisphereLight(0xfff0d2, 0x5f6a48, 0.8));
  const key = new THREE.DirectionalLight(0xfff0d0, 1.5); key.position.set(3, 6, 4); scene.add(key);
  scene.add(ground(THREE, "#A9B08B", "#9FA783"));
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 80);
  const std = (c, r = 0.7, mt = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: mt });
  const rnd = (() => { let s = 11; return () => ((s = (s * 16807) % 2147483647) / 2147483647); })();
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), S = new THREE.Vector3();

  // A · papan + umbi + irisan
  const A1 = new THREE.Group();
  const board = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.14, 2.6), std("#8F6E4B", 0.85)); board.position.y = 0.07; A1.add(board);
  for (let i = 0; i < 2; i++) {
    const root = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.34, 2.1, 14), std("#6E4B2C", 0.9));
    root.rotation.z = Math.PI / 2; root.rotation.y = i ? 0.35 : -0.2; root.position.set(-1.35, 0.4 + i * 0.05, -0.55 + i * 0.95); A1.add(root);
  }
  const slices = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.34, 0.34, 0.028, 22), std("#F0E4C0", 0.7), 16);
  for (let i = 0; i < 16; i++) {
    E.set(0, i * 0.4, 0); Q.setFromEuler(E);
    M.compose(V.set(0.3 + (i % 8) * 0.28 - (i > 7 ? 0.1 : 0), 0.16 + (i > 7 ? 0.03 : 0), -0.5 + (i > 7 ? 1.0 : 0) + (rnd() - 0.5) * 0.12), Q, S.set(1, 1, 1));
    slices.setMatrixAt(i, M);
  }
  A1.add(slices);
  scene.add(A1);

  // B · wajan + minyak + keripik mengapung + gelembung
  const B = new THREE.Group();
  const prof = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * (Math.PI / 2.3); prof.push(new THREE.Vector2(Math.sin(a) * 1.7, 0.95 - Math.cos(a) * 0.95)); }
  const wok = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), std("#3B3834", 0.45, 0.7)); wok.material.side = THREE.DoubleSide; wok.position.y = 0.35; B.add(wok);
  const oil = new THREE.Mesh(new THREE.CircleGeometry(1.36, 36), std("#B27D2A", 0.25)); oil.rotation.x = -Math.PI / 2; oil.position.y = 0.55; B.add(oil);
  const fry = chipsMesh(THREE, 26, "#D3A13B", 0.2); B.add(fry);
  const fryData = Array.from({ length: 26 }, () => ({ a: rnd() * 6.28, r: Math.sqrt(rnd()) * 1.1, ph: rnd() * 6.28, sp: 0.1 + rnd() * 0.25 }));
  const bub = new THREE.InstancedMesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshStandardMaterial({ color: "#F2DCA0", roughness: 0.2, transparent: true, opacity: 0.7 }), 18);
  B.add(bub);
  const handle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.7, 10), std("#5A4330", 0.8)); handle.rotation.z = Math.PI / 2 - 0.12; handle.position.set(2.45, 0.9, 0); B.add(handle);
  const bowlP = []; for (let i = 0; i <= 8; i++) { const a = (i / 8) * (Math.PI / 2); bowlP.push(new THREE.Vector2(Math.sin(a) * 0.6, 0.45 - Math.cos(a) * 0.45)); }
  const salt = new THREE.Mesh(new THREE.LatheGeometry(bowlP, 24), std("#E6DDC6", 0.6)); salt.material.side = THREE.DoubleSide; salt.position.set(-2.5, 0.2, 0.9); B.add(salt);
  const mound = new THREE.Mesh(new THREE.SphereGeometry(0.46, 14, 8, 0, 6.3, 0, 1.2), std("#F4F1E6", 0.9)); mound.position.set(-2.5, 0.42, 0.9); B.add(mound);
  scene.add(B);

  // C · piring keripik + bumbu + kemasan tertutup
  const C = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(1.75, 1.5, 0.1, 40), std("#D8CCAE", 0.5)); plate.position.y = 0.05; C.add(plate);
  const heap = chipsMesh(THREE, 70, "#D3A13B", 0.22); C.add(heap);
  for (let i = 0; i < 70; i++) {
    const r = Math.sqrt(rnd()) * 1.25, a = rnd() * 6.28, h = Math.max(0, 0.75 - r * 0.55);
    E.set((rnd() - 0.5) * 0.7, rnd() * 6.28, (rnd() - 0.5) * 0.7); Q.setFromEuler(E);
    M.compose(V.set(Math.cos(a) * r, 0.12 + h * (0.4 + rnd() * 0.6), Math.sin(a) * r), Q, S.set(1, 1, 1).multiplyScalar(0.9 + rnd() * 0.5)); heap.setMatrixAt(i, M);
  }
  const shaker = new THREE.Group();
  shaker.add(new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.7, 18), std("#C7BDA6", 0.15, 0.1)));
  const lid = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.14, 18), std("#6A6A66", 0.35, 0.8)); lid.position.y = 0.42; shaker.add(lid);
  shaker.position.set(2.5, 0.35, 0.7); C.add(shaker);
  const bag = pouchInstance(THREE, A, 0); bag.position.set(-2.7, 0, -0.9); bag.rotation.y = 0.4; bag.scale.setScalar(0.9); C.add(bag);
  scene.add(C);

  const tgt = new THREE.Vector3();
  let portrait = false;
  return {
    scene, camera,
    resize(w, h) {
      const a = w / h; portrait = a < 0.9;
      camera.aspect = a;
      if (portrait) camera.setViewOffset(w, h, 0, h * 0.12, w, h);
      else if (w > 900) camera.setViewOffset(w, h, -w * 0.22, 0, w, h);
      else camera.clearViewOffset();
      camera.updateProjectionMatrix();
    },
    update(p, dt, time) {
      const s = p * (PANELS - 1);
      [A1, B, C].forEach((g, k) => {
        const v = seg(Math.max(0, 1 - Math.abs(s - k) * 1.5), 0, 1);
        g.visible = v > 0.01; g.scale.setScalar(Math.max(0.001, v)); g.position.y = (1 - v) * -0.6; g.rotation.y = (k - s) * 0.5 + ctx.spin * 0.5;
      });
      // wajan: keripik bergerak pelan, gelembung naik
      fryData.forEach((c, i) => {
        const a = c.a + time * c.sp;
        E.set(0.1 * Math.sin(time + c.ph), a * 2, 0.1 * Math.cos(time * 0.8 + c.ph)); Q.setFromEuler(E);
        M.compose(V.set(Math.cos(a) * c.r, 0.6 + Math.sin(time * 1.4 + c.ph) * 0.02, Math.sin(a) * c.r), Q, S.set(1, 1, 1)); fry.setMatrixAt(i, M);
      });
      fry.instanceMatrix.needsUpdate = true;
      for (let i = 0; i < 18; i++) {
        const t = (time * 0.35 + i / 18) % 1, a = i * 2.4;
        M.compose(V.set(Math.cos(a) * (0.3 + (i % 5) * 0.2), 0.58 + t * 0.35, Math.sin(a) * (0.3 + (i % 4) * 0.22)), Q.identity(), S.set(1, 1, 1).multiplyScalar(Math.sin(t * Math.PI) * 1.2 + 0.05)); bub.setMatrixAt(i, M);
      }
      bub.instanceMatrix.needsUpdate = true;
      const dist = portrait ? 11.5 : 6.6;
      camera.position.set(Math.sin(time * 0.2) * 0.3, dist * 0.52, dist);
      tgt.set(0, 0.4, 0); camera.lookAt(tgt);
      return true;
    },
  };
}
