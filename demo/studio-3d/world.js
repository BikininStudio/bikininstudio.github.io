// Meja kerja Bikinin Studio: satu dunia 3D dipakai bersama oleh ketiga bab (tiap bab hanya mengatur kamera dan sorotan).
// Empat benda = empat layanan: laptop (website), ponsel (aplikasi), buku (PPT), stempel (logo).
import { canvasTexture, blobShadow, roundedBox, applyEnv, mix } from "../3d/kit3d.js";
import { loadImage } from "../3d/scroll3d.js";

export const ITEMS = [
  { id: "laptop", nama: "Laptop", layanan: "website" },
  { id: "ponsel", nama: "Ponsel", layanan: "aplikasi web" },
  { id: "buku", nama: "Buku", layanan: "presentasi (PPT)" },
  { id: "stempel", nama: "Stempel", layanan: "logo" },
];
// posisi benda: baris panjang (desktop) dan dua baris (HP)
const LAY_WIDE = [[-3.3, -0.5], [-1.1, 0.5], [1.3, -0.3], [3.4, 0.6]];
const LAY_TALL = [[-1.3, -1.7], [1.5, -1.3], [-1.4, 1.1], [1.4, 1.5]];
let cache;
export const getWorld = (THREE, ctx) => (cache ||= build(THREE, ctx));

// gambar karya dipotong menutup bidang (cover) lalu dijadikan tekstur
function cover(THREE, img, w, h) {
  return canvasTexture(THREE, w, h, (g) => {
    const k = Math.max(w / img.width, h / img.height);
    g.drawImage(img, (w - img.width * k) / 2, (h - img.height * k) / 2, img.width * k, img.height * k);
  });
}

async function build(THREE, ctx) {
  const [imgG, imgK, imgB] = await Promise.all([
    loadImage("../../assets/portfolio/ggstore.webp"), loadImage("../../assets/portfolio/demo-kasir-kopi-rindang.webp"), loadImage("../../assets/portfolio/belajar-01.webp"),
    document.fonts.load('600 80px "Fraunces"').catch(() => {}),
  ]);
  const scene = new THREE.Scene();
  await applyEnv(THREE, ctx, scene, 0.55);
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x6e5a48, 0.8));
  const key = new THREE.DirectionalLight(0xfff1de, 1.7); key.position.set(4, 9, 6); scene.add(key);
  const std = (c, r = 0.6, m = 0, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m, ...extra });

  // dinding datar sewarna panggung, dan meja walnut
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ color: "#B8A797", toneMapped: false }));
  wall.position.set(0, 6, -7); scene.add(wall);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(80, 40), new THREE.MeshBasicMaterial({ color: "#B8A797", toneMapped: false }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -0.41; scene.add(floor);
  const grain = canvasTexture(THREE, 512, 256, (g, w, h) => {
    g.fillStyle = "#8C6B52"; g.fillRect(0, 0, w, h);
    let s = 3; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) { g.fillStyle = r() > 0.5 ? "rgba(60,38,24,.12)" : "rgba(190,150,110,.1)"; g.fillRect(0, r() * h, w, 2 + r() * 6); }
  });
  const desk = new THREE.Mesh(new THREE.BoxGeometry(13, 0.4, 6.6), std("#ffffff", 0.55, 0, { map: grain })); desk.position.y = -0.2; scene.add(desk);

  const items = ITEMS.map(() => new THREE.Group());
  const screens = []; // bahan layar/penutup yang menyala saat disorot
  const lit = (map, img) => { const m = std("#ffffff", 0.35, 0, { map, emissive: "#ffffff", emissiveMap: map, emissiveIntensity: 0 }); screens.push(m); return m; };

  // Laptop: alas aluminium, penutup berdiri, layar GgStore
  {
    const g = items[0];
    const base = new THREE.Mesh(roundedBox(THREE, 2.5, 1.7, 0.1, 0.06), std("#B9B6B0", 0.35, 0.7)); base.rotation.x = -Math.PI / 2; base.position.y = 0.05; g.add(base);
    const lid = new THREE.Group(); lid.position.set(0, 0.1, -0.8); lid.rotation.x = -0.28; g.add(lid);
    const shell = new THREE.Mesh(roundedBox(THREE, 2.5, 1.6, 0.07, 0.05), std("#A9A6A0", 0.35, 0.7)); shell.position.y = 0.8; lid.add(shell);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.44), lit(cover(THREE, imgG, 1024, 640))); scr.position.set(0, 0.8, 0.045); lid.add(scr);
    const keys = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 0.7), std("#6E6B66", 0.7)); keys.rotation.x = -Math.PI / 2; keys.position.set(0, 0.106, 0.1); g.add(keys);
  }
  // Ponsel berdiri pada penyangga
  {
    const g = items[1];
    const stand = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.14, 0.7), std("#6F5A49", 0.7)); stand.position.y = 0.07; g.add(stand);
    const ph = new THREE.Group(); ph.position.set(0, 0.95, -0.05); ph.rotation.x = -0.18; g.add(ph);
    ph.add(new THREE.Mesh(roundedBox(THREE, 1.0, 1.9, 0.1, 0.12), std("#26211D", 0.3, 0.5)));
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.88, 1.74), lit(cover(THREE, imgK, 512, 1024))); scr.position.z = 0.056; ph.add(scr);
  }
  // Buku: sampul bergambar slide, tepi halaman krem
  {
    const g = items[2];
    const pages = new THREE.Mesh(new THREE.BoxGeometry(2.1, 0.26, 2.7), std("#E9E0CF", 0.9)); pages.position.y = 0.17; g.add(pages);
    const cov = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 2.8), std("#5B6B5A", 0.7)); cov.position.y = 0.03; g.add(cov);
    const top = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.06, 2.8), std("#5B6B5A", 0.7)); top.position.y = 0.33; g.add(top);
    const slide = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.01), lit(cover(THREE, imgB, 1024, 576))); slide.rotation.x = -Math.PI / 2; slide.position.set(0, 0.364, -0.25); g.add(slide);
  }
  // Stempel kayu + kertas bercap logo "b" dan titik
  const stampG = new THREE.Group();
  {
    const g = items[3];
    const paperTex = canvasTexture(THREE, 512, 512, (c, w, h) => { c.fillStyle = "#EFE8DC"; c.fillRect(0, 0, w, h); });
    const paper = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.03, 2.4), std("#ffffff", 0.9, 0, { map: paperTex })); paper.position.set(0, 0.015, 0.2); g.add(paper);
    const logoTex = canvasTexture(THREE, 256, 256, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = "#33505E"; c.font = '600 190px "Fraunces", serif'; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillText("b", w / 2 - 14, h * 0.74);
      c.beginPath(); c.arc(w / 2 + 62, h * 0.7, 20, 0, 7); c.fill();
    });
    const print = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: logoTex, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); print.rotation.x = -Math.PI / 2; print.position.set(0, 0.034, 0.25); g.add(print);
    g.userData.print = print;
    const prof = [[0, 0], [0.55, 0], [0.55, 0.18], [0.4, 0.22], [0.2, 0.3], [0.17, 0.9], [0.3, 1.05], [0.34, 1.35], [0.24, 1.55], [0, 1.58]].map((p) => new THREE.Vector2(p[0], p[1]));
    const wood = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), std("#7A5640", 0.5)); stampG.add(wood);
    const rubber = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.06, 28), std("#2B2019", 0.8)); rubber.position.y = -0.03; stampG.add(rubber);
    stampG.position.set(0, 0.2, 0.25); g.add(stampG); g.userData.stamp = stampG;
  }
  items.forEach((g, i) => { g.userData.k = i; scene.add(g); const sh = blobShadow(THREE, 4.2, 0.35); sh.position.y = 0.012; g.add(sh); });

  // pelengkap: mug, pensil, tanaman kecil (tanpa tautan)
  const props = new THREE.Group(); scene.add(props);
  {
    const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.38, 0.8, 24), std("#D8CDBE", 0.35)); mug.position.set(5.0, 0.4, -1.1); props.add(mug);
    const handle = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.06, 8, 16), std("#D8CDBE", 0.35)); handle.position.set(5.4, 0.42, -1.1); props.add(handle);
    const pen = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 8), std("#C9A24A", 0.5)); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5; pen.position.set(-0.2, 0.06, 2.4); props.add(pen);
    const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.36, 0.6, 20), std("#A5694A", 0.8)); pot.position.set(-6.4, 0.3, -1.8); props.add(pot);
    const leaves = new THREE.Group(); leaves.position.set(-6.4, 0.6, -1.8); props.add(leaves);
    for (let i = 0; i < 7; i++) { const l = new THREE.Mesh(new THREE.SphereGeometry(0.3, 10, 8), std("#5F7A55", 0.7)); l.scale.set(0.5, 1.2, 0.18); l.position.set(Math.cos(i * 0.9) * 0.25, 0.4, Math.sin(i * 0.9) * 0.25); l.rotation.set(Math.sin(i) * 0.5, i, Math.cos(i * 2) * 0.6); leaves.add(l); }
    props.userData.leaves = leaves;
  }

  // sasaran klik (tak terlihat) untuk tiap benda
  const proxies = items.map((g, i) => { const m = new THREE.Mesh(new THREE.BoxGeometry(2.8, 2.2, 2.8), new THREE.MeshBasicMaterial({ visible: false })); m.userData.k = i; m.position.y = 1; g.add(m); return m; });

  const W = { scene, items, screens, proxies, props, portrait: false, lights: key };
  W.layout = (portrait) => { W.portrait = portrait; const L = portrait ? LAY_TALL : LAY_WIDE; items.forEach((g, i) => g.position.set(L[i][0], 0, L[i][1])); props.visible = !portrait; };
  W.layout(false);
  // cap stempel: menekan setiap beberapa detik, meninggalkan logo
  W.tick = (time, focusW) => {
    const t = time % 5, st = items[3].userData.stamp, pr = items[3].userData.print;
    const h = t < 1.2 ? 0.9 : t < 1.7 ? 0.9 * (1 - (t - 1.2) / 0.5) : t < 2.0 ? 0 : t < 2.6 ? (0.9 * (t - 2)) / 0.6 : 0.9;
    st.position.y = 0.04 + h;
    pr.material.opacity = t < 1.7 ? 0 : t < 4.4 ? 1 : 1 - (t - 4.4) / 0.6;
    props.userData.leaves.rotation.z = Math.sin(time * 0.8) * 0.04;
    // benda yang disorot menyala, lainnya agak redup
    const anyFocus = Math.max(0, ...focusW);
    screens.forEach((m, i) => { const w = focusW[i] || 0; m.emissiveIntensity = 0.35 * w; m.color.setScalar(mix(1, 0.85, anyFocus * (1 - w))); });
  };
  return W;
}
