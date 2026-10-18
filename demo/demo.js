// Adds the DEMO bar, tracks demo views/clicks, and offers demoToast() for fake actions.
(function () {
  const body = document.body;
  const slug = body.dataset.demo;
  const label = body.dataset.label;
  const fictional = body.dataset.fiktif !== "false";

  const bar = document.createElement("div");
  bar.className = "demo-bar";
  bar.innerHTML = `
    <a class="demo-back" href="../../#portofolio">← Bikinin Studio</a>
    <span class="demo-label"><b>DEMO</b>${fictional ? "Brand fiktif, " : ""}dibuat oleh Bikinin Studio</span>
    <a class="demo-cta" target="_blank" rel="noopener">Mau dibikinin kayak gini?</a>`;
  const cta = bar.querySelector(".demo-cta");
  cta.href = waLink(`Halo Bikinin Studio, saya lihat demo "${label}" dan mau dibikinin yang mirip.`, `demo: ${slug}`);
  cta.addEventListener("click", () => track("click_whatsapp", { lokasi: `demo:${slug}` }));
  body.prepend(bar);

  track("view_demo", { demo: slug });

  const toast = document.createElement("div");
  toast.className = "demo-toast";
  toast.setAttribute("role", "status");
  body.appendChild(toast);
  let timer;
  window.demoToast = function (msg) {
    toast.textContent = msg;
    toast.classList.add("show");
    clearTimeout(timer);
    timer = setTimeout(() => toast.classList.remove("show"), 3200);
  };
  document.querySelectorAll("[data-demo-action]").forEach((el) => {
    el.addEventListener(el.tagName === "FORM" ? "submit" : "click", (e) => {
      e.preventDefault();
      demoToast(el.dataset.demoAction || "Ini demo. Di versi asli, tombol ini langsung jalan.");
    });
  });
})();
