// /pesan/terkirim/: tampilkan kode, salin, tombol WhatsApp dengan ringkasan (dari sessionStorage).
(function () {
  var q = new URLSearchParams(location.search), kode = (q.get("kode") || "").toUpperCase();
  var saved = null; try { saved = JSON.parse(sessionStorage.getItem("bikinin_brief") || "null"); } catch (e) {}
  var ok = /^BKN-[A-Z0-9]+(-[A-Z0-9]+)*$/.test(kode);
  var WA = (window.BIKININ_CONFIG && window.BIKININ_CONFIG.WA_NUMBER) || "6287763292786";
  document.getElementById(ok ? "ok" : "nokode").hidden = false;
  if (ok) {
    document.getElementById("kode").textContent = kode;
    document.getElementById("copy").addEventListener("click", function () {
      var done = function () { var c = document.getElementById("copied"); c.textContent = "Tersalin"; };
      if (navigator.clipboard) navigator.clipboard.writeText(kode).then(done, done); else done();
    });
  } else document.getElementById("h1t").textContent = "Brief Anda belum tercatat di sistem kami";
  var text = saved && saved.wa ? saved.wa : (ok ? "Halo Bikinin Studio, saya ingin memesan.\nKode pesanan: " + kode : "Halo Bikinin Studio, saya ingin memesan.");
  document.getElementById("wa-open").href = "https://wa.me/" + WA + "?text=" + encodeURIComponent(text);
})();
