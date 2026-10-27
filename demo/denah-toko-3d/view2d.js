// Tampilan denah 2D (SVG, tampak atas). Dipakai sebagai cadangan bila WebGL tidak ada; datanya sama dengan tampilan 3D.
import { ROOM, TYPES, foot, SNAP } from "./model.js";
const NS = "http://www.w3.org/2000/svg";
const el = (n, a = {}, p) => { const e = document.createElementNS(NS, n); Object.entries(a).forEach(([k, v]) => e.setAttribute(k, v)); if (p) p.appendChild(e); return e; };
const FILL = { meja: "#8C6B52", kursi: "#5B6B5A", rak: "#6B6560", kasir: "#7A5238" };

export function createView2D(host, ctrl) {
  const svg = el("svg", { viewBox: `-0.15 -0.15 ${ROOM.w + 0.3} ${ROOM.d + 0.3}`, class: "denah-svg", role: "img", "aria-label": "Denah kedai Kopi Rindang dilihat dari atas dengan meja, kursi, rak, dan meja kasir (proyek konsep)", preserveAspectRatio: "xMidYMid meet" });
  const defs = el("defs", {}, svg);
  const pat = el("pattern", { id: "kisi", width: 0.5, height: 0.5, patternUnits: "userSpaceOnUse" }, defs);
  el("path", { d: "M0.5 0H0V0.5", fill: "none", stroke: "#8F7F70", "stroke-opacity": ".35", "stroke-width": "0.012" }, pat);
  el("rect", { x: 0, y: 0, width: ROOM.w, height: ROOM.d, fill: "#A88B6C" }, svg);
  el("rect", { x: 0, y: 0, width: ROOM.w, height: ROOM.d, fill: "url(#kisi)" }, svg);
  el("rect", { x: -0.06, y: -0.06, width: ROOM.w + 0.12, height: ROOM.d + 0.12, fill: "none", stroke: "#D9CFBC", "stroke-width": "0.12" }, svg);
  const layer = el("g", {}, svg);
  host.appendChild(svg);

  const ptr = (e) => { const p = svg.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; return p.matrixTransform(svg.getScreenCTM().inverse()); };
  let drag = null;
  svg.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("[data-id]");
    if (!g) { ctrl.select(null); return; }
    const id = g.dataset.id, it = ctrl.items().find((o) => o.id === id), p = ptr(e);
    ctrl.select(id);
    drag = { id, dx: it.x - p.x, dz: it.z - p.y };
    ctrl.beginDrag(id);
    svg.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  svg.addEventListener("pointermove", (e) => { if (!drag) return; const p = ptr(e); ctrl.dragTo(p.x + drag.dx, p.y + drag.dz); });
  const end = () => { if (drag) { drag = null; ctrl.endDrag(); } };
  svg.addEventListener("pointerup", end); svg.addEventListener("pointercancel", end);

  return {
    kind: "2d",
    sync(items, sel, invalid) {
      layer.textContent = "";
      items.forEach((it) => {
        const t = TYPES[it.type], f = foot(it);
        const g = el("g", { "data-id": it.id, class: "obj" }, layer);
        const on = it.id === sel;
        const r = el("rect", { x: it.x - f.w / 2, y: it.z - f.d / 2, width: f.w, height: f.d, rx: t.kind === "kursi" ? 0.08 : 0.05, fill: FILL[t.kind], stroke: on ? (it.id === invalid ? "#8A4426" : "#2F4A3A") : "#3B2E24", "stroke-opacity": on ? 1 : 0.35, "stroke-width": on ? 0.08 : 0.02 }, g);
        if (t.kind === "kursi") {
          // sandaran di sisi belakang kursi
          const a = (it.rot * Math.PI) / 180, bx = it.x - Math.sin(a) * 0.17, bz = it.z - Math.cos(a) * 0.17;
          el("rect", { x: bx - (it.rot % 180 === 0 ? 0.2 : 0.04), y: bz - (it.rot % 180 === 0 ? 0.04 : 0.2), width: it.rot % 180 === 0 ? 0.4 : 0.08, height: it.rot % 180 === 0 ? 0.08 : 0.4, fill: "#3F4C3E", "pointer-events": "none" }, g);
        }
        if (t.kind === "kasir" || t.kind === "rak") { const tx = el("text", { x: it.x, y: it.z + 0.1, "text-anchor": "middle", "font-size": 0.28, fill: "#F1E8DA", "font-family": "Hanken Grotesk, sans-serif", "font-weight": 700, "pointer-events": "none" }, g); tx.textContent = t.kind === "kasir" ? "Kasir" : it.rot % 180 ? "" : "Rak"; }
        if (on) r.setAttribute("filter", "");
      });
    },
    resize() {},
    setTop() {},
    dispose() { svg.remove(); },
  };
}
