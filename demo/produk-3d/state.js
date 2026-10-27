// Keadaan bersama halaman: rasa terpilih dan jumlah. Dipakai main.js (UI) dan scene (3D).
export const RASA = [
  { id: "original", nama: "Original asin", pendek: "Original", harga: 17500, warna: "#D2A03B", tinta: "#2A2112", aksen: "#F2DFA6", bumbu: "garam laut" },
  { id: "balado", nama: "Balado", pendek: "Balado", harga: 18500, warna: "#B14A2D", tinta: "#FBEFDD", aksen: "#F2C98A", bumbu: "cabai merah, bawang, gula merah" },
  { id: "daun-jeruk", nama: "Daun jeruk", pendek: "Daun jeruk", harga: 19500, warna: "#5F7D3A", tinta: "#F7F1DC", aksen: "#D9E3A6", bumbu: "daun jeruk, lada" },
];
export const state = { rasa: 0, qty: 1, manual: false };
const subs = new Set();
export const onChange = (fn) => { subs.add(fn); return () => subs.delete(fn); };
export function setRasa(i, manual = false) {
  if (i === state.rasa && state.manual === manual) return;
  const changed = i !== state.rasa;
  state.rasa = i; state.manual = manual;
  subs.forEach((f) => f("rasa", changed));
}
export function setQty(n) { state.qty = Math.max(1, Math.min(20, Math.round(n) || 1)); subs.forEach((f) => f("qty", true)); }
export const rupiah = (n) => "Rp " + new Intl.NumberFormat("id-ID").format(n);
