// Model denah kedai Kopi Rindang (proyek konsep): logika murni tanpa DOM, dipakai tampilan 3D dan SVG.
// Koordinat dalam meter. Ruang 8 x 6,5 m, titik asal di pojok kiri atas (x ke kanan, z ke bawah/depan).
export const ROOM = { w: 8, d: 6.5 };
export const SNAP = 0.25;
export const TYPES = {
  "meja-kecil": { nama: "Meja kecil", w: 0.8, d: 0.8, kind: "meja", kursi: 2 },
  "meja-besar": { nama: "Meja besar", w: 1.6, d: 0.8, kind: "meja", kursi: 4 },
  kursi: { nama: "Kursi", w: 0.45, d: 0.45, kind: "kursi" },
  rak: { nama: "Rak", w: 1.2, d: 0.4, kind: "rak" },
  kasir: { nama: "Meja kasir", w: 1.6, d: 0.7, kind: "kasir" },
};
const EPS = 1e-6;
export const snap = (v) => Math.round(v / SNAP) * SNAP;
export const foot = (it) => { const t = TYPES[it.type]; return it.rot % 180 === 0 ? { w: t.w, d: t.d } : { w: t.d, d: t.w }; };
export const inside = (it) => { const f = foot(it); return it.x - f.w / 2 >= -EPS && it.x + f.w / 2 <= ROOM.w + EPS && it.z - f.d / 2 >= -EPS && it.z + f.d / 2 <= ROOM.d + EPS; };
export function overlap(a, b) {
  const fa = foot(a), fb = foot(b);
  return Math.abs(a.x - b.x) < (fa.w + fb.w) / 2 - EPS && Math.abs(a.z - b.z) < (fa.d + fb.d) / 2 - EPS;
}
// bebas = di dalam ruang dan tidak menumpuk objek lain (abaikan id tertentu)
export const free = (items, it, ignore = []) => inside(it) && !items.some((o) => o.id !== it.id && !ignore.includes(o.id) && overlap(it, o));
export const label = (it) => TYPES[it.type].nama;

// Kursi di sekeliling meja (jarak tengah meja ke tengah kursi 0,65 m)
export function chairsFor(type, cx, cz) {
  if (type === "meja-kecil") return [{ x: cx - 0.65, z: cz, rot: 90 }, { x: cx + 0.65, z: cz, rot: 270 }];
  if (type === "meja-besar") return [-0.4, 0.4].flatMap((dx) => [{ x: cx + dx, z: cz - 0.65, rot: 0 }, { x: cx + dx, z: cz + 0.65, rot: 180 }]);
  return [];
}

export const stats = (items) => {
  const kursi = items.filter((i) => TYPES[i.type].kind === "kursi").length;
  const meja = items.filter((i) => TYPES[i.type].kind === "meja").length;
  const luas = items.reduce((s, i) => s + TYPES[i.type].w * TYPES[i.type].d, 0);
  return { kursi, meja, luas, total: ROOM.w * ROOM.d, persen: Math.round((luas / (ROOM.w * ROOM.d)) * 100) };
};

// Denah contoh awal: 2 meja besar, 3 meja kecil, kasir, 2 rak (14 kursi)
export function initialItems() {
  let n = 0;
  const out = [];
  const add = (type, x, z, rot = 0) => { out.push({ id: "o" + ++n, type, x, z, rot }); return out[out.length - 1]; };
  add("kasir", 6.9, 0.45);
  add("rak", 0.25, 1.0, 90); add("rak", 0.25, 2.4, 90);
  [["meja-besar", 3.0, 1.9], ["meja-besar", 3.0, 4.3], ["meja-kecil", 5.6, 2.4], ["meja-kecil", 5.6, 3.6], ["meja-kecil", 5.6, 4.8]].forEach(([t, x, z]) => {
    add(t, x, z); chairsFor(t, x, z).forEach((c) => add("kursi", c.x, c.z, c.rot));
  });
  return out;
}

// Cari tempat kosong terdekat dari tengah ruang untuk objek (beserta kursinya). Mengembalikan daftar objek baru atau null.
export function place(items, type, nextId) {
  const t = TYPES[type];
  const cands = [];
  for (let x = 0; x <= ROOM.w + EPS; x += SNAP) for (let z = 0; z <= ROOM.d + EPS; z += SNAP) cands.push([x, z, Math.hypot(x - ROOM.w / 2, z - ROOM.d / 2)]);
  cands.sort((a, b) => a[2] - b[2]);
  for (const [x, z] of cands) {
    let id = nextId;
    const parts = [{ id: "o" + id++, type, x, z, rot: 0 }, ...chairsFor(type, x, z).map((c) => ({ id: "o" + id++, type: "kursi", ...c }))];
    const ok = parts.every((p, i) => free(items, p, []) && parts.every((q, j) => j <= i || !overlap(p, q)));
    if (ok) return parts;
  }
  return null;
}
