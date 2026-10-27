// Klien tipis untuk Edge Function Supabase (tanpa supabase-js). Bila config kosong atau fetch gagal,
// pemanggil jatuh ke WhatsApp tanpa kode. Kontrak: supabase/README.md.
(function () {
  var C = window.BIKININ_CONFIG || {};
  var TIMEOUT = 8000;

  function enabled() { return !!(C.SUPABASE_URL && C.SUPABASE_ANON_KEY); }

  function post(fn, body) {
    if (!enabled()) return Promise.resolve({ ok: false, status: 0, offline: true, error: "config-kosong" });
    var ctl = "AbortController" in window ? new AbortController() : null;
    var timer = setTimeout(function () { if (ctl) ctl.abort(); }, TIMEOUT);
    return Promise.race([
      fetch(C.SUPABASE_URL.replace(/\/$/, "") + "/functions/v1/" + fn, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: C.SUPABASE_ANON_KEY, Authorization: "Bearer " + C.SUPABASE_ANON_KEY },
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
    submitBrief: function (d) { return post("submit-brief", d); },
    submitReview: function (d) { return post("submit-review", d); },
    publicReviews: function () { return get("public_reviews?select=nama,usaha,layanan,rating,teks,bulan_tahun"); },
  };
})();
