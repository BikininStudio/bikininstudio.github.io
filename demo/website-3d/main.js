// Showcase website 3D: three chapters on one canvas (engine in ../3d/scroll3d.js, scenes in ./scenes/).
import { bootChapters } from "../3d/scroll3d.js";

bootChapters([
  { title: "Kopi Rindang", load: () => import("./scenes/kaleng.js") },
  { title: "GgStore", load: () => import("./scenes/tape.js") },
  { title: "Arunika Logistik", load: () => import("./scenes/kota.js") },
]).catch((e) => {
  console.error(e);
  document.documentElement.classList.add("no3d", "loaded");
});
