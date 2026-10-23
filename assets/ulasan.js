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
    if (!d.kode.trim()) return show("Kode pesanan wajib diisi. Kodenya tercantum di pesan WhatsApp dari kami.", form.kode);
    // Same pattern as brief.gs (KODE_POLA): the server silently drops anything else, so say it here
    if (!/^BKN-[A-Z0-9]+(-[A-Z0-9]+)*$/i.test(d.kode.trim())) return show("Format kode pesanan tidak dikenali (contoh: BKN-2610-01). Salin kode dari pesan WhatsApp kami.", form.kode);
    if (!d.rating) return show("Mohon pilih rating bintang terlebih dahulu.", form.querySelector("[name=rating]"));
    if (!d.nama.trim()) return show("Nama wajib diisi; boleh berupa inisial.", form.nama);
    if (teks.length < 20) return show("Ulasan minimal 20 karakter.", form.ulasan);
    err.hidden = true;

    const submit = form.querySelector("[type=submit]");
    submit.disabled = true; // no double rows while the request is in flight
    sendBriefAsync({
      jenis: "ulasan", kode: d.kode.trim(), nama: d.nama.trim(), usaha: d.usaha.trim(), layanan: d.layanan,
      rating: d.rating, ulasan: teks.slice(0, 500), izin: d.izin ? "Ya" : "Tidak",
    }).then((sent) => {
      submit.disabled = false;
      if (!sent) return show("Ulasan gagal terkirim. Silakan coba lagi atau kirim melalui WhatsApp.");
      track("kirim_ulasan", { rating: Number(d.rating) });
      form.hidden = true;
      done.hidden = false;
      done.focus();
    });
  });
})();
