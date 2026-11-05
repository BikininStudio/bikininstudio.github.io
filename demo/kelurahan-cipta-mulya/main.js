import { THREE, stage, drag, webglOK, reduced } from '../3d/lib.js';

/* ---------- Layanan surat ---------- */
const LAYANAN = [
  { nama: 'Surat keterangan domisili', waktu: 'Selesai hari itu', kata: 'domisili alamat tinggal kos',
    syarat: ['Surat pengantar RT/RW', 'Fotokopi KTP', 'Fotokopi KK'], langkah: ['Minta pengantar ke ketua RT, lalu cap RW', 'Bawa ke loket 1 kelurahan', 'Tunggu ±30 menit, surat ditandatangani lurah'] },
  { nama: 'SKTM (surat keterangan tidak mampu)', waktu: '1 hari kerja', kata: 'sktm tidak mampu beasiswa rumah sakit bpjs',
    syarat: ['Surat pengantar RT/RW', 'Fotokopi KTP dan KK', 'Keperluan ditulis jelas (sekolah/rumah sakit)'], langkah: ['Pengantar RT/RW', 'Petugas kesejahteraan sosial bisa datang cek rumah', 'Ambil besok di loket 2'] },
  { nama: 'Surat pengantar pindah', waktu: '1 hari kerja', kata: 'pindah keluar datang mutasi kk',
    syarat: ['Pengantar RT/RW', 'KK asli dan KTP asli semua anggota yang pindah', 'Alamat tujuan lengkap'], langkah: ['Isi formulir F-1.03 di loket 1', 'Surat diteruskan ke Disdukcapil', 'Kabar lewat WA bila sudah terbit'] },
  { nama: 'Pengantar nikah (N1–N4)', waktu: '1 hari kerja', kata: 'nikah menikah kua n1 n2 n4',
    syarat: ['Pengantar RT/RW', 'Fotokopi KTP, KK, akta lahir', 'Pas foto 3×4 latar biru, 4 lembar', 'Surat izin orang tua bila di bawah 21 tahun'], langkah: ['Ambil formulir N di loket 1', 'Isi dan tanda tangani', 'Bawa hasilnya ke KUA kecamatan'] },
  { nama: 'Surat keterangan usaha', waktu: 'Selesai hari itu', kata: 'usaha umkm sku kredit bank kur',
    syarat: ['Pengantar RT/RW', 'Fotokopi KTP', 'Foto tempat usaha'], langkah: ['Pengantar RT/RW', 'Serahkan di loket 1', 'Dipakai untuk KUR, izin, atau pengajuan bantuan'] },
  { nama: 'Surat keterangan kematian', waktu: 'Selesai hari itu', kata: 'kematian meninggal wafat akta',
    syarat: ['Pengantar RT/RW', 'Surat dari rumah sakit/dokter bila ada', 'KTP dan KK almarhum', 'KTP dua orang saksi'], langkah: ['Hari libur: hubungi ketua RT, surat diproses hari kerja berikutnya', 'Serahkan di loket 1', 'Lanjut ke Disdukcapil untuk akta kematian'] },
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
document.getElementById('cari').addEventListener('input', e => {
  const q = e.target.value.trim().toLowerCase(); let n = 0;
  [...list.children].forEach(d => { const ok = !q || q.split(/\s+/).every(w => d.dataset.kata.includes(w)); d.hidden = !ok; if (ok) n++; if (q && ok && n === 1) d.open = true; });
  empty.hidden = n > 0;
});

/* ---------- Status buka/tutup (WIB) ---------- */
(() => {
  const el = document.getElementById('status');
  const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const day = now.getDay(), m = now.getHours() * 60 + now.getMinutes();
  const sesi = day >= 1 && day <= 4 ? [[480, 720], [780, 900]] : day === 5 ? [[480, 660], [810, 900]] : [];
  const buka = sesi.some(([a, b]) => m >= a && m < b);
  el.className = 'status ' + (buka ? 'buka' : 'tutup');
  el.textContent = buka ? 'Loket sedang buka. Antrean rata-rata 15 menit.' : 'Loket sedang tutup. Lihat jam layanan di bawah, atau kirim pertanyaan lewat WhatsApp.';
})();

/* ---------- Peta 3D ---------- */
const PLACES = [
  { nama: 'Kantor kelurahan', ket: 'Jl. Melati Raya 1, RW 03', p: [0.2, -0.3], c: 0x183a5c },
  { nama: 'Puskesmas pembantu', ket: 'Senin–Sabtu 08.00–14.00, RW 02', p: [-2.3, -1.4], c: 0x1f8a4c },
  { nama: 'Posyandu Mawar', ket: 'Tiap Selasa minggu kedua, RW 05', p: [2.4, 1.5], c: 0xd9481c },
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
  const W = 8, D = 6, seg = 80;
  const geo = new THREE.PlaneGeometry(W, D, seg, Math.round(seg * D / W)); geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position, col = [];
  const river = x => Math.sin(x * .7) * .9 + .1;
  const cLand = new THREE.Color(0xdfe6d6), cHigh = new THREE.Color(0xc9d4bf), cWater = new THREE.Color(0x8fb8cf);
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    const dr = Math.abs(z - river(x));
    let y = .18 * Math.sin(x * 1.3 + 1) * Math.cos(z * 1.1) + .12 * Math.sin(x * 2.7 + z * 1.9) + .25;
    if (dr < .28) y = 0.02;
    else if (dr < .5) y *= (dr - .28) / .22;
    pos.setY(i, y);
    const c = dr < .28 ? cWater : cLand.clone().lerp(cHigh, Math.min(1, y * 2.2));
    col.push(c.r, c.g, c.b);
  }
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const land = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, flatShading: true }));
  const world = new THREE.Group(); world.add(land); scene.add(world);
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, .4, D), new THREE.MeshStandardMaterial({ color: 0xb9c2b4 }));
  base.position.y = -.2; world.add(base);
  const ray = new THREE.Raycaster(), hAt = (x, z) => { ray.set(new THREE.Vector3(x, 5, z), new THREE.Vector3(0, -1, 0)); const h = ray.intersectObject(land)[0]; return h ? h.point.y : .2; };

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

  // Pin fasilitas
  const pins = PLACES.map(pl => {
    const g = new THREE.Group(); const [x, z] = pl.p; g.position.set(x, hAt(x, z), z);
    const m = new THREE.MeshStandardMaterial({ color: pl.c, roughness: .5 });
    const stem = new THREE.Mesh(new THREE.CylinderGeometry(.025, .025, .6, 8), m); stem.position.y = .3;
    const head = new THREE.Mesh(new THREE.SphereGeometry(.13, 20, 14), m); head.position.y = .65;
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
      p.children[1].position.y = .65 + (i === sel && !reduced ? Math.sin(t * 4) * .06 : 0);
    });
  });
}
