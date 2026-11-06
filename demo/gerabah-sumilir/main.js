import { THREE, stage, drag, webglOK, reduced, rp } from '../3d/lib.js';
import '../3d/bar.js';

// Ukuran dunia: 1 satuan = 20 cm, jadi gerabah di rak sebanding dengan ukuran aslinya
const CM = .05;
const BENTUK = {
  kendi: {
    nama: 'Kendi Leher Panjang', tombol: 'Kendi', harga: 85000, ukuran: 'Tinggi 28 cm, isi 1,2 liter', x: -1.42, tinggi: 28, lebar: 24, jarak: 6.2, dalam: .1,
    desk: 'Bentuk kendi Jawa yang dulu dipakai menyimpan air dingin. Leher panjang, paruh kecil di bahu untuk dituang tanpa menyentuh bibir.',
    profil: [[0, 0], [.34, .02], [.52, .14], [.62, .36], [.6, .55], [.46, .72], [.2, .8], [.13, .95], [.12, 1.2], [.17, 1.32], [.2, 1.35]],
  },
  guci: {
    nama: 'Guci Perut Bulat', tombol: 'Guci', harga: 140000, ukuran: 'Tinggi 34 cm, lebar 30 cm', x: .2, tinggi: 34, lebar: 30, jarak: 6.6, dalam: .16,
    desk: 'Perut besar, mulut lebar, bibir dilipat tebal supaya tidak gampang gempil. Cocok untuk ruang tamu atau menaruh ranting kering.',
    profil: [[0, 0], [.4, .02], [.7, .18], [.88, .5], [.84, .8], [.62, 1.02], [.38, 1.1], [.36, 1.2], [.46, 1.28], [.48, 1.31]],
  },
  mangkuk: {
    nama: 'Mangkuk Sambal', tombol: 'Mangkuk', harga: 35000, ukuran: 'Diameter 14 cm, tinggi 6 cm', x: 1.72, tinggi: 6, lebar: 14, jarak: 3.6, dalam: 1,
    desk: 'Mangkuk kecil tebal, berat di tangan, tidak cepat dingin. Kami pakai sendiri di bengkel untuk sambal dan sayur bening.',
    profil: [[0, 0], [.5, .02], [.7, .12], [.85, .3], [.95, .55], [.98, .6]],
  },
};
const GLASIR = [
  { nama: 'Tanah polos', hex: '#B5622F', r: .9, wa: 'tanah polos' },
  { nama: 'Putih susu', hex: '#EDEAE2', r: .46, wa: 'putih susu' },
  { nama: 'Hijau lumut', hex: '#7E8F60', r: .5, wa: 'hijau lumut' },
  { nama: 'Hitam arang', hex: '#2E2C2A', r: .46, wa: 'hitam arang' },
];
// Keamanan bergantung pada bentuk dan glasir: tanah polos berpori, jadi tidak disamakan dengan yang berglasir
const aman = (b, g) => {
  if (b === 'guci') return 'Hiasan dan tanaman, tidak untuk makanan.';
  if (b === 'kendi') return g === 0 ? 'Air minum. Tanah polos berpori, air tetap dingin dan permukaannya berembun.' : 'Air minum. Dicuci dengan tangan.';
  return g === 0 ? 'Makanan kering dan hiasan. Tidak untuk microwave atau mesin cuci piring.' : 'Makanan dan sambal. Boleh masuk microwave, cuci dengan tangan.';
};
let pilih = 'kendi';
const glasir = { kendi: 0, guci: 2, mangkuk: 1 };

const $ = id => document.getElementById(id);
const bBox = $('bentuk'), gBox = $('glasir');
Object.entries(BENTUK).forEach(([k, v]) => {
  const b = document.createElement('button'); b.type = 'button'; b.textContent = v.tombol; b.dataset.k = k;
  b.addEventListener('click', () => { pilih = k; update(); }); bBox.appendChild(b);
});
GLASIR.forEach((g, i) => {
  const b = document.createElement('button'); b.type = 'button'; b.style.background = g.hex; b.setAttribute('aria-label', g.nama);
  b.addEventListener('click', () => { glasir[pilih] = i; update(); }); gBox.appendChild(b);
});

// Tanggal selesai: 9 hari kerja dari hari ini, bengkel buka Senin sampai Sabtu
(() => {
  const d = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  for (let n = 0; n < 9;) { d.setDate(d.getDate() + 1); if (d.getDay() !== 0) n++; }
  $('selesai').textContent = `Selesai dibakar ${d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}.`;
})();

let warnai = () => {};
function update() {
  const d = BENTUK[pilih], i = glasir[pilih], g = GLASIR[i];
  $('nama').textContent = d.nama; $('desk').textContent = d.desk; $('ukuran').textContent = d.ukuran; $('aman').textContent = aman(pilih, i);
  $('harga').textContent = rp(d.harga); $('glasirNama').textContent = g.nama;
  $('wa').dataset.demoAction = `Ini demo. Di versi asli, tombol ini membuka WhatsApp bengkel: "saya mau pesan ${d.nama}, glasir ${g.wa}".`;
  [...bBox.children].forEach(b => b.setAttribute('aria-pressed', b.dataset.k === pilih));
  [...gBox.children].forEach((b, k) => b.setAttribute('aria-pressed', k === i));
  warnai();
}

const host = $('stage');
if (!webglOK()) { host.innerHTML = '<p class="hint">Rak 3D tidak bisa ditampilkan di perangkat ini. Pilih bentuk dan glasir di bawah.</p>'; update(); }
else {
  const { scene, camera, onFrame, canvas } = stage(host, { fov: 26, pos: [0, 1.6, 7] });
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x3a4436, 1.5));
  const key = new THREE.DirectionalLight(0xfff1dd, 2.7); key.position.set(-3, 5, 4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd0b0, 1.1); fill.position.set(4, 1.5, 3); scene.add(fill);

  // Bekas putaran tangan: garis melingkar tipis, ditambah cap S di dekat dasar
  const tc = document.createElement('canvas'); tc.width = 512; tc.height = 256;
  const g2 = tc.getContext('2d'); g2.fillStyle = '#fff'; g2.fillRect(0, 0, 512, 256);
  let sd = 11; const rnd = () => (sd = (sd * 16807) % 2147483647) / 2147483647;
  for (let y = 0; y < 256; y += 3 + rnd() * 5) { g2.fillStyle = `rgba(0,0,0,${.03 + rnd() * .05})`; g2.fillRect(0, y, 512, 1 + rnd() * 1.5); }
  const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace; tex.wrapS = THREE.RepeatWrapping; tex.anisotropy = 4;

  // Bayangan kontak yang lembut di papan
  const sc = document.createElement('canvas'); sc.width = sc.height = 128;
  const s2 = sc.getContext('2d'), gr = s2.createRadialGradient(64, 64, 8, 64, 64, 64);
  gr.addColorStop(0, 'rgba(0,0,0,.6)'); gr.addColorStop(.6, 'rgba(0,0,0,.26)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  s2.fillStyle = gr; s2.fillRect(0, 0, 128, 128);
  const bayang = new THREE.CanvasTexture(sc);

  // Papan rak
  const wc = document.createElement('canvas'); wc.width = 1024; wc.height = 128;
  const w2 = wc.getContext('2d'); w2.fillStyle = '#6E4A2E'; w2.fillRect(0, 0, 1024, 128);
  for (let i = 0; i < 90; i++) { w2.strokeStyle = `rgba(36,23,15,${.1 + rnd() * .22})`; w2.lineWidth = 1 + rnd() * 2; const y = rnd() * 128; w2.beginPath(); w2.moveTo(0, y); w2.bezierCurveTo(340, y + rnd() * 10 - 5, 680, y + rnd() * 10 - 5, 1024, y + rnd() * 8 - 4); w2.stroke(); }
  const kayu = new THREE.CanvasTexture(wc); kayu.colorSpace = THREE.SRGBColorSpace;
  const papan = new THREE.Mesh(new THREE.BoxGeometry(5.3, .14, 1.9), new THREE.MeshStandardMaterial({ map: kayu, roughness: .8 }));
  papan.position.set(.15, -.07, 0); scene.add(papan);
  // Penanda gerabah terpilih di papan
  const tanda = new THREE.Mesh(new THREE.RingGeometry(.97, 1, 64), new THREE.MeshBasicMaterial({ color: 0xf6e8d4, side: THREE.DoubleSide }));
  tanda.rotation.x = -Math.PI / 2; tanda.position.set(BENTUK.kendi.x, .004, 0); scene.add(tanda);

  const tebal = .022;
  const pot = {};
  Object.entries(BENTUK).forEach(([k, d]) => {
    const raw = d.profil.map(([r, y]) => new THREE.Vector3(r, y, 0));
    const pts = new THREE.CatmullRomCurve3(raw, false, 'centripetal').getPoints(90).map(v => new THREE.Vector2(Math.max(v.x, 0), Math.max(v.y, 0)));
    const maxR = Math.max(...pts.map(p => p.x)), H = pts[pts.length - 1].y;
    const sx = d.lebar * CM / 2 / maxR, sy = d.tinggi * CM / H;
    const luar = pts.map(p => new THREE.Vector2(p.x * sx, p.y * sy));
    // Dinding dalam, supaya bibir gerabah punya ketebalan dan tidak tampak seperti kertas
    const dalam = [], awal = Math.floor(luar.length * (1 - d.dalam));
    for (let i = luar.length - 1; i >= awal; i--) dalam.push(new THREE.Vector2(Math.max(luar[i].x - tebal * 1.6, 0), Math.max(luar[i].y - (i === luar.length - 1 ? .004 : 0), .02)));
    if (d.dalam === 1) dalam.push(new THREE.Vector2(0, .03));
    const mat = new THREE.MeshStandardMaterial({ color: GLASIR[glasir[k]].hex, map: tex, roughness: .8, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(new THREE.LatheGeometry([...luar, ...dalam], 96), mat);
    const holder = new THREE.Group(); holder.position.set(d.x, 0, 0); holder.add(mesh); scene.add(holder);
    if (k === 'kendi') {
      // Paruh di bahu: kerucut kecil miring ke atas, sesuai kendi Jawa
      const leher = new THREE.Mesh(new THREE.CylinderGeometry(.034, .085, .46, 28, 1, true), mat);
      leher.position.set(.52, .78, 0); leher.rotation.z = -.62; holder.add(leher);
      const ujung = new THREE.Mesh(new THREE.TorusGeometry(.034, .011, 10, 28), mat);
      ujung.position.set(.65, .968, 0); ujung.rotation.set(Math.PI / 2, 0, 0); ujung.rotateX(-.62); holder.add(ujung);
    }
    const sh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: bayang, transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(d.x, .002, 0); sh.scale.setScalar(d.lebar * CM * 1.7); scene.add(sh);
    pot[k] = { holder, mat, ry: k === 'kendi' ? .6 : k === 'guci' ? 1.4 : .2 };
  });

  warnai = () => Object.entries(pot).forEach(([k, p]) => { const g = GLASIR[glasir[k]]; p.mat.color.set(g.hex); p.mat.roughness = g.r; });
  update();

  // Seret memutar gerabah terpilih; ketuk memilih gerabah lain
  drag(host, dx => { pot[pilih].ry += dx * .012; });
  const ray = new THREE.Raycaster(), nd = new THREE.Vector2();
  let tx = 0, ty = 0;
  host.addEventListener('pointerdown', e => { tx = e.clientX; ty = e.clientY; });
  host.addEventListener('pointerup', e => {
    if (Math.hypot(e.clientX - tx, e.clientY - ty) > 8) return;
    const r = canvas.getBoundingClientRect();
    nd.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1);
    ray.setFromCamera(nd, camera);
    const kena = ray.intersectObjects(Object.values(pot).map(p => p.holder), true)[0];
    if (!kena) return;
    const k = Object.keys(pot).find(n => { let o = kena.object; while (o) { if (o === pot[n].holder) return true; o = o.parent; } return false; });
    if (k && k !== pilih) { pilih = k; update(); }
  });

  const fokus = new THREE.Vector3(.1, .7, 0);
  let jarak = 9, lebarLalu = 0;
  onFrame(dt => {
    const d = BENTUK[pilih], lebar = host.clientWidth, tinggi = host.clientHeight, hp = lebar < 700, luas = lebar > 1180;
    // Di layar lebar rak bergeser ke kanan judul
    if (lebar !== lebarLalu) {
      lebarLalu = lebar;
      if (luas) camera.setViewOffset(lebar, tinggi, -lebar * .18, 0, lebar, tinggi); else camera.clearViewOffset();
    }
    const u = reduced ? 1 : Math.min(1, dt * 3.4);
    // Layar lebar: seluruh rak terlihat di kanan judul, kamera tetap. Layar sempit: kamera mendekati gerabah terpilih.
    const tujuanX = luas ? .15 : d.x, tujuanY = luas ? .78 : d.tinggi * CM * .5;
    const tujuanJarak = luas ? Math.max(7.9, 21.5 / (lebar / tinggi)) : hp ? d.jarak * 1.35 : d.jarak;
    fokus.x += (tujuanX - fokus.x) * u; fokus.y += (tujuanY - fokus.y) * u;
    jarak += (tujuanJarak - jarak) * u;
    camera.position.set(fokus.x, fokus.y + jarak * .15, jarak);
    camera.lookAt(fokus);
    tanda.position.x += (d.x - tanda.position.x) * u;
    tanda.scale.setScalar(d.lebar * CM * .5 + .07);
    Object.entries(pot).forEach(([k, p]) => { if (k === pilih && !reduced && !host.classList.contains('grabbing')) p.ry += dt * .3; p.holder.rotation.y = p.ry; });
  });
}
