// Aplikasi Denah Kedai Kopi Rindang (proyek konsep): tambah, geser, putar meja, kursi, rak, kasir; kapasitas dan luas terpakai.
// Alur: model (./model.js) -> pengendali di sini -> tampilan 3D (./view3d.js) atau SVG (./view2d.js). Disimpan di localStorage (try/catch).
import { ROOM, TYPES, SNAP, snap, free, foot, inside, stats, initialItems, place } from "./model.js";
import { createView2D } from "./view2d.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const KEY = "denah-kopi-rindang-v1";
const nf = new Intl.NumberFormat("id-ID", { maximumFractionDigits: 1 });
const root = document.documentElement;

// ---------- keadaan ----------
let items = initialItems(), nextId = items.length + 1, dirty = false;
let sel = null, invalid = null, drag = null, lastDel = null, undoTimer = 0, view = null, top = false, storageOk = true;
try {
  const raw = JSON.parse(localStorage.getItem(KEY) || "null");
  if (raw && Array.isArray(raw.items) && raw.items.every((o) => TYPES[o.type] && [o.x, o.z].every(Number.isFinite) && [0, 90, 180, 270].includes(o.rot) && typeof o.id === "string")) {
    items = raw.items; dirty = !!raw.dirty;
    nextId = Math.max(items.length, ...items.map((o) => +o.id.slice(1) || 0)) + 1;
  }
} catch (e) { storageOk = false; }

const names = () => { const c = {}; const m = new Map(); items.forEach((o) => { c[o.type] = (c[o.type] || 0) + 1; m.set(o.id, TYPES[o.type].nama + (["kasir"].includes(o.type) ? "" : " " + c[o.type])); }); return m; };
const nama = (o) => TYPES[o.type].nama;
const say = (t) => { $("#status").textContent = t; };

function save() {
  try { localStorage.setItem(KEY, JSON.stringify({ items, dirty })); if (!storageOk) storageOk = true; $("#simpan").textContent = "Tersimpan di perangkat ini."; $("#simpan").hidden = false; }
  catch (e) { storageOk = false; $("#simpan").hidden = true; say("Denah tidak dapat disimpan di perangkat ini, jadi akan hilang saat halaman ditutup. Anda tetap dapat menyusun denah."); }
}
function commit() { dirty = true; save(); paint(); }

// ---------- tampilan ----------
function paint() {
  const s = stats(items);
  $("#s-kursi").textContent = `${s.kursi} kursi`;
  $("#s-meja").textContent = `${s.meja} meja`;
  $("#s-luas").textContent = `${nf.format(s.luas)} m² dari ${nf.format(s.total)} m² (${s.persen}%)`;
  const sentence = `Kapasitas ${s.kursi} kursi di ${s.meja} meja. Luas terpakai ${nf.format(s.luas)} m² dari ${nf.format(s.total)} m², ${s.persen}%.`;
  if ($("#s-kalimat").textContent !== sentence) $("#s-kalimat").textContent = sentence;
  $("#s-contoh").hidden = dirty;
  $("#kosong").hidden = items.length > 0;
  $("#btn-rot").disabled = $("#btn-del").disabled = !sel;
  // daftar objek (Tab memilih)
  const ul = $("#daftar-objek"), nm = names();
  ul.textContent = "";
  items.forEach((o) => {
    const li = document.createElement("li"), b = document.createElement("button");
    b.type = "button"; b.textContent = nm.get(o.id); b.setAttribute("aria-pressed", String(o.id === sel)); b.dataset.id = o.id;
    b.addEventListener("focus", () => { if (sel !== o.id) ctrl.select(o.id, true); });
    b.addEventListener("click", () => ctrl.select(o.id, true));
    li.appendChild(b); ul.appendChild(li);
  });
  view && view.sync(items, sel, invalid);
}

// ---------- pengendali untuk tampilan ----------
const ctrl = {
  items: () => items,
  select(id, announce = false) {
    if (id === sel) return;
    sel = id; paint();
    if (id && announce) say(`${nama(items.find((o) => o.id === id))} dipilih. Gunakan tombol panah untuk menggesernya.`);
  },
  beginDrag(id) { const it = items.find((o) => o.id === id); drag = { id, x: it.x, z: it.z }; },
  dragTo(x, z) {
    if (!drag) return;
    const it = items.find((o) => o.id === drag.id);
    it.x = snap(x); it.z = snap(z);
    invalid = free(items, it) ? null : it.id;
    view.sync(items, sel, invalid);
  },
  endDrag() {
    if (!drag) return;
    const it = items.find((o) => o.id === drag.id), d = drag; drag = null;
    if (invalid) {
      const out = !inside(it);
      it.x = d.x; it.z = d.z; invalid = null;
      say(out ? "Objek tidak muat di sini. Geser ke bagian lantai yang kosong." : `${nama(it)} menumpuk dengan objek lain. Geser sedikit agar tidak bertumpuk.`);
      paint(); return;
    }
    if (it.x !== d.x || it.z !== d.z) commit(); else paint();
  },
};

// ---------- aksi ----------
const arah = { ArrowLeft: ["kiri", -SNAP, 0], ArrowRight: ["kanan", SNAP, 0], ArrowUp: ["atas", 0, -SNAP], ArrowDown: ["bawah", 0, SNAP] };
function moveSel(key) {
  const it = items.find((o) => o.id === sel); if (!it) return;
  const [nm, dx, dz] = arah[key];
  const t = { ...it, x: snap(it.x + dx), z: snap(it.z + dz) };
  if (!inside(t)) { say("Objek tidak muat di sini. Geser ke bagian lantai yang kosong."); return; }
  if (!free(items, t)) { say(`${nama(it)} menumpuk dengan objek lain. Geser sedikit agar tidak bertumpuk.`); return; }
  it.x = t.x; it.z = t.z; say(`${nama(it)} digeser ke ${nm}, 0,25 m.`); commit();
}
function rotateSel() {
  const it = items.find((o) => o.id === sel); if (!it) return;
  const t = { ...it, rot: (it.rot + 90) % 360 };
  if (!free(items, t)) { say(`${nama(it)} menumpuk dengan objek lain. Geser sedikit agar tidak bertumpuk.`); return; }
  it.rot = t.rot; say(`${nama(it)} diputar 90°.`); commit();
}
function deleteSel() {
  const i = items.findIndex((o) => o.id === sel); if (i < 0) return;
  const [it] = items.splice(i, 1); sel = null;
  lastDel = { it, i }; clearTimeout(undoTimer);
  $("#undo").hidden = false; undoTimer = setTimeout(() => { $("#undo").hidden = true; lastDel = null; }, 6000);
  say(`${nama(it)} dihapus.`); commit();
}
function undo() {
  if (!lastDel) return;
  const { it, i } = lastDel; lastDel = null; clearTimeout(undoTimer); $("#undo").hidden = true;
  if (!free(items, it)) { say("Objek tidak muat di sini. Geser ke bagian lantai yang kosong."); return; }
  items.splice(i, 0, it); sel = it.id; say(`${nama(it)} dikembalikan.`); commit();
}
function add(type) {
  if (type === "kasir" && items.some((o) => o.type === "kasir")) { say("Meja kasir hanya satu. Geser meja kasir yang sudah ada."); return; }
  const parts = place(items, type, nextId);
  if (!parts) { say("Tidak ada lantai kosong untuk objek baru. Geser atau hapus objek lain."); return; }
  nextId += parts.length; items.push(...parts); sel = parts[0].id;
  say(`${nama(parts[0])} ditambahkan.`); commit();
}

$$("[data-add]").forEach((b) => b.addEventListener("click", () => add(b.dataset.add)));
$("#btn-rot").addEventListener("click", rotateSel);
$("#btn-del").addEventListener("click", deleteSel);
$("#undo").addEventListener("click", undo);
$("#btn-view").addEventListener("click", () => {
  top = !top; const b = $("#btn-view"); b.setAttribute("aria-pressed", String(top)); b.textContent = top ? "Lihat 3D" : "Lihat dari atas";
  view && view.setTop(top);
});
const dlg = $("#dlg-reset");
$("#btn-reset").addEventListener("click", () => (dlg.showModal ? dlg.showModal() : (dlg.setAttribute("open", ""))));
$("#reset-batal").addEventListener("click", () => dlg.close());
$("#reset-ok").addEventListener("click", () => {
  dlg.close(); items = initialItems(); nextId = items.length + 1; dirty = false; sel = null; lastDel = null; $("#undo").hidden = true;
  try { localStorage.removeItem(KEY); } catch (e) {}
  save(); paint(); say("Denah dikembalikan ke contoh awal.");
});

addEventListener("keydown", (e) => {
  if (dlg.open || e.altKey || e.ctrlKey || e.metaKey) return;
  if (e.target.closest && e.target.closest("input, textarea, select")) return;
  if (arah[e.key] && sel) { e.preventDefault(); moveSel(e.key); }
  else if ((e.key === "r" || e.key === "R") && sel) { e.preventDefault(); rotateSel(); }
  else if ((e.key === "Delete" || e.key === "Backspace") && sel) { e.preventDefault(); deleteSel(); }
  else if (e.key === "Escape" && sel) { sel = null; paint(); say("Pilihan dilepas."); }
});

// ---------- WhatsApp penutup ----------
const wa = (t, src) => (window.waLink ? waLink(t, src) : "https://wa.me/6287763292786?text=" + encodeURIComponent(t));
const waBtn = $("#wa-denah");
waBtn.href = wa("Halo Bikinin Studio, saya mencoba demo Denah Kedai 3D dan ingin dibuatkan aplikasi denah untuk usaha saya.", "demo: denah-toko-3d");
waBtn.addEventListener("click", () => window.track && track("click_whatsapp", { lokasi: "demo:denah-toko-3d" }));

// ---------- mulai: 3D bila bisa, SVG bila tidak ----------
const host = $("#host");
function hasGL() { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } }
// Denah SVG (ringan) tampil dulu; Three.js baru diunduh setelah halaman tenang (desktop: idle atau gerak pertama; HP: interaksi pertama), jadi TBT/LCP tidak tersentuh.
function start() {
  const want3d = hasGL() && !new URLSearchParams(location.search).has("2d");
  view = createView2D(host, ctrl);
  $("#btn-view").hidden = true;
  new ResizeObserver(() => view.resize()).observe(host);
  view.resize(); paint(); save();
  say(items.length ? "" : "Denah masih kosong. Tambahkan meja pertama dengan tombol Meja kecil atau Meja besar.");
  if (!want3d || matchMedia("(prefers-reduced-motion: reduce)").matches) { root.classList.add("no3d"); return; }
  let begun = false;
  const evs = ["pointerdown", "touchstart", "keydown", "scroll"];
  const upgrade = async () => {
    if (begun) return; begun = true;
    evs.forEach((t) => removeEventListener(t, upgrade));
    try {
      const v = await (await import("./view3d.js")).createView3D(host, ctrl, { small: matchMedia("(max-width: 760px)").matches });
      if (!v) return;
      const old = view; view = v; old.dispose();
      $("#btn-view").hidden = false; v.setTop(top);
      v.resize(); paint();
    } catch (e) { console.error(e); root.classList.add("no3d"); }
  };
  evs.forEach((t) => addEventListener(t, upgrade, { passive: true }));
  if (matchMedia("(min-width:1024px)").matches) (window.requestIdleCallback || setTimeout)(() => setTimeout(upgrade, 1500), { timeout: 3000 });
}
start();
