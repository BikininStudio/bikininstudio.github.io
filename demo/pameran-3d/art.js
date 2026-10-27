// Enam gambar karya contoh (sekolah fiktif SMA Bukit Rawa), digambar dengan kode oleh Bikinin Studio. Tidak ada nama siswa.
export const KARYA = [
  { judul: "Siklus Air dalam Satu Poster", ket: "Menjelaskan penguapan, awan, hujan, dan resapan dengan empat panah berwarna.", kelas: "VII-2 · poster A3 digital" },
  { judul: "Peta Jalur Rempah", ket: "Infografis jalur dagang cengkih dan pala dari Maluku ke pelabuhan Eropa abad ke-16.", kelas: "XI IPS-1 · infografis" },
  { judul: "Maket Rumah Panggung", ket: "Skala 1:20 dari karton dan lidi, lengkap dengan tangga dan teras.", kelas: "VIII-4 · maket" },
  { judul: "Logo Koperasi Siswa", ket: "Lima usulan logo, satu dipilih lewat pemungutan suara kelas.", kelas: "XII-1 · desain logo" },
  { judul: "Aplikasi Jadwal Piket", ket: "Aplikasi web sederhana untuk membagi piket kelas dan mencatat kehadiran.", kelas: "X RPL-2 · aplikasi web" },
  { judul: "Foto Pasar Pagi", ket: "Seri enam foto pedagang sayur sebelum pukul enam pagi.", kelas: "Ekskul Fotografi · foto" },
];
const SANS = '"Hanken Grotesk", system-ui, sans-serif';
const BRIC = '"Bricolage Grotesque", "Hanken Grotesk", sans-serif';

function arrow(g, x1, y1, x2, y2, c, w = 10) {
  g.strokeStyle = c; g.fillStyle = c; g.lineWidth = w; g.lineCap = "round";
  g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke();
  const a = Math.atan2(y2 - y1, x2 - x1);
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - 34 * Math.cos(a - 0.45), y2 - 34 * Math.sin(a - 0.45)); g.lineTo(x2 - 34 * Math.cos(a + 0.45), y2 - 34 * Math.sin(a + 0.45)); g.fill();
}
const T = (g, s, x, y, size, c, w = 700, al = "left", f = SANS) => { g.fillStyle = c; g.font = `${w} ${size}px ${f}`; g.textAlign = al; g.fillText(s, x, y); };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// Semua gambar berukuran 1024 x 768 (4:3)
export const ART = [
  (g, w, h) => { // siklus air
    g.fillStyle = "#CFE0E6"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#F2D675"; g.beginPath(); g.arc(860, 130, 70, 0, 7); g.fill();
    g.fillStyle = "#7E9A7A"; g.beginPath(); g.moveTo(0, 560); g.lineTo(220, 300); g.lineTo(420, 560); g.fill(); g.beginPath(); g.moveTo(260, 560); g.lineTo(520, 250); g.lineTo(760, 560); g.fill();
    g.fillStyle = "#4F7F95"; g.fillRect(0, 560, w, 208);
    g.fillStyle = "#6E98AA"; for (let i = 0; i < 6; i++) g.fillRect(40 + i * 170, 620 + (i % 2) * 40, 110, 8);
    g.fillStyle = "#F4F1EA"; [[330, 130, 1], [470, 160, 1.2], [600, 120, 0.9]].forEach(([x, y, s]) => { g.beginPath(); g.arc(x, y, 50 * s, 0, 7); g.arc(x + 55 * s, y + 10, 40 * s, 0, 7); g.arc(x - 55 * s, y + 12, 38 * s, 0, 7); g.fill(); });
    arrow(g, 120, 520, 120, 250, "#C75B3A"); arrow(g, 520, 200, 520, 330, "#4A6FA5"); arrow(g, 800, 330, 800, 500, "#3C7C5A"); arrow(g, 900, 640, 740, 700, "#8A5BA3");
    T(g, "Penguapan", 150, 400, 34, "#7A331A"); T(g, "Awan", 560, 270, 34, "#243F63"); T(g, "Hujan", 830, 420, 34, "#1F5238"); T(g, "Resapan", 600, 735, 34, "#F4F1EA");
    T(g, "Siklus Air", 40, 70, 54, "#243F63", 800, "left", BRIC);
  },
  (g, w, h) => { // peta jalur rempah
    g.fillStyle = "#E3D6B6"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#B7CBC9"; g.fillRect(40, 100, w - 80, h - 140);
    g.fillStyle = "#C9B98E";
    [[800, 520, 90, 50], [700, 600, 60, 40], [880, 450, 40, 30], [600, 560, 80, 36]].forEach(([x, y, a, b]) => { g.beginPath(); g.ellipse(x, y, a, b, 0.4, 0, 7); g.fill(); });
    g.beginPath(); g.moveTo(80, 160); g.lineTo(300, 140); g.lineTo(360, 260); g.lineTo(240, 330); g.lineTo(90, 300); g.fill();
    g.strokeStyle = "#8F3B24"; g.lineWidth = 8; g.setLineDash([22, 14]); g.beginPath(); g.moveTo(780, 520); g.bezierCurveTo(600, 640, 480, 420, 420, 480); g.bezierCurveTo(360, 540, 300, 380, 280, 300); g.stroke(); g.setLineDash([]);
    g.fillStyle = "#8F3B24"; [[780, 520], [280, 300], [500, 520]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 14, 0, 7); g.fill(); });
    T(g, "Maluku", 700, 660, 36, "#3B2A1C"); T(g, "Pelabuhan Eropa", 100, 360, 34, "#3B2A1C"); T(g, "Tanjung Harapan", 330, 560, 30, "#3B2A1C", 500);
    T(g, "Jalur Rempah", 40, 78, 56, "#5A2A18", 800, "left", BRIC);
    g.fillStyle = "#F0E8D2"; rr(g, 640, 130, 330, 130, 10); g.fill(); T(g, "Cengkih · Pala", 664, 185, 36, "#3B2A1C"); T(g, "abad ke-16", 664, 235, 30, "#5A4632", 500);
  },
  (g, w, h) => { // maket rumah panggung
    g.fillStyle = "#D8CFB8"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#B8A483"; g.fillRect(0, 620, w, 148);
    g.fillStyle = "#6B4A3A"; [250, 360, 650, 760].forEach((x) => g.fillRect(x - 12, 430, 24, 220));
    g.fillStyle = "#A07A55"; g.fillRect(200, 360, 620, 70);
    g.fillStyle = "#C9A36F"; g.fillRect(250, 220, 520, 140);
    g.fillStyle = "#6B4A3A"; g.fillRect(470, 270, 90, 90); g.fillStyle = "#8FB0B8"; g.fillRect(300, 255, 90, 70); g.fillRect(640, 255, 90, 70);
    g.fillStyle = "#8B3A24"; g.beginPath(); g.moveTo(200, 230); g.lineTo(510, 80); g.lineTo(820, 230); g.lineTo(780, 240); g.lineTo(510, 120); g.lineTo(240, 240); g.fill();
    g.strokeStyle = "#6B4A3A"; g.lineWidth = 10; g.beginPath(); g.moveTo(420, 640); g.lineTo(480, 430); g.moveTo(480, 640); g.lineTo(540, 430); g.stroke(); for (let i = 0; i < 5; i++) { g.beginPath(); g.moveTo(436 + i * 12, 590 - i * 42); g.lineTo(496 + i * 12, 590 - i * 42); g.stroke(); }
    T(g, "Skala 1:20", 40, 70, 54, "#4A3322", 800, "left", BRIC); T(g, "karton dan lidi", 40, 118, 30, "#5A4632", 500);
  },
  (g, w, h) => { // logo koperasi: lima usulan
    g.fillStyle = "#EDE6D6"; g.fillRect(0, 0, w, h);
    const cs = ["#2F4A3A", "#8A4426", "#33505E", "#6B3F5A", "#B07A1E"];
    for (let i = 0; i < 5; i++) {
      const x = 40 + (i % 3) * 320, y = 110 + Math.floor(i / 3) * 300;
      g.fillStyle = "#FAF6EC"; rr(g, x, y, 290, 260, 12); g.fill();
      g.fillStyle = cs[i];
      if (i === 0) { g.beginPath(); g.arc(x + 145, y + 110, 70, 0, 7); g.fill(); g.fillStyle = "#FAF6EC"; g.fillRect(x + 120, y + 80, 50, 80); }
      if (i === 1) { g.beginPath(); g.moveTo(x + 145, y + 40); g.lineTo(x + 225, y + 180); g.lineTo(x + 65, y + 180); g.fill(); }
      if (i === 2) { g.fillRect(x + 75, y + 50, 140, 130); g.fillStyle = "#FAF6EC"; g.beginPath(); g.arc(x + 145, y + 115, 40, 0, 7); g.fill(); }
      if (i === 3) { for (let k = 0; k < 3; k++) { g.beginPath(); g.arc(x + 95 + k * 50, y + 120, 36, 0, 7); g.fill(); } }
      if (i === 4) { g.beginPath(); g.moveTo(x + 70, y + 170); g.quadraticCurveTo(x + 145, y + 20, x + 220, y + 170); g.lineTo(x + 190, y + 170); g.quadraticCurveTo(x + 145, y + 80, x + 100, y + 170); g.fill(); }
      T(g, "Koperasi", x + 145, y + 235, 30, "#3A2F25", 700, "center");
    }
    g.strokeStyle = "#C75B3A"; g.lineWidth = 8; rr(g, 40 + 320 - 8, 110 - 8, 306, 276, 16); g.stroke();
    T(g, "dipilih", 40 + 320 + 145, 110 - 20, 28, "#8A3A1C", 700, "center");
    T(g, "Usulan logo", 40, 70, 54, "#3A2F25", 800, "left", BRIC);
    g.fillStyle = "#3A2F25"; g.font = `500 30px ${SANS}`; g.textAlign = "left"; g.fillText("Hasil pemungutan suara kelas", 680, 560); g.fillText("tertulis di papan.", 680, 600);
  },
  (g, w, h) => { // aplikasi jadwal piket
    g.fillStyle = "#DCE3E1"; g.fillRect(0, 0, w, h);
    g.fillStyle = "#33505E"; g.fillRect(0, 0, w, 110); T(g, "Jadwal Piket", 40, 72, 48, "#F4EFE8", 800, "left", BRIC);
    const hari = [["Senin", "4 siswa", true], ["Selasa", "4 siswa", true], ["Rabu", "4 siswa", false], ["Kamis", "4 siswa", false], ["Jumat", "3 siswa", false]];
    hari.forEach(([d, n, ok], i) => {
      const y = 150 + i * 112;
      g.fillStyle = "#F6F8F7"; rr(g, 40, y, w - 80, 96, 14); g.fill();
      T(g, d, 80, y + 60, 38, "#1E2A2F"); T(g, n, 330, y + 60, 30, "#4A5A60", 500);
      g.fillStyle = ok ? "#3C7C5A" : "#C8D1CE"; rr(g, w - 230, y + 24, 150, 48, 24); g.fill();
      T(g, ok ? "Hadir" : "Belum", w - 155, y + 59, 28, ok ? "#F4EFE8" : "#3A464B", 700, "center");
    });
  },
  (g, w, h) => { // foto pasar pagi (gambar contoh)
    g.fillStyle = "#6F7C93"; g.fillRect(0, 0, w, 300); g.fillStyle = "#C79A78"; g.fillRect(0, 300, w, 40); g.fillStyle = "#4A4A52"; g.fillRect(0, 340, w, h - 340);
    g.fillStyle = "#E8B77A"; g.beginPath(); g.arc(850, 300, 70, Math.PI, 0); g.fill();
    [0, 1, 2].forEach((i) => {
      const x = 40 + i * 330;
      g.fillStyle = ["#9C3B2A", "#2F5D46", "#C08A2E"][i]; g.beginPath(); g.moveTo(x, 280); g.lineTo(x + 290, 280); g.lineTo(x + 320, 350); g.lineTo(x - 30, 350); g.fill();
      g.fillStyle = "#2B2A2F"; g.fillRect(x + 10, 350, 14, 260); g.fillRect(x + 266, 350, 14, 260);
      g.fillStyle = "#6B4A3A"; g.fillRect(x - 10, 520, 310, 120);
      ["#C0392B", "#7BA05B", "#E0A526", "#6B8E3E", "#B5532A"].forEach((c, k) => { g.fillStyle = c; g.beginPath(); g.arc(x + 30 + k * 56, 515, 30, Math.PI, 0); g.fill(); });
      g.fillStyle = "#1B1B20"; g.beginPath(); g.arc(x + 145, 440, 38, 0, 7); g.fill(); g.fillRect(x + 110, 470, 70, 60);
    });
    T(g, "05.52", 40, 70, 52, "#F2E3C9", 800, "left", BRIC);
  },
];
export const drawArt = (i, g, w = 1024, h = 768) => ART[i](g, w, h);
