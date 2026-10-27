// Panel admin Bikinin Studio. Dimuat hanya di /admin/ (bersama supabase-js). Semua data dirender lewat textContent.
(function () {
  "use strict";
  var C = window.BIKININ_CONFIG || {};
  var app = document.getElementById("app");
  var outBtn = document.getElementById("out");
  var live = document.getElementById("live");
  var PER = 25, IDLE_MS = 8 * 3600 * 1000, LAST_KEY = "bkn_admin_last";
  var REVIEW_URL = "https://bikininstudio.github.io/ulasan/?kode=";
  var STATUS = [["baru", "Baru"], ["dihubungi", "Sudah dihubungi"], ["penawaran_dikirim", "Penawaran dikirim"], ["deal", "Deal"], ["dikerjakan", "Sedang dikerjakan"], ["selesai", "Selesai"], ["batal", "Batal"], ["spam", "Spam"]];
  var SLABEL = {}; STATUS.forEach(function (s) { SLABEL[s[0]] = s[1]; });
  var BUDGET = { lt_100rb: "Di bawah Rp 100rb", "100_300rb": "Rp 100–300rb", "300rb_1jt": "Rp 300rb–1jt", "1_3jt": "Rp 1–3jt", "3_10jt": "Rp 3–10jt", gt_10jt: "Di atas Rp 10jt", belum: "Belum ditentukan" };
  var DOC = { penawaran: "Penawaran harga", perjanjian: "Perjanjian kerja", nda: "NDA", invoice: "Invoice" };
  var SEG = { umkm: "UMKM", pelajar: "Pelajar", perusahaan: "Perusahaan", lainnya: "Lainnya" };
  var RLABEL = { menunggu: "Menunggu", disetujui: "Disetujui", ditolak: "Ditolak", disembunyikan: "Disembunyikan" };

  var sb = null, tab = "pesanan", idleTimer = null;
  var ls = { page: 0, status: "", q: "" };

  // ---------- util ----------
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v === false || v == null) return;
      if (k === "class") el.className = v;
      else if (k === "text") el.textContent = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? "" : v);
    });
    (function add(list) {
      list.forEach(function (c) { if (c == null || c === false) return; if (Array.isArray(c)) return add(c); el.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    })(Array.prototype.slice.call(arguments, 2));
    return el;
  }
  function say(t) { live.textContent = ""; setTimeout(function () { live.textContent = t; }, 30); }
  function show() { app.textContent = ""; for (var i = 0; i < arguments.length; i++) if (arguments[i]) app.appendChild(arguments[i]); }
  function fmtTime(s) { if (!s) return "–"; var d = new Date(s); return d.toLocaleString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Asia/Jakarta" }); }
  function fmtDate(s) { if (!s) return "–"; return new Date(s + "T00:00:00").toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }); }
  function rp(n) { return n == null ? "–" : "Rp " + Number(n).toLocaleString("id-ID"); }
  function isNoDb(e) { return !!e && (e.code === "PGRST205" || e.code === "PGRST202" || e.code === "42P01" || e.code === "42883" || /schema cache/i.test(e.message || "")); }
  function isNet(e) { return !!e && (/fetch|network|Retryable/i.test((e.name || "") + " " + (e.message || "")) || e.status === 0); }
  function stBadge(s) { return h("span", { class: "st st-" + s, text: SLABEL[s] || s }); }
  function fail(e) { return isNoDb(e) ? noDb() : errBox(isNet(e) ? "Tidak dapat terhubung. Periksa koneksi, lalu coba lagi." : "Data belum dapat dimuat."); }
  function noDb() {
    return h("section", { class: "adm-card nodb", role: "alert" }, h("h1", { text: "Database belum dipasang" }),
      h("p", { text: "Tabel pesanan dan ulasan belum ada di Supabase. Pemasangan dilakukan pemilik lewat SQL Editor (lihat supabase/README.md), lalu muat ulang halaman ini." }));
  }
  function errBox(msg, retry) {
    return h("section", { class: "adm-card", role: "alert" }, h("p", { class: "msg-err", text: msg }), retry ? h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: retry, text: "Coba lagi" }) : null);
  }
  function copy(text, btn) {
    function done() { say("Tersalin"); if (btn) { var o = btn.textContent; btn.textContent = "Tersalin"; setTimeout(function () { btn.textContent = o; }, 1500); } }
    if (navigator.clipboard && navigator.clipboard.writeText) { navigator.clipboard.writeText(text).then(done, fallback); } else fallback();
    function fallback() {
      var t = h("textarea", { "aria-hidden": "true", style: "position:fixed;left:-9999px" }); t.value = text; document.body.appendChild(t); t.select();
      try { document.execCommand("copy"); done(); } catch (e) {} t.remove();
    }
  }

  // ---------- sesi & tidak aktif ----------
  function stamp() { try { localStorage.setItem(LAST_KEY, String(Date.now())); } catch (e) {} }
  function lastActive() { try { return Number(localStorage.getItem(LAST_KEY)) || 0; } catch (e) { return 0; } }
  var lastStamp = 0;
  function activity() { var n = Date.now(); if (n - lastStamp > 30000) { lastStamp = n; stamp(); } resetIdle(); }
  function resetIdle() { clearTimeout(idleTimer); idleTimer = setTimeout(function () { logout("Sesi berakhir karena tidak aktif. Silakan masuk kembali."); }, IDLE_MS); }
  ["pointerdown", "keydown", "touchstart"].forEach(function (ev) { document.addEventListener(ev, function () { if (sb && !outBtn.hidden) activity(); }, { passive: true }); });
  document.addEventListener("visibilitychange", function () { if (!document.hidden && !outBtn.hidden && Date.now() - lastActive() > IDLE_MS) logout("Sesi berakhir karena tidak aktif. Silakan masuk kembali."); });
  function logout(msg, kind) {
    clearTimeout(idleTimer); outBtn.hidden = true;
    var p = sb ? sb.auth.signOut({ scope: "local" }).catch(function () {}) : Promise.resolve();
    return p.then(function () { loginView(msg, kind); });
  }
  outBtn.addEventListener("click", function () { logout(); });

  // ---------- login ----------
  function loginView(msg, kind) {
    var email = h("input", { id: "em", type: "email", autocomplete: "username", required: true });
    var pw = h("input", { id: "pw", type: "password", autocomplete: "current-password", required: true });
    var err = h("p", { class: kind === "ok" ? "msg-ok" : "msg-err", role: "alert", text: msg || "" });
    var btn = h("button", { class: "btn btn-primary btn-block", type: "submit", text: "Masuk" });
    var form = h("form", { class: "form", novalidate: true },
      h("div", { class: "field" }, h("label", { for: "em", text: "Email" }), email),
      h("div", { class: "field" }, h("label", { for: "pw", text: "Kata sandi" }), pw), btn, err);
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!email.value || !pw.value) { err.className = "msg-err"; err.textContent = "Email atau kata sandi tidak sesuai."; return; }
      btn.disabled = true; btn.textContent = "Memeriksa…"; err.textContent = "";
      sb.auth.signInWithPassword({ email: email.value.trim(), password: pw.value }).then(function (r) {
        if (r.error) {
          btn.disabled = false; btn.textContent = "Masuk"; err.className = "msg-err";
          err.textContent = isNet(r.error) ? "Tidak dapat terhubung. Periksa koneksi, lalu coba lagi." : "Email atau kata sandi tidak sesuai.";
          return;
        }
        stamp(); gate();
      });
    });
    outBtn.hidden = true;
    show(h("section", { class: "adm-card adm-login" }, h("h1", { text: "Masuk" }), form));
    document.title = "Masuk Admin | Bikinin Studio";
    email.focus();
  }

  // ---------- gerbang admin ----------
  function gate() {
    show(h("p", { class: "adm-load", text: "Memeriksa…" }));
    sb.rpc("is_admin").then(function (r) {
      if (r.error) {
        if (isNoDb(r.error)) { outBtn.hidden = false; show(noDb()); return; }
        return logout(isNet(r.error) ? "Tidak dapat terhubung. Periksa koneksi, lalu coba lagi." : "Data belum dapat dimuat.");
      }
      if (r.data !== true) return logout("Akun ini tidak memiliki akses.");
      outBtn.hidden = false; document.title = "Admin | Bikinin Studio"; resetIdle(); main();
    });
  }

  // ---------- kerangka ----------
  function main() {
    var nav = h("nav", { class: "adm-nav", "aria-label": "Bagian admin" });
    var body = h("div");
    var bPes = h("button", { type: "button", onclick: function () { tab = "pesanan"; main(); } }, "Pesanan");
    var bUl = h("button", { type: "button", onclick: function () { tab = "ulasan"; main(); } }, "Ulasan");
    (tab === "pesanan" ? bPes : bUl).setAttribute("aria-current", "true");
    nav.appendChild(bPes); nav.appendChild(bUl);
    show(nav, body);
    if (tab === "pesanan") listView(body, bPes); else reviewsView(body, bUl);
  }

  // ---------- daftar pesanan ----------
  function listView(box, tabBtn) {
    var sel = h("select", { id: "fs", "aria-label": "Filter status" }, h("option", { value: "", text: "Semua status" }));
    STATUS.forEach(function (s) { sel.appendChild(h("option", { value: s[0], text: s[1] })); });
    sel.value = ls.status;
    var q = h("input", { type: "text", id: "fq", placeholder: "Cari nama atau kode", "aria-label": "Cari nama atau kode", value: ls.q, autocomplete: "off" });
    var out = h("div", { "aria-live": "polite" });
    var timer;
    sel.addEventListener("change", function () { ls.status = sel.value; ls.page = 0; load(); });
    q.addEventListener("input", function () { clearTimeout(timer); timer = setTimeout(function () { ls.q = q.value; ls.page = 0; load(); }, 350); });
    var title = h("h1", { text: "Pesanan" });
    box.appendChild(h("div", { class: "adm-h" }, title)); box.appendChild(h("div", { class: "adm-bar" }, q, sel)); box.appendChild(out);
    load();
    sb.from("orders").select("id", { count: "exact", head: true }).eq("status", "baru").then(function (r) {
      if (!r.error && r.count != null) { title.textContent = "Pesanan"; tabBtn.textContent = "Pesanan" + (r.count ? " · Baru (" + r.count + ")" : ""); }
    });
    function load() {
      out.textContent = ""; out.appendChild(h("p", { text: "Memuat pesanan…" }));
      var qq = ls.q.replace(/[,()%*\\:"']/g, " ").trim();
      var qr = sb.from("orders").select("id,kode,created_at,nama,layanan,paket_teks,deadline,status", { count: "exact" }).order("created_at", { ascending: false }).range(ls.page * PER, ls.page * PER + PER - 1);
      if (ls.status) qr = qr.eq("status", ls.status);
      if (qq) qr = qr.or("kode.ilike.%" + qq + "%,nama.ilike.%" + qq + "%");
      qr.then(function (r) {
        out.textContent = "";
        if (r.error) { out.appendChild(isNoDb(r.error) ? noDb() : errBox(isNet(r.error) ? "Tidak dapat terhubung. Periksa koneksi, lalu coba lagi." : "Data belum dapat dimuat.", load)); return; }
        if (!r.data.length) { out.appendChild(h("p", { text: "Belum ada pesanan." })); return; }
        out.appendChild(h("div", { class: "o-head", "aria-hidden": "true" }, h("span", { text: "Kode" }), h("span", { text: "Waktu" }), h("span", { text: "Nama" }), h("span", { text: "Layanan" }), h("span", { text: "Paket" }), h("span", { text: "Tenggat" }), h("span", { text: "Status" })));
        var ul = h("ul", { class: "o-list" });
        r.data.forEach(function (o) {
          ul.appendChild(h("li", null, h("button", { class: "o-row", type: "button", onclick: function () { detailView(o.id); } },
            h("span", { class: "k", text: o.kode }), h("span", { class: "m", text: fmtTime(o.created_at) }), h("span", { text: o.nama }), h("span", { text: o.layanan }),
            h("span", { class: "m", text: o.paket_teks || "–" }), h("span", { class: "m", text: o.deadline ? fmtDate(o.deadline) : "–" }), stBadge(o.status))));
        });
        out.appendChild(ul);
        var pages = Math.max(1, Math.ceil((r.count || 0) / PER));
        var prev = h("button", { class: "btn btn-ghost btn-sm", type: "button", disabled: ls.page === 0, onclick: function () { ls.page--; load(); } }, "Sebelumnya");
        var next = h("button", { class: "btn btn-ghost btn-sm", type: "button", disabled: ls.page + 1 >= pages, onclick: function () { ls.page++; load(); } }, "Berikutnya");
        out.appendChild(h("div", { class: "pager" }, prev, h("p", { text: "Halaman " + (ls.page + 1) + " dari " + pages }), next));
      });
    }
  }

  // ---------- detail pesanan ----------
  function dl(rows) {
    var d = h("dl", { class: "dl-adm" });
    rows.forEach(function (r) { if (r[1] == null || r[1] === "") return; d.appendChild(h("div", null, h("dt", { text: r[0] }), h("dd", null, r[1]))); });
    return d;
  }
  function detailView(id) {
    show(h("p", { class: "adm-load", text: "Memuat pesanan…" }));
    Promise.all([
      sb.from("orders").select("*").eq("id", id).single(),
      sb.from("order_status_history").select("from_status,to_status,changed_by,changed_at").eq("order_id", id).order("changed_at", { ascending: true }),
    ]).then(function (rs) {
      var r = rs[0];
      if (r.error) { show(h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: main, text: "← Kembali" }), fail(r.error)); return; }
      renderDetail(r.data, rs[1].data || []);
    });
  }
  function summary(o) {
    return ["Pesanan " + o.kode, "Nama: " + o.nama, o.usaha ? "Usaha: " + o.usaha : null, "Layanan: " + o.layanan, o.paket_teks ? "Paket: " + o.paket_teks : null,
      o.estimasi != null ? "Estimasi: " + rp(o.estimasi) : null, o.budget ? "Anggaran: " + (BUDGET[o.budget] || o.budget) : null, o.deadline ? "Tenggat: " + fmtDate(o.deadline) : null,
      o.detail ? "Detail: " + o.detail : null, "Status: " + (SLABEL[o.status] || o.status)].filter(Boolean).join("\n");
  }
  function renderDetail(o, hist) {
    var back = h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: main, text: "← Kembali ke daftar" });
    document.title = "Pesanan " + o.kode + " | Bikinin Studio";
    var opsi = o.estimasi_opsi ? "Jumlah " + (o.estimasi_opsi.qty != null ? o.estimasi_opsi.qty : "–") + ", ekspres " + (o.estimasi_opsi.ekspres ? "ya" : "tidak") + ", revisi tambahan " + (o.estimasi_opsi.revisi || 0) : "";
    var ref = null;
    if (o.referensi) ref = /^https?:\/\//i.test(o.referensi) ? h("a", { href: o.referensi, target: "_blank", rel: "noopener noreferrer", text: o.referensi }) : o.referensi;
    var wa = o.kontak_wa ? h("a", { class: "btn btn-primary btn-sm", href: "https://wa.me/" + o.kontak_wa + "?text=" + encodeURIComponent("Halo " + o.nama + ", kami dari Bikinin Studio terkait pesanan " + o.kode + "."), target: "_blank", rel: "noopener noreferrer", text: "Chat WA" }) : null;
    var kontak = h("section", { class: "adm-card" }, h("h2", { text: "Kontak" }),
      o.kontak_wa || o.kontak_email ? dl([["WhatsApp", o.kontak_wa ? "+" + o.kontak_wa : ""], ["Email", o.kontak_email ? h("a", { href: "mailto:" + o.kontak_email, text: o.kontak_email }) : ""]]) : h("p", { text: "Klien tidak mencantumkan kontak balik." }),
      wa ? h("div", { class: "adm-actions" }, wa) : null);
    var need = h("section", { class: "adm-card" }, h("h2", { text: "Kebutuhan" }), dl([
      ["Nama", o.nama], ["Usaha", o.usaha], ["Segmen", SEG[o.segmen] || o.segmen], ["Layanan", o.layanan], ["Paket", o.paket_teks], ["Estimasi", o.estimasi != null ? rp(o.estimasi) : ""], ["Opsi estimasi", opsi],
      ["Anggaran", o.budget ? (BUDGET[o.budget] || o.budget) : ""], ["Tenggat", o.deadline ? fmtDate(o.deadline) : ""], ["Referensi", ref], ["Detail", o.detail],
      ["Halaman asal", o.halaman_asal], ["Dikirim", fmtTime(o.created_at)], ["Persetujuan data", fmtTime(o.consent_at) + " (versi " + o.consent_version + ")"]]));
    var docs = h("section", { class: "adm-card" }, h("h2", { text: "Dokumen diminta" }),
      (o.dokumen_diminta || []).length ? h("ul", { class: "bul" }, (o.dokumen_diminta || []).map(function (d) { return h("li", { text: DOC[d] || d }); })) : h("p", { text: "Tidak ada." }));

    // status + catatan
    var sel = h("select", { id: "st", "aria-label": "Status" }); STATUS.forEach(function (s) { sel.appendChild(h("option", { value: s[0], text: s[1] })); }); sel.value = o.status;
    var note = h("textarea", { id: "cn", maxlength: "4000", rows: "5" }); note.value = o.catatan_admin || "";
    var msg = h("p", { role: "status" });
    var confirmBox = h("div");
    var save = h("button", { class: "btn btn-primary", type: "button", text: "Simpan perubahan" });
    function doSave() {
      confirmBox.textContent = ""; save.disabled = true; msg.className = ""; msg.textContent = "";
      var patch = {};
      if (sel.value !== o.status) patch.status = sel.value;
      if (note.value !== (o.catatan_admin || "")) patch.catatan_admin = note.value || null;
      if (!Object.keys(patch).length) { save.disabled = false; msg.className = "msg-ok"; msg.textContent = "Tidak ada perubahan."; return; }
      sb.from("orders").update(patch).eq("id", o.id).select("*").single().then(function (r) {
        save.disabled = false;
        if (r.error) { sel.value = o.status; note.value = o.catatan_admin || ""; msg.className = "msg-err"; msg.textContent = "Perubahan belum tersimpan. Nilai dikembalikan seperti semula. Coba lagi."; return; }
        say("Tersimpan"); detailView(o.id);
      });
    }
    save.addEventListener("click", function () {
      var risky = (sel.value === "batal" || sel.value === "spam") && sel.value !== o.status;
      if (!risky) return doSave();
      confirmBox.textContent = "";
      confirmBox.appendChild(h("div", { class: "adm-confirm", role: "alertdialog", "aria-label": "Konfirmasi" }, h("p", { text: "Ubah status menjadi " + SLABEL[sel.value] + "? Pesanan ini tidak lagi ditangani." }),
        h("div", { class: "adm-actions" }, h("button", { class: "btn btn-primary btn-sm", type: "button", onclick: doSave, text: "Ya, ubah" }), h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: function () { confirmBox.textContent = ""; sel.value = o.status; }, text: "Batal" }))));
    });
    var statusCard = h("section", { class: "adm-card" }, h("h2", { text: "Status" }), h("div", { class: "field" }, h("label", { for: "st", text: "Status pesanan" }), sel),
      h("h2", { text: "Catatan internal" }), h("div", { class: "field" }, h("label", { for: "cn", class: "sr-only", text: "Catatan internal" }), note),
      h("div", { class: "adm-actions" }, save), confirmBox, msg);

    // ulasan (selesai)
    var link = REVIEW_URL + encodeURIComponent(o.kode);
    var waMsg = (o.nama ? "Halo " + o.nama + "," : "Halo,") + " terima kasih telah memesan di Bikinin Studio. Pesanan Anda (" + o.kode + ") sudah selesai.\nJika berkenan, Anda dapat memberi ulasan di: " + link + "\nUlasan hanya tampil di situs dengan izin Anda, dan isinya tidak kami ubah.";
    var cLink = h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Salin link ulasan" }); cLink.addEventListener("click", function () { copy(link, cLink); });
    var cWa = h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Salin pesan WA ulasan" }); cWa.addEventListener("click", function () { copy(waMsg, cWa); });
    var cSum = h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Salin ringkasan" }); cSum.addEventListener("click", function () { copy(summary(o), cSum); });
    var review = o.status === "selesai" ? h("section", { class: "adm-card" }, h("h2", { text: "Link ulasan" }),
      h("div", { class: "adm-link" }, h("input", { type: "text", readonly: true, value: link, "aria-label": "Link ulasan" }), cLink), h("div", { class: "adm-actions" }, cWa)) : null;

    var histCard = h("section", { class: "adm-card" }, h("h2", { text: "Riwayat" }), hist.length ? h("ol", { class: "hist" }, hist.map(function (x) {
      return h("li", { text: (SLABEL[x.to_status] || x.to_status) + " oleh " + (x.changed_by ? "admin" : "sistem") + " pada " + fmtTime(x.changed_at) });
    })) : h("p", { text: "Belum ada riwayat." }));

    // hapus
    var delBox = h("div");
    var delBtn = h("button", { class: "btn btn-ghost btn-sm", type: "button", text: "Hapus pesanan" });
    delBtn.addEventListener("click", function () {
      delBox.textContent = ""; var m = h("p", { class: "msg-err", role: "alert" });
      var go = h("button", { class: "btn btn-danger btn-sm", type: "button", text: "Hapus permanen" });
      go.addEventListener("click", function () {
        go.disabled = true;
        sb.rpc("admin_hapus_pesanan", { p_order_id: o.id }).then(function (r) {
          if (r.error) { go.disabled = false; m.textContent = isNoDb(r.error) ? "Database belum dipasang." : "Pesanan belum terhapus. Coba lagi."; return; }
          say("Pesanan dihapus"); main();
        });
      });
      delBox.appendChild(h("div", { class: "adm-confirm", role: "alertdialog", "aria-label": "Konfirmasi hapus" }, h("p", { text: "Hapus pesanan " + o.kode + " secara permanen? Ulasan yang terkait ikut terhapus. Tindakan ini tidak dapat dibatalkan." }),
        h("div", { class: "adm-actions" }, go, h("button", { class: "btn btn-ghost btn-sm", type: "button", onclick: function () { delBox.textContent = ""; }, text: "Batal" })), m));
    });
    var delCard = h("section", { class: "adm-card" }, h("h2", { text: "Hapus data" }), h("p", { text: "Untuk permintaan penghapusan data dari klien." }), delBtn, delBox);

    show(back, h("div", { class: "adm-h", style: "margin-top:1rem" }, h("h1", { text: "Pesanan " + o.kode }), stBadge(o.status)),
      h("div", { class: "adm-actions", style: "margin:0 0 1rem" }, cSum), kontak, need, docs, statusCard, review, histCard, delCard);
  }

  // ---------- moderasi ulasan ----------
  var rvStatus = "menunggu";
  function reviewsView(box, tabBtn) {
    var out = h("div", { "aria-live": "polite" });
    var bar = h("div", { class: "adm-nav", role: "group", "aria-label": "Status ulasan" });
    ["menunggu", "disetujui", "ditolak", "disembunyikan"].forEach(function (s) {
      bar.appendChild(h("button", { type: "button", "aria-pressed": String(s === rvStatus), "aria-current": s === rvStatus ? "true" : false, onclick: function () { rvStatus = s; main(); } }, RLABEL[s]));
    });
    box.appendChild(h("div", { class: "adm-h" }, h("h1", { text: rvStatus === "menunggu" ? "Ulasan menunggu" : "Ulasan " + RLABEL[rvStatus].toLowerCase() }))); box.appendChild(bar); box.appendChild(out);
    sb.from("reviews").select("id", { count: "exact", head: true }).eq("status", "menunggu").then(function (r) { if (!r.error && r.count) tabBtn.textContent = "Ulasan · menunggu (" + r.count + ")"; });
    out.appendChild(h("p", { text: "Memuat ulasan…" }));
    sb.from("reviews").select("id,kode,nama,usaha,layanan,rating,teks,izin_tampil,status,created_at").eq("status", rvStatus).order("created_at", { ascending: false }).limit(100).then(function (r) {
      out.textContent = "";
      if (r.error) { out.appendChild(isNoDb(r.error) ? noDb() : errBox(isNet(r.error) ? "Tidak dapat terhubung. Periksa koneksi, lalu coba lagi." : "Data belum dapat dimuat.", main)); return; }
      if (!r.data.length) { out.appendChild(h("p", { text: rvStatus === "menunggu" ? "Tidak ada ulasan menunggu." : "Tidak ada ulasan." })); return; }
      r.data.forEach(function (v) { out.appendChild(reviewCard(v)); });
    });
  }
  function reviewCard(v) {
    var msg = h("p", { role: "status" });
    function setStatus(s, btns) {
      btns.forEach(function (b) { b.disabled = true; });
      sb.from("reviews").update({ status: s }).eq("id", v.id).select("id").single().then(function (r) {
        if (r.error) { btns.forEach(function (b) { b.disabled = false; }); msg.className = "msg-err"; msg.textContent = "Perubahan belum tersimpan. Coba lagi."; return; }
        say("Ulasan " + RLABEL[s].toLowerCase()); main();
      });
    }
    var btns = [];
    function btn(label, s, cls, disabled, desc) {
      var b = h("button", { class: "btn " + cls + " btn-sm", type: "button", disabled: disabled, "aria-describedby": desc || false, text: label });
      b.addEventListener("click", function () { setStatus(s, btns); }); btns.push(b); return b;
    }
    var noteId = "izin-" + v.id;
    var acts = h("div", { class: "adm-actions" });
    if (v.status !== "disetujui") acts.appendChild(btn("Setujui", "disetujui", "btn-primary", !v.izin_tampil, noteId));
    if (v.status === "menunggu") acts.appendChild(btn("Tolak", "ditolak", "btn-ghost"));
    if (v.status === "disetujui") acts.appendChild(btn("Sembunyikan", "disembunyikan", "btn-ghost"));
    return h("article", { class: "adm-card rv" },
      h("h2", { text: v.nama + (v.usaha ? " · " + v.usaha : "") }),
      h("p", { class: "m", text: "Rating " + v.rating + " dari 5 · " + (v.layanan || "–") + " · " + fmtTime(v.created_at) + " · Pesanan " + (v.kode || "–") }),
      h("blockquote", { text: v.teks }),
      h("p", { class: "m", id: noteId, text: v.izin_tampil ? "Klien mengizinkan ulasan ini tampil." : "Klien tidak mengizinkan ulasan ini tampil." }),
      acts, msg);
  }

  // ---------- mulai ----------
  function start() {
    if (!window.supabase || !C.SUPABASE_URL) { show(errBox("Tidak dapat terhubung. Periksa koneksi, lalu coba lagi.", function () { location.reload(); })); return; }
    sb = window.supabase.createClient(C.SUPABASE_URL, C.SUPABASE_ANON_KEY, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false } });
    sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) return loginView();
      if (Date.now() - lastActive() > IDLE_MS) return logout("Sesi berakhir karena tidak aktif. Silakan masuk kembali.");
      gate();
    });
  }
  if (document.readyState === "complete") start(); else window.addEventListener("load", start);
})();
