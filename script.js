// ===== Config (nomor WA & GA_ID ada di assets/analytics.js) =====
const WA_DEFAULT = "Halo Bikinin Studio, saya mau tanya-tanya soal jasa desain.";

// Testimoni asli dari klien (dengan izin). Selama kosong, section testimoni nggak tampil.
// Contoh: { name: "Sari", business: "Kedai Sari", service: "Paket 10 feed", text: "Desainnya rapi..." }
const TESTIMONIALS = [];


// ===== Demo live =====
const DEMOS = {
  feed: { url: "demo/feed-kopi-rindang/", label: "Feed IG Kopi Rindang" },
  ppt: { url: "demo/ppt-fotosintesis/", label: "Slide PPT Fotosintesis" },
  brand: { url: "demo/brand-kit-bikinin/", label: "Brand kit Bikinin Studio" },
  katalog: { url: "demo/katalog-rasa-nusa/", label: "Katalog digital Rasa Nusa" },
  landing: { url: "demo/kopi-rindang/", label: "Landing page Kopi Rindang" },
  compro: { url: "demo/arunika/", label: "Company profile Arunika" },
  app: { url: "demo/kasir-kopi-rindang/", label: "Aplikasi kasir Kopi Rindang" },
  booking: { url: "demo/booking-gentra/", label: "Aplikasi booking Gentra Barbershop" },
  keuangan: { url: "https://bikininstudio.github.io/catatan-keuangan/?demo=1", label: "Aplikasi catatan keuangan (login + database)" },
  ggstore: { url: "studi-kasus/ggstore/", label: "Studi kasus toko GgStore (karya asli)" }
};

// ===== Price list (samain dengan promosi/daftar-harga.md) =====
// Harga perkenalan berlaku untuk sekian klien pertama (juga ditulis di S&K lewat build-pages.js)
const KUOTA_PERKENALAN = 10;
// incl = isi paket yang dijanjikan (revisi, file, waktu); tampil di kartu harga, halaman layanan, dan kalkulator
const PRICES = {
  desain: {
    items: [
      { name: "Feed / poster satuan", desc: "Siap posting di IG & WA", price: "Mulai Rp 15rb", unit: "/desain", incl: "2 revisi · PNG/JPG · 1–2 hari", demo: "feed" },
      { name: "Paket 10 feed", desc: "Hemat buat konten sebulan", price: "Mulai Rp 120rb", featured: "PALING HEMAT", incl: "2 revisi/desain · PNG/JPG + file Canva · 3–5 hari", demo: "feed" },
      { name: "Paket bulanan", desc: "20 post + jadwal posting", price: "Mulai Rp 250rb", incl: "2 revisi/desain · jadwal posting · dikirim bertahap", demo: "feed" },
      { name: "PPT tugas", desc: "Sekolah & kuliah, minimal 10 slide", price: "Mulai Rp 3rb", unit: "/slide", incl: "1 revisi · PPTX + PDF · 1–3 hari", demo: "ppt" },
      { name: "PPT sidang / lomba", desc: "Per deck, desain premium", price: "Mulai Rp 100rb", incl: "3 revisi · PPTX + PDF · 2–4 hari", demo: "ppt" }
    ],
    note: `Harga perkenalan untuk ${KUOTA_PERKENALAN} klien pertama. Revisi tambahan mulai Rp 10rb. Pengerjaan ekspres 1x24 jam +30%.`
  },
  logo: {
    items: [
      { name: "Logo Basic", desc: "Logo simpel buat mulai jualan", price: "Mulai Rp 75rb", incl: "2 konsep · 2 revisi · PNG & JPG · tanpa file vektor", demo: "brand" },
      { name: "Logo Standard", desc: "Siap dipakai di kemasan, spanduk, sampai merek", price: "Mulai Rp 200rb", featured: "REKOMENDASI KAMI", incl: "3 konsep · 3 revisi · file vektor + mini brand guide", demo: "brand" },
      { name: "Logo Premium", desc: "Logo + brand kit + template sosmed", price: "Mulai Rp 500rb", incl: "3 konsep · 5 revisi · file vektor + brand kit", demo: "brand" }
    ],
    note: "Semua logo dibuat dari nol, jadi lebih aman kalau nanti mau didaftarkan sebagai merek."
  },
  katalog: {
    items: [
      { name: "Menu / pricelist", desc: "1–2 halaman", price: "Mulai Rp 35rb", incl: "2 revisi · PNG/PDF · 2–3 hari", demo: "katalog" },
      { name: "Katalog digital", desc: "8–12 halaman, siap share di WA", price: "Mulai Rp 125rb", featured: "REKOMENDASI KAMI", incl: "3 revisi · PDF + gambar per halaman · 3–5 hari", demo: "katalog" },
      { name: "Katalog + menu cetak", desc: "File siap cetak, ukuran bebas", price: "Mulai Rp 200rb", incl: "3 revisi · file siap cetak · 3–5 hari", demo: "katalog" }
    ],
    note: "Bonus 1 desain promo buat status WA untuk setiap paket katalog."
  },
  web: {
    items: [
      { name: "Landing page", desc: "1 halaman, cocok buat promo", price: "Mulai Rp 400rb", incl: "2x revisi besar · ±1 minggu", demo: "landing" },
      { name: "Company profile", desc: "4–6 halaman", price: "Mulai Rp 1jt", featured: "REKOMENDASI KAMI", incl: "3x revisi besar · 2–3 minggu", demo: "compro" },
      { name: "Toko online", desc: "Katalog produk + checkout", price: "Mulai Rp 2jt", incl: "3x revisi besar · 3–4 minggu", demo: "ggstore" },
      { name: "Aplikasi sederhana", desc: "Kasir, booking, atau katalog", price: "Mulai Rp 3jt", incl: "revisi sesuai kesepakatan · 3–6 minggu", demo: ["app", "booking", "keuangan"] }
    ],
    note: "Domain & hosting dibayar terpisah (± Rp 300–800rb/tahun). Maintenance mulai Rp 100rb/bulan. Aplikasi yang lebih kompleks dihitung setelah survei kebutuhan."
  }
};

// ===== Portfolio =====
const WORKS = [
  { src: "ggstore.webp", title: "Toko online GgStore (PrestaShop)", cat: "web", label: "Karya asli", link: "studi-kasus/ggstore/", badge: "Karya asli" },
  { src: "demo-catatan-keuangan.webp", title: "Aplikasi catatan keuangan", cat: "web", label: "Karya sendiri", demo: "keuangan" },
  { src: "demo-booking-gentra.webp", title: "Aplikasi booking Gentra Barbershop", cat: "web", label: "Proyek konsep", demo: "booking" },
  { src: "demo-kasir-kopi-rindang.webp", title: "Aplikasi kasir Kopi Rindang", cat: "web", label: "Proyek konsep", demo: "app", link: "studi-kasus/aplikasi-kasir/" },
  { src: "demo-kopi-rindang.webp", title: "Landing page Kopi Rindang", cat: "web", label: "Proyek konsep", demo: "landing" },
  { src: "demo-arunika.webp", title: "Company profile Arunika Logistik", cat: "web", label: "Proyek konsep", demo: "compro" },
  { src: "demo-katalog-rasa-nusa.webp", title: "Katalog digital Rasa Nusa", cat: "web", label: "Proyek konsep", demo: "katalog" },
  { src: "feed-kopi-rindang.webp", title: "Feed Instagram Kopi Rindang", cat: "feed", label: "Proyek konsep", demo: "feed" },
  { src: "belajar-01.webp", title: "Slide PPT Fotosintesis", cat: "presentasi", label: "Proyek konsep", demo: "ppt" },
  { src: "logo-semua.webp", title: "Logo & brand kit Bikinin Studio", cat: "logo", label: "Karya sendiri", badge: "Karya sendiri", demo: "brand" },
  { src: "logo-kopi-rindang.webp", title: "Logo Kopi Rindang", cat: "logo", label: "Proyek konsep" },
  { src: "logo-gentra-barbershop.webp", title: "Logo Gentra Barbershop", cat: "logo", label: "Proyek konsep" },
  { src: "logo-rasa-nusa.webp", title: "Logo Rasa Nusa", cat: "logo", label: "Proyek konsep" },
  { src: "logo-arunika-logistik.webp", title: "Logo Arunika Logistik", cat: "logo", label: "Proyek konsep" },
  { src: "logo-lipatin-laundry.webp", title: "Logo Lipatin Laundry", cat: "logo", label: "Proyek konsep" },
  { src: "logo-pahamin-les.webp", title: "Logo Pahamin Les Privat", cat: "logo", label: "Proyek konsep" },
  { src: "carousel-promo.webp", title: "Carousel promo Bikinin Studio", cat: "feed", label: "Karya sendiri", badge: "Karya sendiri" },
  { src: "umkm-07.webp", title: "Profil usaha Rasa Nusa", cat: "presentasi", label: "Proyek konsep" },
  { src: "perusahaan-06.webp", title: "Company profile Arunika (slide)", cat: "presentasi", label: "Proyek konsep" }
];
const CAT_NAME = { feed: "Feed IG", presentasi: "Presentasi", logo: "Logo", web: "Web & aplikasi" };
// Service page per portfolio category / price tab (pages generated by _tools/build-pages.js)
const CAT_PAGE = { feed: "jasa-desain-feed-instagram/", presentasi: "jasa-ppt/", logo: "jasa-logo/", web: "jasa-website-umkm/" };
const TAB_PAGES = {
  desain: [["jasa-desain-feed-instagram/", "desain feed IG"], ["jasa-ppt/", "PPT"]],
  logo: [["jasa-logo/", "logo"]],
  katalog: [["jasa-katalog-menu/", "katalog & menu"]],
  web: [["jasa-website-umkm/", "website & aplikasi"]]
};

// ===== WhatsApp links =====
document.querySelectorAll("[data-wa]").forEach((a) => {
  const loc = a.dataset.wa || "lainnya";
  a.href = waLink(WA_DEFAULT);
  a.target = "_blank";
  a.rel = "noopener";
  a.addEventListener("click", () => track("click_whatsapp", { lokasi: loc }));
});

// ===== Mobile nav =====
const toggle = document.querySelector(".nav-toggle");
const nav = document.getElementById("nav");
toggle.addEventListener("click", () => {
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});
nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => {
  nav.classList.remove("open");
  toggle.setAttribute("aria-expanded", "false");
}));

// ===== Pricing tabs =====
const panel = document.getElementById("price-panel");
const note = document.getElementById("price-note");
function renderPrices(key) {
  const group = PRICES[key];
  panel.innerHTML = "";
  group.items.forEach((it) => {
    const card = document.createElement("article");
    card.className = "price-card" + (it.featured ? " featured" : "");
    card.innerHTML = `
      ${it.featured ? `<span class="tag">${it.featured}</span>` : ""}
      <h3></h3>
      <p class="desc"></p>
      <p class="price">${it.price} ${it.unit ? `<small>${it.unit}</small>` : ""}</p>
      ${it.incl ? `<p class="incl"><b>Termasuk:</b> ${it.incl}</p>` : ""}
      <a class="btn btn-order" target="_blank" rel="noopener">Pesan paket ini</a>
      ${[].concat(it.demo || []).map((d) => `<a class="price-demo" href="${DEMOS[d].url}"${/^https?:/.test(DEMOS[d].url) ? ' target="_blank" rel="noopener"' : ""}>Lihat demo: ${DEMOS[d].label} →</a>`).join("")}`;
    card.querySelector("h3").textContent = it.name;
    card.querySelector(".desc").textContent = it.desc;
    const order = card.querySelector(".btn-order");
    order.href = waLink(`Halo Bikinin Studio, saya mau pesan "${it.name}" (${it.price}). Boleh dibantu infonya?`);
    order.addEventListener("click", () => track("click_whatsapp", { lokasi: `paket:${it.name}` }));
    panel.appendChild(card);
  });
  note.textContent = group.note;
  const more = document.createElement("span");
  more.className = "price-more";
  more.innerHTML = " Detail paket, contoh, &amp; FAQ: " + TAB_PAGES[key].map(([href, label]) => `<a href="${href}">${label} →</a>`).join(" · ");
  note.appendChild(more);
}
function selectTab(key) {
  document.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.tab === key)));
  renderPrices(key);
  track("select_tab_harga", { kategori: key });
}
document.querySelectorAll(".tab").forEach((tab) => tab.addEventListener("click", () => selectTab(tab.dataset.tab)));
// Service cards jump to their price tab
document.querySelectorAll("[data-tab-jump]").forEach((a) => a.addEventListener("click", () => selectTab(a.dataset.tabJump)));
renderPrices("desain");

// ===== Portfolio gallery + filter + lightbox =====
const gallery = document.getElementById("gallery");
const galleryMore = document.getElementById("gallery-more");
// "Semua" starts with a few works so the page stays short (4 on phones, 6 on wider screens)
const PREVIEW_COUNT = matchMedia("(max-width: 600px)").matches ? 4 : 6;
let showAll = false;
// Real work (own store, own brand) gets its own block above the concept projects
const isReal = (w) => w.label !== "Proyek konsep";
function workEl(w) {
  const el = document.createElement(w.demo || w.link ? "a" : "button");
  el.className = "work";
  if (w.demo || w.link) {
    el.href = w.link || DEMOS[w.demo].url;
    if (/^https?:/.test(w.link || DEMOS[w.demo].url)) { el.target = "_blank"; el.rel = "noopener"; }
  } else {
    el.type = "button";
    el.addEventListener("click", () => openLightbox(w));
  }
  el.innerHTML = `
    <div class="work-thumb">
      <img loading="lazy" src="assets/portfolio/${w.src}" alt="">
      ${w.demo ? `<span class="live-badge">Demo live</span>` : w.badge ? `<span class="live-badge real">${w.badge}</span>` : ""}
    </div>
    <div class="work-info"><h3></h3><span class="work-tag">${CAT_NAME[w.cat]}</span><span class="work-tag">${w.label}</span></div>`;
  el.querySelector("img").alt = w.title;
  el.querySelector("h3").textContent = w.title;
  return el;
}
WORKS.filter(isReal).forEach((w) => document.getElementById("gallery-real").appendChild(workEl(w)));
function renderGallery(filter) {
  gallery.innerHTML = "";
  const list = WORKS.filter((w) => !isReal(w) && (filter === "semua" || (filter === "demo" ? w.demo : w.cat === filter)));
  const clipped = filter === "semua" && !showAll && list.length > PREVIEW_COUNT;
  galleryMore.hidden = !clipped;
  galleryMore.querySelector("button").textContent = `Lihat semua karya (${list.length})`;
  (clipped ? list.slice(0, PREVIEW_COUNT) : list).forEach((w) => gallery.appendChild(workEl(w)));
}
function setFilter(name) {
  document.querySelectorAll(".filter").forEach((x) => x.classList.toggle("is-active", x.dataset.filter === name));
  renderGallery(name);
}
document.querySelectorAll(".filter").forEach((f) => f.addEventListener("click", () => setFilter(f.dataset.filter)));
document.querySelectorAll("[data-filter-jump]").forEach((a) => a.addEventListener("click", () => setFilter(a.dataset.filterJump)));
galleryMore.querySelector("button").addEventListener("click", () => { showAll = true; renderGallery("semua"); });
renderGallery("semua");

const lightbox = document.getElementById("lightbox");
const lbImg = document.getElementById("lightbox-img");
const lbCap = document.getElementById("lightbox-cap");
let lastFocus = null;
function openLightbox(w) {
  lastFocus = document.activeElement;
  lbImg.src = `assets/portfolio/${w.src}`;
  lbImg.alt = w.title;
  lbCap.textContent = `${w.title} · ${w.label} · `;
  const more = document.createElement("a");
  more.href = CAT_PAGE[w.cat];
  more.textContent = `Lihat layanan ${CAT_NAME[w.cat].toLowerCase()} →`;
  lbCap.appendChild(more);
  lightbox.hidden = false;
  lightbox.querySelector(".lightbox-close").focus();
}
function closeLightbox() {
  lightbox.hidden = true;
  if (lastFocus) lastFocus.focus();
}
lightbox.addEventListener("click", (e) => { if (e.target === lightbox || e.target.classList.contains("lightbox-close")) closeLightbox(); });
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !lightbox.hidden) closeLightbox(); });

document.querySelectorAll("[data-kuota]").forEach((el) => { el.textContent = KUOTA_PERKENALAN; });

// ===== Testimonials: TESTIMONIALS above + reviews approved in the Sheet (tab Ulasan, Tampil = Ya) =====
const starText = (n) => "★★★★★".slice(0, n) + "☆☆☆☆☆".slice(0, 5 - n);
function renderTestimonials(items) {
  if (!items.length) return;
  const fresh = document.getElementById("trust-new"); // "belum ada testimoni" line goes away once real ones exist
  if (fresh) fresh.hidden = true;
  const rated = items.filter((t) => t.rating);
  const avg = rated.length ? rated.reduce((s, t) => s + t.rating, 0) / rated.length : 0;
  const section = document.getElementById("testimoni");
  section.innerHTML = `<div class="container"><p class="eyebrow">Testimoni</p><h2>Kata klien kami</h2>
    ${rated.length ? `<p class="review-avg"><span class="stars" aria-hidden="true">${starText(Math.round(avg))}</span> <b>${avg.toLocaleString("id-ID", { maximumFractionDigits: 1 })} dari 5</b> · ${rated.length} ulasan</p>` : ""}
    <div id="testimonial-list" class="testimonial-grid"></div>
    <p class="review-note">Ulasan dari klien asli, ditampilkan dengan izin mereka.</p></div>`;
  const list = document.getElementById("testimonial-list");
  items.forEach((t) => {
    const card = document.createElement("figure");
    card.className = "testimonial";
    card.innerHTML = `${t.rating ? `<p class="stars" aria-label="Rating ${t.rating} dari 5">${starText(t.rating)}</p>` : ""}<blockquote></blockquote><figcaption><strong></strong><span></span></figcaption>`;
    card.querySelector("blockquote").textContent = `“${t.text}”`;
    card.querySelector("strong").textContent = t.name + (t.business ? `, ${t.business}` : "");
    card.querySelector("span").textContent = [t.service, t.date].filter(Boolean).join(" · ");
    list.appendChild(card);
  });
  section.hidden = false;
}
renderTestimonials(TESTIMONIALS);
if (window.BIKININ.SHEET_URL && window.fetch) {
  fetch(window.BIKININ.SHEET_URL + "?ulasan=1")
    .then((r) => r.json())
    .then((d) => {
      const approved = (Array.isArray(d.ulasan) ? d.ulasan : [])
        .filter((u) => u && u.teks && u.nama)
        .map((u) => ({
          text: String(u.teks), name: String(u.nama), business: String(u.usaha || ""), service: String(u.layanan || ""),
          rating: Math.min(5, Math.max(1, Math.round(Number(u.rating)) || 5)), date: String(u.bulan || ""),
        }));
      if (approved.length) renderTestimonials(TESTIMONIALS.concat(approved));
    })
    .catch(() => {}); // Sheet unreachable or old script: page stays as is
}

// ===== Order form -> WhatsApp =====
const form = document.getElementById("order-form");
const formError = document.getElementById("form-error");
// Without a Sheets URL nothing is stored, so the consent box and the "kami catat" line are hidden
const SHEET_ON = Boolean(window.BIKININ.SHEET_URL);
if (!SHEET_ON) {
  form.querySelector(".form-check").hidden = true;
  form.setuju.required = false;
  const copy = document.getElementById("order-note");
  if (copy) copy.textContent = "Isi form ini, terus klik tombolnya. WhatsApp bakal kebuka dengan pesan yang udah tersusun, tinggal kirim.";
}
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form).entries());
  if (d.kode_cadangan) return; // honeypot: only bots fill the hidden field
  if (!d.nama.trim() || !d.layanan) {
    formError.textContent = "Nama dan layanan wajib diisi ya.";
    formError.hidden = false;
    (d.nama.trim() ? form.layanan : form.nama).focus();
    return;
  }
  if (SHEET_ON && !d.setuju) {
    formError.textContent = "Centang persetujuan dulu ya, biar brief-nya bisa kami catat.";
    formError.hidden = false;
    form.setuju.focus();
    return;
  }
  formError.hidden = true;
  const lines = [
    "Halo Bikinin Studio, saya mau order:\n",
    `Nama: ${d.nama.trim()}`,
    d.usaha.trim() && `Nama usaha: ${d.usaha.trim()}`,
    `Layanan: ${d.layanan}`,
    d.paket.trim() && `Paket: ${d.paket.trim()}`,
    d.budget && `Budget: ${d.budget}`,
    d.deadline && `Deadline: ${new Date(d.deadline + "T00:00").toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`,
    d.referensi.trim() && `Referensi: ${d.referensi.trim()}`,
    d.detail.trim() && `Detail: ${d.detail.trim()}`
  ].filter(Boolean);
  if (SHEET_ON) sendBrief({ nama: d.nama, usaha: d.usaha, layanan: d.layanan, paket: d.paket, budget: d.budget, deadline: d.deadline, referensi: d.referensi, detail: d.detail, halaman: location.pathname });
  track("generate_lead", { layanan: d.layanan });
  window.open(waLink(lines.join("\n"), "form web"), "_blank", "noopener");
});

/* ===== Asisten otomatis: quick answers from PRICES, DEMOS and the FAQ on this page (no AI, nothing invented) ===== */
function initAssistant() {
  const btn = document.querySelector(".assist-btn");
  const box = document.getElementById("assist");
  if (!btn || !box) return;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const waBtn = (msg, label = "Lanjut chat admin di WA") =>
    `<a class="bubble-wa" data-assist-wa href="${waLink(msg, "asisten")}" target="_blank" rel="noopener">${label}</a>`;
  // FAQ answers are read from the page, so editing the FAQ updates the assistant too
  const faq = (needle) => {
    const d = [...document.querySelectorAll("#faq details")].find((x) => x.querySelector("summary").textContent.toLowerCase().includes(needle));
    return d ? `<p>${esc(d.querySelector("p").textContent)}</p>` : "";
  };
  const CAT_LABEL = { desain: "Desain konten & PPT", logo: "Logo", katalog: "Katalog & menu", web: "Website & aplikasi" };
  const priceList = (key) => {
    const g = PRICES[key];
    return `<p><b>${CAT_LABEL[key]}</b> (harga perkenalan):</p><ul>${g.items.map((it) => `<li>${esc(it.name)}: ${esc(it.price)}${it.unit ? esc(it.unit) : ""}</li>`).join("")}</ul>
      <p>${esc(g.note)}</p>${waBtn(`Halo Bikinin Studio, saya mau tanya soal ${CAT_LABEL[key].toLowerCase()}.`, "Tanya paket ini di WA")}`;
  };
  const CATS = {
    desain: ["feed", "poster", "konten", "instagram", "ig", "ppt", "presentasi", "slide", "sidang", "story"],
    logo: ["logo", "branding", "brand"],
    katalog: ["katalog", "menu", "pricelist", "price list"],
    web: ["web", "website", "landing", "company profile", "compro", "toko online", "aplikasi", "app", "kasir", "booking"]
  };
  // Checked in order: specific questions first, then service prices, then general ones
  const TOPICS = [
    { id: "durasi", label: "Lama pengerjaan", keys: ["berapa lama", "lama", "hari", "deadline", "cepat", "ekspres", "kapan jadi", "waktu"], answer: () => faq("berapa lama") },
    { id: "revisi", label: "Revisi", keys: ["revisi", "ubah", "ganti"], answer: () => faq("revisi") },
    { id: "bayar", label: "Pembayaran", keys: ["bayar", "dp", "transfer", "qris", "lunas", "e-wallet", "dana", "gopay", "ovo"], answer: () => faq("pembayaran") },
    { id: "domain", keys: ["domain", "hosting"], answer: () => faq("domain") },
    { id: "batal", keys: ["batal", "cancel", "refund", "uang kembali", "dibatalkan"],
      answer: () => faq("batal") + `<p><a href="syarat-ketentuan/">Baca Syarat &amp; Ketentuan lengkap →</a></p>` },
    { id: "file", label: "File yang didapat", keys: ["file", "canva", "vektor", "png", "pdf", "format"], answer: () => faq("file apa") },
    { id: "demo", label: "Lihat demo", keys: ["demo", "contoh", "portofolio", "karya", "coba"],
      answer: () => `<p>Ini demo yang bisa langsung kamu buka dan coba:</p><ul>${Object.values(DEMOS).map((d) => `<li><a href="${d.url}">${esc(d.label)}</a></li>`).join("")}</ul>` },
    ...Object.keys(CATS).map((k) => ({ id: `harga-${k}`, keys: CATS[k], answer: () => priceList(k) })),
    { id: "luarkota", keys: ["luar kota", "kota", "jauh"], answer: () => faq("luar kota") },
    { id: "murah", keys: ["murah", "kualitas"], answer: () => faq("murah") },
    { id: "harga", label: "Harga", keys: ["harga", "berapa", "biaya", "tarif", "budget", "price"],
      answer: () => `<p>Harga perkenalan, mulai dari:</p><ul>${Object.keys(PRICES).map((k) => `<li>${CAT_LABEL[k]}: ${esc(PRICES[k].items[0].price)}</li>`).join("")}</ul>
        <p>Ketik nama layanannya (misalnya <i>logo</i> atau <i>website</i>) buat lihat semua paketnya.</p>` },
    { id: "order", label: "Cara order", keys: ["order", "pesan", "cara", "gimana", "mulai"],
      answer: () => `<ol style="margin:0 0 6px;padding-left:18px"><li>Ceritain kebutuhanmu lewat WhatsApp</li><li>Deal harga, bayar DP 50%</li><li>Lihat hasil, revisi, baru lunas</li></ol>
        ${waBtn("Halo Bikinin Studio, saya mau order.", "Mulai chat di WA")}` },
    { id: "admin", keys: ["admin", "orang", "manusia", "cs", "telepon", "telpon", "nomor", "wa", "whatsapp"],
      answer: () => `<p>Admin kami online 24/7 di WhatsApp 0877-6329-2786.</p>${waBtn("Halo Bikinin Studio, saya mau tanya-tanya.", "Chat admin")}` },
    { id: "salam", keys: ["halo", "hai", "hi", "hallo", "pagi", "siang", "sore", "malam", "assalamualaikum", "permisi"],
      answer: () => `<p>Halo! Mau tahu soal apa? Pilih topik di bawah atau ketik aja pertanyaanmu.</p>` }
  ];
  const has = (text, key) => new RegExp(`(^|[^a-z])${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}([^a-z]|$)`).test(text);
  const match = (q) => {
    const text = q.toLowerCase();
    return TOPICS.find((t) => t.keys.some((k) => has(text, k)));
  };

  box.innerHTML = `
    <div class="assist-head">
      <div><strong>Asisten Bikinin</strong><small>Jawaban otomatis, bukan orang</small></div>
      <a class="assist-wa" data-assist-wa href="${waLink(WA_DEFAULT, "asisten")}" target="_blank" rel="noopener">Chat admin</a>
      <button class="assist-close" type="button" aria-label="Tutup asisten">×</button>
    </div>
    <div class="assist-log" aria-live="polite"></div>
    <div class="assist-chips">${["harga", "durasi", "revisi", "bayar", "order", "file", "demo"].map((id) => TOPICS.find((t) => t.id === id)).map((t) => `<button type="button" data-topic="${t.id}">${t.label}</button>`).join("")}</div>
    <form class="assist-form"><input type="text" placeholder="Ketik pertanyaanmu…" aria-label="Pertanyaan" maxlength="200"><button type="submit">Kirim</button></form>`;
  const log = box.querySelector(".assist-log");
  const input = box.querySelector("input");
  const say = (who, html) => {
    const b = document.createElement("div");
    b.className = `bubble ${who}`;
    if (who === "user") b.textContent = html; else b.innerHTML = html;
    log.appendChild(b);
    log.scrollTop = log.scrollHeight;
  };
  const reply = (topic, q) => {
    track("asisten_tanya", { topik: topic ? topic.id : "tidak_dikenal" });
    say("bot", topic ? topic.answer() :
      `<p>Pertanyaan ini belum bisa kami jawab otomatis. Tanya langsung ke admin di WhatsApp ya.</p>${waBtn(`Halo Bikinin Studio, saya mau tanya: ${q}`)}`);
  };
  say("bot", "<p>Halo! Mau tahu apa dulu? Pilih topik di bawah atau ketik pertanyaanmu.</p><p>Kalau mau ngobrol sama orangnya, klik <b>Chat admin</b> di atas.</p>");

  box.querySelector(".assist-chips").addEventListener("click", (e) => {
    const b = e.target.closest("[data-topic]");
    if (!b) return;
    say("user", b.textContent);
    reply(TOPICS.find((t) => t.id === b.dataset.topic));
  });
  box.querySelector(".assist-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    input.value = "";
    say("user", q);
    reply(match(q), q);
  });
  box.addEventListener("click", (e) => { if (e.target.closest("[data-assist-wa]")) track("click_whatsapp", { lokasi: "asisten" }); });

  const setOpen = (open) => {
    box.hidden = !open;
    btn.setAttribute("aria-expanded", String(open));
    if (open) input.focus(); else btn.focus();
  };
  // Teaser bubble: shown once per visit, after 8s or when the visitor reaches the prices, whichever comes first
  const teaser = document.querySelector(".assist-teaser");
  const SEEN = "bikinin_teaser_seen";
  const seen = () => { try { return sessionStorage.getItem(SEEN) === "1"; } catch { return false; } };
  let teaserTimer = 0;
  const hideTeaser = () => { if (teaser) teaser.hidden = true; clearTimeout(teaserTimer); };
  const showTeaser = () => {
    if (!teaser || seen() || !box.hidden) return;
    try { sessionStorage.setItem(SEEN, "1"); } catch { /* private mode: just show it this once */ }
    teaser.hidden = false;
    btn.classList.add("wiggle");
    setTimeout(() => btn.classList.remove("wiggle"), 900);
    teaserTimer = setTimeout(hideTeaser, 9000);
  };
  if (teaser && !seen()) {
    const t = setTimeout(showTeaser, 8000);
    const harga = document.getElementById("harga");
    if (harga) {
      const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { clearTimeout(t); io.disconnect(); setTimeout(showTeaser, 1200); } });
      io.observe(harga);
    }
    teaser.querySelector(".assist-teaser-open").addEventListener("click", () => { hideTeaser(); setOpen(true); });
    teaser.querySelector(".assist-teaser-close").addEventListener("click", hideTeaser);
  }

  btn.addEventListener("click", () => { hideTeaser(); setOpen(box.hidden); });
  box.querySelector(".assist-close").addEventListener("click", () => setOpen(false));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !box.hidden) setOpen(false); });
}
initAssistant();

/* ===== Hero showcase: rotating work deck, phone screens, mouse parallax ===== */
function initHeroShowcase() {
  const hv = document.querySelector(".hero-visual");
  if (!hv) return;
  const cards = [...hv.querySelectorAll(".deck-card")];
  const screens = [...hv.querySelectorAll(".hp-screen")];
  const label = hv.querySelector(".hv-label");
  const dots = hv.querySelector(".hv-dots");
  cards.forEach(() => dots.appendChild(document.createElement("span")));
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // pos 0 = front, last = the one that just left; the rest wait behind
  const place = (list, i, depth) => list.forEach((el, k) => {
    const pos = (k - i + list.length) % list.length;
    el.dataset.pos = pos === list.length - 1 && list.length > 2 ? "out" : pos < depth ? pos : "wait";
  });
  let card = 0, screen = 0, ticks = 0;
  const showCard = (i) => {
    card = i;
    place(cards, i, 3);
    [...dots.children].forEach((d, k) => d.classList.toggle("on", k === i));
    label.textContent = cards[i].dataset.label;
    label.classList.remove("swap");
    void label.offsetWidth;
    label.classList.add("swap");
  };
  showCard(0);
  place(screens, 0, 1);
  if (reduce) return;

  // Pop-in on load
  hv.classList.add("pre");
  requestAnimationFrame(() => requestAnimationFrame(() => hv.classList.remove("pre")));

  // Rotate only while the hero is on screen and the tab is visible
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(hv);
  setInterval(() => {
    if (!visible || document.hidden) return;
    showCard((card + 1) % cards.length);
    if (++ticks % 2 === 0) place(screens, (screen = (screen + 1) % screens.length), 1);
  }, 3200);
  hv.querySelector(".hv-deck").addEventListener("click", () => showCard((card + 1) % cards.length));

  // Subtle parallax on desktop only
  if (matchMedia("(hover: hover) and (pointer: fine)").matches) {
    const hero = hv.closest(".hero");
    hero.addEventListener("mousemove", (e) => {
      const r = hv.getBoundingClientRect();
      hv.style.setProperty("--px", Math.max(-1, Math.min(1, (e.clientX - r.left - r.width / 2) / r.width)).toFixed(3));
      hv.style.setProperty("--py", Math.max(-1, Math.min(1, (e.clientY - r.top - r.height / 2) / r.height)).toFixed(3));
    });
    hero.addEventListener("mouseleave", () => { hv.style.setProperty("--px", 0); hv.style.setProperty("--py", 0); });
  }
}
initHeroShowcase();

/* ===== Pita karya + muncul pelan saat di-scroll ===== */
function initMotion() {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const track = document.querySelector(".strip-track");
  if (track && !reduce) track.append(...[...track.children].map((n) => { const c = n.cloneNode(true); c.setAttribute("aria-hidden", "true"); return c; }));
  if (reduce || !("IntersectionObserver" in window)) return;
  const groups = [".section-head", ".section h2", ".service-card", ".price-card", ".work", ".trust-block", ".steps li", ".order-form", "#faq details"];
  const io = new IntersectionObserver((entries) => entries.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
  }), { rootMargin: "0px 0px -8% 0px" });
  groups.forEach((sel) => document.querySelectorAll(sel).forEach((el, i) => {
    if (el.closest(".section-head") && el.tagName === "H2") return; // the head animates as one
    el.classList.add("reveal");
    el.style.setProperty("--rd", `${(i % 4) * 0.06}s`);
    io.observe(el);
  }));
}
initMotion();

document.getElementById("year").textContent = new Date().getFullYear();
