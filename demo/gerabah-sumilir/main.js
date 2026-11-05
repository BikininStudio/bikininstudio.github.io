import { THREE, stage, drag, webglOK, reduced, rp } from '../3d/lib.js';

const BENTUK = {
  kendi: {
    nama: 'Kendi Leher Panjang', harga: 85000, ukuran: 'Tinggi 28 cm, isi 1,2 liter', aman: 'Air minum (bagian dalam berglasir)',
    desk: 'Bentuk kendi Jawa yang dulu dipakai menyimpan air dingin. Leher panjang, paruh kecil untuk dituang tanpa menyentuh bibir.',
    profil: [[0,0],[.34,.02],[.52,.14],[.62,.36],[.6,.55],[.46,.72],[.2,.8],[.13,.95],[.12,1.2],[.17,1.32],[.2,1.35]],
  },
  guci: {
    nama: 'Guci Perut Bulat', harga: 140000, ukuran: 'Tinggi 34 cm, lebar 30 cm', aman: 'Hiasan dan tanaman (tidak untuk makanan)',
    desk: 'Perut besar, mulut lebar, bibir dilipat tebal supaya tidak gampang gempil. Cocok untuk ruang tamu atau menaruh ranting kering.',
    profil: [[0,0],[.4,.02],[.7,.18],[.88,.5],[.84,.8],[.62,1.02],[.38,1.1],[.36,1.2],[.46,1.28],[.48,1.31]],
  },
  mangkuk: {
    nama: 'Mangkuk Sambal', harga: 35000, ukuran: 'Diameter 14 cm, tinggi 6 cm', aman: 'Makanan, microwave, mesin cuci piring',
    desk: 'Mangkuk kecil tebal, berat di tangan, tidak cepat dingin. Kami pakai sendiri di bengkel untuk sambal dan sayur bening.',
    profil: [[0,0],[.5,.02],[.7,.12],[.85,.3],[.95,.55],[.98,.6]],
  },
};
const GLASIR = [
  { nama: 'Tanah polos', hex: '#B5622F', r: .85, wa: 'tanah polos' },
  { nama: 'Putih susu', hex: '#EDEAE2', r: .25, wa: 'putih susu' },
  { nama: 'Hijau lumut', hex: '#6F7F55', r: .3, wa: 'hijau lumut' },
  { nama: 'Hitam arang', hex: '#262524', r: .35, wa: 'hitam arang' },
];
let bentuk = 'kendi', glasir = 0;

const $ = id => document.getElementById(id);
const bBox = $('bentuk'), gBox = $('glasir');
Object.entries(BENTUK).forEach(([k, v]) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = v.nama.split(' ')[0]; b.dataset.k = k;
  b.addEventListener('click', () => { bentuk = k; update(); }); bBox.appendChild(b);
});
GLASIR.forEach((g, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.style.background = g.hex; b.setAttribute('aria-label', g.nama);
  b.addEventListener('click', () => { glasir = i; update(); }); gBox.appendChild(b);
});

let setMesh = () => {};
function update() {
  const d = BENTUK[bentuk], g = GLASIR[glasir];
  $('nama').textContent = d.nama; $('desk').textContent = d.desk; $('ukuran').textContent = d.ukuran; $('aman').textContent = d.aman;
  $('harga').textContent = rp(d.harga); $('glasirNama').textContent = g.nama;
  $('wa').href = 'https://wa.me/6281200000000?text=' + encodeURIComponent(`Halo Sumilir, saya mau pesan ${d.nama}, glasir ${g.wa}.`);
  [...bBox.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === bentuk));
  [...gBox.children].forEach((b, i) => b.setAttribute('aria-pressed', i === glasir));
  setMesh(bentuk, g);
}

const host = $('stage');
if (!webglOK()) document.documentElement.classList.add('nogl');
else {
  const { scene, camera, onFrame, canvas } = stage(host, { fov: 30, pos: [0, 1.6, 7.2] });
  camera.lookAt(0, 0.15, 0);
  scene.add(new THREE.HemisphereLight(0xffffff, 0x9a9a95, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.6); key.position.set(-3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xffe8d6, .8); fill.position.set(4, 1, -2); scene.add(fill);

  // Bekas putaran tangan: garis melingkar tipis + noda glasir tak rata, digambar di kanvas
  const tc = document.createElement('canvas'); tc.width = 512; tc.height = 256;
  const g2 = tc.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, 512, 256);
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < 256; y += 3 + rnd() * 5) { g2.fillStyle = `rgba(0,0,0,${0.04 + rnd() * 0.06})`; g2.fillRect(0, y, 512, 1 + rnd() * 1.5); }
  for (let i = 0; i < 26; i++) { const x = rnd() * 512, y = rnd() * 256, r = 10 + rnd() * 40; const gr = g2.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(0,0,0,${0.08 + rnd() * 0.1})`); gr.addColorStop(1, 'rgba(0,0,0,0)'); g2.fillStyle = gr; g2.fillRect(x - r, y - r, r * 2, r * 2); }
  g2.fillStyle = 'rgba(0,0,0,.28)'; g2.font = '600 22px serif'; g2.fillText('S', 40, 236);
  const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 4;
  const mat = new THREE.MeshStandardMaterial({ color: GLASIR[0].hex, map: tex, roughness: .8, side: THREE.DoubleSide });
  const holder = new THREE.Group(); scene.add(holder);
  const mesh = new THREE.Mesh(new THREE.BufferGeometry(), mat); holder.add(mesh);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(1.1, 48), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: .12 }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -.01; scene.add(shadow);

  setMesh = (k, g) => {
    const d = BENTUK[k];
    // jari-jari dasar disesuaikan supaya tinggi tampil ~2 unit; garis tipis (ukiran) lewat sedikit bergelombang
    const raw = d.profil.map(([r, y]) => new THREE.Vector3(r, y, 0));
    const pts = new THREE.CatmullRomCurve3(raw, false, 'centripetal').getPoints(80).map(v => new THREE.Vector2(Math.max(v.x, 0), v.y));
    const maxR = Math.max(...pts.map(p => p.x)), H = pts[pts.length - 1].y;
    const sc = 2.1 / Math.max(H, maxR * 2);
    const geo = new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p.x * sc, p.y * sc)), 96);
    mesh.geometry.dispose(); mesh.geometry = geo;
    holder.position.y = -H * sc / 2 + 0.1;
    shadow.scale.setScalar(maxR * sc);
    shadow.position.y = holder.position.y;
    mat.color.set(g.hex); mat.roughness = g.r;
  };
  update();

  let vel = reduced ? 0 : .4, ry = 0.6;
  drag(host, dx => { ry += dx * .012; vel = 0; });
  host.addEventListener('pointerup', () => { vel = reduced ? 0 : .25; });
  onFrame(dt => { ry += vel * dt; holder.rotation.y = ry; });
}
if (!webglOK()) update();
