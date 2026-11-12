/* Cara kerja beranda: jalur biru terisi mengikuti gulir (rAF, hanya transform),
   tahap yang sudah dilewati garis tengah layar menyala dan dokumennya masuk dari kanan.
   Nama tahap aktif tampil besar di kolom kiri (desktop). Tanpa JS semua tampil penuh. */
(function () {
  "use strict";
  var sec = document.querySelector(".lk");
  if (!sec) return;
  var list = sec.querySelector(".lk-list"), fill = sec.querySelector(".lk-fill"), now = sec.querySelector(".lk-now");
  var steps = [].slice.call(sec.querySelectorAll(".lk-step"));
  if (!list || !fill || !steps.length) return;
  sec.classList.add("lk-js");
  var raf = 0;

  function update() {
    raf = 0;
    var r = list.getBoundingClientRect(), mid = innerHeight * 0.55;
    var p = (mid - r.top - 34) / Math.max(1, r.height - 68);
    p = p < 0 ? 0 : p > 1 ? 1 : p;
    fill.style.transform = "scaleY(" + p.toFixed(4) + ")";
    var active = -1;
    steps.forEach(function (s, i) {
      var top = s.getBoundingClientRect().top + 36; // titik simpul
      var lit = top <= mid;
      s.classList.toggle("on", lit);
      if (lit) active = i;
    });
    if (now) now.textContent = steps[Math.max(0, active)].getAttribute("data-t");
  }
  // tiap gulir menjadwalkan satu pembaruan per frame (ringan: lima kotak diukur), tanpa gerbang observer
  var req = function () { if (!raf) raf = requestAnimationFrame(update); };
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", req);
  update();
})();
