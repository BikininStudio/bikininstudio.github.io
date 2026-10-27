// Filter portofolio (kategori + label) dan "Muat lebih banyak".
(function () {
  var box = document.querySelector("[data-works]"); if (!box) return;
  var cards = [].slice.call(box.children);
  var empty = document.getElementById("works-empty"), more = document.getElementById("works-more");
  var cat = "all", lab = "", PAGE = 12, shown = PAGE;
  function apply() {
    var match = cards.filter(function (c) {
      var okC = cat === "all" || (cat === "demo" ? c.dataset.demo === "1" : c.dataset.cat === cat);
      return okC && (!lab || c.dataset.label === lab);
    });
    cards.forEach(function (c) { c.hidden = true; });
    match.forEach(function (c, i) { c.hidden = i >= shown; c.classList.add("in"); });
    empty.hidden = match.length > 0;
    more.hidden = match.length <= shown;
  }
  document.querySelector("[data-filters]").addEventListener("click", function (e) {
    var b = e.target.closest("button"); if (!b) return;
    shown = PAGE;
    if (b.dataset.fcat) { cat = b.dataset.fcat; [].forEach.call(document.querySelectorAll("[data-fcat]"), function (x) { x.setAttribute("aria-pressed", String(x === b)); }); }
    if (b.dataset.flab) { lab = lab === b.dataset.flab ? "" : b.dataset.flab; [].forEach.call(document.querySelectorAll("[data-flab]"), function (x) { x.setAttribute("aria-pressed", String(x.dataset.flab === lab)); }); }
    apply();
  });
  more.addEventListener("click", function () { shown += PAGE; apply(); });
  empty.querySelector("[data-reset]").addEventListener("click", function (e) {
    e.preventDefault(); cat = "all"; lab = "";
    [].forEach.call(document.querySelectorAll("[data-fcat]"), function (x) { x.setAttribute("aria-pressed", String(x.dataset.fcat === "all")); });
    [].forEach.call(document.querySelectorAll("[data-flab]"), function (x) { x.setAttribute("aria-pressed", "false"); });
    apply();
  });
  apply();
})();
