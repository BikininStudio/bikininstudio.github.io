/* Beranda v4: panggung demo bertab dan kata raksasa yang sedikit mengecil saat hero digulir lewat. */
(function () {
  "use strict";
  var doc = document, still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s) { return doc.querySelector(s); };

  // ---- Panggung demo ----
  var data = $("#stage-data");
  if (data) {
    var S = JSON.parse(data.textContent), im = $("[data-st-img]"), tabs = [].slice.call(doc.querySelectorAll("[data-st]"));
    var show = function (i) {
      var s = S[i];
      tabs.forEach(function (t, k) { t.setAttribute("aria-selected", k === i); });
      $("[data-st-t]").textContent = s.title; $("[data-st-d]").textContent = s.desk;
      $("[data-st-href]").href = s.href;
      $("[data-st-wa]").href = "https://wa.me/" + ($("[data-st-wa]").href.match(/wa\.me\/(\d+)/) || [0, ""])[1] + "?text=" + encodeURIComponent(s.wa);
      var src = still ? s.img.replace("-loop.webp", "-loop-poster.webp") : s.img;
      im.classList.add("swap");
      setTimeout(function () { im.src = src; im.alt = s.title; im.onload = function () { im.classList.remove("swap"); }; }, still ? 0 : 180);
    };
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { show(i); });
      t.addEventListener("keydown", function (e) { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { var n = (i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length; tabs[n].focus(); show(n); } });
    });
    if (still && /-loop\.webp$/.test(im.getAttribute("src"))) im.src = im.getAttribute("src").replace("-loop.webp", "-loop-poster.webp");
  }

  // ---- Kata monumen: mengecil sampai 6% saat hero meninggalkan layar ----
  var word = $(".mh-word"), hero = $(".mono-hero");
  if (word && hero && !still) {
    var tick = 0;
    addEventListener("scroll", function () {
      if (tick) return;
      tick = requestAnimationFrame(function () {
        tick = 0;
        var p = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight || 1)));
        word.style.transform = "scale(" + (1 - p * 0.06).toFixed(4) + ")";
      });
    }, { passive: true });
  }
})();
