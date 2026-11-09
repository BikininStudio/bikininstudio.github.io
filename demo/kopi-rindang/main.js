// Kopi Rindang: denah teras. Bayangan empat pohon bergeser mengikuti jam, kursi teduh dihitung dari kanopi yang sama.
(function () {
  const $ = (id) => document.getElementById(id);
  const kanvas = $("denah"), g = kanvas.getContext("2d"), W = 1400, H = 900, DINDING = 950;
  const TEPI = 300, KW = 2000, KH = 1500; // masker kanopi lebih besar dari denah, supaya bayangan tidak terpotong saat digeser
  const POHON = [[205, 150], [690, 110], [330, 790], [820, 800]];
  const LAMPU = [[120, 280], [340, 200], [560, 210], [780, 240], [150, 560], [420, 480], [640, 500], [860, 560]];

  // Lima meja teras, dua meja dan satu meja bar di dalam: 15 + 12 = 27 kursi
  const MEJA = [
    { no: 1, x: 170, y: 400 }, { no: 2, x: 470, y: 300 }, { no: 3, x: 800, y: 380, colokan: true }, { no: 4, x: 240, y: 610 }, { no: 5, x: 610, y: 620 },
    { no: 6, x: 1075, y: 230, dalam: true }, { no: 7, x: 1075, y: 650, dalam: true },
  ];
  const KURSI = [];
  MEJA.forEach((m) => { for (let i = 0; i < 3; i++) { const a = i / 3 * 6.283 - 1.2; KURSI.push({ x: m.x + Math.cos(a) * 72, y: m.y + Math.sin(a) * 72, meja: m, dalam: !!m.dalam, colokan: !!m.colokan }); } });
  for (let i = 0; i < 6; i++) KURSI.push({ x: 1262, y: 145 + i * 122, meja: { no: "bar", dalam: true }, dalam: true, colokan: true, bar: true });

  const jam = $("jam"), colokan = $("colokan");
  let lantai, tinggi, data = null;
  const muat = (f) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => ok(null); i.src = f; });

  const fmt = (h) => { const j = Math.floor(h), m = Math.round((h - j) * 60); return `${String(j).padStart(2, "0")}.${String(m).padStart(2, "0")}`; };
  const wib = () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
  const jamBuka = (d) => ([0, 6].includes(d.getDay()) ? [7, 23] : [8, 22]);
  const hari = wib();

  // Matahari dari timur pagi hari, jadi bayangan jatuh ke barat (kiri denah), lalu berbalik sore hari
  const geser = (h) => { const t = (h - 12.2) / 6; return { x: -t * 210, y: 24 + Math.abs(t) * 46 }; };
  const malam = (h) => h >= 18.25;

  function teduh(k, h) {
    if (k.dalam || malam(h) || !data) return true;
    const s = geser(h); let n = 0;
    for (const [dx, dy] of [[0, 0], [10, 0], [-10, 0], [0, 10], [0, -10]]) {
      const x = Math.round(k.x - s.x + dx) + TEPI, y = Math.round(k.y - s.y + dy) + TEPI;
      if (x < 0 || y < 0 || x >= KW || y >= KH) continue;
      if (data[(y * KW + x) * 4] > 110) n++;
    }
    return n >= 2;
  }

  function gambar() {
    const h = +jam.value, s = geser(h), gelap = malam(h);
    const [buka, tutup] = jamBuka(hari);
    g.clearRect(0, 0, W, H);
    if (lantai) g.drawImage(lantai, 0, 0, W, H);

    // Bayangan pohon hanya di teras
    if (tinggi && !gelap) {
      const redup = Math.max(0, Math.min(1, (18.25 - h) / 1));
      g.save(); g.beginPath(); g.rect(0, 0, DINDING - 11, H); g.clip();
      g.globalAlpha = .72 * redup; g.globalCompositeOperation = "multiply";
      g.drawImage(tinggi, s.x - TEPI, s.y - TEPI); g.restore();
    }
    // Atap ruang dalam
    g.fillStyle = gelap ? "rgba(10,18,14,.2)" : "rgba(24,34,28,.26)"; g.fillRect(DINDING + 11, 0, W, H);

    // Meja dan meja bar
    g.fillStyle = "#6E4A2C"; g.fillRect(1310, 70, 62, 760);
    MEJA.forEach((m) => {
      g.fillStyle = "rgba(0,0,0,.28)"; g.beginPath(); g.arc(m.x + 6, m.y + 8, 42, 0, 7); g.fill();
      g.fillStyle = "#E8D9BC"; g.beginPath(); g.arc(m.x, m.y, 42, 0, 7); g.fill();
      g.fillStyle = "#1E3226"; g.font = "400 38px 'Young Serif', serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(m.no, m.x, m.y + 2);
    });

    // Malam: lantai redup, lampu teras menyala
    if (gelap) {
      g.fillStyle = "rgba(12,24,20,.6)"; g.fillRect(0, 0, W, H);
      g.save(); g.globalCompositeOperation = "lighter";
      LAMPU.forEach(([x, y]) => { const r = g.createRadialGradient(x, y, 4, x, y, 170); r.addColorStop(0, "rgba(255,206,130,.42)"); r.addColorStop(1, "rgba(255,206,130,0)"); g.fillStyle = r; g.fillRect(x - 170, y - 170, 340, 340); });
      g.restore();
      g.fillStyle = "#FFE2A6"; LAMPU.forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 6, 0, 7); g.fill(); });
    }

    // Kursi
    const pilih = colokan.checked;
    KURSI.forEach((k) => {
      const ada = teduh(k, h);
      g.globalAlpha = pilih && !k.colokan ? .25 : 1;
      g.fillStyle = "rgba(0,0,0,.3)"; g.beginPath(); g.arc(k.x + 3, k.y + 5, 24, 0, 7); g.fill();
      g.fillStyle = ada ? "#3E5C49" : "#E5B84B"; g.beginPath(); g.arc(k.x, k.y, 24, 0, 7); g.fill();
      g.lineWidth = k.colokan ? 8 : 3; g.strokeStyle = "#F7F1E3"; g.stroke();
      g.globalAlpha = 1;
    });

    // Pohon: batang di tengah bak tanaman
    POHON.forEach(([x, y]) => { g.fillStyle = "#4A3322"; g.beginPath(); g.arc(x, y, 26, 0, 7); g.fill(); g.strokeStyle = "#2E1F14"; g.lineWidth = 4; g.stroke(); });

    if (h < buka || h > tutup) { g.fillStyle = "rgba(30,50,38,.58)"; g.fillRect(0, 0, W, H); }
    catat(h, buka, tutup);
  }

  function catat(h, buka, tutup) {
    $("label-jam").textContent = fmt(h);
    const st = $("status"), sa = $("saran");
    if (h < buka || h > tutup) { st.textContent = `Jam ${fmt(h)} kami belum atau sudah tutup.`; sa.textContent = `Hari ini buka ${fmt(buka)} sampai ${fmt(tutup)}.`; return; }
    if (malam(h)) { st.textContent = `Jam ${fmt(h)} semua kursi adem. Lampu teras sudah menyala.`; sa.textContent = colokan.checked ? "Colokan ada di meja bar dan Meja 3." : "Meja 2 paling dekat lampu."; return; }
    const teras = KURSI.filter((k) => !k.dalam), adem = teras.filter((k) => teduh(k, h)).length;
    st.textContent = `Jam ${fmt(h)}, ${adem} dari ${teras.length} kursi teras teduh.`;
    const skor = MEJA.filter((m) => !m.dalam).map((m) => [KURSI.filter((k) => k.meja === m && teduh(k, h)).length, m]).sort((a, b) => b[0] - a[0] || (b[1].colokan ? 1 : 0) - (a[1].colokan ? 1 : 0));
    const m3 = KURSI.filter((k) => k.colokan && !k.dalam && teduh(k, h)).length;
    if (colokan.checked) sa.textContent = m3 ? `Meja 3 punya colokan, ${m3} kursinya teduh.` : "Meja 3 sedang kena matahari. Coba meja bar di dalam.";
    else sa.textContent = skor[0][0] ? `Paling adem sekarang: Meja ${skor[0][1].no}.` : "Teras sedang terik. Ruang dalam tetap adem.";
  }

  jam.addEventListener("input", gambar);
  colokan.addEventListener("change", gambar);
  document.querySelectorAll(".cepat [data-jam]").forEach((b) => b.addEventListener("click", () => { jam.value = b.dataset.jam; gambar(); }));
  const sekarang = () => { const d = wib(), h = d.getHours() + Math.round(d.getMinutes() / 15) / 4, [a, b] = jamBuka(d); jam.value = h >= a && h <= b ? h : 14; gambar(); };
  $("sekarang").addEventListener("click", sekarang);

  Promise.all([muat("lantai.webp"), muat("kanopi.webp"), document.fonts ? document.fonts.load("400 38px 'Young Serif'").catch(() => {}) : 0]).then(([a, b]) => {
    lantai = a;
    if (b) {
      // Masker kanopi jadi bayangan hijau tua, dan datanya dipakai untuk menghitung kursi teduh
      const c = document.createElement("canvas"); c.width = KW; c.height = KH;
      const x = c.getContext("2d", { willReadFrequently: true }); x.drawImage(b, 0, 0, KW, KH);
      const img = x.getImageData(0, 0, KW, KH); data = img.data.slice();
      for (let i = 0; i < img.data.length; i += 4) { const v = img.data[i]; img.data[i] = 32; img.data[i + 1] = 52; img.data[i + 2] = 42; img.data[i + 3] = v; }
      x.putImageData(img, 0, 0); tinggi = c;
    }
    sekarang();
  });
})();
