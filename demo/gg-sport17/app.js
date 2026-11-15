/* GG Sport17 storefront. Data lives in products.js, the 3D scene in scene3d.js. */
const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const fmt = n => 'Rp' + n.toLocaleString('id-ID');
const hasPrice = p => typeof p.price === 'number' && p.price > 0;
const photo = (p, i = 1) => `images/${p.slug}/${String(i).padStart(2, '0')}.jpg`;
const catOf = id => CATEGORIES.find(c => c.id === id);
const byId = id => PRODUCTS.find(p => p.id === id);
const icon = (id, cls = '') => `<svg${cls ? ` class="${cls}"` : ''}><use href="#${id}"/></svg>`;
// Model 3D roll asli tiap warna (models/models.js, dari hasil-3d). Tombol warna, keranjang, dan
// gambar cadangan memakai render model itu; warna pita cahaya dibaca dari teksturnya.
/* global MODEL */
const MP = typeof MODEL !== 'undefined' ? MODEL.produk : {};
// Foto potongan Adobe (images/hasil/hasil.js): deret roll dan kartu jenis.
const HS = typeof HASIL !== 'undefined' ? HASIL : {};
const colorsOf = p => (p.colors || []).map(([name, foto]) => {
  const m = (MP[p.slug] && MP[p.slug].warna[name]) || null;
  return { name, foto, m, hex: (m && m.hex) || WARNA[name] || '#888' };
});
// Rak dan layar pertama hanya menampilkan warna yang punya model 3D
const rakColors = p => colorsOf(p).filter(c => c.m);
const swatches = (p, on, list = colorsOf(p)) => list.map(c =>
  `<button type="button" data-warna="${esc(c.name)}" data-line="${p.id}" aria-pressed="${c.name === on}" aria-label="${esc(c.name)}" title="${esc(c.name)}">${c.m ? `<img src="${c.m.thumb}" alt="" width="44" height="44" loading="lazy">` : `<i style="--c:${c.hex}"></i>`}</button>`).join('');
// Gambar produk dari render model 3D (warna tertentu atau warna pertama); null = pakai foto katalog.
// kecil: 160 px, hanya rollnya (daftar produk, keranjang). Besar: 480 px, dengan kotak Kindmax.
const thumbOf = (p, warna, kecil) => {
  const cs = colorsOf(p).filter(c => c.m);
  const c = cs.find(x => x.name === warna) || cs[0];
  return c ? (kecil ? c.m.thumb : c.m.foto) : null;
};

// Promo links carry ?src=tiktok etc.; remember it for the visit so WA chats show the channel.
const SOURCE = (() => {
  const fromUrl = (new URLSearchParams(location.search).get('src') || '').replace(/[^\w-]/g, '').slice(0, 30);
  try {
    if (fromUrl) sessionStorage.setItem('ggsport17-src', fromUrl);
    return fromUrl || sessionStorage.getItem('ggsport17-src') || '';
  } catch { return fromUrl; }
})();

function waLink(msg) {
  if (SOURCE) msg += `\n\n(via ${SOURCE})`;
  return `https://wa.me/${STORE.whatsapp}?text=${encodeURIComponent(msg)}`;
}
function openWA(msg) {
  // Salinan portofolio (window.GG_DEMO) tidak mengirim pesanan sungguhan.
  if (window.GG_DEMO) { toast('Ini salinan portofolio. Pesanan tidak dikirim.'); return; }
  window.open(waLink(msg), '_blank', 'noopener');
}

let toastT;
function toast(msg) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), 2600);
}

/* ---------- Warna aktif: dipakai roll 3D, rak, dan hero ---------- */
const LINES = PRODUCTS.filter(p => rakColors(p).length);
const pick = { line: LINES.find(p => p.slug === 'kindmax') || LINES[0], warna: 'Biru muda' };
if (pick.line && !rakColors(pick.line).some(c => c.name === pick.warna)) pick.warna = rakColors(pick.line)[0].name;

function mix(hex, base, t) {
  const a = parseInt(hex.slice(1), 16), b = parseInt(base.slice(1), 16);
  const ch = s => Math.round(((a >> s) & 255) * t + ((b >> s) & 255) * (1 - t));
  return `rgb(${ch(16)} ${ch(8)} ${ch(0)})`;
}

function pickState() {
  const colors = rakColors(pick.line);
  const idx = Math.max(0, colors.findIndex(c => c.name === pick.warna));
  return { id: pick.line.id, slug: pick.line.slug, cat: pick.line.cat, name: pick.line.name, warna: colors[idx].name, hex: colors[idx].hex, foto: colors[idx].foto, m: colors[idx].m, idx, colors };
}
window.GG = { get: pickState, lines: LINES.map(p => p.slug) };

function setPick(lineId, warna, from) {
  const line = byId(lineId) || pick.line;
  const colors = rakColors(line);
  pick.line = line;
  pick.warna = colors.some(c => c.name === warna) ? warna : (colors.some(c => c.name === pick.warna) ? pick.warna : colors[0].name);
  renderPick();
  document.dispatchEvent(new CustomEvent('gg:warna', { detail: { ...pickState(), from } }));
}

function renderPick() {
  if (!pick.line) return;
  const s = pickState();
  const harga = hasPrice(pick.line) ? `, ${fmt(pick.line.price)} per roll` : '';
  const tabs = LINES.map(p =>
    `<button type="button" role="tab" aria-selected="${p.id === s.id}" data-line="${p.id}">${esc(shortName(p))}</button>`).join('');
  $('#rak-tabs').innerHTML = tabs;
  $('#hero-tabs').innerHTML = tabs;
  $('#hero-line').textContent = pick.line.name.match(/\d[\d,]* Cm x [\d,]+ M/i)?.[0].toLowerCase() || '';
  $('#hero-harga').textContent = hasPrice(pick.line) ? `${fmt(pick.line.price)} per roll` : 'Harga lewat WhatsApp';
  $('#rak-nama').textContent = `${pick.line.name}. ${pick.line.desc.slice(0, 2).join(', ')}.`;
  $('#rak-warna').textContent = `${s.warna}${harga}`;
  $('#rak-sw').innerHTML = swatches(pick.line, s.warna, s.colors);
  $('#rak').style.setProperty('--rak-field', mix(s.hex, '#14171A', s.warna === 'Putih' ? .2 : .3));
  $('#hero-stage').style.setProperty('--sorot', s.hex);
  const fb = $('#rak-fb');
  fb.src = s.m.foto;
  fb.alt = `${pick.line.name} warna ${s.warna}`;
  $('#hero-fb').src = s.m.foto;

  $('#hero-sw').innerHTML = swatches(pick.line, s.warna, s.colors);
  $('#hero-pick-txt').innerHTML = `${esc(shortName(pick.line))} warna <b>${esc(s.warna.toLowerCase())}</b>`;
}
function shortName(p) { return p.name.split(/\s+\d|\s–/)[0].replace(/ Strong Plus| Sports Tape| Solid/g, '').trim(); }

/* ---------- Static sections ---------- */
// Foto kartu jenis: potongan Adobe bila ada, selain itu foto pertama produk di jenis itu
const FOTO_JENIS = { kinesio: 'kt-tumpukan', finger: 'ft-oren' };
const img = (src, w, h, cls = '') => `<img${cls ? ` class="${cls}"` : ''} src="${src}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async">`;

function renderStatic() {
  const pts = CATEGORIES.map(c => {
    const items = PRODUCTS.filter(p => p.cat === c.id);
    if (!items.length) return null;
    const priced = items.filter(hasPrice).map(p => p.price);
    const harga = priced.length ? `mulai ${fmt(Math.min(...priced))}` : 'harga lewat WhatsApp';
    const h = HS[FOTO_JENIS[c.id]];
    return { attr: `data-cat="${c.id}"`, t: c.name, d: c.blurb + '.', m: `${items.length} produk, ${harga}`, foto: h ? img(h.src, h.w, h.h) : img(photo(items[0]), 600, 600), potong: !!h };
  }).filter(Boolean);
  pts.push({ attr: 'data-wa="Halo GG Sport17! Saya mau konsultasi pilih tape yang cocok."', t: 'Belum yakin?', d: 'Ceritakan cederanya lewat WhatsApp.', m: 'Kami bantu pilihkan', foto: img('images/toko/genggam-hijau.jpg', 1200, 1600), potong: false });
  $('#pts').innerHTML = pts.map((p, i) =>
    `<li data-rv style="--d:${(i % 4) * 60}ms"><button type="button" class="panel kj" ${p.attr}><span class="kj-foto${p.potong ? ' potong' : ''}">${p.foto}</span><span class="kj-isi"><span class="kj-n">${esc(p.t)}</span><span class="kj-d">${esc(p.d)}</span><span class="kj-m">${esc(p.m)}<svg aria-hidden="true"><use href="#i-arah"/></svg></span></span></button></li>`).join('');

  // Deret roll di bagian pernyataan: tiga baris yang berjalan terus berlawanan arah (lihat deretJalan).
  // Kinematic dan Finger Tape dari foto Adobe, Kindmax (dengan kotaknya) dari render model 3D.
  // Isi ditulis dua kali supaya putarannya menyambung tanpa jeda; --k menggeser fase ayunan tiap roll.
  const baris = (daftar, arah) => {
    if (!daftar.length) return '';
    const isi = k0 => daftar.map(([src, w, h, cls], i) => `<img${cls ? ` class="${cls}"` : ''} src="${src}" alt="" width="${w}" height="${h}" loading="lazy" decoding="async" style="--k:${k0 + i}">`).join('');
    return `<div class="deret-baris" style="--arah:${arah}">${isi(0)}${isi(daftar.length)}</div>`;
  };
  const dariHasil = pref => Object.keys(HS).filter(k => k.startsWith(pref) && k !== 'kt-tumpukan').map(k => [HS[k].src, HS[k].w, HS[k].h]);
  const km = MP.kindmax ? Object.values(MP.kindmax.warna).map(w => [w.foto, 480, 480, 'r3d']) : [];
  $('#deret').innerHTML = baris(dariHasil('kt-'), 1) + baris(km, -1) + baris(dariHasil('ft-'), 1);

  const [big, ...rest] = STORE.stats;
  $('#fig').innerHTML = `<span class="hit">${esc(big.value)}</span>${big.unit ? `<small>${esc(big.unit)}</small>` : ''}`;
  $('#fig-s').textContent = big.label;
  $('#angka-2').innerHTML = rest.map(s => `<div><dt>${esc(s.label)}</dt><dd><span class="hit">${esc(s.value)}</span></dd></div>`).join('');

  $('#ftr-wa').textContent = 'WhatsApp: ' + STORE.whatsappLabel;
  $('#ftr-shopee').href = STORE.shopeeUrl;
  $('#year').textContent = new Date().getFullYear();
}

/* ---------- Catalog ---------- */
let activeCat = 'semua', query = '';

function renderCatalog() {
  const pills = [{ id: 'semua', name: 'Semua' }, ...CATEGORIES];
  $('#pills').innerHTML = pills.map(c => {
    const n = c.id === 'semua' ? PRODUCTS.length : PRODUCTS.filter(p => p.cat === c.id).length;
    return n ? `<button class="pill${activeCat === c.id ? ' on' : ''}" role="tab" aria-selected="${activeCat === c.id}" data-cat="${c.id}">${esc(c.name)}<small>${n}</small></button>` : '';
  }).join('');

  const q = query.trim().toLowerCase();
  const list = PRODUCTS.filter(p =>
    (activeCat === 'semua' || p.cat === activeCat) &&
    (!q || [p.name, catOf(p.cat)?.name, ...p.desc, ...(p.colors || []).map(c => c[0])].join(' ').toLowerCase().includes(q))
  );

  $('#daftar').innerHTML = list.map(row).join('');
  $('#empty').hidden = list.length > 0;
  const where = activeCat === 'semua' ? '' : ` di ${catOf(activeCat).name}`;
  $('#prod-count').textContent = q
    ? `${list.length} hasil untuk “${query.trim()}”${where}`
    : `${list.length} produk${where}`;
}

function priceHTML(p) {
  if (!hasPrice(p)) return `<span class="ask">Harga lewat WhatsApp</span>`;
  return `<span class="price">${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ''}${fmt(p.price)}</span>`;
}

function row(p) {
  const note = [catOf(p.cat).name, p.badge, p.colors ? `${p.colors.length} warna` : '', `${p.photos} foto`].filter(Boolean).join(' · ');
  const act = !hasPrice(p)
    ? `<button type="button" class="btn btn-2" data-ask="${p.id}">Tanya harga</button>`
    : p.colors
      ? `<button type="button" class="btn" data-open="${p.id}">Pilih warna</button>`
      : `<button type="button" class="btn" data-add="${p.id}">Tambah</button>`;
  const t3 = thumbOf(p, null, true);
  return `<article class="row">
    <button type="button" class="row-l up" data-open="${p.id}"><img${t3 ? ' class="r3d"' : ''} src="${t3 || photo(p)}" alt="" width="88" height="88" loading="lazy"><span><span class="row-n">${esc(p.name)}</span><span class="row-d">${esc(note)}</span></span></button>
    <div class="row-r up">${priceHTML(p)}${act}</div>
  </article>`;
}

function setCat(id, scroll = true) {
  activeCat = id;
  renderCatalog();
  if (scroll) $('#produk').scrollIntoView({ behavior: 'smooth' });
}

/* ---------- Product detail ---------- */
let current = null, qty = 1, curWarna = '', geser3d = 0;

function openProduct(id, push = true, warna = '') {
  const p = byId(id);
  if (!p) return;
  current = p; qty = 1;
  const colors = colorsOf(p);
  curWarna = colors.length ? (colors.some(c => c.name === warna) ? warna : (pick.line === p && colors.some(c => c.name === pick.warna) ? pick.warna : colors[0].name)) : '';
  // Slide pertama: render model 3D warna terpilih (bila ada), lalu foto katalog
  const r3 = thumbOf(p, curWarna);
  geser3d = r3 ? 1 : 0;
  const imgs = [...(r3 ? [r3] : []), ...Array.from({ length: p.photos }, (_, i) => photo(p, i + 1))];
  const priced = hasPrice(p);

  $('#pd').innerHTML = `
    <div class="gal">
      <div class="gal-main">
        <div class="gal-track" id="gal-track">${imgs.map((src, i) => `<img${i < geser3d ? ' class="r3d" id="gal-3d"' : ''} src="${src}" alt="${esc(p.name)} ${i < geser3d ? `warna ${esc(curWarna.toLowerCase())}, model 3D` : `foto ${i + 1 - geser3d}`}" ${i ? 'loading="lazy"' : ''}>`).join('')}</div>
        ${imgs.length > 1 ? `<button class="gal-nav prev" data-gal="-1" aria-label="Foto sebelumnya">${icon('i-chev')}</button><button class="gal-nav next" data-gal="1" aria-label="Foto berikutnya">${icon('i-chev')}</button><span class="gal-idx" id="gal-idx">1 / ${imgs.length}</span>` : ''}
      </div>
      ${imgs.length > 1 ? `<div class="thumbs" id="thumbs">${imgs.map((src, i) => `<button class="${i ? '' : 'on'}${i < geser3d ? ' r3d' : ''}" data-thumb="${i}" aria-label="${i < geser3d ? 'Model 3D' : `Foto ${i + 1 - geser3d}`}"><img${i < geser3d ? ' id="thumb-3d"' : ''} src="${src}" alt="" loading="lazy"></button>`).join('')}</div>` : ''}
    </div>
    <div class="pd-info">
      <span class="card-cat">${esc(catOf(p.cat).name)}</span>
      <h2 id="pd-name">${esc(p.name)}</h2>
      ${priced
        ? `<div class="pd-price">${fmt(p.price)}${p.oldPrice ? `<s>${fmt(p.oldPrice)}</s>` : ''}</div>`
        : `<div class="pd-ask"><b>Harga lewat WhatsApp.</b> Tanyakan harga terbaru, stok, dan pilihan warna ke admin kami.</div>`}
      <ul class="pd-desc">${p.desc.map(d => `<li>${icon('i-check')}<span>${esc(d)}</span></li>`).join('')}</ul>
      ${colors.length ? `<div class="pd-warna"><p>Warna: <b id="pd-warna-n">${esc(curWarna)}</b></p><div class="sw" id="pd-sw" role="group" aria-label="Pilih warna">${swatches(p, curWarna)}</div></div>` : ''}
      <div class="qty-row">Jumlah
        <div class="qty"><button data-qty="-1" aria-label="Kurangi">−</button><span id="pd-qty">1</span><button data-qty="1" aria-label="Tambah">+</button></div>
      </div>
      <div class="pd-act">
        <button class="btn btn-block" id="pd-add">${icon('i-cart')}Tambah ke keranjang</button>
        <button class="btn btn-wa btn-block" id="pd-wa">${icon('i-wa')}${priced ? 'Pesan lewat WhatsApp' : 'Tanya harga lewat WhatsApp'}</button>
      </div>
      <p class="pd-shopee">Lebih suka checkout di marketplace? <a href="${esc(STORE.shopeeUrl)}" target="_blank" rel="noopener">Cari di Shopee</a></p>
    </div>`;

  const track = $('#gal-track');
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / track.clientWidth);
    const idx = $('#gal-idx');
    if (idx) idx.textContent = `${i + 1} / ${imgs.length}`;
    $$('#thumbs button').forEach((b, j) => b.classList.toggle('on', i === j));
  }, { passive: true });

  $('#modal').hidden = false;
  document.body.classList.add('lock');
  $('.modal-x').focus({ preventScroll: true });
  const c = colors.find(x => x.name === curWarna);
  if (!geser3d && c && c.foto > 1) track.scrollTo({ left: (c.foto - 1) * track.clientWidth });
  if (push && location.hash !== '#p/' + p.slug) { history.pushState({ p: p.id }, '', '#p/' + p.slug); pushed = true; }
}

function setModalWarna(name) {
  curWarna = name;
  $('#pd-warna-n').textContent = name;
  $$('#pd-sw button').forEach(b => b.setAttribute('aria-pressed', b.dataset.warna === name));
  const c = colorsOf(current).find(x => x.name === name);
  // Sedang melihat model 3D: modelnya berganti warna. Sedang melihat foto: lompat ke foto warna itu.
  if (geser3d && c && c.m) {
    $('#gal-3d').src = c.m.foto; $('#thumb-3d').src = c.m.foto;
    $('#gal-3d').alt = `${current.name} warna ${name.toLowerCase()}, model 3D`;
    if (photoIndex() === 0) return;
  }
  if (c && c.foto) goPhoto(c.foto - 1 + geser3d);
}

// pushed: we added the #p/ entry ourselves, so Back returns to the page.
// Otherwise the visitor arrived via a shared product link; just drop the hash.
let pushed = false;
function closeProduct(fromHistory = false) {
  if ($('#modal').hidden) return;
  $('#modal').hidden = true;
  document.body.classList.remove('lock');
  current = null;
  const wasPushed = pushed;
  pushed = false;
  if (fromHistory || !location.hash.startsWith('#p/')) return;
  if (wasPushed) history.back();
  else history.replaceState(null, '', location.pathname + location.search);
}

function goPhoto(i) {
  const track = $('#gal-track');
  if (!track) return;
  const n = track.children.length;
  i = (i + n) % n;
  track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
}
function photoIndex() { const t = $('#gal-track'); return Math.round(t.scrollLeft / t.clientWidth); }

function productMsg(p, n, v = '') {
  const nama = `*${p.name}*${v ? `\nWarna: ${v}` : ''}`;
  const line = hasPrice(p) ? `\nHarga: ${fmt(p.price)} × ${n} = ${fmt(p.price * n)}` : `\nJumlah: ${n} pcs`;
  return hasPrice(p)
    ? `Halo GG Sport17! Saya mau pesan:\n\n${nama}${line}\n\nApakah stok tersedia? Terima kasih.`
    : `Halo GG Sport17! Saya mau tanya harga & stok:\n\n${nama}${line}\n\nTerima kasih.`;
}

function routeFromHash() {
  const m = location.hash.match(/^#p\/([\w-]+)$/);
  const p = m && PRODUCTS.find(x => x.slug === m[1]);
  if (p) openProduct(p.id, false);
  else closeProduct(true);
}

/* ---------- Cart (satu baris per produk + warna) ---------- */
const CART_KEY = 'ggsport17-cart';
let cart = [];
try { cart = (JSON.parse(localStorage.getItem(CART_KEY)) || []).filter(i => byId(i.id)).map(i => ({ id: i.id, qty: i.qty, v: i.v || '' })); } catch { cart = []; }
const saveCart = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch {} };
const keyOf = i => `${i.id}|${i.v}`;
const findItem = key => cart.find(i => keyOf(i) === key);

function addToCart(id, n = 1, v = '') {
  const it = findItem(`${id}|${v}`);
  if (it) it.qty += n; else cart.push({ id, qty: n, v });
  saveCart(); updateCount(true);
}
function setQty(key, d) {
  const it = findItem(key);
  if (!it) return;
  it.qty += d;
  if (it.qty <= 0) cart = cart.filter(i => i !== it);
  saveCart(); updateCount(); renderCart();
}
function updateCount(bump = false) {
  const n = cart.reduce((s, i) => s + i.qty, 0);
  const el = $('#cart-count');
  el.textContent = n; el.hidden = n === 0;
  if (bump) { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); }
}

function cartTotals() {
  let total = 0, unpriced = 0;
  cart.forEach(i => { const p = byId(i.id); if (hasPrice(p)) total += p.price * i.qty; else unpriced++; });
  return { total, unpriced };
}

function renderCart() {
  const body = $('#cart-body'), ft = $('#cart-ft');
  if (!cart.length) {
    body.innerHTML = `<div class="cart-empty">${icon('i-cart')}<p><b>Keranjang masih kosong.</b><br>Pilih produk dulu, lalu kembali ke sini.</p><button class="btn" data-close-cart data-go="produk">Lihat produk</button></div>`;
    ft.hidden = true;
    return;
  }
  body.innerHTML = cart.map(i => {
    const p = byId(i.id), k = esc(keyOf(i));
    const c = colorsOf(p).find(x => x.name === i.v);
    const t3 = c && c.m ? c.m.thumb : (!i.v && thumbOf(p, null, true));
    return `<div class="ci">
      <img${t3 ? ' class="r3d"' : ''} src="${t3 || photo(p, (c && c.foto) || 1)}" alt="">
      <div class="ci-b">
        <div class="ci-n">${esc(p.name)}</div>
        <div class="ci-p">${i.v ? `Warna ${esc(i.v.toLowerCase())} · ` : ''}${hasPrice(p) ? `${fmt(p.price)} / pcs` : 'Harga dikonfirmasi lewat WA'}</div>
        <div class="ci-row">
          <div class="qty"><button data-cq="${k}" data-d="-1" aria-label="Kurangi">−</button><span>${i.qty}</span><button data-cq="${k}" data-d="1" aria-label="Tambah">+</button></div>
          <button class="icon-btn ci-del" data-del="${k}" aria-label="Hapus">${icon('i-trash')}</button>
        </div>
      </div>
    </div>`;
  }).join('');

  const { total, unpriced } = cartTotals();
  const saved = loadForm();
  ft.hidden = false;
  ft.innerHTML = `
    <div class="sum"><span>Subtotal</span><b>${total ? fmt(total) : '–'}</b></div>
    <p class="sum-note">${unpriced ? `${unpriced} produk harganya dikonfirmasi admin. ` : ''}Ongkir dihitung admin sesuai alamat.</p>
    <label class="field"><span>Nama penerima</span><input id="f-name" autocomplete="name" value="${esc(saved.name || '')}"></label>
    <label class="field"><span>No. WhatsApp</span><input id="f-phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="08xxxxxxxxxx" value="${esc(saved.phone || '')}"></label>
    <label class="field"><span>Alamat lengkap (jalan, kecamatan, kota, kode pos)</span><textarea id="f-addr" autocomplete="street-address">${esc(saved.addr || '')}</textarea></label>
    <label class="field"><span>Catatan (ukuran, motif, dll), boleh kosong</span><input id="f-note" value="${esc(saved.note || '')}"></label>
    <button class="btn btn-wa btn-block" id="checkout">${icon('i-wa')}Kirim pesanan lewat WhatsApp</button>`;
}

const FORM_KEY = 'ggsport17-form';
function loadForm() { try { return JSON.parse(localStorage.getItem(FORM_KEY)) || {}; } catch { return {}; } }
function saveForm(f) { try { localStorage.setItem(FORM_KEY, JSON.stringify(f)); } catch {} }

function checkout() {
  const f = { name: $('#f-name').value.trim(), phone: $('#f-phone').value.trim(), addr: $('#f-addr').value.trim(), note: $('#f-note').value.trim() };
  const missing = [['name', '#f-name'], ['phone', '#f-phone'], ['addr', '#f-addr']].filter(([k]) => !f[k]);
  $$('#cart-ft .field-err').forEach(e => e.classList.remove('field-err'));
  if (missing.length) {
    missing.forEach(([, s]) => $(s).classList.add('field-err'));
    $(missing[0][1]).focus();
    toast('Lengkapi nama, no. WhatsApp, dan alamat dulu');
    return;
  }
  saveForm(f);
  const items = cart.map((i, n) => {
    const p = byId(i.id);
    return `${n + 1}. ${p.name}${i.v ? ` (warna ${i.v.toLowerCase()})` : ''}\n   ${i.qty} pcs${hasPrice(p) ? ` × ${fmt(p.price)} = ${fmt(p.price * i.qty)}` : ' (mohon info harga)'}`;
  }).join('\n');
  const { total, unpriced } = cartTotals();
  const totalLine = total ? `\n\n*Subtotal: ${fmt(total)}*${unpriced ? ' (belum termasuk produk yang perlu konfirmasi harga)' : ''}` : '';
  const msg = `Halo GG Sport17! Saya mau order:\n\n${items}${totalLine}\n\n*Data pengiriman*\nNama: ${f.name}\nNo. WA: ${f.phone}\nAlamat: ${f.addr}${f.note ? `\nCatatan: ${f.note}` : ''}\n\nMohon info total + ongkir dan cara pembayarannya. Terima kasih!`;
  openWA(msg);
}

function openCart() {
  renderCart();
  $('#drawer').classList.add('open');
  $('#drawer').setAttribute('aria-hidden', 'false');
  document.body.classList.add('lock');
}
function closeCart() {
  $('#drawer').classList.remove('open');
  $('#drawer').setAttribute('aria-hidden', 'true');
  if ($('#modal').hidden) document.body.classList.remove('lock');
}

/* ---------- Events ---------- */
document.addEventListener('click', e => {
  const t = e.target;
  const wa = t.closest('[data-wa]');
  if (wa) { e.preventDefault(); openWA(wa.dataset.wa); return; }

  const sw = t.closest('[data-warna]');
  if (sw) {
    if (sw.closest('#pd-sw')) setModalWarna(sw.dataset.warna);
    else setPick(+sw.dataset.line, sw.dataset.warna, sw.closest('#hero-sw') ? 'hero' : 'rak');
    return;
  }
  const tab = t.closest('#rak-tabs [data-line], #hero-tabs [data-line]');
  if (tab) {
    const wadah = tab.parentElement.id;
    setPick(+tab.dataset.line, pick.warna, 'tab');
    $(`#${wadah} [data-line="${tab.dataset.line}"]`)?.focus();
    return;
  }
  const tambah = t.closest('#rak-add, #hero-add');
  if (tambah) {
    const s = pickState();
    terbang(s.m.foto, tambah.id === 'hero-add' ? $('#hero-stage') : $('#rak-stage'));
    addToCart(pick.line.id, 1, pick.warna);
    toast(`${shortName(pick.line)} ${pick.warna.toLowerCase()} masuk keranjang`);
    return;
  }
  if (t.closest('#rak-foto, #hero-foto')) { openProduct(pick.line.id, true, pick.warna); return; }

  const cat = t.closest('[data-cat]');
  if (cat) { e.preventDefault(); setCat(cat.dataset.cat, !cat.closest('#pills')); return; }

  const add = t.closest('[data-add]');
  if (add) { const p = byId(+add.dataset.add); terbang(thumbOf(p) || photo(p), add.closest('.row') || add); addToCart(p.id, 1); toast(`${p.name} masuk keranjang`); return; }
  const ask = t.closest('[data-ask]');
  if (ask) { openWA(productMsg(byId(+ask.dataset.ask), 1)); return; }

  const open = t.closest('[data-open]');
  if (open) { openProduct(+open.dataset.open); return; }

  if (t.closest('[data-close]')) { closeProduct(); return; }
  if (t.closest('[data-close-cart]')) {
    closeCart();
    const go = t.closest('[data-go]');
    if (go) $('#' + go.dataset.go).scrollIntoView({ behavior: 'smooth' });
    return;
  }

  const g = t.closest('[data-gal]');
  if (g) { goPhoto(photoIndex() + +g.dataset.gal); return; }
  const th = t.closest('[data-thumb]');
  if (th) { goPhoto(+th.dataset.thumb); return; }

  const q = t.closest('[data-qty]');
  if (q) { qty = Math.max(1, Math.min(99, qty + +q.dataset.qty)); $('#pd-qty').textContent = qty; return; }

  if (t.closest('#pd-add')) {
    terbang(thumbOf(current, curWarna) || photo(current), $('.gal-main'));
    addToCart(current.id, qty, curWarna);
    toast(`${qty} × ${current.name}${curWarna ? ` ${curWarna.toLowerCase()}` : ''} masuk keranjang`);
    return;
  }
  if (t.closest('#pd-wa')) { openWA(productMsg(current, qty, curWarna)); return; }

  const cq = t.closest('[data-cq]');
  if (cq) { setQty(cq.dataset.cq, +cq.dataset.d); return; }
  const del = t.closest('[data-del]');
  if (del) { setQty(del.dataset.del, -Infinity); return; }
  if (t.closest('#checkout')) { checkout(); return; }

  if (t.closest('#cart-open')) { openCart(); return; }
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('#drawer').classList.contains('open')) closeCart(); else closeProduct(); }
  if (!$('#modal').hidden && (e.key === 'ArrowLeft' || e.key === 'ArrowRight') && $('#gal-track')) goPhoto(photoIndex() + (e.key === 'ArrowRight' ? 1 : -1));
});

// Roll di rak 3D diketuk -> scene3d.js mengirim nomor warnanya.
document.addEventListener('gg:pick', e => {
  const c = rakColors(pick.line)[e.detail.idx];
  if (c) setPick(pick.line.id, c.name, 'rak3d');
});

let searchT;
$('#search').addEventListener('input', e => {
  clearTimeout(searchT);
  searchT = setTimeout(() => { query = e.target.value; renderCatalog(); }, 120);
});
window.addEventListener('popstate', routeFromHash);

/* ---------- Gerak ----------
   Semua gerak hanya transform/opacity, mati total bila pengunjung memilih gerak dikurangi. */
const DIAM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const HALUS = matchMedia('(hover: hover) and (pointer: fine)').matches;

// Roll kecil terbang ke tombol keranjang: menunjukkan ke mana barangnya masuk
let dockT;
function terbang(src, dari) {
  if (DIAM || !src || !dari || !Element.prototype.animate) return;
  document.body.classList.add('dock-on');
  clearTimeout(dockT); dockT = setTimeout(() => document.body.classList.remove('dock-on'), 1800);
  const a = dari.getBoundingClientRect(), b = $('#cart-open').getBoundingClientRect();
  const size = 88, x0 = a.left + a.width / 2 - size / 2, y0 = a.top + a.height / 2 - size / 2;
  const dx = b.left + b.width / 2 - size / 2 - x0, dy = b.top + b.height / 2 - size / 2 - y0;
  const kotak = document.createElement('div');
  kotak.className = 'terbang';
  kotak.style.cssText = `left:${x0}px;top:${y0}px;width:${size}px;height:${size}px`;
  const im = new Image(); im.src = src; im.alt = '';
  kotak.append(im); document.body.append(kotak);
  const naik = Math.min(180, 70 + Math.abs(dy) * .25);
  // sumbu x rata, sumbu y naik dulu lalu jatuh: lintasan melengkung
  kotak.animate([{ transform: 'translateX(0)' }, { transform: `translateX(${dx}px)` }], { duration: 720, easing: 'cubic-bezier(.45,0,.55,1)' });
  const jatuh = im.animate([
    { transform: 'translateY(0) scale(.7) rotate(0)', opacity: 0, easing: 'cubic-bezier(.2,.8,.3,1)' },
    { transform: `translateY(${-naik}px) scale(1) rotate(-50deg)`, opacity: 1, offset: .35, easing: 'cubic-bezier(.6,0,.9,.5)' },
    { transform: `translateY(${dy}px) scale(.32) rotate(-160deg)`, opacity: 1 },
  ], { duration: 720, fill: 'forwards' });
  jatuh.onfinish = () => {
    kotak.remove();
    $('#cart-open').animate([{ transform: 'scale(1)' }, { transform: 'scale(1.1)' }, { transform: 'scale(1)' }], { duration: 320, easing: 'cubic-bezier(.2,.7,.2,1)' });
  };
}

// Judul dipecah per kata supaya bisa naik bergantian dari balik garis
function pecahKata(el) {
  let i = 0;
  const jalan = node => [...node.childNodes].forEach(n => {
    if (n.nodeType === 3) {
      const frag = document.createDocumentFragment();
      n.textContent.split(/(\s+)/).forEach(w => {
        if (!w) return;
        if (/^\s+$/.test(w)) { frag.append(' '); return; }
        const o = document.createElement('span'), s = document.createElement('span');
        o.className = 'kata'; s.textContent = w; s.style.setProperty('--i', i++);
        o.append(s); frag.append(o);
      });
      n.replaceWith(frag);
    } else if (n.nodeType === 1 && n.tagName !== 'BR' && !n.classList.contains('kata')) jalan(n);
  });
  jalan(el);
  el.classList.add('pecah');
}

// Angka toko menghitung naik saat terlihat
function siapHitung(el) {
  const asli = el.textContent.trim();
  const m = asli.match(/^([\d.,]+)(.*)$/);
  if (!m) return null;
  const desimal = (m[1].split(',')[1] || '').length;
  const nilai = parseFloat(m[1].replace(/\./g, '').replace(',', '.'));
  const tulis = v => v.toLocaleString('id-ID', { minimumFractionDigits: desimal, maximumFractionDigits: desimal }) + m[2];
  el.style.minWidth = asli.length + 'ch';
  el.textContent = tulis(0);
  return () => {
    const t0 = performance.now();
    const step = now => {
      const p = Math.min(1, (now - t0) / 1100), e = 1 - Math.pow(1 - p, 3);
      el.textContent = p < 1 ? tulis(desimal ? Math.round(nilai * e * 10 ** desimal) / 10 ** desimal : Math.round(nilai * e)) : asli;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
}

// Deret roll berjalan terus seperti ban berjalan. Kecepatan gulir halaman ikut mendorong:
// gulir ke bawah = makin cepat, gulir ke atas = berbalik arah sebentar. Melambat saat kursor
// di atasnya. Hanya berjalan saat bagiannya terlihat; hanya mengubah transform.
function deretJalan() {
  const wadah = $('#deret'), rows = $$('.deret-baris');
  if (!wadah || !rows.length || !('IntersectionObserver' in window)) return;
  const st = rows.map((el, i) => ({ el, arah: +el.style.getPropertyValue('--arah') || 1, x: 0, periode: 1, awal: .15 + i * .3 }));
  const ukur = () => st.forEach(r => {
    const g = parseFloat(getComputedStyle(r.el).columnGap) || 0;
    const lama = r.periode;
    r.periode = Math.max(1, (r.el.offsetWidth + g) / 2);      // satu salinan isi + satu celah
    r.x = lama > 1 ? r.x / lama * r.periode : -r.periode * r.awal;
    r.el.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0)`;
  });
  ukur();
  addEventListener('resize', ukur);
  addEventListener('load', ukur);
  wadah.classList.add('jalan');
  const DASAR = innerWidth < 760 ? 26 : 38;                    // px per detik
  let tampak = false, raf = 0, last = 0, lastY = scrollY, dorong = 0, pelan = 1, pelanT = 1;
  const loop = now => {
    raf = tampak ? requestAnimationFrame(loop) : 0;
    const dt = Math.min(.05, (now - last) / 1000 || .016); last = now;
    const dy = scrollY - lastY; lastY = scrollY;
    const target = Math.max(-900, Math.min(900, dy / dt * .35));
    dorong += (target - dorong) * Math.min(1, dt * (Math.abs(target) > Math.abs(dorong) ? 10 : 2.5));
    pelan += (pelanT - pelan) * Math.min(1, dt * 4);
    st.forEach(r => {
      r.x -= (DASAR + dorong) * r.arah * pelan * dt;
      if (r.x <= -r.periode) r.x += r.periode;
      else if (r.x > 0) r.x -= r.periode;
      r.el.style.transform = `translate3d(${r.x.toFixed(2)}px,0,0)`;
    });
  };
  new IntersectionObserver(([en]) => {
    tampak = en.isIntersecting;
    if (tampak && !raf) { last = performance.now(); lastY = scrollY; raf = requestAnimationFrame(loop); }
  }, { rootMargin: '100px 0px' }).observe(wadah);
  if (HALUS) {
    wadah.addEventListener('pointerenter', () => { pelanT = .15; });
    wadah.addEventListener('pointerleave', () => { pelanT = 1; });
  }
}

function gerak() {
  const root = document.documentElement;
  $$('.cta-txt [data-rv]').forEach((el, i) => el.style.setProperty('--d', i * 70 + 'ms'));
  $$('h2[data-rv]').forEach(pecahKata);
  pecahKata($('#h-pepatah'));
  if (!('IntersectionObserver' in window)) { root.classList.add('rv-all'); $('#rak').classList.add('in'); return; }

  const hitung = new Map();
  if (!DIAM) $$('.hit').forEach(el => { const go = siapHitung(el); if (go) hitung.set(el, go); });
  const io = new IntersectionObserver(list => list.forEach(en => {
    if (!en.isIntersecting) return;
    en.target.classList.add('in');
    $$('.hit', en.target).forEach(h => { const go = hitung.get(h); if (go) { hitung.delete(h); go(); } });
    io.unobserve(en.target);
  }), { rootMargin: '0px 0px -8% 0px', threshold: .08 });
  $$('[data-rv]').forEach(el => io.observe(el));
  io.observe($('#rak'));
  io.observe($('.angka-isi'));

  // Di HP tombol keranjang mengambang menutupi tombol "Tambah ke keranjang" di panel hero
  new IntersectionObserver(([en]) => document.body.classList.toggle('di-hero', en.isIntersecting), { threshold: .3 }).observe($('.konfig'));
  setTimeout(() => root.classList.add('rv-all'), 6000);
  if (DIAM) return;

  // Gulir: garis kemajuan di atas (bila CSS scroll-timeline tidak ada) dan kata "Sobek, tempel, main"
  // yang menyala satu per satu saat pita Kindmax terurai
  const garis = $('.kemajuan i'), pakaiJs = !(window.CSS && CSS.supports('animation-timeline: scroll()'));
  const pep = $('.pepatah');
  let antre = false;
  const gulir = () => {
    antre = false;
    const vh = innerHeight;
    if (pakaiJs && garis) garis.style.transform = `scaleX(${Math.min(1, scrollY / Math.max(1, document.documentElement.scrollHeight - vh))})`;
    const b = pep.getBoundingClientRect();
    if (b.bottom > -vh && b.top < vh * 2) pep.style.setProperty('--p', Math.max(0, Math.min(1, (vh - b.top) / (vh + b.height))).toFixed(3));
  };
  addEventListener('scroll', () => { if (!antre) { antre = true; requestAnimationFrame(gulir); } }, { passive: true });
  gulir();
  deretJalan();

  // Kartu jenis sedikit miring mengikuti kursor (hanya mouse)
  if (HALUS) $$('.kj').forEach(k => {
    k.addEventListener('pointermove', e => {
      const b = k.getBoundingClientRect();
      k.style.setProperty('--ry', ((e.clientX - b.left) / b.width - .5) * 8 + 'deg');
      k.style.setProperty('--rx', ((e.clientY - b.top) / b.height - .5) * -8 + 'deg');
    });
    k.addEventListener('pointerleave', () => { k.style.removeProperty('--rx'); k.style.removeProperty('--ry'); });
  });
}

renderStatic();
renderPick();
renderCatalog();
updateCount();
routeFromHash();
gerak();
