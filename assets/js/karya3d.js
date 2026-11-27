/* Kartu karya 3D di seksi portal (2026-11-26; dihaluskan 2026-11-27): kartu yang sudah mendarat bergoyang pelan
   di ruang 3D (fase berbeda-beda) dan, di desktop, miring mengikuti kursor saat disorot. Selama kartu terbang
   (portal.js), goyangan mereda ke nol supaya dua gerak tidak bertabrakan.
   Transform ditulis langsung ke .dv (bukan variabel CSS, yang memaksa hitung ulang gaya seluruh isi kartu),
   dan hanya bila nilainya berubah. Berhenti saat seksi di luar layar; mati di reduced-motion (kartu diam). */
(function () {
  "use strict";
  if (!window.requestAnimationFrame) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var sec = document.querySelector(".ptl");
  if (!sec) return;
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var items = [], raf = 0, tPrev = 0, on = false;

  [].forEach.call(sec.querySelectorAll(".ptl-cards li"), function (li, i) {
    var dv = li.querySelector(".dv"); if (!dv) return;
    var it = { li: li, dv: dv, ph: i * 1.9, sp: 0.55 + (i % 3) * 0.09, amp: 0, over: 0, tover: 0, hx: 0, hy: 0, tx: 0, ty: 0, ry: 0, last: "" };
    items.push(it);
    var a = li.querySelector("a");
    if (!fine || !a) return;
    a.addEventListener("pointermove", function (e) {
      var r = a.getBoundingClientRect();
      it.tx = (e.clientX - r.left) / r.width - 0.5; it.ty = (e.clientY - r.top) / r.height - 0.5; it.tover = 1; req();
    }, { passive: true });
    a.addEventListener("pointerleave", function () { it.tover = 0; it.tx = 0; it.ty = 0; req(); });
  });
  if (!items.length) return;

  function readBase() { items.forEach(function (it) { it.ry = parseFloat(getComputedStyle(it.li).getPropertyValue("--ry")) || 0; }); }

  function tick(now) {
    raf = 0;
    if (!on) { tPrev = 0; return; }
    var dt = tPrev ? Math.min(0.05, (now - tPrev) / 1000) : 0.016; tPrev = now;
    var t = now / 1000, k = 1 - Math.exp(-dt * 6), k2 = 1 - Math.exp(-dt * 2.5);
    for (var n = 0; n < items.length; n++) {
      var it = items[n];
      if (it.li.style.visibility === "hidden") continue; // kartu tak tampil: tidak usah dihitung
      it.amp += ((it.li.classList.contains("hit") ? 1 : 0) - it.amp) * k2; // goyang hanya setelah mendarat
      it.over += (it.tover - it.over) * k; it.hx += (it.tx - it.hx) * k; it.hy += (it.ty - it.hy) * k;
      var calm = (1 - it.over) * it.amp;
      var sy = Math.sin(t * it.sp + it.ph) * 14 * calm + it.hx * 26;
      var sx = Math.sin(t * it.sp * 0.8 + it.ph * 1.3) * 5 * calm - it.hy * 18;
      var tr = "rotateX(" + (4 + sx).toFixed(1) + "deg) rotateY(" + (it.ry + sy).toFixed(1) + "deg)";
      if (tr !== it.last) { it.dv.style.transform = tr; it.last = tr; }
    }
    raf = requestAnimationFrame(tick);
  }
  function req() { if (!raf && on) raf = requestAnimationFrame(tick); }

  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) { readBase(); req(); } }).observe(sec);
  } else { on = true; readBase(); req(); }
  addEventListener("resize", readBase);
})();
