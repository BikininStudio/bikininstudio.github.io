import * as THREE from './three.module.min.js';
export { THREE };

export const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

export function webglOK() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch (e) { return false; }
}

/* Siapkan renderer + kamera di dalam elemen. Render berhenti saat di luar layar. */
export function stage(host, { fov = 35, pos = [0, 0, 6] } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.set(...pos);
  const frame = [];
  let visible = true, raf = 0;
  const size = () => {
    const w = host.clientWidth || 1, h = host.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  new ResizeObserver(size).observe(host); size();
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) loop(); }).observe(host);
  const clock = new THREE.Clock();
  function loop() {
    cancelAnimationFrame(raf);
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05), t = clock.elapsedTime;
    frame.forEach(f => f(dt, t));
    renderer.render(scene, camera);
    raf = requestAnimationFrame(loop);
  }
  document.addEventListener('visibilitychange', loop);
  loop();
  return { renderer, scene, camera, onFrame: f => frame.push(f), canvas: renderer.domElement };
}

/* Putar objek dengan seret jari/mouse; kembalikan state kecepatan. */
export function drag(el, onMove) {
  let down = false, lx = 0, ly = 0;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', e => { down = true; lx = e.clientX; ly = e.clientY; el.setPointerCapture(e.pointerId); el.classList.add('grabbing'); });
  el.addEventListener('pointermove', e => { if (!down) return; onMove(e.clientX - lx, e.clientY - ly); lx = e.clientX; ly = e.clientY; });
  const up = () => { down = false; el.classList.remove('grabbing'); };
  el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
}

export const rp = n => 'Rp ' + n.toLocaleString('id-ID');
