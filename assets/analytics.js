// Shared config + Google Analytics 4 helper (dipakai halaman utama dan semua demo).
// Google tag GA4 sendiri ditempel di <head> tiap halaman (snippet resmi dari Google).
window.BIKININ = {
  GA_ID: "G-8FHTFV0DZN",     // Catatan saja; yang aktif adalah snippet di <head>
  WA_NUMBER: "6287763292786"
};

(function () {
  // Cadangan kalau snippet di <head> diblokir adblock, supaya track() nggak error.
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };

  // Event GA4 (click_whatsapp, generate_lead, view_demo, select_tab_harga).
  window.track = function (name, params) { gtag("event", name, params || {}); };

  // Link WhatsApp + penanda sumber, biar order dari web bisa dihitung di chat.
  window.waLink = function (text, source) {
    const msg = text + "\n\n(via " + (source || "web") + ")";
    return "https://wa.me/" + window.BIKININ.WA_NUMBER + "?text=" + encodeURIComponent(msg);
  };
})();
