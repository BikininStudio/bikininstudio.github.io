/* Hero beranda (2026-11-12): karya jadi meluncur dari kanan ke kiri menyusuri lengkung cahaya,
   lalu berhenti di ruang kosong kiri-kanan judul. Posisi dihitung dari tata letak nyata:
   kartu tidak pernah menimpa judul, teks, tombol, logo, atau header; yang tidak muat disembunyikan.
   Gerak: Web Animations (transform + opacity), sekali jalan; reduced-motion langsung di tempat. */
(function () {
  "use strict";
  var hero = document.querySelector(".bento-hero");
  if (!hero) return;
  var bg = hero.querySelector(".bh-bg"), arc = hero.querySelector(".bh-arc"), space = hero.querySelector(".bh-space"), list = hero.querySelector(".bh-works");
  if (!bg || !arc || !space || !list) return;
  var items = [].slice.call(list.querySelectorAll("li"));
  var still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  var played = false, timer = 0;
  var D2R = Math.PI / 180;

  // posisi di dalam hero tanpa terpengaruh transform animasi masuk
  function box(el) {
    var l = 0, t = 0, n = el;
    while (n && n !== hero) { l += n.offsetLeft; t += n.offsetTop; n = n.offsetParent; }
    return { l: l, t: t, r: l + el.offsetWidth, b: t + el.offsetHeight };
  }
  function hit(a, b, m) { return a.l < b.r + m && a.r > b.l - m && a.t < b.b + m && a.b > b.t - m; }
  function gap(a, b) { // jarak tepi-ke-tepi dua kotak (0 bila bersentuhan)
    var dx = Math.max(0, b.l - a.r, a.l - b.r), dy = Math.max(0, b.t - a.b, a.t - b.b);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function layout() {
    var headH = bg.offsetTop < 0 ? -bg.offsetTop : 0;
    var W = hero.offsetWidth, Hh = hero.offsetHeight;
    var S = box(space);
    // 1) lengkung menempel di bawah ruang logo: logo duduk di cakrawala
    bg.style.setProperty("--arc-y", Math.round(S.b + headH - 6) + "px");
    var R = arc.offsetWidth / 2, cx = arc.offsetLeft + R, cy = arc.offsetTop + R - headH;
    // 2) daerah terlarang: logo (bukan seluruh lebar ruangnya) + semua teks hero
    var lh = S.b - S.t, mid = (S.l + S.r) / 2, flat = space.querySelector(".bh-logo");
    var fr = flat ? flat.getBoundingClientRect() : null, fb;
    if (fr && fr.width) { // SVG tidak punya offset*: ukuran dari rect, posisi dari ruangnya (bebas transform animasi)
      fb = S.b - (parseFloat(getComputedStyle(flat).marginBottom) || 0);
      fr = { l: mid - fr.width / 2, r: mid + fr.width / 2, t: fb - fr.height, b: fb };
    } else fr = { l: mid - lh * 0.6, r: mid + lh * 0.6, t: S.t, b: S.b };
    var keep = [fr];
    [].forEach.call(hero.querySelectorAll(".bh-h1, .bh-lead, .btn-row, .bh-hint"), function (el) { if (el.offsetWidth) keep.push(box(el)); });
    var narrow = W < 700, peek = 0;
    var placed = [], count = { "1": 0, "-1": 0 }, max = narrow ? 2 : 3;

    items.forEach(function (li, i) {
      li.classList.remove("on");
      var w = li.offsetWidth, h = li.offsetHeight;
      peek = narrow ? w * 0.32 : 0;
      var side = i % 2 ? -1 : 1;
      if (count[side] >= max) side = -side;
      if (count[side] >= max) { li.style.visibility = "hidden"; return; }
      var mine = placed.filter(function (p) { return p.side === side; });
      // titik jangkar kartu pertama tiap sisi: tengah ruang samping, sedikit di atas tengah
      var ax = side > 0 ? W * 0.84 : W * 0.16, ay = narrow ? (keep[0].t + keep[0].b) / 2 - 20 : Hh * 0.36; // HP: mengapit logo
      var best = null, bestScore = -1e9;
      for (var y = h / 2 + 10; y <= Hh - h / 2 - 12; y += 14) {
        for (var x = w / 2 + 12 - peek; x <= W - w / 2 - 12 + peek; x += 14) {
          if ((x > W / 2) !== (side > 0)) continue;
          var rc = { l: x - w / 2, r: x + w / 2, t: y - h / 2, b: y + h / 2 };
          if (keep.some(function (k) { return hit(rc, k, 22); })) continue;
          if (placed.some(function (p) { return hit(rc, p.rect, 16); })) continue;
          var score;
          if (!mine.length) score = -Math.hypot(x - ax, y - ay);
          else {
            var near = Math.min.apply(null, mine.map(function (p) { return gap(rc, p.rect); }));
            if (near > w * 0.9) continue; // tetap satu kelompok
            score = -Math.abs(near - 26) - Math.abs(y - Hh * 0.45) * 0.15;
          }
          if (score > bestScore) { bestScore = score; best = { x: x, y: y, rect: rc }; }
        }
      }
      if (!best) { li.style.visibility = "hidden"; return; }
      count[side]++;
      placed.push({ rect: best.rect, side: side });
      var rot = side * (3 + (count[side] % 3) * 2.5);
      li.style.visibility = "";
      li.style.left = best.x.toFixed(1) + "px";
      li.style.top = (best.y + headH).toFixed(1) + "px"; // wadah kartu mulai dari balik header
      li.style.setProperty("--rot", rot.toFixed(1) + "deg");
      li.classList.add("on");
      if (!played && !still && li.animate) fly(li, best, rot, cx, cy, R, placed.length - 1);
    });
    played = true;
  }

  // lintasan: masuk dari kanan bawah lengkung (sudut +104deg), menyusuri busur sampai segaris
  // dengan tempatnya, lalu meluncur lurus ke tempat itu
  function fly(li, spot, rot, cx, cy, R, order) {
    var end = Math.asin(Math.max(-0.98, Math.min(0.98, (spot.x - cx) / R))) / D2R;
    var from = 104, frames = [], N = 28, split = 0.72;
    for (var k = 0; k <= N; k++) {
      var f = k / N, x, y, deg;
      if (f <= split) {
        deg = from + (end - from) * (f / split);
        var a = deg * D2R; x = cx + R * Math.sin(a); y = cy - R * Math.cos(a);
      } else {
        var g = (f - split) / (1 - split), a2 = end * D2R;
        var ex = cx + R * Math.sin(a2), ey = cy - R * Math.cos(a2);
        x = ex + (spot.x - ex) * g; y = ey + (spot.y - ey) * g; deg = end * (1 - g);
      }
      var nearTop = Math.max(0, 1 - Math.abs(deg) / 20); // menipis saat lewat di belakang logo
      frames.push({
        offset: f,
        transform: "translate(" + (x - spot.x).toFixed(1) + "px," + (y - spot.y).toFixed(1) + "px) rotate(" + (deg * 0.3 - rot + rot * f).toFixed(2) + "deg) scale(" + (0.8 + 0.2 * f - 0.2 * nearTop).toFixed(3) + ")",
        opacity: Math.min(1, f * 5) * (1 - 0.8 * nearTop)
      });
    }
    frames[N] = { offset: 1, transform: "translate(0px,0px) rotate(0deg) scale(1)", opacity: 1 };
    li.animate(frames, { duration: end > 0 ? 1600 : 2300, delay: 600 + order * 140, easing: "cubic-bezier(.22,.8,.3,1)", fill: "backwards" });
  }

  function relayout() {
    items.forEach(function (li) { if (li.getAnimations) li.getAnimations().forEach(function (a) { a.finish(); }); });
    layout();
  }
  list.classList.add("js-on");
  var go = function () { layout(); };
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(go); else go();
  addEventListener("resize", function () { clearTimeout(timer); timer = setTimeout(relayout, 150); });
})();
