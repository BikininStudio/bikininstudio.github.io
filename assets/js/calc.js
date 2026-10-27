// Kalkulator estimasi. Data harga dari <script id="harga-data"> (digenerate dari src/data/prices.mjs saat build).
(function () {
  var box = document.getElementById("calc"), dataEl = document.getElementById("harga-data");
  if (!box || !dataEl) return;
  var G = JSON.parse(dataEl.textContent);
  var EXPRESS = 0.3, REVISI = 10000, MAINT = 100000;
  var rp = function (n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var q = new URLSearchParams(location.search);
  var st = { cat: G[q.get("l")] ? q.get("l") : "desain", idx: 0, qty: 1, express: false, rev: 0, maint: false };
  var $ = function (id) { return document.getElementById(id); };

  box.innerHTML =
    '<div class="calc-form">' +
    '<p class="note">Paket adalah isi pesanan Anda. Tambahan adalah biaya opsional di luar paket. Hasilnya adalah harga minimal, bukan harga pasti.</p>' +
    '<div class="calc-step"><h2>1. Pilih layanan</h2><div class="tablist" role="group" aria-label="Kategori layanan">' +
    Object.keys(G).map(function (k) { return '<button type="button" class="tab" data-cat="' + k + '" aria-pressed="' + (k === st.cat) + '">' + esc(G[k].label) + "</button>"; }).join("") + "</div></div>" +
    '<div class="calc-step"><h2>2. Pilih paket</h2><div class="calc-items" id="calc-items" role="radiogroup" aria-label="Paket"></div></div>' +
    '<div class="calc-step"><h2>3. Opsi tambahan</h2><div id="calc-opts"></div></div></div>' +
    '<aside class="calc-result" aria-live="polite"><p class="calc-label"><strong>Estimasi Anda</strong></p><dl id="calc-rows"></dl>' +
    '<p class="calc-total-label">Estimasi minimal</p><p class="calc-total" id="calc-total"></p><p class="calc-dp" id="calc-dp"></p>' +
    '<p class="help">Estimasi, bukan harga final. Harga final dikirim dalam penawaran tertulis sebelum pekerjaan dimulai.</p>' +
    '<a class="btn btn-primary" id="calc-brief" href="/pesan/">Lanjut isi brief</a>' +
    '<a class="btn btn-ghost" id="calc-wa" target="_blank" rel="noopener" href="#">Kirim estimasi ke WA</a><p class="help" id="calc-note"></p></aside>';

  var items = function () { return G[st.cat].items; };
  var item = function () { return items()[st.idx]; };
  var canExpress = function () { return st.cat !== "web" && !item().noExpress; };
  var canRev = function () { return !!G[st.cat].extraRevisi; };
  var qtyRule = function (it) { if (!it.unit) return null; var m = it.desc.match(/minimal (\d+)/i); return { min: m ? +m[1] : 1, label: it.unit === "/slide" ? "Jumlah slide" : "Jumlah desain" }; };

  function renderCat() {
    [].forEach.call(box.querySelectorAll("[data-cat]"), function (b) { var on = b.dataset.cat === st.cat; b.setAttribute("aria-pressed", String(on)); });
    $("calc-items").innerHTML = items().map(function (it, i) {
      return '<label class="calc-item"><input type="radio" name="paket" value="' + i + '"' + (i === st.idx ? " checked" : "") + '><span>' + esc(it.name) + "<small>" + esc(it.desc) + "</small><small>Termasuk: " + esc(it.incl) + "</small></span><b>" + esc(it.price.replace("Mulai ", "")) + esc(it.unit) + "</b></label>";
    }).join("");
    renderOpts();
  }
  function renderOpts() {
    var it = item(), qr = qtyRule(it), web = st.cat === "web";
    st.qty = qr ? Math.max(qr.min, st.qty) : 1;
    if (!canExpress()) st.express = false;
    if (!canRev()) st.rev = 0;
    $("calc-opts").innerHTML = [
      qr && '<div class="calc-opt field"><label for="calc-qty">' + qr.label + (qr.min > 1 ? " (minimal " + qr.min + ")" : "") + '</label><input id="calc-qty" type="number" inputmode="numeric" min="' + qr.min + '" max="500" value="' + st.qty + '"></div>',
      canExpress() && '<div class="calc-opt"><label class="check"><input id="calc-express" type="checkbox"' + (st.express ? " checked" : "") + "><span>Ekspres 1x24 jam (+30%, menyesuaikan antrean)</span></label></div>",
      canRev() && '<div class="calc-opt field"><label for="calc-rev">Revisi tambahan (di luar jatah paket, Rp 10rb per revisi)</label><input id="calc-rev" type="number" inputmode="numeric" min="0" max="20" value="' + st.rev + '"></div>',
      web && '<div class="calc-opt"><label class="check"><input id="calc-maint" type="checkbox"' + (st.maint ? " checked" : "") + "><span>Maintenance bulanan (update isi &amp; perbaikan, Rp 100rb/bulan)</span></label></div>",
      web && '<p class="help">Domain &amp; hosting dibayar terpisah, sekitar Rp 300–800rb per tahun.</p>',
    ].filter(Boolean).join("");
    update();
  }
  function calc() {
    var it = item(), base = it.from * st.qty;
    var ex = st.express && canExpress() ? Math.round(base * EXPRESS) : 0, rv = canRev() ? st.rev * REVISI : 0;
    return { it: it, base: base, ex: ex, rv: rv, total: base + ex + rv };
  }
  function update() {
    var r = calc(), rows = [[r.it.name + (r.it.unit ? " × " + st.qty : ""), rp(r.base)]];
    if (r.ex) rows.push(["Ekspres 1x24 jam (+30%)", rp(r.ex)]);
    if (r.rv) rows.push(["Revisi tambahan × " + st.rev, rp(r.rv)]);
    if (st.cat === "web" && st.maint) rows.push(["Maintenance (per bulan, terpisah)", rp(MAINT)]);
    $("calc-rows").innerHTML = rows.map(function (x) { return "<dt>" + esc(x[0]) + "</dt><dd>" + x[1] + "</dd>"; }).join("");
    $("calc-total").textContent = "mulai " + rp(r.total);
    $("calc-dp").textContent = "DP 50%: " + rp(r.total / 2);
    $("calc-note").textContent = G[st.cat].note;
    var opsi = [r.it.unit ? st.qty + r.it.unit.replace("/", " ") : "", r.ex ? "ekspres 1x24 jam" : "", r.rv ? "revisi tambahan " + st.rev + "x" : "", st.cat === "web" && st.maint ? "maintenance bulanan" : ""].filter(Boolean).join(", ");
    $("calc-wa").href = waLink("Halo Bikinin Studio, ini estimasi dari kalkulator: " + G[st.cat].label + " · " + r.it.name + (opsi ? " · " + opsi : "") + ". Estimasi minimal " + rp(r.total) + ". Mohon informasi selanjutnya.", "kalkulator");
    var p = new URLSearchParams({ layanan: r.it.service, paket: r.it.id, estimasi: String(r.total), qty: String(st.qty), ekspres: r.ex ? "1" : "0", revisi: String(st.rev) });
    $("calc-brief").href = "/pesan/?" + p.toString();
  }
  box.addEventListener("click", function (e) {
    var t = e.target.closest("[data-cat]");
    if (t && t.dataset.cat !== st.cat) { st = { cat: t.dataset.cat, idx: 0, qty: 1, express: false, rev: 0, maint: false }; renderCat(); track("calc_used", { grup: st.cat }); }
    if (e.target.closest("#calc-brief")) track("calc_to_brief");
    if (e.target.closest("#calc-wa")) track("click_whatsapp", { lokasi: "kalkulator" });
  });
  box.addEventListener("change", function (e) {
    var t = e.target;
    if (t.name === "paket") { st.idx = +t.value; st.qty = 1; renderOpts(); track("calc_used", { paket: item().id }); return; }
    if (t.id === "calc-express") st.express = t.checked;
    if (t.id === "calc-maint") st.maint = t.checked;
    if (t.id === "calc-qty" || t.id === "calc-rev") { var v = Math.min(+t.max, Math.max(+t.min, Math.round(+t.value || +t.min))); t.value = v; st[t.id === "calc-qty" ? "qty" : "rev"] = v; }
    update();
  });
  box.addEventListener("input", function (e) {
    var t = e.target;
    if (t.id === "calc-qty" || t.id === "calc-rev") { var v = Math.round(+t.value); if (v >= +t.min && v <= +t.max) { st[t.id === "calc-qty" ? "qty" : "rev"] = v; update(); } }
  });
  var wanted = q.get("paket");
  if (wanted) { var gi = Object.keys(G).find(function (k) { return G[k].items.some(function (i) { return i.id === wanted; }); }); if (gi) { st.cat = gi; st.idx = G[gi].items.findIndex(function (i) { return i.id === wanted; }); } }
  renderCat();
})();
