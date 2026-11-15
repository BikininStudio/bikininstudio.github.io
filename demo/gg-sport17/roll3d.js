/* GG Sport17: model 3D roll asli (dibuat di Blender dari foto produk, lihat hasil-3d/ dan
   _tools/glb-ggsport.py). Satu model dasar per jenis roll; warna = tekstur sisi + tutup yang
   ditempel saat dipakai. Dipakai scene3d.js (halaman) dan _tools/thumb-ggsport.js (gambar kecil). */
import * as THREE from '../3d/three.module.min.js';
import { GLTFLoader } from '../3d/GLTFLoader.js';
import { RoomEnvironment } from '../3d/RoomEnvironment.js';

/* global MODEL */
const M = typeof MODEL !== 'undefined' ? MODEL : { produk: {}, ekstra: {} };
const loader = new GLTFLoader();
const dasar = new Map();
const gambar = new Map();
const bahan = new Map();

export const adaModel = (slug, warna) => !!(M.produk[slug] && M.produk[slug].warna[warna]);
export const infoWarna = (slug, warna) => (M.produk[slug] && M.produk[slug].warna[warna]) || null;

/* Studio: pantulan ruang lembut + lampu kunci dari kiri atas + lampu tepi berwarna dari belakang */
export function studio(renderer, scene) {
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  const pm = new THREE.PMREMGenerator(renderer);
  scene.environment = pm.fromScene(new RoomEnvironment(), .04).texture;
  scene.environmentIntensity = .9;
  pm.dispose();
  const kunci = new THREE.DirectionalLight(0xffffff, 1.6);
  kunci.position.set(-.55, .8, .6);
  const tepi = new THREE.DirectionalLight(0x2BA3DC, 1.3);
  tepi.position.set(.7, .35, -.8);
  scene.add(kunci, tepi);
  return { kunci, tepi };
}

function muatDasar(url) {
  if (!dasar.has(url)) {
    dasar.set(url, loader.loadAsync(url).then(g => {
      // Putaran meja dari Blender dibuang: arah hadap diatur halaman (geser, gulir, kursor)
      const clip = g.animations[0];
      if (clip) clip.tracks = clip.tracks.filter(t => !t.name.startsWith('Putar.'));
      g.scene.traverse(o => { if (o.isMesh) { o.frustumCulled = false; if (o.morphTargetInfluences) g.userData.morph = true; } });
      return g;
    }));
  }
  return dasar.get(url);
}

function muatGambar(url) {
  if (!gambar.has(url)) {
    gambar.set(url, new Promise((ok, gagal) => {
      const i = new Image();
      i.decoding = 'async';
      i.onload = () => ok(i);
      i.onerror = gagal;
      i.src = url;
    }));
  }
  return gambar.get(url);
}

// Bahan pita dan tutup per warna, dibuat sekali lalu dipakai bersama
async function bahanWarna(slug, warna, tpl) {
  const key = slug + '|' + warna;
  if (!bahan.has(key)) {
    bahan.set(key, (async () => {
      const w = infoWarna(slug, warna);
      const [sisi, tutup] = await Promise.all([muatGambar(w.sisi), muatGambar(w.tutup)]);
      const pasang = (mat, img) => {
        const m = mat.clone();
        const t = mat.map.clone();
        t.source = new THREE.Source(img);
        t.needsUpdate = true;
        m.map = t;
        return m;
      };
      return { Pita: pasang(tpl.Pita, sisi), Tutup: pasang(tpl.Tutup, tutup) };
    })());
  }
  return bahan.get(key);
}

function cariTpl(root) {
  const tpl = {};
  root.traverse(o => {
    if (!o.isMesh) return;
    (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => {
      if (/^Pita/.test(m.name) && m.map) tpl.Pita = tpl.Pita || m;
      if (/^Tutup/.test(m.name) && m.map) tpl.Tutup = tpl.Tutup || m;
    });
  });
  return tpl;
}

function pakaiBahan(root, b) {
  root.traverse(o => {
    if (!o.isMesh) return;
    const nama = o.userData.bahanAsli || (o.userData.bahanAsli = o.material.name);
    if (/^Pita/.test(nama)) o.material = b.Pita;
    else if (/^Tutup/.test(nama)) o.material = b.Tutup;
  });
}

/* Satu benda siap pakai:
   g      grup luar (posisi, skala, putaran diatur pemanggil); tinggi model = 1 satuan
   lebar  lebar terbesar saat diputar, dalam satuan tinggi
   waktu(t) / jalan(dt) menggerakkan animasi Blender (melayang, pita terurai, roll melompat) */
async function rakit(url, warnaDari) {
  const gl = await muatDasar(url);
  const isi = gl.scene.clone(true);
  let b = null;
  if (warnaDari) {
    b = await bahanWarna(warnaDari.slug, warnaDari.warna, cariTpl(gl.scene));
    pakaiBahan(isi, b);
  }
  const mixer = new THREE.AnimationMixer(isi);
  const clip = gl.animations[0];
  const aksi = clip ? mixer.clipAction(clip) : null;
  if (aksi) aksi.play();
  const durasi = clip ? clip.duration : 8;
  // Kotak Kindmax (bila ada): bisa disembunyikan supaya hanya rollnya yang tampil
  const kotak = [];
  isi.traverse(o => { if (/^Kotak/.test(o.name) && !(o.parent && /^Kotak/.test(o.parent.name))) kotak.push(o); });
  const diKotak = o => { for (let p = o; p; p = p.parent) if (kotak.includes(p)) return true; return false; };
  // Ukuran diambil dari seluruh gerakan (pita terurai paling panjang, roll melompat paling tinggi).
  // Dihitung presisi (ikut morph target pita) sekali per model dasar.
  if (!gl.userData.ukur) {
    const box = new THREE.Box3(), rollBox = new THREE.Box3(), tmp = new THREE.Box3();
    for (let k = 0; k < 8; k++) {
      mixer.setTime(durasi * k / 8);
      isi.updateMatrixWorld(true);
      box.union(tmp.setFromObject(isi, !!gl.userData.morph));
      if (k === 0 && kotak.length) isi.traverse(o => { if (o.isMesh && !diKotak(o)) rollBox.union(tmp.setFromObject(o)); });
    }
    gl.userData.ukur = { box, rollBox };
  }
  mixer.setTime(0);
  const { box, rollBox } = gl.userData.ukur;
  const tinggi = Math.max(1e-6, box.max.y - box.min.y);
  let r = 0;
  [box.min.x, box.max.x].forEach(x => [box.min.z, box.max.z].forEach(z => { r = Math.max(r, Math.hypot(x, z)); }));
  const s = 1 / tinggi;
  const poros = new THREE.Group();          // titik putar = poros model di Blender
  poros.scale.setScalar(s);
  const py = -(box.min.y + box.max.y) / 2 * s;
  poros.position.y = py;
  poros.add(isi);
  const g = new THREE.Group();
  g.add(poros);
  const rc = kotak.length ? rollBox.getCenter(new THREE.Vector3()) : null;
  return {
    g, isi, mixer, durasi, kotak,
    lebar: 2 * r * s,
    lebarDepan: (box.max.x - box.min.x) * s,
    lebarRoll: rc ? (rollBox.max.x - rollBox.min.x) * s : (box.max.x - box.min.x) * s,
    pusatX: (box.min.x + box.max.x) / 2 * s,
    // lebar dan titik tengah di layar bila model diputar yaw radian (sudut kotak batas)
    lebarPada(yaw) {
      const c = Math.cos(yaw), sn = Math.sin(yaw);
      let a = Infinity, b = -Infinity;
      [box.min.x, box.max.x].forEach(x => [box.min.z, box.max.z].forEach(z => {
        const v = (x * c + z * sn) * s; a = Math.min(a, v); b = Math.max(b, v);
      }));
      return { w: b - a, c: (a + b) / 2 };
    },
    warna: warnaDari && warnaDari.warna,
    waktu(t) { mixer.setTime(((t % durasi) + durasi) % durasi); },
    jalan(dt) { mixer.update(dt); },
    // 0 = kotak + roll, 1 = hanya roll dan roll jadi titik putar
    fokus(t) {
      if (!rc) return;
      poros.position.set(-rc.x * s * t, py, -rc.z * s * t);
      kotak.forEach(k => { k.visible = t < .98; k.scale.setScalar(Math.max(.001, 1 - t)); });
    },
    async ganti(slug, warna) {
      const bb = await bahanWarna(slug, warna, cariTpl(gl.scene));
      pakaiBahan(isi, bb);
      this.warna = warna;
    },
  };
}

export const buatRoll = (slug, warna) => rakit(M.produk[slug].glb, { slug, warna });
export const buatBuka = warna => rakit(M.ekstra['kindmax-buka'], { slug: 'kindmax', warna: adaModel('kindmax', warna) ? warna : 'Merah' });
export const buatTumpukan = () => rakit(M.ekstra.tumpukan, null);
export const muatAwal = slug => M.produk[slug] && muatDasar(M.produk[slug].glb);
export { THREE };
