import { THREE, stage, webglOK, reduced } from '../3d/lib.js';
import { RoomEnvironment } from '../3d/RoomEnvironment.js';
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
  [0, '#8E9B6B', '#C2C89A'], [4, '#D3AE4E', '#E2BC6E'], [8.5, '#A96A35', '#A9622A'], [11, '#5E3823', '#5E3A20'], [12, '#1F1612', '#3A2213'],
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
  const { renderer, scene, camera, onFrame } = stage(host, { fov: 30, pos: [0, 0, 10] });
  // Tajam di layar berskala: gambar dirender lebih rapat dari piksel layar
  renderer.setPixelRatio(Math.min((devicePixelRatio || 1) * 1.5, innerWidth <= 820 ? 2 : 2.5));
  renderer.setSize(host.clientWidth || 1, host.clientHeight || 1, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .03).texture;

  /* Biji kopi: sisi datar dengan belahan S yang dalam dan bibir membulat, punggung cembung.
     Rumus belahan sama dengan _tools/bake-tekstur.py, jadi kulit ari di tekstur jatuh tepat di alurnya. */
  const acak = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const halus = t => t * t * (3 - 2 * t);
  const kabut = (x, y, z) => {
    const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), u = halus(x - xi), v = halus(y - yi), w = halus(z - zi);
    const l = (a, b, t) => a + (b - a) * t, c = (a, b, d) => acak(xi + a, yi + b, zi + d);
    return l(l(l(c(0, 0, 0), c(1, 0, 0), u), l(c(0, 1, 0), c(1, 1, 0), u), v), l(l(c(0, 0, 1), c(1, 0, 1), u), l(c(0, 1, 1), c(1, 1, 1), u), v), w);
  };
  const g = new THREE.SphereGeometry(1, 340, 250);
  const p = g.attributes.position, v = new THREE.Vector3();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const s = v.x - .10 * Math.sin(v.y * 2.9) - .03 * Math.sin(v.y * 7 + 1), tepi = 1 - v.y * v.y * .82;
    let z = v.z > 0 ? v.z * .5 * (1 - .12 * v.x * v.x) : v.z * .9;
    if (v.z > 0) {
      const sisi = Math.min(1, v.z * 5);
      z -= Math.exp(-((s / .04) ** 2)) * .3 * tepi * sisi;
      z += Math.exp(-(((Math.abs(s) - .13) / .09) ** 2)) * .04 * tepi * sisi;
    }
    const lengkung = 1 + (kabut(v.x * 1.7 + 3, v.y * 1.7, v.z * 1.7) - .5) * .09;
    const bintil = (kabut(v.x * 9, v.y * 4, v.z * 9) - .5) * .018;
    p.setXYZ(i, v.x * .71 * lengkung, v.y * 1.07 * lengkung, z * lengkung + bintil);
  }
  g.computeVertexNormals();
  const muat = new THREE.TextureLoader();
  const peta = (f, warnaSrgb) => { const t = muat.load(f); t.anisotropy = renderer.capabilities.getMaxAnisotropy(); if (warnaSrgb) t.colorSpace = THREE.SRGBColorSpace; return t; };
  const permukaan = peta('biji-permukaan.webp');
  const bahan = new THREE.MeshPhysicalMaterial({ color: 0xa9b47c, map: peta('biji-warna.webp', true), bumpMap: permukaan, bumpScale: 1, roughnessMap: permukaan, roughness: 1, metalness: 0, specularIntensity: .3, specularColor: new THREE.Color(0xffd9b0), clearcoat: 0, clearcoatRoughness: .5, envMapIntensity: .55 });
  const biji = new THREE.Mesh(g, bahan);
  scene.add(biji);
  const key = new THREE.DirectionalLight(0xfff4e6, 2.1); key.position.set(-3.4, 4.4, 5); scene.add(key);
  const rim = new THREE.DirectionalLight(0xffdcb8, .8); rim.position.set(4, -2, 2); scene.add(rim);

  // Bayangan lembut di permukaan, seperti biji yang tergeletak di atas kertas
  const bc = document.createElement('canvas'); bc.width = bc.height = 256;
  const b2 = bc.getContext('2d'), bg = b2.createRadialGradient(128, 128, 30, 128, 128, 128);
  bg.addColorStop(0, 'rgba(0,0,0,.5)'); bg.addColorStop(.62, 'rgba(0,0,0,.2)'); bg.addColorStop(1, 'rgba(0,0,0,0)');
  b2.fillStyle = bg; b2.fillRect(0, 0, 256, 256);
  const bayang = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(bc), transparent: true, depthWrite: false, toneMapped: false }));
  scene.add(bayang);

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

  const waktu = () => {
    const r = sang.getBoundingClientRect(), vh = innerHeight;
    const prog = pasang ? batas(-r.top / (r.height - vh)) : 0, masuk = pasang ? batas(1 - r.top / vh) : 0;
    return { prog, menit: prog * 12, u: masuk * masuk * (3 - 2 * masuk) };
  };
  // Angka dan warna mengikuti gulir langsung, tidak menunggu bingkai 3D, supaya tetap responsif di HP lemah
  const ikutGulir = () => {
    const { prog, u, menit } = waktu();
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
  };
  addEventListener('scroll', ikutGulir, { passive: true });
  addEventListener('resize', ikutGulir);
  ikutGulir();

  onFrame((dt, t) => {
    const vw = innerWidth, vh = innerHeight, tinggiDunia = 2 * Math.tan(camera.fov * Math.PI / 360) * 10, lebarDunia = tinggiDunia * camera.aspect;
    const { prog, u, menit } = waktu();

    // Letak biji: mengikuti kotak di sampul, lalu pindah ke tengah saat sangrai dimulai
    const k = tempat.getBoundingClientRect();
    const hp = vw <= 820;
    const pusatX = vw / 2, pusatY = hp ? vh * .46 : vh * .54, ukur = Math.min(hp ? vh * .4 : vh * .62, vw * (hp ? .62 : .34));
    const cx = k.left + k.width / 2, cy = k.top + k.height / 2, uk = Math.min(k.width, k.height) * (hp ? .66 : .78);
    const px = cx + (pusatX - cx) * u, py = cy + (pusatY - cy) * u, ppx = uk + (ukur - uk) * u;
    biji.position.set((px / vw - .5) * lebarDunia, -(py / vh - .5) * tinggiDunia, 0);
    const ukuranBiji = ppx / vh * tinggiDunia / 2.12 * (1 + batas((menit - 7) / 5) * .13); // biji mengembang saat disangrai
    biji.scale.setScalar(ukuranBiji);
    bayang.position.set(biji.position.x + ukuranBiji * .2, biji.position.y - ukuranBiji * .24, -2.4);
    bayang.scale.set(ukuranBiji * 2.05, ukuranBiji * 2.75, 1); bayang.rotation.z = -.32;

    // Sisi beralur selalu menghadap kamera, supaya tidak pernah tampak seperti telur
    const retak = menit > 8.3 && menit < 9.4 ? Math.sin(t * 46) * .012 : 0;
    biji.rotation.set(-.12 + Math.sin(t * .4) * .06 * (reduced ? 0 : 1) + retak, -.14 + (reduced ? 0 : Math.sin(t * .55) * .2), .3 + retak);

    bahan.color.copy(campur(menit, 2));
    const minyak = batas((menit - 9) / 3);
    bahan.roughness = 1.2 - batas((menit - 5) / 7) * .3;
    bahan.clearcoat = minyak * .16;
    bahan.bumpScale = 1 + batas(menit / 12) * .9;
    bahan.envMapIntensity = .55 + minyak * .15;
  });
}
