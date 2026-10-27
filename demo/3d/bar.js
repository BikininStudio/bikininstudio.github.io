// Ukur tinggi pita demo (bisa 2-3 baris di HP) agar panggung 3D mulai dari tepi atas layar dan panel pertama muat satu layar.
const bar = document.querySelector(".demo-bar");
if (bar) {
  const set = () => document.documentElement.style.setProperty("--bar", bar.offsetHeight + "px");
  set();
  new ResizeObserver(set).observe(bar);
}
