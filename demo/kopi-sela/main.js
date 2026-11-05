import { THREE, stage, webglOK, reduced } from '../3d/lib.js';
import '../3d/bar.js';

const $ = id => document.getElementById(id);
const batas = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

/* ---------- Tanggal sangrai: selalu dihitung dari hari ini (Selasa dan Jumat, WIB) ---------- */
(() => {
  const kini = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Jakarta' }));
  const panjang = d => d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });
  const pendek = d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long' });
  const geser = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
  let akhir = new Date(kini);
  while (![2, 5].includes(akhir.getDay())) akhir = geser(akhir, -1);
  let lanjut = geser(kini, 1);
  while (![2, 5].includes(lanjut.getDay())) lanjut = geser(lanjut, 1);
  $('cap-tgl').textContent = panjang(akhir);
  $('cap-puncak').textContent = `Paling enak ${pendek(geser(akhir, 5))} sampai ${pendek(geser(akhir, 21))}.`;
  $('biji-sub').textContent = `Sangrai ${panjang(akhir)}. Sangrai berikutnya ${panjang(lanjut)}. Stok terbatas, habis ya habis.`;
})();

/* ---------- Data satu batch ---------- */
const SUHU = [[0, 200], [1.3, 96], [2.5, 112], [4, 150], [6, 174], [8.5, 196], [11, 208], [12, 214]];
const WARNA = [ // menit, tanah, biji
  [0, '#8E9B6B', '#7F9150'], [4, '#D3AE4E', '#BF9A45'], [8.5, '#A96A35', '#7E4B25'], [11, '#5E3823', '#452413'], [12, '#1F1612', '#2A150D'],
];
const TAHAP = [0, 4, 8.5, 11, 12];
const antara = (tabel, t) => {
  for (let i = 1; i < tabel.length; i++) if (t <= tabel[i][0]) {
    const [a, b] = [tabel[i - 1], tabel[i]], k = (t - a[0]) / (b[0] - a[0] || 1);
    return a[1] + (b[1] - a[1]) * k;
  }
  return tabel[tabel.length - 1][1];
};
// Kurva catatan suhu
const X = t => t / 12 * 232 + 4, Y = c => 106 - (c - 90) / 130 * 100;
const garis = n => { let s = ''; for (let i = 0; i <= n; i++) { const t = 12 * i / 120; s += `${X(t).toFixed(1)},${Y(antara(SUHU, t)).toFixed(1)} `; } return s; };
$('kurva-dasar').setAttribute('points', garis(120));

const host = $('stage');
const pasang = webglOK() && !reduced;
if (pasang) document.documentElement.classList.add('pin');
if (webglOK()) {
  const { scene, camera, onFrame } = stage(host, { fov: 30, pos: [0, 0, 10] });

  /* Biji kopi: sisi datar dengan alur S di depan, punggung membulat di belakang */
  const g = new THREE.SphereGeometry(1, 120, 90);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    let z = v.z > 0 ? v.z * .5 : v.z * .86;
    if (v.z > 0) {
      const s = v.x - .13 * Math.sin(v.y * 2.7);
      z -= Math.exp(-(s * s) / .014) * .24 * (1 - v.y * v.y * .78) * Math.min(1, v.z * 4);
    }
    p.setXYZ(i, v.x * .72, v.y * 1.06, z);
  }
  g.computeVertexNormals();
  const bahan = new THREE.MeshStandardMaterial({ color: 0x7f9150, roughness: .62, metalness: .02 });
  const biji = new THREE.Mesh(g, bahan);
  scene.add(biji);
  scene.add(new THREE.HemisphereLight(0xfff3e0, 0x6a5a48, 1.5));
  const key = new THREE.DirectionalLight(0xffffff, 2.5); key.position.set(-3, 4, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffd9b0, 1.2); rim.position.set(4, -1, -3); scene.add(rim);

  const warna = WARNA.map(([m, tanah, b]) => [m, new THREE.Color(tanah), new THREE.Color(b)]);
  const campur = (t, i) => {
    let k = 1;
    while (k < warna.length - 1 && t > warna[k][0]) k++;
    const a = warna[k - 1], b = warna[k], u = batas((t - a[0]) / (b[0] - a[0] || 1));
    return a[i].clone().lerp(b[i], u);
  };
  const kertas = new THREE.Color('#E9E2D3');
  const gulir = $('gulir'), sang = $('sangrai'), tempat = $('tempat'), hari = [...$('tahap').children];
  const elMenit = $('menit'), elSuhu = $('suhu'), isi = $('kurva-isi'), titik = $('kurva-titik');
  let tahapKini = -1, terakhir = '';

  onFrame((dt, t) => {
    const vw = innerWidth, vh = innerHeight, tinggiDunia = 2 * Math.tan(camera.fov * Math.PI / 360) * 10, lebarDunia = tinggiDunia * camera.aspect;
    const r = sang.getBoundingClientRect();
    const prog = pasang ? batas(-r.top / (r.height - vh)) : 0;
    const masuk = pasang ? batas(1 - r.top / vh) : 0;
    const menit = prog * 12;

    // Letak biji: mengikuti kotak di sampul, lalu pindah ke tengah saat sangrai dimulai
    const k = tempat.getBoundingClientRect();
    const hp = vw <= 820;
    const pusatX = vw / 2, pusatY = hp ? vh * .46 : vh * .54, ukur = Math.min(hp ? vh * .4 : vh * .62, vw * (hp ? .62 : .34));
    const cx = k.left + k.width / 2, cy = k.top + k.height / 2, uk = Math.min(k.width, k.height) * (hp ? .66 : .78);
    const u = masuk * masuk * (3 - 2 * masuk);
    const px = cx + (pusatX - cx) * u, py = cy + (pusatY - cy) * u, ppx = uk + (ukur - uk) * u;
    biji.position.set((px / vw - .5) * lebarDunia, -(py / vh - .5) * tinggiDunia, 0);
    biji.scale.setScalar(ppx / vh * tinggiDunia / 2.12);

    // Sisi beralur selalu menghadap kamera, supaya tidak pernah tampak seperti telur
    const retak = menit > 8.3 && menit < 9.4 ? Math.sin(t * 46) * .012 : 0;
    biji.rotation.set(-.12 + Math.sin(t * .4) * .06 * (reduced ? 0 : 1) + retak, -.42 + (reduced ? 0 : Math.sin(t * .55) * .3) + prog * .7, .3 + retak);

    bahan.color.copy(campur(menit, 2));
    bahan.roughness = .62 - batas((menit - 8) / 4) * .28;

    const tanah = kertas.clone().lerp(campur(menit, 1), u);
    const terang = .2126 * tanah.r + .7152 * tanah.g + .0722 * tanah.b;
    const kode = '#' + tanah.getHexString();
    if (kode !== terakhir) {
      terakhir = kode;
      gulir.style.setProperty('--tanah', kode);
      gulir.style.setProperty('--tinta', terang > .135 ? '#17120E' : '#E9E2D3');
    }

    if (pasang) {
      const celsius = antara(SUHU, menit);
      const m = Math.floor(menit), d = Math.floor((menit - m) * 60);
      elMenit.textContent = `${String(m).padStart(2, '0')}.${String(d).padStart(2, '0')}`;
      elSuhu.textContent = `${Math.round(celsius)} °C`;
      isi.setAttribute('points', garis(Math.max(1, Math.round(prog * 120))));
      titik.setAttribute('cx', X(menit)); titik.setAttribute('cy', Y(celsius));
      let n = 0; TAHAP.forEach((a, i) => { if (menit >= a) n = i; });
      if (n !== tahapKini) { tahapKini = n; hari.forEach((li, i) => li.classList.toggle('on', i === n)); }
    }
  });
}
