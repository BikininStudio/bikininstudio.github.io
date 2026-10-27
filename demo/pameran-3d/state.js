// Karya yang sedang dilihat (0-5), dipakai bilah kontrol dan pengumuman layar.
export const state = { k: 0 };
const subs = new Set();
export const onChange = (f) => subs.add(f);
export function setKarya(k) { if (k !== state.k) { state.k = k; subs.forEach((f) => f()); } }
