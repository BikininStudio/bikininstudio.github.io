// Roda Lestari: aplikasi demo reservasi + stok bengkel. Vanilla JS, data contoh di localStorage (try/catch).
(function () {
  "use strict";
  var KEY = "rl_demo_v1", AUTH = "rl_demo_auth", TODAY = "2026-10-27", PER = 8;
  var STAT = ["Dijadwalkan", "Dikerjakan", "Siap diambil", "Selesai", "Dibatalkan"];
  var SERV = [
    ["ringan", "Servis ringan", 55000], ["oli", "Ganti oli", 15000], ["cvt", "Servis CVT", 120000], ["rem", "Ganti kampas rem", 25000],
    ["tune", "Tune up injeksi", 95000], ["ban", "Ganti ban dalam", 20000], ["aki", "Ganti aki", 10000], ["rantai", "Ganti rantai dan gir", 60000]
  ];
  var money = new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 });
  var num = new Intl.NumberFormat("id-ID");
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var svcName = function (k) { return (SERV.filter(function (s) { return s[0] === k; })[0] || [0, k])[1]; };
  var svcPrice = function (k) { return (SERV.filter(function (s) { return s[0] === k; })[0] || [0, 0, 0])[2]; };
  var dFmt = function (iso) { var p = iso.split("-"); return p[2] + " " + ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"][+p[1] - 1]; };
  var jamTxt = function (j) { return String(j).padStart(2, "0") + ".00"; };

  function seed() {
    var R = [
      ["05", "Andi P.", "Honda Beat 2019", "B 0101 AAA", "ringan", "Servis ringan", 55000, 3], ["05", "Siti R.", "Yamaha NMAX 2021", "B 0102 AAB", "cvt", "Servis CVT + belt", 255000, 3],
      ["06", "Budi S.", "Honda Vario 125 2020", "B 0103 AAC", "oli", "Ganti oli", 77000, 3], ["07", "Dewi L.", "Suzuki Satria F150 2018", "B 0104 AAD", "rantai", "Ganti rantai dan gir", 275000, 3],
      ["07", "Rudi H.", "Honda Scoopy 2022", "B 0105 AAE", "tune", "Tune up injeksi", 95000, 3], ["08", "Rina M.", "Yamaha Mio M3 2019", "B 0106 AAF", "ban", "Ganti ban dalam", 56000, 3],
      ["09", "Joko W.", "Honda CB150R 2020", "B 0107 AAG", "rem", "Ganti kampas rem", 73000, 3], ["10", "Lina K.", "Honda PCX 160 2022", "B 0108 AAH", "cvt", "Servis CVT", 120000, 3],
      ["21", "Agus T.", "Yamaha Aerox 2021", "B 0109 AAI", "oli", "Ganti oli", 77000, 3], ["23", "Maya D.", "Honda Beat 2021", "B 0110 AAJ", "aki", "Ganti aki", 195000, 3],
      ["24", "Eko N.", "Suzuki Address 2020", "B 0111 AAK", "ringan", "Servis ringan", 55000, 3], ["25", "Fitri A.", "Honda Vario 160 2023", "B 0112 AAL", "tune", "Tune up injeksi", 95000, 3],
      ["19", "Hendra B.", "Yamaha NMAX 2020", "B 0113 AAM", "cvt", "Servis CVT", 120000, 3], ["22", "Nur C.", "Honda Scoopy 2020", "B 0114 AAN", "rem", "Ganti kampas rem", 67000, 3],
      ["22", "Tono G.", "Kawasaki W175 2019", "B 0115 AAO", "rantai", "Ganti rantai dan gir", 275000, 4], ["26", "Yuni E.", "Honda Beat 2018", "B 0116 AAP", "oli", "Ganti oli", 77000, 2],
      ["27", "Wawan F.", "Yamaha Mio Z 2019", "B 0117 AAQ", "ringan", "Servis ringan", 55000, 1], ["27", "Sari I.", "Honda PCX 150 2019", "B 0118 AAR", "cvt", "Servis CVT", 120000, 1],
      ["28", "Dedi J.", "Honda Vario 125 2019", "B 0119 AAS", "ban", "Ganti ban dalam", 56000, 0], ["29", "Mira O.", "Yamaha Lexi 2022", "B 0120 AAT", "tune", "Tune up injeksi", 95000, 0]
    ];
    var stat = [3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 3, 4, 2, 1, 1, 0, 0];
    return {
      res: R.map(function (r, i) {
        var st = stat[i];
        return { no: "RS-" + String(i + 1).padStart(3, "0"), tgl: "2026-10-" + r[0], nama: r[1], hp: "0812000" + String(1000 + i * 37), motor: r[2], plat: r[3], svc: r[4], lay: r[5], total: r[6], st: st, jam: 8 + (i * 3) % 8, cat: "" };
      }),
      stok: [["Oli mesin 10W-40 (1 L)", 6, 12, 62000], ["Oli gardan (120 ml)", 18, 8, 14000], ["Busi standar", 4, 10, 21000], ["Kampas rem depan", 3, 6, 48000], ["Kampas rem belakang", 9, 6, 42000], ["Filter udara", 11, 5, 38000],
        ["Rantai dan gir set", 5, 3, 215000], ["Ban dalam 80/90-14", 8, 4, 36000], ["Aki 12V 5Ah", 4, 3, 185000], ["Bohlam depan", 15, 6, 17000], ["Kabel gas", 7, 4, 29000], ["Belt CVT", 0, 3, 135000]]
        .map(function (s, i) { return { kode: "SP-" + String(i + 1).padStart(2, "0"), nama: s[0], stok: s[1], min: s[2], harga: s[3] }; }),
      set: { nama: "Bengkel Roda Lestari", buka: 8, tutup: 16, kap: 3, minDef: 5 }
    };
  }

  var D, memOnly = false;
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); if (v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); return true; } catch (e) { return v === undefined ? null : false; } }
  function load() {
    var raw = store(KEY);
    try { D = raw ? JSON.parse(raw) : null; } catch (e) { D = null; }
    if (!D || !D.res || !D.stok || !D.set) { D = seed(); store(KEY, JSON.stringify(D)); }
  }
  function save() {
    if (store(KEY, JSON.stringify(D)) === false) { note("Data tidak tersimpan. Penyimpanan peramban penuh atau diblokir. Kosongkan ruang lalu coba lagi.", true); return false; }
    return true;
  }
  var nt;
  function note(m, bad) {
    var n = $("#note"); n.textContent = m; n.className = "note on" + (bad ? " bad" : "");
    clearTimeout(nt); nt = setTimeout(function () { n.classList.remove("on"); }, bad ? 6000 : 3600);
  }

  // ---------- hitungan ----------
  var counted = function (r) { return r.st === 1 || r.st === 2 || r.st === 3; };
  var stokSt = function (s) { return s.stok <= 0 ? 2 : s.stok <= s.min ? 1 : 0; };
  var low = function () { return D.stok.filter(function (s) { return s.stok <= s.min; }); };
  var tag = function (i) { return '<span class="tag t' + i + '">' + STAT[i] + "</span>"; };
  var addDays = function (iso, n) { var d = new Date(iso + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); };

  // ---------- grafik SVG ----------
  var charts = {};
  var short = function (v) { return v >= 1e6 ? (v / 1e6).toFixed(1).replace(".", ",") + " jt" : v >= 1000 ? Math.round(v / 1000) + " rb" : String(v); };
  function vbar(el, d, fmt) {
    var W = Math.max(260, el.clientWidth || 320), H = 220, pl = 46, pb = 28, pt = 18, mx = Math.max.apply(null, d.map(function (x) { return x.v; }).concat([1]));
    var p = Math.pow(10, Math.floor(Math.log10(mx))), nice = [1, 2, 5, 10].map(function (m) { return m * p; }).filter(function (x) { return x >= mx; })[0];
    var bw = (W - pl - 6) / d.length, s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + " " + H + '" aria-hidden="true" focusable="false">';
    for (var i = 0; i <= 4; i++) { var y = pt + (H - pt - pb) * (1 - i / 4); s += '<line class="gl" x1="' + pl + '" x2="' + W + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pl - 6) + '" y="' + (y + 4) + '" text-anchor="end">' + fmt(nice * i / 4) + "</text>"; }
    d.forEach(function (x, k) {
      var h = (H - pt - pb) * x.v / nice, bx = pl + k * bw + bw * .2;
      s += '<rect class="bar' + (x.a ? " a" : "") + '" style="animation-delay:' + k * 50 + 'ms" x="' + bx + '" y="' + (H - pb - h) + '" width="' + bw * .6 + '" height="' + h + '"/>';
      if (d.length <= 8 || k % Math.ceil(d.length / 8) === 0) s += '<text x="' + (bx + bw * .3) + '" y="' + (H - 8) + '" text-anchor="middle">' + x.l + "</text>";
    });
    el.innerHTML = s + "</svg>";
  }
  function hbar(el, d, fmt) {
    var W = Math.max(240, el.clientWidth || 300), rh = 46, mx = Math.max.apply(null, d.map(function (x) { return x.v; }).concat([1])), s = '<svg width="' + W + '" height="' + d.length * rh + '" aria-hidden="true" focusable="false">';
    d.forEach(function (x, k) {
      var y = k * rh, w = Math.max(3, (W - 70) * x.v / mx);
      s += '<text x="0" y="' + (y + 14) + '">' + esc(x.l) + '</text><rect class="bar' + (k === 0 ? " a" : "") + '" style="animation-delay:' + k * 60 + 'ms;transform-origin:left;animation-name:growx" x="0" y="' + (y + 20) + '" width="' + w + '" height="16"/><text x="' + (w + 8) + '" y="' + (y + 33) + '">' + fmt(x.v) + "</text>";
    });
    el.innerHTML = s + "</svg>";
  }
  var st0 = document.createElement("style"); st0.textContent = "@keyframes growx{from{transform:scaleX(.05);opacity:.3}}@media(prefers-reduced-motion:reduce){.bar{animation:none!important}}"; document.head.appendChild(st0);
  function table(cap, cols, rows) {
    return '<details class="dt"><summary>Tampilkan tabel data</summary><div class="tw"><table><caption>' + cap + "</caption><thead><tr>" + cols.map(function (c) { return "<th>" + c + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c, i) { return (i ? '<td class="n">' : "<td>") + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div></details>";
  }
  function drawCharts() {
    Object.keys(charts).forEach(function (id) { var el = document.getElementById(id); if (el) charts[id](el); });
  }
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(drawCharts, 150); });

  // ---------- tampilan ----------
  var V = { q: "", st: "", so: "baru", pg: 1, per: "bulan" };
  var views = { ringkasan: ringkasan, reservasi: reservasi, stok: stok, laporan: laporan, pengaturan: pengaturan };
  var TITLES = { ringkasan: "Ringkasan", reservasi: "Reservasi", stok: "Stok", laporan: "Laporan", pengaturan: "Pengaturan" };
  var dirty = false;

  function shell(route, html) {
    return '<div class="shell"><aside class="side"><div class="brand"><b>Roda Lestari</b><span>Reservasi &amp; stok suku cadang</span></div><nav aria-label="Utama">' +
      Object.keys(TITLES).map(function (k) { return '<a href="#/' + k + '"' + (k === route ? ' aria-current="page"' : "") + ">" + TITLES[k] + "</a>"; }).join("") +
      '</nav><button class="out" type="button" id="logout">Keluar</button></aside><main class="view" id="view">' + html + "</main></div>";
  }
  function render() {
    var app = $("#app");
    try {
      if (store(AUTH) !== "1") { app.innerHTML = loginHtml(); document.title = "Masuk – Roda Lestari"; $("#go").addEventListener("click", function () { store(AUTH, "1"); location.hash = "#/ringkasan"; render(); $("#view h1").focus(); }); return; }
      var route = (location.hash.match(/^#\/(\w+)/) || [])[1]; if (!views[route]) route = "ringkasan";
      charts = {};
      app.innerHTML = shell(route, views[route]());
      document.title = TITLES[route] + " – Roda Lestari (demo)";
      $("#logout").addEventListener("click", function () { store(AUTH, null); render(); });
      bind(route); drawCharts();
    } catch (e) {
      app.innerHTML = '<div class="view"><h1>Data tidak terbaca</h1><p>Terjadi kesalahan saat membaca data. Muat ulang halaman, atau klik Reset data contoh di Pengaturan.</p><button class="btn" type="button" id="rs">Reset data contoh</button></div>';
      $("#rs").addEventListener("click", function () { store(KEY, null); load(); render(); });
    }
  }
  function loginHtml() {
    return '<main class="login"><div class="lf"><svg viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g fill="none" stroke="#E4E7E8" stroke-width="6"><circle cx="100" cy="100" r="84"/><circle cx="100" cy="100" r="58" stroke="#E3B23C"/><circle cx="100" cy="100" r="14" fill="#E3B23C" stroke="none"/><path d="M100 100L158 100"/><path d="M100 100L150 129"/><path d="M100 100L128 150"/><path d="M100 100L99 157"/><path d="M100 100L70 150"/><path d="M100 100L49 128"/><path d="M100 100L42 99"/><path d="M100 100L49 70"/><path d="M100 100L71 49"/><path d="M100 100L100 42"/><path d="M100 100L129 49"/><path d="M100 100L150 71"/></g></svg><b>Roda<br>Lestari</b><span>Reservasi &amp; stok suku cadang</span></div><div class="rt2"><h1 class="rise">Masuk ke Roda Lestari</h1><p class="rise">Ini aplikasi demo. Tidak ada akun asli dan tidak ada kata sandi.</p>' +
      '<div class="fld rise"><label for="u">Nama pengguna</label><input id="u" value="admin-demo" readonly aria-disabled="true" tabindex="-1"></div><div class="fld rise"><label for="pw">Kata sandi</label><input id="pw" value="••••••••" readonly aria-disabled="true" tabindex="-1"></div>' +
      '<div class="rise"><button class="btn" type="button" id="go">Masuk sebagai demo</button></div><p class="rise" style="color:var(--ink2)">Data contoh tersimpan di peramban ini saja.</p></div></main>';
  }
  function head(t, extra) { return '<header><h1 id="h1" tabindex="-1">' + t + "</h1>" + (extra || "") + "</header>"; }

  function ringkasan() {
    var R = D.res, today = R.filter(function (r) { return r.tgl === TODAY && r.st !== 4; }).length;
    var rev = R.filter(function (r) { return counted(r) && r.tgl.slice(0, 7) === "2026-10"; }).reduce(function (a, r) { return a + r.total; }, 0);
    var cnt = function (i) { return R.filter(function (r) { return r.st === i; }).length; };
    var days = [6, 5, 4, 3, 2, 1, 0].map(function (n) { return addDays(TODAY, -n); });
    var d1 = days.map(function (d) { return { l: d.slice(8), v: R.filter(function (r) { return r.tgl === d && counted(r); }).reduce(function (a, r) { return a + r.total; }, 0), a: d === TODAY }; });
    var by = {}; R.forEach(function (r) { if (r.st !== 4) by[r.svc] = (by[r.svc] || 0) + 1; });
    var d2 = Object.keys(by).map(function (k) { return { l: svcName(k), v: by[k] }; }).sort(function (a, b) { return b.v - a.v; }).slice(0, 5);
    charts.c1 = function (el) { vbar(el, d1, short); }; charts.c2 = function (el) { hbar(el, d2, String); };
    var att = low().slice(0, 3).map(function (s) { return "Stok " + esc(s.nama) + " tinggal " + s.stok + " (minimum " + s.min + ")."; });
    R.filter(function (r) { return r.tgl < TODAY && (r.st === 0 || r.st === 1); }).slice(0, 3).forEach(function (r) { att.push("Reservasi " + r.no + " (" + esc(r.nama) + ") lewat jadwal."); });
    return head("Ringkasan hari ini", "<p>Data per " + dFmt(TODAY) + " 2026 (tanggal contoh).</p>") +
      '<div class="dash"><div class="big"><span>Reservasi hari ini</span><b>' + today + '</b><span>' + cnt(1) + " sedang dikerjakan, " + cnt(2) + " siap diambil</span></div>" +
      '<dl class="nums pn"><div><dt>Sedang dikerjakan</dt><dd>' + cnt(1) + "</dd></div><div><dt>Siap diambil</dt><dd>" + cnt(2) + "</dd></div><div><dt>Pendapatan bulan ini</dt><dd>" + money.format(rev) + "</dd></div><div><dt>Stok di bawah minimum</dt><dd>" + low().length + "</dd></div></dl></div>" +
      '<div class="charts"><section class="pn" aria-labelledby="g1"><h2 id="g1">Pendapatan 7 hari terakhir</h2><p class="sr" style="margin:0;color:var(--ink2)">Grafik batang pendapatan per hari, tabel data tersedia di bawah.</p><div class="cht" id="c1"></div>' +
      table("Pendapatan per hari", ["Tanggal", "Pendapatan"], d1.map(function (x, i) { return [dFmt(days[i]), money.format(x.v)]; })) + '</section>' +
      '<section class="pn" aria-labelledby="g2"><h2 id="g2">Layanan paling sering dipesan</h2><div class="cht" id="c2"></div>' + table("Jumlah pesanan per layanan", ["Layanan", "Pesanan"], d2.map(function (x) { return [esc(x.l), x.v]; })) + "</section></div>" +
      '<section class="pn" aria-labelledby="g3"><h2 id="g3">Perlu perhatian</h2>' + (att.length ? '<ul class="attn">' + att.map(function (a) { return "<li>" + a + "</li>"; }).join("") + "</ul>" : "<p>Tidak ada yang perlu perhatian.</p>") + "</section>";
  }

  function filtered() {
    var q = V.q.trim().toLowerCase(), a = D.res.filter(function (r) {
      return (V.st === "" || String(r.st) === V.st) && (!q || (r.nama + " " + r.plat + " " + r.lay + " " + r.motor + " " + r.no).toLowerCase().indexOf(q) > -1);
    });
    a.sort(function (x, y) { return V.so === "total" ? y.total - x.total : V.so === "lama" ? (x.tgl + x.jam).localeCompare(y.tgl + y.jam) : (y.tgl + y.jam).localeCompare(x.tgl + x.jam); });
    return a;
  }
  function reservasi() {
    return head("Reservasi servis", '<button class="btn" type="button" id="add">Tambah reservasi</button>') +
      '<div class="bar-tools"><div class="fld" style="flex:2 1 220px"><label for="q">Cari reservasi</label><input id="q" type="search" autocomplete="off" spellcheck="false" placeholder="Nama, plat, atau layanan…" value="' + esc(V.q) + '"></div>' +
      '<div class="fld" style="flex:1 1 160px"><label for="fs">Status</label><select id="fs"><option value="">Semua status</option>' + STAT.map(function (s, i) { return '<option value="' + i + '"' + (V.st === String(i) ? " selected" : "") + ">" + s + "</option>"; }).join("") + "</select></div>" +
      '<div class="fld" style="flex:1 1 160px"><label for="so">Urutkan</label><select id="so"><option value="baru"' + (V.so === "baru" ? " selected" : "") + '>Tanggal terbaru</option><option value="lama"' + (V.so === "lama" ? " selected" : "") + '>Tanggal terlama</option><option value="total"' + (V.so === "total" ? " selected" : "") + ">Total tertinggi</option></select></div></div>" +
      '<div id="tbl"></div><p style="margin-top:14px;color:var(--ink2)">Nama pelanggan dan plat nomor adalah contoh.</p>';
  }
  function drawTable() {
    var a = filtered(), pages = Math.max(1, Math.ceil(a.length / PER)); if (V.pg > pages) V.pg = pages;
    var rows = a.slice((V.pg - 1) * PER, V.pg * PER), el = $("#tbl");
    if (!D.res.length) { el.innerHTML = '<div class="empty"><p>Belum ada reservasi. Klik Tambah reservasi untuk mencatat yang pertama.</p></div>'; return; }
    if (!a.length) { el.innerHTML = '<div class="empty"><p>Tidak ada reservasi yang cocok. Ubah kata kunci atau filter status.</p><button class="btn sec" type="button" id="clr">Hapus filter</button></div>'; $("#clr").addEventListener("click", function () { V.q = ""; V.st = ""; V.pg = 1; render(); }); return; }
    el.innerHTML = '<p role="status" aria-live="polite" style="color:var(--ink2)">Menampilkan ' + rows.length + " dari " + a.length + ' reservasi</p><div class="tw"><table class="rt"><thead><tr><th>No.</th><th>Tanggal</th><th>Pelanggan</th><th>Motor</th><th>Layanan</th><th class="n">Total</th><th>Status</th><th>Aksi</th></tr></thead><tbody>' +
      rows.map(function (r) { return '<tr><td data-l="No.">' + r.no + '</td><td data-l="Tanggal">' + dFmt(r.tgl) + "<small>" + jamTxt(r.jam) + '</small></td><td data-l="Pelanggan">' + esc(r.nama) + '</td><td data-l="Motor">' + esc(r.motor) + "<small>" + esc(r.plat) + '</small></td><td data-l="Layanan">' + esc(r.lay) + '</td><td class="n" data-l="Total">' + money.format(r.total) + '</td><td data-l="Status">' + tag(r.st) + '</td><td class="ac"><button class="btn sec" type="button" data-ed="' + r.no + '" aria-label="Ubah ' + r.no + '">Ubah</button></td></tr>'; }).join("") +
      '</tbody></table></div><nav class="pg" aria-label="Halaman"><button class="btn sec" type="button" id="pv"' + (V.pg <= 1 ? " disabled" : "") + '>Sebelumnya</button><span>Halaman ' + V.pg + " dari " + pages + '</span><button class="btn sec" type="button" id="nx"' + (V.pg >= pages ? " disabled" : "") + ">Berikutnya</button></nav>";
    $("#pv").addEventListener("click", function () { V.pg--; drawTable(); }); $("#nx").addEventListener("click", function () { V.pg++; drawTable(); });
    [].forEach.call(el.querySelectorAll("[data-ed]"), function (b) { b.addEventListener("click", function () { resDialog(b.dataset.ed); }); });
  }

  // ---------- dialog ----------
  var dlg = $("#dlg");
  function openDlg(html, onSubmit) {
    dlg.innerHTML = html;
    var f = dlg.querySelector("form");
    [].forEach.call(dlg.querySelectorAll("[data-close]"), function (b) { b.addEventListener("click", function () { dlg.close(); }); });
    f.addEventListener("submit", function (e) { e.preventDefault(); onSubmit(f); });
    if (!dlg.open) dlg.showModal();
  }
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });
  function fe(f, n, m) { var el = f.elements[n], er = $("#e-" + n, f); if (er) er.textContent = m || ""; el.setAttribute("aria-invalid", m ? "true" : "false"); return m; }
  function field(id, lab, inner) { return '<div class="fld"><label for="' + id + '">' + lab + "</label>" + inner + '<p class="err" id="e-' + id + '" role="alert"></p></div>'; }
  function firstErr(f, names) { var bad = names.filter(function (n) { return f.elements[n].getAttribute("aria-invalid") === "true"; })[0]; if (bad) f.elements[bad].focus(); return !!bad; }

  function resDialog(no) {
    var r = no ? D.res.filter(function (x) { return x.no === no; })[0] : null, hrs = [];
    for (var h = D.set.buka; h < Math.min(D.set.tutup, 16); h++) hrs.push(h);
    var opt = function (arr, sel) { return arr.map(function (o) { return '<option value="' + o[0] + '"' + (String(o[0]) === String(sel) ? " selected" : "") + ">" + o[1] + "</option>"; }).join(""); };
    var nextNo = "RS-" + String(Math.max.apply(null, D.res.map(function (x) { return +x.no.slice(3); }).concat([0])) + 1).padStart(3, "0");
    var title = r ? "Ubah reservasi " + r.no : "Tambah reservasi";
    openDlg('<form novalidate><h2 id="dlg-t">' + title + "</h2>" +
      field("nama", "Nama pelanggan", '<input id="nama" name="nama" autocomplete="off" value="' + esc(r ? r.nama : "") + '">') +
      field("hp", "Nomor WhatsApp", '<input id="hp" name="hp" type="tel" inputmode="tel" autocomplete="off" placeholder="08xxxxxxxxxx…" value="' + esc(r ? r.hp : "") + '">') +
      field("motor", "Motor (merek dan tipe)", '<input id="motor" name="motor" autocomplete="off" placeholder="Honda Beat 2020…" value="' + esc(r ? r.motor : "") + '">') +
      field("plat", "Plat nomor", '<input id="plat" name="plat" autocomplete="off" spellcheck="false" placeholder="B 0000 XXX…" value="' + esc(r ? r.plat : "") + '">') +
      field("svc", "Layanan", '<select id="svc" name="svc"><option value="">Pilih layanan</option>' + opt(SERV.map(function (s) { return [s[0], s[1] + " (" + money.format(s[2]) + ")"]; }), r ? r.svc : "") + "</select>") +
      field("tgl", "Tanggal servis", '<input id="tgl" name="tgl" type="date" value="' + (r ? r.tgl : TODAY) + '">') +
      field("jam", "Jam", '<select id="jam" name="jam">' + opt(hrs.map(function (h) { return [h, jamTxt(h)]; }), r ? r.jam : hrs[0]) + "</select>") +
      (r ? field("st", "Status", '<select id="st" name="st">' + opt(STAT.map(function (s, i) { return [i, s]; }), r.st) + "</select>") : "") +
      field("cat", "Catatan keluhan", '<textarea id="cat" name="cat" autocomplete="off">' + esc(r ? r.cat : "") + "</textarea>") +
      '<div class="acts"><button class="btn" type="submit">' + (r ? "Simpan perubahan" : "Simpan reservasi") + '</button><button class="btn sec" type="button" data-close>Batal</button>' + (r && r.st !== 4 ? '<button class="btn dng" type="button" id="cx">Batalkan reservasi</button>' : "") + "</div></form>",
      function (f) {
        var v = function (n) { return f.elements[n].value.trim(); }, jam = +f.elements.jam.value;
        fe(f, "nama", v("nama") ? "" : "Isi nama pelanggan.");
        fe(f, "hp", /^08\d{8,11}$/.test(v("hp").replace(/[\s-]/g, "")) ? "" : "Nomor WhatsApp diawali 08 dan berisi 10–13 digit.");
        fe(f, "motor", v("motor") ? "" : "Isi merek dan tipe motor.");
        fe(f, "svc", v("svc") ? "" : "Pilih layanan.");
        var tgl = v("tgl"); fe(f, "tgl", tgl && tgl >= TODAY ? "" : "Pilih tanggal hari ini atau setelahnya.");
        var used = D.res.filter(function (x) { return x.tgl === tgl && x.jam === jam && x.st !== 4 && (!r || x.no !== r.no); }).length;
        if (!f.elements.tgl.getAttribute("aria-invalid") || f.elements.tgl.getAttribute("aria-invalid") === "false") fe(f, "jam", used >= D.set.kap ? "Jam " + jamTxt(jam) + " pada tanggal ini sudah terisi " + D.set.kap + " motor. Pilih jam lain." : ""); else fe(f, "jam", "");
        if (r && r.tgl < TODAY) fe(f, "tgl", "");
        if (firstErr(f, ["nama", "hp", "motor", "svc", "tgl", "jam"])) return;
        var rec = r || { no: nextNo, st: 0 };
        rec.nama = v("nama"); rec.hp = v("hp"); rec.motor = v("motor"); rec.plat = v("plat"); rec.svc = v("svc"); rec.lay = svcName(rec.svc); rec.total = r && r.svc === rec.svc ? r.total : svcPrice(rec.svc);
        rec.tgl = tgl; rec.jam = jam; rec.cat = v("cat"); if (r) rec.st = +f.elements.st.value; else D.res.push(rec);
        if (save()) { dlg.close(); note(r ? "Status " + rec.no + " menjadi " + STAT[rec.st] + "." : "Reservasi " + rec.no + " disimpan."); drawTable(); }
      });
    if (r) {
      var cx = $("#cx"); if (cx) cx.addEventListener("click", function () {
        openDlg('<form><h2 id="dlg-t">Batalkan reservasi ' + r.no + '?</h2><p>Batalkan reservasi ini? Status berubah menjadi Dibatalkan.</p><div class="acts"><button class="btn dng" type="submit">Ya, batalkan</button><button class="btn sec" type="button" data-close>Kembali</button></div></form>',
          function () { r.st = 4; if (save()) { dlg.close(); note("Status " + r.no + " menjadi Dibatalkan."); drawTable(); } });
      });
    }
  }

  // ---------- stok ----------
  function stok() {
    var L = low();
    return head("Stok suku cadang", '<div style="display:flex;gap:12px;flex-wrap:wrap"><button class="btn sec" type="button" id="use">Catat pemakaian</button><button class="btn" type="button" id="addst">Tambah barang</button></div>') +
      (L.length ? '<p class="alert" role="status">' + L.length + " barang di bawah stok minimum: " + L.map(function (s) { return esc(s.nama.replace(/ \(.*\)/, "")); }).join(", ") + ". Pesan ke pemasok sebelum Jumat.</p>" : "") +
      '<div class="tw"><table class="rt"><thead><tr><th>Kode</th><th>Barang</th><th class="n">Stok</th><th class="n">Minimum</th><th class="n">Harga satuan</th><th>Status stok</th><th>Aksi</th></tr></thead><tbody>' +
      D.stok.map(function (s) { var i = stokSt(s); return '<tr><td data-l="Kode">' + s.kode + '</td><td data-l="Barang">' + esc(s.nama) + '</td><td class="n" data-l="Stok">' + s.stok + '</td><td class="n" data-l="Minimum">' + s.min + '</td><td class="n" data-l="Harga satuan">' + money.format(s.harga) + '</td><td data-l="Status stok"><span class="tag ' + ["t2", "t1", "t4"][i] + '">' + ["Aman", "Menipis", "Habis"][i] + '</span></td><td class="ac"><button class="btn sec" type="button" data-sk="' + s.kode + '" aria-label="Ubah stok ' + esc(s.nama) + '">Ubah stok</button></td></tr>'; }).join("") + "</tbody></table></div>";
  }
  function stokDialog(kode) {
    var s = D.stok.filter(function (x) { return x.kode === kode; })[0];
    openDlg('<form novalidate><h2 id="dlg-t">Ubah stok ' + esc(s.nama) + "</h2>" + field("jml", "Jumlah stok baru", '<input id="jml" name="jml" type="number" inputmode="numeric" min="0" value="' + s.stok + '">') +
      field("why", "Alasan", '<select id="why" name="why"><option value="">Pilih alasan</option><option>Barang masuk</option><option>Dipakai servis</option><option>Koreksi hitung</option></select>') +
      '<div class="acts"><button class="btn" type="submit">Simpan stok</button><button class="btn sec" type="button" data-close>Batal</button></div></form>', function (f) {
      var n = f.elements.jml.value;
      fe(f, "jml", /^\d+$/.test(n) ? "" : "Jumlah stok berupa angka 0 atau lebih."); fe(f, "why", f.elements.why.value ? "" : "Pilih alasan perubahan.");
      if (firstErr(f, ["jml", "why"])) return;
      s.stok = +n; if (save()) { dlg.close(); note("Stok " + s.nama.replace(/ \(.*\)/, "") + " diperbarui menjadi " + s.stok + "."); render(); }
    });
  }
  function addStokDialog() {
    openDlg('<form novalidate><h2 id="dlg-t">Tambah barang</h2>' + field("nm", "Nama barang", '<input id="nm" name="nm" autocomplete="off">') + field("jml", "Jumlah stok", '<input id="jml" name="jml" type="number" inputmode="numeric" min="0" value="0">') +
      field("mn", "Stok minimum", '<input id="mn" name="mn" type="number" inputmode="numeric" min="0" value="' + D.set.minDef + '">') + field("hg", "Harga satuan (Rp)", '<input id="hg" name="hg" type="number" inputmode="numeric" min="0">') +
      '<div class="acts"><button class="btn" type="submit">Simpan barang</button><button class="btn sec" type="button" data-close>Batal</button></div></form>', function (f) {
      var ok = function (n) { return /^\d+$/.test(f.elements[n].value); };
      fe(f, "nm", f.elements.nm.value.trim() ? "" : "Isi nama barang."); fe(f, "jml", ok("jml") ? "" : "Jumlah stok berupa angka 0 atau lebih."); fe(f, "mn", ok("mn") ? "" : "Stok minimum berupa angka 0 atau lebih."); fe(f, "hg", ok("hg") ? "" : "Isi harga satuan dengan angka.");
      if (firstErr(f, ["nm", "jml", "mn", "hg"])) return;
      var k = "SP-" + String(Math.max.apply(null, D.stok.map(function (x) { return +x.kode.slice(3); })) + 1).padStart(2, "0");
      D.stok.push({ kode: k, nama: f.elements.nm.value.trim(), stok: +f.elements.jml.value, min: +f.elements.mn.value, harga: +f.elements.hg.value });
      if (save()) { dlg.close(); note("Barang " + k + " ditambahkan."); render(); }
    });
  }
  function useDialog() {
    openDlg('<form novalidate><h2 id="dlg-t">Catat pemakaian</h2>' + field("bg", "Barang", '<select id="bg" name="bg"><option value="">Pilih barang</option>' + D.stok.map(function (s) { return '<option value="' + s.kode + '">' + esc(s.nama) + " (stok " + s.stok + ")</option>"; }).join("") + "</select>") +
      field("jml", "Jumlah dipakai", '<input id="jml" name="jml" type="number" inputmode="numeric" min="1" value="1">') +
      '<div class="acts"><button class="btn" type="submit">Catat pemakaian</button><button class="btn sec" type="button" data-close>Batal</button></div></form>', function (f) {
      var s = D.stok.filter(function (x) { return x.kode === f.elements.bg.value; })[0], n = +f.elements.jml.value;
      fe(f, "bg", s ? "" : "Pilih barang."); fe(f, "jml", s && /^\d+$/.test(f.elements.jml.value) && n >= 1 && n <= s.stok ? "" : "Jumlah dipakai berupa angka 1 sampai stok yang tersedia.");
      if (firstErr(f, ["bg", "jml"])) return;
      s.stok -= n; if (save()) { dlg.close(); note("Stok " + s.nama.replace(/ \(.*\)/, "") + " diperbarui menjadi " + s.stok + "."); render(); }
    });
  }

  // ---------- laporan ----------
  function period() {
    return D.res.filter(function (r) { return V.per === "semua" || (V.per === "7" ? r.tgl > addDays(TODAY, -7) && r.tgl <= TODAY : r.tgl.slice(0, 7) === "2026-10"); });
  }
  function laporan() {
    var P = period(), rev = P.filter(counted).reduce(function (a, r) { return a + r.total; }, 0), n = P.filter(counted).length;
    var sel = function (v, t) { return '<option value="' + v + '"' + (V.per === v ? " selected" : "") + ">" + t + "</option>"; };
    var tools = '<div class="bar-tools"><div class="fld"><label for="per">Periode</label><select id="per">' + sel("bulan", "Bulan ini") + sel("7", "7 hari terakhir") + sel("semua", "Semua data") + '</select></div><button class="btn" type="button" id="csv1">Unduh CSV reservasi</button><button class="btn sec" type="button" id="csv2">Unduh CSV stok</button></div>';
    if (!P.length) return head("Laporan") + tools + '<div class="empty"><p>Belum ada data pada periode ini. Pilih periode lain.</p></div>';
    var dates = {}; P.forEach(function (r) { dates[r.tgl] = (dates[r.tgl] || 0) + (r.st === 4 ? 0 : 1); });
    var d1 = Object.keys(dates).sort().map(function (d) { return { l: d.slice(8), v: dates[d] }; }), by = {};
    P.filter(counted).forEach(function (r) { by[r.svc] = (by[r.svc] || 0) + r.total; });
    var d2 = Object.keys(by).map(function (k) { return { l: svcName(k), v: by[k] }; }).sort(function (a, b) { return b.v - a.v; });
    charts.c1 = function (el) { vbar(el, d1, String); }; charts.c2 = function (el) { hbar(el, d2, short); };
    return head("Laporan") + tools +
      '<dl class="cards"><div><dt>Total reservasi</dt><dd>' + P.length + "</dd></div><div><dt>Selesai</dt><dd>" + P.filter(function (r) { return r.st === 3; }).length + "</dd></div><div><dt>Dibatalkan</dt><dd>" + P.filter(function (r) { return r.st === 4; }).length + "</dd></div><div><dt>Pendapatan</dt><dd>" + money.format(rev) + "</dd></div><div><dt>Rata-rata per reservasi</dt><dd>" + money.format(n ? Math.round(rev / n) : 0) + "</dd></div></dl>" +
      '<div class="two"><section class="pn" aria-labelledby="g1"><h2 id="g1">Reservasi per hari</h2><div class="cht" id="c1"></div>' + table("Reservasi per hari", ["Tanggal", "Reservasi"], d1.map(function (x) { return [x.l + " Okt", x.v]; })) + '</section><section class="pn" aria-labelledby="g2"><h2 id="g2">Pendapatan per layanan</h2><div class="cht" id="c2"></div>' + table("Pendapatan per layanan", ["Layanan", "Pendapatan"], d2.map(function (x) { return [esc(x.l), money.format(x.v)]; })) + "</section></div>";
  }
  function csv(name, rows, msg) {
    var t = "﻿" + rows.map(function (r) { return r.map(function (c) { return '"' + String(c).replace(/"/g, '""') + '"'; }).join(","); }).join("\r\n");
    var a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([t], { type: "text/csv;charset=utf-8" })); a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); note("File " + name + " diunduh (" + msg + " baris).");
  }

  // ---------- pengaturan ----------
  function pengaturan() {
    var s = D.set, f = function (id, l, v, t) { return field(id, l, '<input id="' + id + '" name="' + id + '" type="' + (t || "number") + '"' + (t ? "" : ' inputmode="numeric" min="0"') + ' value="' + esc(v) + '" autocomplete="off">'); };
    return head("Pengaturan") + '<section class="pn sett-sec" aria-labelledby="s1"><h2 id="s1">Bengkel (contoh)</h2><form class="sett" id="sf" novalidate>' + f("nama", "Nama bengkel", s.nama, "text") + f("buka", "Jam buka", s.buka) + f("tutup", "Jam tutup", s.tutup) + f("kap", "Kapasitas motor per jam", s.kap) + f("minDef", "Batas stok menipis bila minimum kosong", s.minDef) + '<div><button class="btn" type="submit">Simpan pengaturan</button></div></form></section>' +
      '<section class="pn sett-sec" aria-labelledby="s2"><h2 id="s2">Data demo</h2><p>Semua data contoh tersimpan di peramban ini, bukan di server.</p><button class="btn sec" type="button" id="reset">Reset data contoh</button></section>' +
      '<section class="pn" aria-labelledby="s3"><h2 id="s3">Tentang demo</h2><p>Demo ini dibuat Bikinin Studio untuk menunjukkan aplikasi reservasi dan stok. Aplikasi sungguhan memakai database dan akun pengguna.</p><a class="btn" href="/jasa-aplikasi-web/">Pesan aplikasi serupa</a></section>';
  }

  // ---------- ikatan per tampilan ----------
  function bind(route) {
    var on = function (id, ev, fn) { var el = document.getElementById(id); if (el) el.addEventListener(ev, fn); };
    if (route === "reservasi") {
      drawTable();
      on("add", "click", function () { resDialog(); });
      on("q", "input", function (e) { V.q = e.target.value; V.pg = 1; drawTable(); });
      on("fs", "change", function (e) { V.st = e.target.value; V.pg = 1; drawTable(); });
      on("so", "change", function (e) { V.so = e.target.value; V.pg = 1; drawTable(); });
    }
    if (route === "stok") {
      on("addst", "click", addStokDialog); on("use", "click", useDialog);
      [].forEach.call(document.querySelectorAll("[data-sk]"), function (b) { b.addEventListener("click", function () { stokDialog(b.dataset.sk); }); });
    }
    if (route === "laporan") {
      on("per", "change", function (e) { V.per = e.target.value; render(); $("#per").focus(); });
      on("csv1", "click", function () { csv("reservasi-roda-lestari-2026-10.csv", [["No.", "Tanggal", "Jam", "Pelanggan", "Motor", "Plat", "Layanan", "Total", "Status"]].concat(D.res.map(function (r) { return [r.no, r.tgl, jamTxt(r.jam), r.nama, r.motor, r.plat, r.lay, r.total, STAT[r.st]]; })), D.res.length); });
      on("csv2", "click", function () { csv("stok-roda-lestari-2026-10.csv", [["Kode", "Barang", "Stok", "Minimum", "Harga satuan", "Status stok"]].concat(D.stok.map(function (s) { return [s.kode, s.nama, s.stok, s.min, s.harga, ["Aman", "Menipis", "Habis"][stokSt(s)]]; })), D.stok.length); });
    }
    if (route === "pengaturan") {
      var sf = $("#sf");
      sf.addEventListener("input", function () { dirty = true; });
      sf.addEventListener("submit", function (e) {
        e.preventDefault();
        var g = function (n) { return sf.elements[n].value.trim(); }, bad = [];
        var chk = function (n, ok, m) { fe(sf, n, ok ? "" : m); if (!ok) bad.push(n); };
        chk("nama", g("nama"), "Isi nama bengkel."); chk("buka", /^\d+$/.test(g("buka")) && +g("buka") < 24, "Jam buka berupa angka 0–23.");
        chk("tutup", /^\d+$/.test(g("tutup")) && +g("tutup") > +g("buka") && +g("tutup") <= 24, "Jam tutup berupa angka setelah jam buka."); chk("kap", /^\d+$/.test(g("kap")) && +g("kap") >= 1, "Kapasitas berupa angka 1 atau lebih."); chk("minDef", /^\d+$/.test(g("minDef")), "Batas stok berupa angka 0 atau lebih.");
        if (bad.length) { sf.elements[bad[0]].focus(); return; }
        D.set = { nama: g("nama"), buka: +g("buka"), tutup: +g("tutup"), kap: +g("kap"), minDef: +g("minDef") };
        if (save()) { dirty = false; note("Pengaturan disimpan di peramban ini."); }
      });
      on("reset", "click", function () {
        openDlg('<form><h2 id="dlg-t">Reset data contoh?</h2><p>20 reservasi dan 12 barang kembali ke data awal. Perubahan Anda dihapus.</p><div class="acts"><button class="btn dng" type="submit">Ya, reset</button><button class="btn sec" type="button" data-close>Batal</button></div></form>',
          function () { D = seed(); V.q = ""; V.st = ""; V.pg = 1; save(); dlg.close(); note("Data contoh dikembalikan."); render(); });
      });
    }
    // dialog barang dibuka dari tombol "Ubah stok" ada di stok; fokus judul saat pindah halaman
  }
  window.addEventListener("beforeunload", function (e) { if (dirty) { e.preventDefault(); e.returnValue = "Perubahan belum disimpan. Tinggalkan halaman?"; } });
  var undo = false;
  window.addEventListener("hashchange", function () {
    if (undo) { undo = false; return; }
    if (dirty && !confirm("Perubahan belum disimpan. Tinggalkan halaman?")) { undo = true; history.back(); return; }
    dirty = false; render(); var h = $("#h1"); if (h) h.focus({ preventScroll: false });
  });
  load(); render();
})();
