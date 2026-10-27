// JS awal Bikinin Studio v2: menu HP, reveal masuk+keluar (satu IntersectionObserver), tab harga, pelacakan.
(function () {
  "use strict";
  var doc = document, root = doc.documentElement;
  var WA = (window.BIKININ_CONFIG && window.BIKININ_CONFIG.WA_NUMBER) || "6287763292786";
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
  window.track = function (name, params) { try { window.gtag("event", name, params || {}); } catch (e) {} };
  window.waLink = function (text, src) { return "https://wa.me/" + WA + "?text=" + encodeURIComponent(text + "\n\n(via " + (src || "web") + ")"); };

  // Pelacakan klik WhatsApp / unduhan
  doc.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a");
    if (!a) return;
    if (a.dataset.wa) window.track("click_whatsapp", { lokasi: a.dataset.wa });
    else if (/company-profile-bikinin-studio\.pdf$/.test(a.getAttribute("href") || "")) window.track("unduh_company_profile", { lokasi: a.closest("footer") ? "footer" : "halaman" });
  });

  // Menu HP
  var panel = doc.getElementById("panel"), btn = panel && panel.querySelector(".menu-btn");
  if (panel && btn) {
    var lbl = btn.querySelector(".menu-lbl");
    var set = function (open, focusBtn) {
      panel.classList.toggle("open", open);
      btn.setAttribute("aria-expanded", String(open));
      btn.setAttribute("aria-label", open ? "Tutup menu" : "Buka menu");
      if (lbl) lbl.textContent = open ? "Tutup" : "Menu";
      if (!open && focusBtn) btn.focus();
    };
    set(false);
    btn.addEventListener("click", function () { set(!panel.classList.contains("open")); });
    panel.addEventListener("click", function (e) { if (e.target.closest(".panel-body a")) set(false); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && panel.classList.contains("open")) set(false, true); });
    doc.addEventListener("click", function (e) { if (panel.classList.contains("open") && !panel.contains(e.target)) set(false); });
  }

  // Hero: jeda efek di luar layar / tab tersembunyi (.fx-off), baris ketik. Mati hanya oleh prefers-reduced-motion.
  var hero = doc.querySelector(".hero"), still = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  // Pekerjaan non-kritis (parallax, tilt, chat) jalan setelah halaman selesai dimuat dan browser idle.
  var later = function (fn) {
    var r = function () { window.requestIdleCallback ? requestIdleCallback(fn, { timeout: 2000 }) : setTimeout(fn, 1200); };
    if (doc.readyState === "complete") r(); else window.addEventListener("load", r, { once: true });
  };
  if (hero) {
    var inView = true, resume = null, pending = null, upd = function () {
      hero.classList.toggle("fx-off", !inView || doc.hidden);
      if (!hero.classList.contains("fx-off")) { if (resume) resume(); if (pending) pending(); }
    };
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { inView = en[0].isIntersecting; upd(); }).observe(hero);
    doc.addEventListener("visibilitychange", upd);
    var live = hero.querySelector(".ht-live"), txt = live && live.querySelector(".ht-text");
    if (txt && !still) {
      // Token jadwal dibaca setelah frame pertama: getComputedStyle saat muat memaksa hitung ulang gaya (Lighthouse TBT).
      var T = null, readT = function () {
        var cs = getComputedStyle(root), ms = function (n) { return parseFloat(cs.getPropertyValue(n)) || 0; };
        T = { c: ms("--type-char"), d: ms("--type-del"), h: ms("--type-hold"), g: ms("--type-gap"), s: ms("--type-start") };
        next = T.s + T.h;
      };
      var words = [].map.call(hero.querySelectorAll(".ht-ghost"), function (g) { return g.textContent; });
      var wi = 0, n = words[0].length, mode = "hold", rounds = 0, timer = 0, next = 0;
      // Berhenti di frasa pertama setelah 2 putaran penuh (WCAG 2.2.2). Dijeda saat hero di luar layar / tab tersembunyi, dilanjutkan dari upd().
      var tick = function () {
        timer = 0;
        if (hero.classList.contains("fx-off")) return;
        if (mode === "hold") { mode = "del"; live.classList.add("typing"); }
        if (mode === "del") {
          n--; txt.textContent = words[wi].slice(0, n);
          if (n <= 0) { mode = "type"; wi = (wi + 1) % words.length; next = T.g; } else next = T.d;
        } else {
          n++; txt.textContent = words[wi].slice(0, n);
          if (n >= words[wi].length) {
            mode = "hold"; live.classList.remove("typing"); next = T.h;
            if (wi === 0 && ++rounds >= 2) { hero.classList.add("type-done"); resume = null; return; }
          } else next = T.c;
        }
        timer = setTimeout(tick, next);
      };
      resume = function () { if (!T) readT(); if (!timer) timer = setTimeout(tick, next); };
      requestAnimationFrame(function () { setTimeout(function () { if (resume && !hero.classList.contains("fx-off")) resume(); }, 0); });
    }
  }

  // Parallax hero (DESIGN 11.2): satu rAF, hanya saat hero terlihat; menulis --pmx/--pmy (kursor, -1..1) dan --psy (px gulir). Mati oleh reduced-motion.
later(function () {
  if (hero && !still) {
    var pmx = 0, pmy = 0, tmx = 0, tmy = 0, sy = 0, hh = 1, raf = 0, fine = matchMedia("(hover:hover) and (pointer:fine)").matches;
    var paint = function () {
      raf = 0; pmx += (tmx - pmx) * 0.12; pmy += (tmy - pmy) * 0.12;
      hero.style.setProperty("--pmx", pmx.toFixed(3)); hero.style.setProperty("--pmy", pmy.toFixed(3)); hero.style.setProperty("--psy", sy.toFixed(1));
      if (Math.abs(tmx - pmx) > 0.002 || Math.abs(tmy - pmy) > 0.002) kick();
    };
    var kick = function () { if (!raf && !hero.classList.contains("fx-off")) raf = requestAnimationFrame(paint); };
    var onScr = function () { sy = Math.min(window.scrollY, hh); kick(); };
    window.addEventListener("scroll", onScr, { passive: true });
    window.addEventListener("resize", function () { hh = hero.offsetHeight || 1; onScr(); });
    if (fine) {
      window.addEventListener("pointermove", function (e) {
        if (e.pointerType !== "mouse") return;
        if (e.clientY > hh - sy) tmx = tmy = 0;
        else { tmx = (e.clientX / window.innerWidth) * 2 - 1; tmy = (e.clientY / window.innerHeight) * 2 - 1; }
        kick();
      }, { passive: true });
      document.documentElement.addEventListener("pointerleave", function () { tmx = tmy = 0; kick(); });
    }
    // Tinggi hero diukur setelah frame pertama agar tidak memaksa layout saat muat
    requestAnimationFrame(function () { setTimeout(function () { hh = hero.offsetHeight || 1; onScr(); }, 0); });
  }
  });

  // Objek 3D hero: poster dulu; three.js baru dimuat setelah halaman tenang (desktop: idle <= 2,5 dtk atau gerak kursor pertama;
  // HP: interaksi pertama DAN hero terlihat, jadi LCP/TBT tidak tersentuh). Tanpa WebGL / reduced-motion / ?statis = poster diam.
  var h3d = hero && hero.querySelector(".h3d");
  if (h3d && !/[?&]statis/.test(location.search)) {
    var ctl = null, started = false, desk = matchMedia("(min-width:1024px)").matches;
    var go = function () {
      if (started || still || !h3d.getClientRects().length) return;
      if (hero.classList.contains("fx-off")) { pendingGo(); return; }
      started = true;
      import("/assets/js/hero3d.js").then(function (m) { return m.start(h3d, hero, { small: !desk }); }).then(function (c) { ctl = c; }).catch(function () { started = false; });
    };
    var pendingGo = function () { hero.__pend = go; };
    var idle = function () { window.requestIdleCallback ? requestIdleCallback(go, { timeout: 2500 }) : setTimeout(go, 2500); };
    if (desk) {
      hero.addEventListener("pointermove", go, { once: true, passive: true });
      if (doc.readyState === "complete") idle(); else window.addEventListener("load", idle, { once: true });
    } else {
      var first = function () { ["scroll", "touchstart", "pointerdown", "keydown"].forEach(function (t) { window.removeEventListener(t, first); }); idle(); };
      ["scroll", "touchstart", "pointerdown", "keydown"].forEach(function (t) { window.addEventListener(t, first, { passive: true }); });
    }
    new MutationObserver(function () { if (hero.__pend && !hero.classList.contains("fx-off")) { var f = hero.__pend; hero.__pend = null; f(); } }).observe(hero, { attributes: true, attributeFilter: ["class"] });
    var rm = matchMedia("(prefers-reduced-motion: reduce)");
    if (rm.addEventListener) rm.addEventListener("change", function () { if (rm.matches && ctl) { ctl.destroy(); ctl = null; started = false; } });
  }

  // Kemiringan kartu mengikuti kursor (DESIGN 11.2): hanya mouse, hanya transform; satu pendengar pointermove per kartu selama kursor di atasnya.
later(function () {
  if (!still && matchMedia("(hover:hover) and (pointer:fine)").matches) {
    [].forEach.call(doc.querySelectorAll(".work, .card-link, .hs"), function (el) {
      var r, raf2 = 0, x = 0, y = 0;
      var apply = function () { raf2 = 0; el.style.setProperty("--tx", x.toFixed(3)); el.style.setProperty("--ty", y.toFixed(3)); };
      var mv = function (e) {
        x = Math.max(-1, Math.min(1, ((e.clientX - r.left) / r.width - 0.5) * 2)); y = Math.max(-1, Math.min(1, ((e.clientY - r.top) / r.height - 0.5) * 2));
        if (!raf2) raf2 = requestAnimationFrame(apply);
      };
      el.addEventListener("pointerenter", function (e) {
        if (e.pointerType !== "mouse") return;
        r = el.getBoundingClientRect(); el.setAttribute("data-tilt", ""); el.classList.add("is-tilting"); el.addEventListener("pointermove", mv, { passive: true });
      });
      el.addEventListener("pointerleave", function () {
        el.removeEventListener("pointermove", mv); el.classList.remove("is-tilting"); x = y = 0; apply();
      });
      el.addEventListener("transitionend", function (e) { if (e.target === el && e.propertyName === "transform" && !el.classList.contains("is-tilting") && !el.matches(":hover")) el.removeAttribute("data-tilt"); });
    });
  }
  });

  // Gelembung chat: tombol + panel dialog non-modal (tanpa JS tetap tautan wa.me)
later(function () {
  var chat = doc.getElementById("chat"), pnl = doc.getElementById("chat-panel");
  if (chat && pnl) {
    var a0 = chat.querySelector(".chat-fab"), fab = doc.createElement("button");
    fab.type = "button"; fab.className = a0.className; fab.innerHTML = a0.innerHTML;
    fab.setAttribute("aria-haspopup", "dialog"); fab.setAttribute("aria-controls", "chat-panel");
    a0.replaceWith(fab);
    var head = pnl.querySelector(".chat-h"), shown = false, ready = false;
    var isOpen = function () { return chat.classList.contains("open"); };
    var label = function () { var o = isOpen(); fab.setAttribute("aria-expanded", String(o)); fab.setAttribute("aria-label", o ? "Tutup menu chat" : "Buka menu chat Bikinin Studio"); };
    var toggle = function (open, back) {
      if (open === isOpen()) return;
      if (open) { pnl.hidden = false; void pnl.offsetWidth; }
      chat.classList.toggle("open", open); label();
      if (open) { window.track("chat_open"); head.focus({ preventScroll: true }); }
      else { if (back) fab.focus(); setTimeout(function () { if (!isOpen()) pnl.hidden = true; }, 220); }
    };
    var mq = window.matchMedia("(min-width:1024px)"), row = doc.querySelector(".hero .btn-row"), rowSeen = !!row;
    var show = function () {
      var on = ready && (mq.matches || !rowSeen);
      chat.classList.toggle("on", on); fab.inert = !on;
      if (!on) {
        // Hero terlihat lagi (HP): bila fokus ada di dalam panel, pindahkan ke tombol pertama hero agar tidak hilang ke <body>.
        var lost = isOpen() && pnl.contains(doc.activeElement), b1 = row && row.querySelector(".btn");
        toggle(false); if (lost && b1) b1.focus({ preventScroll: true });
      }
    };
    label(); show();
    if (row && "IntersectionObserver" in window) new IntersectionObserver(function (en) { rowSeen = en[0].isIntersecting; show(); }, { rootMargin: "-60px 0px -64px 0px" }).observe(row);
    mq.addEventListener && mq.addEventListener("change", show);
    setTimeout(function () { ready = true; show(); }, 1200);
    fab.addEventListener("click", function () { toggle(!isOpen()); });
    pnl.querySelector(".chat-x").addEventListener("click", function () { toggle(false, true); });
    doc.addEventListener("keydown", function (e) { if (e.key === "Escape" && isOpen()) toggle(false, true); });
    doc.addEventListener("pointerdown", function (e) { if (isOpen() && !chat.contains(e.target)) toggle(false); });
    doc.addEventListener("focusin", function (e) { if (isOpen() && !chat.contains(e.target)) toggle(false); });
  }
  });

  // Reveal masuk dan keluar
  var items = [].slice.call(doc.querySelectorAll(".reveal"));
  if (items.length && "IntersectionObserver" in window) {
    root.classList.add("js-rv");
    var seen = new WeakSet();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        var el = en.target;
        if (en.isIntersecting) {
          seen.add(el); el.classList.remove("out"); el.classList.add("in");
        } else if (en.boundingClientRect.top < 0) {
          if (seen.has(el)) { el.classList.remove("in"); el.classList.add("out"); }
          else { el.classList.add("in"); seen.add(el); }
        } else if (seen.has(el)) { el.classList.remove("in", "out"); }
      });
    }, { threshold: [0, 0.15], rootMargin: "0px 0px -8% 0px" });
    items.forEach(function (el) { io.observe(el); });
    doc.addEventListener("transitionend", function (e) { if (e.propertyName === "opacity" && e.target.classList && e.target.classList.contains("in")) e.target.classList.add("done"); });
  }


  // Gelembung harga: muncul bergantian + angka naik; diputar lagi saat tab berganti
  var pio, rm = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function bubbles(list) {
    if (!list) return;
    list.classList.remove("pp-in"); void list.offsetWidth;
    [].forEach.call(list.querySelectorAll(".pk"), function (pk, k) {
      var n = pk.querySelector(".price-num");
      pk.style.setProperty("--k", k);
      if (rm || !n) return;
      var full = n.getAttribute("data-full") || n.textContent; n.setAttribute("data-full", full);
      var m = /^(.*?)(\d+)(\D*)$/.exec(full); if (!m) return;
      var to = +m[2], t0 = null; n.textContent = m[1] + "0" + m[3];
      requestAnimationFrame(function step(t) {
        if (t0 === null) t0 = t;
        var p = Math.min(1, Math.max(0, (t - t0 - k * 70) / 600));
        n.textContent = m[1] + Math.round(to * (1 - Math.pow(1 - p, 3))) + m[3];
        if (p < 1) requestAnimationFrame(step); else n.textContent = full;
      });
    });
    list.classList.add("pp-in");
  }
  // Pengamat dibuat saat browser menganggur supaya tidak menambah kerja saat muat; daftar tersembunyi tidak pernah berpotongan
  var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 1500); };
  if ("IntersectionObserver" in window) idle(function () {
    pio = new IntersectionObserver(function (en) { en.forEach(function (e) { if (e.isIntersecting) { pio.unobserve(e.target); bubbles(e.target); } }); }, { threshold: 0, rootMargin: "0px 0px -12% 0px" });
    [].forEach.call(doc.querySelectorAll(".plist"), function (l) { pio.observe(l); });
  }, { timeout: 3000 });

  // Tab harga (ARIA, panah kiri/kanan)
  [].forEach.call(doc.querySelectorAll("[data-tabs]"), function (box) {
    var tabs = [].slice.call(box.querySelectorAll('[role="tab"]'));
    var panels = [].slice.call(box.querySelectorAll('[role="tabpanel"]'));
    function pick(i, focus) {
      tabs.forEach(function (t, j) { t.setAttribute("aria-selected", String(i === j)); t.tabIndex = i === j ? 0 : -1; });
      panels.forEach(function (p, j) { p.classList.toggle("on", i === j); });
      if (focus) tabs[i].focus();
      var pl = panels[i].querySelector(".plist"); if (pl) { if (pio) pio.unobserve(pl); bubbles(pl); }
      window.track("select_tab_harga", { grup: tabs[i].dataset.g });
    }
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { pick(i); });
      t.addEventListener("keydown", function (e) {
        var n = e.key === "ArrowRight" ? (i + 1) % tabs.length : e.key === "ArrowLeft" ? (i - 1 + tabs.length) % tabs.length : e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : -1;
        if (n >= 0) { e.preventDefault(); pick(n, true); }
      });
    });
  });
})();
