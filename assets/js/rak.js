/* Rak layar karya 3D di hero (2026-11-27, acuan reel Kuro).
   Panel layar mengalir terus dari kanan ke kiri. Desktop: sejajar tengah logo b, mundur + memudar saat lewat
   di belakang logo. HP: satu baris di atas logo, panel di tengah menghadap depan.
   Kursor menunjuk panel -> arus melambat sampai berhenti, panel itu timbul (maju, menghadap depan, membesar).
   Klik -> tampilan detail: panel terbang ke kanan dan membesar, panel info di kiri (Esc/Kembali/klik di luar
   menutup). Klik panel yang terbuka -> buka demonya. Tombol "Jeda gerak" menghentikan arus (aksesibilitas).
   Arus berhenti saat hero di luar layar; reduced-motion = rak diam (tanpa arus, tanpa transisi).
   Panel digambar di ukuran detail lalu diperkecil scale3d di rak, jadi tetap tajam saat dibuka. Hanya transform/opacity. */
(function () {
  "use strict";
  var hero = document.querySelector(".bento-hero");
  if (!hero || !window.requestAnimationFrame) return;
  var rak = hero.querySelector(".bh-rak"), space = hero.querySelector(".bh-space"), det = hero.querySelector(".bh-detail"), h1 = hero.querySelector(".bh-h1");
  if (!rak || !space || !det || !h1) return;
  var items = [].slice.call(rak.querySelectorAll(".bs-i")), btn = rak.querySelector(".bs-pause");
  var floor = hero.querySelector(".bh-floor"), lines = floor && floor.querySelector(".bf-lines"), LP = 64; // jarak garis lantai
  // tulis gaya hanya bila nilainya berubah (mengurangi hitung ulang gaya tiap frame)
  var put = function (el, prop, v) { var k = "_p" + prop; if (el[k] !== v) { el[k] = v; el.style[prop] = v; } };
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var BAR = 50; // tinggi dagu panel (judul + label) di rak
  var S = null, hover = -1, open = -1, paused = still, seen = true, leaveT = 0, resizeT = 0, hideT = 0;
  var offset = 0, speed = 0, raf = 0, tPrev = 0;
  var pop = items.map(function () { return 0; });

  function rel(el) { var a = el.getBoundingClientRect(), h = hero.getBoundingClientRect(); return { l: a.left - h.left, t: a.top - h.top, r: a.right - h.left, b: a.bottom - h.top, w: a.width }; }
  var tall = function (wc) { return 6 + (wc - 12) * 0.625 + BAR; }; // tinggi panel dari lebarnya
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var smooth = function (t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };

  function measure() {
    var W = hero.offsetWidth, Hh = hero.offsetHeight, narrow = W < 700;
    var sp = rel(space), ht = rel(h1).t, flat = space.querySelector(".bh-logo"), fl = flat && flat.getBoundingClientRect().width ? rel(flat) : null;
    var s = { W: W, Hh: Hh, narrow: narrow }, room;
    if (!narrow) {
      var lw = fl ? fl.w : Math.min((sp.b - sp.t) * 0.8, 260); // logo kaca 3D kira-kira selebar 80% tinggi ruangnya
      // panel berdiri di lantai rel yang sejajar dasar logo b
      s.fy = sp.b - 4;
      room = Math.min(s.fy - 12, (sp.b - sp.t) * 1.05);
      s.Wc = Math.round(Math.max(140, Math.min(220, (room - BAR - 6) / 0.625 + 12)));
      s.cy = s.fy - tall(s.Wc) / 2 - 2;
      s.gapHalf = lw / 2 + 70;
      s.Wn = Math.round(Math.min(W * 0.42, 640));
      s.v = 34; // px per detik
    } else {
      var bottom = (fl ? fl.t : sp.t + (sp.b - sp.t) * 0.3) - 12;
      s.cy = (24 + bottom) / 2; room = bottom - 24; // jarak dari header
      s.Wc = Math.round(Math.min(160, (room - BAR - 6) / 0.625 + 12));
      s.fy = s.cy + tall(s.Wc) / 2 + 2;
      s.gapHalf = 0;
      s.Wn = Math.round(W - 40);
      s.v = 26;
    }
    s.Hc = tall(s.Wc);
    s.ok = s.Wc >= 130 && room >= s.Hc;
    s.k = s.Wc / s.Wn; s.Hn = s.Hc / s.k; s.Dn = 6 / s.k; // tebal panel 6px di rak
    // lintasan: dari luar tepi kanan ke luar tepi kiri; jarak antarpanel tidak lebih rapat dari 0,45 lebar panel
    s.xs = W + s.Wc * 0.6; s.xe = -s.Wc * 0.6; s.P = s.xs - s.xe;
    s.N = Math.max(1, Math.min(items.length, Math.floor(s.P / (s.Wc * (narrow ? 0.62 : 0.46))))); // HP lebih renggang: panel dekat tengah tidak saling timpa
    s.gap = s.P / s.N;
    S = s;
    offset = offset % s.P;
    rak.style.setProperty("--bw", s.Wn + "px"); rak.style.setProperty("--bh", s.Hn.toFixed(1) + "px"); rak.style.setProperty("--bd", s.Dn.toFixed(1) + "px");
    rak.style.setProperty("--u", (1 / s.k).toFixed(4));
    rak.style.setProperty("--py", Math.round(s.cy + s.Hc / 2 + 10) + "px");
    var po = Math.round(W / 2) + "px " + Math.round(s.cy) + "px";
    rak.querySelector(".bs-row").style.perspectiveOrigin = po;
    rak.classList.toggle("on", s.ok);
    if (floor) { floor.style.perspectiveOrigin = po; floor.style.setProperty("--fy", Math.round(s.fy) + "px"); floor.classList.toggle("on", s.ok); }
    items.forEach(function (li, i) { li.classList.toggle("off", i >= s.N); });
  }

  function place(li, cx, cy, z, ry, sc) {
    var k = sc.toFixed(4);
    put(li, "transform", "translate3d(" + (cx - S.Wn / 2).toFixed(1) + "px," + (cy - S.Hn / 2).toFixed(1) + "px," + z.toFixed(0) + "px) rotateY(" + ry.toFixed(1) + "deg) scale3d(" + k + "," + k + "," + k + ")");
  }

  // posisi panel i di arus (tanpa efek timbul)
  function streamPos(i) {
    var s = (i * S.gap + offset) % S.P, x = S.xs - s, dx = x - S.W / 2, side = dx < 0 ? -1 : 1;
    var edge = Math.min(smooth((S.xs - x) / (S.Wc * 0.5)), smooth((x - S.xe) / (S.Wc * 0.5)));
    var o;
    if (S.narrow) o = { x: x, dx: dx, side: side, ry: -clamp(dx / (S.W * 0.5), -1, 1) * 60, z: -Math.abs(dx) * 0.25, op: edge };
    else {
      var vis = smooth((Math.abs(dx) - S.gapHalf * 0.7) / (S.gapHalf * 0.5)); // lewat di belakang logo
      o = { x: x, dx: dx, side: side, ry: -side * 58, z: -Math.abs(dx) * 0.18 - 260 * (1 - vis), op: edge * vis };
    }
    return o;
  }

  function draw() {
    if (lines) put(lines, "transform", "translate3d(" + (-(offset % LP)).toFixed(1) + "px,0,0)"); // garis lantai ikut arus
    for (var i = 0; i < S.N; i++) {
      if (i === open) continue;
      var li = items[i], o = streamPos(i), p = pop[i];
      var ry = o.ry * (1 - p) + (S.narrow ? 0 : -o.side * 8) * p;
      var op = Math.max(o.op, p);
      put(li, "visibility", op < 0.01 ? "hidden" : "");
      if (op < 0.01) continue; // tak terlihat: tidak usah dihitung ulang
      place(li, o.x, S.cy - 8 * p, o.z + 200 * p, ry, S.k * (1 + 0.1 * p)); // maju cukup jauh agar tidak terpotong panel tetangga yang miring
      put(li, "opacity", op.toFixed(2));
      var g = op < 0.5; if (li._g !== g) { li._g = g; li.classList.toggle("ghost", g); } // panel yang memudar tidak bisa diklik
    }
  }

  function tick(now) {
    raf = 0;
    var dt = tPrev ? Math.min(0.05, (now - tPrev) / 1000) : 0.016; tPrev = now;
    var a = 1 - Math.exp(-dt * (still ? 60 : 6));
    var target = paused || hover >= 0 || open >= 0 ? 0 : S.v;
    speed += (target - speed) * a; if (Math.abs(speed - target) < 0.05) speed = target;
    offset = (offset + speed * dt) % S.P;
    var busy = speed !== 0;
    for (var i = 0; i < S.N; i++) {
      var want = i === hover ? 1 : 0, b = 1 - Math.exp(-dt * (still ? 60 : 10));
      pop[i] += (want - pop[i]) * b; if (Math.abs(pop[i] - want) < 0.002) pop[i] = want; else busy = true;
    }
    draw();
    if (busy && seen && open < 0) raf = requestAnimationFrame(tick); else tPrev = 0;
  }
  function req() { if (!raf && S && S.ok && open < 0) raf = requestAnimationFrame(tick); }

  function setHover(i) { if (open >= 0 || i === hover) return; hover = i; req(); }

  function fill(a) {
    var lab = det.querySelector(".label");
    lab.className = "label label-" + a.getAttribute("data-label"); lab.textContent = a.getAttribute("data-lab");
    det.querySelector(".bd-h").textContent = a.getAttribute("data-title");
    det.querySelector(".bd-note").textContent = a.getAttribute("data-note");
    var go = det.querySelector(".bd-go"); go.href = a.getAttribute("href"); go.textContent = a.getAttribute("data-go");
  }

  function openAt(i) {
    if (raf) { cancelAnimationFrame(raf); raf = 0; tPrev = 0; }
    open = i; hover = -1; speed = 0; fill(items[i].querySelector(".bs-b"));
    // HP memuat thumbnail 540 px untuk rak; saat panel dibuka (membesar) minta versi 960 px supaya tetap tajam
    var im = items[i].querySelector(".bs-scr img"); if (im && im.sizes !== "960px") im.sizes = "960px";
    clearTimeout(hideT); det.hidden = false; void det.offsetWidth;
    [].forEach.call(hero.querySelectorAll(".hero-in"), function (el) { el.style.animation = "none"; });
    items.forEach(function (li, k) { li.classList.toggle("dim", k !== i); li.classList.add("tr"); });
    hero.classList.add("bs-open"); document.body.classList.add("bs-open-page");
    var li = items[i];
    put(li, "opacity", "1"); put(li, "visibility", "");
    place(li, S.narrow ? S.W / 2 : S.W * 0.71, S.narrow ? 16 + S.Hn / 2 : S.Hh * 0.5, 0, S.narrow ? 0 : -12, 1);
    // HP: panel terbuka menempel di atas hero; bila halaman sudah digulir, bawa hero tepat di bawah header supaya panel tidak tertutup
    if (S.narrow) {
      var hd = document.querySelector("header"), top = hd ? hd.getBoundingClientRect().bottom : 0, dy = hero.getBoundingClientRect().top - top;
      if (Math.abs(dy) > 4) window.scrollBy({ top: dy, behavior: still ? "auto" : "smooth" });
    }
    setTimeout(function () { if (open === i) det.querySelector(".bd-h").focus({ preventScroll: true }); }, still ? 0 : 320);
  }

  function close() {
    if (open < 0) return;
    var i = open; open = -1; pop[i] = 0;
    hero.classList.remove("bs-open"); document.body.classList.remove("bs-open-page");
    items.forEach(function (li) { li.classList.remove("dim"); });
    draw(); // panel kembali ke tempatnya di arus (dengan transisi)
    hideT = setTimeout(function () { if (open < 0) { det.hidden = true; items.forEach(function (li) { li.classList.remove("tr"); }); req(); } }, still ? 0 : 720);
    items[i].querySelector(".bs-b").focus({ preventScroll: true });
  }

  items.forEach(function (li, i) {
    var a = li.querySelector(".bs-b");
    a.addEventListener("pointerenter", function (e) { if (e.pointerType !== "mouse") return; clearTimeout(leaveT); setHover(i); });
    a.addEventListener("pointerleave", function () { clearTimeout(leaveT); leaveT = setTimeout(function () { setHover(-1); }, 120); });
    a.addEventListener("focus", function () { if (a.matches(":focus-visible")) { clearTimeout(leaveT); setHover(i); } });
    a.addEventListener("blur", function () { leaveT = setTimeout(function () { setHover(-1); }, 120); });
    a.addEventListener("click", function (e) {
      if (open === i) return; // panel yang sudah terbuka: ikuti tautan ke demo
      e.preventDefault(); openAt(i);
    });
  });
  det.querySelector(".bd-back").addEventListener("click", close);
  addEventListener("keydown", function (e) { if (e.key === "Escape" && open >= 0) close(); });
  hero.addEventListener("click", function (e) { if (open >= 0 && !e.target.closest(".bh-detail") && !e.target.closest(".bs-i")) close(); });
  if (btn) {
    if (still) btn.hidden = true;
    btn.addEventListener("click", function () {
      paused = !paused; btn.setAttribute("aria-pressed", String(paused)); btn.querySelector(".bs-pt").textContent = paused ? "Putar gerak" : "Jeda gerak"; diam(); req();
    });
  }

  // pendar latar (.bh-glow) ikut berhenti saat dijeda atau hero di luar layar
  function diam() { hero.classList.toggle("bh-diam", paused || !seen); }

  function start() {
    measure();
    if (!S.ok) return;
    offset = S.gap * 0.5; // panel pertama tidak tepat di belakang logo
    speed = paused ? 0 : S.v;
    draw();
    rak.classList.add("in");
    if ("IntersectionObserver" in window) new IntersectionObserver(function (es) { seen = es[0].isIntersecting; diam(); if (seen) req(); }).observe(hero);
    req();
  }
  // HP (2026-11-27, audit kecepatan): rak baru dimulai setelah halaman selesai dimuat + browser senggang,
  // supaya judul (LCP) tidak berebut CPU dengan rak. Desktop tetap mulai saat font siap.
  var later = function (fn) { var go = function () { if (window.requestIdleCallback) requestIdleCallback(fn, { timeout: 1500 }); else setTimeout(fn, 300); };
    if (document.readyState === "complete") go(); else addEventListener("load", go, { once: true }); };
  if (hero.offsetWidth < 700) later(start);
  else if (document.fonts && document.fonts.ready) document.fonts.ready.then(start); else start();
  addEventListener("resize", function () { clearTimeout(resizeT); resizeT = setTimeout(function () { measure(); if (S.ok) { draw(); req(); } }, 150); });
})();
