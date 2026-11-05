import { THREE, stage, drag, webglOK, reduced } from '../3d/lib.js';
import '../3d/bar.js';

/* ---------- Layanan surat ---------- */
const LAYANAN = [
  { nama: 'Surat keterangan domisili', waktu: 'Selesai hari itu', kata: 'domisili alamat tinggal kos',
    syarat: ['Surat pengantar RT/RW', 'Fotokopi KTP', 'Fotokopi KK'], langkah: ['Minta pengantar ke ketua RT, lalu cap RW', 'Bawa ke loket 1 kelurahan', 'Tunggu ±30 menit, surat ditandatangani lurah'] },
  { nama: 'SKTM (surat keterangan tidak mampu)', waktu: '1 hari kerja', kata: 'sktm tidak mampu beasiswa rumah sakit bpjs',
    syarat: ['Surat pengantar RT/RW', 'Fotokopi KTP dan KK', 'Keperluan ditulis jelas (sekolah/rumah sakit)'], langkah: ['Pengantar RT/RW', 'Petugas kesejahteraan sosial bisa datang cek rumah', 'Ambil besok di loket 2'] },
  { nama: 'Surat pengantar pindah', waktu: '1 hari kerja', kata: 'pindah keluar datang mutasi kk kartu keluarga',
    syarat: ['Pengantar RT/RW', 'KK asli dan KTP asli semua anggota yang pindah', 'Alamat tujuan lengkap'], langkah: ['Isi formulir F-1.03 di loket 1', 'Surat diteruskan ke Disdukcapil', 'Kabar lewat WA bila sudah terbit'] },
  { nama: 'Pengantar nikah (N1–N4)', waktu: '1 hari kerja', kata: 'nikah menikah kua n1 n2 n4',
    syarat: ['Pengantar RT/RW', 'Fotokopi KTP, KK, akta lahir', 'Pas foto 3×4 latar biru, 4 lembar', 'Surat izin orang tua bila di bawah 21 tahun'], langkah: ['Ambil formulir N di loket 1', 'Isi dan tanda tangani', 'Bawa hasilnya ke KUA kecamatan'] },
  { nama: 'Surat keterangan usaha', waktu: 'Selesai hari itu', kata: 'usaha umkm sku kredit bank kur',
    syarat: ['Pengantar RT/RW', 'Fotokopi KTP', 'Foto tempat usaha'], langkah: ['Pengantar RT/RW', 'Serahkan di loket 1', 'Dipakai untuk KUR, izin, atau pengajuan bantuan'] },
  { nama: 'Surat keterangan kematian', waktu: 'Selesai hari itu', kata: 'kematian meninggal wafat akta akte',
    syarat: ['Pengantar RT/RW', 'Surat dari rumah sakit/dokter bila ada', 'KTP dan KK almarhum', 'KTP dua orang saksi'], langkah: ['Hari libur: hubungi ketua RT, surat diproses hari kerja berikutnya', 'Serahkan di loket 1', 'Lanjut ke Disdukcapil untuk akta kematian'] },
  { nama: 'KTP, KK, dan akta lahir', waktu: 'Diproses Disdukcapil', kata: 'ktp e-ktp kk kartu keluarga akta akte lahir kelahiran hilang rusak baru',
    syarat: ['Pengantar RT/RW', 'KK asli', 'Surat lahir dari bidan atau rumah sakit, untuk akta'], langkah: ['Serahkan berkas di loket 1', 'Kelurahan meneruskan ke Disdukcapil', 'Kabar lewat WA bila sudah terbit'] },
  { nama: 'Pengantar SKCK', waktu: 'Selesai hari itu', kata: 'skck polisi kelakuan baik lamaran kerja',
    syarat: ['Pengantar RT/RW', 'Fotokopi KTP dan KK', 'Pas foto 4×6 latar merah, 2 lembar'], langkah: ['Minta pengantar RT/RW', 'Serahkan di loket 1', 'Bawa surat pengantar ke polsek'] },
];
const list = document.getElementById('list'), empty = document.getElementById('empty');
LAYANAN.forEach(l => {
  const d = document.createElement('details');
  d.dataset.kata = (l.nama + ' ' + l.kata).toLowerCase();
  d.innerHTML = `<summary><h3>${l.nama}</h3><span class="waktu">${l.waktu} · gratis</span><span class="plus" aria-hidden="true">+</span></summary>
  <div class="isi"><div><h4>Yang dibawa</h4><ul>${l.syarat.map(s => `<li>${s}</li>`).join('')}</ul></div>
  <div><h4>Alurnya</h4><ol>${l.langkah.map(s => `<li>${s}</li>`).join('')}</ol></div></div>`;
  list.appendChild(d);
});
let bukaOtomatis = null; // hanya kartu yang dibuka pencarian yang ditutup lagi; yang dibuka warga dibiarkan
document.getElementById('cari').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase();
  if (bukaOtomatis) { bukaOtomatis.open = false; bukaOtomatis = null; }
  const cocok = [...list.children].filter(d => { const ok = !q || q.split(/\s+/).every(w => d.dataset.kata.includes(w)); d.hidden = !ok; return ok; });
  if (q && cocok.length === 1 && !cocok[0].open) { cocok[0].open = true; bukaOtomatis = cocok[0]; }
  empty.hidden = cocok.length > 0;
});

/* ---------- Status buka/tutup (WIB) ---------- */
(() => {
  const el = document.getElementById('status');
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const day = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
  const sesi = day >= 1 && day <= 4 ? [[480, 720], [780, 900]] : day === 5 ? [[480, 660], [810, 900]] : [];
  const buka = sesi.some(([a, b]) => m >= a && m < b);
  el.className = 'status ' + (buka ? 'buka' : 'tutup');
  el.textContent = buka ? 'Menurut jadwal, loket buka sekarang. Hari libur nasional tutup.' : 'Menurut jadwal, loket tutup sekarang. Lihat jam layanan di bawah, atau kirim pertanyaan lewat WhatsApp.';
})();

/* ---------- Peta 3D ---------- */
const PLACES = [
  { nama: 'Kantor kelurahan', ket: 'Jl. Melati Raya 1, RW 03', p: [0.2, -0.75], c: 0x183a5c },
  { nama: 'Puskesmas pembantu', ket: 'Senin–Sabtu 08.00–14.00, RW 02', p: [-2.3, -1.4], c: 0x1f8a4c },
  { nama: 'Posyandu Mawar', ket: 'Tiap Selasa minggu kedua, RW 05', p: [2.5, 1.85], c: 0xd9481c },
  { nama: 'Bank sampah Berseri', ket: 'Sabtu 07.00–10.00, RW 01', p: [-2.6, 1.7], c: 0x7a5a1e },
  { nama: 'SDN Cipta Mulya 2', ket: 'Jl. Kenanga 14, RW 04', p: [2.7, -1.6], c: 0x6b4fa0 },
  { nama: 'Pos ronda & titik kumpul banjir', ket: 'Lapangan RW 06', p: [-0.4, 2.1], c: 0x0d7c8c },
];
const placesEl = document.getElementById('places');
PLACES.forEach((pl, i) => {
  const li = document.createElement('li');
  li.innerHTML = `<button type="button" aria-pressed="false"><span class="n" style="background:#${pl.c.toString(16).padStart(6, '0')}">${i + 1}</span><b>${pl.nama}</b><small>${pl.ket}</small></button>`;
  li.firstChild.addEventListener('click', () => pilih(i));
  placesEl.appendChild(li);
});
let onPilih = () => {};
function pilih(i) {
  [...placesEl.querySelectorAll('button')].forEach((b, k) => b.setAttribute('aria-pressed', k === i));
  onPilih(i);
}

const host = document.getElementById('stage');
if (!webglOK()) document.documentElement.classList.add('nogl');
else {
  const { scene, camera, onFrame } = stage(host, { fov: 30, pos: [0, 9, 9] });
  scene.add(new THREE.HemisphereLight(0xffffff, 0xaab4a8, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2); sun.position.set(-5, 8, 3); scene.add(sun);

  // Relief: grid dengan tinggi lembut + sungai yang membelah wilayah
  const W = 8, D = 6, seg = 150;
  const geo = new THREE.PlaneGeometry(W, D, seg, Math.round(seg * D / W)); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = [];
  const river = x => Math.sin(x * .7) * .9 + .1;
  const halus = (a, b, v) => { const t = Math.min(1, Math.max(0, (v - a) / (b - a))); return t * t * (3 - 2 * t); };
  const bukit = (x, z) => .18 * Math.sin(x * 1.3 + 1) * Math.cos(z * 1.1) + .12 * Math.sin(x * 2.7 + z * 1.9) + .25;
  const hAt = (x, z) => .02 + (bukit(x, z) - .02) * halus(.24, .62, Math.abs(z - river(x)));
  const cLand = new THREE.Color(0xdfe6d6), cHigh = new THREE.Color(0xc9d4bf), cTepi = new THREE.Color(0xb8c7ab);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i), y = hAt(x, z);
    pos.setY(i, y);
    const c = cLand.clone().lerp(cHigh, Math.min(1, y * 2.2)).lerp(cTepi, 1 - halus(.3, .6, Math.abs(z - river(x))));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  const world = new THREE.Group(); world.add(land); scene.add(world);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, .4, D), new THREE.MeshStandardMaterial({ color: 0xb9c2b4 }));
  base.position.y = -.2; world.add(base);
  const pita = [], ind = [];
  for (let i = 0; i <= 160; i++) {
    const x = -W / 2 + W * i / 160, z = river(x);
    pita.push(x, .05, z - .34, x, .05, z + .34);
    if (i < 160) { const k = i * 2; ind.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  const pg = new THREE.BufferGeometry(); pg.setAttribute('position', new THREE.Float32BufferAttribute(pita, 3)); pg.setIndex(ind); pg.computeVertexNormals();
  world.add(new THREE.Mesh(pg, new THREE.MeshStandardMaterial({ color: 0x8fb8cf, roughness: .55, side: THREE.DoubleSide })));

  // Batas RW (garis putus-putus)
  const lm = new THREE.LineDashedMaterial({ color: 0x14202e, dashSize: .12, gapSize: .08, transparent: true, opacity: .45 });
  [[[-1.3, -3], [-1.3, 3]], [[1.4, -3], [1.4, 3]], [[-4, .4], [4, .4]]].forEach(seg2 => {
    const pts = []; const [[x1, z1], [x2, z2]] = seg2;
    for (let t = 0; t <= 1.0001; t += .02) { const x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t; pts.push(new THREE.Vector3(x, hAt(x, z) + .03, z)); }
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts), lm); l.computeLineDistances(); world.add(l);
  });
  // Rumah-rumah kecil
  const houseG = new THREE.BoxGeometry(.14, .12, .14), houseM = new THREE.MeshStandardMaterial({ color: 0xf4f1ea, flatShading: true });
  const houses = new THREE.InstancedMesh(houseG, houseM, 260), m4 = new THREE.Matrix4();
  let n = 0, seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  while (n < 260) {
    const x = (rnd() - .5) * (W - .5), z = (rnd() - .5) * (D - .5);
    if (Math.abs(z - river(x)) < .6) continue;
    if (PLACES.some(p => Math.hypot(p.p[0] - x, p.p[1] - z) < .35)) continue;
    m4.makeRotationY(rnd() * 3); m4.setPosition(x, hAt(x, z) + .06, z); houses.setMatrixAt(n++, m4);
  }
  world.add(houses);

  // Tulisan di peta: nomor pin sama dengan daftar, batas RW diberi nama
  const tulisan = (teks, lebar, tinggi, gambar) => {
    const c = document.createElement('canvas'); c.width = lebar; c.height = tinggi;
    gambar(c.getContext('2d'), teks);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return new THREE.Sprite(new THREE.SpriteMaterial({ map: t, transparent: true, depthTest: false }));
  };
  [[-3.1, -2.45, 'RW 02'], [-.65, -2.55, 'RW 03'], [3.1, -2.45, 'RW 04'], [-3.1, 2.55, 'RW 01'], [.5, 2.6, 'RW 06'], [3.1, 2.6, 'RW 05']].forEach(([x, z, t]) => {
    const s = tulisan(t, 256, 84, (g, teks) => { g.font = '800 54px Archivo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 12; g.strokeStyle = '#EDF1E9'; g.lineJoin = 'round'; g.strokeText(teks, 128, 44); g.fillStyle = '#14202E'; g.fillText(teks, 128, 44); });
    s.position.set(x, hAt(x, z) + .22, z); s.scale.set(.76, .25, 1); world.add(s);
  });

  // Pin fasilitas
  const pins = PLACES.map((pl, i) => {
    const g = new THREE.Group(); const [x, z] = pl.p; g.position.set(x, hAt(x, z), z);
    const m = new THREE.MeshStandardMaterial({ color: pl.c, roughness: .5 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .6, 8), m); stem.position.y = .3;
    const warna = '#' + pl.c.toString(16).padStart(6, '0');
    const head = tulisan(String(i + 1), 128, 128, (g, teks) => { g.fillStyle = warna; g.beginPath(); g.arc(64, 64, 60, 0, 7); g.fill(); g.lineWidth = 6; g.strokeStyle = '#fff'; g.stroke(); g.fillStyle = '#fff'; g.font = '800 74px Archivo, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(teks, 64, 68); });
    head.position.y = .72; head.scale.setScalar(.36);
    const disc = new THREE.Mesh(new THREE.CircleGeometry(.22, 24), new THREE.MeshBasicMaterial({ color: pl.c, transparent: true, opacity: .25 }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = .02;
    g.add(stem, head, disc); world.add(g); return g;
  });

  let sel = 0, ang = .25, tAng = .25;
  const focus = new THREE.Vector3(), tFocus = new THREE.Vector3();
  onPilih = i => { sel = i; tFocus.set(PLACES[i].p[0] * .5, 0, PLACES[i].p[1] * .5); };
  pilih(0);
  drag(host, dx => { tAng -= dx * .008; });

  onFrame((dt, t) => {
    ang += (tAng - ang) * Math.min(1, dt * 4);
    focus.lerp(tFocus, Math.min(1, dt * 3));
    const R = host.clientWidth < 600 ? 11 : 8.5;
    camera.position.set(focus.x + Math.sin(ang) * R, R * .95, focus.z + Math.cos(ang) * R);
    camera.lookAt(focus);
    pins.forEach((p, i) => {
      const s = i === sel ? 1.6 : 1; p.scale.lerp(new THREE.Vector3(s, s, s), Math.min(1, dt * 8));
      p.children[1].position.y = .72 + (i === sel && !reduced ? Math.sin(t * 4) * .06 : 0);
    });
  });
}
