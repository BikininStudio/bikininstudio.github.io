// Bab 1 · Kopi Rindang cold brew (brand fiktif): kaleng aluminium berdiri di konter kedai kayu.
// Panel 1 satu kaleng Original, panel 2 sisi belakang (kode batch terbaca), panel 3-5 satu rasa per panel
// (kaleng lain mundur ke kedalaman), panel 6 tiga kaleng berjajar tidak sama jarak.
// Kilau logam datang dari cetakan: peta metalness/roughness dibuat dari kanvas label yang sama (huruf dan pita = aluminium polos,
// area bertinta = lebih matte). Objek dibuat dari kode; untuk produk nyata ganti meshnya (GLB) dan pertahankan update() sebagai skenario gerak.
import { seg, mix, clamp, blobShadow, loadImage } from "../../3d/scroll3d.js";

const PANELS = 6; // samakan dengan jumlah .panel pada bab ini
const FLAVOURS = [
  { name: "Original", note: "Arabika Gayo · semi-washed · 1.400 mdpl (contoh)", bg: "#2F4A3A", ink: "#F4EBDD", accent: "#C8663B", logo: "putih", roast: 1, code: "KR-2610-B07" },
  { name: "Gula Aren", note: "Karamel · kelapa · gula aren cair", bg: "#B5582F", ink: "#F4EBDD", accent: "#3B2A20", logo: "putih", roast: 2, code: "KR-2610-B08" },
  { name: "Oat Latte", note: "Gandum · lembut · susu oat", bg: "#EADFCC", ink: "#2F4A3A", accent: "#B5582F", logo: "warna", roast: 1, code: "KR-2610-B09" },
];
const SANS = '"Hanken Grotesk", sans-serif';
const R = 0.78, H = 3.4, TOP = -H / 2 - 0.17; // TOP = tinggi dasar kaleng (permukaan konter)
// Posisi per panel: [x, z, skala, putaran Y] untuk tiap kaleng (null = tersembunyi). Kaleng depan selalu di x=0 pada panel 1-5.
const K = [
  [[0, 0, 1.15, 0.12], null, null],
  [[0, 0, 1.15, Math.PI + 0.12], null, null],
  [[0, 0, 1.1, 0.35], [-2.7, -2.2, 0.8, 0.5], [2.7, -2.2, 0.8, -0.3]],
  [[-2.7, -2.2, 0.8, 0.2], [0, 0, 1.1, 0.35], [2.7, -2.2, 0.8, -0.3]],
  [[-2.7, -2.2, 0.8, 0.2], [2.7, -2.2, 0.8, 0.5], [0, 0, 1.1, 0.35]],
  [[-0.35, 0, 0.92, 0.3], [-1.95, 0.1, 0.92, 0.1], [1.5, 0.05, 0.92, -0.25]],
];

function grain(g, w, h, n, a) {
  for (let i = 0; i < n; i++) { g.fillStyle = `rgba(0,0,0,${Math.random() * a})`; g.fillRect(Math.random() * w, Math.random() * h, 1, 1); }
}
// Daun dari bentuk logo, dipotong keluar di tepi kanan label
function leaf(g, x, y, s, rot) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(18, -26, 62, -28, 90, 0); g.bezierCurveTo(62, 28, 18, 26, 0, 0); g.fill();
  g.restore();
}

// Satu fungsi menggambar label untuk tiga kanal: warna (mode 0), metal/kasar (mode 1)
function paint(g, w, h, f, logo, mode, dew) {
  const alu = mode === 0 ? "#D4D8DB" : "rgb(0,46,255)"; // jendela aluminium: kasar .18, metal 1
  if (mode === 1) { g.fillStyle = "rgb(0,77,64)"; g.fillRect(0, 0, w, h); } // area bertinta: kasar .30, metal .25
  else { g.fillStyle = f.bg; g.fillRect(0, 0, w, h); grain(g, w, h, 90000, 0.07); }
  const col = (c) => (mode === 0 ? c : "rgb(0,77,64)");
  // tinta kedua: daun besar terpotong di kanan, bergeser 2px (salah registrasi cetak)
  g.fillStyle = col(f.accent);
  leaf(g, 1180, 250, 5.2, 0.5);
  g.globalAlpha = mode === 0 ? 0.9 : 1;
  g.fillStyle = col(f.ink);
  g.globalAlpha = 1;
  // pita aluminium atas dan bawah (area tanpa tinta)
  g.fillStyle = alu;
  g.fillRect(0, 64, w, 14); g.fillRect(0, h - 78, w, 14);
  // depan: u=0.5
  const cx = w / 2;
  g.textAlign = "center";
  g.fillStyle = alu;
  g.font = `700 54px ${SANS}`;
  g.letterSpacing = "10px";
  g.fillText("COLD BREW", cx, 200); // huruf tanpa tinta = jendela aluminium
  g.letterSpacing = "0px";
  if (mode === 0) {
    const lw = 460, lh = (logo.height / logo.width) * lw;
    g.drawImage(logo, cx - lw / 2, 250, lw, lh);
  }
  g.fillStyle = col(f.ink);
  g.font = '600 150px "Fraunces", serif';
  g.fillText(f.name, cx, 640);
  g.font = `500 28px ${SANS}`;
  g.fillText(f.note, cx, 706);
  // teks vertikal di sisi sambungan
  g.save(); g.translate(cx + 520, 520); g.rotate(-Math.PI / 2);
  g.font = `700 24px ${SANS}`; g.letterSpacing = "4px"; g.fillText("DISEDUH DINGIN 18 JAM", 0, 0); g.restore();
  g.letterSpacing = "0px";
  // belakang: berpusat di u=0 (dan u=1) supaya terbaca utuh saat kaleng diputar 180°
  const back = (bx) => {
    g.save(); g.beginPath(); g.rect(0, 0, w, h); g.clip();
    g.textAlign = "left"; g.fillStyle = col(f.ink);
    const x0 = bx - 330;
    g.font = `700 30px ${SANS}`; g.fillText("Komposisi", x0, 250);
    g.font = `400 26px ${SANS}`;
    const comp = f.name === "Gula Aren" ? "Air, kopi arabika Gayo, gula aren cair" : f.name === "Oat Latte" ? "Air, kopi arabika Gayo, susu oat, gula aren" : "Air, kopi arabika Gayo. Tanpa gula.";
    [comp, "Isi bersih 250 ml", "Simpan dingin 2-8 °C, kocok dulu", `${f.code} (contoh)`].forEach((t, i) => g.fillText(t, x0, 296 + i * 38));
    g.font = `700 24px ${SANS}`; g.fillText("Tingkat sangrai", x0, 478);
    for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x0 + 10 + i * 34, 512, 11, 0, Math.PI * 2); if (i < f.roast + 1) g.fill(); else { g.lineWidth = 3; g.strokeStyle = col(f.ink); g.stroke(); } }
    g.font = `400 24px ${SANS}`;
    g.fillText("Proyek konsep · brand fiktif", x0, 590); g.fillText("Desain kemasan: Bikinin Studio", x0, 624);
    let x = x0; for (let i = 0; i < 34; i++) { const bw = 3 + ((i * 7) % 5) * 2; g.fillRect(x, 670, bw, 100); x += bw + 5; }
    g.font = `400 20px ${SANS}`; g.fillText("0 000000 000000 (contoh)", x0, 800);
    g.restore();
  };
  back(0); back(w);
  // sambungan label: tumpang 6px dengan garis bayangan 1px di u=0.02
  g.fillStyle = mode === 0 ? "rgba(0,0,0,.28)" : "rgb(0,120,64)"; g.fillRect(w * 0.02, 0, 1.5, h);
  if (mode === 1 && dew) { // tetes embun: kasar lebih rendah
    g.fillStyle = "rgb(0,20,64)";
    dew.forEach(([x, y, r]) => { g.beginPath(); g.arc(x * (w / 1024), y * (h / 512), r * (w / 1024), 0, Math.PI * 2); g.fill(); });
  }
}

function makeDew(small) {
  let seed = 5; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const n = small ? 0 : 600, drops = [];
  for (let i = 0; i < n; i++) { const y = rnd() < 0.7 ? 150 + rnd() * 362 : rnd() * 150; drops.push([rnd() * 1024, y, 2 + rnd() * 5]); }
  return drops;
}

function textures(THREE, f, logo, small, dewDrops) {
  const sc = small ? 0.5 : 1, w = 2048 * sc, h = 1024 * sc;
  const mk = (mode, srgb) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"); g.scale(sc, sc);
    paint(g, 2048, 1024, f, logo, mode, dewDrops);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    return t;
  };
  const out = { map: mk(0, true), mr: mk(1, false) };
  if (dewDrops && dewDrops.length) { // peta tinggi tetes: kubah lembut
    const c = document.createElement("canvas"); c.width = 1024; c.height = 512;
    const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, 1024, 512);
    dewDrops.forEach(([x, y, r]) => { const rg = g.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, "#fff"); rg.addColorStop(1, "#000"); g.fillStyle = rg; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); });
    out.bump = new THREE.CanvasTexture(c);
  }
  return out;
}

function ringsTex(THREE) {
  const c = document.createElement("canvas"); c.width = c.height = 256;
  const g = c.getContext("2d"); g.fillStyle = "#888"; g.fillRect(0, 0, 256, 256);
  g.lineWidth = 4;
  for (let i = 1; i <= 8; i++) { g.strokeStyle = i % 2 ? "#ddd" : "#444"; g.beginPath(); g.arc(128, 128, i * 15, 0, Math.PI * 2); g.stroke(); }
  return new THREE.CanvasTexture(c);
}

function woodTex(THREE) {
  const c = document.createElement("canvas"); c.width = 1024; c.height = 256;
  const g = c.getContext("2d"); g.fillStyle = "#7A5C45"; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 90; i++) { g.strokeStyle = i % 2 ? "rgba(140,107,82,.55)" : "rgba(90,64,48,.35)"; g.lineWidth = 1 + Math.random() * 3; const y = Math.random() * 256; g.beginPath(); g.moveTo(0, y); g.bezierCurveTo(300, y + (Math.random() - .5) * 14, 700, y + (Math.random() - .5) * 14, 1024, y); g.stroke(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = THREE.RepeatWrapping; t.anisotropy = 4;
  return t;
}

function makeCan(THREE, tx, metal, ringTex, small, front) {
  const holder = new THREE.Group(), body = new THREE.Group();
  holder.add(body);
  const seg = small ? 32 : 64;
  const mat = new THREE.MeshPhysicalMaterial({ map: tx.map, metalnessMap: tx.mr, roughnessMap: tx.mr, metalness: 1, roughness: 1, clearcoat: 0.6, clearcoatRoughness: 0.15, envMapIntensity: 1 });
  if (tx.bump && front) { mat.bumpMap = tx.bump; mat.bumpScale = 0.8; }
  body.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, H, seg, 1, true, Math.PI), mat));
  const top = new THREE.LatheGeometry([[R * 0.8, H / 2 + 0.17], [R * 0.82, H / 2 + 0.27], [R * 0.86, H / 2 + 0.29], [R * 0.88, H / 2 + 0.25], [R * 0.9, H / 2 + 0.16], [R, H / 2 - 0.02]].map(([x, y]) => new THREE.Vector2(x, y)), seg);
  body.add(new THREE.Mesh(top, metal));
  // tutup: cakram bertekstur 8 cincin konsentris + lubang tarik dari Shape berlubang
  const lid = new THREE.Mesh(new THREE.CircleGeometry(R * 0.8, seg), new THREE.MeshStandardMaterial({ color: "#D9DCDF", metalness: 1, roughness: 0.3, bumpMap: ringTex, bumpScale: 2 }));
  lid.rotation.x = -Math.PI / 2; lid.position.y = H / 2 + 0.172;
  body.add(lid);
  const tabS = new THREE.Shape(); tabS.absellipse(0, 0, 0.3, 0.17, 0, Math.PI * 2, false);
  const hole = new THREE.Path(); hole.absellipse(0.1, 0, 0.07, 0.07, 0, Math.PI * 2, false); tabS.holes.push(hole);
  const tab = new THREE.Mesh(new THREE.ExtrudeGeometry(tabS, { depth: 0.02, bevelEnabled: false, curveSegments: 16 }), metal);
  tab.rotation.x = -Math.PI / 2; tab.position.set(0.12, H / 2 + 0.2, 0);
  body.add(tab);
  const bottom = new THREE.LatheGeometry([[R, -H / 2 + 0.02], [R * 0.95, -H / 2 - 0.12], [R * 0.82, -H / 2 - 0.17], [R * 0.6, -H / 2 - 0.1], [0, -H / 2 - 0.04]].map(([x, y]) => new THREE.Vector2(x, y)), seg);
  body.add(new THREE.Mesh(bottom, metal));
  const shadow = blobShadow(THREE, 2.6, 0.5);
  shadow.position.y = TOP + 0.01;
  holder.add(shadow);
  return { holder, body, shadow };
}

export async function create(THREE, ctx) {
  // RoomEnvironment diimpor di sini (bukan di puncak modul) supaya mode gambar diam tidak menarik Three.js
  const [putih, warna, { RoomEnvironment }] = await Promise.all([loadImage("logo-putih.png"), loadImage("logo-warna.png"), import("../../3d/RoomEnvironment.js"),
    document.fonts.load('600 150px "Fraunces"'), document.fonts.load(`700 54px ${SANS}`), document.fonts.load(`400 26px ${SANS}`), document.fonts.load(`500 34px ${SANS}`)]);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(ctx.renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 1.0;
  scene.environmentRotation.y = 0.6; // garis pantul tegak jatuh di sisi kiri kaleng
  const key = new THREE.DirectionalLight("#FFE9D2", 1.4); key.position.set(-4, 6, 6);
  const rim = new THREE.DirectionalLight("#DDE6EA", 0.8); rim.position.set(4, 3, -6);
  scene.add(key, rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.1, 12);
  camera.lookAt(0, -0.3, 0);

  const metal = new THREE.MeshStandardMaterial({ color: "#D9DCDF", metalness: 1, roughness: 0.28, side: THREE.DoubleSide });
  const world = new THREE.Group();
  scene.add(world);
  // konter kedai: papan kayu, serat memanjang
  const wood = woodTex(THREE); wood.repeat.set(4, 1);
  const counter = new THREE.Mesh(new THREE.BoxGeometry(34, 0.3, 5.5), new THREE.MeshStandardMaterial({ map: wood, roughness: 0.7 }));
  counter.position.set(0, TOP - 0.15, -0.8);
  world.add(counter);

  const ring = ringsTex(THREE), drops = makeDew(ctx.small);
  const cans = FLAVOURS.map((f, i) => makeCan(THREE, textures(THREE, f, f.logo === "putih" ? putih : warna, ctx.small, i === 0 ? drops : null), metal, ring, ctx.small, i === 0));
  cans.forEach((c) => world.add(c.holder));

  let aspect = 1, start = -1;
  return {
    scene, camera,
    toneMapping: THREE.ACESFilmicToneMapping,
    resize(w, h) { aspect = w / h; camera.aspect = aspect; camera.updateProjectionMatrix(); },
    update(p, dt, time) {
      if (start < 0) start = time;
      // tempo bab ini: pelan dan berat (perubahan ~1,1 dtk per panel)
      const s = p * (PANELS - 1), enter = seg(time - start, 0, 1.3);
      const portrait = aspect < 0.9;
      const viewW = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360) * aspect;
      const k = clamp(Math.floor(s), 0, PANELS - 2), t = seg(s, k + 0.15, k + 0.85) , a = K[k], b = K[k + 1];
      const wscale = portrait ? 0.62 : 1;
      world.scale.setScalar(wscale);
      world.position.x = portrait ? 0 : Math.min(2.6, viewW * 0.25); // kaleng di 7/12 sisi kanan, teks di kiri
      world.position.y = portrait ? 0.8 : 0;
      world.rotation.y = ctx.pointer.x * 0.1;
      cans.forEach((c, i) => {
        const A = a[i], B = b[i];
        const from = A || (B && [B[0], B[1], 0.001, B[3]]), to = B || (A && [A[0], A[1], 0.001, A[3]]);
        if (!from) { c.holder.visible = false; return; }
        c.holder.visible = true;
        const m = (j) => mix(from[j], to[j], t);
        const sc = m(2) * mix(0.94, 1, enter);
        c.holder.position.set(m(0), mix(-0.6, 0, enter) + Math.sin(time * 0.6 + i * 2) * 0.012, m(1));
        c.holder.scale.setScalar(Math.max(0.001, sc));
        c.body.rotation.y = m(3) + ctx.spin * (i === 0 ? 1 : 0) + Math.sin(time * 0.5 + i) * 0.03;
        c.shadow.material.opacity = 0.5;
      });
      return true;
    },
  };
}
