// Kemasan standing pouch 150 g dan keripik singkong, dibuat dari kode. Aset (geometri, tekstur, material) dibuat sekali
// lalu dipakai bersama oleh semua bab; tiap scene hanya membuat Mesh baru.
import { canvasTexture, blobShadow } from "../3d/kit3d.js";
import { RASA } from "./state.js";

export const PW = 1.5, PH = 2.4, PD = 0.62; // lebar, tinggi, tebal terbesar
const SERIF = '"Young Serif", Georgia, serif';
const SANS = '"Hanken Grotesk", system-ui, sans-serif';
let cache;

function tone(hex, k) {
  const n = parseInt(hex.slice(1), 16);
  const c = (s) => Math.max(0, Math.min(255, Math.round(((n >> s) & 255) * k)));
  return `rgb(${c(16)},${c(8)},${c(0)})`;
}

// Singkong: umbi lonjong berkulit cokelat dengan irisan krem di ujung
function umbi(g, x, y, s, rot, r) {
  g.save(); g.translate(x, y); g.rotate(rot); g.scale(s, s);
  g.fillStyle = tone(r.warna, 0.62);
  g.beginPath(); g.moveTo(-150, 0); g.bezierCurveTo(-100, -46, 80, -52, 160, -6); g.bezierCurveTo(90, 44, -90, 48, -150, 0); g.fill();
  g.fillStyle = "#F0E6C6";
  g.beginPath(); g.ellipse(-150, 0, 14, 22, 0, 0, Math.PI * 2); g.fill();
  g.strokeStyle = "rgba(0,0,0,.25)"; g.lineWidth = 3;
  for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(-90, i * 12); g.quadraticCurveTo(0, i * 14 - 4, 120, i * 8); g.stroke(); }
  g.restore();
}

function front(r, w, h) {
  return (g) => {
    g.fillStyle = r.warna; g.fillRect(0, 0, w, h);
    // pematang: pita bukit sawah bertingkat di bagian bawah
    const bands = [[0.72, 0.9], [0.8, 0.8], [0.88, 0.7], [0.95, 0.6]];
    bands.forEach(([y, k], i) => {
      g.fillStyle = tone(r.warna, k);
      g.beginPath(); g.moveTo(0, h);
      for (let x = 0; x <= w; x += 32) g.lineTo(x, h * y + Math.sin(x / 150 + i * 1.7) * 26 - i * 6);
      g.lineTo(w, h); g.fill();
    });
    // segel atas bergerigi
    g.fillStyle = tone(r.warna, 0.82); g.fillRect(0, 0, w, h * 0.065);
    g.strokeStyle = "rgba(0,0,0,.18)"; g.lineWidth = 3;
    for (let x = 6; x < w; x += 11) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, h * 0.065); g.stroke(); }
    g.textAlign = "center";
    g.fillStyle = r.tinta;
    g.font = `400 ${w * 0.085}px ${SANS}`; g.fillText("KERIPIK", w / 2, h * 0.155);
    g.font = `400 ${w * 0.19}px ${SERIF}`; g.fillText("Pematang", w / 2, h * 0.255);
    umbi(g, w / 2, h * 0.43, w / 640, -0.18, r);
    g.fillStyle = r.aksen; g.fillRect(w * 0.18, h * 0.545, w * 0.64, h * 0.12);
    g.fillStyle = tone(r.warna, 0.35);
    g.font = `400 ${w * 0.1}px ${SERIF}`; g.fillText(r.nama, w / 2, h * 0.6);
    g.font = `700 ${w * 0.05}px ${SANS}`; g.fillStyle = r.tinta;
    g.fillText("Keripik singkong Garut", w / 2, h * 0.73);
    g.fillText("150 g", w / 2, h * 0.78);
  };
}

function back(r, w, h) {
  return (g) => {
    g.fillStyle = tone(r.warna, 0.86); g.fillRect(0, 0, w, h);
    g.fillStyle = tone(r.warna, 0.74); g.fillRect(0, 0, w, h * 0.065);
    g.fillStyle = r.tinta; g.textAlign = "left";
    const x = w * 0.12;
    g.font = `400 ${w * 0.09}px ${SERIF}`; g.fillText("Komposisi", x, h * 0.2);
    g.font = `500 ${w * 0.052}px ${SANS}`;
    const lines = ["Singkong, minyak nabati,", "garam, bumbu " + r.bumbu + ".", "", "Berat bersih 150 g", "Simpan di tempat sejuk,", "tutup rapat setelah dibuka.", "", "Nomor izin edar: contoh,", "tidak ditampilkan.", "", "Proyek konsep, brand fiktif."];
    lines.forEach((t, i) => g.fillText(t, x, h * 0.28 + i * w * 0.075));
  };
}

// Geometri bantal: bidang depan dan belakang digembungkan, menyempit ke segel atas dan menyatu di tepi samping.
function pillow(THREE, sign) {
  const geo = new THREE.PlaneGeometry(PW, PH, 24, 36);
  if (sign < 0) geo.rotateY(Math.PI);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const u = p.getX(i) / PW + 0.5, v = p.getY(i) / PH + 0.5;
    const bu = Math.pow(Math.max(0, 1 - Math.pow(2 * u - 1, 2)), 0.6);
    const lower = 0.55 + 0.45 * THREE.MathUtils.smoothstep(v, 0, 0.3);
    const upper = 1 - THREE.MathUtils.smoothstep(v, 0.86, 1);
    p.setZ(i, sign * PD * 0.5 * bu * lower * upper + sign * 0.004);
  }
  geo.computeVertexNormals();
  return geo;
}

export async function pouchAssets(THREE) {
  if (cache) return cache;
  cache = (async () => {
    await Promise.all([document.fonts.load(`40px ${SERIF}`), document.fonts.load(`700 40px ${SANS}`), document.fonts.load(`500 40px ${SANS}`)]).catch(() => {});
    const gf = pillow(THREE, 1), gb = pillow(THREE, -1);
    const cap = new THREE.CircleGeometry(0.5, 28); cap.rotateX(-Math.PI / 2); cap.scale(PW * 0.98, 1, PD * 0.55);
    const isSmall = matchMedia("(max-width: 760px)").matches;
    const [fw, fh] = isSmall ? [640, 1024] : [896, 1434];
    const mats = RASA.map((r) => {
      const tf = canvasTexture(THREE, fw, fh, front(r, fw, fh));
      const tb = canvasTexture(THREE, fw >> 1, fh >> 1, back(r, fw >> 1, fh >> 1));
      const common = { roughness: 0.42, metalness: 0.28, envMapIntensity: 0.9 };
      return {
        front: new THREE.MeshStandardMaterial({ map: tf, ...common }),
        back: new THREE.MeshStandardMaterial({ map: tb, ...common }),
        cap: new THREE.MeshStandardMaterial({ color: new THREE.Color(r.warna).multiplyScalar(0.6), roughness: 0.6 }),
      };
    });
    return { gf, gb, cap, mats };
  })();
  return cache;
}

// Satu kemasan (grup) untuk rasa i; kaki di y = 0
export function pouchInstance(THREE, A, i) {
  const g = new THREE.Group();
  const m = A.mats[i];
  const f = new THREE.Mesh(A.gf, m.front), b = new THREE.Mesh(A.gb, m.back), c = new THREE.Mesh(A.cap, m.cap);
  f.position.y = b.position.y = PH / 2; c.position.y = 0.02;
  g.add(f, b, c);
  A.sh ||= blobShadow(THREE, 3.2, 0.4);
  const sh = A.sh.clone(); sh.position.y = 0.01; g.add(sh);
  return g;
}

// Irisan/keripik: piringan tipis agak melengkung, dipasang sebagai InstancedMesh
export function chipsMesh(THREE, n, color = "#D9A63F", size = 0.2) {
  const geo = new THREE.CylinderGeometry(size, size, 0.03, 18, 1);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) p.setY(i, p.getY(i) + 0.35 * (p.getX(i) ** 2 + p.getZ(i) ** 2) * (p.getY(i) > 0 ? 1.1 : 1));
  geo.computeVertexNormals();
  const mat = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0 });
  const mesh = new THREE.InstancedMesh(geo, mat, n);
  mesh.frustumCulled = false;
  return mesh;
}

// Tanah sawah bertingkat sebagai bidang datar (selisih nada, tanpa garis)
export function ground(THREE, base, step) {
  const tex = canvasTexture(THREE, 8, 256, (g, w, h) => {
    const n = 9;
    for (let i = 0; i < n; i++) {
      g.fillStyle = i % 2 ? step : base;
      g.fillRect(0, (i * h) / n, w, h / n + 1);
    }
  });
  tex.magFilter = THREE.NearestFilter; tex.minFilter = THREE.LinearFilter; tex.generateMipmaps = false;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(40, 30), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}
