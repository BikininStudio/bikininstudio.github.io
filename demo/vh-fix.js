// Tinggi panggung 3D untuk HP. Browser HP mengubah tinggi layar saat bilah alamat/menu menyusut, jadi panggung
// harus setinggi layar TERBESAR yang pernah terbaca (lvh / innerHeight terbesar), bukan svh saat halaman dimuat.
// --h hanya boleh membesar; dihitung ulang dari nol hanya saat lebar berubah (putar layar). Panel teks tetap
// memakai svh (teks terbaca di atas bilah bawah), jadi hanya panggung (kanvas) yang mengikuti --h.
(function () {
  var root = document.documentElement, w = innerWidth, cur = 0;
  var probe = document.createElement("div");
  probe.style.cssText = "position:fixed;left:0;top:0;width:0;height:100lvh;visibility:hidden;pointer-events:none";
  function read() { return Math.max(probe.getBoundingClientRect().height || 0, window.innerHeight || 0); }
  function apply(v) { if (v > cur) { cur = v; root.style.setProperty("--h", v + "px"); } }
  function init() { document.body.appendChild(probe); apply(read()); }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
  addEventListener("resize", function () {
    if (innerWidth !== w) { w = innerWidth; cur = 0; }
    apply(read());
  });
  addEventListener("scroll", function () { apply(window.innerHeight || 0); }, { passive: true });
  addEventListener("orientationchange", function () { setTimeout(function () { cur = 0; apply(read()); }, 300); });
})();

// Diagnostik: buka halaman demo dengan ?dbg=1 untuk menampilkan angka tinggi di layar (dihapus sebelum deploy bila tak perlu).
(function () {
  if (!/[?&]dbg(=|&|$)/.test(location.search)) return;
  var box = document.createElement("div");
  box.style.cssText = "position:fixed;left:6px;right:6px;top:64px;z-index:99999;background:rgba(0,0,0,.78);color:#fff;font:12px/1.35 monospace;padding:6px 8px;pointer-events:none;white-space:pre-wrap";
  function n(v) { return Math.round(v); }
  function tick() {
    var st = document.querySelector(".stage"), cv = st && st.querySelector("canvas"), vv = window.visualViewport;
    var sr = st ? st.getBoundingClientRect() : null, cr = cv ? cv.getBoundingClientRect() : null;
    var cs = getComputedStyle(document.documentElement).getPropertyValue("--h");
    box.textContent = "inner " + innerHeight + " | vv " + (vv ? n(vv.height) : "-") + " | --h " + cs + " | scrollY " + n(scrollY) +
      "\nstage top " + (sr ? n(sr.top) + " h " + n(sr.height) + " bottom " + n(sr.bottom) : "-") +
      "\ncanvas h " + (cr ? n(cr.height) + " bottom " + n(cr.bottom) : "-") + " | doc " + document.documentElement.scrollHeight +
      "\nbodyBg " + getComputedStyle(document.body).backgroundColor + " | " + navigator.userAgent.replace(/.*\) /, "").slice(0, 40);
  }
  function init() { document.body.appendChild(box); tick(); setInterval(tick, 400); }
  if (document.body) init(); else document.addEventListener("DOMContentLoaded", init);
})();
