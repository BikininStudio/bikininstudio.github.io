// Studio 3D Bikinin: meja kerja dengan empat layanan (mesin ../3d/scroll3d.js, dunia di ./world.js).
import "../3d/bar.js";
import { bootChapters } from "../3d/scroll3d.js";
import { state, onChange } from "./state.js";

const $ = (s) => document.querySelector(s);
const wa = (t, src) => (window.waLink ? waLink(t, src) : "https://wa.me/6287763292786?text=" + encodeURIComponent(t));
const waBtns = [$("#wa-pesan"), $("#wa-outro")];
function paintWa() {
  const hal = state.layanan || "kebutuhan desain";
  waBtns.forEach((b) => { if (b) b.href = wa(`Halo Bikinin Studio, saya melihat Studio 3D Bikinin dan ingin berkonsultasi mengenai ${hal}.`, "demo: studio-3d"); });
}
onChange(paintWa); paintWa();
waBtns.forEach((b) => b && b.addEventListener("click", () => window.track && track("click_whatsapp", { lokasi: "demo:studio-3d" })));

// Sorot keyboard: fokus ke tautan di panel menggulir panel itu ke tengah (bawaan peramban); tautan tetap tautan HTML biasa.
bootChapters([
  { title: "Meja kerja", load: () => import("./scenes/meja.js") },
  { title: "Layanan", load: () => import("./scenes/layanan.js") },
  { title: "Pesan", load: () => import("./scenes/pesan.js") },
]).then(async (ctx) => {
  if (!ctx) return;
  const { getWorld } = await import("./world.js");
  const W = await getWorld(ctx.THREE, ctx);
  const canvas = document.querySelector(".stage canvas"), stage = document.querySelector(".stage");
  const ray = new ctx.THREE.Raycaster(), v = new ctx.THREE.Vector2();
  const hit = (e) => {
    if (!W.camera || W.mode === "pesan") return -1;
    const r = canvas.getBoundingClientRect();
    v.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v, W.camera);
    const h = ray.intersectObjects(W.proxies, false)[0];
    return h ? h.object.userData.k : -1;
  };
  let down = null;
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointermove", (e) => { if (e.pointerType === "mouse") stage.classList.toggle("pick", hit(e) >= 0); });
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 8) return;
    const k = hit(e);
    if (k < 0) return;
    const panel = document.querySelectorAll("#layanan .panel")[k];
    panel.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "center" });
  });
}).catch((e) => { console.error(e); document.documentElement.classList.add("no3d", "loaded"); });
