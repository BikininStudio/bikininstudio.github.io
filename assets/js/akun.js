// Akun klien Bikinin Studio: masuk, daftar, atur ulang sandi, dan halaman "Akun saya" (pantau pesanan).
// Memakai supabase-js (sama dengan panel admin). Semua data dari server ditulis dengan textContent (tanpa innerHTML).
(function () {
  "use strict";
  var C = window.BIKININ_CONFIG || {};
  var doc = document;
  var host = doc.querySelector("[data-akun-page]");
  if (!host) return;
  var page = host.getAttribute("data-akun-page");
  var CONSENT = "akun-1";
  var EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
  var WA = C.WA_NUMBER || "6287763292786";

  function $(id) { return doc.getElementById(id); }
  function el(tag, attrs, kids) {
    var e = doc.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) { if (k === "text") e.textContent = attrs[k]; else if (k === "class") e.className = attrs[k]; else e.setAttribute(k, attrs[k]); });
    (kids || []).forEach(function (c) { e.appendChild(typeof c === "string" ? doc.createTextNode(c) : c); });
    return e;
  }
  function wa(text) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text); }

  var sb = null;
  function client() {
    if (sb) return sb;
    if (!window.supabase || !C.SUPABASE_URL || !C.SUPABASE_ANON_KEY) return null;
    sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    return sb;
  }

  // ---------- pesan & galat ----------
  var MSG = {
    kosong: "Kolom ini perlu diisi.",
    email: "Format email belum sesuai. Contoh: nama@email.com",
    lemah: "Kata sandi belum cukup kuat. Gunakan minimal 10 karakter dengan gabungan huruf dan angka.",
    beda: "Kedua kata sandi belum sama. Periksa kembali.",
    masuk: "Email atau kata sandi tidak sesuai. Periksa kembali, atau atur ulang kata sandi.",
    belumKonfirmasi: "Email Anda belum dikonfirmasi. Periksa kotak masuk dan folder spam, lalu buka tautan konfirmasinya.",
    banyak: "Terlalu banyak percobaan. Coba lagi beberapa menit lagi.",
    umum: "Terjadi kendala. Coba lagi sebentar lagi, atau hubungi kami lewat WhatsApp 0877-6329-2786.",
    sesi: "Sesi Anda berakhir. Silakan masuk kembali.",
    daftarOk: "Permintaan diterima. Periksa email Anda untuk langkah berikutnya. Jika belum terlihat, cek folder spam.",
    lupaOk: "Jika email tersebut terdaftar, tautan pengaturan ulang sudah dikirim. Periksa kotak masuk dan folder spam. Tautan berlaku terbatas.",
    tidakAda: "Layanan akun belum tersedia saat ini. Silakan hubungi kami lewat WhatsApp 0877-6329-2786.",
    jaringan: "Koneksi bermasalah. Periksa jaringan Anda, lalu coba lagi.",
    sandiSama: "Gunakan kata sandi yang berbeda dari kata sandi sebelumnya.",
    tautanMati: "Tautan konfirmasi ini tidak berlaku lagi. Silakan daftar ulang atau atur ulang kata sandi untuk mendapatkan tautan baru.",
  };
  function notice(text, kind) {
    var n = $("status"); if (!n) return;
    n.textContent = text; n.className = "notice" + (kind ? " " + kind : ""); n.hidden = false; n.focus();
  }
  var firstBad = null;
  function clearErrs(form) {
    firstBad = null;
    [].forEach.call(form.querySelectorAll(".err"), function (e) { e.hidden = true; e.querySelector("span").textContent = ""; });
    [].forEach.call(form.querySelectorAll("[aria-invalid]"), function (i) { i.removeAttribute("aria-invalid"); });
    var n = $("status"); if (n) n.hidden = true;
  }
  function fieldErr(id, text) {
    var e = $(id + "-e"), i = $(id);
    if (e) { e.querySelector("span").textContent = text; e.hidden = false; }
    if (i) {
      i.setAttribute("aria-invalid", "true");
      var d = (i.getAttribute("aria-describedby") || "").split(" ").filter(Boolean);
      if (d.indexOf(id + "-e") < 0) d.push(id + "-e");
      i.setAttribute("aria-describedby", d.join(" "));
      if (!firstBad) { firstBad = i; setTimeout(function () { if (firstBad) firstBad.focus(); }, 0); }
    }
  }
  function strong(p) { return p.length >= 10 && /[A-Za-z]/.test(p) && /[0-9]/.test(p); }
  function normWa(v) {
    var d = String(v || "").replace(/\D/g, "");
    if (!d) return "";
    if (d.indexOf("0") === 0) d = "62" + d.slice(1);
    return /^62[0-9]{8,13}$/.test(d) ? d : null;
  }
  function busy(btn, on, label) { if (on) btn.setAttribute("aria-disabled", "true"); else btn.removeAttribute("aria-disabled"); if (label) btn.textContent = on ? label[0] : label[1]; }
  function isBusy(f) { var b = f.querySelector("button[type=submit]"); return b && b.getAttribute("aria-disabled") === "true"; }
  function nextUrl() {
    var m = /[?&]next=([^&]+)/.exec(location.search);
    if (!m) return "/akun/";
    var v = ""; try { v = decodeURIComponent(m[1]); } catch (e) {}
    return /^\/[A-Za-z0-9\-_/]*$/.test(v) && v.indexOf("//") !== 0 ? v : "/akun/";
  }
  function isRate(err) { return err && (err.status === 429 || /rate limit|too many/i.test(err.message || "")); }

  // tombol tampilkan/sembunyikan kata sandi
  doc.addEventListener("click", function (e) {
    var b = e.target.closest && e.target.closest(".pw-toggle"); if (!b) return;
    var i = $(b.getAttribute("data-for")); if (!i) return;
    var show = i.type === "password"; i.type = show ? "text" : "password";
    b.textContent = show ? "Sembunyikan" : "Tampilkan"; b.setAttribute("aria-label", (show ? "Sembunyikan " : "Tampilkan ") + (b.getAttribute("data-label") || "kata sandi"));
  });

  // ---------- masuk ----------
  function initMasuk() {
    var f = $("f-masuk"); f.hidden = false;
    var hashGalat = /error_code=|error=access_denied/.test(location.hash);
    if (hashGalat) notice(MSG.tautanMati, "err");
    else if (/[?&]terverifikasi=1/.test(location.search)) notice("Email Anda sudah dikonfirmasi. Silakan masuk.", "ok");
    if (/access_token=/.test(location.hash)) { var c0 = client(); if (c0) c0.auth.signOut({ scope: "local" }).then(function () { history.replaceState(null, "", location.pathname + location.search); }); }
    if (/[?&]sandi=1/.test(location.search)) notice("Kata sandi diperbarui. Silakan masuk.", "ok");
    // Sudah masuk? Langsung ke tujuan, tidak perlu mengetik ulang
    var c1 = client();
    if (c1 && !hashGalat && !/access_token=/.test(location.hash)) c1.auth.getSession().then(function (r) { if (r.data && r.data.session) location.replace(nextUrl()); }).catch(function () {});
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); if (isBusy(f)) return; clearErrs(f);
      var email = $("email").value.trim().toLowerCase(), pass = $("sandi").value, ok = true;
      if (!email) { fieldErr("email", MSG.kosong); ok = false; } else if (!EMAIL_RE.test(email)) { fieldErr("email", MSG.email); ok = false; }
      if (!pass) { fieldErr("sandi", MSG.kosong); ok = false; }
      if (!ok) return;
      var c = client(); if (!c) return notice(MSG.tidakAda, "err");
      var btn = f.querySelector("button[type=submit]"); busy(btn, true, ["Memeriksa…", "Masuk"]);
      c.auth.signInWithPassword({ email: email, password: pass }).then(function (r) {
        busy(btn, false, ["", "Masuk"]);
        if (r.error) {
          if (isRate(r.error)) return notice(MSG.banyak, "err");
          if (/not confirmed/i.test(r.error.message || "")) return notice(MSG.belumKonfirmasi, "err");
          if (/invalid login|invalid credentials/i.test(r.error.message || "") || r.error.status === 400) return notice(MSG.masuk, "err");
          return notice(MSG.umum, "err");
        }
        location.assign(nextUrl());
      }).catch(function () { busy(btn, false, ["", "Masuk"]); notice(MSG.umum, "err"); });
    });
  }

  // ---------- daftar ----------
  function initDaftar() {
    var f = $("f-daftar"); f.hidden = false;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); if (isBusy(f)) return; clearErrs(f);
      var nama = $("nama").value.trim(), email = $("email").value.trim().toLowerCase(), pass = $("sandi").value, waRaw = $("wa").value.trim(), ok = true;
      if (nama.length < 2 || nama.length > 80) { fieldErr("nama", nama ? "Nama 2–80 karakter." : MSG.kosong); ok = false; }
      if (!email) { fieldErr("email", MSG.kosong); ok = false; } else if (!EMAIL_RE.test(email)) { fieldErr("email", MSG.email); ok = false; }
      if (!strong(pass)) { fieldErr("sandi", MSG.lemah); ok = false; }
      var waN = normWa(waRaw); if (waN === null) { fieldErr("wa", "Nomor WhatsApp belum sesuai. Contoh: 0877xxxxxxx"); ok = false; }
      if (!$("setuju").checked) { var e = $("setuju-e"); e.querySelector("span").textContent = "Centang persetujuan untuk melanjutkan."; e.hidden = false; ok = false; }
      if (!ok) return;
      var c = client(); if (!c) return notice(MSG.tidakAda, "err");
      var btn = f.querySelector("button[type=submit]"); busy(btn, true, ["Membuat akun…", "Daftar"]);
      c.auth.signUp({ email: email, password: pass, options: { emailRedirectTo: location.origin + "/masuk/?terverifikasi=1", data: { nama: nama, kontak_wa: waN || "", consent_version: CONSENT } } }).then(function (r) {
        busy(btn, false, ["", "Daftar"]);
        if (r.error) {
          if (isRate(r.error)) return notice(MSG.banyak, "err");
          if (/password/i.test(r.error.message || "")) return fieldErr("sandi", MSG.lemah);
          return notice(MSG.umum, "err");
        }
        f.reset();
        notice(MSG.daftarOk, "ok"); // pesan sama untuk email baru maupun yang sudah terdaftar
      }).catch(function () { busy(btn, false, ["", "Daftar"]); notice(MSG.umum, "err"); });
    });
  }

  // ---------- lupa sandi ----------
  function initLupa() {
    var f = $("f-lupa"); f.hidden = false;
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); if (isBusy(f)) return; clearErrs(f);
      var email = $("email").value.trim().toLowerCase();
      if (!email) return fieldErr("email", MSG.kosong);
      if (!EMAIL_RE.test(email)) return fieldErr("email", MSG.email);
      var c = client(); if (!c) return notice(MSG.tidakAda, "err");
      var btn = f.querySelector("button[type=submit]"); busy(btn, true, ["Mengirim…", "Kirim tautan"]);
      c.auth.resetPasswordForEmail(email, { redirectTo: location.origin + "/atur-ulang-sandi/" }).then(function (r) {
        busy(btn, false, ["", "Kirim tautan"]);
        if (r.error && isRate(r.error)) return notice(MSG.banyak, "err");
        notice(MSG.lupaOk, "ok"); // selalu sama, apa pun hasilnya
      }).catch(function () { busy(btn, false, ["", "Kirim tautan"]); notice(MSG.jaringan, "err"); });
    });
  }

  // ---------- atur ulang sandi (dari tautan email) ----------
  function initAtur() {
    var f = $("f-atur"), c = client();
    if (!c) return notice(MSG.tidakAda, "err");
    var shown = false;
    function showForm() { if (shown) return; shown = true; f.hidden = false; $("sandi").focus(); }
    function expired() { if (shown) return; notice("Tautan ini tidak berlaku lagi. Minta tautan baru.", "err"); $("atur-ulang").hidden = false; }
    c.auth.onAuthStateChange(function (event) { if (event === "PASSWORD_RECOVERY") showForm(); });
    c.auth.getSession().then(function (r) { if (r.data && r.data.session && /type=recovery|access_token/.test(location.hash + location.search)) showForm(); });
    setTimeout(expired, 4000);
    f.addEventListener("submit", function (ev) {
      ev.preventDefault(); if (isBusy(f)) return; clearErrs(f);
      var p1 = $("sandi").value, p2 = $("sandi2").value, ok = true;
      if (!strong(p1)) { fieldErr("sandi", MSG.lemah); ok = false; }
      if (p1 !== p2) { fieldErr("sandi2", MSG.beda); ok = false; }
      if (!ok) return;
      var btn = f.querySelector("button[type=submit]"); busy(btn, true, ["Menyimpan…", "Simpan kata sandi"]);
      c.auth.updateUser({ password: p1 }).then(function (r) {
        busy(btn, false, ["", "Simpan kata sandi"]);
        if (r.error) {
          var m = String(r.error.message || "");
          if (isRate(r.error)) return notice(MSG.banyak, "err");
          if (/different from the old|same as the old/i.test(m)) return notice(MSG.sandiSama, "err");
          if (/password/i.test(m)) return notice(MSG.lemah, "err");
          return notice(MSG.umum, "err");
        }
        c.auth.signOut({ scope: "global" }).then(function () { location.assign("/masuk/?sandi=1"); });
      }).catch(function () { busy(btn, false, ["", "Simpan kata sandi"]); notice(MSG.jaringan, "err"); });
    });
  }

  // ---------- akun saya ----------
  var STATUS = {
    baru: ["Brief diterima", "Brief Anda sudah masuk. Kami akan menghubungi lewat WhatsApp untuk mengonfirmasi lingkup dan harga."],
    dihubungi: ["Sedang dikonfirmasi", "Kami sudah menghubungi Anda lewat WhatsApp untuk mengonfirmasi lingkup dan harga."],
    penawaran_dikirim: ["Penawaran dikirim", "Penawaran tertulis sudah kami kirim. Kami menunggu persetujuan Anda."],
    deal: ["Menunggu DP", "Lingkup dan harga sudah disepakati. Menunggu DP 50%."],
    dikerjakan: ["Dikerjakan", "DP sudah kami konfirmasi. Pesanan Anda sedang dikerjakan."],
    menunggu_revisi: ["Menunggu tanggapan Anda", "Draf sudah kami kirim. Kami menunggu masukan Anda lewat WhatsApp."],
    menunggu_pelunasan: ["Menunggu pelunasan", "Revisi disetujui. File final dikirim setelah pelunasan."],
    selesai: ["Selesai", "Pesanan selesai dan file final sudah dikirim."],
    batal: ["Dibatalkan", "Pesanan dihentikan."],
  };
  var BUDGET = { lt_100rb: "Di bawah Rp 100rb", "100_300rb": "Rp 100rb – 300rb", "300rb_1jt": "Rp 300rb – 1jt", "1_3jt": "Rp 1jt – 3jt", "3_10jt": "Rp 3jt – 10jt", gt_10jt: "Di atas Rp 10jt", belum: "Belum tahu" };
  function tgl(s) { try { return new Date(s).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }); } catch (e) { return s || ""; } }
  function mulai(n) {
    n = Number(n);
    if (n >= 1000000) { var j = n / 1000000; return "Mulai Rp " + (j % 1 ? j.toFixed(1).replace(".", ",") : j) + "jt"; }
    return "Mulai Rp " + Math.round(n / 1000) + "rb";
  }
  function sLabel(k) { return (STATUS[k] || ["Status diperbarui"])[0]; }

  function initAkun() {
    var root = $("akun-isi"), c = client();
    if (!c) { root.textContent = ""; root.appendChild(el("p", { class: "notice err", text: MSG.tidakAda })); return; }
    c.auth.getSession().then(function (r) {
      var session = r.data && r.data.session;
      if (!session) return location.replace("/masuk/?next=/akun/");
      var uid = session.user.id, email = session.user.email || "";
      Promise.all([
        c.from("client_profiles").select("nama,kontak_wa").eq("user_id", uid).maybeSingle(),
        c.from("klien_pesanan").select("*").order("created_at", { ascending: false }),
        c.from("klien_riwayat").select("*").order("changed_at", { ascending: true }),
      ]).then(function (res) {
        if (res[1].error && /jwt|token|expired/i.test(res[1].error.message || "")) return c.auth.signOut({ scope: "local" }).then(function () { location.replace("/masuk/?next=/akun/"); });
        render(root, c, email, res[0].data || {}, res[1].data || [], res[2].data || [], !!res[1].error);
      }).catch(function () { root.textContent = ""; root.appendChild(el("p", { class: "notice err", text: MSG.umum })); });
    });
  }

  function dl(rows) {
    var d = el("dl", { class: "ord-dl" });
    rows.forEach(function (r) { if (r[1] === null || r[1] === undefined || r[1] === "") return; d.appendChild(el("dt", { text: r[0] })); d.appendChild(el("dd", { text: String(r[1]) })); });
    return d;
  }

  function render(root, c, email, prof, orders, hist, loadErr) {
    root.textContent = "";
    var live = $("akun-live"); if (live) live.textContent = "Pesanan dimuat: " + orders.length + " pesanan.";
    var nama = prof.nama || "";
    root.appendChild(el("h2", { class: "sec-h", text: prof.nama ? "Halo, " + nama : "Halo!" }));
    if (loadErr) root.appendChild(el("p", { class: "notice err", text: "Pesanan belum dapat dimuat. Coba muat ulang halaman." }));

    var bar = el("div", { class: "btn-row" }, [
      el("a", { class: "btn btn-primary", href: "/pesan/", text: "Kirim brief baru" }),
      el("a", { class: "btn btn-ghost", href: "/layanan/", text: "Lihat layanan" }),
    ]);
    root.appendChild(bar);

    root.appendChild(el("h2", { class: "sec-h", text: "Pesanan saya" }));
    if (!orders.length) {
      root.appendChild(el("p", { class: "note", text: "Belum ada pesanan. Setelah Anda mengirim brief, pesanan akan muncul di sini beserta statusnya." }));
    }
    orders.forEach(function (o) {
      var st = STATUS[o.status] || ["Status diperbarui", ""];
      var det = el("div", { class: "ord-det", hidden: "" });
      var h = hist.filter(function (x) { return x.kode === o.kode; });
      var ul = el("ul", { class: "hist" });
      h.forEach(function (x) { ul.appendChild(el("li", {}, [el("strong", { text: sLabel(x.to_status) }), " · " + tgl(x.changed_at)])); });
      det.appendChild(el("h4", { text: "Status & riwayat" }));
      det.appendChild(h.length ? ul : el("p", { class: "note", text: "Belum ada riwayat." }));
      det.appendChild(el("h4", { text: "Brief saya" }));
      det.appendChild(dl([["Layanan", o.layanan], ["Paket", o.paket_teks], ["Perkiraan awal (bukan penawaran)", o.estimasi !== null && o.estimasi !== undefined ? mulai(o.estimasi) : ""], ["Anggaran", BUDGET[o.budget] || ""], ["Tenggat", o.deadline ? tgl(o.deadline) : ""], ["Referensi", o.referensi], ["Detail", o.detail]]));
      var panelId = "det-" + o.kode.replace(/[^A-Za-z0-9]/g, "");
      det.id = panelId;
      var btn = el("button", { class: "btn btn-ghost", type: "button", "aria-expanded": "false", "aria-controls": panelId, "aria-label": "Lihat detail pesanan " + o.kode, text: "Lihat detail" });
      btn.addEventListener("click", function () { var open = det.hidden; det.hidden = !open; btn.setAttribute("aria-expanded", String(open)); btn.textContent = open ? "Sembunyikan detail" : "Lihat detail"; btn.setAttribute("aria-label", (open ? "Sembunyikan detail pesanan " : "Lihat detail pesanan ") + o.kode); });
      var card = el("article", { class: "card ord" }, [
        el("p", { class: "ord-code", text: o.kode }),
        el("h3", { text: o.layanan }),
        el("p", { class: "ord-meta", text: "Dibuat " + tgl(o.created_at) }),
        el("p", {}, [el("span", { class: "st st-" + o.status, text: st[0] })]),
        el("p", { class: "ord-st", text: st[1] }),
      ]);
      if (o.catatan_klien) card.appendChild(el("p", { class: "ord-note" }, [el("strong", { text: "Catatan dari studio: " }), o.catatan_klien]));
      card.appendChild(btn); card.appendChild(det);
      root.appendChild(card);
    });
    root.appendChild(el("p", { class: "note", text: "Status diperbarui oleh studio. Untuk pembayaran, revisi, dan file final, hubungi kami lewat WhatsApp 0877-6329-2786." }));
    root.appendChild(el("p", {}, [el("a", { class: "btn btn-ghost", href: wa("Halo Bikinin Studio, saya ingin bertanya soal pesanan saya."), target: "_blank", rel: "noopener", text: "Hubungi lewat WhatsApp" })]));

    // profil
    root.appendChild(el("h2", { class: "sec-h", text: "Profil" }));
    var pf = el("form", { class: "form", novalidate: "" });
    pf.appendChild(el("p", { class: "note", text: "Email: " + email }));
    var inN = el("input", { id: "p-nama", type: "text", maxlength: "80", value: prof.nama || "" });
    var inW = el("input", { id: "p-wa", type: "text", maxlength: "20", value: prof.kontak_wa ? "0" + prof.kontak_wa.slice(2) : "" });
    pf.appendChild(el("div", { class: "field" }, [el("label", { for: "p-nama", text: "Nama panggilan atau nama usaha" }), inN]));
    pf.appendChild(el("div", { class: "field" }, [el("label", { for: "p-wa", text: "Nomor WhatsApp (opsional)" }), inW]));
    var pmsg = el("p", { class: "note", role: "status", "aria-live": "polite" });
    var save = el("button", { class: "btn btn-ghost", type: "submit", text: "Simpan profil" });
    pf.appendChild(save); pf.appendChild(pmsg);
    pf.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var n = inN.value.trim(), w = normWa(inW.value.trim());
      if (n.length < 2) { pmsg.textContent = "Nama 2–80 karakter."; return; }
      if (w === null) { pmsg.textContent = "Nomor WhatsApp belum sesuai. Contoh: 0877xxxxxxx"; return; }
      save.disabled = true;
      c.auth.getUser().then(function (u) {
        var id = u.data && u.data.user && u.data.user.id;
        return c.from("client_profiles").update({ nama: n, kontak_wa: w || null }).eq("user_id", id).select("user_id");
      }).then(function (r) { save.disabled = false; pmsg.textContent = !r || r.error || !r.data || !r.data.length ? MSG.umum : "Profil tersimpan."; }).catch(function () { save.disabled = false; pmsg.textContent = MSG.umum; });
    });
    root.appendChild(pf);

    // keluar & hapus akun
    var out = el("button", { class: "btn btn-ghost", type: "button", text: "Keluar" });
    out.addEventListener("click", function () { c.auth.signOut({ scope: "local" }).then(function () { location.assign("/masuk/"); }); });
    root.appendChild(el("div", { class: "btn-row" }, [out]));
    root.appendChild(el("h2", { class: "sec-h", text: "Hapus akun" }));
    root.appendChild(el("p", { class: "note", text: "Anda dapat meminta penghapusan akun dan data terkait. Hubungi kami lewat WhatsApp, lalu kami proses permintaan Anda." }));
    root.appendChild(el("p", {}, [el("a", { class: "btn btn-ghost", href: wa("Halo Bikinin Studio, saya ingin menghapus akun saya dengan email " + email + "."), target: "_blank", rel: "noopener", text: "Minta hapus akun lewat WhatsApp" })]));
  }

  // Cegah ditampilkan di dalam bingkai situs lain dan tampilan usang dari cache setelah Keluar
  if (window.top !== window.self) { doc.documentElement.style.display = "none"; }
  window.addEventListener("pageshow", function (e) { if (e.persisted && page === "akun") location.reload(); });

  var init = { masuk: initMasuk, daftar: initDaftar, lupa: initLupa, atur: initAtur, akun: initAkun }[page];
  if (init) init();
})();
