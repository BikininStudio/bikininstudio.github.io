// Kalkulator estimasi harga (halaman hitung-harga/). Datanya dari window.PRICES (assets/harga-data.js, digenerate
// build-pages.js dari script.js), jadi harga di sini selalu sama dengan daftar harga di web.
// Aturan tambahan sama dengan catatan harga: ekspres 1x24 jam +30%, revisi tambahan desain mulai Rp 10rb.
// Butuh assets/analytics.js (waLink, track).
(function () {
  const box = document.getElementById("calc");
  if (!box || !window.PRICES) return;

  const CAT = { desain: "Desain konten & PPT", logo: "Logo", katalog: "Katalog & menu", web: "Website & aplikasi" };
  const EXPRESS = 0.3;
  const REVISI = 10000;
  const MAINTENANCE = 100000;
  const rp = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
  // "Mulai Rp 1,5jt" -> 1500000
  const toNum = (s) => {
    const m = String(s).match(/Rp\s*([\d.,]+)\s*(rb|jt)?/i);
    return m ? Math.round(parseFloat(m[1].replace(/\./g, "").replace(",", ".")) * ({ rb: 1e3, jt: 1e6 }[(m[2] || "").toLowerCase()] || 1)) : 0;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

  const q = new URLSearchParams(location.search);
  const state = { cat: PRICES[q.get("l")] ? q.get("l") : "desain", idx: 0, qty: 1, express: false, rev: 0, maint: false };

  box.innerHTML = `
    <div class="order-form calc-form">
      <p class="calc-hint calc-intro"><b>Paket</b> = isi pesananmu (jumlah desain, konsep, revisi, format file). <b>Tambahan</b> = biaya opsional di luar paket, misalnya ekspres 1x24 jam atau revisi ekstra. Hasilnya <b>harga minimal</b>, bukan harga pasti.<br>Contoh: Paket 10 feed + ekspres = mulai Rp 156.000, DP Rp 78.000.</p>
      <div class="calc-step">
        <h2>1. Pilih layanan</h2>
        <div class="tabs" role="tablist" aria-label="Kategori layanan">${Object.keys(CAT).map((k) =>
          `<button type="button" role="tab" class="tab" data-cat="${k}" aria-selected="${k === state.cat}">${CAT[k]}</button>`).join("")}</div>
      </div>
      <div class="calc-step">
        <h2>2. Pilih paket</h2>
        <div class="calc-items" id="calc-items" role="radiogroup" aria-label="Paket"></div>
      </div>
      <div class="calc-step">
        <h2>3. Tambahan</h2>
        <div id="calc-opts"></div>
      </div>
    </div>
    <aside class="calc-result" aria-live="polite">
      <p class="eyebrow">Estimasi kamu</p>
      <dl id="calc-rows"></dl>
      <p class="calc-total-label">Estimasi minimal</p>
      <p class="calc-total" id="calc-total"></p>
      <p class="calc-dp" id="calc-dp"></p>
      <p class="calc-why">Bisa lebih tinggi kalau teks/foto belum siap, butuh revisi di luar paket, atau ada fitur tambahan. Harga final kami kirim sebelum mulai kerja.</p>
      <a class="btn btn-block" id="calc-wa" target="_blank" rel="noopener" href="#">Kirim rincian ke WhatsApp</a>
      <p class="calc-note" id="calc-note"></p>
    </aside>`;

  const items = () => PRICES[state.cat].items;
  const item = () => items()[state.idx];
  // quantity applies to per-unit prices; PPT tugas has "minimal 10 slide" in its description
  const qtyRule = (it) => {
    if (!it.unit) return null;
    const min = Number((it.desc.match(/minimal (\d+)/i) || [])[1] || 1);
    return { min, label: it.unit === "/slide" ? "Jumlah slide" : "Jumlah desain" };
  };

  function renderCat() {
    box.querySelectorAll("[data-cat]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.cat === state.cat)));
    document.getElementById("calc-items").innerHTML = items().map((it, i) => `
      <label class="calc-item">
        <input type="radio" name="paket" value="${i}" ${i === state.idx ? "checked" : ""}>
        <span>${esc(it.name)}<small>${esc(it.desc)}</small>${it.incl ? `<small class="calc-incl">Termasuk: ${esc(it.incl)}</small>` : ""}</span>
        <b>${esc(it.price.replace("Mulai ", ""))}${it.unit ? `<small>${it.unit}</small>` : ""}</b>
      </label>`).join("");
    renderOpts();
  }

  function renderOpts() {
    const it = item();
    const qr = qtyRule(it);
    state.qty = qr ? Math.max(qr.min, state.qty) : 1;
    const web = state.cat === "web";
    document.getElementById("calc-opts").innerHTML = [
      qr && `<div class="calc-opt"><label for="calc-qty">${qr.label}${qr.min > 1 ? ` <small>(minimal ${qr.min})</small>` : ""}</label>
        <input id="calc-qty" type="number" inputmode="numeric" min="${qr.min}" max="500" value="${state.qty}"></div>`,
      !web && `<div class="calc-opt"><label><input id="calc-express" type="checkbox" ${state.express ? "checked" : ""}> Ekspres 1x24 jam <small>(+30%, menyesuaikan antrean)</small></label></div>`,
      !web && `<div class="calc-opt"><label for="calc-rev">Revisi tambahan <small>(di luar jatah paket, Rp 10rb/x)</small></label>
        <input id="calc-rev" type="number" inputmode="numeric" min="0" max="20" value="${state.rev}"></div>`,
      web && `<div class="calc-opt"><label><input id="calc-maint" type="checkbox" ${state.maint ? "checked" : ""}> Maintenance bulanan <small>(update isi &amp; perbaikan, Rp 100rb/bulan)</small></label></div>`,
      web && `<p class="calc-hint">Domain &amp; hosting dibayar terpisah, sekitar Rp 300–800rb per tahun. Kami bantu daftarnya.</p>`,
    ].filter(Boolean).join("");
    update();
  }

  function calc() {
    const it = item();
    const base = toNum(it.price) * state.qty;
    const express = state.express && state.cat !== "web" ? Math.round(base * EXPRESS) : 0;
    const rev = state.cat !== "web" ? state.rev * REVISI : 0;
    return { it, base, express, rev, total: base + express + rev };
  }

  function update() {
    const r = calc();
    const rows = [[r.it.name + (r.it.unit ? ` × ${state.qty}` : ""), rp(r.base)]];
    if (r.express) rows.push(["Ekspres 1x24 jam (+30%)", rp(r.express)]);
    if (r.rev) rows.push([`Revisi tambahan × ${state.rev}`, rp(r.rev)]);
    if (state.cat === "web" && state.maint) rows.push(["Maintenance (per bulan, terpisah)", rp(MAINTENANCE)]);
    document.getElementById("calc-rows").innerHTML = rows.map(([a, b]) => `<dt>${esc(a)}</dt><dd>${b}</dd>`).join("");
    document.getElementById("calc-total").textContent = "mulai " + rp(r.total);
    document.getElementById("calc-dp").textContent = "DP 50%: " + rp(r.total / 2);
    document.getElementById("calc-note").textContent = PRICES[state.cat].note + "";
    const lines = [
      "Halo Bikinin Studio, saya udah hitung estimasi di web:\n",
      `Layanan: ${CAT[state.cat]}`,
      `Paket: ${r.it.name}${r.it.unit ? ` (${state.qty}${r.it.unit.replace("/", " ")})` : ""}`,
      r.express && "Ekspres 1x24 jam: ya",
      r.rev && `Revisi tambahan: ${state.rev}x`,
      state.cat === "web" && state.maint && "Maintenance bulanan: ya",
      `Estimasi minimal: ${rp(r.total)}`,
      "\nBoleh dibantu info lanjutnya?",
    ].filter(Boolean);
    document.getElementById("calc-wa").href = waLink(lines.join("\n"), "kalkulator");
  }

  box.addEventListener("click", (e) => {
    const tab = e.target.closest("[data-cat]");
    if (tab && tab.dataset.cat !== state.cat) {
      Object.assign(state, { cat: tab.dataset.cat, idx: 0, qty: 1, express: false, rev: 0, maint: false });
      renderCat();
    }
  });
  box.addEventListener("change", (e) => {
    const t = e.target;
    if (t.name === "paket") { state.idx = Number(t.value); state.qty = 1; renderOpts(); return; }
    if (t.id === "calc-express") state.express = t.checked;
    if (t.id === "calc-maint") state.maint = t.checked;
    if (t.id === "calc-qty" || t.id === "calc-rev") {
      const min = Number(t.min), max = Number(t.max);
      const v = Math.min(max, Math.max(min, Math.round(Number(t.value) || min)));
      t.value = v;
      state[t.id === "calc-qty" ? "qty" : "rev"] = v;
    }
    update();
  });
  // live total while typing numbers (clamped on change)
  box.addEventListener("input", (e) => {
    const t = e.target;
    if (t.id === "calc-qty" || t.id === "calc-rev") {
      const v = Math.round(Number(t.value));
      if (v >= Number(t.min) && v <= Number(t.max)) { state[t.id === "calc-qty" ? "qty" : "rev"] = v; update(); }
    }
  });
  document.getElementById("calc-wa").addEventListener("click", () => {
    const r = calc();
    track("hitung_harga", { layanan: state.cat, paket: r.it.name, total: r.total });
    track("click_whatsapp", { lokasi: "kalkulator" });
  });

  renderCat();
})();
