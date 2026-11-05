// Soto Gang Sawo: isi menu, mangkuk digambar dari atas, hitungan nasi kotak terhadap 3 panci.
(function () {
  const SOTO = [
    ["Soto ayam kampung", "18", "Suwiran ayam, bihun, tauge, separuh telur rebus.", "ayam"],
    ["Soto ampela ati", "20", "Ampela dan hati dipotong kecil, daging ayam sedikit.", "ati"],
    ["Soto daging", "26", "Sandung lamur direbus tiga jam, irisan tebal.", "daging"],
    ["Soto babat", "28", "Babat goreng, kuah sama dengan soto ayam.", "babat"],
    ["Soto campur", "30", "Ayam, daging, dan babat dalam satu mangkuk.", "campur"],
    ["Soto kecil", "12", "Mangkuk anak, tanpa sambal, separuh porsi.", "kecil"],
  ];
  const LAUK = [["Nasi putih", "6"], ["Perkedel kentang", "4"], ["Tempe mendoan", "3"], ["Sate telur puyuh", "5"], ["Sate usus", "4"], ["Sate kerang", "6"], ["Kerupuk udang", "3"], ["Emping", "4"]];
  const MINUM = [["Teh tawar panas", "3"], ["Teh manis", "5"], ["Es teh", "6"], ["Jeruk peras", "8"], ["Kopi tubruk", "6"], ["Es cincau", "9"], ["Air gelas", "2"]];

  // Acak berbenih: tiap mangkuk beda, tetapi sama di setiap kunjungan
  const rng = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  const INK = "#17120C", KUN = "#E7B122", KRT = "#EAD9B8", COK = "#7A4E22";

  let uid = 0;
  function bowl(kind, seed, big) {
    const r = rng(seed * 7919 + 13), f = big ? .5 : 1, kali = big ? 4 : 1, id = "kuah" + uid++;
    const at = (rad) => { const a = r() * 6.283, d = Math.sqrt(r()) * rad; return [50 + Math.cos(a) * d, 50 + Math.sin(a) * d]; };
    let s = "";
    // bihun: benang kurus melingkar
    for (let i = 0; i < 18 * kali; i++) {
      const [x, y] = at(36), a = r() * 6.283, l = (9 + r() * 12) * (big ? .75 : 1);
      s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(Math.cos(a) * l).toFixed(1)} ${(Math.sin(a) * l).toFixed(1)} ${(Math.cos(a + 1.3) * l * 1.3).toFixed(1)} ${(Math.sin(a + 1.3) * l * 1.3).toFixed(1)}" fill="none" stroke="${KRT}" stroke-width="${big ? .7 : 1.3}" stroke-linecap="round"/>`;
    }
    const strip = (n, w, c, len) => {
      for (let i = 0; i < n * kali; i++) {
        const [x, y] = at(28), a = r() * 6.283, l = len * f * (.6 + r() * .8), t = r() * 3 - 1.5;
        s += `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(Math.cos(a) * l + t).toFixed(1)} ${(Math.sin(a) * l - t).toFixed(1)} ${(Math.cos(a) * l * 2).toFixed(1)} ${(Math.sin(a) * l * 2).toFixed(1)}" fill="none" stroke="${c}" stroke-width="${w * f}" stroke-linecap="round"/>`;
      }
    };
    const chunk = (n, c, size) => {
      for (let i = 0; i < n; i++) {
        const [x, y] = at(26); let d = "";
        const k = 6;
        for (let j = 0; j < k; j++) {
          const a = (j / k) * 6.283, q = size * (.6 + r() * .6);
          d += `${j ? "L" : "M"}${(x + Math.cos(a) * q).toFixed(1)} ${(y + Math.sin(a) * q).toFixed(1)}`;
        }
        s += `<path d="${d}Z" fill="${c}"/>`;
      }
    };
    if (kind === "ayam" || kind === "campur") strip(kind === "ayam" ? 14 : 8, 2.6, KRT, 5);
    if (kind === "kecil") strip(8, 2.4, KRT, 4);
    if (kind === "ati") chunk(7, COK, 4.2), strip(5, 2.4, KRT, 4);
    if (kind === "daging" || kind === "campur") chunk(kind === "campur" ? 3 : 7, COK, 5.4);
    if (kind === "babat" || kind === "campur") chunk(kind === "babat" ? 8 : 3, INK, 4.6);
    if (kind !== "kecil") { // separuh telur rebus
      const [x, y] = at(14), a = r() * 180, e = big ? 1.05 : 1;
      s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)}) rotate(${a.toFixed(0)}) scale(${e})"><path d="M-11 0a11 11 0 0 0 22 0z" fill="#F7EFDD"/><path d="M-5.5 0a5.5 5.5 0 0 0 11 0z" fill="#C8850F"/><path d="M-11 0a11 11 0 0 0 22 0" fill="none" stroke="${INK}" stroke-width=".6"/></g>`;
    }
    // seledri dan bawang goreng
    for (let i = 0; i < (big ? 70 : 18); i++) { const [x, y] = at(38), q = (big ? 1.1 : 2) * (.7 + r() * .6); s += `<rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${q.toFixed(1)}" height="${q.toFixed(1)}" fill="${r() < .55 ? INK : COK}" transform="rotate(${(r() * 90).toFixed(0)} ${x.toFixed(1)} ${y.toFixed(1)})"/>`; }
    return `<svg viewBox="0 0 100 100" aria-hidden="true"><clipPath id="${id}"><circle cx="50.6" cy="49.4" r="41.5"/></clipPath><circle cx="50" cy="50" r="48" fill="${INK}"/><circle cx="50.6" cy="49.4" r="41.5" fill="${KUN}"/><g clip-path="url(#${id})">${s}</g></svg>`;
  }

  document.getElementById("bowl-besar").innerHTML = bowl("ayam", 4, true);
  document.getElementById("dishes").innerHTML = SOTO.map((d, i) => `<li class="dish rise">${bowl(d[3], i + 2)}<h3>${d[0]}</h3><span class="harga">${d[1]}</span><p>${d[2]}</p></li>`).join("");
  const lines = (arr) => arr.map((x) => `<li>${x[0]}<span>${x[1]}</span></li>`).join("");
  document.getElementById("lauk").innerHTML = lines(LAUK);
  document.getElementById("minum").innerHTML = lines(MINUM);

  document.querySelector("[data-print]").addEventListener("click", () => window.print());

  // Hitungan: 45 porsi per panci, 3 panci sehari
  const PORSI = 45, PANCI = 3;
  const $ = (id) => document.getElementById(id);
  const rp = (n) => "Rp " + n.toLocaleString("id-ID");
  $("panci").innerHTML = "<div class=panci><i></i></div>".repeat(PANCI);
  const pots = [...document.querySelectorAll(".panci i")];
  const range = $("jumlah");

  function hitung() {
    const n = +range.value;
    const pick = document.querySelector('input[name="isi"]:checked');
    const total = n * +pick.value;
    const panci = n / PORSI;
    pots.forEach((p, i) => p.style.setProperty("--isi", Math.max(0, Math.min(1, panci - i)).toFixed(3)));
    $("out-jumlah").textContent = n;
    $("pakai").textContent = panci <= 1 ? `${n} kotak memakai ${Math.round(panci * 100)}% satu panci.`
      : panci <= PANCI ? `${n} kotak memakai ${panci.toLocaleString("id-ID", { maximumFractionDigits: 1 })} panci.`
      : `${n} kotak lebih dari tiga panci sehari.`;
    $("total").textContent = rp(total);
    $("syarat").textContent = n > PORSI * PANCI ? "Warung tutup hari itu dan kami masak satu panci tambahan. Pesan paling lambat 5 hari sebelumnya."
      : n > PORSI * 2 ? "Warung tutup lebih awal hari itu. Pesan paling lambat 3 hari sebelumnya."
      : n > PORSI ? "Pesan paling lambat 2 hari sebelumnya."
      : "Pesan paling lambat sehari sebelumnya, sebelum 10.00.";
    $("ringkas").textContent = `${n} ${pick.dataset.nama}, ${rp(total)}. Kurir warung mengantar di Bekasi Timur tanpa ongkos untuk pesanan 40 kotak ke atas.`;
  }
  range.addEventListener("input", hitung);
  document.querySelectorAll('input[name="isi"]').forEach((x) => x.addEventListener("change", hitung));
  hitung();

  $("kupon").addEventListener("submit", (e) => {
    e.preventDefault();
    demoToast("Ini demo. Di versi asli, kupon ini terkirim ke WhatsApp warung.");
  });

  // Masuk bertahap per bagian
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const parts = document.querySelectorAll(".sheet-head, .columns section, .sheet-foot, .kotak-a, .kotak-b, .kupon, .alamat h2, .alamat-grid, .rise");
  if (reduce || !("IntersectionObserver" in window)) { document.querySelectorAll(".rise").forEach((el) => el.classList.add("in")); return; }
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  parts.forEach((el, i) => { el.classList.add("rise"); el.style.setProperty("--d", (i % 4) * 70 + "ms"); seen.observe(el); });
})();
