// Shared behaviour for the inner pages (S&K, privasi, studi kasus): WhatsApp links, mobile nav, year.
// Needs assets/analytics.js loaded first (waLink, track).
(function () {
  const WA_DEFAULT = "Halo Bikinin Studio, saya mau tanya-tanya soal jasa desain.";
  document.querySelectorAll("[data-wa]").forEach((a) => {
    const loc = a.dataset.wa || "lainnya";
    a.href = waLink(a.dataset.waText || WA_DEFAULT);
    a.target = "_blank";
    a.rel = "noopener";
    a.addEventListener("click", () => track("click_whatsapp", { lokasi: loc }));
  });

  const toggle = document.querySelector(".nav-toggle");
  const nav = document.getElementById("nav");
  if (toggle && nav) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
})();
