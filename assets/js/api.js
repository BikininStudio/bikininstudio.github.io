// Klien tipis untuk Edge Function Supabase (tanpa supabase-js). Bila config kosong atau fetch gagal,
// pemanggil jatuh ke WhatsApp tanpa kode. Kontrak: supabase/README.md.
(function () {
  var C = window.BIKININ_CONFIG || {};
  var TIMEOUT = 8000;

  function enabled() { return !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY); }

  // Token akun klien (bila sedang masuk) dibaca dari penyimpanan supabase-js; dipakai agar pesanan tertaut ke akun.
  function userToken() {
    try {
      var ref = String(C.SUPABASE_URL || "").replace(/^https?:\/\//, "").split(".")[0];
      var raw = localStorage.getItem("sb-" + ref + "-auth-token");
      if (!raw) return null;
      var s = JSON.parse(raw);
      if (s && s.access_token && (!s.expires_at || s.expires_at * 1000 > Date.now() + 30000)) return s.access_token;
    } catch (e) {}
    return null;
  }

  // Token kedaluwarsa (halaman ini tidak memuat supabase-js): minta token baru dengan refresh token,
  // simpan kembali dengan format supabase-js supaya halaman akun tetap memakai sesi yang sama.
  function freshToken() {
    var t = userToken();
    if (t) return Promise.resolve(t);
    try {
      var ref = String(C.SUPABASE_URL || "").replace(/^https?:\/\//, "").split(".")[0], key = "sb-" + ref + "-auth-token";
      var s = JSON.parse(localStorage.getItem(key) || "null");
      if (!s || !s.refresh_token || !enabled()) return Promise.resolve(null);
      return fetch(C.SUPABASE_URL.replace(/\/$/, "") + "/auth/v1/token?grant_type=refresh_token", {
        method: "POST", headers: { "Content-Type": "application/json", apikey: C.SUPABASE_ANON_KEY }, body: JSON.stringify({ refresh_token: s.refresh_token }),
      }).then(function (r) { return r.ok ? r.json() : null; }).then(function (j) {
        if (!j || !j.access_token) return null;
        var n = { access_token: j.access_token, refresh_token: j.refresh_token || s.refresh_token, token_type: j.token_type || "bearer", expires_in: j.expires_in, expires_at: Math.round(Date.now() / 1000) + (j.expires_in || 3600), user: j.user || s.user };
        try { localStorage.setItem(key, JSON.stringify(n)); } catch (e) {}
        return n.access_token;
      }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  }

  function hasSession() {
    try { var ref = String(C.SUPABASE_URL || "").replace(/^https?:\/\//, "").split(".")[0]; return !!localStorage.getItem("sb-" + ref + "-auth-token"); } catch (e) { return false; }
  }

  function post(fn, body, token) {
    if (!enabled()) return Promise.resolve({ ok: false, status: 0, offline: true, error: "config-kosong" });
    var ctl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT);
    return Promise.race([
      fetch(C.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/" + fn, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: C.SUPABASE_ANON_KEY, Authorization: "Bearer " + (token || C.SUPABASE_ANON_KEY) },
        body: JSON.stringify(body),
        signal: ctl ? ctl.signal : undefined,
      }).then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (j) { j.status = r.status; if (!("ok" in j)) j.ok = r.ok; return j; });
      }),
      new Promise(function (res) { setTimeout(function () { res({ ok: false, status: 0, timeout: true, error: "timeout" }); }, TIMEOUT + 300); }),
    ]).catch(function () { return { ok: false, status: 0, error: "jaringan" }; }).then(function (r) { clearTimeout(timer); return r; });
  }

  function get(path) {
    if (!enabled()) return Promise.resolve(null);
    return fetch(C.SUPABASE_URL.replace(/\/$/, "") + "/rest/v1/" + path, { headers: { apikey: C.SUPABASE_ANON_KEY } })
      .then(function (r) { return r.ok ? r.json() : null; }).catch(function () { return null; });
  }

  window.BikininAPI = {
    enabled: enabled,
    submitBrief: function (d) {
      var stored = hasSession();
      return freshToken().then(function (tok) {
        return post("submit-brief", d, tok).then(function (r) { r.sesiTakTertaut = !!(r && r.ok && r.kode && stored && !(tok && r.tertaut === true)); return r; });
      });
    },
    userToken: userToken,
    freshToken: freshToken,
    submitReview: function (d) { return post("submit-review", d); },
    publicReviews: function () { return get("public_reviews?select=nama,usaha,layanan,rating,teks,bulan_tahun"); },
  };
})();
