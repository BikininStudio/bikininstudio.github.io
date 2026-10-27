// Pameran 3D Pekan Karya: kamera menyusuri lorong galeri (mesin ../3d/scroll3d.js, dunia di ./world.js).
import "../3d/bar.js";
import { bootChapters } from "../3d/scroll3d.js";
import { KARYA, drawArt } from "./art.js";
import { state, onChange } from "./state.js";

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const wa = (t, src) => (window.waLink ? waLink(t, src) : "https://wa.me/6287763292786?text=" + encodeURIComponent(t));
const panels = $$("#galeri .panel");

// Pengumuman posisi + kontrol
const note = $("#dock-note"), list = $("#daftar"), listBtn = $("#btn-daftar");
function paint() { note.textContent = `Karya ${state.k + 1} dari 6: ${KARYA[state.k].judul}`; }
onChange(paint); paint();
const go = (k) => { root.classList.remove("copy-off"); panels[Math.max(0, Math.min(5, k))].scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "center" }); };
$("#btn-prev").addEventListener("click", () => go(state.k - 1));
$("#btn-next").addEventListener("click", () => go(state.k + 1));
listBtn.addEventListener("click", () => { const open = list.hidden; list.hidden = !open; listBtn.setAttribute("aria-expanded", String(open)); });
list.addEventListener("click", (e) => { if (e.target.closest("a")) { list.hidden = true; listBtn.setAttribute("aria-expanded", "false"); root.classList.remove("copy-off"); } });
addEventListener("keydown", (e) => {
  if (e.target.closest && e.target.closest("input, textarea, select")) return;
  if (root.dataset.ch !== "1") return;
  if (e.key === "ArrowRight") { e.preventDefault(); go(state.k + 1); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); go(state.k - 1); }
  else if (e.key === "Escape") { root.classList.toggle("copy-off"); list.hidden = true; listBtn.setAttribute("aria-expanded", "false"); }
});
addEventListener("scroll", () => { if (root.classList.contains("copy-off")) root.classList.remove("copy-off"); }, { passive: true });

// WhatsApp
const waBtn = $("#wa-pesan"), waOutro = $("#wa-outro");
const msg = "Halo Bikinin Studio, saya melihat demo Pameran 3D Pekan Karya dan ingin berkonsultasi untuk pameran karya sekolah kami.";
[waBtn, waOutro].forEach((b) => { b.href = wa(msg, "demo: pameran-3d"); b.addEventListener("click", () => window.track && track("click_whatsapp", { lokasi: "demo:pameran-3d" })); });

// Bab aktif (untuk kontrol)
const chapters = $$(".chapter");
const syncCh = () => { const mid = innerHeight * 0.5; let a = 0; chapters.forEach((el, i) => { if (el.getBoundingClientRect().top <= mid) a = i; }); root.dataset.ch = String(a); };
addEventListener("scroll", syncCh, { passive: true }); addEventListener("resize", syncCh); syncCh();

// Gambar karya untuk mode tanpa 3D
async function fallbackArt() {
  await Promise.all([document.fonts.load('700 30px "Bricolage Grotesque"'), document.fonts.load('700 20px "Hanken Grotesk"')]).catch(() => {});
  $$(".art-fb").forEach((c) => { const g = c.getContext("2d"); drawArt(+c.dataset.art, g, 1024, 768); });
}

bootChapters([
  { title: "Pintu masuk", load: () => import("./scenes/pintu.js") },
  { title: "Galeri", load: () => import("./scenes/galeri.js") },
  { title: "Pesan", load: () => import("./scenes/pesan.js") },
]).then((ctx) => { if (!ctx) fallbackArt(); })
  .catch((e) => { console.error(e); root.classList.add("no3d", "loaded"); fallbackArt(); });
