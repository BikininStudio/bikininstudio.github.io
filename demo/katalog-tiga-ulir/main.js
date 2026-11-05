// Tiga Ulir: isi buku, gambar teknik barang, pencocok ukuran 1:1, daftar minta harga.
(function () {
  const INK = "#111009";
  const hex = (x, y, w, h) => { // kepala baut dari samping: tiga muka
    const m = h / 4;
    return `<path d="M${x} ${y + m * .2}H${x + w}V${y + h - m * .2}H${x}Z" fill="${INK}"/><path d="M${x} ${y + m}H${x + w}M${x} ${y + h - m}H${x + w}" stroke="#E2BE45" stroke-width="1.4"/>`;
  };
  const ulir = (x, y, l, d, pitch = 3.4, g = 1.4) => { // batang berulir: gerigi digambar satu per satu
    let top = `M${x} ${y - d / 2}`, bot = "";
    const n = Math.floor(l / pitch);
    for (let i = 0; i < n; i++) { top += `l${pitch / 2} ${-g}l${pitch / 2} ${g}`; bot = `l${-pitch / 2} ${g}l${-pitch / 2} ${-g}` + bot; }
    return `<path d="${top}l2 2v${d - 4}l-2 2${bot}Z" fill="${INK}"/>`;
  };
  const G = {
    angkur: `${ulir(36, 40, 60, 16)}<path d="M6 30h30v20H6z" fill="${INK}"/><path d="M6 30l-5 10 5 10z" fill="${INK}"/><path d="M60 26h14v28H60z" fill="${INK}"/><path d="M52 34l7 6-7 6" stroke="#E2BE45" stroke-width="2" fill="none"/>`,
    hex: `${hex(4, 18, 28, 44)}<rect x="32" y="31" width="20" height="18" fill="${INK}"/>${ulir(52, 40, 60, 18)}`,
    allen: `<rect x="6" y="20" width="26" height="40" fill="${INK}"/><rect x="6" y="33" width="10" height="14" fill="#E2BE45"/><rect x="32" y="32" width="18" height="16" fill="${INK}"/>${ulir(50, 40, 60, 16)}`,
    bor: `<rect x="2" y="32" width="42" height="16" fill="${INK}"/>${(() => { let s = ""; for (let i = 0; i < 6; i++) s += `<path d="M${44 + i * 11} 32l11 0l-6 16l-11 0z" fill="${i % 2 ? "#E2BE45" : INK}"/>`; return s; })()}<path d="M110 32l8 8l-8 8z" fill="${INK}"/>`,
    engsel: `<path d="M6 12h50v56H6z" fill="${INK}"/><path d="M64 12h50v56H64z" fill="${INK}"/><rect x="55" y="8" width="10" height="64" fill="${INK}"/><path d="M60 8v64M55 30h10M55 50h10" stroke="#E2BE45" stroke-width="1.4"/>${[[20, 26], [20, 54], [100, 26], [100, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="5" fill="#E2BE45"/>`).join("")}`,
    kawat: Array.from({ length: 7 }, (_, i) => `<ellipse cx="${30 + i * 10}" cy="40" rx="12" ry="30" fill="none" stroke="${INK}" stroke-width="5"/>`).join(""),
    mur: `<path d="M60 8l30 16v32l-30 16l-30-16V24z" fill="${INK}"/><circle cx="60" cy="40" r="15" fill="#E2BE45"/><circle cx="60" cy="40" r="11" fill="none" stroke="${INK}" stroke-width="2" stroke-dasharray="4 3"/>`,
    paku: `<rect x="4" y="26" width="7" height="28" fill="${INK}"/><path d="M11 37h92l13 3l-13 3H11z" fill="${INK}"/>`,
    ring: `<circle cx="60" cy="40" r="32" fill="${INK}"/><circle cx="60" cy="40" r="15" fill="#E2BE45"/>`,
    skrup: `<path d="M4 22c12-6 18-6 22 0v36c-4 6-10 6-22 0z" fill="${INK}"/>${ulir(26, 40, 74, 12, 6)}<path d="M100 34l14 6l-14 6z" fill="${INK}"/>`,
    tali: `<path d="M6 40c12-22 24-22 36 0s24 22 36 0s24-22 36 0" fill="none" stroke="${INK}" stroke-width="10"/>`,
  };
  const pakai = (g) => `<svg viewBox="0 0 120 80" aria-hidden="true">${G[g]}</svg>`;

  const BUKU = [
    { h: "A", n: "Angkur beton", g: "angkur", ket: "Baja galvanis, untuk dinding bata dan cor.", kol: "isi", rows: [["M8 × 60", "50", 142], ["M10 × 75", "50", 205], ["M12 × 100", "25", 186], ["M16 × 125", "25", 340]] },
    { h: "B", n: "Baut hex", g: "hex", id: "B", ket: "Kelas 8.8, ulir penuh, galvanis.", rows: [["M6 × 30", "200", 118], ["M8 × 40", "100", 96], ["M10 × 50", "100", 164], ["M12 × 60", "50", 138], ["M14 × 70", "50", 212], ["M16 × 80", "25", 158], ["M20 × 100", "25", 305]] },
    { n: "Baut L", g: "allen", ket: "Kepala soket, kunci L, baja hitam 12.9.", rows: [["M3 × 12", "200", 74], ["M4 × 16", "200", 88], ["M5 × 20", "200", 110], ["M6 × 25", "100", 92], ["M8 × 35", "100", 148], ["M10 × 50", "50", 176]] },
    { h: "E", n: "Engsel pintu", g: "engsel", ket: "Tiga dan empat inci, ring kuningan.", rows: [["3 × 2 in", "12", 96], ["4 × 3 in", "12", 164], ["4 × 3 in, SUS 304", "12", 318], ["5 × 3 in, SUS 304", "6", 244]] },
    { h: "K", n: "Kawat bendrat", g: "kawat", ket: "Pengikat besi beton, gulungan 25 kg.", rows: [["BWG 21", "1 gul", 412], ["BWG 20", "1 gul", 398], ["BWG 18", "1 gul", 386]] },
    { h: "M", n: "Mata bor besi", g: "bor", ket: "HSS, batang lurus, satu dus isi 10.", rows: [["3 mm", "10", 41], ["4 mm", "10", 52], ["5 mm", "10", 64], ["6 mm", "10", 82], ["8 mm", "10", 131], ["10 mm", "10", 196]] },
    { n: "Mur hex", g: "mur", ket: "Pasangan baut kelas 8.8, galvanis.", rows: [["M6", "500", 86], ["M8", "300", 104], ["M10", "200", 118], ["M12", "100", 96], ["M14", "100", 152], ["M16", "50", 134], ["M20", "25", 145]] },
    { h: "P", n: "Paku beton", g: "paku", ket: "Baja keras, ujung tajam, per kilogram.", rows: [["1 in", "1 kg", 34], ["1,5 in", "1 kg", 32], ["2 in", "1 kg", 31], ["3 in", "1 kg", 31]] },
    { h: "R", n: "Ring plat", g: "ring", ket: "Tebal standar DIN 125, galvanis.", rows: [["M6", "500", 38], ["M8", "300", 41], ["M10", "200", 52], ["M12", "100", 46], ["M16", "50", 54], ["M20", "25", 63]] },
    { h: "S", n: "Sekrup gipsum", g: "skrup", ket: "Kepala terompet, ulir kasar, hitam.", rows: [["6 × 1 in", "1000", 68], ["6 × 1,25 in", "1000", 76], ["6 × 2 in", "500", 71], ["8 × 2,5 in", "500", 102]] },
    { h: "T", n: "Tali sling", g: "tali", ket: "Baja galvanis 6 × 19, per gulung 100 meter.", rows: [["4 mm", "100 m", 462], ["6 mm", "100 m", 738], ["8 mm", "100 m", 1120], ["10 mm", "100 m", 1684], ["12 mm", "100 m", 2310]] },
  ];
  const rp = (n) => "Rp " + (n * 1000).toLocaleString("id-ID");
  const $ = (id) => document.getElementById(id);

  // Render buku
  const huruf = [];
  BUKU.forEach((b, bi) => {
    b.rows.forEach((r, ri) => { r.key = bi + "-" + ri; });
    if (b.h) huruf.push(b.h);
  });
  function tabel(b) {
    return `<table data-ui><caption>${b.n}</caption><thead><tr><th scope="col">Ukuran</th><th scope="col">Isi dus</th><th scope="col">Harga dus</th><th scope="col"><span style="position:absolute;left:-9999px">Catat</span></th></tr></thead><tbody>${b.rows.map((r) => `<tr data-k="${r.key}" data-u="${r[0]}"><td>${r[0]}</td><td>${r[1]}</td><td>${rp(r[2]).replace("Rp ", "")}</td><td><button class="catat" type="button" aria-pressed="false" aria-label="Catat ${b.n} ${r[0]}">Catat</button></td></tr>`).join("")}</tbody></table>`;
  }
  $("buku").innerHTML = BUKU.map((b) => `<section class="entri" ${b.h ? `id="${b.h}"` : ""} data-nama="${b.n.toLowerCase()}">
    ${b.h ? `<p class="huruf" aria-hidden="true">${b.h}</p>` : ""}
    <div class="entri-top"><div><h2>${b.n}</h2><p class="ket">${b.ket}</p></div>${pakai(b.g)}</div>${tabel(b)}</section>`).join("") + `<p class="kosong" id="kosong" hidden>Barang itu belum ada di buku ini. Tulis ukurannya di daftar minta harga, kami carikan.</p>`;

  const tabs = $("tabs");
  tabs.innerHTML = huruf.map((h) => `<a href="#${h}" aria-label="Huruf ${h}">${h}</a>`).join("");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => {
      if (e.isIntersecting) [...tabs.children].forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
    }), { rootMargin: "-20% 0px -70% 0px" });
    document.querySelectorAll(".entri[id]").forEach((s) => io.observe(s));
  }

  // Sampul: satu baut besar dipotong tepi kertas
  const K = "#E2BE45", P = 8; // jarak ulir; gerak .putar sama persis satu jarak ulir supaya mengalir tanpa putus
  let puncak = "M48 26", lembah = "", miring = "";
  for (let i = 0; i < 22; i++) {
    puncak += `l${P / 2} -4l${P / 2} 4`;
    lembah = `l${-P / 2} 4l${-P / 2} -4` + lembah;
    miring += `M${48 + i * P + P / 2} 22l3 44`;
  }
  $("cover-art").innerHTML = `<svg viewBox="0 0 200 88">
    <path d="M4 6H36L40 11V77L36 82H4L0 77V11Z" fill="${INK}"/>
    <path d="M1 27H39M1 61H39" stroke="${K}" stroke-width="1.6" fill="none"/>
    <path d="M3 6.8Q9 16.5 3 27M3 27Q11 44 3 61M3 61Q9 71.5 3 81.2" stroke="${K}" stroke-width="1" fill="none"/>
    <rect x="40" y="15" width="4" height="58" fill="${INK}"/>
    <rect x="44" y="28" width="22" height="32" fill="${INK}"/>
    <clipPath id="batang"><rect x="64" y="18" width="136" height="52"/></clipPath>
    <g clip-path="url(#batang)"><g class="putar"><path d="${puncak}V62${lembah}Z" fill="${INK}"/><path d="${miring}" stroke="${K}" stroke-width="1.5" fill="none"/></g></g>
  </svg>`;

  // Cari
  const cari = $("cari");
  $("cari-form").addEventListener("submit", (e) => { e.preventDefault(); $("buku").scrollIntoView({ block: "start" }); });
  cari.addEventListener("input", () => {
    const q = cari.value.trim().toLowerCase().replace(/\s+/g, " ");
    let ada = 0;
    document.querySelectorAll(".entri").forEach((s) => {
      const nama = s.dataset.nama.includes(q);
      let kena = 0;
      s.querySelectorAll("tbody tr").forEach((tr) => {
        const u = tr.dataset.u.toLowerCase().includes(q);
        tr.hidden = q && !nama && !u;
        if (!tr.hidden) kena++;
      });
      s.hidden = q && !kena;
      if (!s.hidden) ada++;
    });
    $("kosong").hidden = !!ada;
  });

  // Pencocok ukuran: panjang fisik, memakai skala layar dalam px per mm
  const UK = [["M4", 4], ["M5", 5], ["M6", 6], ["M8", 8], ["M10", 10], ["M12", 12], ["M16", 16], ["M20", 20]];
  let simpan = null;
  try { simpan = parseFloat(localStorage.getItem("tigaulir-skala")); } catch (e) { /* tanpa penyimpanan */ }
  const skala = $("skala");
  if (simpan) skala.value = simpan;
  const dia = $("diameter");

  function ukur() {
    const [nama, mm] = UK[+dia.value];
    const px = +skala.value;
    const d = mm * px, w = 420, h = Math.max(240, d + 110);
    $("out-d").textContent = nama;
    $("ktp").style.width = (85.6 * px).toFixed(1) + "px";
    const tinggiKepala = d * 1.7, lebarKepala = d * .7, ky = h / 2 - tinggiKepala / 2, y = h / 2;
    $("ukur").innerHTML = `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
      <rect x="0" y="${ky}" width="${lebarKepala}" height="${tinggiKepala}" fill="${INK}"/>
      <rect x="${lebarKepala}" y="${y - d / 2}" width="${w}" height="${d}" fill="${INK}"/>
      <path d="M${lebarKepala + 12} ${y - d / 2 - 14}h${w}M${lebarKepala + 12} ${y + d / 2 + 14}h${w}" stroke="#A5281B" stroke-width="2"/>
      <text x="${lebarKepala + 14}" y="${y - d / 2 - 22}" fill="#111009" font-family="Epilogue" font-weight="500" font-size="17">${mm} mm, ukuran asli</text></svg>`;
    const a = $("ke-baris");
    a.textContent = `Buka baris ${nama}`;
    try { localStorage.setItem("tigaulir-skala", skala.value); } catch (e) { /* tanpa penyimpanan */ }
  }
  dia.addEventListener("input", ukur);
  skala.addEventListener("input", ukur);
  ukur();
  $("ke-baris").addEventListener("click", (e) => {
    e.preventDefault();
    const nama = UK[+dia.value][0];
    cari.value = ""; cari.dispatchEvent(new Event("input"));
    document.querySelectorAll("tr.hit").forEach((t) => t.classList.remove("hit"));
    const baris = [...document.querySelectorAll("#buku tbody tr")].filter((t) => t.dataset.u === nama || t.dataset.u.startsWith(nama + " "));
    baris.forEach((t) => t.classList.add("hit"));
    if (baris[0]) baris[0].scrollIntoView({ block: "center", behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
    else demoToast(`Ukuran ${nama} belum ada di buku ini. Tulis di daftar minta harga, kami carikan.`);
  });

  // Daftar minta harga
  const catat = {};
  const cariBaris = (k) => { for (const b of BUKU) for (const r of b.rows) if (r.key === k) return [b, r]; };
  function daftar() {
    const ks = Object.keys(catat);
    $("minta-kosong").hidden = !!ks.length;
    $("minta-list").innerHTML = ks.map((k) => {
      const [b, r] = cariBaris(k);
      return `<li><span>${b.n} ${r[0]}</span><span class="stepper"><button type="button" data-k="${k}" data-d="-1" aria-label="Kurangi ${b.n} ${r[0]}">−</button><span>${catat[k]}</span><button type="button" data-k="${k}" data-d="1" aria-label="Tambah ${b.n} ${r[0]}">+</button></span></li>`;
    }).join("");
    $("minta-total").textContent = rp(ks.reduce((s, k) => s + cariBaris(k)[1][2] * catat[k], 0));
    $("kirim").disabled = !ks.length;
    document.querySelectorAll(".catat").forEach((b) => {
      const on = !!catat[b.closest("tr").dataset.k];
      b.setAttribute("aria-pressed", String(on));
      b.textContent = on ? "Tercatat" : "Catat";
    });
  }
  $("buku").addEventListener("click", (e) => {
    const b = e.target.closest(".catat"); if (!b) return;
    const k = b.closest("tr").dataset.k;
    if (catat[k]) delete catat[k]; else catat[k] = 1;
    daftar();
  });
  $("minta-list").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const k = b.dataset.k;
    catat[k] = (catat[k] || 0) + +b.dataset.d;
    if (catat[k] < 1) delete catat[k];
    daftar();
  });
  $("kirim").addEventListener("click", () => {
    const isi = Object.keys(catat).map((k) => { const [b, r] = cariBaris(k); return `${catat[k]} dus ${b.n} ${r[0]}`; }).join(", ");
    demoToast(`Ini demo. Di versi asli, daftar ini terkirim ke WhatsApp toko: ${isi}.`);
  });

  // Masuk bertahap
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll(".edisi, .cover h1, .lead, .cover-low, .cocok h2, .cocok-kiri, .cocok-kanan, .entri, .minta h2, .minta-grid, .toko h2, .toko p").forEach((el, i) => { el.classList.add("rise"); el.style.setProperty("--d", (i % 4) * 70 + "ms"); seen.observe(el); });
})();
