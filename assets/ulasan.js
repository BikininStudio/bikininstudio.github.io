// Form ulasan (halaman ulasan/). Kirim ke tab "Ulasan" di Google Sheets lewat sendBrief (assets/analytics.js).
// Ulasan baru tampil di beranda setelah admin ganti kolom "Tampil" jadi "Ya" di Sheet.
(function () {
  const form = document.getElementById("review-form");
  if (!form) return;
  const err = document.getElementById("review-error");
  const done = document.getElementById("review-done");
  const count = document.getElementById("r-count");

  // link dari admin: ulasan/?kode=BKN-2610-01
  const kode = new URLSearchParams(location.search).get("kode");
  if (kode) form.kode.value = kode.trim().slice(0, 30);

  form.ulasan.addEventListener("input", () => {
    count.textContent = `${form.ulasan.value.trim().length}/500 karakter, minimal 20`;
  });

  const show = (msg, field) => {
    err.textContent = msg;
    err.hidden = false;
    if (field) field.focus();
  };

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(form).entries());
    if (d.kode_cadangan) return; // honeypot: only bots fill the hidden field
    const teks = (d.ulasan || "").trim();
    if (!d.kode.trim()) return show("Kode order wajib diisi. Kodenya ada di pesan WhatsApp dari admin.", form.kode);
    if (!d.rating) return show("Pilih rating bintangnya dulu ya.", form.querySelector("[name=rating]"));
    if (!d.nama.trim()) return show("Nama wajib diisi, boleh inisial.", form.nama);
    if (teks.length < 20) return show("Ulasannya minimal 20 karakter ya.", form.ulasan);
    err.hidden = true;

    const sent = window.BIKININ.SHEET_URL && sendBrief({
      jenis: "ulasan", kode: d.kode.trim(), nama: d.nama.trim(), usaha: d.usaha.trim(), layanan: d.layanan,
      rating: d.rating, ulasan: teks.slice(0, 500), izin: d.izin ? "Ya" : "Tidak",
    });
    if (!sent) return show("Ulasan gagal terkirim. Coba lagi, atau kirim lewat WhatsApp aja.");
    track("kirim_ulasan", { rating: Number(d.rating) });
    form.hidden = true;
    done.hidden = false;
    done.focus();
  });
})();
