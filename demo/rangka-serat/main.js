// Rangka Serat (brand fiktif): serat kayu jadi pita cahaya yang mengalir, kalkulator meja, grafik kecil.
(function () {
  "use strict";
  var diam = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var rp = function (n) { return "Rp " + Math.round(n).toLocaleString("id-ID"); };
  var bulat = function (n) { return Math.round(n / 10000) * 10000; };

  /* ---------- Data kayu ---------- */
  var KAYU = {
    jati: { dasar: "#A0703F", gelap: "#5E3B1E", terang: "#C59157", rate: 3900000, rangka: 1600000, hari: 2, berat: 650 },
    mahoni: { dasar: "#7A3B27", gelap: "#451D12", terang: "#9C5640", rate: 2600000, rangka: 1100000, hari: 1, berat: 560 },
    trembesi: { dasar: "#8C6743", gelap: "#4F3620", terang: "#AF8A60", rate: 3100000, rangka: 1300000, hari: 2, berat: 600 },
    pinus: { dasar: "#D6B47F", gelap: "#A57A45", terang: "#EBD3A6", rate: 1700000, rangka: 700000, hari: 0, berat: 500 },
  };
  var FIN = { minyak: { kali: 1, hari: 1 }, doff: { kali: 1.08, hari: 2 }, duco: { kali: 1.15, hari: 4 } };

  // Angka acak yang stabil supaya gambar tidak berubah tiap digambar ulang
  function acak(seed) {
    var f = function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
    for (var i = 0; i < 8; i++) f(); // pemanasan: angka awal LCG dengan seed kecil hampir sama
    return f;
  }

  // Serat kayu memanjang ke arah x di kotak w x h (dipakai untuk daun meja di kalkulator)
  function gambarSerat(ctx, w, h, jenis, seed) {
    var k = KAYU[jenis], r = acak(seed || 7);
    ctx.fillStyle = k.dasar; ctx.fillRect(0, 0, w, h);
    var mataX = w * (0.3 + r() * 0.4), mataY = h * (0.3 + r() * 0.4), jarak = Math.max(4, h / 38);
    var n = Math.ceil(h / jarak) + 6;
    for (var i = -3; i < n; i++) {
      var o = i * jarak + r() * jarak * 0.6, fase = r() * 6, tebal = 0.6 + r() * 1.6;
      ctx.beginPath();
      for (var x = -10; x <= w + 10; x += 6) {
        var dx = x - mataX, g = Math.exp(-(dx * dx) / (2 * Math.pow(w * 0.12, 2)));
        var rel = o - mataY, dorong = (rel >= 0 ? 1 : -1) * h * 0.09 * g / (1 + Math.abs(rel) / (h * 0.12));
        var y = o + Math.sin(x * 0.011 + fase) * jarak * 0.5 + Math.sin(x * 0.003 + i * 0.3) * jarak * 1.4 + dorong;
        x === -10 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = r() > 0.72 ? k.terang : k.gelap;
      ctx.globalAlpha = 0.18 + r() * 0.4; ctx.lineWidth = tebal; ctx.stroke();
    }
    ctx.globalAlpha = 0.55; ctx.strokeStyle = k.gelap; ctx.lineWidth = 1.2;
    for (var j = 1; j <= 4; j++) { ctx.beginPath(); ctx.ellipse(mataX, mataY, w * 0.012 * j, h * 0.016 * j, 0, 0, Math.PI * 2); ctx.stroke(); }
    ctx.globalAlpha = 1;
  }

  /* ---------- Pita cahaya serat di latar (mengalir terus) ---------- */
  // Jalur utama WebGL: semua garis dihitung di GPU dalam satu gambar. Kanvas 2D hanya cadangan.
  var kanvas = document.getElementById("serat"), c = null, gl = null, U = {};
  var heroTeks = document.getElementById("hero-teks");
  var VS = "attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}";
  var FS = [
    "precision highp float;",
    "uniform vec2 uRes,uK;uniform float uDpr,uT,uRot,uR,uN,uGap,uS,uL,uPendar,uScrimOn;uniform vec4 uScrim;",
    "float h1(float n){return fract(sin(n*12.9898)*43758.5453);}",
    "float h2(float n){return fract(sin(n*78.233)*12345.6789);}",
    "float env(float u){if(u<=0.||u>=1.)return 0.;if(u<.4)return u/.4*.5;if(u<.5)return mix(.5,1.,(u-.4)/.1);if(u<.72)return mix(1.,.45,(u-.5)/.22);return mix(.45,0.,(u-.72)/.28);}",
    "void main(){",
    " vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;",
    " vec2 d=p-uK;float cr=cos(uRot),sr=sin(uRot);",
    " float x=cr*d.x+sr*d.y,y=-sr*d.x+cr*d.y;",
    " float aw=-uL*.55,ak=uL*.55,e=env((x-aw)/(ak-aw));",
    " vec3 col=vec3(0.);",
    " float g=exp(-(x*x)/(2.*uS*uS));",
    " if(e>0.){",
    "  for(int ii=0;ii<64;ii++){",
    "   float i=float(ii);if(i>=uN)break;",
    "   float o=(i-(uN-1.)*.5)*uGap;",
    "   if(abs(y-o)>150.)continue;",
    "   float yi=o+(o>=0.?1.:-1.)*uR*g/(1.+abs(o)/60.)+28.*sin(x*.005+uT*1.8+i*.21)+12.*sin(x*.012-uT*1.2+i*.5)*(1.-g);",
    "   float dd=abs(y-yi);if(dd>9.)continue;",
    "   float dk=exp(-abs(o)/95.);",
    "   vec3 c=dk>.8?vec3(.871,.941,.659):(mod(i,5.)<.5?vec3(.588,.804,.745):vec3(.714,.831,.361));",
    "   float w=dk>.6?.75:.55;",
    "   float glow=(uPendar>.5&&dk>.72&&x>-uL*.18&&x<uL*.22)?.1*exp(-dd*dd/9.):0.;",
    "   col+=c*(.06+.7*dk)*e*(exp(-dd*dd/(w*w))+glow);",
    "   if(h1(i+1.)<.45){",
    "    float up=fract(h2(i+1.)+uT*(.085+h2(i+3.)*.11)),ln=uL*(.07+h1(i+7.)*.09);",
    "    float tt=(x-mix(aw,ak,up))/ln;",
    "    float pr=tt<.4?smoothstep(-1.,.4,tt):1.-smoothstep(.4,1.,tt);",
    "    float pk=min(1.,1.2*(.35+.65*dk)*sin(up*3.14159))*pr;",
    "    col+=vec3(.902,.961,.706)*pk*(exp(-dd*dd/1.2)+(uPendar>.5?.22*exp(-dd*dd/9.):0.));",
    "   }",
    "   if(h2(i+11.)<.85&&dk>.25){",
    "    float uq=fract(h1(i+13.)+uT*(.03+h2(i+17.)*.07));",
    "    float xq=mix(aw*.55,ak*.55,uq),rq=.7+h1(i+19.)*1.5;",
    "    float al=(.25+.55*abs(sin(uT*1.6+h2(i+23.)*6.)))*sin(uq*3.14159);",
    "    col+=vec3(.882,.949,.686)*al*smoothstep(rq+.8,rq-.3,length(vec2(x-xq,dd)));",
    "   }",
    "  }",
    " }",
    " float ax=uS*.16,by=uR*.2,rr=length(vec2(x/ax,y/by)),mn=min(ax,by);",
    " for(int j=1;j<=4;j++){float fj=float(j);float dr=abs(rr-fj)*mn;col+=vec3(.714,.831,.361)*(.22-.035*fj)*exp(-dr*dr/.6);}",
    " if(uScrimOn>.5){float rs=length((p-uScrim.xy)/uScrim.zw);float m=rs<.6?mix(.55,.35,rs/.6):(rs<1.?mix(.35,0.,(rs-.6)/.4):0.);col*=1.-m;}",
    " col=min(col,vec3(1.));",
    " gl_FragColor=vec4(col,max(col.r,max(col.g,col.b)));",
    "}"
  ].join("\n");
  function gagalGL() {
    // kanvas sudah terikat ke WebGL, jadi ganti dengan kanvas baru untuk jalur 2D
    var baru = kanvas.cloneNode(false); kanvas.parentNode.replaceChild(baru, kanvas); kanvas = baru; gl = null; return false;
  }
  function siapkanGL() {
    var g = null;
    try { g = kanvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: "low-power" }); } catch (e) { g = null; }
    if (!g) return false;
    var sh = function (tipe, src) { var s = g.createShader(tipe); g.shaderSource(s, src); g.compileShader(s); return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null; };
    var v = sh(g.VERTEX_SHADER, VS), f = sh(g.FRAGMENT_SHADER, FS);
    if (!v || !f) return gagalGL();
    var pr = g.createProgram(); g.attachShader(pr, v); g.attachShader(pr, f); g.linkProgram(pr);
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) return gagalGL();
    g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    var loc = g.getAttribLocation(pr, "p"); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    ["uRes", "uK", "uDpr", "uT", "uRot", "uR", "uN", "uGap", "uS", "uL", "uPendar", "uScrimOn", "uScrim"].forEach(function (n) { U[n] = g.getUniformLocation(pr, n); });
    gl = g; return true;
  }
  // posisi pita bersama untuk kedua jalur
  function pose() {
    var gulir = Math.min(1, gulirY / tinggiDok);
    return {
      kx: W * cfg.kx + 60 * Math.sin(t * 0.32), ky: H * cfg.ky + 36 * Math.cos(t * 0.26) - gulir * H * 0.12,
      putaran: -0.42 + 0.14 * Math.sin(t * 0.4) + gulir * 0.35, R: cfg.R * (1 + 0.18 * Math.sin(t * 0.95)),
    };
  }
  // area teks hero yang pitanya diredupkan supaya teks tetap mudah dibaca
  function areaTeks() {
    if (!heroTeks || !heroTerlihat) return null;
    var b = heroTeks.getBoundingClientRect();
    if (b.bottom <= 0 || !b.width) return null;
    var rr = b.width * 0.62;
    return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, rx: rr, ry: rr * Math.max(0.5, b.height / b.width) * 1.15 };
  }
  function gambarGL() {
    var ps = pose(), a = areaTeks();
    gl.uniform2f(U.uRes, kanvas.width, kanvas.height); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uT, t);
    gl.uniform2f(U.uK, ps.kx, ps.ky); gl.uniform1f(U.uRot, ps.putaran); gl.uniform1f(U.uR, ps.R);
    gl.uniform1f(U.uN, cfg.N); gl.uniform1f(U.uGap, cfg.jarak); gl.uniform1f(U.uS, cfg.s); gl.uniform1f(U.uL, L);
    gl.uniform1f(U.uPendar, cfg.pendar ? 1 : 0);
    gl.uniform1f(U.uScrimOn, a ? 1 : 0); gl.uniform4f(U.uScrim, a ? a.cx : 0, a ? a.cy : 0, a ? a.rx : 1, a ? a.ry : 1);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function gambarPita() { gl ? gambarGL() : gambar2D(); }
  var W = 0, H = 0, L = 0, dpr = 1, t = 2, jalan = false, terakhir = 0, kecil = false, heroTerlihat = true, gulirY = 0, tinggiDok = 1, hemat = false, lambat = 0;
  var cfg, pulsa = [], partikel = [], jalur = [];
  function ukur() {
    kecil = innerWidth < 900;
    // WebGL boleh lebih tajam; kanvas 2D tetap 1x supaya ringan
    dpr = gl && !hemat ? Math.min(window.devicePixelRatio || 1, 1.5) : 1;
    W = innerWidth; H = innerHeight; L = Math.hypot(W, H);
    kanvas.width = Math.round(W * dpr); kanvas.height = Math.round(H * dpr);
    if (gl) gl.viewport(0, 0, kanvas.width, kanvas.height);
    tinggiDok = Math.max(1, document.documentElement.scrollHeight - H);
    cfg = kecil
      ? { N: 28, jarak: 9, langkah: 16, s: 80, R: 42, nPulsa: 12, nPartikel: 18, kx: 0.78, ky: 0.3, pendar: true }
      : { N: 50, jarak: 10, langkah: 12, s: 130, R: 70, nPulsa: 22, nPartikel: 44, kx: 0.5, ky: 0.62, pendar: true };
    if (hemat) { cfg.N = Math.round(cfg.N * 0.6); cfg.jarak *= 1.5; cfg.langkah *= 1.5; cfg.nPulsa = Math.round(cfg.nPulsa / 2); cfg.nPartikel = Math.round(cfg.nPartikel / 3); cfg.pendar = false; }
    var r = acak(5);
    pulsa = []; partikel = [];
    for (var i = 0; i < cfg.nPulsa; i++) pulsa.push({ garis: Math.floor(r() * cfg.N), fase: r(), laju: 0.085 + r() * 0.11, panjang: 0.07 + r() * 0.09 });
    for (var j = 0; j < cfg.nPartikel; j++) {
      // partikel lebih banyak di dekat mata kayu, seperti debu yang tertangkap cahaya
      var pusat = (cfg.N - 1) / 2, sebar = (r() - 0.5) * cfg.N * (r() < 0.6 ? 0.35 : 1);
      partikel.push({ garis: Math.max(0, Math.min(cfg.N - 1, Math.round(pusat + sebar))), fase: r(), laju: 0.03 + r() * 0.07, ukuran: 0.7 + r() * 1.5, kedip: r() * 6 });
    }
    gambarPita();
  }
  function yGaris(x, i, o, R) {
    var g = Math.exp(-(x * x) / (2 * cfg.s * cfg.s));
    return o + (o >= 0 ? 1 : -1) * R * g / (1 + Math.abs(o) / 60)
      + 28 * Math.sin(x * 0.005 + t * 1.8 + i * 0.21)
      + 12 * Math.sin(x * 0.012 - t * 1.2 + i * 0.5) * (1 - g);
  }
  function gambar2D() {
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, W, H);
    c.globalCompositeOperation = "lighter";
    var pz = pose(), kx = pz.kx, ky = pz.ky, putaran = pz.putaran;
    var R = pz.R, N = cfg.N, awal = -L * 0.55, akhir = L * 0.55, lk = cfg.langkah;
    c.save(); c.translate(kx, ky); c.rotate(putaran);
    // 1) garis serat
    for (var i = 0; i < N; i++) {
      var o = (i - (N - 1) / 2) * cfg.jarak, dekat = Math.exp(-Math.abs(o) / 95);
      var p = new Path2D(), inti = cfg.pendar && dekat > 0.72 ? new Path2D() : null, ada = false;
      for (var x = awal; x <= akhir; x += lk) {
        var y = yGaris(x, i, o, R);
        x === awal ? p.moveTo(x, y) : p.lineTo(x, y);
        // bagian tengah yang terang saja yang diberi pendar
        if (inti && x > -L * 0.18 && x < L * 0.22) { ada ? inti.lineTo(x, y) : inti.moveTo(x, y); ada = true; }
      }
      var warna = dekat > 0.8 ? "222,240,168" : i % 5 === 0 ? "150,205,190" : "182,212,92";
      var a = 0.06 + 0.7 * dekat;
      var grad = c.createLinearGradient(awal, 0, akhir, 0);
      grad.addColorStop(0, "rgba(" + warna + ",0)");
      grad.addColorStop(0.4, "rgba(" + warna + "," + (a * 0.5).toFixed(3) + ")");
      grad.addColorStop(0.5, "rgba(" + warna + "," + a.toFixed(3) + ")");
      grad.addColorStop(0.72, "rgba(" + warna + "," + (a * 0.45).toFixed(3) + ")");
      grad.addColorStop(1, "rgba(" + warna + ",0)");
      c.strokeStyle = grad; c.lineWidth = dekat > 0.6 ? 1.4 : 1; c.stroke(p);
      if (inti) { c.globalAlpha = 0.1; c.lineWidth = 6; c.stroke(inti); c.globalAlpha = 1; }
    }
    // 2) pulsa cahaya yang meluncur di sepanjang serat: hanya potongan pendek yang digambar
    for (var k = 0; k < pulsa.length; k++) {
      var ps = pulsa[k], u = (ps.fase + t * ps.laju) % 1, xp = awal + u * (akhir - awal), sp = ps.panjang * L;
      var oP = (ps.garis - (N - 1) / 2) * cfg.jarak, kuat = (0.35 + 0.65 * Math.exp(-Math.abs(oP) / 95)) * Math.sin(u * Math.PI);
      if (kuat < 0.04) continue;
      var seg = new Path2D(), x0 = Math.max(awal, xp - sp), x1 = Math.min(akhir, xp + sp);
      for (var xs = x0; xs <= x1; xs += lk) { var ys = yGaris(xs, ps.garis, oP, R); xs === x0 ? seg.moveTo(xs, ys) : seg.lineTo(xs, ys); }
      var gp = c.createLinearGradient(xp - sp, 0, xp + sp, 0);
      gp.addColorStop(0, "rgba(230,245,180,0)");
      gp.addColorStop(0.7, "rgba(230,245,180," + Math.min(1, 1.2 * kuat).toFixed(3) + ")");
      gp.addColorStop(1, "rgba(230,245,180,0)");
      c.strokeStyle = gp; c.lineWidth = 1.8; c.stroke(seg);
      if (cfg.pendar) { c.globalAlpha = 0.22; c.lineWidth = 6; c.stroke(seg); c.globalAlpha = 1; }
    }
    // 3) partikel kecil yang ikut mengalir
    for (var m = 0; m < partikel.length; m++) {
      var pt = partikel[m], uu = (pt.fase + t * pt.laju) % 1, xx = awal * 0.55 + uu * (akhir - awal) * 0.55;
      var oo = (pt.garis - (N - 1) / 2) * cfg.jarak, yy = yGaris(xx, pt.garis, oo, R);
      var al = (0.25 + 0.55 * Math.abs(Math.sin(t * 1.6 + pt.kedip))) * Math.sin(uu * Math.PI);
      c.fillStyle = "rgba(225,242,175," + al.toFixed(3) + ")";
      c.beginPath(); c.arc(xx, yy, pt.ukuran, 0, Math.PI * 2); c.fill();
    }
    // 4) mata kayu
    for (var j = 1; j <= 4; j++) {
      c.beginPath(); c.ellipse(0, 0, cfg.s * 0.16 * j, R * 0.2 * j * (1 + 0.04 * Math.sin(t + j)), 0, 0, Math.PI * 2);
      c.strokeStyle = "rgba(182,212,92," + (0.22 - j * 0.035).toFixed(3) + ")"; c.lineWidth = 1; c.stroke();
    }
    c.restore();
    // 5) redupkan pita tepat di belakang teks hero supaya tetap mudah dibaca
    var at = areaTeks();
    if (at) {
      var rr = at.rx;
      c.globalCompositeOperation = "destination-out";
      c.save(); c.translate(at.cx, at.cy); c.scale(1, at.ry / at.rx);
      var gs = c.createRadialGradient(0, 0, 0, 0, 0, rr);
      gs.addColorStop(0, "rgba(0,0,0,.55)"); gs.addColorStop(0.6, "rgba(0,0,0,.35)"); gs.addColorStop(1, "rgba(0,0,0,0)");
      c.fillStyle = gs; c.fillRect(-rr, -rr, rr * 2, rr * 2); c.restore();
    }
    c.globalCompositeOperation = "source-over";
  }
  function putar(now) {
    if (!jalan) return;
    // WebGL: 60 fps di hero, 30 fps di bagian lain. Kanvas 2D: 30 dan 24 fps.
    var batas = gl ? (heroTerlihat ? 15 : 32) : (heroTerlihat ? 33 : 42);
    if (now - terakhir >= batas) {
      var dt = now - terakhir;
      // perangkat lemah: kalau frame terus terlambat, kurangi garis dan efek pendar (sekali saja)
      if (!hemat) { lambat = dt > Math.max(40, batas * 1.6) ? lambat + 1 : Math.max(0, lambat - 1); if (lambat > 24) { hemat = true; ukur(); } }
      t += Math.min(dt, 60) / 1000; terakhir = now; gambarPita();
    }
    requestAnimationFrame(putar);
  }
  function mulai() { if (diam || jalan || document.hidden) return; jalan = true; lambat = 0; terakhir = performance.now(); requestAnimationFrame(putar); }
  function henti() { jalan = false; }
  if (!siapkanGL()) c = kanvas.getContext("2d");
  kanvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); henti(); });
  kanvas.addEventListener("webglcontextrestored", function () { if (siapkanGL()) { ukur(); mulai(); } });
  ukur();
  var tungguUkur;
  addEventListener("resize", function () { clearTimeout(tungguUkur); tungguUkur = setTimeout(function () { if (innerWidth !== W || Math.abs(innerHeight - H) > 120) ukur(); }, 150); });
  addEventListener("scroll", function () { gulirY = scrollY; if (diam) gambarPita(); }, { passive: true });
  addEventListener("load", function () { tinggiDok = Math.max(1, document.documentElement.scrollHeight - H); });
  document.addEventListener("visibilitychange", function () { document.hidden ? henti() : mulai(); });
  var hero = document.querySelector(".hero");
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      heroTerlihat = e[0].isIntersecting;
      kanvas.classList.toggle("redam", !heroTerlihat);
    }, { threshold: 0.12 }).observe(hero);
  }
  mulai();

  /* ---------- Kalkulator meja ---------- */
  var meja = document.getElementById("meja"), mc = meja.getContext("2d");
  var form = document.getElementById("konfig"), pola = {};
  function polaKayu(jenis) {
    if (pola[jenis]) return pola[jenis];
    var off = document.createElement("canvas"); off.width = 640; off.height = 280;
    gambarSerat(off.getContext("2d"), 640, 280, jenis, 11);
    return (pola[jenis] = off);
  }
  function nilai() {
    return {
      p: +document.getElementById("k-panjang").value,
      l: +form.querySelector("input[name=lebar]:checked").value,
      kayu: form.querySelector("input[name=kayu]:checked").value,
      fin: form.querySelector("input[name=fin]:checked").value,
    };
  }
  function kursi(p, l) { var sisi = Math.floor(p / 55), ujung = p >= 220 && l >= 90 ? 2 : 0; return { sisi: sisi, ujung: ujung, total: sisi * 2 + ujung }; }
  function hitung() {
    var v = nilai(), k = KAYU[v.kayu], f = FIN[v.fin], luas = v.p * v.l / 10000;
    var harga = bulat((luas * k.rate + k.rangka) * f.kali);
    var hari = Math.round(14 + (v.p - 120) / 40 + k.hari + f.hari);
    var berat = Math.round(luas * 0.035 * k.berat * 1.35);
    var ks = kursi(v.p, v.l);
    document.getElementById("k-panjang-v").textContent = v.p + " cm";
    document.getElementById("k-harga").textContent = rp(harga);
    document.getElementById("k-info").textContent = hari + " hari kerja / sekitar " + berat + " kg";
    document.getElementById("k-kursi").textContent = ks.total + " kursi";
    gambarMeja(v, ks);
  }
  function kotak(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect ? ctx.roundRect(x, y, w, h, r) : ctx.rect(x, y, w, h); }
  function gambarMeja(v, ks) {
    var rect = meja.getBoundingClientRect(), d = Math.min(window.devicePixelRatio || 1, 2);
    var cw = rect.width, ch = rect.height;
    if (!cw) return;
    if (meja.width !== Math.round(cw * d) || meja.height !== Math.round(ch * d)) { meja.width = Math.round(cw * d); meja.height = Math.round(ch * d); }
    mc.setTransform(d, 0, 0, d, 0, 0); mc.clearRect(0, 0, cw, ch);
    var skala = Math.min((cw - 70) / 330, (ch - 36) / 190);
    var tw = v.p * skala, th = v.l * skala, x0 = (cw - tw) / 2, y0 = (ch - th) / 2 + 10;
    var kw = 44 * skala, kd = 40 * skala;
    mc.fillStyle = "#2A3120";
    var jarak = tw / ks.sisi;
    for (var i = 0; i < ks.sisi; i++) {
      var cx = x0 + jarak * (i + 0.5) - kw / 2;
      kotak(mc, cx, y0 - kd - 4 * skala, kw, kd, 4); mc.fill();
      kotak(mc, cx, y0 + th + 4 * skala, kw, kd, 4); mc.fill();
    }
    if (ks.ujung) {
      kotak(mc, x0 - kd - 4 * skala, y0 + th / 2 - kw / 2, kd, kw, 4); mc.fill();
      kotak(mc, x0 + tw + 4 * skala, y0 + th / 2 - kw / 2, kd, kw, 4); mc.fill();
    }
    mc.save(); kotak(mc, x0, y0, tw, th, 3); mc.clip();
    if (v.fin === "duco") { mc.fillStyle = "#18190F"; mc.fillRect(x0, y0, tw, th); mc.globalAlpha = 0.18; }
    mc.drawImage(polaKayu(v.kayu), x0, y0, tw, th);
    mc.globalAlpha = 1;
    if (v.fin === "doff") { mc.fillStyle = "rgba(236,239,227,.12)"; mc.fillRect(x0, y0, tw, th); }
    mc.restore();
    // Garis ukur
    mc.strokeStyle = "rgba(169,176,154,.8)"; mc.fillStyle = "#ECEFE3"; mc.lineWidth = 1;
    mc.font = "500 13px 'Inter Tight', system-ui, sans-serif"; mc.textAlign = "center"; mc.textBaseline = "middle";
    var yu = Math.max(10, y0 - kd - 4 * skala - 12);
    mc.beginPath(); mc.moveTo(x0, yu); mc.lineTo(x0 + tw, yu); mc.moveTo(x0, yu - 4); mc.lineTo(x0, yu + 4); mc.moveTo(x0 + tw, yu - 4); mc.lineTo(x0 + tw, yu + 4); mc.stroke();
    var lbl = v.p + " cm", lw = mc.measureText(lbl).width + 12;
    mc.fillStyle = "#14180F"; mc.fillRect(x0 + tw / 2 - lw / 2, yu - 9, lw, 18); mc.fillStyle = "#ECEFE3"; mc.fillText(lbl, x0 + tw / 2, yu);
    var xu = x0 + tw + (ks.ujung ? kd + 4 * skala : 0) + 14;
    mc.beginPath(); mc.moveTo(xu, y0); mc.lineTo(xu, y0 + th); mc.moveTo(xu - 4, y0); mc.lineTo(xu + 4, y0); mc.moveTo(xu - 4, y0 + th); mc.lineTo(xu + 4, y0 + th); mc.stroke();
    mc.save(); mc.translate(xu, y0 + th / 2); mc.rotate(-Math.PI / 2);
    lbl = v.l + " cm"; lw = mc.measureText(lbl).width + 12;
    mc.fillStyle = "#14180F"; mc.fillRect(-lw / 2, -9, lw, 18); mc.fillStyle = "#ECEFE3"; mc.fillText(lbl, 0, 0); mc.restore();
  }
  form.addEventListener("input", hitung);
  form.addEventListener("change", hitung);
  addEventListener("resize", function () { hitung(); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(hitung);
  hitung();

  /* ---------- Log pesanan ---------- */
  document.querySelectorAll("#log li").forEach(function (li) {
    li.querySelector("b").style.cssText = "--a:" + li.dataset.a + ";--b:" + li.dataset.b;
  });

  /* ---------- Grafik isometrik kadar air ---------- */
  var iso = document.getElementById("iso"), data = [["Mg 1", 18.2], ["Mg 2", 15.6], ["Mg 3", 13.1], ["Mg 4", 11.4], ["Mg 5", 10.3]];
  function gambarIso() {
    var w = Math.max(300, Math.round(iso.getBoundingClientRect().width)), h = 270;
    iso.setAttribute("viewBox", "0 0 " + w + " " + h);
    var dasar = 226, skalaY = 8.4, langkah = (w - 40) / data.length, lebar = Math.min(54, langkah * 0.46), dx = lebar * 0.42, dy = dx * 0.55;
    var yb = dasar - 12 * skalaY;
    var isi = '<line x1="12" x2="' + (w - 12) + '" y1="' + yb + '" y2="' + yb + '" stroke="rgba(182,212,92,.55)" stroke-dasharray="4 5"/>';
    data.forEach(function (d, i) {
      var x = 20 + langkah * i + (langkah - lebar - dx) / 2, tinggi = d[1] * skalaY, y = dasar - tinggi, siap = d[1] < 12;
      var depan = siap ? "#A8C556" : "#2C3322", sisi = siap ? "#86A03C" : "#20261A", atas = siap ? "#CBE27A" : "#3C4530";
      isi += '<g class="balok" style="transition-delay:' + i * 90 + 'ms">'
        + '<rect x="' + x + '" y="' + y + '" width="' + lebar + '" height="' + tinggi + '" fill="' + depan + '"/>'
        + '<polygon points="' + (x + lebar) + ',' + y + ' ' + (x + lebar + dx) + ',' + (y - dy) + ' ' + (x + lebar + dx) + ',' + (dasar - dy) + ' ' + (x + lebar) + ',' + dasar + '" fill="' + sisi + '"/>'
        + '<polygon points="' + x + ',' + y + ' ' + (x + dx) + ',' + (y - dy) + ' ' + (x + lebar + dx) + ',' + (y - dy) + ' ' + (x + lebar) + ',' + y + '" fill="' + atas + '"/></g>';
      isi += '<text x="' + (x + lebar / 2) + '" y="' + (y - dy - 10) + '" text-anchor="middle" class="nilai' + (siap ? " siap" : "") + '">' + String(d[1]).replace(".", ",") + '%</text>';
      isi += '<text x="' + (x + lebar / 2) + '" y="' + (dasar + 26) + '" text-anchor="middle">' + d[0] + '</text>';
    });
    iso.innerHTML = isi;
  }
  gambarIso(); addEventListener("resize", gambarIso);

  /* ---------- Klip amplas: putar hanya saat terlihat ---------- */
  var klip = document.getElementById("klip");
  if (klip && !diam && "IntersectionObserver" in window) {
    new IntersectionObserver(function (e) {
      if (e[0].isIntersecting) { klip.preload = "auto"; var pr = klip.play(); if (pr && pr.catch) pr.catch(function () {}); }
      else klip.pause();
    }, { threshold: 0.25 }).observe(klip);
  }

  /* ---------- Jam WIB: jadwal bengkel dan status ---------- */
  function wib() { var d = new Date(Date.now() + (new Date().getTimezoneOffset() + 420) * 60000); return { jam: d.getHours() + d.getMinutes() / 60, hari: d.getDay(), teks: String(d.getHours()).padStart(2, "0") + "." + String(d.getMinutes()).padStart(2, "0") }; }
  function perbaruiJam() {
    var w = wib(), baris = document.querySelectorAll("#jadwal tr"), kini = null;
    var buka = w.hari !== 0 && w.jam >= 7.5 && w.jam < 17;
    baris.forEach(function (tr) { tr.classList.remove("kini", "lewat"); if (buka && +tr.dataset.j <= w.jam) kini = tr; });
    if (kini) { kini.classList.add("kini"); var p = kini.previousElementSibling; while (p) { p.classList.add("lewat"); p = p.previousElementSibling; } }
    document.getElementById("jam-kini").textContent = buka ? "sekarang " + w.teks + " WIB" : "bengkel tutup, " + w.teks + " WIB";
    var sb = document.getElementById("st-bengkel"), sp = document.getElementById("st-pamer");
    sb.textContent = buka ? "Bengkel Jepara sedang bekerja" : "Bengkel Jepara tutup, buka Senin sampai Sabtu 07.30";
    sb.classList.toggle("tutup", !buka);
    var pamer = w.jam >= 10 && w.jam < 20;
    sp.textContent = pamer ? "Ruang pamer Bekasi buka sampai 20.00" : "Ruang pamer Bekasi tutup, buka 10.00";
    sp.classList.toggle("tutup", !pamer);
  }
  perbaruiJam(); setInterval(perbaruiJam, 60000);

  /* ---------- Taksiran lemari tanam ---------- */
  var RATE_LEMARI = { pinus: 2900000, mahoni: 3600000, jati: 5200000 };
  var tm = document.getElementById("t-meter");
  function taksir() {
    var m = +tm.value, kayu = document.querySelector("input[name=tkayu]:checked").value, h = bulat(m * RATE_LEMARI[kayu]);
    document.getElementById("t-meter-v").textContent = m.toFixed(1).replace(".", ",") + " m";
    document.getElementById("t-harga").textContent = rp(h);
    document.getElementById("t-dp").textContent = "DP 50%: " + rp(bulat(h / 2)) + " / pasang " + (m <= 2.6 ? "1 hari" : "2 hari");
  }
  tm.addEventListener("input", taksir);
  document.querySelectorAll("input[name=tkayu]").forEach(function (r) { r.addEventListener("change", taksir); });
  taksir();

  /* ---------- Masuk saat terlihat ---------- */
  var target = document.querySelectorAll(".naik, .log, .iso, .cincin");
  if (!("IntersectionObserver" in window) || diam) { target.forEach(function (el) { el.classList.add("tampil"); }); return; }
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("tampil"); io.unobserve(e.target); } });
  }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
  target.forEach(function (el) { io.observe(el); });
})();
