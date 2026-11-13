// Inti demo: helper track/waLink, pita demo, toast, dan gerak (reveal + animasi ambient + slide otomatis).
// TIDAK ada deteksi FPS / "mode hemat": animasi hanya berhenti oleh prefers-reduced-motion.
(function () {
  "use strict";
  var WA = "6287763292786";
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.track = function (n, p) { try { window.gtag("event", n, p || {}); } catch (e) {} };
  window.waLink = function (text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); };

  var body = document.body, slug = body.dataset.demo, label = body.dataset.label;
  var own = body.dataset.fiktif === "false"; // karya milik Bikinin sendiri (brand kit, studio 3D)
  var tag = own ? "<b class=\"demo-sendiri\">Karya sendiri</b>" : "<b>Proyek konsep<span class=\"demo-pj\"> – brand fiktif</span></b>";
  var ket = own ? "Karya milik Bikinin Studio sendiri" : "Nama usaha dan harga di sini contoh";

  var bar = document.createElement("div");
  bar.className = "demo-bar"; bar.setAttribute("role", "region"); bar.setAttribute("aria-label", "Informasi demo");
  bar.innerHTML = '<a class="demo-back" href="/" aria-label="Kembali ke beranda Bikinin Studio">'
    + '<svg class="demo-panah" viewBox="0 0 16 16" aria-hidden="true"><path d="M10 3 5 8l5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="square"/></svg>'
    + '<img src="/assets/logo/ikon-gelap.svg" alt="" width="28" height="28"><span class="demo-nama">Bikinin Studio</span></a>'
    + '<span class="demo-label">' + tag + '<span class="demo-by">' + ket + "</span></span>"
    + '<a class="demo-cta" target="_blank" rel="noopener">'
    + '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v11H9l-5 4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>'
    + '<span class="demo-cta-p">Buat yang seperti ini</span><span class="demo-cta-k">Buat mirip</span></a>';
  var cta = bar.querySelector(".demo-cta");
  cta.href = waLink(body.dataset.wa || ('Halo Bikinin Studio, saya lihat demo "' + label + '" dan ingin dibuatkan yang mirip.'), "demo: " + slug);
  cta.addEventListener("click", function () { track("click_whatsapp", { lokasi: "demo:" + slug }); });
  body.prepend(bar);
  track("view_demo", { demo: slug });

  var toast = document.createElement("div");
  toast.className = "demo-toast"; toast.setAttribute("role", "status");
  body.appendChild(toast);
  var timer;
  window.demoToast = function (msg) { toast.textContent = msg; toast.classList.add("show"); clearTimeout(timer); timer = setTimeout(function () { toast.classList.remove("show"); }, 3200); };
  [].forEach.call(document.querySelectorAll("[data-demo-action]"), function (el) {
    el.addEventListener(el.tagName === "FORM" ? "submit" : "click", function (e) { e.preventDefault(); window.demoToast(el.dataset.demoAction || "Ini demo. Di versi asli, tombol ini langsung jalan."); });
  });

  // ---------- Gerak ----------
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || slug === "website-3d" || !("IntersectionObserver" in window)) return;
  var root = document.documentElement, q = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  // 1) reveal masuk/keluar untuk blok utama
  var rev = q("main > *, body > section, body > header, body > footer, .menu-item, .svc, .stat, .tl, .type-card, .app-box, .promo, .visit > *, .hl, .row, .cart").filter(function (el, i, a) { return !bar.contains(el) && a.indexOf(el) === i; });
  rev.forEach(function (el, i) { el.classList.add("dm"); el.style.setProperty("--dmi", String(i % 4)); });
  root.classList.add("dm-on");
  var seen = new WeakSet();
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      var el = e.target;
      if (e.isIntersecting) { seen.add(el); el.classList.remove("dm-out"); el.classList.add("dm-in"); }
      else if (e.boundingClientRect.top < 0) { if (seen.has(el)) { el.classList.remove("dm-in"); el.classList.add("dm-out"); } else el.classList.add("dm-in"); }
      else if (seen.has(el)) el.classList.remove("dm-in", "dm-out");
    });
  }, { threshold: [0, 0.12], rootMargin: "0px 0px -6% 0px" });
  rev.forEach(function (el) { io.observe(el); });

  // 2) animasi ambient (jalan hanya saat terlihat)
  var amb = q(".hero-img, .arch, .app-icon, .hero-in, .avatar, .swatch, .mark, .phone, #slide, .logos > *, .tape, .can");
  var pul = q(".grid > button, .thumbs > button, .chips > *, .swatches > *");
  amb.forEach(function (el, i) { el.classList.add("dm-amb"); el.style.setProperty("--dmi", String(i % 5)); });
  pul.forEach(function (el, i) { el.classList.add("dm-pulse"); el.style.setProperty("--dmi", String(i % 9)); });
  var vis = new IntersectionObserver(function (es) { es.forEach(function (e) { e.target.classList.toggle("dm-vis", e.isIntersecting); }); });
  amb.concat(pul).forEach(function (el) { vis.observe(el); });

  // 3) slide PPT otomatis
  var next = document.getElementById("next"), thumbs = document.getElementById("thumbs"), stageEl = document.getElementById("stage");
  if (next && thumbs && stageEl) {
    var pause = 0, onScreen = true;
    new IntersectionObserver(function (es) { onScreen = es[0].isIntersecting; }).observe(stageEl);
    ["pointerdown", "keydown"].forEach(function (ev) { document.addEventListener(ev, function () { pause = Date.now() + 12000; }); });
    setInterval(function () {
      if (!onScreen || document.hidden || Date.now() < pause) return;
      if (next.disabled && thumbs.firstElementChild) thumbs.firstElementChild.click(); else next.click();
      var img = document.getElementById("slide"); if (img) { img.classList.remove("dm-flip"); void img.offsetWidth; img.classList.add("dm-flip"); }
    }, 2400);
  }
  // 4) feed: tampilan pratinjau bergilir pada grid
  var grid = document.getElementById("grid");
  if (grid && grid.children.length && !document.getElementById("viewer").hidden === false) {
    var k = 0;
    setInterval(function () { if (document.hidden) return; [].forEach.call(grid.children, function (c) { c.style.outline = ""; }); var c = grid.children[k++ % grid.children.length]; c.style.outline = "3px solid #111111"; c.style.outlineOffset = "-3px"; }, 900);
  }
})();
