// Pekan Karya 3D: satu bab panjang, kamera menyusuri enam stan karya (engine ../3d/scroll3d.js, adegan ./scene.js).
import { bootChapters } from "../3d/scroll3d.js";

// Penanda langkah: aktif mengikuti panel di tengah layar; klik menggulir ke panel
const panels = [...document.querySelectorAll(".panel")];
const steps = [...document.querySelectorAll(".steps [data-step]")];
const mark = () => {
  const mid = innerHeight * 0.5;
  let a = 0;
  panels.forEach((el, i) => { if (el.getBoundingClientRect().top <= mid) a = i; });
  steps.forEach((b, i) => b.toggleAttribute("aria-current", i === a));
};
steps.forEach((b) => b.addEventListener("click", () => panels[+b.dataset.step].scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" })));
addEventListener("scroll", mark, { passive: true });
mark();

bootChapters([{ title: "Pekan Karya Bukit Rawa", load: () => import("./scene.js") }]).catch((e) => {
  console.error(e);
  document.documentElement.classList.add("no3d", "loaded");
});
