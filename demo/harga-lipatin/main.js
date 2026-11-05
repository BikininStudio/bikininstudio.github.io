// Lipatin: tabel harga mengisi nota rangkap. Hari ambil mengikuti cucian yang paling lama selesai.
(function () {
  const KILOAN = [
    ["kl", "Cuci lipat", "Tanpa setrika, kaus dan pakaian rumah", "2 hari", 7000, 2, "kg"],
    ["ks", "Cuci setrika", "Kemeja kantor dan seragam sekolah", "2 hari", 9000, 2, "kg"],
    ["kk", "Kilat", "Masuk sebelum 10.00, sore selesai", "8 jam", 14000, 0, "kg"],
    ["so", "Setrika saja", "Anda cuci sendiri, kami rapikan", "1 hari", 6000, 1, "kg"],
  ];
  const SATUAN = [
    ["bc", "Bed cover", "", "3 hari", 30000, 3, "bh"],
    ["se", "Selimut", "", "3 hari", 18000, 3, "bh"],
    ["gr", "Gorden", "Dihitung per sisi", "3 hari", 16000, 3, "bh"],
    ["jk", "Jaket tebal", "", "2 hari", 15000, 2, "bh"],
    ["jas", "Jas dua potong", "", "3 hari", 25000, 3, "bh"],
    ["kb", "Kebaya", "Dicuci tangan", "4 hari", 30000, 4, "bh"],
    ["sp", "Sepatu", "Satu pasang", "3 hari", 25000, 3, "bh"],
  ];
  const SEMUA = [...KILOAN, ...SATUAN];
  const rp = (n) => "Rp " + n.toLocaleString("id-ID");
  const $ = (id) => document.getElementById(id);
  const baris = (x) => `<tr><th scope="row">${x[1]}${x[2] ? `<small>${x[2]}</small>` : ""}</th><td class="w">${x[3]}</td><td class="h">${(x[4] / 1000).toLocaleString("id-ID")}rb</td><td><span class="step"><button type="button" data-id="${x[0]}" data-d="-1" aria-label="Kurangi ${x[1]}">−</button><span id="n-${x[0]}">0</span><button type="button" data-id="${x[0]}" data-d="1" aria-label="Tambah ${x[1]}">+</button></span></td></tr>`;
  $("kiloan").innerHTML = KILOAN.map(baris).join("");
  $("satuan").innerHTML = SATUAN.map(baris).join("");

  const hariIni = new Date();
  const tgl = (d) => d.toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  $("masuk").textContent = tgl(hariIni);

  const isi = {};
  let urutan = [];
  function nota(baru) {
    const ul = $("isi");
    if (!urutan.length) ul.innerHTML = `<li class="kosong">belum ada cucian</li>`;
    else ul.innerHTML = urutan.map((id) => {
      const x = SEMUA.find((s) => s[0] === id);
      const kurang = x[6] === "kg" && isi[id] < 2 ? " (min 2 kg)" : "";
      return `<li${id === baru ? "" : ' style="animation:none"'}><span>${isi[id]} ${x[6]} ${x[1].toLowerCase()}${kurang}</span><span>${rp(Math.max(isi[id], x[6] === "kg" ? 2 : 1) * x[4])}</span></li>`;
    }).join("");
    const total = urutan.reduce((s, id) => { const x = SEMUA.find((k) => k[0] === id); return s + Math.max(isi[id], x[6] === "kg" ? 2 : 1) * x[4]; }, 0);
    const lama = urutan.reduce((m, id) => Math.max(m, SEMUA.find((k) => k[0] === id)[5]), 0);
    const ambil = new Date(hariIni); ambil.setDate(ambil.getDate() + lama);
    $("ambil").textContent = !urutan.length ? "belum ada" : lama ? tgl(ambil) : "hari ini, sore";
    $("total").textContent = rp(total);
    $("kirim").disabled = !urutan.length;
    $("mini").hidden = !urutan.length;
    $("mini-isi").textContent = urutan.length + " baris di nota";
    $("mini-total").textContent = rp(total);
  }
  document.querySelector(".harga-a").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-id]"); if (!b) return;
    const id = b.dataset.id, d = +b.dataset.d;
    isi[id] = Math.max(0, (isi[id] || 0) + d);
    $("n-" + id).textContent = isi[id];
    if (isi[id] && !urutan.includes(id)) urutan.push(id);
    if (!isi[id]) { urutan = urutan.filter((x) => x !== id); delete isi[id]; }
    nota(d > 0 ? id : null);
  });
  $("kirim").addEventListener("click", () => demoToast(`Ini demo. Di versi asli, nota ${$("no").textContent} terkirim ke WhatsApp laundry untuk penjemputan.`));
  nota();

  if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) return;
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".hero h1, .hero-low, .harga h2, .sub, table, .nota-wrap, .tanya h2, .tanya dl > div, .alamat h2, .alamat p").forEach((el, i) => { el.classList.add("rise"); el.style.setProperty("--d", (i % 4) * 70 + "ms"); seen.observe(el); });
})();
