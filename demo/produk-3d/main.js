// Toko 3D Keripik Pematang: tiga bab pada satu kanvas (mesin di ../3d/scroll3d.js, scene di ./scenes/).
import "../3d/bar.js";
import { bootChapters } from "../3d/scroll3d.js";
import { RASA, state, setRasa, setQty, onChange, rupiah } from "./state.js";

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
let ctx = null;

// ---- UI: pemilih rasa, jumlah, ringkasan, tautan WhatsApp ----
const dockBtns = $$(".rasa-btn");
const radios = $$('input[name="rasa"]');
const qty = $("#qty");
const note = $("#dock-note");
const ringkas = $("#ringkas");
const waBtn = $("#pesan-wa");
const waOutro = $("#wa-outro");
const wa = (t, src) => (window.waLink ? waLink(t, src) : "https://wa.me/6287763292786?text=" + encodeURIComponent(t));

function paint(what) {
  const r = RASA[state.rasa];
  dockBtns.forEach((b, i) => b.setAttribute("aria-pressed", String(i === state.rasa)));
  radios.forEach((x, i) => { x.checked = i === state.rasa; });
  note.innerHTML = `Pilih rasa untuk melihatnya di kemasan. Rasa dipilih: <b>${r.nama}</b>`;
  const n = state.qty;
  ringkas.textContent = `${n} bungkus ${r.nama} = ${rupiah(n * r.harga)}`;
  waBtn.href = wa(`Halo Bikinin Studio, saya mencoba demo toko 3D Keripik Pematang (${n} bungkus ${r.nama}) dan ingin dibuatkan halaman seperti ini untuk produk saya.`, "demo: produk-3d");
  if (what === "qty" && document.activeElement !== qty) qty.value = String(state.qty);
}
dockBtns.forEach((b, i) => b.addEventListener("click", () => setRasa(i, true)));
radios.forEach((x, i) => x.addEventListener("change", () => setRasa(i, true)));
qty.addEventListener("input", () => { if (qty.value !== "") setQty(+qty.value); });
qty.addEventListener("blur", () => { qty.value = String(state.qty); });
waBtn.addEventListener("click", () => window.track && track("click_whatsapp", { lokasi: "demo:produk-3d:pesan" }));
waOutro.href = wa('Halo Bikinin Studio, saya melihat demo toko 3D Keripik Pematang dan ingin dibuatkan halaman seperti ini untuk produk saya.', "demo: produk-3d");
waOutro.addEventListener("click", () => window.track && track("click_whatsapp", { lokasi: "demo:produk-3d:penutup" }));
onChange(paint);
paint();

$$("[data-spin]").forEach((b) => b.addEventListener("click", () => { if (ctx) { ctx.spin += +b.dataset.spin; ctx.invalidate(); } }));

// ---- bab aktif (untuk pemilih rasa di bawah) ----
const chapters = $$(".chapter");
const syncCh = () => {
  const mid = innerHeight * 0.5;
  let a = 0;
  chapters.forEach((el, i) => { if (el.getBoundingClientRect().top <= mid) a = i; });
  document.documentElement.dataset.ch = String(a);
};
addEventListener("scroll", syncCh, { passive: true });
addEventListener("resize", syncCh);
syncCh();

bootChapters([
  { title: "Kemasan", load: () => import("./scenes/kemasan.js") },
  { title: "Proses", load: () => import("./scenes/proses.js") },
  { title: "Pesan", load: () => import("./scenes/pesan.js") },
]).then((c) => { ctx = c; })
  .catch((e) => { console.error(e); document.documentElement.classList.add("no3d", "loaded"); });
