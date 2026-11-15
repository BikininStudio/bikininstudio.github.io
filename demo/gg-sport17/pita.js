/* GG Sport17: pita tape dari cahaya di belakang seluruh halaman.
   Satu fragment shader menggambar puluhan benang tape yang terpelintir dan mengalir.
   Warnanya ikut roll yang sedang dipilih (event gg:warna dari app.js).
   Tanpa WebGL kanvas disembunyikan; halaman tetap lengkap. */
(function () {
  'use strict';
  var kanvas = document.getElementById('pita');
  if (!kanvas) return;
  var diam = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var heroTeks = document.getElementById('hero-teks');

  var VS = 'attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
  var FS = [
    'precision highp float;',
    'uniform vec2 uRes,uK;uniform float uDpr,uT,uRot,uN,uGap,uL,uAmp,uPendar,uScrimOn;uniform vec4 uScrim;uniform vec3 uCol;',
    'float h1(float n){return fract(sin(n*12.9898)*43758.5453);}',
    'float h2(float n){return fract(sin(n*78.233)*12345.6789);}',
    // pita muncul dari kiri, paling terang sedikit lewat tengah, lalu memudar
    'float env(float u){if(u<=0.||u>=1.)return 0.;if(u<.35)return u/.35*.55;if(u<.5)return mix(.55,1.,(u-.35)/.15);if(u<.75)return mix(1.,.4,(u-.5)/.25);return mix(.4,0.,(u-.75)/.25);}',
    'void main(){',
    ' vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y)/uDpr;',
    ' vec2 d=p-uK;float cr=cos(uRot),sr=sin(uRot);',
    ' float x=cr*d.x+sr*d.y,y=-sr*d.x+cr*d.y;',
    ' float aw=-uL*.55,ak=uL*.55,e=env((x-aw)/(ak-aw));',
    ' vec3 col=vec3(0.);',
    ' if(e>0.){',
    // pelintiran: lebar pita mengecil dan melebar sepanjang x, sisi yang menghadap kamera lebih terang
    '  float tw=cos(x*.0032-uT*.55);float lebar=.18+.82*abs(tw);float muka=.55+.45*abs(tw);',
    '  float jalan=uAmp*sin(x*.0042+uT*.8)+uAmp*.35*sin(x*.011-uT*1.3);',
    '  float hw=(uN-1.)*.5*uGap*lebar;',
    '  if(abs(y-jalan)<hw+40.){',
    '  for(int ii=0;ii<64;ii++){',
    '   float i=float(ii);if(i>=uN)break;',
    '   float o=(i-(uN-1.)*.5)*uGap;',
    '   float yi=jalan+o*lebar+3.*sin(x*.02+uT*2.+i*.7);',
    '   float dd=abs(y-yi);if(dd>9.)continue;',
    '   float tepi=abs(o)/((uN-1.)*.5*uGap);',
    '   float tepiK=smoothstep(.82,1.,tepi);',
    '   vec3 c=mix(uCol,vec3(1.),.04+.36*tepiK);',
    '   if(mod(i,7.)<.5)c=mix(uCol,vec3(1.),.4);',
    '   float kuat=(.12+.4*muka)*(1.-.5*tepi)+.3*tepiK;',
    '   float w=tepiK>.5?.9:.6;',
    '   float glow=(uPendar>.5&&x>-uL*.2&&x<uL*.24)?.12*exp(-dd*dd/12.):0.;',
    '   col+=c*kuat*e*(exp(-dd*dd/(w*w))+glow);',
    // cahaya pendek yang meluncur di sepanjang benang
    '   if(h1(i+1.)<.4){',
    '    float up=fract(h2(i+1.)+uT*(.07+h2(i+3.)*.09)),ln=uL*(.06+h1(i+7.)*.08);',
    '    float tt=(x-mix(aw,ak,up))/ln;',
    '    float pr=tt<.4?smoothstep(-1.,.4,tt):1.-smoothstep(.4,1.,tt);',
    '    float pk=min(1.,1.1*muka*sin(up*3.14159))*pr;',
    '    col+=mix(uCol,vec3(1.),.45)*pk*(exp(-dd*dd/1.3)+(uPendar>.5?.2*exp(-dd*dd/10.):0.));',
    '   }',
    '  }',
    '  }',
    // serat kain halus di permukaan pita
    '  float dalam=1.-smoothstep(hw-4.,hw+2.,abs(y-jalan));',
    '  col+=uCol*.05*muka*e*dalam*(.6+.4*sin(x*.9+y*.4));',
    ' }',
    ' if(uScrimOn>.5){float rs=length((p-uScrim.xy)/uScrim.zw);float m=rs<.6?mix(.6,.4,rs/.6):(rs<1.?mix(.4,0.,(rs-.6)/.4):0.);col*=1.-m;}',
    ' col=min(col,vec3(1.));',
    ' gl_FragColor=vec4(col,max(col.r,max(col.g,col.b)));',
    '}'
  ].join('\n');

  var gl = null, U = {};
  function siapkan() {
    var g = null;
    try { g = kanvas.getContext('webgl', { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false, powerPreference: 'low-power' }); } catch (e) { g = null; }
    if (!g) return false;
    var sh = function (tipe, src) { var s = g.createShader(tipe); g.shaderSource(s, src); g.compileShader(s); return g.getShaderParameter(s, g.COMPILE_STATUS) ? s : null; };
    var v = sh(g.VERTEX_SHADER, VS), f = sh(g.FRAGMENT_SHADER, FS);
    if (!v || !f) return false;
    var pr = g.createProgram(); g.attachShader(pr, v); g.attachShader(pr, f); g.linkProgram(pr);
    if (!g.getProgramParameter(pr, g.LINK_STATUS)) return false;
    g.useProgram(pr);
    g.bindBuffer(g.ARRAY_BUFFER, g.createBuffer());
    g.bufferData(g.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), g.STATIC_DRAW);
    var loc = g.getAttribLocation(pr, 'p'); g.enableVertexAttribArray(loc); g.vertexAttribPointer(loc, 2, g.FLOAT, false, 0, 0);
    ['uRes', 'uK', 'uDpr', 'uT', 'uRot', 'uN', 'uGap', 'uL', 'uAmp', 'uPendar', 'uScrimOn', 'uScrim', 'uCol'].forEach(function (n) { U[n] = g.getUniformLocation(pr, n); });
    gl = g; return true;
  }

  /* ---------- Warna: ikut roll terpilih, warna gelap diangkat supaya tetap bercahaya ---------- */
  function rgb(hex) {
    var n = parseInt((hex || '#2BA3DC').slice(1), 16);
    var c = [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255];
    var lum = .2126 * c[0] + .7152 * c[1] + .0722 * c[2];
    var naik = lum < .28 ? (.28 - lum) / .28 * .55 : 0;
    return c.map(function (v, i) { return v + ([.62, .68, .74][i] - v) * naik; });
  }
  var awal = window.GG && window.GG.get ? window.GG.get().hex : '#2BA3DC';
  var warna = rgb(awal), tuju = warna.slice();
  document.addEventListener('gg:warna', function (e) { tuju = rgb(e.detail.hex); if (diam) { warna = tuju.slice(); gambar(); } });

  var W = 0, H = 0, L = 0, dpr = 1, t = 3, jalan = false, terakhir = 0, heroTerlihat = true, gulirY = 0, tinggiDok = 1, hemat = false, lambat = 0, cfg;
  function ukur() {
    var kecil = innerWidth < 900;
    dpr = hemat ? 1 : Math.min(devicePixelRatio || 1, 1.5);
    W = innerWidth; H = innerHeight; L = Math.hypot(W, H);
    kanvas.width = Math.round(W * dpr); kanvas.height = Math.round(H * dpr);
    gl.viewport(0, 0, kanvas.width, kanvas.height);
    tinggiDok = Math.max(1, document.documentElement.scrollHeight - H);
    cfg = kecil ? { N: 26, jarak: 5.2, amp: 34, kx: .62, ky: .24, pendar: true } : { N: 44, jarak: 5.6, amp: 56, kx: .5, ky: .56, pendar: true };
    if (hemat) { cfg.N = Math.round(cfg.N * .6); cfg.jarak *= 1.6; cfg.pendar = false; }
    gambar();
  }
  function areaTeks() {
    if (!heroTeks || !heroTerlihat) return null;
    var b = heroTeks.getBoundingClientRect();
    if (b.bottom <= 0 || !b.width) return null;
    var rr = b.width * .62;
    return { cx: b.left + b.width / 2, cy: b.top + b.height / 2, rx: rr, ry: rr * Math.max(.5, b.height / b.width) * 1.15 };
  }
  function gambar() {
    if (!gl) return;
    var g = Math.min(1, gulirY / tinggiDok), a = areaTeks();
    gl.uniform2f(U.uRes, kanvas.width, kanvas.height); gl.uniform1f(U.uDpr, dpr); gl.uniform1f(U.uT, t);
    gl.uniform2f(U.uK, W * cfg.kx + 50 * Math.sin(t * .3), H * cfg.ky + 30 * Math.cos(t * .24) - g * H * .1);
    gl.uniform1f(U.uRot, -.36 + .1 * Math.sin(t * .37) + g * .5);
    gl.uniform1f(U.uN, cfg.N); gl.uniform1f(U.uGap, cfg.jarak); gl.uniform1f(U.uL, L); gl.uniform1f(U.uAmp, cfg.amp);
    gl.uniform1f(U.uPendar, cfg.pendar ? 1 : 0);
    gl.uniform3f(U.uCol, warna[0], warna[1], warna[2]);
    gl.uniform1f(U.uScrimOn, a ? 1 : 0); gl.uniform4f(U.uScrim, a ? a.cx : 0, a ? a.cy : 0, a ? a.rx : 1, a ? a.ry : 1);
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }
  function putar(now) {
    if (!jalan) return;
    // 60 fps saat layar pertama terlihat, 30 fps di bagian lain
    var batas = heroTerlihat ? 15 : 32;
    if (now - terakhir >= batas) {
      var dt = now - terakhir;
      // perangkat lemah: bila frame terus telat, kurangi benang dan pendar (sekali saja)
      if (!hemat) { lambat = dt > Math.max(40, batas * 1.6) ? lambat + 1 : Math.max(0, lambat - 1); if (lambat > 24) { hemat = true; ukur(); } }
      var k = Math.min(1, dt / 1000 * 4);
      for (var i = 0; i < 3; i++) warna[i] += (tuju[i] - warna[i]) * k;
      t += Math.min(dt, 60) / 1000; terakhir = now; gambar();
    }
    requestAnimationFrame(putar);
  }
  function mulai() { if (diam || jalan || document.hidden || !gl) return; jalan = true; lambat = 0; terakhir = performance.now(); requestAnimationFrame(putar); }
  function henti() { jalan = false; }

  if (!siapkan()) { document.documentElement.classList.add('no-pita'); return; }
  kanvas.addEventListener('webglcontextlost', function (e) { e.preventDefault(); henti(); });
  kanvas.addEventListener('webglcontextrestored', function () { if (siapkan()) { ukur(); mulai(); } });
  ukur();
  var tunggu;
  addEventListener('resize', function () { clearTimeout(tunggu); tunggu = setTimeout(function () { if (innerWidth !== W || Math.abs(innerHeight - H) > 120) ukur(); }, 150); });
  addEventListener('scroll', function () { gulirY = scrollY; if (diam) gambar(); }, { passive: true });
  addEventListener('load', function () { tinggiDok = Math.max(1, document.documentElement.scrollHeight - H); });
  document.addEventListener('visibilitychange', function () { document.hidden ? henti() : mulai(); });
  var hero = document.querySelector('.hero');
  if (hero && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (e) {
      heroTerlihat = e[0].isIntersecting;
      kanvas.classList.toggle('redam', !heroTerlihat);
    }, { threshold: .12 }).observe(hero);
  }
  mulai();
})();
