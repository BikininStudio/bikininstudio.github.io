// Lorong pameran Pekan Karya Bukit Rawa: tiga ruang berdinding warna beda, enam karya contoh. Dunia dipakai bersama semua bab.
import { canvasTexture, applyEnv, mix } from "../3d/kit3d.js";
import { KARYA, drawArt } from "./art.js";
import { createHumans } from "../3d/humans.js";
import { createGlbHumans } from "../3d/humans-glb.js";

export const ZK = [-4, -10, -16, -22, -28, -34]; // posisi z tiap karya
export const WX = 3.4; // setengah lebar lorong
const ROOMS = [{ z0: 6.2, z1: -13, c: "#A9B09A" }, { z0: -13, z1: -25, c: "#B98E78" }, { z0: -25, z1: -38, c: "#9FAAB0" }];
let cache;
export const getWorld = (THREE, ctx) => (cache ||= build(THREE, ctx));

function plaque(THREE, k) {
  return canvasTexture(THREE, 512, 256, (g, w, h) => {
    g.fillStyle = "#F1EBDF"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#1F2422"; g.textAlign = "left";
    g.font = '700 22px "Hanken Grotesk", sans-serif'; g.fillText(`Karya ${k + 1} dari 6`, 24, 40);
    g.font = '700 38px "Bricolage Grotesque", "Hanken Grotesk", sans-serif';
    const words = KARYA[k].judul.split(" "); let line = "", y = 96;
    words.forEach((wd) => { const t = line ? line + " " + wd : wd; if (g.measureText(t).width > w - 48) { g.fillText(line, 24, y); line = wd; y += 44; } else line = t; });
    g.fillText(line, 24, y);
    g.font = '500 24px "Hanken Grotesk", sans-serif'; g.fillText(KARYA[k].kelas, 24, 196);
    g.font = '500 18px "Hanken Grotesk", sans-serif'; g.fillStyle = "#4A4A44"; g.fillText("Gambar contoh buatan Bikinin Studio", 24, 234);
  });
}

async function build(THREE, ctx) {
  await Promise.all([document.fonts.load('700 30px "Bricolage Grotesque"'), document.fonts.load('700 20px "Hanken Grotesk"'), document.fonts.load('500 20px "Hanken Grotesk"')]).catch(() => {});
  const scene = new THREE.Scene();
  if (!ctx.small) await applyEnv(THREE, ctx, scene, 0.5);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a7d6a, ctx.small ? 1.8 : 0.8));
  scene.fog = new THREE.Fog("#CFC8B8", 26, 90);
  const small = ctx.small;
  const KEEP = ["map", "side", "transparent", "opacity", "emissive", "emissiveMap", "emissiveIntensity", "flatShading", "alphaTest"];
  const std = (c, r = 0.8, extra = {}) => {
    if (!small) return new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
    const e = {}; for (const k of KEEP) if (k in extra) e[k] = extra[k];
    return new THREE.MeshLambertMaterial({ color: c, ...e });
  };

  // lantai teraso, langit-langit, dinding per ruang
  const terrazzo = canvasTexture(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#C9C0B0"; g.fillRect(0, 0, w, h);
    let s = 5; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) { g.fillStyle = ["#B3A892", "#D8D0C0", "#A89C86", "#BFB5A3"][i % 4]; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 3, 0, 7); g.fill(); }
  });
  terrazzo.wrapS = terrazzo.wrapT = THREE.RepeatWrapping; terrazzo.repeat.set(4, 22);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WX * 2, 46.1), std("#ffffff", 0.3, { map: terrazzo, bumpMap: terrazzo, bumpScale: 0.25, envMapIntensity: 1.2 })); floor.receiveShadow = true; floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -16.95); scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(WX * 2, 46.1), std("#DAD3C5", 0.9)); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4, -16.95); scene.add(ceil);
  const plasterTex = {};
  const plasterMat = (c, len, vr = 1) => {
    if (!plasterTex[c]) {
      plasterTex[c] = canvasTexture(THREE, 256, 256, (g, w, h) => {
        g.fillStyle = c; g.fillRect(0, 0, w, h);
        let sd = 9; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
        g.filter = "blur(3px)"; for (let i = 0; i < 500; i++) { g.fillStyle = r() > 0.5 ? "rgba(255,255,255,.035)" : "rgba(0,0,0,.035)"; g.beginPath(); g.arc(r() * w, r() * h, 2 + r() * 6, 0, 6.3); g.fill(); } g.filter = "none";
        const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, "rgba(255,255,255,.05)"); gr.addColorStop(1, "rgba(0,0,0,.09)"); g.fillStyle = gr; g.fillRect(0, 0, w, h);
      });
      plasterTex[c].wrapS = plasterTex[c].wrapT = THREE.RepeatWrapping;
    }
    const t = plasterTex[c].clone(); t.needsUpdate = true; t.repeat.set(len / 4, vr);
    return std("#ffffff", 0.92, { map: t, bumpMap: t, bumpScale: 0.12 });
  };
  ROOMS.forEach((r) => {
    const len = r.z0 - r.z1, zc = (r.z0 + r.z1) / 2;
    [-1, 1].forEach((sd) => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, len), plasterMat(r.c, len)); w.position.set(sd * (WX + 0.1), 2, zc); w.receiveShadow = true; scene.add(w); });
  });
  const endWall = new THREE.Mesh(new THREE.BoxGeometry(WX * 2 + 0.4, 4, 0.2), std("#9FAAB0", 0.9)); endWall.position.set(0, 2, -38.1); scene.add(endWall);
  const frontWall = new THREE.Mesh(new THREE.BoxGeometry(WX * 2 + 0.4, 4, 0.2), std("#A9B09A", 0.9)); frontWall.position.set(0, 2, 6.1); scene.add(frontWall);
  // lengkung pintu antarruang (dua tiang + palang)
  [-13, -25].forEach((z) => {
    [-1, 1].forEach((sd) => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.5, 4, 0.5), std("#E6DFD1", 0.7)); p.position.set(sd * (WX - 0.25), 2, z); scene.add(p); });
    const beam = new THREE.Mesh(new THREE.BoxGeometry(WX * 2, 0.5, 0.5), std("#E6DFD1", 0.7)); beam.position.set(0, 3.75, z); scene.add(beam);
  });

  // karya: bingkai kayu + gambar + label dinding
  const arts = KARYA.map((k, i) => {
    const left = false, x = (left ? -1 : 1) * (WX - 0.02), z = ZK[i];
    const g = new THREE.Group(); g.position.set(x, 1.75, z); g.rotation.y = left ? Math.PI / 2 : -Math.PI / 2;
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.7, 2.1, 0.14), std("#6B4A3A", 0.55)); frame.position.z = 0.07; g.add(frame);
    const mat = new THREE.MeshStandardMaterial({ map: canvasTexture(THREE, small ? 512 : 1024, small ? 384 : 768, (c, w, h) => { c.save(); c.scale(w / 1024, h / 768); drawArt(i, c, 1024, 768); c.restore(); }), roughness: 0.6, emissive: "#ffffff", emissiveIntensity: 0 });
    mat.emissiveMap = mat.map;
    const pic = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.8), mat); pic.position.z = 0.15; g.add(pic);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.55), new THREE.MeshStandardMaterial({ map: plaque(THREE, i), roughness: 0.8 })); lab.position.set(left ? 1.9 : 1.9, -0.55, 0.02); g.add(lab);
    scene.add(g);
    return { g, mat, pic };
  });

  // patung sederhana di atas alas, dua bangku
  const ped = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.0, 0.9), std("#F0ECE4", 0.6)); ped.position.set(-1.9, 0.5, -19); scene.add(ped);
  const prof = [[0, 0], [0.34, 0.02], [0.4, 0.3], [0.2, 0.7], [0.14, 0.95], [0.26, 1.15], [0.1, 1.3], [0, 1.32]].map((p) => new THREE.Vector2(p[0], p[1]));
  const statue = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), std("#B9A27F", 0.45)); statue.position.set(-1.9, 1.0, -19); statue.castShadow = ped.castShadow = !small; scene.add(statue);

  // ===== peningkatan: arsitektur, jendela berkas cahaya, ruang bernama, pameran 3D di meja, pengunjung hidup =====
  const cache2 = {};
  const woodTex = canvasTexture(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#E4E0DA"; g.fillRect(0, 0, w, h);
    let sd = 17; const r = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) { const x = r() * w; g.strokeStyle = `rgba(60,36,22,${0.05 + r() * 0.13})`; g.lineWidth = 0.6 + r() * 2.2; g.beginPath(); g.moveTo(x, 0); g.bezierCurveTo(x + (r() - 0.5) * 16, h * 0.33, x + (r() - 0.5) * 16, h * 0.66, x + (r() - 0.5) * 10, h); g.stroke(); }
    for (let i = 0; i < 3; i++) { g.fillStyle = "rgba(60,36,22,.12)"; g.beginPath(); g.ellipse(r() * w, r() * h, 3 + r() * 4, 6 + r() * 8, 0, 0, 7); g.fill(); }
  });
  const WOOD = new Set(["#6B4A3A", "#9A7050", "#8A6445", "#4A3326", "#5A3E2E", "#3E2C21"]);
  const sm = (c, r = 0.8) => (cache2[c + r] ||= WOOD.has(c) ? std(c, Math.min(r, 0.55), { map: woodTex, bumpMap: woodTex, bumpScale: 0.35 }) : std(c, r));
  const bx = (w, h, d, c, x, y, z, parent = scene, r = 0.8) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), typeof c === "string" ? sm(c, r) : c); m.position.set(x, y, z); m.castShadow = !small && Math.abs(x) < WX - 0.3 && y + h / 2 < 2.4; parent.add(m); return m; };
  const cy = (rt, rb, h, c, x, y, z, parent = scene, n = 12) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, n), sm(c)); m.position.set(x, y, z); parent.add(m); return m; };
  const warm = new THREE.MeshBasicMaterial({ color: "#FFF1CF" });
  const dadoTex = canvasTexture(THREE, 256, 128, (g, w, h) => {
    g.fillStyle = "#7E6F5C"; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 2; i++) {
      const x = 14 + i * 124;
      g.fillStyle = "#6E6050"; g.fillRect(x, 12, 112, 104);
      g.fillStyle = "#8D7D68"; g.fillRect(x + 6, 18, 100, 92);
      g.fillStyle = "rgba(255,255,255,.18)"; g.fillRect(x + 6, 18, 100, 3); g.fillRect(x + 6, 18, 3, 92);
      g.fillStyle = "rgba(0,0,0,.25)"; g.fillRect(x + 6, 107, 100, 3); g.fillRect(x + 103, 18, 3, 92);
    }
  });
  dadoTex.wrapS = dadoTex.wrapT = THREE.RepeatWrapping; dadoTex.repeat.set(15, 1);
  const dadoMat = std("#ffffff", 0.75, { map: dadoTex });
  // lis dasar, dado, rel kursi
  [-1, 1].forEach((sd) => { bx(0.06, 0.2, 46, "#4A3A30", sd * (WX - 0.03), 0.1, -16.9); bx(0.05, 0.85, 46, dadoMat, sd * (WX - 0.02), 0.62, -16.9); bx(0.08, 0.06, 46, "#E6DFD1", sd * (WX - 0.04), 1.08, -16.9); });
  // lis atap (cornice) di kedua dinding
  [-1, 1].forEach((sd) => { bx(0.16, 0.16, 46, "#E6DFD1", sd * (WX - 0.08), 3.92, -16.9); bx(0.1, 0.08, 46, "#CFC6B4", sd * (WX - 0.05), 3.8, -16.9); });
  // pilaster di antara jendela (dinding kiri) dengan kaki dan kepala tiang
  ZK.forEach((zk) => { const z = zk - 3; bx(0.16, 3.4, 0.4, "#E6DFD1", -WX + 0.08, 1.9, z); bx(0.24, 0.2, 0.52, "#CFC6B4", -WX + 0.1, 0.1, z); bx(0.24, 0.18, 0.52, "#CFC6B4", -WX + 0.1, 3.7, z); });
  // lampu bingkai di atas tiap karya
  ZK.forEach((zk) => { bx(0.14, 0.05, 1.5, "#B8946A", WX - 0.12, 3.02, zk); bx(0.04, 0.03, 1.35, warm, WX - 0.18, 2.97, zk); });
  // hiasan lengkung antarruang: kaki, kepala tiang, bingkai bawah balok, batu kunci
  [-13, -25].forEach((z) => {
    [-1, 1].forEach((sd) => { bx(0.74, 0.22, 0.74, "#CFC6B4", sd * (WX - 0.25), 0.11, z); bx(0.74, 0.2, 0.74, "#CFC6B4", sd * (WX - 0.25), 3.45, z); });
    bx(WX * 2 - 0.9, 0.1, 0.62, "#CFC6B4", 0, 3.42, z);
  });
  // balok langit-langit + lampu panel
  for (let z = -34; z <= 2; z += 4) { bx(WX * 2, 0.18, 0.28, "#CFC6B4", 0, 3.9, z); bx(1.4, 0.04, 0.5, warm, 0, 3.96, z + 2); }
  // permadani memanjang
  const rugTex = canvasTexture(THREE, 128, 256, (g, w, h) => {
    g.fillStyle = "#7A4B3A"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#E3D6BC"; g.fillRect(6, 0, 6, h); g.fillRect(w - 12, 0, 6, h);
    g.fillStyle = "#C9A66B"; g.fillRect(16, 0, 3, h); g.fillRect(w - 19, 0, 3, h);
    g.fillStyle = "#B8946A"; for (let i = 0; i < 2; i++) { g.save(); g.translate(w / 2, 64 + i * 128); g.rotate(Math.PI / 4); g.fillRect(-22, -22, 44, 44); g.fillStyle = "#7A4B3A"; g.fillRect(-12, -12, 24, 24); g.fillStyle = "#B8946A"; g.restore(); }
  });
  rugTex.wrapS = rugTex.wrapT = THREE.RepeatWrapping; rugTex.repeat.set(1, 9);
  const rug = new THREE.Mesh(new THREE.PlaneGeometry(2.1, 45), std("#ffffff", 0.95, { map: rugTex })); rug.receiveShadow = true; rug.rotation.x = -Math.PI / 2; rug.position.set(-0.3, 0.012, -16.4); scene.add(rug);
  // jendela di dinding kiri, berkas cahaya ke lantai, tirai
  const glowTex = canvasTexture(THREE, 128, 128, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(255,244,216,1)"); gr.addColorStop(1, "rgba(255,244,216,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const beams = [];
  ZK.forEach((zk, i) => {
    bx(0.14, 1.8, 2.5, "#E6DFD1", -WX + 0.06, 2.2, zk);
    const gl = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 1.5), new THREE.MeshBasicMaterial({ color: "#EAF3F7" })); gl.rotation.y = Math.PI / 2; gl.position.set(-WX + 0.14, 2.2, zk); scene.add(gl);
    bx(0.05, 1.5, 0.06, "#E6DFD1", -WX + 0.16, 2.2, zk); bx(0.05, 0.06, 2.2, "#E6DFD1", -WX + 0.16, 2.2, zk);
    bx(0.32, 0.08, 2.7, "#CFC6B4", -WX + 0.16, 1.28, zk);
    [-1.35, 1.35].forEach((dz) => bx(0.12, 2.1, 0.45, i % 2 ? "#C9B38C" : "#B98E78", -WX + 0.2, 2.15, zk + dz));
    if (!small) {
      const bm = new THREE.MeshBasicMaterial({ color: "#FFF4D8", transparent: true, opacity: 0.1, depthWrite: false, blending: THREE.AdditiveBlending });
      const beam = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.01, 1.9), bm); beam.rotation.z = -0.66; beam.position.set(-WX + 1.5, 1.1, zk); scene.add(beam);
      const patch = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.4), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending })); patch.rotation.x = -Math.PI / 2; patch.position.set(-WX + 2.6, 0.02, zk); scene.add(patch);
      beams.push({ bm, patch, ph: i * 1.1 });
    }
  });
  // tanaman pot: pot berbibir + tanah + batang dan daun lebar (bergoyang pelan)
  const plants = [];
  const leafGeo = new THREE.SphereGeometry(0.16, 8, 6), stemGeo = new THREE.CylinderGeometry(0.01, 0.016, 1, 5);
  const leafMats = ["#4F8F5E", "#5E9E6B", "#3F7E55", "#6FAE74"].map((c) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.5, side: THREE.DoubleSide }));
  const plant = (x, z, tall = false) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    cy(0.3, 0.22, 0.52, "#B8946A", 0, 0.26, 0, g, 14); cy(0.33, 0.31, 0.06, "#A07B58", 0, 0.52, 0, g, 14); cy(0.27, 0.27, 0.02, "#3A2B22", 0, 0.545, 0, g, 12);
    const n = small ? 8 : 16;
    for (let k = 0; k < n; k++) {
      const a2 = (k / n) * Math.PI * 2 + (k % 2) * 0.4, h = 0.55 + (k % 5) * 0.15 + (tall ? 0.55 : 0), tilt = 0.35 + ((k * 37) % 10) / 20;
      const piv = new THREE.Group(); piv.position.set(0, 0.54, 0); piv.rotation.y = a2; g.add(piv);
      const lean = new THREE.Group(); lean.rotation.z = -tilt; piv.add(lean);
      const st = new THREE.Mesh(stemGeo, sm("#4A7A48")); st.scale.y = h; st.position.y = h / 2; lean.add(st);
      const lf = new THREE.Mesh(leafGeo, leafMats[k % 4]); lf.scale.set(0.9 + (k % 3) * 0.15, 0.13, 1.4); lf.position.set(0.05, h, 0); lf.rotation.z = 0.25; lean.add(lf);
      plants.push({ lean, ph: k * 0.7 + x * 0.9, base: -tilt });
    }
  };
  [[-2.8, -11.6], [2.8, -11.6], [-2.8, -23.6], [2.8, -23.6], [-2.8, 0.8]].forEach(([x, z]) => plant(x, z));
  plant(2.8, -36.4, true);
  // nama ruang di balok lengkung + spanduk ujung lorong
  const sign = (text, w, h, y, z, size = 30) => {
    const t = canvasTexture(THREE, Math.round(w * 160), Math.round(h * 160), (g, cw, ch) => { g.fillStyle = "#2B3A55"; g.fillRect(0, 0, cw, ch); g.fillStyle = "#F1EEE6"; g.font = `700 ${size}px "Bricolage Grotesque", "Hanken Grotesk", sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(text, cw / 2, ch / 2 + 2); });
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ map: t })); m.position.set(0, y, z); scene.add(m);
  };
  sign("RUANG 2 · KARYA TANGAN & DESAIN", 4.6, 0.36, 3.75, -12.74, 24);
  sign("RUANG 3 · TEKNOLOGI & FOTO", 4.6, 0.36, 3.75, -24.74, 24);
  const endBanner = canvasTexture(THREE, 1024, 512, (g, w, h) => {
    g.fillStyle = "#2B3A55"; g.fillRect(0, 0, w, h); g.fillStyle = "#C08A3E"; g.fillRect(0, h - 34, w, 34);
    g.fillStyle = "#F1EEE6"; g.textAlign = "center"; g.textBaseline = "middle";
    g.font = '700 74px "Bricolage Grotesque", sans-serif'; g.fillText("Terima kasih", w / 2, 170);
    g.font = '700 74px "Bricolage Grotesque", sans-serif'; g.fillText("sudah berkunjung", w / 2, 262);
    g.font = '500 34px "Hanken Grotesk", sans-serif'; g.fillText("Pekan Karya Bukit Rawa · proyek konsep", w / 2, 360);
  });
  const eb = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 2.6), new THREE.MeshBasicMaterial({ map: endBanner })); eb.position.set(0, 2.0, -37.95); scene.add(eb);
  // meja buku tamu di pintu masuk + papan selamat datang
  bx(0.7, 0.85, 1.5, "#6B4A3A", 3.0, 0.43, 2.2); bx(0.36, 0.06, 0.5, "#F1EEE6", 3.0, 0.9, 2.2); bx(0.04, 0.12, 0.04, "#2B3A55", 3.0, 0.96, 2.45);
  const welcome = canvasTexture(THREE, 512, 640, (g, w, h) => {
    g.fillStyle = "#F1EEE6"; g.fillRect(0, 0, w, h); g.fillStyle = "#2B3A55"; g.fillRect(0, 0, w, 120);
    g.fillStyle = "#F1EEE6"; g.textAlign = "center"; g.font = '700 46px "Bricolage Grotesque", sans-serif'; g.fillText("Selamat datang", w / 2, 78);
    g.fillStyle = "#1F2422"; g.font = '700 34px "Hanken Grotesk", sans-serif'; g.fillText("Pekan Karya", w / 2, 190); g.fillText("Bukit Rawa", w / 2, 236);
    g.font = '500 28px "Hanken Grotesk", sans-serif'; ["Enam karya kelas", "tiga ruang", "08.00 – 15.00", "Gratis, tanpa daftar"].forEach((t, i) => g.fillText(t, w / 2, 320 + i * 52));
  });
  const wp = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshBasicMaterial({ map: welcome })); wp.rotation.y = -Math.PI / 2; wp.position.set(WX - 0.15, 1.9, 0.2); scene.add(wp);
  bx(0.06, 1.37, 1.12, "#6B4A3A", WX - 0.07, 1.9, 0.2);
  // meja pameran 3D di samping label tiap karya
  const glass = new THREE.MeshStandardMaterial({ color: "#9FC4D6", roughness: 0.1, transparent: true, opacity: 0.5 });
  ZK.forEach((zk, i) => {
    const g = new THREE.Group(); g.position.set(2.8, 0, zk + 3.1); scene.add(g);
    bx(0.8, 0.07, 1.2, "#3E2C21", 0, 0.035, 0, g); bx(0.76, 0.48, 1.16, "#6B4A3A", 0, 0.31, 0, g, 0.6); [-0.3, 0.3].forEach((dz) => { bx(0.02, 0.34, 0.46, "#5A3E2E", -0.385, 0.3, dz, g, 0.6); bx(0.02, 0.03, 0.16, "#C3A06A", -0.4, 0.4, dz, g, 0.4); }); bx(0.88, 0.05, 1.28, "#EDE6D8", 0, 0.585, 0, g, 0.5); bx(0.8, 0.012, 1.2, "#F8F4EC", 0, 0.614, 0, g, 0.5);
    if (i === 0) { bx(0.5, 0.3, 0.42, glass, 0, 0.77, 0, g); bx(0.46, 0.14, 0.38, "#4F7F95", 0, 0.69, 0, g); const c = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), sm("#F4F1EA")); c.position.set(0, 1.0, 0); c.scale.y = 0.6; g.add(c); }
    if (i === 1) { [["#9E4B3F", -0.28], ["#C08A3E", -0.08], ["#6B4B36", 0.12], ["#5E8A5A", 0.32]].forEach(([c, z]) => { cy(0.07, 0.07, 0.2, c, 0, 0.72, z, g, 10); cy(0.075, 0.075, 0.03, "#E9E2D2", 0, 0.84, z, g, 10); }); }
    if (i === 2) { [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]].forEach(([x, z]) => bx(0.03, 0.18, 0.03, "#B8946A", x, 0.7, z, g)); bx(0.4, 0.03, 0.3, "#B8946A", 0, 0.8, 0, g); bx(0.32, 0.18, 0.24, "#D8CBB0", 0, 0.9, 0, g); const rf = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.16, 4), sm("#8C5B47")); rf.rotation.y = Math.PI / 4; rf.position.set(0, 1.06, 0); g.add(rf); }
    if (i === 3) { ["#B9483A", "#3E7F7C", "#D6A93A", "#2B3A55", "#7C4F7A"].forEach((c, k) => { bx(0.04, 0.26, 0.17, "#F1EEE6", 0.0, 0.76, -0.4 + k * 0.2, g); bx(0.045, 0.13, 0.12, c, 0.01, 0.78, -0.4 + k * 0.2, g); }); }
    if (i === 4) { bx(0.34, 0.02, 0.4, "#3A424D", 0, 0.62, 0, g); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.34, 0.24), new THREE.MeshBasicMaterial({ map: arts[4].mat.map })); sc.rotation.y = -Math.PI / 2; sc.rotation.z = 0; sc.position.set(-0.17, 0.78, 0); sc.rotation.x = 0; g.add(sc); }
    if (i === 5) { ["#B8946A", "#7C9A8F", "#C0794F"].forEach((c, k) => { bx(0.04, 0.3, 0.22, "#F1EEE6", 0, 0.77, -0.3 + k * 0.3, g); bx(0.045, 0.24, 0.17, c, 0.01, 0.78, -0.3 + k * 0.3, g); }); }
  });

  // ---- tokoh: pengunjung berjalan dan berhenti di tiap karya, pendamping, pencatat buku tamu, dua orang duduk di bangku ----
  const H = (await createGlbHumans(THREE, { small, shadow: !small, base: new URL("../assets/humans/", import.meta.url), models: ["siswa_l", "siswi_p", "siswi_h", "guru_l", "pengunjung_p"] })) || createHumans(THREE, { lit: small ? "lambert" : "standard", small, shadow: !small });
  const pm = (c) => sm(c, 0.85);
  let ps = 7; const prnd = () => ((ps = (ps * 16807) % 2147483647) / 2147483647);
  // tokoh: model bersama (../3d/humans.js); pengunjung berkaos pendek, rambut panjang atau pendek, sebagian berjilbab
  function person(shirt, x, z, ry, opts = {}) {
    const g = H.person(shirt, { short: true, ...opts, hairStyle: opts.hijab ? "hijab" : opts.long ? "long" : "short" }, prnd);
    g.scale.multiplyScalar(H.glb ? 1.0 : 1.13); g.position.set(x, 0, z); g.rotation.y = ry; scene.add(g);
    return g;
  }
  // bangku kayu berpapan, bersandaran dan bersandar tangan; di sisi dinding kiri yang kosong
  const bench = (x, z) => {
    const g = new THREE.Group(); g.position.set(x, 0, z); scene.add(g);
    for (let i = 0; i < 4; i++) bx(0.11, 0.045, 1.8, "#9A7050", -0.18 + i * 0.125, 0.5, 0, g, 0.6);
    for (let i = 0; i < 3; i++) bx(0.035, 0.1, 1.76, "#8A6445", -0.3, 0.64 + i * 0.12, 0, g, 0.6);
    [-0.8, 0.8].forEach((dz) => {
      bx(0.05, 0.48, 0.07, "#4A3326", -0.2, 0.24, dz, g); bx(0.05, 0.48, 0.07, "#4A3326", 0.2, 0.24, dz, g); bx(0.5, 0.04, 0.06, "#4A3326", 0, 0.14, dz, g);
      bx(0.07, 0.92, 0.07, "#4A3326", -0.3, 0.46, dz, g); bx(0.42, 0.04, 0.09, "#6B4A3A", -0.08, 0.7, dz * 1.04, g, 0.5);
    });
    return g;
  };
  bench(-2.75, -10); bench(-2.75, -27.5);
  const spots = ZK.map((zk) => [2.4, zk + 0.85]);
  const route = [{ p: [1.8, 18] }, { p: [1.0, 9.4] }, { p: [1.0, 5.2] }, { p: [1.95, 3.6] }];
  spots.forEach((sp, i) => { route.push({ p: [1.95, sp[1] + 0.4] }); route.push({ p: sp, v: i }); });
  route.push({ p: [1.5, -31.6] }); route.push({ p: [1.5, 3.4] }); route.push({ p: [0.3, 5.2] }); route.push({ p: [0.3, 9.4] }); route.push({ p: [1.8, 18] });
  const occ2 = [0, 0, 0, 0, 0, 0];
  const shirts2 = ["#B9483A", "#3E7F7C", "#7C4F7A", "#D6A93A", "#5E8A5A", "#2B3A55"];
  const agents = shirts2.slice(0, small ? 3 : 6).map((c, n) => {
    const g = person(c, 1.9, 3.2, Math.PI, { legs: ["#4A4F5A", "#3B4558", "#6B5B4E"][n % 3], long: n % 2 === 1 && n !== 3, hijab: n === 3, phone: n % 3 === 0, pack: n % 4 === 1 ? "#3B4558" : null });
    const a = { g, i: (n * 3) % route.length, ox: (n % 2) * 0.3, dwell: 0, wait: false, x: 0, z: 0, speed: 0.95 + (n % 3) * 0.12, hide: 0, vx: 0, vz: 0, heading: Math.PI, amp: 0, phase: n * 1.7 };
    a.x = route[a.i].p[0] + a.ox; a.z = route[a.i].p[1];
    return a;
  });
  const docent = person("#F1EEE6", 2.85, 0.8, 0, { legs: "#3B4558", long: true });
  const guest = person("#D6A93A", 2.3, 2.2, Math.PI / 2, { legs: "#4A4F5A" });
  const sitters = [person("#7C4F7A", -2.7, -9.7, Math.PI / 2, { sit: true, phone: true, long: true }), person("#3E7F7C", -2.7, -27.4, Math.PI / 2, { sit: true, pack: "#3B4558" })];
  // dust motes dalam berkas cahaya
  let dust = null; const NDUST = small ? 0 : 140; let dpos = null;
  if (NDUST) { dpos = new Float32Array(NDUST * 3); for (let k = 0; k < NDUST; k++) { dpos[k * 3] = -WX + 0.4 + prnd() * 3; dpos[k * 3 + 1] = 0.4 + prnd() * 3.2; dpos[k * 3 + 2] = -36 + prnd() * 40; } const dg = new THREE.BufferGeometry(); dg.setAttribute("position", new THREE.BufferAttribute(dpos, 3)); dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: "#FFF4D8", size: 0.035, transparent: true, opacity: 0.55, depthWrite: false })); scene.add(dust); }
  let lastT = null, camP = null;
  const setArms = (g, a0, a1) => H.arms(g, a0, a1);
  const restLegs = (g) => H.rest(g);
  const swayP = (g, sp, amp, time) => H.walk(g, sp, amp, time);
  // rintangan statis: meja pameran, meja buku tamu, bangku, alas patung, tanaman, orang duduk/berdiri
  const OBST = [[3.0 - 0.35, 3.0 + 0.35, 1.45, 2.95], [-3.15, -2.35, -10.9, -9.1], [-3.15, -2.35, -28.4, -26.6], [-2.35, -1.45, -19.45, -18.55]];
  ZK.forEach((zk) => OBST.push([2.4, 3.2, zk + 2.5, zk + 3.7]));
  OBST.push([1.5, 14, 6.0, 6.8], [-14, -1.5, 6.0, 6.8], [WX - 0.5, WX + 0.2, -13.4, -12.6], [WX - 0.5, WX + 0.2, -25.4, -24.6]);
  const CIRC = [[-2.8, -11.6, 0.4], [2.8, -11.6, 0.4], [-2.8, -23.6, 0.4], [2.8, -23.6, 0.4], [-2.8, 0.8, 0.4], [2.8, -36.4, 0.4], [2.85, 0.8, 0.35], [2.3, 2.2, 0.35], [-2.7, -9.7, 0.35], [-2.7, -27.4, 0.35]];
  const avoid = (ag) => {
    const R = 0.3;
    for (const [x0, x1, z0, z1] of OBST) {
      if (ag.x > x0 - R && ag.x < x1 + R && ag.z > z0 - R && ag.z < z1 + R) {
        const dl = ag.x - (x0 - R), dr = (x1 + R) - ag.x, dtp = ag.z - (z0 - R), db = (z1 + R) - ag.z, m = Math.min(dl, dr, dtp, db);
        if (m === dl) ag.x = x0 - R; else if (m === dr) ag.x = x1 + R; else if (m === dtp) ag.z = z0 - R; else ag.z = z1 + R;
      }
    }
    if (ag.z < 5.6) ag.x = Math.max(-WX + 0.45, Math.min(WX - 0.45, ag.x));
    for (const [cx, cz, cr] of CIRC) { const dx = ag.x - cx, dz = ag.z - cz, d = Math.hypot(dx, dz), mn = cr + R; if (d < mn && d > 1e-4) { ag.x = cx + dx / d * mn; ag.z = cz + dz / d * mn; } }
  };
  const extra = (time) => {
    const dt = lastT === null ? 0 : Math.min(0.25, Math.max(0, time - lastT)); lastT = time;
    agents.forEach((ag) => {
      const g = ag.g, u = g.userData;
      // pengunjung yang terlalu dekat dengan kamera disembunyikan supaya tidak menutupi layar
      const nearCam = camP && Math.hypot(ag.x - camP[0], ag.z - camP[2]) < 2.4;
      if (ag.hide > 0) { ag.hide -= dt; g.visible = false; if (ag.hide <= 0) { ag.i = 0; ag.x = route[0].p[0] + ag.ox * 0.3; ag.z = route[0].p[1]; ag.vx = ag.vz = 0; g.visible = true; } return; }
      const w = route[ag.i], isSpot = w.v !== undefined, back = ag.i >= route.length - 5;
      const tx = w.p[0] + (isSpot || back ? 0 : ag.ox * 0.5), tz = w.p[1];
      let standing = false;
      if (ag.dwell > 0) { ag.dwell -= dt; standing = true; if (ag.dwell <= 0) { occ2[w.v]--; ag.i++; ag.wait = false; } }
      else if (ag.wait) { ag.wait = false; ag.i++; }
      else {
        // kemudi: kecepatan dihaluskan, melambat saat mendekati titik berhenti, belok mulus
        let dist = Math.hypot(tx - ag.x, tz - ag.z);
        const want = isSpot ? Math.min(ag.speed, dist * 1.4 + 0.04) : ag.speed;
        const nx = dist > 1e-3 ? (tx - ag.x) / dist : 0, nz = dist > 1e-3 ? (tz - ag.z) / dist : 0, kk = Math.min(1, dt * 3.5);
        ag.vx += (nx * want - ag.vx) * kk; ag.vz += (nz * want - ag.vz) * kk;
        ag.x += ag.vx * dt; ag.z += ag.vz * dt;
        dist = Math.hypot(tx - ag.x, tz - ag.z);
        if (isSpot) { if (dist < 0.1) { ag.vx = ag.vz = 0; if (occ2[w.v] < 1) { occ2[w.v]++; ag.dwell = 7 + (u.ph % 3) * 2; } else ag.i++; } }
        else if (dist < 0.8) { ag.i++; if (ag.i >= route.length) ag.hide = 5 + (u.ph % 4); }
      }
      if (standing) { const damp = Math.max(0, 1 - dt * 8); ag.vx *= damp; ag.vz *= damp; }
      avoid(ag);
      const spd = Math.hypot(ag.vx, ag.vz);
      let face = ag.heading;
      if (spd > 0.18) face = Math.atan2(ag.vx, ag.vz); else if (standing) face = Math.PI / 2 + Math.sin(time * 0.6 + u.ph) * 0.18;
      let dr = face - ag.heading; dr = Math.atan2(Math.sin(dr), Math.cos(dr)); ag.heading += dr * Math.min(1, dt * 5);
      g.position.x = ag.x; g.position.z = ag.z; g.rotation.y = ag.heading; g.visible = !nearCam;
      // langkah mengikuti jarak tempuh; ayunan menyesuaikan kecepatan
      ag.amp += (Math.min(0.55, spd * 0.5) - ag.amp) * Math.min(1, dt * 6);
      ag.phase += spd * dt * 3.6;
      if (ag.amp > 0.04) H.walkPhase(g, ag.phase, ag.amp);
      else {
        restLegs(g);
        const shoot = u.phone && ag.dwell > 0 && ag.dwell < 4 && ag.dwell > 2;
        if (shoot) { setArms(g, -1.7, -1.7); u.phone.visible = true; u.flash.visible = ag.dwell < 3.2 && ag.dwell > 3.0; }
        else { setArms(g, 0.1, 0.1); if (u.phone) { u.phone.visible = false; u.flash.visible = false; } }
      }
    });
    // pendamping di buku tamu: menjelaskan; tamu menulis nama
    setArms(docent, -1.0 + Math.sin(time * 2.1) * 0.5, 0.05); docent.rotation.y = Math.sin(time * 0.7) * 0.25;
    setArms(guest, -1.2, -0.9 + Math.sin(time * 5) * 0.25);
    // dua orang duduk: satu memainkan ponsel, satu mengangguk
    const s0 = sitters[0].userData; H.arms(sitters[0], -0.45, -0.8, -0.35, -1.5); s0.phone.visible = true;
    sitters[1].rotation.y = Math.PI / 2 + Math.sin(time * 0.5) * 0.3; setArms(sitters[1], 0.05, -0.5 + Math.sin(time * 1.1) * 0.15);
    flagOut.rotation.y = Math.sin(time * 2.0) * 0.14; flagOut.children.forEach((c, k) => { c.rotation.z = Math.sin(time * 3 + k) * 0.03; });
    [...agents.map((a2) => a2.g), docent, guest, ...sitters].forEach((pg) => H.life(pg, time));
    plants.forEach((pl) => { pl.lean.rotation.z = pl.base + Math.sin(time * 1.1 + pl.ph) * 0.045; });
    beams.forEach((b) => { const k = 0.5 + 0.5 * Math.sin(time * 0.35 + b.ph); b.bm.opacity = 0.04 + 0.04 * k; b.patch.material.opacity = 0.3 + 0.2 * k; });
    if (dust) { for (let k = 0; k < NDUST; k++) { dpos[k * 3 + 1] += Math.sin(time * 0.6 + k) * 0.0009 + 0.0003; dpos[k * 3] += Math.cos(time * 0.4 + k * 1.7) * 0.0006; if (dpos[k * 3 + 1] > 3.8) dpos[k * 3 + 1] = 0.4; } dust.geometry.attributes.position.needsUpdate = true; }
  };

  // ===== pintu masuk: fasad sekolah, serambi, pintu ganda terbuka, halaman berjalur, tanaman =====
  scene.remove(frontWall);
  scene.background = new THREE.Color("#C5DCE8");
  const ex = (w, h, d, c, x, y, z, r = 0.85) => bx(w, h, d, c, x, y, z, scene, r);
  const faceMat = (len) => plasterMat("#E3DAC6", len * 3, 4);
  [-1, 1].forEach((sd) => { const m = new THREE.Mesh(new THREE.BoxGeometry(18.8, 5.6, 0.6), faceMat(18.8)); m.position.set(sd * 10.9, 2.8, 6.4); scene.add(m); });
  ex(3.0, 2.6, 0.6, "#E3DAC6", 0, 4.3, 6.4);
  ex(40.4, 0.5, 1.2, "#A86F55", 0, 5.85, 6.5); ex(40.4, 0.22, 1.5, "#8C5B47", 0, 6.15, 6.5);
  [-1, 1].forEach((sd) => { for (let i = 0; i < 4; i++) { const wx = sd * (5.2 + i * 3.8); ex(1.7, 2.1, 0.14, "#E6DFD1", wx, 2.9, 6.75); const gl = new THREE.Mesh(new THREE.PlaneGeometry(1.45, 1.85), new THREE.MeshStandardMaterial({ color: "#9DB8C6", roughness: 0.15, metalness: 0.2 })); gl.position.set(wx, 2.9, 6.83); scene.add(gl); ex(0.06, 1.85, 0.05, "#E6DFD1", wx, 2.9, 6.86); ex(1.45, 0.06, 0.05, "#E6DFD1", wx, 2.9, 6.86); ex(1.95, 0.1, 0.3, "#CFC6B4", wx, 1.82, 6.85); } });
  // kusen + dua daun pintu yang terbuka rata di sisi dalam dinding
  [-1, 1].forEach((sd) => { ex(0.18, 3.2, 0.06, "#6B4A3A", sd * 1.59, 1.6, 6.74); ex(0.18, 3.2, 0.06, "#6B4A3A", sd * 1.59, 1.6, 6.06); ex(1.15, 2.95, 0.07, "#6B4A3A", sd * 2.3, 1.48, 5.85); ex(0.9, 1.1, 0.02, "#7C5944", sd * 2.3, 2.1, 5.8); ex(0.9, 1.1, 0.02, "#7C5944", sd * 2.3, 0.85, 5.8); });
  ex(3.5, 0.2, 0.06, "#6B4A3A", 0, 3.1, 6.74); ex(3.5, 0.2, 0.06, "#6B4A3A", 0, 3.1, 6.06); ex(3.1, 0.05, 0.8, "#CFC6B4", 0, 0.025, 6.4);
  // serambi: lantai, tangga, pilar, atap, papan nama
  ex(9, 0.2, 3.8, "#CFC6B4", 0, 0.1, 8.5); [0, 1].forEach((i) => ex(6.4 - i * 0.6, 0.12, 0.7, "#CFC6B4", 0, 0.06 - i * 0.0, 10.7 + i * 0.5));
  [-4, -2.1, 2.1, 4].forEach((x) => { ex(0.44, 4.45, 0.44, "#F1EEE6", x, 2.4, 10.2); ex(0.62, 0.2, 0.62, "#CFC6B4", x, 0.3, 10.2); ex(0.62, 0.2, 0.62, "#CFC6B4", x, 4.55, 10.2); });
  ex(10, 0.34, 4.4, "#A86F55", 0, 4.9, 8.4); ex(10.2, 0.5, 0.3, "#E3DAC6", 0, 4.45, 10.45);
  sign("SMA BUKIT RAWA · PEKAN KARYA", 5.6, 0.46, 4.45, 10.62, 26);
  const pen = (x, c) => { const t = canvasTexture(THREE, 128, 320, (g, w, h) => { g.fillStyle = c; g.fillRect(0, 0, w, h); g.fillStyle = "#F1EEE6"; g.font = '700 30px "Bricolage Grotesque", sans-serif'; g.textAlign = "center"; g.fillText("PEKAN", w / 2, 110); g.fillText("KARYA", w / 2, 150); g.fillRect(24, 180, w - 48, 3); g.font = '500 20px "Hanken Grotesk", sans-serif'; g.fillText("Bukit Rawa", w / 2, 220); }); const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 2.0), new THREE.MeshBasicMaterial({ map: t })); m.position.set(x, 2.8, 10.0); scene.add(m); ex(0.9, 0.06, 0.06, "#3A424D", x, 3.82, 10.0); };
  pen(-3.05, "#C08A3E"); pen(3.05, "#3E7F7C");
  // halaman: rumput, jalur paving, tepi jalur, semak, pohon, lampu, tiang bendera, papan sambutan
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(90, 60), std("#7E9C6E", 0.95)); lawn.rotation.x = -Math.PI / 2; lawn.position.set(0, -0.005, 36); scene.add(lawn);
  const path = new THREE.Mesh(new THREE.PlaneGeometry(6, 40), std("#CFC7B4", 0.9)); path.rotation.x = -Math.PI / 2; path.position.set(0, 0.006, 27); scene.add(path);
  [-3.1, 3.1].forEach((x) => ex(0.18, 0.1, 40, "#CFC6B4", x, 0.05, 27));
  const bush = (x, z, r) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), std("#5E8A5A", 0.8, { flatShading: true })); m.position.set(x, r * 0.8, z); m.scale.y = 0.85; scene.add(m); };
  [-1, 1].forEach((sd) => { for (let i = 0; i < 6; i++) bush(sd * (7.2 + i * 1.5), 7.7, 0.6 + (i % 3) * 0.1); ex(0.5, 0.15, 0.5, "#C49A63", sd * 6, 0.08, 7.5); });
  const tree = (x, z, h) => { cy(0.16, 0.22, h, "#6B4B36", x, h / 2, z, scene, 8); [[0, h + 0.5, 0, 1.5], [0.5, h + 0.2, 0.3, 1.1], [-0.5, h + 0.1, -0.3, 1.0]].forEach(([dx, dy, dz, r], k) => { const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), std(["#5E9E6B", "#4F8F5E", "#6FAE74"][k], 0.8, { flatShading: true })); m.position.set(x + dx, dy, z + dz); scene.add(m); }); };
  [[-8.5, 16, 2.4], [9, 19, 2.6], [-11, 25, 2.2], [11.5, 27, 2.5], [-6.5, 34, 2.6], [8, 36, 2.3]].forEach(([x, z, h]) => tree(x, z, h));
  [[-3.6, 14], [3.6, 14], [-3.6, 22], [3.6, 22]].forEach(([x, z]) => { cy(0.05, 0.05, 2.3, "#3A424D", x, 1.15, z, scene, 6); const l = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshBasicMaterial({ color: "#FFE9B0" })); l.position.set(x, 2.4, z); scene.add(l); });
  cy(0.07, 0.09, 8, "#C3CBD0", -6.2, 4, 13, scene, 8);
  const flagOut = new THREE.Group(); flagOut.position.set(-6.2, 7.4, 13); scene.add(flagOut);
  const fl1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.04), pm("#B9483A")); fl1.position.set(0.9, 0.28, 0); flagOut.add(fl1);
  const fl2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.55, 0.04), pm("#F1EEE6")); fl2.position.set(0.9, -0.28, 0); flagOut.add(fl2);
  const wel = canvasTexture(THREE, 512, 256, (g, w, h) => { g.fillStyle = "#2B3A55"; g.fillRect(0, 0, w, h); g.fillStyle = "#F1EEE6"; g.textAlign = "center"; g.font = '700 46px "Bricolage Grotesque", sans-serif'; g.fillText("Selamat datang", w / 2, 100); g.font = '500 28px "Hanken Grotesk", sans-serif'; g.fillText("Pekan Karya Bukit Rawa", w / 2, 150); g.fillText("Gulir untuk masuk", w / 2, 200); });
  ex(2.6, 1.3, 0.08, "#6B4A3A", 5.2, 1.35, 15); const wm = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.1), new THREE.MeshBasicMaterial({ map: wel })); wm.position.set(5.2, 1.35, 15.06); scene.add(wm); [4.2, 6.2].forEach((x) => ex(0.1, 0.8, 0.1, "#6B4A3A", x, 0.4, 15.0));
  const sunOut = new THREE.PointLight(0xfff1d8, 95, 50, 1.6); sunOut.position.set(3, 10, 18); scene.add(sunOut);

  // satu lampu sorot mengikuti karya aktif (desktop); di HP hanya emissive pada gambar
  let sun = null, tPrev = null, ema = 0.016, slowN = 0, shN = 0;
  if (!small) {
    sun = new THREE.DirectionalLight(0xffe6c4, 1.35); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); sun.shadow.autoUpdate = false;
    const sc = sun.shadow.camera; sc.left = -6; sc.right = 6; sc.top = 6; sc.bottom = -6; sc.near = 1; sc.far = 34;
    sun.shadow.bias = -0.0005; sun.shadow.normalBias = 0.035; sun.position.set(6.5, 8.5, 3); scene.add(sun, sun.target);
  }
  // bayangan sentuh: tepi dinding, kolong meja dan bangku, kaki tanaman dan alas patung
  const aoTex = canvasTexture(THREE, 64, 64, (g, w, h) => { const gr = g.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); gr.addColorStop(0, "rgba(24,14,8,.6)"); gr.addColorStop(0.55, "rgba(24,14,8,.24)"); gr.addColorStop(1, "rgba(24,14,8,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const aoPoly = { transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 };
  const aoMat = new THREE.MeshBasicMaterial({ map: aoTex, ...aoPoly });
  const ao = (x, z, w, d) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), aoMat); m.rotation.x = -Math.PI / 2; m.position.set(x, 0.016, z); m.renderOrder = 1; scene.add(m); };
  ZK.forEach((zk) => ao(2.8, zk + 3.1, 1.7, 2.2));
  ao(3.0, 2.2, 1.5, 2.0); ao(-2.75, -10, 1.5, 2.8); ao(-2.75, -27.5, 1.5, 2.8); ao(-1.9, -19, 1.8, 1.8);
  CIRC.slice(0, 6).forEach(([cx, cz, cr]) => ao(cx, cz, cr * 3.6, cr * 3.6));
  const edgeTex = canvasTexture(THREE, 64, 8, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, "rgba(24,14,8,.5)"); gr.addColorStop(1, "rgba(24,14,8,0)"); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
  const edgeR = edgeTex.clone(); edgeR.wrapS = THREE.RepeatWrapping; edgeR.repeat.x = -1; edgeR.needsUpdate = true;
  [[-1, edgeTex], [1, edgeR]].forEach(([sd, t]) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 46), new THREE.MeshBasicMaterial({ map: t, ...aoPoly })); m.rotation.x = -Math.PI / 2; m.position.set(sd * (WX - 0.5), 0.014, -16.9); m.renderOrder = 1; scene.add(m); });
  const clock = new THREE.Group(); clock.position.set(WX - 0.04, 2.95, 2.2); clock.rotation.y = -Math.PI / 2; scene.add(clock);
  const clockTex = canvasTexture(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#F4F0E6"; g.beginPath(); g.arc(128, 128, 126, 0, 7); g.fill(); g.strokeStyle = "#3A2A20"; g.lineWidth = 10; g.stroke();
    g.fillStyle = "#2A211C"; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; g.save(); g.translate(128, 128); g.rotate(a); g.fillRect(-3, -112, 6, i % 3 === 0 ? 26 : 14); g.restore(); }
  });
  const cDial = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.05, 32), sm("#3A2A20", 0.5)); cDial.rotation.x = Math.PI / 2; cDial.position.z = 0.025; clock.add(cDial);
  const cFace = new THREE.Mesh(new THREE.CircleGeometry(0.215, 32), new THREE.MeshStandardMaterial({ map: clockTex, roughness: 0.4 })); cFace.position.z = 0.052; clock.add(cFace);
  const mkHand = (len, wd) => { const pv = new THREE.Group(); pv.position.z = 0.058; const m = new THREE.Mesh(new THREE.BoxGeometry(wd, len, 0.006), sm("#1E1713", 0.5)); m.position.y = len / 2 - 0.02; pv.add(m); clock.add(pv); return pv; };
  const hHour = mkHand(0.12, 0.016), hMin = mkHand(0.18, 0.011), hSec = mkHand(0.2, 0.004);
  let spot = null;
  if (!small) { spot = new THREE.SpotLight(0xfff0d8, 0, 14, 0.5, 0.6, 1.2); spot.position.set(0, 3.8, 0); scene.add(spot, spot.target); }
  const W = { scene, arts, spot, statue, portrait: false };
  W.tick = (time, w, cam) => {
    camP = cam || null;
    // jaga kelancaran: bayangan diperbarui tiap 2 frame; bila rata-rata frame lambat, bayangan nyata dimatikan
    if (tPrev !== null) {
      const d = Math.min(0.2, Math.max(0, time - tPrev)); ema += (d - ema) * 0.05; slowN = ema > 0.034 ? slowN + 1 : Math.max(0, slowN - 1);
      if (slowN > 70 && ctx.renderer.getPixelRatio() > 0.8 && (small || !sun || !sun.castShadow)) { ctx.renderer.setPixelRatio(Math.max(0.75, ctx.renderer.getPixelRatio() - 0.25)); slowN = 0; }
      if (slowN > 90 && sun && sun.castShadow) { sun.castShadow = false; ctx.renderer.shadowMap.enabled = false; scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((mm) => { mm.needsUpdate = true; }); }); }
    }
    tPrev = time; if (sun && sun.castShadow && ++shN % 2 === 0) sun.shadow.needsUpdate = true;
    if (sun && cam) { sun.target.position.set(0, 0, cam[2] - 3); sun.position.set(6.5, 8.5, cam[2]); }
    statue.rotation.y = time * 0.3;
    { const d = new Date(), sc2 = d.getSeconds() + d.getMilliseconds() / 1000, mn = d.getMinutes() + sc2 / 60, hr = (d.getHours() % 12) + mn / 60; hSec.rotation.z = -sc2 * 0.10472; hMin.rotation.z = -mn * 0.10472; hHour.rotation.z = -hr * 0.5236; }
    extra(time);
    arts.forEach((a, i) => { a.mat.emissiveIntensity = 0.22 * (w[i] || 0); });
    if (spot) {
      let best = 0, bw = 0; w.forEach((v, i) => { if (v > bw) { bw = v; best = i; } });
      const g = arts[best].g; spot.target.position.copy(g.position); spot.position.set(g.position.x * 0.2, 3.8, g.position.z + 3);
      spot.intensity = mix(0, 55, bw);
    }
  };
  mergeStatic(THREE, scene, new Set([...agents.map((a2) => a2.g), docent, guest, ...sitters, flagOut, clock, statue, ...arts.map((a2) => a2.g), ...plants.map((p2) => p2.lean)]));
  return W;
}

// gabungkan mesh statis berbahan sama menjadi satu (jauh lebih sedikit draw call, penting untuk HP)
function mergeStatic(THREE, root, dyn) {
  root.updateMatrixWorld(true);
  const inDyn = (o) => { for (let p = o; p; p = p.parent) if (dyn.has(p)) return true; return false; };
  const groups = new Map();
  root.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || o.isSkinnedMesh || !o.visible || o.renderOrder || inDyn(o)) return;
    const m = o.material, g = o.geometry;
    if (Array.isArray(m) || m.transparent || !g.index || !g.attributes.uv || !g.attributes.normal) return;
    const key = m.uuid + (o.castShadow ? 1 : 0) + (o.receiveShadow ? 1 : 0);
    let e = groups.get(key); if (!e) groups.set(key, (e = { m, cs: o.castShadow, rs: o.receiveShadow, list: [] })); e.list.push(o);
  });
  const v = new THREE.Vector3(), nm = new THREE.Matrix3();
  groups.forEach((e) => {
    if (e.list.length < 2) return;
    const P = [], N = [], U = [], I = []; let off = 0;
    for (const o of e.list) {
      const g = o.geometry, pa = g.attributes.position, na = g.attributes.normal, ua = g.attributes.uv; nm.getNormalMatrix(o.matrixWorld);
      for (let i = 0; i < pa.count; i++) { v.fromBufferAttribute(pa, i).applyMatrix4(o.matrixWorld); P.push(v.x, v.y, v.z); v.fromBufferAttribute(na, i).applyMatrix3(nm).normalize(); N.push(v.x, v.y, v.z); U.push(ua.getX(i), ua.getY(i)); }
      const ia = g.index; for (let i = 0; i < ia.count; i++) I.push(ia.getX(i) + off); off += pa.count;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(P, 3)); geo.setAttribute("normal", new THREE.Float32BufferAttribute(N, 3)); geo.setAttribute("uv", new THREE.Float32BufferAttribute(U, 2));
    geo.setIndex(new THREE.BufferAttribute(off > 65535 ? new Uint32Array(I) : new Uint16Array(I), 1));
    const mesh = new THREE.Mesh(geo, e.m); mesh.castShadow = e.cs; mesh.receiveShadow = e.rs; root.add(mesh);
    e.list.forEach((o) => o.parent.remove(o));
  });
}
