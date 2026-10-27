// Ulasan klien dari view public_reviews (fetch REST ringan). Dipakai di beranda (#ulasan-home) dan /ulasan-klien/.
// 0 ulasan atau galat: section beranda tetap tersembunyi, halaman /ulasan-klien/ tetap menampilkan teks kosong.
// Kalimat "studio yang baru berjalan" ([data-honest]) disembunyikan setelah ada 3 ulasan atau lebih.
(function () {
  var home = document.getElementById("ulasan-home");
  var page = document.getElementById("rev-list");
  if ((!home && !page) || !window.BikininAPI) return;
  function card(r) {
    var c = document.createElement("article"); c.className = "card";
    var h = document.createElement("h3"); h.textContent = r.nama; c.appendChild(h);
    var m = document.createElement("p"); m.textContent = [r.usaha, r.layanan, r.bulan_tahun].filter(Boolean).join(" · "); c.appendChild(m);
    var s = document.createElement("p"); s.textContent = "Rating " + r.rating + " dari 5"; s.style.fontWeight = "700"; c.appendChild(s);
    var t = document.createElement("p"); t.textContent = r.teks; c.appendChild(t);
    return c;
  }
  window.BikininAPI.publicReviews().then(function (rows) {
    if (!rows || !rows.length) return;
    if (rows.length >= 3) document.querySelectorAll("[data-honest]").forEach(function (e) { e.hidden = true; });
    var list = home ? home.querySelector("[data-reviews-list]") : page;
    list.textContent = "";
    rows.slice(0, home ? 3 : rows.length).forEach(function (r) { list.appendChild(card(r)); });
    if (home) { home.hidden = false; return; }
    list.hidden = false; document.getElementById("rev-empty").hidden = true; document.getElementById("rev-note").hidden = false;
  });
})();
