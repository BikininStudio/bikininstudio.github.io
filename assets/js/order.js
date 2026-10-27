// Form brief /pesan/: prefill, validasi, kirim ke Supabase (api.js). Gagal/offline -> WhatsApp tanpa kode.
(function () {
  var form = document.getElementById("brief");
  if (!form) return;
  var $ = function (id) { return document.getElementById(id); };
  var WA = (window.BIKININ_CONFIG && window.BIKININ_CONFIG.WA_NUMBER) || "6287763292786";
  var tStart = Date.now();
  var q = new URLSearchParams(location.search);
  var pk = {}; try { JSON.parse($("paket-data").textContent).forEach(function (p) { pk[p.id] = p; }); } catch (e) {}
  var started = false;

  // ---- Prefill ----
  var svc = q.get("layanan"), paket = pk[q.get("paket")];
  if (paket && !svc) svc = paket.service;
  if (svc && $("layanan").querySelector('option[value="' + svc + '"]')) $("layanan").value = svc;
  if (paket) $("paket_teks").value = paket.name;
  var est = parseInt(q.get("estimasi"), 10), estOpsi = null;
  if (est > 0) {
    var f = form.querySelector("[data-est]"); f.hidden = false;
    $("estimasi_t").value = "mulai Rp " + est.toLocaleString("id-ID");
    estOpsi = { qty: parseInt(q.get("qty"), 10) || 1, ekspres: q.get("ekspres") === "1", revisi: parseInt(q.get("revisi"), 10) || 0 };
  }
  var today = new Date(); today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
  var todayStr = today.toISOString().slice(0, 10);
  $("deadline").min = todayStr;
  form.addEventListener("focusin", function () { if (!started) { started = true; track("brief_started"); } }, { once: true });

  // ---- Util ----
  var fieldMsg = { nama: "Nama wajib diisi, 2–80 karakter.", segmen: "Pilih segmen Anda.", layanan: "Pilih layanan yang Anda butuhkan.", deadline: "Tanggal tenggat tidak boleh sebelum hari ini.", referensi: "Tulis alamat lengkap yang diawali https://.", detail: "Detail maksimal 2000 karakter.", kontak: "Masukkan nomor WhatsApp atau alamat email yang benar.", setuju: "Centang persetujuan agar brief dapat kami catat." };
  var order = ["nama", "usaha", "segmen", "layanan", "paket_teks", "budget", "deadline", "referensi", "detail", "kontak", "setuju"];
  function setErr(id, msg) {
    var e = $(id + "-e"), el = $(id);
    if (!e) return;
    if (msg) { e.hidden = false; e.querySelector("span").textContent = msg; if (el) el.setAttribute("aria-invalid", "true"); }
    else { e.hidden = true; if (el) el.removeAttribute("aria-invalid"); }
  }
  function val(id) { return ($(id).value || "").trim(); }
  function validate() {
    var errs = {};
    var n = val("nama"); if (n.length < 2 || n.length > 80) errs.nama = fieldMsg.nama;
    if (!val("segmen")) errs.segmen = fieldMsg.segmen;
    if (!val("layanan")) errs.layanan = fieldMsg.layanan;
    var d = val("deadline"); if (d && d < todayStr) errs.deadline = fieldMsg.deadline;
    var r = val("referensi"); if (r && !/^https?:\/\/\S+\.\S+/i.test(r)) errs.referensi = fieldMsg.referensi;
    if (val("detail").length > 2000) errs.detail = fieldMsg.detail;
    var k = val("kontak"); if (k && !(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(k) || /^(\+?62|0)[\d\s-]{8,16}$/.test(k))) errs.kontak = fieldMsg.kontak;
    if (!$("setuju").checked) errs.setuju = fieldMsg.setuju;
    return errs;
  }
  function showErrs(errs) {
    order.forEach(function (id) { setErr(id, errs[id]); });
    var keys = order.filter(function (id) { return errs[id]; });
    var box = $("summary");
    if (!keys.length) { box.hidden = true; return false; }
    box.hidden = false;
    box.innerHTML = "Ada " + keys.length + " isian yang perlu diperbaiki. Fokus kami pindahkan ke isian pertama yang salah.<ul>" + keys.map(function (k) { return '<li><a href="#' + k + '">' + errs[k].replace(/</g, "&lt;") + "</a></li>"; }).join("") + "</ul>";
    var first = $(keys[0]); if (first) first.focus(); else box.focus();
    track("brief_error", { jenis: "validasi" });
    return true;
  }
  var label = function (id) { var s = $(id); return s.selectedIndex > 0 || s.value ? s.options[s.selectedIndex].text : ""; };
  function dokLabels() { return [].map.call(form.querySelectorAll('input[name="dokumen"]:checked'), function (c) { return c.parentNode.textContent.trim(); }); }
  function summary(kode) {
    var L = ["Halo Bikinin Studio, saya ingin memesan."];
    if (kode) L.push("Kode pesanan: " + kode);
    L.push("Nama: " + val("nama"));
    if (val("usaha")) L.push("Usaha/instansi: " + val("usaha"));
    L.push("Layanan: " + label("layanan") + (val("paket_teks") ? " · Paket: " + val("paket_teks") : ""));
    if (est > 0) L.push("Estimasi kalkulator: " + $("estimasi_t").value);
    var ab = [val("budget") ? "Anggaran: " + label("budget") : "", val("deadline") ? "Tenggat: " + val("deadline") : ""].filter(Boolean).join(" · ");
    if (ab) L.push(ab);
    if (val("referensi")) L.push("Referensi: " + val("referensi"));
    if (val("detail")) { var dt = val("detail"); L.push("Detail: " + (dt.length > 600 ? dt.slice(0, 600) + "…" : dt) + (kode ? " (detail lengkap sudah tercatat)" : "")); }
    var dk = dokLabels(); if (dk.length) L.push("Dokumen: " + dk.join(", "));
    if (val("kontak")) L.push("Kontak: " + val("kontak"));
    return L.join("\n");
  }
  var waUrl = function (t) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(t); };

  function fallback(msg, kind) {
    var url = waUrl(summary(null));
    var n = $("fallback");
    n.hidden = false;
    n.innerHTML = "";
    var p = document.createElement("p"); p.textContent = msg; n.appendChild(p);
    var a = document.createElement("a"); a.className = "btn btn-primary"; a.href = url; a.target = "_blank"; a.rel = "noopener"; a.textContent = "Buka WhatsApp"; a.setAttribute("data-wa", "brief-fallback");
    n.appendChild(a);
    track("brief_error", { jenis: kind });
    try { window.open(url, "_blank", "noopener"); } catch (e) {}
    n.focus && n.setAttribute("tabindex", "-1"); n.focus();
  }

  var sending = false;
  form.addEventListener("input", function (e) { var id = e.target.id; if (id && $(id + "-e") && !$(id + "-e").hidden) setErr(id, ""); });
  form.addEventListener("submit", function (ev) {
    ev.preventDefault();
    if (sending) return;
    if (showErrs(validate())) return;
    $("fallback").hidden = true;
    if (navigator.onLine === false) { fallback("Koneksi terputus. Anda tetap dapat mengirim lewat WhatsApp.", "offline"); return; }
    var btn = $("send");
    sending = true; btn.textContent = "Mengirim…"; btn.setAttribute("aria-disabled", "true"); btn.disabled = true;
    var k = val("kontak");
    var payload = {
      nama: val("nama"), usaha: val("usaha"), segmen: val("segmen"), layanan: val("layanan"), paket_teks: val("paket_teks"),
      budget: val("budget") || undefined, deadline: val("deadline") || undefined, referensi: val("referensi") || undefined, detail: val("detail"),
      dokumen: [].map.call(form.querySelectorAll('input[name="dokumen"]:checked'), function (c) { return c.value; }),
      halaman: location.pathname, setuju: true, consent_version: "2026-10-25", t_start: tStart, kode_cadangan: $("kode_cadangan").value,
    };
    if (est > 0) { payload.estimasi = est; payload.estimasi_opsi = estOpsi; }
    if (k) { if (k.indexOf("@") > -1) payload.kontak_email = k; else payload.kontak_wa = k; }
    var utm = {}; ["utm_source", "utm_medium", "utm_campaign"].forEach(function (u) { if (q.get(u)) utm[u] = q.get(u); }); if (Object.keys(utm).length) payload.utm = utm;
    window.BikininAPI.submitBrief(payload).then(function (r) {
      sending = false; btn.disabled = false; btn.removeAttribute("aria-disabled"); btn.textContent = "Kirim brief";
      if (r.ok && r.kode) {
        var text = summary(r.kode);
        try { sessionStorage.setItem("bikinin_brief", JSON.stringify({ kode: r.kode, wa: text })); } catch (e) {}
        track("brief_submitted", { layanan: payload.layanan });
        try { window.open(waUrl(text), "_blank", "noopener"); } catch (e) {}
        location.href = "/pesan/terkirim/?kode=" + encodeURIComponent(r.kode);
        return;
      }
      if (r.status === 400 && r.fields) {
        var map = { kontak_wa: "kontak", kontak_email: "kontak", paket_teks: "paket_teks", estimasi: "", budget: "budget" }, errs = {};
        Object.keys(r.fields).forEach(function (f) { var id = f in map ? map[f] : f; if (id && $(id)) errs[id] = r.fields[f]; });
        if (!Object.keys(errs).length) errs.nama = r.error || "Periksa kembali isian Anda.";
        showErrs(errs); return;
      }
      if (r.status === 429) { fallback("Terlalu banyak percobaan dalam waktu singkat. Coba lagi beberapa menit lagi, atau kirim lewat WhatsApp.", "batas"); return; }
      if (r.ok && !r.kode) { fallback("Brief belum tersimpan di sistem kami, tetapi Anda tetap dapat mengirimnya lewat WhatsApp.", "server"); return; }
      fallback("Brief belum tersimpan di sistem kami, tetapi Anda tetap dapat mengirimnya lewat WhatsApp.", "server");
    });
  });
})();
