// Lorong pameran Pekan Karya Bukit Rawa: tiga ruang berdinding warna beda, enam karya contoh. Dunia dipakai bersama semua bab.
import { canvasTexture, applyEnv, mix } from "../3d/kit3d.js";
import { KARYA, drawArt } from "./art.js";

export const ZK = [-4, -10, -16, -22, -28, -34]; // posisi z tiap karya
export const WX = 3.4; // setengah lebar lorong
const ROOMS = [{ z0: 6, z1: -13, c: "#A9B09A" }, { z0: -13, z1: -25, c: "#B98E78" }, { z0: -25, z1: -38, c: "#9FAAB0" }];
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
  await applyEnv(THREE, ctx, scene, 0.5);
  scene.add(new THREE.HemisphereLight(0xfff6e8, 0x8a7d6a, 0.95));
  const std = (c, r = 0.8, extra = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: r, ...extra });
  const small = ctx.small;

  // lantai teraso, langit-langit, dinding per ruang
  const terrazzo = canvasTexture(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#C9C0B0"; g.fillRect(0, 0, w, h);
    let s = 5; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 260; i++) { g.fillStyle = ["#B3A892", "#D8D0C0", "#A89C86", "#BFB5A3"][i % 4]; g.beginPath(); g.arc(r() * w, r() * h, 1 + r() * 3, 0, 7); g.fill(); }
  });
  terrazzo.wrapS = terrazzo.wrapT = THREE.RepeatWrapping; terrazzo.repeat.set(4, 22);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(WX * 2, 48), std("#ffffff", 0.55, { map: terrazzo })); floor.rotation.x = -Math.PI / 2; floor.position.set(0, 0, -16); scene.add(floor);
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(WX * 2, 48), std("#DAD3C5", 0.9)); ceil.rotation.x = Math.PI / 2; ceil.position.set(0, 4, -16); scene.add(ceil);
  ROOMS.forEach((r) => {
    const len = r.z0 - r.z1, zc = (r.z0 + r.z1) / 2;
    [-1, 1].forEach((sd) => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.2, 4, len), std(r.c, 0.9)); w.position.set(sd * (WX + 0.1), 2, zc); scene.add(w); });
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
  const statue = new THREE.Mesh(new THREE.LatheGeometry(prof, 28), std("#B9A27F", 0.45)); statue.position.set(-1.9, 1.0, -19); scene.add(statue);
  [[-2.1, -10], [2.1, -28]].forEach(([x, z]) => {
    const top = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 1.8), std("#6B4A3A", 0.6)); top.position.set(x, 0.5, z); scene.add(top);
    [-0.7, 0.7].forEach((dz) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.45, 0.1), std("#4A3A30", 0.7)); l.position.set(x, 0.25, z + dz); scene.add(l); });
  });

  // satu lampu sorot mengikuti karya aktif (desktop); di HP hanya emissive pada gambar
  let spot = null;
  if (!small) { spot = new THREE.SpotLight(0xfff0d8, 0, 14, 0.5, 0.6, 1.2); spot.position.set(0, 3.8, 0); scene.add(spot, spot.target); }
  const W = { scene, arts, spot, statue, portrait: false };
  W.tick = (time, w) => {
    statue.rotation.y = time * 0.3;
    arts.forEach((a, i) => { a.mat.emissiveIntensity = 0.22 * (w[i] || 0); });
    if (spot) {
      let best = 0, bw = 0; w.forEach((v, i) => { if (v > bw) { bw = v; best = i; } });
      const g = arts[best].g; spot.target.position.copy(g.position); spot.position.set(g.position.x * 0.2, 3.8, g.position.z + 3);
      spot.intensity = mix(0, 55, bw);
    }
  };
  return W;
}
