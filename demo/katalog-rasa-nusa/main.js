// Rasa Nusa: cobek sebagai keranjang. Tambah produk, bahannya jatuh ke cobek, lalu diulek jadi sambal.
(function () {
  const PRODUCTS = [
    { id: "bawang", name: "Sambal Bawang", desc: "Bawang putih goreng dan cabai rawit. Cocok untuk ayam goreng dan tempe.", price: 25000, cat: "Sambal", pedas: 3, kata: "sedang", bahan: ["rawit", "bawang", "bawang", "rawit", "bawang"], warna: "#B8341F" },
    { id: "cumi", name: "Sambal Cumi", desc: "Cumi asin dan cabai merah. Pedas, sedikit asin.", price: 35000, cat: "Sambal", pedas: 4, kata: "pedas", bahan: ["cumi", "rawit", "cumi", "rawit", "cumi"], warna: "#A62A1B" },
    { id: "matah", name: "Sambal Matah", desc: "Irisan serai, bawang merah, dan daun jeruk. Segar, tidak digoreng.", price: 28000, cat: "Sambal", pedas: 2, kata: "segar", bahan: ["serai", "bawang", "daun", "serai", "rawit"], warna: "#C2682A" },
    { id: "teri", name: "Sambal Teri", desc: "Teri Medan goreng renyah dengan sambal manis pedas.", price: 30000, cat: "Sambal", pedas: 3, kata: "manis pedas", bahan: ["teri", "rawit", "teri", "teri", "rawit"], warna: "#9E3A1E" },
    { id: "roa", name: "Sambal Roa", desc: "Ikan roa asap dan cabai rawit, rasa khas Manado.", price: 38000, cat: "Sambal", pedas: 5, kata: "sangat pedas", bahan: ["roa", "rawit", "roa", "rawit", "rawit"], warna: "#8E2616" },
    { id: "trio", name: "Paket Trio", desc: "Bawang, Cumi, dan Matah. Hemat Rp 8rb.", price: 80000, cat: "Paket hemat", pedas: 0, bahan: ["bawang", "cumi", "serai", "rawit", "rawit", "daun"], warna: "#B23A20" },
    { id: "reseller", name: "Paket Reseller Pemula", desc: "12 botol campur, diskon 15%.", price: 300000, cat: "Paket hemat", pedas: 0, bahan: ["rawit", "bawang", "cumi", "serai", "teri", "roa", "rawit", "rawit"], warna: "#A62F1C" },
    { id: "kerupuk", name: "Kerupuk Kulit", desc: "Teman makan sambal, 100 g.", price: 15000, cat: "Pelengkap", pedas: 0, bahan: ["kerupuk", "kerupuk", "kerupuk"], warna: null },
  ];
  const $ = (id) => document.getElementById(id);
  const rp = (n) => "Rp " + n.toLocaleString("id-ID");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const cart = {};
  let cat = "Semua";

  /* ---------- Bahan digambar sendiri: dipakai di daftar dan di dalam cobek ---------- */
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
  function bahan(g, jenis, x, y, r, rot) {
    g.save(); g.translate(x, y); g.rotate(rot); g.lineCap = "round";
    if (jenis === "rawit") { g.fillStyle = "#D32F1F"; g.beginPath(); g.moveTo(-r, -r * .22); g.quadraticCurveTo(0, -r * .6, r, r * .12); g.quadraticCurveTo(0, r * .3, -r, r * .22); g.fill(); g.strokeStyle = "#6F9130"; g.lineWidth = r * .2; g.beginPath(); g.moveTo(-r, 0); g.lineTo(-r * 1.36, -r * .14); g.stroke(); }
    else if (jenis === "bawang") { g.fillStyle = "#EFE3C8"; g.beginPath(); g.arc(0, 0, r * .72, .4, Math.PI * 1.7); g.quadraticCurveTo(-r * .1, 0, r * .66, r * .28); g.fill(); g.strokeStyle = "#C98F73"; g.lineWidth = r * .08; g.beginPath(); g.arc(0, 0, r * .72, .4, Math.PI * 1.7); g.stroke(); }
    else if (jenis === "cumi") { g.strokeStyle = "#EAD9BE"; g.lineWidth = r * .3; g.beginPath(); g.ellipse(0, 0, r * .72, r * .52, 0, 0, 7); g.stroke(); }
    else if (jenis === "serai") { g.strokeStyle = "#A9BE62"; g.lineWidth = r * .18; g.beginPath(); g.arc(0, 0, r * .6, 0, 7); g.stroke(); g.fillStyle = "#DDE3A8"; g.beginPath(); g.arc(0, 0, r * .36, 0, 7); g.fill(); }
    else if (jenis === "daun") { g.fillStyle = "#4F7A2C"; g.beginPath(); g.moveTo(-r, 0); g.quadraticCurveTo(0, -r * .7, r, 0); g.quadraticCurveTo(0, r * .7, -r, 0); g.fill(); g.strokeStyle = "#7FA34A"; g.lineWidth = r * .07; g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.stroke(); }
    else if (jenis === "teri") { g.fillStyle = "#C9BFA8"; g.beginPath(); g.moveTo(-r, 0); g.quadraticCurveTo(0, -r * .34, r * .8, 0); g.quadraticCurveTo(0, r * .34, -r, 0); g.fill(); g.beginPath(); g.moveTo(r * .7, 0); g.lineTo(r * 1.1, -r * .26); g.lineTo(r * 1.1, r * .26); g.fill(); g.fillStyle = "#2B2620"; g.beginPath(); g.arc(-r * .66, -r * .03, r * .07, 0, 7); g.fill(); }
    else if (jenis === "roa") { g.fillStyle = "#6E4326"; g.beginPath(); g.moveTo(-r * .8, -r * .3); g.lineTo(r * .5, -r * .52); g.lineTo(r * .86, r * .1); g.lineTo(-r * .2, r * .5); g.closePath(); g.fill(); g.strokeStyle = "#3E2413"; g.lineWidth = r * .08; g.beginPath(); g.moveTo(-r * .5, -r * .1); g.lineTo(r * .5, r * .05); g.stroke(); }
    else { const n = seeded(Math.round(r * 91) + 7); g.fillStyle = "#E8C98E"; g.beginPath(); for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283, q = r * (.72 + n() * .3); g[i ? "lineTo" : "moveTo"](Math.cos(a) * q, Math.sin(a) * q * .8); } g.closePath(); g.fill(); g.fillStyle = "#C79F5E"; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc((n() - .5) * r, (n() - .5) * r * .7, r * .06, 0, 7); g.fill(); } }
    g.restore();
  }
  function lukisBahan(c, p) {
    const g = c.getContext("2d"), rnd = seeded(p.id.length * 311 + p.price % 977), S = c.width;
    p.bahan.forEach((b, i) => { const a = i / p.bahan.length * 6.283 + rnd(), q = S * (.12 + rnd() * .17); bahan(g, b, S / 2 + Math.cos(a) * q, S / 2 + Math.sin(a) * q, S * .18, rnd() * 6.283); });
  }

  /* ---------- Logo: cobek dengan jejak ulekan ---------- */
  (() => {
    const P = (r, a) => [+(100 + r * Math.cos(a * Math.PI / 180)).toFixed(2), +(100 + r * Math.sin(a * Math.PI / 180)).toFixed(2)];
    const rnd = seeded(4711); let tepi = "", jejak = "";
    for (let i = 0; i < 44; i++) { const [x, y] = P(94 + (rnd() - .5) * 9, 360 / 44 * i); tepi += `${i ? "L" : "M"}${x} ${y}`; }
    const langkah = 73; for (let i = 0; i <= langkah; i++) { const t = i / langkah, [x, y] = P(8 + 64 * t, 40 + t * 936); jejak += `${i ? "L" : "M"}${x} ${y}`; }
    $("logo").innerHTML = `<mask id="m"><rect width="200" height="200" fill="#fff"/><path d="${jejak}" fill="none" stroke="#000" stroke-width="13" stroke-linecap="round" stroke-linejoin="round"/></mask><path d="${tepi}Z" mask="url(#m)"/>`;
  })();

  /* ---------- Cobek ---------- */
  const kanvas = $("cobek"), g = kanvas.getContext("2d"), N = 1400, C = N / 2, K = N / 640;
  const muatGambar = (f) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = f; });
  let batu = null, alu = null;
  let naik = 0, naikSampai = 0, isi = 0, tujuanIsi = 0, warna = [190, 50, 30], putar = 0, giling = 0, lalu = 0;
  const potong = [];
  const hex = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  function sambal() {
    if (isi < .01) return;
    const rad = (58 + 148 * Math.sqrt(Math.min(1, isi))) * K, rnd = seeded(913);
    g.save();
    g.fillStyle = `rgb(${warna.map(Math.round).join()})`; g.beginPath();
    for (let i = 0; i <= 90; i++) { const a = i / 90 * 6.283, q = rad * (1 + Math.sin(a * 5 + 1) * .03 + Math.sin(a * 11) * .02 + Math.sin(a * 23) * .008); g[i ? "lineTo" : "moveTo"](C + Math.cos(a) * q, C + Math.sin(a) * q); }
    g.closePath(); g.fill(); g.clip();
    const sinar = g.createRadialGradient(C - rad * .35, C - rad * .4, rad * .05, C, C, rad * 1.05);
    sinar.addColorStop(0, "rgba(255,190,130,.34)"); sinar.addColorStop(.55, "rgba(255,120,70,.04)"); sinar.addColorStop(1, "rgba(30,0,0,.5)");
    g.fillStyle = sinar; g.fillRect(C - rad, C - rad, rad * 2, rad * 2);
    for (let i = 0; i < 520; i++) { const a = rnd() * 6.283, q = Math.sqrt(rnd()) * rad * .97, w = i % 7 ? "rgba(60,8,4,.34)" : i % 3 ? "#E7BE74" : "rgba(255,190,140,.55)"; g.fillStyle = w; g.beginPath(); g.ellipse(C + Math.cos(a) * q, C + Math.sin(a) * q, (1.5 + rnd() * 3.6) * K * .55, (1.2 + rnd() * 2.2) * K * .55, rnd() * 3, 0, 7); g.fill(); }
    g.restore();
  }
  function ulekan(x, y) {
    if (!alu) return;
    const ke = Math.atan2(y - C, x - C), s = K * .5;
    const bx = x + 16 * K, by = y + 22 * K, b = g.createRadialGradient(bx, by, 10, bx, by, 96 * K);
    b.addColorStop(0, "rgba(0,0,0,.5)"); b.addColorStop(.6, "rgba(0,0,0,.24)"); b.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = b; g.beginPath(); g.arc(bx, by, 96 * K, 0, 7); g.fill();
    g.save(); g.translate(x, y); g.rotate(ke); g.drawImage(alu, -140 * s, -210 * s, 640 * s, 420 * s); g.restore();
  }
  function gambar(t) {
    g.clearRect(0, 0, N, N); if (batu) g.drawImage(batu, 0, 0, N, N); sambal();
    for (let i = potong.length - 1; i >= 0; i--) {
      const p = potong[i], u = (t - p.t0) / 1000;
      if (u < 0) continue;
      const jatuh = Math.min(1, u / .32), hancur = Math.max(0, (u - 1) / .9);
      if (hancur >= 1) { potong.splice(i, 1); continue; }
      const sk = (1.9 - jatuh * .9) * (1 - hancur);
      g.globalAlpha = Math.min(1, jatuh * 2) * (1 - hancur * .5);
      bahan(g, p.jenis, p.x, p.y, 36 * K * sk, p.rot + hancur * 3);
    }
    g.globalAlpha = 1;
    const q = (54 + Math.sin(putar * .37) * 30) * K;
    ulekan(C + Math.cos(putar) * q, C + Math.sin(putar) * q);
  }
  function jalan(t) {
    const dt = Math.min(.05, (t - lalu) / 1000 || 0); lalu = t;
    giling = potong.length ? 1 : Math.max(0, giling - dt * 1.4);
    putar += dt * (.5 + giling * 7);
    isi += (tujuanIsi - isi) * Math.min(1, dt * 1.6);
    const tujuanNaik = t < naikSampai ? 1 : 0;
    if (Math.abs(tujuanNaik - naik) > .002) { naik += (tujuanNaik - naik) * Math.min(1, dt * 7); letak(); }
    if (!document.hidden) gambar(t);
    requestAnimationFrame(jalan);
  }
  function masukCobek(p) {
    const rnd = Math.random, now = performance.now();
    p.bahan.forEach((b, i) => { const a = rnd() * 6.283, q = (50 + rnd() * 125) * K; potong.push({ jenis: b, x: C + Math.cos(a) * q, y: C + Math.sin(a) * q, rot: rnd() * 6.283, t0: now + i * 90 }); });
    if (p.warna) { const w = hex(p.warna); warna = warna.map((v, i) => v * .55 + w[i] * .45); }
    naikSampai = now + 2300 + p.bahan.length * 90; // cobek naik sebentar supaya bahan yang diulek terlihat
    if (reduce) { potong.length = 0; }
  }

  /* ---------- Letak cobek: sampul ke parkir ---------- */
  const tempat = $("tempat"), hero = document.querySelector(".hero"), kasir = $("cart");
  function ukurD() {
    const vw = innerWidth, vh = innerHeight, hp = vw <= 860, bar = document.querySelector(".demo-bar")?.offsetHeight || 56;
    const D = Math.round(hp ? Math.min(vw * .78, (vh - bar) * .4) : Math.min((vh - bar - 76) * .92, vw * .36));
    document.documentElement.style.setProperty("--d", D + "px");
    document.documentElement.style.setProperty("--bar", bar + "px");
    return D;
  }
  let D = ukurD();
  function letak() {
    const vw = innerWidth, vh = innerHeight, k = tempat.getBoundingClientRect();
    const raw = Math.min(1, Math.max(0, scrollY / (hero.offsetHeight * .72))), u = raw * raw * (3 - 2 * raw);
    const lebarParkir = Math.min(250, vw * .54), skalaAkhir = lebarParkir / D;
    const dX = vw / 2, dY = vh - kasir.offsetHeight - 58 - naik * (lebarParkir * .76 - 58) + lebarParkir / 2;
    const hX = k.left + k.width / 2, hY = k.top + k.height / 2;
    const s = 1 + (skalaAkhir - 1) * u, x = hX + (dX - hX) * u, y = hY + (dY - hY) * u;
    kanvas.style.transform = `translate3d(${(x - D * s / 2).toFixed(1)}px, ${(y - D * s / 2).toFixed(1)}px, 0) scale(${s.toFixed(4)})`;
    kasir.classList.toggle("on", raw > .55);
  }
  addEventListener("scroll", letak, { passive: true });
  addEventListener("resize", () => { D = ukurD(); letak(); });
  if (document.fonts?.ready) document.fonts.ready.then(letak);

  /* ---------- Katalog ---------- */
  const chips = $("chips");
  ["Semua", ...new Set(PRODUCTS.map((p) => p.cat))].forEach((c) => {
    const b = document.createElement("button");
    b.type = "button"; b.textContent = c; b.setAttribute("aria-pressed", String(c === cat));
    b.onclick = () => { cat = c; [...chips.children].forEach((x) => x.setAttribute("aria-pressed", String(x === b))); saring(); };
    chips.appendChild(b);
  });
  const grid = $("grid");
  PRODUCTS.forEach((p) => {
    const li = document.createElement("li");
    li.className = "barang"; li.dataset.id = p.id;
    const cabai = p.pedas ? `<p class="pedas" aria-label="Pedas ${p.pedas} dari 5">${[1, 2, 3, 4, 5].map((i) => `<i class="${i <= p.pedas ? "on" : ""}"></i>`).join("")}<span>${p.kata}</span></p>` : "";
    li.innerHTML = `<canvas width="224" height="224" aria-hidden="true"></canvas><div><h3>${p.name}</h3><p>${p.desc}</p>${cabai}</div><b class="harga">${rp(p.price)}</b><div class="jumlah"><button class="minus" type="button" aria-label="Kurangi ${p.name}">−</button><span aria-live="polite">0</span><button class="plus" type="button" aria-label="Tambah ${p.name}">+</button></div>`;
    lukisBahan(li.querySelector("canvas"), p);
    li.querySelector(".plus").onclick = () => { cart[p.id] = (cart[p.id] || 0) + 1; masukCobek(p); hitung(); };
    li.querySelector(".minus").onclick = () => { if (!cart[p.id]) return; cart[p.id]--; if (!cart[p.id]) delete cart[p.id]; hitung(); };
    grid.appendChild(li);
  });
  function saring() {
    const q = $("q").value.trim().toLowerCase(); let n = 0;
    [...grid.children].forEach((li) => { const p = PRODUCTS.find((x) => x.id === li.dataset.id), ok = (cat === "Semua" || p.cat === cat) && (!q || (p.name + " " + p.desc).toLowerCase().includes(q)); li.hidden = !ok; if (ok) n++; });
    $("kosong").hidden = n > 0;
  }
  $("q").addEventListener("input", saring);
  function hitung() {
    const ids = Object.keys(cart), jumlah = ids.reduce((s, id) => s + cart[id], 0), total = ids.reduce((s, id) => s + cart[id] * PRODUCTS.find((p) => p.id === id).price, 0);
    [...grid.children].forEach((li) => { li.querySelector(".jumlah span").textContent = cart[li.dataset.id] || 0; });
    $("cart-count").textContent = jumlah ? `${jumlah} barang di cobek` : "Cobek masih kosong";
    $("cart-total").textContent = rp(total);
    $("checkout").disabled = !jumlah;
    tujuanIsi = Math.min(1, ids.reduce((s, id) => s + (PRODUCTS.find((p) => p.id === id).warna ? cart[id] : 0), 0) / 6);
    if (reduce) { isi = tujuanIsi; gambar(performance.now()); }
  }
  $("checkout").onclick = () => {
    const baris = Object.keys(cart).map((id) => `${cart[id]}x ${PRODUCTS.find((x) => x.id === id).name}`);
    demoToast(`Ini demo. Di versi asli, pesanan (${baris.join(", ")}) langsung terkirim ke WhatsApp toko.`);
  };

  // Tanggal kirim: pesanan sesudah 20.00 masuk hari berikutnya (WIB)
  (() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" })), lewat = d.getHours() >= 20;
    d.setDate(d.getDate() + (lewat ? 2 : 1));
    $("kirim").textContent = `${lewat ? "Pesanan hari ini sudah tutup. Pesan sekarang" : "Pesan sampai 20.00"}, dikirim ${d.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" })}.`;
  })();

  letak();
  Promise.all([muatGambar("cobek.webp"), muatGambar("ulekan.webp")]).then(([a, b]) => { batu = a; alu = b; if (reduce) gambar(0); else requestAnimationFrame(jalan); });
})();
