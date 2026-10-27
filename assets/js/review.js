// Form ulasan /ulasan/. Layanan tidak dikirim (server mengisi dari kode pesanan).
(function () {
  var form = document.getElementById("review");
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var q = new URLSearchParams(location.search);
  if (q.get("kode")) $("kode").value = q.get("kode").toUpperCase();
  var WA = (window.BIKININ_CONFIG && window.BIKININ_CONFIG.WA_NUMBER) || "6287763292786";
  var ta = $("ulasan-t");
  ta.addEventListener("input", function () { $("cnt").textContent = ta.value.length; });
  var setErr = function (id, msg) { var e = $(id + "-e"); if (!e) return; e.hidden = !msg; if (msg) e.querySelector("span").textContent = msg; var el = $(id); if (el) { if (msg) el.setAttribute("aria-invalid", "true"); else el.removeAttribute("aria-invalid"); } };
  var sending = false;
  var wa = function (t) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); };
  function note(html, ok) { var r = $("result"); r.hidden = false; r.className = "notice" + (ok ? " ok" : ""); r.innerHTML = html; }
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (sending) return;
    var errs = [], kode = $("kode").value.trim().toUpperCase(), rating = form.querySelector('input[name="rating"]:checked');
    setErr("kode", ""); setErr("rating", ""); setErr("nama", ""); setErr("ulasan-t", "");
    if (!kode) { setErr("kode", "Kode pesanan wajib diisi."); errs.push("kode"); }
    if (!rating) { setErr("rating", "Rating wajib dipilih."); errs.push(form.querySelector('input[name="rating"]')); }
    if ($("nama").value.trim().length < 2) { setErr("nama", "Nama wajib diisi, 2–80 karakter."); errs.push("nama"); }
    if (ta.value.trim().length < 20) { setErr("ulasan-t", "Ulasan minimal 20 karakter."); errs.push("ulasan-t"); }
    var s = $("summary");
    if (errs.length) { s.hidden = false; s.textContent = "Ada " + errs.length + " isian yang perlu diperbaiki."; var f = typeof errs[0] === "string" ? $(errs[0]) : errs[0]; f.focus(); return; }
    s.hidden = true;
    var btn = $("send"); sending = true; btn.textContent = "Mengirim…"; btn.disabled = true;
    window.BikininAPI.submitReview({ kode: kode, nama: $("nama").value.trim(), usaha: $("usaha").value.trim(), rating: +rating.value, ulasan: ta.value.trim(), izin: $("izin").checked, kode_cadangan: $("kode_cadangan").value }).then(function (r) {
      sending = false; btn.textContent = "Kirim ulasan"; btn.disabled = false;
      if (r.ok) { form.querySelectorAll("input,textarea,button").forEach(function (x) { x.disabled = true; }); note("Terima kasih. Ulasan tampil setelah kami periksa.<br><a class=\"btn btn-primary\" href=\"/\">Ke beranda</a>", true); track("review_submitted"); return; }
      if (r.status === 400) { note("Kode tidak dapat diverifikasi. Silakan hubungi kami lewat WhatsApp.<br><a class=\"btn btn-ghost\" target=\"_blank\" rel=\"noopener\" href=\"" + wa("Halo Bikinin Studio, saya ingin bertanya mengenai ulasan saya.") + "\">Buka WhatsApp</a>"); return; }
      note("Ulasan belum terkirim. Coba lagi, atau kirim lewat WhatsApp.<br><a class=\"btn btn-ghost\" target=\"_blank\" rel=\"noopener\" href=\"" + wa("Halo Bikinin Studio, saya ingin bertanya mengenai ulasan saya.") + "\">Buka WhatsApp</a>");
    });
  });
})();
