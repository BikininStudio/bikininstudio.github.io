// Shared config + Google Analytics 4 helper (dipakai halaman utama dan semua demo).
// Google tag GA4 sendiri ditempel di <head> tiap halaman (snippet resmi dari Google).
window.BIKININ = {
  GA_ID: "G-8FHTFV0DZN",     // Catatan saja; yang aktif adalah snippet di <head>
  WA_NUMBER: "6287763292786",
  // URL web app Google Apps Script buat nyatet brief dari form order ke Google Sheets
  // (lihat _tools/apps-script/PASANG-FORM-SHEETS.md). Kosong = form cuma buka WhatsApp, nggak nyatet.
  SHEET_URL: "https://script.google.com/macros/s/AKfycbz6b3PM0d5C6CJizzwkHf4KufsortUaC8jYvsNvYG_swcCErmV6ICw_iIVRtdjObEf0/exec"
};

(function () {
  // Cadangan kalau snippet di <head> diblokir adblock, supaya track() nggak error.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // Event GA4 (click_whatsapp, generate_lead, view_demo, select_tab_harga).
  window.track = function (name, params) { gtag("event", name, params || {}); };

  // Link WhatsApp + penanda sumber, biar order dari web bisa dihitung di chat.
  // Kirim brief ke Google Sheets di belakang layar. sendBeacon tetap jalan walau tab pindah ke WhatsApp,
  // dan kalau gagal nggak ganggu apa-apa (WA tetap kebuka).
  window.sendBrief = function (data) {
    const url = window.BIKININ.SHEET_URL;
    if (!url) return false;
    const body = new URLSearchParams(data);
    try {
      if (window.fetch) { fetch(url, { method: "POST", mode: "no-cors", keepalive: true, body }).catch(() => {}); return true; }
      return navigator.sendBeacon ? navigator.sendBeacon(url, body) : false;
    } catch (e) {
      try { return navigator.sendBeacon(url, body); } catch (e2) { return false; }
    }
  };

  // Versi yang menunggu hasil kirim (dipakai form ulasan: pesan "terima kasih" hanya muncul kalau terkirim).
  // mode no-cors bikin balasan nggak bisa dibaca, tapi gagal jaringan (offline, URL mati, diblokir) tetap ketahuan.
  window.sendBriefAsync = function (data) {
    const url = window.BIKININ.SHEET_URL;
    if (!url) return Promise.resolve(false);
    const body = new URLSearchParams(data);
    if (!window.fetch) return Promise.resolve(navigator.sendBeacon ? navigator.sendBeacon(url, body) : false);
    return fetch(url, { method: "POST", mode: "no-cors", keepalive: true, body }).then(() => true, () => false);
  };

  // Hitung unduhan company profile (tombol di beranda + link di footer semua halaman)
  document.addEventListener("click", function (e) {
    const a = e.target.closest && e.target.closest('a[href$="company-profile-bikinin-studio.pdf"]');
    if (a) window.track("unduh_company_profile", { lokasi: a.closest("footer") ? "footer" : "beranda" });
  });

  window.waLink = function (text, source) {
    const msg = text + "\n\n(via " + (source || "web") + ")";
    return "https://wa.me/" + window.BIKININ.WA_NUMBER + "?text=" + encodeURIComponent(msg);
  };
})();
