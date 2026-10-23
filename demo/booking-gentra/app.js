// Booking Gentra Barbershop: demo booking app. All data lives in this device's localStorage.
(function () {
  const SERVICES = [
    { id: "potong", name: "Potong Rambut", dur: 30, price: 35000, ic: "✂️", desc: "Konsultasi model + styling" },
    { id: "komplit", name: "Potong + Cuci + Pijat", dur: 60, price: 55000, ic: "💈", desc: "Paling sering dipilih" },
    { id: "jenggot", name: "Cukur Jenggot & Kumis", dur: 30, price: 25000, ic: "🪒", desc: "Handuk hangat" },
    { id: "anak", name: "Potong Anak", dur: 30, price: 30000, ic: "🧒", desc: "Usia 10 tahun ke bawah" },
    { id: "creambath", name: "Creambath", dur: 60, price: 65000, ic: "🧴", desc: "Rambut & kulit kepala" },
    { id: "warna", name: "Hair Coloring", dur: 90, price: 150000, ic: "🎨", desc: "Sudah termasuk cat" }
  ];
  const BARBERS = [
    { id: "raka", name: "Raka", note: "Spesialis fade", color: "#B4483A" },
    { id: "dimas", name: "Dimas", note: "Klasik & jenggot", color: "#2C5C9A" },
    { id: "yoga", name: "Yoga", note: "Coloring", color: "#2F7A55" }
  ];
  const ANY = { id: "any", name: "Siapa aja", note: "Paling cepat kosong", color: "#1D2733" };
  const OPEN = 10 * 60, CLOSE = 21 * 60, STEP = 30, DAYS = 7;
  const STATUSES = ["Menunggu", "Datang", "Selesai", "Batal"];
  const KEY = "booking-gentra-v1";
  const svcById = Object.fromEntries(SERVICES.map((s) => [s.id, s]));
  const barberById = Object.fromEntries([...BARBERS, ANY].map((b) => [b.id, b]));
  const $ = (id) => document.getElementById(id);
  const rp = (n) => "Rp " + Math.round(n).toLocaleString("id-ID");
  const pad = (n) => String(n).padStart(2, "0");
  const dayKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const hm = (m) => `${pad(Math.floor(m / 60))}.${pad(m % 60)}`;
  const nowMin = () => { const d = new Date(); return d.getHours() * 60 + d.getMinutes(); };
  const days = () => Array.from({ length: DAYS }, (_, i) => { const d = new Date(); d.setHours(12, 0, 0, 0); d.setDate(d.getDate() + i); return d; });
  const dateOf = (key) => { const [y, m, d] = key.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const longDate = (key) => dateOf(key).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  const shortDate = (key) => dateOf(key).toLocaleDateString("id-ID", { weekday: "short", day: "numeric", month: "short" });
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  // ---------- State ----------
  let store = load();
  const sel = { svc: null, barber: "any", date: null, time: null };
  let schedDate = dayKey(new Date());
  let schedBarber = "all";
  let detailId = null;

  function load() {
    const today = dayKey(new Date());
    let kept = [];
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && s.seeded === today && Array.isArray(s.bookings)) return s;
      // New day: the visitor's own bookings for today and later stay, only the sample data is made again
      if (s && Array.isArray(s.bookings)) kept = s.bookings.filter((b) => b && !b.sample && b.date >= today && svcById[b.svc] && barberById[b.barber]);
    } catch (e) { /* storage unavailable or corrupt: start fresh */ }
    const s = seed();
    const clash = (x) => kept.some((k) => k.status !== "Batal" && k.barber === x.barber && k.date === x.date && x.start < k.start + k.dur && k.start < x.start + x.dur);
    s.bookings = s.bookings.filter((x) => !clash(x)).concat(kept);
    save(s);
    return s;
  }
  function save(s = store) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { /* private mode: keep in memory */ }
  }

  function newCode() {
    const A = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let c;
    do { c = "GB-" + Array.from({ length: 4 }, () => A[Math.floor(Math.random() * A.length)]).join(""); }
    while (store && store.bookings.some((b) => b.code === c));
    return c;
  }

  // Example bookings for the coming week so the schedule isn't empty (marked as sample)
  function seed() {
    const NAMES = ["Andi", "Bagas", "Fajar", "Rizky", "Dodi", "Hendra", "Ilham", "Joko", "Kevin", "Lukman", "Made", "Naufal", "Oki", "Putra", "Reza", "Sandi", "Teguh", "Wahyu", "Yusuf", "Zaki"];
    const WEIGHTED = ["potong", "potong", "potong", "komplit", "komplit", "jenggot", "anak", "creambath", "warna"];
    let r = 11;
    const rand = () => ((r = (r * 9301 + 49297) % 233280) / 233280);
    const pick = (a) => a[Math.floor(rand() * a.length)];
    const now = nowMin();
    const bookings = [];
    days().forEach((d, i) => {
      const density = i === 0 ? 0.45 : Math.max(0.15, 0.4 - i * 0.04);
      BARBERS.forEach((b) => {
        let t = OPEN;
        while (t < CLOSE) {
          const s = svcById[pick(WEIGHTED)];
          if (rand() < density && t + s.dur <= CLOSE) {
            let status = "Menunggu";
            if (i === 0 && t + s.dur <= now) status = rand() < 0.1 ? "Batal" : "Selesai";
            else if (i === 0 && t <= now) status = "Datang";
            bookings.push({
              code: "GB-" + String(1001 + bookings.length), date: dayKey(d), start: t, dur: s.dur, svc: s.id, barber: b.id,
              name: pick(NAMES), phone: `08${Math.floor(10 + rand() * 89)}-xxxx-${Math.floor(1000 + rand() * 8999)}`,
              note: "", status, sample: true
            });
            t += s.dur;
          } else {
            t += STEP;
          }
        }
      });
    });
    return { seeded: dayKey(new Date()), bookings };
  }

  // ---------- Availability ----------
  const active = (b) => b.status !== "Batal";
  const statusOf = (b) => (STATUSES.includes(b.status) ? b.status : "Menunggu"); // stored data is never shown as raw HTML
  function barberFree(barberId, date, start, dur) {
    if (start < OPEN || start + dur > CLOSE) return false;
    if (date === dayKey(new Date()) && start <= nowMin()) return false;
    return !store.bookings.some((b) => active(b) && b.barber === barberId && b.date === date && start < b.start + b.dur && b.start < start + dur);
  }
  function freeBarbers(barberId, date, start, dur) {
    const ids = barberId === "any" ? BARBERS.map((b) => b.id) : [barberId];
    return ids.filter((id) => barberFree(id, date, start, dur));
  }
  // "Siapa aja": give the slot to the free barber with the lightest day
  function assignBarber(date, start, dur) {
    const load = (id) => store.bookings.filter((b) => active(b) && b.barber === id && b.date === date).reduce((s, b) => s + b.dur, 0);
    return freeBarbers(sel.barber, date, start, dur).sort((a, b) => load(a) - load(b))[0];
  }
  const curDur = () => (sel.svc ? svcById[sel.svc].dur : STEP);
  function slotTimes(dur) { const out = []; for (let t = OPEN; t + dur <= CLOSE; t += STEP) out.push(t); return out; }
  const freeCount = (date) => slotTimes(curDur()).filter((t) => freeBarbers(sel.barber, date, t, curDur()).length).length;

  // ---------- Booking view ----------
  function radio(el, checked) { el.setAttribute("role", "radio"); el.setAttribute("aria-checked", String(checked)); }

  function renderServices() {
    const box = $("services");
    box.innerHTML = "";
    SERVICES.forEach((s) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "svc";
      radio(b, sel.svc === s.id);
      b.innerHTML = `<span class="ic" aria-hidden="true">${s.ic}</span><span class="n">${s.name}</span><span class="d">${s.dur} menit · ${s.desc}</span><span class="p">${rp(s.price)}</span>`;
      b.onclick = () => { sel.svc = s.id; afterSelect(); };
      box.appendChild(b);
    });
  }

  function avatar(b) { return `<span class="avatar" style="background:${b.color}" aria-hidden="true">${b.id === "any" ? "★" : b.name[0]}</span>`; }

  function renderBarbers() {
    const box = $("barbers");
    box.innerHTML = "";
    [ANY, ...BARBERS].forEach((br) => {
      const b = document.createElement("button");
      b.type = "button";
      b.className = "barber";
      b.dataset.barber = br.id;
      radio(b, sel.barber === br.id);
      b.innerHTML = `${avatar(br)}${br.name}<small>${br.note}</small>`;
      b.onclick = () => { sel.barber = br.id; afterSelect(); };
      box.appendChild(b);
    });
  }

  function dateChip(d, i, attr) {
    const b = document.createElement("button");
    b.type = "button";
    b.className = "date";
    b.dataset.date = dayKey(d);
    const dw = i === 0 ? "Hari ini" : i === 1 ? "Besok" : d.toLocaleDateString("id-ID", { weekday: "short" });
    b.innerHTML = `<span class="dw">${dw}</span><span class="dd">${d.getDate()}</span><span class="dm">${d.toLocaleDateString("id-ID", { month: "short" })}</span>`;
    if (attr === "radio") radio(b, false); else b.setAttribute("aria-pressed", "false");
    return b;
  }

  function renderDates() {
    const box = $("dates");
    box.innerHTML = "";
    days().forEach((d, i) => {
      const b = dateChip(d, i, "radio");
      b.setAttribute("aria-checked", String(sel.date === dayKey(d)));
      b.onclick = () => { sel.date = dayKey(d); afterSelect(); };
      box.appendChild(b);
    });
  }

  function renderSlots() {
    const box = $("slots");
    box.innerHTML = "";
    const dur = curDur();
    let free = 0;
    slotTimes(dur).forEach((t) => {
      const ok = freeBarbers(sel.barber, sel.date, t, dur).length > 0;
      if (!ok && sel.date === dayKey(new Date()) && t <= nowMin()) return; // hide past slots today
      const b = document.createElement("button");
      b.type = "button";
      b.className = "slot";
      b.textContent = hm(t);
      b.dataset.time = t;
      radio(b, sel.time === t);
      b.disabled = !ok;
      b.setAttribute("aria-label", `${hm(t)}${ok ? "" : ", penuh"}`);
      if (ok) free++;
      b.onclick = () => { sel.time = t; afterSelect(); };
      box.appendChild(b);
    });
    if (!box.children.length) box.innerHTML = `<p class="empty">Hari ini sudah tutup. Pilih tanggal lain ya.</p>`;
    const who = sel.barber === "any" ? "semua kapster" : barberById[sel.barber].name;
    $("slot-info").textContent = `${free} jam kosong untuk ${who} · durasi ${dur} menit`;
  }

  function renderBookBar() {
    const s = sel.svc && svcById[sel.svc];
    const ready = !!(s && sel.time != null);
    $("to-confirm").disabled = !ready;
    if (!s) { $("sum-title").textContent = "Pilih layanan dulu"; $("sum-sub").textContent = "Langkah 1 dari 3"; return; }
    $("sum-title").textContent = `${s.name} · ${rp(s.price)}`;
    $("sum-sub").textContent = ready
      ? `${shortDate(sel.date)} · ${hm(sel.time)}–${hm(sel.time + s.dur)} · ${barberById[sel.barber].name}`
      : "Pilih jam di langkah 3";
  }

  function afterSelect() {
    // Drop a chosen time that no longer fits the new service / barber / date
    if (sel.time != null && !freeBarbers(sel.barber, sel.date, sel.time, curDur()).length) sel.time = null;
    renderServices();
    renderBarbers();
    renderDates();
    renderSlots();
    renderBookBar();
  }

  // ---------- Sheets ----------
  let lastFocus = null;
  function open(id) {
    lastFocus = document.activeElement;
    $(id).hidden = false;
    const f = $(id).querySelector("input") || $(id).querySelector("button");
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

  function detailRows(b) {
    const s = svcById[b.svc];
    return `<dt>Layanan</dt><dd>${s.name}</dd>
      <dt>Tanggal</dt><dd>${longDate(b.date)}</dd>
      <dt>Jam</dt><dd>${hm(b.start)}–${hm(b.start + b.dur)}</dd>
      <dt>Kapster</dt><dd>${barberById[b.barber].name}</dd>
      <dt class="total">Bayar di tempat</dt><dd class="total">${rp(s.price)}</dd>`;
  }

  // ---------- Confirm + create ----------
  const cleanPhone = (v) => v.replace(/[\s\-.]/g, "");
  const validPhone = (v) => /^(\+62|62|0)8\d{7,11}$/.test(cleanPhone(v));

  $("to-confirm").onclick = () => {
    $("confirm-detail").innerHTML = detailRows({ svc: sel.svc, date: sel.date, start: sel.time, dur: curDur(), barber: sel.barber });
    $("f-err").textContent = "";
    ["f-name", "f-phone"].forEach((id) => $(id).removeAttribute("aria-invalid"));
    open("confirm-sheet");
  };

  $("confirm-form").addEventListener("submit", (e) => {
    e.preventDefault();
    const name = $("f-name").value.trim();
    const phone = $("f-phone").value.trim();
    const errs = [];
    $("f-name").setAttribute("aria-invalid", String(name.length < 2));
    $("f-phone").setAttribute("aria-invalid", String(!validPhone(phone)));
    if (name.length < 2) errs.push("Nama minimal 2 huruf.");
    if (!validPhone(phone)) errs.push("Nomor WA belum valid (contoh: 0812 3456 7890).");
    $("f-err").textContent = errs.join(" ");
    if (errs.length) { (name.length < 2 ? $("f-name") : $("f-phone")).focus(); return; }

    const dur = curDur();
    const barber = assignBarber(sel.date, sel.time, dur);
    if (!barber) { // someone took the slot in the meantime
      close("confirm-sheet");
      sel.time = null;
      afterSelect();
      demoToast("Yah, jam itu barusan terisi. Pilih jam lain ya.");
      return;
    }
    const b = { code: newCode(), date: sel.date, start: sel.time, dur, svc: sel.svc, barber, name, phone: cleanPhone(phone), note: $("f-note").value.trim(), status: "Menunggu", sample: false };
    store.bookings.push(b);
    save();
    track("app_booking", { layanan: svcById[b.svc].name, kapster: sel.barber === "any" ? "bebas" : barber });
    close("confirm-sheet");
    sel.time = null;
    afterSelect();
    showTicket(b);
  });

  function icsFor(b) {
    const s = svcById[b.svc];
    const at = (min) => { const d = dateOf(b.date); d.setHours(0, min, 0, 0); return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, ""); };
    return [
      "BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Bikinin Studio//Demo Booking Gentra//ID", "BEGIN:VEVENT",
      `UID:${b.code}@demo-booking-gentra`, `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")}`,
      `DTSTART:${at(b.start)}`, `DTEND:${at(b.start + b.dur)}`,
      `SUMMARY:${s.name} di Gentra Barbershop (demo)`,
      "LOCATION:Jl. Gentra No. 12\\, Bandung",
      `DESCRIPTION:Kode booking ${b.code}. Kapster: ${barberById[b.barber].name}. Bayar di tempat ${rp(s.price)}.`,
      "BEGIN:VALARM", "TRIGGER:-PT1H", "ACTION:DISPLAY", "DESCRIPTION:Booking Gentra 1 jam lagi", "END:VALARM",
      "END:VEVENT", "END:VCALENDAR"
    ].map(fold).join("\r\n");
  }
  // RFC 5545: content lines longer than 75 octets are folded (CRLF + one space)
  function fold(line) {
    const enc = new TextEncoder();
    const out = [];
    let cur = "";
    for (const ch of line) {
      if (enc.encode(cur + ch).length > (out.length ? 74 : 75)) { out.push(cur); cur = ""; }
      cur += ch;
    }
    out.push(cur);
    return out.join("\r\n ");
  }

  let icsUrl = null;
  function showTicket(b) {
    const s = svcById[b.svc];
    $("ticket").innerHTML = `
      <div class="lbl">KODE BOOKING</div>
      <div class="code" id="ticket-code">${esc(b.code)}</div>
      <div class="row"><span>Nama</span><b>${esc(b.name)}</b></div>
      <div class="row"><span>Layanan</span><b>${s.name}</b></div>
      <div class="row"><span>Waktu</span><b>${shortDate(b.date)} · ${hm(b.start)}</b></div>
      <div class="row"><span>Kapster</span><b>${barberById[b.barber].name}</b></div>
      <div class="row"><span>Bayar di tempat</span><b>${rp(s.price)}</b></div>
      <p class="note">Tunjukkan kode ini ke kasir. Datang 5 menit lebih awal ya.</p>`;
    if (icsUrl) URL.revokeObjectURL(icsUrl);
    icsUrl = URL.createObjectURL(new Blob([icsFor(b)], { type: "text/calendar" }));
    $("ics").href = icsUrl;
    $("ics").download = `booking-${b.code}.ics`;
    open("done-sheet");
  }

  // ---------- Jadwal (owner view) ----------
  function renderSchedule() {
    const dbox = $("sched-dates");
    dbox.innerHTML = "";
    days().forEach((d, i) => {
      const b = dateChip(d, i, "pressed");
      const key = dayKey(d);
      b.setAttribute("aria-pressed", String(key === schedDate));
      const n = store.bookings.filter((x) => x.date === key && active(x)).length;
      b.insertAdjacentHTML("beforeend", `<span class="cnt">${n} booking</span>`);
      b.onclick = () => { schedDate = key; renderSchedule(); };
      dbox.appendChild(b);
    });

    const cbox = $("sched-barbers");
    cbox.innerHTML = "";
    [{ id: "all", name: "Semua kapster" }, ...BARBERS].forEach((br) => {
      const b = document.createElement("button");
      b.type = "button";
      b.textContent = br.name;
      b.setAttribute("aria-pressed", String(schedBarber === br.id));
      b.onclick = () => { schedBarber = br.id; renderSchedule(); };
      cbox.appendChild(b);
    });

    const list = store.bookings
      .filter((b) => b.date === schedDate && (schedBarber === "all" || b.barber === schedBarber))
      .sort((a, b) => a.start - b.start || a.barber.localeCompare(b.barber));
    const act = list.filter(active);
    $("sched-sum").textContent = `${longDate(schedDate)} · ${act.length} booking · ${rp(act.reduce((s, b) => s + svcById[b.svc].price, 0))}`;
    const ul = $("agenda");
    ul.innerHTML = "";
    if (!list.length) ul.innerHTML = `<li class="empty">Belum ada booking.</li>`;
    list.forEach((b) => {
      const li = document.createElement("li");
      const br = barberById[b.barber];
      li.innerHTML = `<button type="button" class="${b.status === "Batal" ? "batal" : ""}" style="--c:${br.color}">
        <span class="tm">${hm(b.start)}<small>${hm(b.start + b.dur)}</small></span>
        <span class="who">${esc(b.name)}${b.sample ? `<span class="tag contoh">contoh</span>` : ""}</span>
        <span class="what">${svcById[b.svc].name} · ${br.name}</span>
        <span class="st"><span class="tag ${statusOf(b).toLowerCase()}">${statusOf(b)}</span></span></button>`;
      li.querySelector("button").dataset.code = b.code;
      li.querySelector("button").onclick = () => showDetail(b.code);
      ul.appendChild(li);
    });
  }

  function showDetail(code) {
    detailId = code;
    const b = store.bookings.find((x) => x.code === code);
    $("detail").innerHTML = `<dt>Kode</dt><dd>${esc(b.code)}</dd><dt>Nama</dt><dd>${esc(b.name)}</dd><dt>No. WA</dt><dd>${esc(b.phone)}</dd>
      ${b.note ? `<dt>Catatan</dt><dd>${esc(b.note)}</dd>` : ""}${detailRows(b)}
      <dt>Status</dt><dd><span class="tag ${statusOf(b).toLowerCase()}">${statusOf(b)}</span></dd>`;
    document.querySelectorAll("[data-status]").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.status === b.status)));
    if ($("detail-sheet").hidden) open("detail-sheet");
  }
  document.querySelectorAll("[data-status]").forEach((x) => (x.onclick = () => {
    const b = store.bookings.find((y) => y.code === detailId);
    if (!b || !STATUSES.includes(x.dataset.status)) return;
    if (x.dataset.status === "Batal" && b.status !== "Batal" && !window.confirm(`Batalkan booking ${b.code} atas nama ${b.name}? Jamnya jadi kosong lagi.`)) return;
    // Re-activating a cancelled booking must not double-book the barber
    if (b.status === "Batal" && x.dataset.status !== "Batal") {
      const taken = store.bookings.some((o) => o !== b && active(o) && o.barber === b.barber && o.date === b.date && b.start < o.start + o.dur && o.start < b.start + b.dur);
      if (taken) { demoToast(`Jam ${hm(b.start)} untuk ${barberById[b.barber].name} sudah terisi booking lain. Status tetap Batal.`); return; }
    }
    b.status = x.dataset.status;
    save();
    showDetail(b.code);
    renderSchedule();
    afterSelect();
    demoToast(`Status ${b.code}: ${b.status}`);
  }));

  // ---------- Ringkasan ----------
  function renderSummary() {
    const today = dayKey(new Date());
    const td = store.bookings.filter((b) => b.date === today);
    const act = td.filter(active);
    const week = store.bookings.filter(active);
    $("stats").innerHTML = `
      <div class="stat"><b>${rp(act.reduce((s, b) => s + svcById[b.svc].price, 0))}</b><span>Estimasi pendapatan hari ini</span></div>
      <div class="stat"><b>${act.length}</b><span>Booking hari ini</span></div>
      <div class="stat"><b>${td.filter((b) => b.status === "Selesai").length}</b><span>Sudah selesai</span></div>
      <div class="stat"><b>${td.filter((b) => b.status === "Batal").length}</b><span>Batal</span></div>
      <div class="stat"><b>${week.length}</b><span>Booking 7 hari</span></div>`;

    const span = CLOSE - OPEN;
    $("occ").innerHTML = BARBERS.map((br) => {
      const mins = act.filter((b) => b.barber === br.id).reduce((s, b) => s + b.dur, 0);
      const pc = Math.round((mins / span) * 100);
      return `<li><div class="lbl"><span>${br.name}</span><b>${pc}%</b></div><div class="track"><div class="fill" style="width:${pc}%;--c:${br.color}"></div></div></li>`;
    }).join("");

    const cnt = {};
    week.forEach((b) => (cnt[b.svc] = (cnt[b.svc] || 0) + 1));
    const top = Object.entries(cnt).sort((a, b) => b[1] - a[1]).slice(0, 5);
    const max = top.length ? top[0][1] : 1;
    $("top").innerHTML = top.map(([id, n]) => `<li><div class="lbl"><span>${svcById[id].name}</span><b>${n}</b></div><div class="track"><div class="fill" style="width:${(n / max) * 100}%"></div></div></li>`).join("") || `<li class="muted">Belum ada booking.</li>`;

    const per = days().map((d) => ({ d, n: week.filter((b) => b.date === dayKey(d)).length }));
    const pmax = Math.max(1, ...per.map((p) => p.n));
    $("week").innerHTML = per.map((p, i) => `<div class="col ${i === 0 ? "today" : ""}"><span class="v">${p.n}</span><div class="bar" style="height:${(p.n / pmax) * 100}%"></div><span class="h">${i === 0 ? "Ini" : p.d.toLocaleDateString("id-ID", { weekday: "short" })}</span></div>`).join("");
  }

  $("reset").onclick = () => {
    if (!window.confirm("Hapus semua booking di perangkat ini dan buat ulang data contoh?")) return;
    store = seed();
    save();
    sel.time = null;
    afterSelect();
    renderSummary();
    demoToast("Data demo sudah direset.");
  };

  // ---------- Tabs ----------
  function show(view) {
    ["booking", "jadwal", "ringkasan"].forEach((v) => ($(`view-${v}`).hidden = v !== view));
    document.querySelectorAll(".tabbar button").forEach((b) => {
      if (b.dataset.view === view) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
    });
    $("book-bar").hidden = view !== "booking";
    if (view === "booking") afterSelect();
    if (view === "jadwal") renderSchedule();
    if (view === "ringkasan") renderSummary();
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
  $("today").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long" });
  sel.date = days().map(dayKey).find((k) => freeCount(k) > 0) || dayKey(new Date());
  afterSelect();
})();
