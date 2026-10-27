// Benda yang terakhir dipilih (untuk pesan WhatsApp) dan penghubung ke UI.
export const state = { layanan: null };
const subs = new Set();
export const onChange = (f) => subs.add(f);
export function setLayanan(v) { if (v !== state.layanan) { state.layanan = v; subs.forEach((f) => f()); } }
