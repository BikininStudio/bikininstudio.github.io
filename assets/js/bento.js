/* Beranda bento: kotak kaca miring sedikit mengikuti kursor (hanya mouse, mati di reduced-motion). */
(function () {
  "use strict";
  if (!window.matchMedia || matchMedia("(prefers-reduced-motion: reduce)").matches || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
  [].forEach.call(document.querySelectorAll(".tilt"), function (el) {
    var raf = 0, rx = 0, ry = 0;
    var apply = function () { raf = 0; el.style.transform = "perspective(900px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateY(-3px)"; };
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      ry = ((e.clientX - r.left) / r.width - 0.5) * 6; rx = -((e.clientY - r.top) / r.height - 0.5) * 6;
      el.style.setProperty("--gx", ((e.clientX - r.left) / r.width * 100).toFixed(1) + "%");
      el.style.setProperty("--gy", ((e.clientY - r.top) / r.height * 100).toFixed(1) + "%");
      if (!raf) raf = requestAnimationFrame(apply);
    });
    el.addEventListener("pointerleave", function () { el.style.transform = ""; });
  });
})();
