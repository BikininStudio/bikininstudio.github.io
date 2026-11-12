/* Seksi "portal" beranda: kata bergantian -> kartu karya berputar masuk dari kedalaman
   -> lewat kamera -> judul. Progres gulir dihaluskan berbasis waktu (sama di 60/120 Hz),
   hanya transform & opacity. Mati di reduced-motion; tanpa JS seksi tampil statis. */
(function () {
  "use strict";
  var sec = document.querySelector(".ptl");
  if (!sec || !window.requestAnimationFrame) return;
  if (window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

  sec.classList.add("ptl-on");
  var stage = sec.querySelector(".ptl-stage");
  var rig = sec.querySelector(".ptl-rig") || stage;
  var word = sec.querySelector(".ptl-words span");
  var WORDS = (sec.querySelector(".ptl-words").getAttribute("data-words") || "").split(",");
  var cards = [].slice.call(sec.querySelectorAll(".ptl-cards li"));
  var glow = sec.querySelector(".ptl-glow"), end = sec.querySelector(".ptl-end");
  // posisi akhir kartu (pecahan lebar/tinggi panggung dari tengah) + kemiringan
  var POS = [[-.31, -.24, -6], [.0, -.31, 3], [.31, -.2, 7], [-.36, .08, 5], [.35, .12, -5], [-.2, .3, -3], [.17, .31, 4], [-.06, -.02, -2], [.0, .14, 2]];
  var POS_HP = [[-.24, -.28, -6], [.24, -.3, 5], [-.27, -.08, 4], [.26, -.06, -5], [-.25, .14, -3], [.25, .16, 4], [-.1, .32, 3], [.14, .34, -4], [0, .02, 2]];
  var W = 0, H = 0, hp = false, top = 0, span = 1, raf = 0, on = false, cur = -1, tPrev = 0;
  var mx = 0, my = 0, tmx = 0, tmy = 0; // kemiringan panggung ikut kursor (desktop)
  var fine = matchMedia("(hover: hover) and (pointer: fine)").matches;

  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };
  var seg = function (p, a, b) { return clamp((p - a) / (b - a)); };
  var out3 = function (t) { return 1 - Math.pow(1 - t, 3); };
  var inout = function (t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; };
  var in2 = function (t) { return t * t; };
  var f2 = function (v) { return v.toFixed(2); };

  function measure() {
    W = innerWidth; H = innerHeight; hp = W <= 640;
    var r = sec.getBoundingClientRect();
    top = r.top + scrollY; span = Math.max(1, sec.offsetHeight - H);
  }

  function draw(p) {
    // 1) satu kata yang berganti (0 - .2): tiap kata masuk dari bawah, ditahan, lalu naik keluar.
    //    Satu elemen saja, jadi tidak pernah ada lima kata bertumpuk atau tertimpa kartu.
    var n = WORDS.length, wp = clamp(p / 0.2) * n, idx = Math.min(n - 1, Math.floor(wp)), local = wp - idx;
    if (p >= 0.2) { idx = n - 1; local = 1; }
    if (word.textContent !== WORDS[idx]) word.textContent = WORDS[idx];
    var wIn = out3(clamp(local / .18)), wOut = idx === n - 1 ? out3(seg(p, .18, .22)) : out3(seg(local, .84, 1));
    var wo = wIn * (1 - wOut); word.style.opacity = wo.toFixed(3); word.style.visibility = wo < .005 ? "hidden" : "";
    word.style.transform = "translate3d(0," + f2((1 - wIn) * 44 - wOut * 44) + "px,0) scale(" + (1.1 - .1 * wIn).toFixed(4) + ")";

    // 2) glow panggung bernapas mengikuti progres (maks skala 1: tepinya tetap 0)
    var g0 = out3(seg(p, 0, .06)), g = out3(seg(p, .16, .46)), gEnd = seg(p, .84, 1);
    // redup sejak awal supaya kata-kata berdiri di atas cahaya hangat, lalu menguat saat kartu datang
    glow.style.opacity = ((.38 * g0 + .62 * g) * (1 - .25 * inout(gEnd))).toFixed(3);
    glow.style.transform = "scale(" + (.6 + .4 * g).toFixed(4) + ")";

    // 3) kartu: berputar masuk dari kedalaman (.22 - .62), lalu lewat kamera (.66 - .86)
    var pos = hp ? POS_HP : POS;
    for (var k = 0; k < cards.length; k++) {
      var c = cards[k], f = pos[k % pos.length];
      var tin = out3(seg(p, .22 + k * .022, .44 + k * .022));
      var tout = in2(seg(p, .66 + (k % 3) * .02, .82 + (k % 3) * .02));
      var ang = (1 - tin) * (1.4 + (k % 2) * .6) * (k % 2 ? -1 : 1);
      var cs = Math.cos(ang), sn = Math.sin(ang);
      var bx = f[0] * W, by = f[1] * H;
      var spread = 1 + (1 - tin) * .9 + tout * 1.5;
      var x = (bx * cs - by * sn) * spread, y = (bx * sn + by * cs) * spread;
      var z = -2400 * (1 - tin) + 820 * tout;
      var ry = (1 - tin) * (f[0] < 0 ? 38 : -38) + tout * (f[0] < 0 ? -22 : 22);
      var rx = (1 - tin) * (f[1] < 0 ? -24 : 24);
      var rz = f[2] * (1 - tout) + (1 - tin) * f[2] * 3;
      var co = Math.min(1, tin * 1.25) * (1 - tout); c.style.opacity = co.toFixed(3); c.style.visibility = co < .005 ? "hidden" : "";
      c.style.transform = "translate3d(" + f2(x) + "px," + f2(y) + "px," + z.toFixed(0) + "px) rotateX(" + f2(rx) + "deg) rotateY(" + f2(ry) + "deg) rotateZ(" + f2(rz) + "deg)";
      c.classList.toggle("hit", tin > .95 && tout < .05);
    }

    // 4) judul baru naik setelah semua kartu lewat (tidak pernah menimpa gambar)
    var eh = out3(seg(p, .86, .96));
    end.style.opacity = eh.toFixed(3); end.style.visibility = eh < .005 ? "hidden" : "";
    end.style.transform = "translate3d(0," + f2((1 - eh) * 36) + "px,0) scale(" + (.96 + .04 * eh).toFixed(4) + ")";
    end.classList.toggle("hit", eh > .6);
  }

  var lastDrawn = -1, lastMx = 9, lastMy = 9;
  function tick(now) {
    raf = 0;
    var dt = tPrev ? Math.min(.05, (now - tPrev) / 1000) : .016; tPrev = now;
    var tgt = clamp((scrollY - top) / span);
    var a = 1 - Math.exp(-dt * 9); // ~77 ms waktu-paruh: halus tapi tidak telat
    cur = cur < 0 ? tgt : cur + (tgt - cur) * a;
    if (Math.abs(tgt - cur) < .0003) cur = tgt;
    mx += (tmx - mx) * a; my += (tmy - my) * a;
    if (Math.abs(cur - lastDrawn) > .0001) { draw(cur); lastDrawn = cur; }
    if (fine && (Math.abs(mx - lastMx) > .001 || Math.abs(my - lastMy) > .001)) {
      rig.style.transform = "rotateX(" + f2(-my * 4) + "deg) rotateY(" + f2(mx * 6) + "deg)";
      lastMx = mx; lastMy = my;
    }
    var moving = cur !== tgt || Math.abs(tmx - mx) > .001 || Math.abs(tmy - my) > .001;
    if (moving && on) raf = requestAnimationFrame(tick); else tPrev = 0;
  }

  var req = function () { if (on && !raf) raf = requestAnimationFrame(tick); };
  measure(); draw(clamp((scrollY - top) / span));
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (es) { on = es[0].isIntersecting; if (on) { measure(); req(); } }, { rootMargin: "100px 0px" }).observe(sec);
  } else on = true;
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", function () { measure(); lastDrawn = -1; req(); });
  if (fine) stage.addEventListener("pointermove", function (e) { tmx = e.clientX / W * 2 - 1; tmy = e.clientY / H * 2 - 1; req(); }, { passive: true });
  // fokus keyboard ke kartu/judul yang sedang tak tampil: lompat ke titik yang terlihat
  sec.addEventListener("focusin", function (ev) {
    var want = ev.target.closest(".ptl-cards") ? top + span * .56 : ev.target.closest(".ptl-end") ? top + span : -1;
    if (want < 0) return;
    if (Math.abs(scrollY - want) > H * .2) scrollTo(0, want);
  });
})();
