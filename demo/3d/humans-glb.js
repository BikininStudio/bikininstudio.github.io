// Tokoh GLB (dibuat lewat skrip Blender di _tools/blender): badan berkulit rig, pakaian berlapis, tangan berjari, wajah bertekstur,
// animasi idle/walk/sit/talk/write/phone/photo/look. API sengaja sama dengan humans.js (person, life, walkPhase, rest, arms, walk)
// supaya world.js dan scene.js bisa memakai keduanya. Skrip yang menulis u.arms[i].rotation.x (kampus) tetap bekerja:
// sudut itu diterapkan langsung ke tulang lengan (arms[0] = lengan kanan tokoh, arms[1] = lengan kiri, seperti humans.js).
// createGlbHumans mengembalikan null bila berkas tidak termuat; pemanggil lalu memakai tokoh prosedural.
const ALL = ["siswa_l", "siswi_p", "siswi_h", "guru_l", "petugas_l", "pengunjung_p"];

export async function createGlbHumans(THREE, { small = false, base, shadow = false, models = ALL } = {}) {
  let gltfs, SU;
  try {
    const [{ GLTFLoader }, SUm] = await Promise.all([import("./GLTFLoader.js"), import("./SkeletonUtils.js")]);
    SU = SUm;
    const loader = new GLTFLoader();
    gltfs = await Promise.all(models.map((m) => loader.loadAsync(new URL(m + ".glb", base).href)));
  } catch (e) { console.warn("tokoh GLB gagal dimuat, memakai tokoh prosedural", e); return null; }
  const byName = Object.fromEntries(models.map((m, i) => [m, gltfs[i]]));
  // rotasi istirahat tulang lengan di ruang model (untuk menerapkan sudut dari skrip luar)
  const AX = new THREE.Vector3(1, 0, 0), AZ = new THREE.Vector3(0, 0, -1);   // flex (sumbu X Blender) dan adduksi (sumbu Y Blender -> -Z glTF)
  const qx = new THREE.Quaternion(), qy = new THREE.Quaternion(), D = new THREE.Quaternion(), M = new THREE.Quaternion(), Ri = new THREE.Quaternion();
  if (small) gltfs.forEach((g) => g.scene.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    o.material = new THREE.MeshLambertMaterial({ color: m.color, map: m.map, vertexColors: m.vertexColors, side: m.side, name: m.name });
  }));
  let counter = 0, blobTex = null;
  const blobGeo = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2);
  const blobMat = () => {
    if (!blobTex) { const c = document.createElement("canvas"); c.width = c.height = 64; const x = c.getContext("2d"), gr = x.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, "rgba(0,0,0,.5)"); gr.addColorStop(0.6, "rgba(0,0,0,.2)"); gr.addColorStop(1, "rgba(0,0,0,0)"); x.fillStyle = gr; x.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c); }
    return new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  };
  const has = (k) => byName[k];
  const pick = (opts) => {
    if (opts.vest && has("petugas_l")) return "petugas_l";
    if (opts.hairStyle === "hijab" && has("siswi_h")) return "siswi_h";
    if (opts.hairStyle === "long" && has("siswi_p")) return "siswi_p";
    const pool = ["siswa_l", "guru_l", "pengunjung_p"].filter(has);
    return pool.length ? pool[counter++ % pool.length] : models[0];
  };
  const recolor = (model, name, color) => model.traverse((o) => { if (o.isMesh && o.material && o.material.name === name) { if (!o.userData.own) { o.material = o.material.clone(); o.userData.own = true; } o.material.color.set(color); } });
  function boneInfo(model, name) {
    const b = model.getObjectByName(name); if (!b) return null;
    const rest = new THREE.Quaternion(); b.getWorldQuaternion(rest);
    return { b, rest, local: b.quaternion.clone() };
  }
  function person(shirt, opts = {}, rnd = Math.random) {
    const key = pick(opts), src = byName[key];
    const model = SU.clone(src.scene);
    const g = new THREE.Group(); g.add(model);
    if (shirt) recolor(model, "Shirt", shirt);
    if (opts.legs) recolor(model, "Trousers", Array.isArray(opts.legs) ? opts.legs[0] : opts.legs);
    if (opts.hair && key !== "siswi_h") recolor(model, "Hair", opts.hair);
    if (typeof opts.vest === "string") recolor(model, "Vest", opts.vest);
    let lids = null;
    model.traverse((o) => { if (o.isMesh) { o.frustumCulled = false; o.castShadow = shadow && o.name !== "Lids"; if (o.name === "Lids") { lids = o; o.visible = false; } } });
    model.updateMatrixWorld(true);
    const bones = { r: boneInfo(model, "RightArm"), l: boneInfo(model, "LeftArm"), rf: boneInfo(model, "RightForeArm"), lf: boneInfo(model, "LeftForeArm") };
    const mixer = new THREE.AnimationMixer(model);
    const actions = {};
    src.animations.forEach((c) => { actions[c.name] = mixer.clipAction(c); });
    const u = g.userData = {
      glb: true, ph: rnd() * 6.28, mixer, actions, cur: null, want: opts.sit ? "sit" : "idle", ts: 1, lastT: null, lids, phone: null, flash: null, sit: !!opts.sit,
      bones, arms: [{ rotation: { x: NaN } }, { rotation: { x: NaN } }],
    };
    if (opts.phone) {
      const hand = model.getObjectByName("RightHand");
      if (hand) {
        const ph = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.003, 0.14), new THREE.MeshBasicMaterial({ color: "#1B2028" })); ph.position.set(0, 0.075, 0.0); ph.visible = false; hand.add(ph);
        const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: "#FFFFFF" })); fl.position.set(0, 0.12, 0.05); fl.visible = false; hand.add(fl);
        u.phone = ph; u.flash = fl;
      }
    }
    const blob = new THREE.Mesh(blobGeo, blobMat()); blob.position.y = 0.012; blob.renderOrder = 1; g.add(blob);
    play(g, u.want, 0);
    if (u.cur) u.cur.time = rnd() * u.cur.getClip().duration;
    return g;
  }
  function play(g, name, fade = 0.3) {
    const u = g.userData, a = u.actions[name]; if (!a) return;
    if (u.cur === a) return;
    a.reset().setEffectiveWeight(1).play();
    if (u.cur) u.cur.crossFadeTo(a, fade, false);
    u.cur = a; u.curName = name;
  }
  // sudut dari skrip luar: lengan hanya fleksi (rotasi X), disertai adduksi santai dan siku otomatis seperti humans.js
  function setBone(info, flex, adduct) {
    qy.setFromAxisAngle(AZ, adduct); qx.setFromAxisAngle(AX, flex); D.copy(qx).multiply(qy);
    Ri.copy(info.rest).invert(); M.copy(Ri).multiply(D).multiply(info.rest);
    info.b.quaternion.copy(info.local).multiply(M);
  }
  function applyArms(u) {
    const a0 = u.arms[0].rotation.x, a1 = u.arms[1].rotation.x;
    if (Number.isNaN(a0) && Number.isNaN(a1)) return;
    const R = Number.isNaN(a0) ? 0.1 : a0, L = Number.isNaN(a1) ? 0.1 : a1, B = u.bones;
    if (B.r) { setBone(B.r, R, -0.3); if (B.rf) setBone(B.rf, -(0.22 + Math.max(0, -R - 0.6) * 0.7), 0); }
    if (B.l) { setBone(B.l, L, 0.3); if (B.lf) setBone(B.lf, -(0.22 + Math.max(0, -L - 0.6) * 0.7), 0); }
    u.arms[0].rotation.x = NaN; u.arms[1].rotation.x = NaN;
  }
  function life(g, time) {
    const u = g.userData; if (!u.glb) return;
    const dt = u.lastT === null ? 0 : Math.min(0.1, Math.max(0, time - u.lastT)); u.lastT = time;
    if (u.want !== u.curName) play(g, u.want);
    if (u.cur) u.cur.timeScale = u.curName === "walk" ? u.ts : 1;
    u.mixer.update(dt);
    applyArms(u);
    if (u.lids) { const t = (time * 0.5 + u.ph) % 4; u.lids.visible = t < 0.12; }
    u.want = u.sit ? "sit" : "idle"; u.ts = 1;
  }
  const walkPhase = (g, phase, amp) => { const u = g.userData; u.want = "walk"; u.ts = Math.max(0.35, Math.min(1.3, amp * 1.15)); };
  const rest = (g) => { const u = g.userData; u.want = u.sit ? "sit" : "idle"; };
  const arms = (g, a0, a1) => {
    const u = g.userData;
    if (a0 < -1.5 && a1 < -1.5) u.want = "photo";
    else if (a0 < -1.0 && a1 < -0.5) u.want = "write";
    else if (a0 < -0.5 && a1 > -0.3) u.want = "talk";
    else if (u.sit && a1 < -0.7) u.want = "sit";
  };
  const walk = (g, sp, amp) => { const u = g.userData; u.want = "walk"; u.ts = Math.max(0.5, Math.min(1.6, (sp * amp) / 4)); };
  return { person, life, walkPhase, rest, arms, walk, glb: true };
}
