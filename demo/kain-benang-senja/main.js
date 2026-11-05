// Benang Senja: tenun polos digambar per helai benang di kanvas (lusi, pakan, slub, naik-turun anyaman).
(function () {
  const C = { kr: "#E7D9C0", in: "#1F2A44", ib: "#2F4466", so: "#6B4226", hi: "#17161A", me: "#7D2A2E", ku: "#C89B3C", ab: "#8C8A82", hj: "#4C5A3E", bt: "#9A9486" };
  // Setiap kain: lusi = urutan [warna, jumlah helai]; pakan = warna atau urutan, untuk motif kotak.
  const KAIN = [
    { k: "BS-01", n: "Telupat", d: "Garis tiga dan empat helai, soga di atas indigo.", h: 78, s: 34, lusi: [["in", 14], ["so", 3], ["in", 3], ["so", 3], ["in", 3], ["so", 3], ["in", 14], ["so", 4], ["in", 2], ["so", 4], ["in", 2], ["so", 4], ["in", 2], ["so", 4]], pakan: "in" },
    { k: "BS-02", n: "Tumbar pecah", d: "Kotak kecil seperti ketumbar pecah, hitam dan krem.", h: 72, s: 21, lusi: [["hi", 4], ["kr", 2]], pakan: [["hi", 4], ["kr", 2]] },
    { k: "BS-03", n: "Kluwung", d: "Pelangi Jawa: tujuh warna tenang di dasar hitam.", h: 92, s: 12, lusi: [["hi", 26], ["me", 5], ["so", 5], ["ku", 5], ["hj", 5], ["ib", 5], ["in", 5], ["bt", 5]], pakan: "hi" },
    { k: "BS-04", n: "Yuyu sekandang", d: "Kotak besar sekandang kepiting, indigo dan krem.", h: 84, s: 26, lusi: [["in", 22], ["kr", 3], ["in", 3], ["kr", 3], ["in", 3], ["kr", 3]], pakan: [["in", 22], ["kr", 3], ["in", 3], ["kr", 3], ["in", 3], ["kr", 3]] },
    { k: "BS-05", n: "Sapit urang", d: "Garis berpasangan seperti capit udang, merah bata.", h: 76, s: 41, lusi: [["me", 18], ["kr", 2], ["me", 2], ["kr", 2], ["me", 8], ["kr", 2], ["me", 2], ["kr", 2]], pakan: "me" },
    { k: "BS-06", n: "Lompong keli", d: "Garis lebar soga dan hijau daun, hanyut tidak beraturan.", h: 68, s: 29, lusi: [["so", 20], ["hj", 7], ["so", 5], ["hj", 3], ["so", 12], ["hj", 12], ["so", 3], ["hj", 3]], pakan: "so" },
    { k: "BS-07", n: "Liwatan", d: "Garis krem kurus melintasi dasar abu tua.", h: 64, s: 52, lusi: [["bt", 16], ["kr", 2]], pakan: "ab" },
    { k: "BS-08", n: "Jaran dawuk", d: "Abu kuda dawuk, lusi hitam dan pakan krem.", h: 66, s: 47, lusi: [["hi", 1], ["bt", 1]], pakan: "kr" },
    { k: "BS-09", n: "Kijing miring", d: "Garis kunyit jarang di dasar indigo muda.", h: 74, s: 18, lusi: [["ib", 24], ["ku", 3], ["ib", 6], ["ku", 1]], pakan: "ib" },
    { k: "BS-10", n: "Bribil", d: "Bintik halus dari lusi dan pakan selang-seling.", h: 70, s: 38, lusi: [["so", 2], ["kr", 2]], pakan: [["so", 2], ["kr", 2]] },
    { k: "BS-11", n: "Tuluh watu", d: "Garis tebal hitam dan merah, kain paling berat di buku ini.", h: 88, s: 16, lusi: [["hi", 10], ["me", 10], ["hi", 3], ["kr", 1], ["hi", 3]], pakan: "hi" },
    { k: "BS-12", n: "Kembang mindi", d: "Kotak jarang kunyit di dasar krem, untuk blus siang.", h: 76, s: 23, lusi: [["kr", 20], ["ku", 2], ["kr", 2], ["ku", 2]], pakan: [["kr", 20], ["so", 2], ["kr", 2], ["so", 2]] },
  ];
  const rgb = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const urut = (spec, n, seed) => {
    if (typeof spec === "string") return Array(n).fill(rgb(C[spec]));
    const one = spec.flatMap(([c, k]) => Array(k).fill(rgb(C[c])));
    const a = []; const start = seed % one.length;
    for (let i = 0; i < n; i++) a.push(one[(i + start) % one.length]);
    return a;
  };

  function tenun(ctx, w, h, kain, t, idx) {
    let s = (idx + 3) * 48271;
    const r = () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
    const nx = Math.ceil(w / t), ny = Math.ceil(h / t);
    const lusi = urut(kain.lusi, nx, idx * 5), pakan = urut(kain.pakan, ny, idx * 3);
    // Slub: tiap helai punya kecerahan sendiri, sesekali helai lebih tebal
    const gl = Array.from({ length: nx }, () => .9 + r() * .2), gp = Array.from({ length: ny }, () => .9 + r() * .2);
    const slub = Array.from({ length: ny }, () => (r() < .05 ? 1.1 + r() * .14 : 1));
    const img = ctx.createImageData(w, h), d = img.data;
    const c1 = Math.max(1, t - 1);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const naik = (i + j) % 2 === 0; // lusi di atas pada sel genap
      const base = naik ? lusi[i] : pakan[j];
      const g = (naik ? gl[i] : gp[j] * slub[j]) * (.95 + r() * .1);
      for (let y = 0; y < t; y++) for (let x = 0; x < t; x++) {
        const px = i * t + x, py = j * t + y;
        if (px >= w || py >= h) continue;
        // bentuk bulat helai: terang di tengah, gelap di tepi tempat benang menukik
        const u = naik ? x / c1 : y / c1, v = naik ? y / c1 : x / c1;
        const sh = .66 + .44 * Math.sin(Math.PI * u) * (.55 + .45 * Math.sin(Math.PI * v));
        const o = (py * w + px) * 4;
        d[o] = Math.min(255, base[0] * g * sh); d[o + 1] = Math.min(255, base[1] * g * sh); d[o + 2] = Math.min(255, base[2] * g * sh); d[o + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }
  // Tepi gunting zigzag untuk potongan contoh
  const zigzag = (w, h, g) => {
    const p = [];
    for (let x = 0; x <= w - g; x += g) p.push(`${x}px ${g / 2}px`, `${x + g / 2}px 0`);
    p.push(`${w - g / 2}px ${g / 2}px`);
    for (let y = g / 2; y <= h - g; y += g) p.push(`${w}px ${y + g / 2}px`, `${w - g / 2}px ${y + g}px`);
    for (let x = w; x >= g; x -= g) p.push(`${x}px ${h}px`, `${x - g / 2}px ${h - g / 2}px`);
    for (let y = h; y >= g; y -= g) p.push(`0 ${y - g / 2}px`, `${g / 2}px ${y - g}px`);
    return `polygon(${p.join(",")})`;
  };

  const $ = (id) => document.getElementById(id);
  const rp = (n) => "Rp " + (n * 1000).toLocaleString("id-ID");
  const fmt = (n) => n.toLocaleString("id-ID", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const stage = $("kain"), sctx = stage.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Potongan contoh tiap lembar
  const kecil = document.createElement("canvas"); kecil.width = 224; kecil.height = 172;
  const kctx = kecil.getContext("2d");
  $("daftar").innerHTML = KAIN.map((k, i) => {
    tenun(kctx, 224, 172, k, 2, i);
    return `<li><button type="button" data-i="${i}" aria-pressed="false"><i style="background-image:url(${kecil.toDataURL("image/webp", .8)})" data-z></i><b>${k.n}</b><em>${rp(k.h).replace(",00", "")}/m</em><span>${k.k}. ${k.d} Sisa ${k.s} meter.</span></button></li>`;
  }).join("");
  const zw = () => {
    document.querySelectorAll("[data-z]").forEach((el) => { const b = el.getBoundingClientRect(); if (b.width) el.style.clipPath = zigzag(b.width, b.height, 8); });
  };
  zw(); addEventListener("resize", zw);

  // Model baju: siluet, isi meter per ukuran
  const SIL = {
    Kemeja: "M72 18 L100 30 L128 18 L150 28 L192 86 L166 106 L146 84 L146 244 L54 244 L54 84 L34 106 L8 86 L50 28 Z",
    Blus: "M74 20 L100 42 L126 20 L146 30 L174 74 L152 88 L142 76 L156 214 L44 214 L58 76 L48 88 L26 74 L54 30 Z",
    Outer: "M70 16 L92 24 L96 250 L40 250 L46 90 L34 118 L10 106 L44 28 Z M130 16 L108 24 L104 250 L160 250 L154 90 L166 118 L190 106 L156 28 Z",
    Rok: "M66 28 H134 L178 240 Q100 256 22 240 Z",
    Terusan: "M76 14 L100 34 L124 14 L136 22 L134 84 L126 112 L174 250 Q100 266 26 250 L74 112 L66 84 L64 22 Z",
  };
  const MODEL = { Kemeja: [1.8, 2.0, 2.2, 2.5], Blus: [1.6, 1.8, 2.0, 2.2], Outer: [2.1, 2.4, 2.7, 3.0], Rok: [1.4, 1.6, 1.8, 2.0], Terusan: [2.8, 3.2, 3.6, 4.0] };
  const UK = ["S", "M", "L", "XL"];
  const st = { kain: 0, model: "Kemeja", uk: 1 };

  $("model").innerHTML = Object.keys(MODEL).map((m, i) => `<button type="button" role="radio" aria-checked="false" data-m="${m}"><svg viewBox="0 0 200 262" aria-hidden="true"><clipPath id="sil${i}"><path d="${SIL[m]}"/></clipPath><image width="200" height="262" preserveAspectRatio="xMidYMid slice" clip-path="url(#sil${i})"/></svg>${m}</button>`).join("");
  $("ukuran").innerHTML = UK.map((u, i) => `<button type="button" role="radio" aria-checked="false" data-u="${i}">${u}</button>`).join("");
  $("tabel").insertAdjacentHTML("beforeend", `<thead><tr><th scope="col">Model</th>${UK.map((u) => `<th scope="col">${u}</th>`).join("")}</tr></thead><tbody>${Object.entries(MODEL).map(([m, a]) => `<tr><th scope="row">${m}</th>${a.map((v) => `<td>${fmt(v)}</td>`).join("")}</tr>`).join("")}</tbody>`);

  const pola = document.createElement("canvas"); pola.width = 400; pola.height = 524;
  const pctx = pola.getContext("2d");

  function gantiKain(i, awal) {
    st.kain = i;
    const k = KAIN[i];
    const lukis = () => {
      tenun(sctx, 760, 1000, k, 5, i);
      $("kain").setAttribute("aria-label", `Tenun lurik ${k.n}, dilihat dari dekat`);
      $("cap").textContent = `${k.k} ${k.n}, ${rp(k.h)}/m`;
      tenun(pctx, 400, 524, k, 2, i);
      const url = pola.toDataURL("image/webp", .8);
      document.querySelectorAll("#model image").forEach((im) => im.setAttribute("href", url));
      hasil();
    };
    document.querySelectorAll("#daftar button").forEach((b) => b.setAttribute("aria-pressed", String(+b.dataset.i === i)));
    const box = stage.parentElement;
    if (awal || reduce) return lukis();
    box.classList.add("ganti");
    setTimeout(() => { lukis(); box.classList.remove("ganti"); }, 200);
  }
  function hasil() {
    const k = KAIN[st.kain], m = MODEL[st.model][st.uk], tot = Math.round(m * k.h);
    document.querySelectorAll("#model button").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.m === st.model)));
    document.querySelectorAll("#ukuran button").forEach((b) => b.setAttribute("aria-checked", String(+b.dataset.u === st.uk)));
    $("meter").textContent = `${fmt(m)} meter`;
    $("hitung").textContent = `${st.model} ${UK[st.uk]} dari ${k.n}: ${rp(tot)}. Sisa kain ${k.s} meter, cukup untuk ${Math.floor(k.s / m)} potong.`;
  }
  $("daftar").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) gantiKain(+b.dataset.i); });
  $("model").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { st.model = b.dataset.m; hasil(); } });
  $("ukuran").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) { st.uk = +b.dataset.u; hasil(); } });
  $("pesan").addEventListener("click", () => {
    const k = KAIN[st.kain];
    demoToast(`Ini demo. Di versi asli, pesanan ${fmt(MODEL[st.model][st.uk])} meter ${k.n} terkirim ke WhatsApp butik.`);
  });
  gantiKain(0, true);

  if (reduce || !("IntersectionObserver" in window)) return;
  const seen = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); seen.unobserve(e.target); } }), { rootMargin: "0px 0px -6% 0px" });
  document.querySelectorAll("h1, .lead, .head .btn, section h2, .sub, .lembar li, .model, .ukuran, .hasil, table, .baris").forEach((el, i) => { el.classList.add("rise"); el.style.setProperty("--d", (i % 4) * 70 + "ms"); seen.observe(el); });
})();
