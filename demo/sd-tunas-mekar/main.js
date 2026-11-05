import { THREE, stage, drag, webglOK, reduced } from '../3d/lib.js';

const ROOMS = [
  { id: 'kelas', nama: 'Ruang kelas 1–6', warna: '#E9C46A', pos: [-2.2, 0, -1.2], size: [4.2, 1, 1.6],
    teks: 'Enam kelas berjajar menghadap kebun. Tiap kelas punya jendela lebar, rak buku sendiri, dan pintu langsung ke teras supaya anak tidak berdesakan di lorong.' },
  { id: 'masjid', nama: 'Musala', warna: '#7FB58A', pos: [2.6, 0, -1.6], size: [1.6, 1.1, 1.6], kubah: true,
    teks: 'Muat 200 anak. Dipakai salat duha dan zuhur berjamaah, juga ruang mengaji metode Ummi untuk kelas kecil.' },
  { id: 'perpus', nama: 'Perpustakaan', warna: '#E07A5F', pos: [2.6, 0, 1.2], size: [1.6, .9, 1.4],
    teks: '2.300 buku anak, 70% berbahasa Indonesia. Tiap anak pinjam dua buku seminggu, dan Kamis pagi ada jam baca bersama orang tua.' },
  { id: 'lapangan', nama: 'Lapangan & kebun', warna: '#A7C957', pos: [-1.6, 0, 1.6], size: [3, .05, 1.8], datar: true,
    teks: 'Lapangan rumput untuk upacara dan olahraga, kebun sayur 12 petak yang dirawat bergiliran per kelas.' },
  { id: 'tu', nama: 'Kantor & UKS', warna: '#9BB1C9', pos: [.5, 0, -1.6], size: [1.2, .8, 1.2],
    teks: 'Ruang guru, tata usaha, dan UKS dengan satu kasur dan perawat jaga sampai jam pulang. Pendaftaran SPMB dilayani di sini.' },
];
let aktif = 'kelas';

const roomsEl = document.getElementById('rooms'), info = document.getElementById('info');
ROOMS.forEach(r => {
  const b = document.createElement('button');
  b.type = 'button'; b.role = 'tab'; b.dataset.id = r.id;
  b.innerHTML = `<i style="background:${r.warna}"></i>${r.nama}`;
  b.addEventListener('click', () => pilih(r.id));
  roomsEl.appendChild(b);
});
let onPilih = () => {};
function pilih(id) {
  aktif = id;
  const r = ROOMS.find(x => x.id === id);
  [...roomsEl.children].forEach(b => b.setAttribute('aria-selected', b.dataset.id === id));
  info.innerHTML = `<h3>${r.nama}</h3><p>${r.teks}</p>`;
  onPilih(r);
}

const host = document.getElementById('stage');
if (!webglOK()) { document.documentElement.classList.add('nogl'); pilih(aktif); }
else {
  const { scene, camera, onFrame } = stage(host, { fov: 30, pos: [0, 7, 9] });
  scene.add(new THREE.HemisphereLight(0xffffff, 0xb9c9a8, 1.6));
  const sun = new THREE.DirectionalLight(0xfff4dc, 2.2); sun.position.set(-4, 8, 5); scene.add(sun);

  const world = new THREE.Group(); scene.add(world);
  const ground = new THREE.Mesh(new THREE.BoxGeometry(9, .2, 6.2), new THREE.MeshStandardMaterial({ color: 0xdfe8d3, roughness: 1 }));
  ground.position.y = -.1; world.add(ground);
  const path = new THREE.Mesh(new THREE.BoxGeometry(.7, .02, 6.2), new THREE.MeshStandardMaterial({ color: 0xf1ead6 }));
  path.position.set(.9, .01, 0); world.add(path);

  const lambert = c => new THREE.MeshStandardMaterial({ color: c, roughness: .85, flatShading: true });
  const blocks = {};
  ROOMS.forEach(r => {
    const g = new THREE.Group(); g.position.set(...r.pos);
    const [w, h, d] = r.size;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lambert(r.datar ? r.warna : 0xfaf6ea));
    body.position.y = h / 2; g.add(body);
    if (!r.datar) {
      // atap pelana
      const tri = new THREE.Shape();
      const ov = .14, rh = r.kubah ? .12 : d * .38;
      tri.moveTo(-d / 2 - ov, 0); tri.lineTo(d / 2 + ov, 0); tri.lineTo(0, rh); tri.closePath();
      const rg = new THREE.ExtrudeGeometry(tri, { depth: w + ov * 2, bevelEnabled: false });
      rg.translate(0, 0, -(w + ov * 2) / 2);
      const roof = new THREE.Mesh(rg, lambert(r.warna));
      roof.rotation.y = Math.PI / 2; roof.position.y = h; g.add(roof);
      if (r.kubah) {
        const dome = new THREE.Mesh(new THREE.SphereGeometry(.42, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), lambert(0xd9b44a));
        dome.position.y = h + .12; g.add(dome);
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(.09, .12, 2, 8), lambert(0xfaf6ea));
        tower.position.set(w / 2 + .3, 1, d / 2 - .2); g.add(tower);
      }
      // jendela
      const win = lambert(0x3d5a73), n = Math.max(1, Math.round(w / .7));
      for (let i = 0; i < n; i++) {
        const m = new THREE.Mesh(new THREE.BoxGeometry(.28, .3, .02), win);
        m.position.set(-w / 2 + (i + .5) * (w / n), h * .55, d / 2 + .01); g.add(m);
      }
    } else {
      for (let i = 0; i < 6; i++) {
        const bed = new THREE.Mesh(new THREE.BoxGeometry(.38, .1, .6), lambert(0x7a5a3a));
        bed.position.set(-w / 2 + .35 + i * .45, .08, -d / 2 + .5); g.add(bed);
      }
    }
    g.userData.r = r; world.add(g); blocks[r.id] = g;
  });
  // pohon
  [[-4, 2.6], [-3.9, -2.6], [4, 2.7], [3.9, -.2], [-.3, 2.6], [1.6, 2.6], [-4.1, 0]].forEach(([x, z], i) => {
    const t = new THREE.Group(); t.position.set(x, 0, z);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.05, .07, .4, 6), lambert(0x7a5a3a)); trunk.position.y = .2;
    const top = new THREE.Mesh(new THREE.IcosahedronGeometry(.32 + (i % 3) * .06, 0), lambert(i % 2 ? 0x4f8a4b : 0x3f7a45)); top.position.y = .6;
    t.add(trunk, top); world.add(t);
  });

  // penanda ruang terpilih
  const ring = new THREE.Mesh(new THREE.RingGeometry(.9, 1.02, 48), new THREE.MeshBasicMaterial({ color: 0x1f5a3d, side: THREE.DoubleSide }));
  ring.rotation.x = -Math.PI / 2; ring.position.y = .03; world.add(ring);

  let ang = .5, tAng = .5, focus = new THREE.Vector3(), tFocus = new THREE.Vector3(), ringScale = 1;
  onPilih = r => {
    tFocus.set(r.pos[0], 0, r.pos[2]);
    ring.position.x = r.pos[0]; ring.position.z = r.pos[2];
    ringScale = Math.max(r.size[0], r.size[2]) * .7;
    Object.values(blocks).forEach(b => b.userData.lift = b.userData.r.id === r.id ? .25 : 0);
  };
  pilih(aktif);
  drag(host, dx => { tAng -= dx * .008; });

  onFrame((dt, t) => {
    if (!reduced) tAng += dt * .05;
    ang += (tAng - ang) * Math.min(1, dt * 4);
    focus.lerp(tFocus.clone().multiplyScalar(.6), Math.min(1, dt * 3));
    const R = host.clientWidth < 600 ? 17 : 13.5;
    camera.position.set(focus.x + Math.sin(ang) * R, R * .72, focus.z + Math.cos(ang) * R);
    camera.lookAt(focus.x, .3, focus.z);
    ring.scale.setScalar(ringScale * (1 + (reduced ? 0 : Math.sin(t * 3) * .04)));
    Object.values(blocks).forEach(b => { b.position.y += ((b.userData.lift || 0) - b.position.y) * Math.min(1, dt * 6); });
  });
}
