// Menu HP + validasi form kontak (demo: tidak mengirim ke mana pun).
(function () {
  "use strict";
  var btn = document.getElementById("menu-btn"), nav = document.getElementById("nav");
  if (btn) {
    btn.addEventListener("click", function () {
      var o = nav.classList.toggle("open");
      btn.setAttribute("aria-expanded", o);
      btn.textContent = o ? "Tutup menu" : "Buka menu";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("open")) { btn.click(); btn.focus(); }
    });
  }
  var f = document.getElementById("brief");
  if (!f) return;
  var q = new URLSearchParams(location.search).get("posisi");
  if (q) {
    f.elements.layanan.value = "Lainnya";
    f.elements.pesan.value = "Saya melamar posisi " + q + ". Pengalaman dan kontak saya: ";
  }
  var rules = {
    nama: function (v) { return v.trim() ? "" : "Isi nama Anda."; },
    email: function (v) { return !v.trim() ? "Isi email Anda." : /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? "" : "Email belum lengkap. Contoh: nama@contoh.com."; },
    telepon: function (v) { return /^\d{9,14}$/.test(v.replace(/[\s-]/g, "")) ? "" : "Nomor telepon hanya berisi angka, 9–14 digit."; },
    layanan: function (v) { return v ? "" : "Pilih salah satu jenis layanan."; },
    pesan: function (v) { return v.trim().length >= 20 ? "" : "Tulis minimal 20 karakter agar rencana Anda bisa dinilai."; }
  };
  function check(n) {
    var el = f.elements[n], m = rules[n](el.value), er = document.getElementById("e-" + n);
    er.textContent = m; el.setAttribute("aria-invalid", m ? "true" : "false");
    return m;
  }
  Object.keys(rules).forEach(function (n) { f.elements[n].addEventListener("blur", function () { check(n); }); });
  var sum = document.getElementById("sum"), ok = document.getElementById("ok"), sb = document.getElementById("send");
  f.addEventListener("submit", function (e) {
    e.preventDefault();
    ok.hidden = true;
    var bad = Object.keys(rules).filter(function (n) { return check(n); });
    if (bad.length) {
      sum.textContent = "Ada " + bad.length + " isian yang perlu diperbaiki.";
      f.elements[bad[0]].focus();
      return;
    }
    sum.textContent = "";
    sb.disabled = true; sb.textContent = "Mengirim…";
    setTimeout(function () {
      sb.disabled = false; sb.textContent = "Kirim brief";
      ok.hidden = false;
      ok.textContent = "Ini demo, pesan tidak dikirim. Pada situs sungguhan, brief Anda masuk ke email kantor dan dibalas dalam 2 hari kerja.";
      f.reset();
    }, 700);
  });
})();
