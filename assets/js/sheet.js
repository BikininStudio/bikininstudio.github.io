/* Bikinin v3 "lembar kontak": strip hero, penyusun permintaan, baris tahap, FAQ, jam, catatan portofolio.
   Semua konten sudah ada di HTML; skrip ini hanya menambah interaksi. */
(function () {
  "use strict";
  var doc = document, still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || doc).querySelector(s); };
  var $$ = function (s, r) { return [].slice.call((r || doc).querySelectorAll(s)); };

  // ---- Strip hero: frame yang paling dekat ke tengah tampil berwarna, judulnya di bawah ----
  var strip = $("[data-strip]");
  if (strip) {
    var fr = $$(".hs-f", strip), tEl = $("[data-strip-t]"), lEl = $("[data-strip-l]"), cur = -1, raf = 0;
    var pick = function () {
      raf = 0;
      var mid = innerWidth / 2, best = 0, bd = 1e9;
      fr.forEach(function (f, i) { var r = f.getBoundingClientRect(), d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
      if (best === cur) return;
      if (cur >= 0) fr[cur].classList.remove("on");
      cur = best; fr[cur].classList.add("on");
      tEl.textContent = fr[cur].dataset.t; lEl.textContent = fr[cur].dataset.l;
    };
    var ask = function () { if (!raf) raf = requestAnimationFrame(pick); };
    strip.addEventListener("scroll", ask, { passive: true });
    addEventListener("resize", ask);
    fr.forEach(function (f, i) { f.addEventListener("mouseenter", function () { tEl.textContent = f.dataset.t; lEl.textContent = f.dataset.l; }); });
    strip.addEventListener("mouseleave", function () { cur = -1; ask(); });
    // Mulai sedikit bergeser supaya frame pertama yang berwarna berada di tengah layar
    if (innerWidth > 640 && fr[2]) strip.scrollLeft = Math.max(0, fr[2].offsetLeft - innerWidth / 2 + fr[2].offsetWidth / 2);
    pick();
    // Gerak pelan otomatis sampai pengunjung menyentuh strip
    if (!still) {
      var auto = true, last = 0;
      ["pointerdown", "wheel", "touchstart", "keydown", "mouseenter"].forEach(function (e) { strip.addEventListener(e, function () { auto = false; }, { passive: true }); });
      var drift = function (t) {
        if (!auto) return;
        if (last && !doc.hidden && strip.getBoundingClientRect().bottom > 0) {
          strip.style.scrollSnapType = "none";
          strip.scrollLeft += (t - last) * 0.03;
          if (strip.scrollLeft + strip.clientWidth >= strip.scrollWidth - 2) strip.scrollLeft = 0;
        }
        last = t; requestAnimationFrame(drift);
      };
      setTimeout(function () { requestAnimationFrame(drift); }, 1500);
      strip.addEventListener("pointerdown", function () { strip.style.scrollSnapType = ""; });
    }
  }

  // ---- Penyusun permintaan ----
  var form = $("[data-req]"), dataEl = $("#req-data");
  if (form && dataEl) {
    var D = JSON.parse(dataEl.textContent), need = $("[data-need]", form), forS = $("[data-for]", form);
    var box = $("[data-req-ex]"), im = $("[data-req-img]");
    var upd = function () {
      var n = D.needs[need.value], ex = n.ex[forS.value];
      $("[data-req-price]").textContent = n.price;
      $("[data-req-paket]").textContent = "Mulai dari, paket " + n.paket;
      $("[data-req-incl]").textContent = n.incl;
      $("[data-req-text]").value = "Halo Bikinin Studio, saya perlu " + n.label + " untuk " + D.fors[forS.value] + ". Boleh minta penawarannya?";
      if (box.getAttribute("href") !== ex.href || im.getAttribute("src") !== ex.img) {
        box.classList.add("swap");
        setTimeout(function () {
          im.src = still ? ex.img.replace("-loop.webp", "-loop-poster.webp") : ex.img; im.alt = ex.t; box.href = ex.href;
          if (ex.ext) { box.target = "_blank"; box.rel = "noopener"; } else { box.removeAttribute("target"); box.removeAttribute("rel"); }
          $("[data-req-t]").textContent = ex.t; $("[data-req-lab]").textContent = ex.lab;
          box.classList.remove("swap");
        }, still ? 0 : 200);
      }
    };
    if (still && /-loop\.webp$/.test(im.getAttribute("src"))) im.src = im.getAttribute("src").replace("-loop.webp", "-loop-poster.webp");
    need.addEventListener("change", upd); forS.addEventListener("change", upd);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var url = "https://wa.me/" + D.wa + "?text=" + encodeURIComponent($("[data-req-text]").value);
      if (window.gtag) gtag("event", "klik_wa", { sumber: "permintaan", layanan: need.value, untuk: forS.value });
      window.open(url, "_blank", "noopener");
    });
    upd();
  }

  // ---- Baris tahap: tombol dan bilah kemajuan ----
  var row = $("[data-row]");
  if (row) {
    var bar = $("[data-row-bar]"), prev = $("[data-row-prev]"), next = $("[data-row-next]");
    var step = function () { var c = row.querySelector(".st-col"); return c ? c.offsetWidth + 32 : 300; };
    var prog = function () {
      var max = row.scrollWidth - row.clientWidth, p = max > 0 ? row.scrollLeft / max : 1;
      bar.style.width = Math.max(12, Math.round((row.clientWidth / row.scrollWidth) * 100 + p * (100 - (row.clientWidth / row.scrollWidth) * 100))) + "%";
      if (prev) prev.disabled = row.scrollLeft < 4;
      if (next) next.disabled = row.scrollLeft > max - 4;
    };
    row.addEventListener("scroll", prog, { passive: true }); addEventListener("resize", prog);
    if (prev) prev.addEventListener("click", function () { row.scrollBy({ left: -step(), behavior: still ? "auto" : "smooth" }); });
    if (next) next.addEventListener("click", function () { row.scrollBy({ left: step(), behavior: still ? "auto" : "smooth" }); });
    prog();
  }

  // ---- FAQ: satu jawaban besar di kanan (desktop), buka-tutup di bawah pertanyaan (HP) ----
  var pane = $("[data-fx-pane]"), qs = $$("[data-fx]");
  if (qs.length) {
    var wide = window.matchMedia("(min-width: 1024px)");
    var sel = function (q) {
      qs.forEach(function (o) { var on = o === q; o.setAttribute("aria-expanded", on); doc.getElementById(o.getAttribute("aria-controls")).hidden = !on; });
      if (pane) {
        var a = doc.getElementById(q.getAttribute("aria-controls")).textContent;
        if (still) { pane.textContent = a; return; }
        pane.classList.add("fade"); setTimeout(function () { pane.textContent = a; pane.classList.remove("fade"); }, 150);
      }
    };
    qs.forEach(function (q) {
      q.addEventListener("click", function () { sel(q); });
      q.addEventListener("focus", function () { if (wide.matches) sel(q); });
      q.addEventListener("mouseenter", function () { if (wide.matches) sel(q); });
    });
  }

  // ---- Catatan karya di portofolio: muncul saat satu baris disorot ----
  var note = $("[data-cs-note]");
  if (note) {
    $$(".cs-run").forEach(function (r) {
      var show = function () { var t = r.dataset.note; if (!t) { note.classList.remove("on"); return; } note.textContent = t; note.classList.add("on"); };
      r.addEventListener("mouseenter", show); r.addEventListener("focusin", show);
      r.addEventListener("mouseleave", function () { note.classList.remove("on"); });
    });
  }
})();

