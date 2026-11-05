import { THREE, stage, webglOK, reduced } from '../3d/lib.js';

const host = document.getElementById('stage');
if (!webglOK()) { document.documentElement.classList.add('nogl'); }
else {
  const { scene, camera, onFrame } = stage(host, { fov: 32, pos: [0, 0, 8.2] });

  // Biji kopi: bola dipipihkan, belahan tengah berbentuk S
  function bean(color) {
    const g = new THREE.SphereGeometry(1, 72, 56);
    const p = g.attributes.position, v = new THREE.Vector3();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i);
      const s = v.x - 0.16 * Math.sin(v.y * 2.4);
      const groove = Math.exp(-(s * s) / 0.006) * 0.2 * (1 - v.y * v.y * 0.6);
      v.z -= Math.sign(v.z) * groove * Math.min(1, Math.abs(v.z) * 3);
      v.set(v.x * 0.74, v.y * 1.08, v.z * 0.58);
      p.setXYZ(i, v.x, v.y, v.z);
    }
    g.computeVertexNormals();
    return new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.02 }));
  }

  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x8a6a4a, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 2.4); key.position.set(-3, 4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9b0, 1.1); rim.position.set(4, -1, -3); scene.add(rim);

  const hero = bean(0x5a2f17); hero.scale.setScalar(1.15); scene.add(hero);
  const small = [];
  [[-1.7, 1.3, -.5, .3], [1.7, .9, -.2, .26], [-1.6, -1.3, .2, .28], [1.6, -1.5, -.6, .32], [0.2, 1.9, -1, .2]].forEach(([x, y, z, s], i) => {
    const b = bean(i % 2 ? 0x6b3a1e : 0x4a2412); b.position.set(x, y, z); b.scale.setScalar(s * 1.6);
    b.rotation.set(i, i * 1.7, i * .6); b.userData = { x, y, ph: i * 1.3 }; scene.add(b); small.push(b);
  });

  let target = 0, cur = 0;
  const prog = () => { const h = document.documentElement.scrollHeight - innerHeight; return h > 0 ? scrollY / h : 0; };
  addEventListener('scroll', () => { target = prog(); }, { passive: true });

  onFrame((dt, t) => {
    cur += (target - cur) * Math.min(1, dt * 5);
    hero.rotation.y = 0.5 + (reduced ? 0 : t * 0.25) + cur * Math.PI * 3;
    hero.rotation.x = -0.15 + Math.sin(cur * 6) * 0.25;
    hero.rotation.z = 0.28;
    small.forEach(b => {
      b.position.y = b.userData.y + (reduced ? 0 : Math.sin(t * 0.7 + b.userData.ph) * 0.12) - cur * 1.2;
      b.rotation.y += reduced ? 0 : dt * 0.3;
    });
  });
}
