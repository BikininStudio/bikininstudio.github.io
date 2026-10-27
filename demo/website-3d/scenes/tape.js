// Chapter 2 · GgStore finger tape (karya sendiri): the roll turns (and can be dragged), shows its 4.5 cm width, unrolls a
// strip (5 m label) and takes any of the 12 shop colours.
// Object source: the roll is modelled in code. When a real 360° video of the product arrives, replace the roll/strip
// meshes with an image sequence (frames on a plane, picked by angle) and keep update() as the motion script.
import { seg, mix, canvasTexture, blobShadow } from "../../3d/scroll3d.js";

const PANELS = 4; // keep in sync with the .panel count in this chapter
const R = 1.35, RI = 0.98, RC = 0.88, W = 2.2; // outer / tape inner / core inner radius, tape width (4.5 cm)
const BEND = 1.1, ARC = (BEND * Math.PI) / 2; // radius and length of the strip's first bend

function fabric(THREE) {
  const tex = canvasTexture(THREE, 256, 256, (g, w, h) => {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, w, h);
    // woven look: fine cross lines + speckle
    g.strokeStyle = "rgba(0,0,0,.07)";
    g.lineWidth = 1;
    for (let i = 0; i < w; i += 4) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i + 2); g.lineTo(w, i + 2); g.stroke();
    }
    for (let i = 0; i < 1400; i++) {
      g.fillStyle = `rgba(0,0,0,${Math.random() * 0.06})`;
      g.fillRect(Math.random() * w, Math.random() * h, 2, 2);
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  return tex;
}

function rings(THREE) {
  return canvasTexture(THREE, 512, 512, (g, w) => {
    g.fillStyle = "#fff";
    g.fillRect(0, 0, w, w);
    g.strokeStyle = "rgba(0,0,0,.2)";
    for (let r = (RI / R) * 256; r < 256; r += 4.5) {
      g.lineWidth = 1 + Math.random();
      g.beginPath(); g.arc(256, 256, r, 0, Math.PI * 2); g.stroke();
    }
  });
}

// Text sprite for the measurement labels
function tag(THREE, text) {
  const tex = canvasTexture(THREE, 256, 96, (g, w, h) => {
    g.fillStyle = "#D3D0C9"; // kertas pelabel, sudut tegas
    g.fillRect(8, 12, w - 16, h - 24);
    g.fillStyle = "#1C1C1C";
    g.font = '800 44px "Hanken Grotesk", sans-serif';
    g.textAlign = "center"; g.textBaseline = "middle";
    g.fillText(text, w / 2, h / 2 + 2);
  });
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false }));
  s.scale.set(1.2, 0.45, 1);
  s.renderOrder = 2;
  return s;
}

function bar(THREE, len, vertical) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(vertical ? 0.025 : len, vertical ? len : 0.025, 0.025), new THREE.MeshBasicMaterial({ color: "#1C1C1C", transparent: true }));
  return m;
}
export async function create(THREE, ctx, chapter) {
  // RoomEnvironment is imported here, not at module top, so nothing pulls Three.js in the still-image mode
  const [{ RoomEnvironment }] = await Promise.all([import("../../3d/RoomEnvironment.js"), document.fonts.load('800 44px "Hanken Grotesk"')]);
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(ctx.renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.8;
  const key = new THREE.DirectionalLight("#ffffff", 1.4);
  key.position.set(-3, 6, 7);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  camera.position.set(0, 1.2, 12);
  camera.lookAt(0, 0, 0);

  const cloth = fabric(THREE);
  const tapeMat = new THREE.MeshStandardMaterial({ map: cloth, roughness: 0.92, metalness: 0, color: "#C9A27C", bumpMap: cloth, bumpScale: 2.2 });
  const sideMat = new THREE.MeshStandardMaterial({ map: rings(THREE), roughness: 0.95, metalness: 0, color: "#C9A27C" });
  const coreMat = new THREE.MeshStandardMaterial({ color: "#B88D5E", roughness: 0.85, side: THREE.DoubleSide });
  cloth.repeat.set(16, 5); // anyaman terlihat pada ukuran layar

  const world = new THREE.Group();
  scene.add(world);
  const holder = new THREE.Group(); // tilt + position; the strip hangs off this
  world.add(holder);
  const roll = new THREE.Group(); // spins as tape comes off (and when dragged)
  holder.add(roll);
  roll.add(new THREE.Mesh(new THREE.CylinderGeometry(R, R, W, 96, 1, true), tapeMat));
  for (const y of [W / 2, -W / 2]) {
    const side = new THREE.Mesh(new THREE.RingGeometry(RI, R, 96, 1), sideMat);
    side.rotation.x = y > 0 ? -Math.PI / 2 : Math.PI / 2;
    side.position.y = y;
    roll.add(side);
    const coreEdge = new THREE.Mesh(new THREE.RingGeometry(RC, RI, 64, 1), coreMat);
    coreEdge.rotation.x = side.rotation.x;
    coreEdge.position.y = y * 1.002;
    roll.add(coreEdge);
  }
  roll.add(new THREE.Mesh(new THREE.CylinderGeometry(RC, RC, W, 64, 1, true), coreMat));

  // Strip leaving the right side of the roll; vertices rebuilt every frame
  const SEG = 120;
  const stripGeo = new THREE.PlaneGeometry(1, W, SEG, 1);
  const strip = new THREE.Mesh(stripGeo, new THREE.MeshStandardMaterial({ map: cloth, roughness: 0.92, side: THREE.DoubleSide }));
  strip.material.color = tapeMat.color; // same Color object: colour changes follow automatically
  holder.add(strip);
  const pos = stripGeo.attributes.position, uv = stripGeo.attributes.uv;

  // alas potong 1 cm: ukuran 4,5 cm terbaca dari alasnya
  const matTex = canvasTexture(THREE, 1024, 512, (g, w, h) => {
    g.fillStyle = "#6F7F6A"; g.fillRect(0, 0, w, h);
    g.strokeStyle = "rgba(244,239,232,.35)"; g.lineWidth = 2; g.fillStyle = "rgba(244,239,232,.75)"; g.font = '600 20px "Hanken Grotesk", sans-serif';
    for (let i = 0; i <= 32; i++) { g.beginPath(); g.moveTo(i * 32, 0); g.lineTo(i * 32, h); g.stroke(); if (i % 2 === 0 && i < 32) g.fillText(String(i / 2), i * 32 + 6, h - 10); }
    for (let j = 0; j <= 16; j++) { g.beginPath(); g.moveTo(0, j * 32); g.lineTo(w, j * 32); g.stroke(); }
  });
  const cutMat = new THREE.Mesh(new THREE.PlaneGeometry(12, 6), new THREE.MeshStandardMaterial({ map: matTex, roughness: 0.9 }));
  cutMat.rotation.x = -Math.PI / 2; cutMat.position.set(1.2, -W / 2 - 0.42, 0.8);
  world.add(cutMat);
  const shadow = blobShadow(THREE, 4.2, 0.4);
  shadow.position.y = -W / 2 - 0.55;
  world.add(shadow);

  // Measurement marks
  const wBar = bar(THREE, W, true), wTag = tag(THREE, "4,5 cm");
  wBar.position.set(-R - 0.35, 0, 0);
  wTag.position.set(-R - 1.05, 0, 0);
  holder.add(wBar, wTag);
  const lBar = bar(THREE, 1, false), lTag = tag(THREE, "5 m");
  holder.add(lBar, lTag);

  // Colour chips (last panel of this chapter)
  const target = new THREE.Color("#C9A27C");
  const name = chapter.querySelector("[data-warna-nama]");
  const chips = [...chapter.querySelectorAll("[data-warna]")];
  chips.forEach((b) => {
    b.addEventListener("click", () => {
      chips.forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      target.set(b.dataset.warna);
      if (name) name.textContent = b.title;
      if (typeof track === "function") track("demo_pilih_warna", { warna: b.title });
      ctx.invalidate();
    });
  });

  let aspect = 1;
  return {
    scene, camera,
    resize(w, h) {
      aspect = w / h;
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    },
    update(p, dt, time) {
      const s = p * (PANELS - 1);
      const portrait = aspect < 0.9;
      const viewW = 2 * camera.position.z * Math.tan((camera.fov * Math.PI) / 360) * aspect;
      const show = seg(s, 0.3, 1) * (1 - seg(s, 1.2, 1.8)); // width mark
      const unroll = seg(s, 1.2, 2) * (1 - 0.45 * seg(s, 2.2, 3));
      const scale = portrait ? mix(0.6, 0.5, unroll) : 1;
      const half = viewW / 2 / scale; // half the visible width, in the roll's units
      const base = portrait ? 0 : Math.min(2.3, viewW * 0.22);
      const left = portrait ? -half * 0.86 + R : 0.55; // roll position while unrolled (clear of the text)
      // the strip runs nearer the camera than the roll, so it looks larger: keep its end well inside the edge
      const straight = Math.max(0.5, half * (portrait ? 0.72 : 0.84) - (left + R + BEND));

      world.scale.setScalar(scale);
      world.position.y = portrait ? 1.5 : 0;
      world.rotation.y = ctx.pointer.x * 0.16;
      holder.position.x = mix(base, left, unroll);
      holder.rotation.x = mix(0.32, 0.8, show) - 0.2 * unroll + ctx.pointer.y * 0.06;
      holder.rotation.z = -0.08 * (1 - unroll);
      shadow.position.x = holder.position.x;

      const L = (ARC + straight) * unroll;
      roll.rotation.y = seg(s, 0, 1) * Math.PI * 2 - L / R + time * 0.15 * (1 - unroll) + ctx.spin;

      // strip: peels off the right side towards the viewer, bends 90°, then runs right with a soft wave
      let endX = 0, endZ = 0;
      for (let i = 0; i <= SEG; i++) {
        const d = (i / SEG) * L;
        let x, z;
        if (d <= ARC) {
          const a = Math.PI - d / BEND;
          x = R + BEND + Math.cos(a) * BEND;
          z = Math.sin(a) * BEND;
        } else {
          x = R + BEND + (d - ARC);
          z = BEND + Math.sin((d - ARC) * 1.6 - time * 1.4) * 0.1 * Math.min(1, (d - ARC) / 1.2);
        }
        if (i === SEG) { endX = x; endZ = z; }
        for (let j = 0; j < 2; j++) {
          const k = j * (SEG + 1) + i;
          pos.setXYZ(k, x, (j === 0 ? 1 : -1) * W / 2, z);
          uv.setXY(k, d * 0.85, j === 0 ? 1 : 0);
        }
      }
      pos.needsUpdate = uv.needsUpdate = true;
      stripGeo.computeVertexNormals();
      stripGeo.computeBoundingSphere();
      strip.visible = L > 0.02;

      const lenShow = seg(s, 1.6, 2) * (1 - seg(s, 2.3, 2.8));
      const from = R + BEND, span = Math.max(0.001, endX - from);
      lBar.scale.x = span;
      lBar.position.set(from + span / 2, W / 2 + 0.35, endZ);
      lTag.position.set(from + span / 2, W / 2 + 0.8, endZ);
      [wBar, wTag].forEach((m) => (m.material.opacity = show));
      [lBar, lTag].forEach((m) => (m.material.opacity = lenShow));

      tapeMat.color.lerp(target, Math.min(1, dt * 8));
      sideMat.color.copy(tapeMat.color);
      return true;
    },
  };
}
