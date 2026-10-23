// Kasir Kopi Rindang: demo POS app. All data lives in this device's localStorage.
(function () {
  const MENU = [
    { id: "eskopsu", name: "Es Kopi Susu Gula Aren", cat: "Kopi", price: 18000, emoji: "🥤" },
    { id: "tubruk", name: "Kopi Tubruk", cat: "Kopi", price: 12000, emoji: "☕" },
    { id: "americano", name: "Americano", cat: "Kopi", price: 20000, emoji: "🧊" },
    { id: "latte", name: "Caffe Latte", cat: "Kopi", price: 24000, emoji: "☕" },
    { id: "v60", name: "V60 Arabika Garut", cat: "Kopi", price: 25000, emoji: "🫖" },
    { id: "matcha", name: "Matcha Latte", cat: "Non-kopi", price: 24000, emoji: "🍵" },
    { id: "coklat", name: "Cokelat Panas", cat: "Non-kopi", price: 20000, emoji: "🍫" },
    { id: "lemontea", name: "Es Lemon Tea", cat: "Non-kopi", price: 15000, emoji: "🍋" },
    { id: "rotibakar", name: "Roti Bakar", cat: "Makanan", price: 15000, emoji: "🍞" },
    { id: "pisgor", name: "Pisang Goreng", cat: "Makanan", price: 12000, emoji: "🍌" },
    { id: "kentang", name: "Kentang Goreng", cat: "Makanan", price: 18000, emoji: "🍟" },
    { id: "nasgor", name: "Nasi Goreng Kampung", cat: "Makanan", price: 28000, emoji: "🍳" }
  ];
  const CATS = ["Semua", "Kopi", "Non-kopi", "Makanan"];
  const KEY = "kasir-kopi-rindang-v1";
  const byId = Object.fromEntries(MENU.map((m) => [m.id, m]));
  const $ = (id) => document.getElementById(id);
  const rp = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
  const pad = (n, w = 2) => String(n).padStart(w, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hhmm = (d) => `${pad(d.getHours())}.${pad(d.getMinutes())}`;
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- State ----------
  let newDayNote = false; // set by load(); must be declared before load() runs
  let store = load();
  const cart = {};
  let disc = 0;
  let cat = "Semua";
  let method = "Tunai";

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.day === dayKey(new Date()) && Array.isArray(s.txs)) return s;
      // A new day starts a new daily report; tell visitors who had their own transactions instead of wiping silently
      if (s && Array.isArray(s.txs) && s.txs.some((t) => t && !t.sample)) newDayNote = true;
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
    const s = seed();
    save(s);
    return s;
  }
  function save(s = store) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: keep in memory */ }
  }

  // Example transactions so the report isn't empty on first open (marked as sample)
  function seed() {
    const now = new Date();
    // Spread samples over opening hours so far (from 08.00; early in the morning from 06.00)
    let start = new Date(now); start.setHours(8, 0, 0, 0);
    if (now - start < 60 * 60 * 1000) start.setHours(6, 0, 0, 0);
    if (now - start < 30 * 60 * 1000) {
      // Very early: go back up to 4 hours, but never past midnight (samples must be dated today)
      const midnight = new Date(now); midnight.setHours(0, 0, 0, 0);
      start = new Date(Math.max(midnight.getTime(), now.getTime() - 4 * 60 * 60 * 1000));
    }
    let r = 7;
    const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const txs = [];
    const N = 12;
    for (let i = 0; i < N; i++) {
      const t = new Date(start.getTime() + ((now - start) * (i + rand() * 0.8)) / N);
      const items = {};
      const lines = 1 + Math.floor(rand() * 3);
      for (let k = 0; k < lines; k++) {
        const m = MENU[Math.floor(rand() * MENU.length)];
        items[m.id] = (items[m.id] || 0) + 1 + Math.floor(rand() * 2);
      }
      txs.push(makeTx(items, rand() < 0.25 ? 10 : 0, rand() < 0.45 ? "QRIS" : "Tunai", null, t, true, txs.length + 1));
    }
    return { day: dayKey(now), txs };
  }

  function calc(items, pct) {
    const subtotal = Object.entries(items).reduce((s, [id, q]) => s + byId[id].price * q, 0);
    const discount = Math.round((subtotal * pct) / 100);
    return { subtotal, discount, total: subtotal - discount };
  }

  function makeTx(items, pct, how, paid, when, sample, seq) {
    const { subtotal, discount, total } = calc(items, pct);
    const d = when || new Date();
    const cash = how === "Tunai" ? (paid != null ? paid : Math.ceil(total / 10000) * 10000) : total;
    return {
      no: `KR-${String(d.getFullYear()).slice(2)}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(seq, 3)}`,
      time: d.toISOString(),
      items: Object.entries(items).map(([id, qty]) => ({ id, name: byId[id].name, price: byId[id].price, qty })),
      subtotal, discountPct: pct, discount, total, method: how, paid: cash, change: cash - total, sample: !!sample
    };
  }

  // ---------- Kasir ----------
  function renderCats() {
    const box = $("cats");
    box.innerHTML = "";
    CATS.forEach((c) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = c;
      b.setAttribute("aria-pressed", String(c === cat));
      b.onclick = () => { cat = c; renderCats(); renderMenu(); };
      box.appendChild(b);
    });
  }

  function renderMenu() {
    const q = $("search").value.trim().toLowerCase();
    const box = $("menu");
    box.innerHTML = "";
    const list = MENU.filter((m) => (cat === "Semua" || m.cat === cat) && (!q || m.name.toLowerCase().includes(q)));
    if (!list.length) { box.innerHTML = `<p class="empty">Menu nggak ketemu.</p>`; return; }
    list.forEach((m) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "item";
      b.setAttribute("aria-label", `Tambah ${m.name}, ${rp(m.price)}`);
      b.innerHTML = `<span class="emoji" aria-hidden="true">${m.emoji}</span><span class="name">${m.name}</span><span class="price">${rp(m.price)}</span>${cart[m.id] ? `<span class="qty-badge">${cart[m.id]}</span>` : ""}`;
      b.onclick = () => { cart[m.id] = (cart[m.id] || 0) + 1; renderMenu(); renderCartBar(); };
      box.appendChild(b);
    });
  }

  function cartCount() { return Object.values(cart).reduce((a, b) => a + b, 0); }

  function renderCartBar() {
    const n = cartCount();
    $("cart-bar").hidden = !n;
    $("cart-count").textContent = `${n} item`;
    $("cart-total").textContent = rp(calc(cart, disc).total);
  }

  function renderCart() {
    const list = $("cart-list");
    list.innerHTML = "";
    Object.entries(cart).forEach(([id, qty]) => {
      const m = byId[id];
      const li = document.createElement("li");
      li.innerHTML = `<span class="n">${m.name}</span><span class="p">${rp(m.price)} × ${qty} = ${rp(m.price * qty)}</span>
        <span class="stepper"><button type="button" aria-label="Kurangi ${m.name}">−</button><b>${qty}</b><button type="button" aria-label="Tambah ${m.name}">+</button></span>`;
      const [minus, plus] = li.querySelectorAll("button");
      minus.onclick = () => { cart[id]--; if (!cart[id]) delete cart[id]; afterCartChange(); };
      plus.onclick = () => { cart[id]++; afterCartChange(); };
      list.appendChild(li);
    });
    document.querySelectorAll("[data-disc]").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.disc) === disc)));
    const { subtotal, discount, total } = calc(cart, disc);
    $("cart-totals").innerHTML = `<dt>Subtotal</dt><dd>${rp(subtotal)}</dd><dt>Diskon ${disc}%</dt><dd>− ${rp(discount)}</dd><dt class="grand">Total</dt><dd class="grand">${rp(total)}</dd>`;
  }

  function afterCartChange() {
    renderMenu();
    renderCartBar();
    if (!cartCount()) { close("cart-sheet"); return; }
    renderCart();
  }

  // ---------- Sheets ----------
  let lastFocus = null;
  function open(id) {
    lastFocus = document.activeElement;
    $(id).hidden = false;
    const f = $(id).querySelector("button, input");
    if (f) f.focus();
  }
  function close(id) {
    $(id).hidden = true;
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
  }
  document.querySelectorAll(".sheet").forEach((s) => {
    s.addEventListener("click", (e) => { if (e.target === s || e.target.closest("[data-close]")) close(s.id); });
  });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    const openSheet = [...document.querySelectorAll(".sheet")].reverse().find((s) => !s.hidden);
    if (openSheet) close(openSheet.id);
  });

  $("cart-bar").onclick = () => { renderCart(); open("cart-sheet"); };
  document.querySelectorAll("[data-disc]").forEach((b) => (b.onclick = () => { disc = Number(b.dataset.disc); renderCart(); renderCartBar(); }));
  $("clear-cart").onclick = () => { Object.keys(cart).forEach((k) => delete cart[k]); afterCartChange(); };

  // ---------- Payment ----------
  const total = () => calc(cart, disc).total;
  const parseCash = () => Number(($("cash").value || "").replace(/\D/g, "")) || 0;

  function setMethod(m) {
    method = m;
    document.querySelectorAll("[data-method]").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.method === m)));
    $("pay-cash").hidden = m !== "Tunai";
    $("pay-qris").hidden = m !== "QRIS";
  }
  document.querySelectorAll("[data-method]").forEach((b) => (b.onclick = () => setMethod(b.dataset.method)));

  function updateChange() {
    const el = $("cash");
    // Keep the caret after the same digit while the number is re-formatted (it used to jump to the end)
    const typing = document.activeElement === el;
    const digitsBefore = typing ? el.value.slice(0, el.selectionStart).replace(/\D/g, "").length : 0;
    const paid = parseCash();
    el.value = paid ? paid.toLocaleString("id-ID") : "";
    if (typing) {
      let pos = 0, seen = 0;
      while (pos < el.value.length && seen < digitsBefore) { if (/\d/.test(el.value[pos])) seen++; pos++; }
      el.setSelectionRange(pos, pos);
    }
    $("change").textContent = rp(Math.max(0, paid - total()));
    $("pay-cash-btn").disabled = paid < total();
  }
  $("cash").addEventListener("input", updateChange);

  function renderQuick() {
    const t = total();
    const opts = [t, ...[20000, 50000, 100000].filter((v) => v > t)];
    $("quick").innerHTML = "";
    opts.forEach((v, i) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = i === 0 ? "Uang pas" : rp(v);
      b.onclick = () => { $("cash").value = String(v); updateChange(); };
      $("quick").appendChild(b);
    });
  }

  function renderQR() {
    let r = Date.now() % 233280;
    const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    // The three corner "eyes" of a QR code: dark ring + dark 3x3 center
    const finderAt = (x, y) => [[0, 0], [14, 0], [0, 14]].find(([fx, fy]) => x >= fx && x < fx + 7 && y >= fy && y < fy + 7);
    let html = "";
    for (let y = 0; y < 21; y++) for (let x = 0; x < 21; x++) {
      const f = finderAt(x, y);
      let on;
      if (f) {
        const dx = x - f[0], dy = y - f[1];
        on = dx === 0 || dy === 0 || dx === 6 || dy === 6 || (dx >= 2 && dx <= 4 && dy >= 2 && dy <= 4);
      } else {
        on = rand() < 0.48;
      }
      html += `<i class="${on ? "on" : ""}"></i>`;
    }
    $("qr").innerHTML = html;
  }

  $("to-pay").onclick = () => {
    close("cart-sheet");
    $("pay-total").textContent = rp(total());
    $("cash").value = "";
    setMethod("Tunai");
    renderQuick();
    renderQR();
    updateChange();
    open("pay-sheet");
  };

  function finish(how, paid) {
    const seq = store.txs.length + 1;
    const tx = makeTx({ ...cart }, disc, how, paid, new Date(), false, seq);
    store.txs.push(tx);
    save();
    track("app_checkout", { metode: how, total: tx.total });
    Object.keys(cart).forEach((k) => delete cart[k]);
    disc = 0;
    renderMenu();
    renderCartBar();
    close("pay-sheet");
    showReceipt(tx);
  }
  $("pay-cash-btn").onclick = () => finish("Tunai", parseCash());
  $("pay-qris-btn").onclick = () => finish("QRIS", null);

  // ---------- Receipt ----------
  function showReceipt(tx) {
    const d = new Date(tx.time);
    const lines = tx.items.map((it) => `<div>${esc(it.name)}</div><div class="r"><span>${it.qty} × ${it.price.toLocaleString("id-ID")}</span><span>${(it.qty * it.price).toLocaleString("id-ID")}</span></div>`).join("");
    $("receipt").innerHTML = `
      <div class="c t">KOPI RINDANG</div>
      <div class="c">Jl. Rindang No. 7, Bandung</div>
      <hr>
      <div class="r"><span>${esc(tx.no)}</span><span>${pad(d.getDate())}/${pad(d.getMonth() + 1)} ${hhmm(d)}</span></div>
      <hr>${lines}<hr>
      <div class="r"><span>Subtotal</span><span>${tx.subtotal.toLocaleString("id-ID")}</span></div>
      ${tx.discount ? `<div class="r"><span>Diskon ${tx.discountPct}%</span><span>-${tx.discount.toLocaleString("id-ID")}</span></div>` : ""}
      <div class="r b"><span>TOTAL</span><span>${tx.total.toLocaleString("id-ID")}</span></div>
      <div class="r"><span>${esc(tx.method)}</span><span>${tx.paid.toLocaleString("id-ID")}</span></div>
      ${tx.method === "Tunai" ? `<div class="r"><span>Kembali</span><span>${tx.change.toLocaleString("id-ID")}</span></div>` : ""}
      <hr><div class="c">Terima kasih, sampai ngopi lagi ☕</div>
      ${tx.sample ? `<div class="c">(transaksi contoh)</div>` : ""}`;
    open("receipt-sheet");
  }
  $("print").onclick = () => window.print();

  // ---------- Riwayat ----------
  function renderHistory() {
    const txs = [...store.txs].reverse();
    const sum = txs.reduce((s, t) => s + t.total, 0);
    $("history-sum").textContent = `${txs.length} transaksi · ${rp(sum)}`;
    const ul = $("history");
    ul.innerHTML = "";
    txs.forEach((t) => {
      const li = document.createElement("li");
      const n = t.items.reduce((s, i) => s + i.qty, 0);
      li.innerHTML = `<button type="button"><span class="no">${esc(t.no)}</span><span class="amt">${rp(t.total)}</span>
        <span class="meta">${hhmm(new Date(t.time))} · ${n} item <span class="tag ${t.method === "QRIS" ? "qris" : ""}">${esc(t.method)}</span>${t.sample ? `<span class="tag">contoh</span>` : ""}</span></button>`;
      li.querySelector("button").onclick = () => showReceipt(t);
      ul.appendChild(li);
    });
  }

  // ---------- Laporan ----------
  function renderReport() {
    const txs = store.txs;
    const omzet = txs.reduce((s, t) => s + t.total, 0);
    const avg = txs.length ? omzet / txs.length : 0;
    const itemsSold = txs.reduce((s, t) => s + t.items.reduce((a, i) => a + i.qty, 0), 0);
    $("stats").innerHTML = `
      <div class="stat"><b>${rp(omzet)}</b><span>Omzet hari ini</span></div>
      <div class="stat"><b>${txs.length}</b><span>Transaksi</span></div>
      <div class="stat"><b>${rp(avg)}</b><span>Rata-rata / transaksi</span></div>
      <div class="stat"><b>${itemsSold}</b><span>Item terjual</span></div>
      <div class="stat"><b>${rp(txs.reduce((s, t) => s + t.discount, 0))}</b><span>Total diskon</span></div>`;

    const cash = txs.filter((t) => t.method === "Tunai").reduce((s, t) => s + t.total, 0);
    const qris = omzet - cash;
    const pc = omzet ? Math.round((cash / omzet) * 100) : 50;
    $("split").innerHTML = `<div class="cash" style="width:${pc}%">Tunai ${pc}%</div><div class="qris" style="width:${100 - pc}%">QRIS ${100 - pc}%</div>`;

    const qty = {};
    txs.forEach((t) => t.items.forEach((i) => (qty[i.name] = (qty[i.name] || 0) + i.qty)));
    const top = Object.entries(qty).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = top.length ? top[0][1] : 1;
    $("top").innerHTML = top.map(([name, n]) => `<li><div class="lbl"><span>${esc(name)}</span><b>${n}</b></div><div class="track"><div class="fill" style="width:${(n / max) * 100}%"></div></div></li>`).join("") || `<li class="muted">Belum ada penjualan.</li>`;

    const byHour = {};
    txs.forEach((t) => { const h = new Date(t.time).getHours(); byHour[h] = (byHour[h] || 0) + t.total; });
    const hours = Object.keys(byHour).map(Number).sort((a, b) => a - b);
    const hmax = Math.max(1, ...Object.values(byHour));
    const peak = hours.find((h) => byHour[h] === hmax);
    $("hours").innerHTML = hours.map((h) => `<div class="col ${h === peak ? "peak" : ""}"><span class="v">${Math.round(byHour[h] / 1000)}rb</span><div class="bar" style="height:${(byHour[h] / hmax) * 100}%"></div><span class="h">${pad(h)}</span></div>`).join("");
  }

  $("reset").onclick = () => {
    if (!window.confirm("Hapus semua transaksi di perangkat ini dan buat ulang data contoh?")) return;
    store = seed();
    save();
    renderReport();
    demoToast("Data demo sudah direset.");
  };

  // ---------- Tabs ----------
  function show(view) {
    ["kasir", "riwayat", "laporan"].forEach((v) => ($(`view-${v}`).hidden = v !== view));
    document.querySelectorAll(".tabbar button").forEach((b) => {
      if (b.dataset.view === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    $("cart-bar").style.visibility = view === "kasir" ? "" : "hidden";
    if (view === "riwayat") renderHistory();
    if (view === "laporan") renderReport();
    const scroller = window.matchMedia("(min-width: 900px)").matches ? $("app") : document.scrollingElement;
    scroller.scrollTop = 0;
  }
  document.querySelectorAll(".tabbar button").forEach((b) => (b.onclick = () => show(b.dataset.view)));

  // ---------- PWA: install + offline ----------
  let deferred = null;
  const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e;
    $("install").hidden = false;
  });
  if (!standalone && /iphone|ipad|ipod/i.test(navigator.userAgent)) $("install").hidden = false;
  $("install").onclick = async () => {
    if (deferred) {
      deferred.prompt();
      const choice = await deferred.userChoice;
      track("app_install_prompt", { hasil: choice.outcome });
      deferred = null;
      $("install").hidden = true;
    } else {
      demoToast("Di iPhone: ketuk tombol Bagikan, lalu pilih \"Tambahkan ke Layar Utama\".");
    }
  };
  window.addEventListener("appinstalled", () => { $("install").hidden = true; });
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  // ---------- Start ----------
  $("today").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" }) + " · Kasir";
  $("search").addEventListener("input", renderMenu);
  renderCats();
  renderMenu();
  renderCartBar();
  if (newDayNote) setTimeout(() => demoToast("Hari baru: laporan harian dimulai ulang. Transaksi kemarin tidak ditampilkan lagi."), 600);
})();
