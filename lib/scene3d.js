import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { mergeBufferGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";

// Chizmadan olingan qavat (scripts/plans.py → *.3d.json): devorlar, derazalar, eshiklar,
// har xonaning o'z joyi va turi. Pol, mebel va yorug'lik shu ma'lumotdan quriladi.
const T = THREE;
const H = 2.5, SILL = 0.85, HEAD = 2.1, LOW = 1.05;
const KIND = { m: "liv", y: "liv", b: "liv", o: "kit", d: "hall", k: "hall", z: "hall", v: "wet", s: "wet", vs: "wet", bl: "out", t: "out" };
const FLOOR = { liv: "parq", hall: "oak", kit: "stone", wet: "tile", out: "deck", common: "terr" };
export const RN = { d: "Dahliz", o: "Oshxona", m: "Mehmonxona", y: "Yotoqxona", b: "Bolalar xonasi", v: "Vanna", s: "Hojatxona", vs: "Vanna va hojatxona", k: "Omborxona", z: "Zinapoya", bl: "Balkon", t: "Terrasa" };

let MAT = null, TEX = null;
function initMats(maxAniso) {
  if (MAT) return;
  const m = (c, o) => new T.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...(o || {}) });
  MAT = {
    wall: m(0xf2eee6, { roughness: 0.92 }), cap: m(0x1f2a28, { roughness: 0.6 }), low: m(0xece7dc, { roughness: 0.85 }),
    slab: m(0xd6d1c6, { roughness: 0.95 }), frame: m(0x30363a, { roughness: 0.45, metalness: 0.4 }),
    glass: new T.MeshStandardMaterial({ color: 0x9cc9de, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.3, depthWrite: false }),
    white: m(0xf7f7f5, { roughness: 0.45 }), wood: m(0x5c4030, { roughness: 0.6 }), woodL: m(0xb08a62, { roughness: 0.6 }),
    dark: m(0x2b2f34, { roughness: 0.55 }), cab: m(0x3f4a48, { roughness: 0.5 }), marble: m(0xefece7, { roughness: 0.2 }),
    fab: m(0x8f97a0, { roughness: 0.95 }), fabD: m(0x5a6169, { roughness: 0.95 }), blanket: m(0xb39a7c, { roughness: 1 }),
    rug: m(0xddd3c2, { roughness: 1 }), rug2: m(0xc3cbd0, { roughness: 1 }),
    green: m(0x4b8a38, { roughness: 0.8, flatShading: true }), green2: m(0x2f6b2c, { roughness: 0.8, flatShading: true }),
    pot: m(0xd5cfc5, { roughness: 0.8 }), metal: m(0x23262a, { roughness: 0.4, metalness: 0.5 }), chrome: m(0xb7bcc2, { roughness: 0.2, metalness: 0.8 }),
    black: m(0x111214, { roughness: 0.3 }), water: m(0xcfe3ec, { roughness: 0.1 }),
  };
  const canvasTex = (draw) => {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    draw(c.getContext("2d"), 512);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = maxAniso;
    return t;
  };
  const rnd = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
  const planks = (seed, base, a, b, n) => (x, S) => {
    const r = rnd(seed); x.fillStyle = base; x.fillRect(0, 0, S, S);
    const ph = S / n;
    for (let j = 0; j < n; j++) {
      let off = -r() * S;
      while (off < S) {
        const len = S * (0.45 + r() * 0.5), t = r();
        x.fillStyle = `rgb(${(a[0] + t * b[0]) | 0},${(a[1] + t * b[1]) | 0},${(a[2] + t * b[2]) | 0})`;
        x.fillRect(off + 1, j * ph + 1, len - 2, ph - 2);
        x.fillRect(off + 1 - S, j * ph + 1, len - 2, ph - 2);
        off += len;
      }
    }
  };
  TEX = {
    // tex.s — bitta takror necha metr
    parq: Object.assign(canvasTex((x, S) => {
      const r = rnd(11); x.fillStyle = "#6e4e33"; x.fillRect(0, 0, S, S);
      const cw = 64, pw = S / (Math.SQRT2 * 20), L = cw * 1.6;
      for (let c = 0; c < S / cw; c++) {
        x.save(); x.beginPath(); x.rect(c * cw, 0, cw, S); x.clip(); x.translate(c * cw + cw / 2, S / 2); x.rotate(((c % 2) ? 1 : -1) * Math.PI / 4);
        for (let i = -30; i < 30; i++) for (let k = -8; k < 8; k++) {
          const t = r(); x.fillStyle = `rgb(${(170 + t * 26) | 0},${(126 + t * 22) | 0},${(86 + t * 16) | 0})`;
          x.fillRect(k * L + (i % 2 ? L / 2 : 0), i * pw, L - 1.5, pw - 1.5);
        }
        x.restore();
      }
    }), { s: 1.6 }),
    oak: Object.assign(canvasTex(planks(7, "#7a5a3c", [178, 140, 98], [24, 20, 14], 8)), { s: 1.8 }),
    deck: Object.assign(canvasTex(planks(9, "#4a3828", [128, 96, 68], [24, 18, 12], 12)), { s: 2 }),
    tile: Object.assign(canvasTex((x, S) => { const r = rnd(5); x.fillStyle = "#b9bbb7"; x.fillRect(0, 0, S, S); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const t = r(); x.fillStyle = `rgb(${(214 + t * 10) | 0},${(216 + t * 10) | 0},${(213 + t * 10) | 0})`; x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); } }), { s: 1.2 }),
    stone: Object.assign(canvasTex((x, S) => { const r = rnd(3); x.fillStyle = "#a89c8a"; x.fillRect(0, 0, S, S); for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) { const t = r(); x.fillStyle = `rgb(${(200 + t * 14) | 0},${(190 + t * 12) | 0},${(174 + t * 10) | 0})`; x.fillRect(i * 256 + 2, j * 128 + 2, 252, 124); } }), { s: 1.8 }),
    terr: Object.assign(canvasTex((x, S) => { const r = rnd(13); x.fillStyle = "#d8d4cc"; x.fillRect(0, 0, S, S); for (let i = 0; i < 2600; i++) { const t = r(); x.fillStyle = `rgba(${(120 + t * 90) | 0},${(116 + t * 86) | 0},${(108 + t * 80) | 0},.5)`; x.fillRect(r() * S, r() * S, 2 + r() * 3, 2 + r() * 3); } x.strokeStyle = "rgba(0,0,0,.12)"; x.lineWidth = 2; x.strokeRect(0, 0, S, S); }), { s: 2.4 }),
  };
  Object.entries(FLOOR).forEach(([k, t]) => { MAT["fl_" + k] = new T.MeshStandardMaterial({ map: TEX[t], roughness: k === "wet" || k === "kit" ? 0.35 : 0.7 }); });
}

// ---------- mebel (xona to'rtburchagi bo'yicha) ----------
function B(g, w, h, d, m, x, y, z) { const me = new T.Mesh(new T.BoxGeometry(w, h, d), m); me.position.set(x, y + h / 2, z); g.add(me); return me; }
function C(g, r, h, m, x, y, z) { const me = new T.Mesh(new T.CylinderGeometry(r, r, h, 20), m); me.position.set(x, y + h / 2, z); g.add(me); return me; }
function plant(g, x, z, s = 1) {
  C(g, 0.17 * s, 0.34 * s, MAT.pot, x, 0, z);
  const l = new T.Mesh(new T.IcosahedronGeometry(0.32 * s, 0), MAT.green); l.position.set(x, 0.62 * s, z); g.add(l);
  const l2 = new T.Mesh(new T.IcosahedronGeometry(0.22 * s, 0), MAT.green2); l2.position.set(x + 0.1 * s, 0.86 * s, z - 0.05 * s); g.add(l2);
}
function chair(g, x, z, ry) { const c = new T.Group(); c.position.set(x, 0, z); c.rotation.y = ry; B(c, 0.44, 0.44, 0.44, MAT.dark, 0, 0, 0); B(c, 0.44, 0.46, 0.06, MAT.dark, 0, 0.44, 0.2); g.add(c); }
function dining(g, cx, cz, len) {
  B(g, len, 0.05, 0.95, MAT.wood, cx, 0.72, cz); B(g, 0.08, 0.72, 0.7, MAT.metal, cx - len / 2 + 0.25, 0, cz); B(g, 0.08, 0.72, 0.7, MAT.metal, cx + len / 2 - 0.25, 0, cz);
  const n = Math.max(1, Math.floor(len / 0.62));
  for (let i = 0; i < n; i++) { const x = cx - len / 2 + ((i + 0.5) * len) / n; chair(g, x, cz - 0.78, Math.PI); chair(g, x, cz + 0.78, 0); }
}
function sofa(g, x, z, len) {
  const s = new T.Group(); s.position.set(x, 0, z);
  B(s, len, 0.42, 0.9, MAT.fab, 0, 0, 0); B(s, len, 0.4, 0.22, MAT.fab, 0, 0.42, 0.34);
  B(s, 0.18, 0.62, 0.9, MAT.fabD, -len / 2 + 0.09, 0, 0); B(s, 0.18, 0.62, 0.9, MAT.fabD, len / 2 - 0.09, 0, 0);
  B(s, 0.4, 0.3, 0.12, MAT.white, -len / 4, 0.42, 0.18); g.add(s);
}
function furnish(g, r) {
  const lw = Math.max(r.w, r.d), ld = Math.min(r.w, r.d), t = r.t, a = r.a || r.w * r.d;
  if (ld < 0.9) return;
  const f = new T.Group(); f.position.set(r.x + r.w / 2, 0, r.z + r.d / 2); if (r.d > r.w) f.rotation.y = Math.PI / 2; g.add(f);
  const bz = -ld / 2, fz = ld / 2;
  if (t === "y" && ld >= 2.2) {
    let bw = Math.min(1.8, lw - 1.4), bl = Math.min(2.05, ld - 0.8);
    if (bw < 1.2 || bl < 1.6) { bw = Math.min(1.4, lw - 0.4); bl = Math.min(1.95, ld - 0.35); }
    const ward = lw - bw > 2.5, bx = ward ? -0.4 : 0, zb = bz + bl / 2 + 0.08;
    B(f, bw + 1.0, 0.012, 1.7, MAT.rug2, bx, 0, zb + bl * 0.25);
    B(f, bw + 0.3, 0.95, 0.08, MAT.fabD, bx, 0, bz + 0.05); B(f, bw + 0.08, 0.32, bl, MAT.wood, bx, 0, zb); B(f, bw - 0.04, 0.2, bl - 0.1, MAT.white, bx, 0.32, zb + 0.03);
    B(f, bw, 0.06, bl * 0.55, MAT.blanket, bx, 0.5, zb + bl * 0.22);
    B(f, bw / 2 - 0.12, 0.12, 0.34, MAT.white, bx - bw / 4, 0.52, zb - bl / 2 + 0.3); B(f, bw / 2 - 0.12, 0.12, 0.34, MAT.white, bx + bw / 4, 0.52, zb - bl / 2 + 0.3);
    if (lw - bw > 1.2) { B(f, 0.42, 0.45, 0.4, MAT.woodL, bx - bw / 2 - 0.3, 0, bz + 0.26); B(f, 0.42, 0.45, 0.4, MAT.woodL, bx + bw / 2 + 0.3, 0, bz + 0.26); }
    if (ward) B(f, 0.6, 2.0, Math.min(2.2, ld - 0.5), MAT.white, lw / 2 - 0.33, 0, 0);
  } else if (t === "b" && ld >= 2) {
    const bl = Math.min(2, ld - 0.4);
    B(f, 0.95, 0.32, bl, MAT.woodL, -lw / 2 + 0.55, 0, bz + bl / 2 + 0.05); B(f, 0.88, 0.18, bl - 0.1, MAT.white, -lw / 2 + 0.55, 0.32, bz + bl / 2 + 0.08); B(f, 0.9, 0.05, bl * 0.5, MAT.rug2, -lw / 2 + 0.55, 0.5, bz + bl * 0.68);
    if (lw > 2.6) { B(f, 1.2, 0.74, 0.6, MAT.woodL, lw / 2 - 0.75, 0, bz + 0.32); chair(f, lw / 2 - 0.75, bz + 0.85, 0); }
    B(f, 1.6, 0.012, 1.4, MAT.rug, 0.2, 0, 0.2);
  } else if (t === "m" && ld >= 2.4) {
    if (a >= 24 && lw >= 5.2) {
      const dl = Math.min(3.1, lw * 0.45), dx = -lw / 2 + dl / 2 + 0.75;
      dining(f, dx, 0, dl); B(f, dl + 1.4, 0.012, 2.4, MAT.rug, dx, 0, 0);
      const cx = lw / 4 + 0.1, sl = Math.min(2.4, lw * 0.38);
      B(f, 2.6, 0.012, 2.0, MAT.rug2, cx, 0, fz - 1.35); sofa(f, cx, fz - 0.52, sl); B(f, 1.0, 0.36, 0.55, MAT.woodL, cx, 0, fz - 1.6); B(f, 1.8, 0.48, 0.38, MAT.dark, cx, 0, bz + 0.22); plant(f, lw / 2 - 0.35, bz + 0.35, 1);
    } else {
      const sl = Math.min(2.4, lw - 0.9);
      B(f, Math.min(2.8, lw - 0.4), 0.012, Math.min(2.2, ld - 0.5), MAT.rug, 0, 0, ld > 2.8 ? 0.2 : 0); sofa(f, 0, fz - 0.52, sl);
      if (ld >= 2.8) { B(f, 1.0, 0.36, 0.55, MAT.woodL, 0, 0, fz - 1.55); B(f, Math.min(1.8, lw - 0.6), 0.48, 0.38, MAT.dark, 0, 0, bz + 0.22); }
      if (lw - sl > 1.3) plant(f, -lw / 2 + 0.35, fz - 0.4, 1);
    }
  } else if (t === "o" && ld >= 1.8) {
    const cl = lw - 1.05, cx0 = (-lw / 2 + 0.85 + lw / 2 - 0.2) / 2;
    B(f, 0.7, 2.0, 0.66, MAT.white, -lw / 2 + 0.45, 0, bz + 0.35);
    B(f, cl, 0.86, 0.62, MAT.cab, cx0, 0, bz + 0.32); B(f, cl + 0.02, 0.04, 0.64, MAT.marble, cx0, 0.86, bz + 0.33);
    B(f, cl, 0.7, 0.36, MAT.cab, cx0, 1.45, bz + 0.18);
    B(f, 0.58, 0.012, 0.48, MAT.black, cx0 + cl / 4, 0.9, bz + 0.33); B(f, 0.5, 0.012, 0.38, MAT.chrome, cx0 - cl / 4, 0.9, bz + 0.33);
    if (ld >= 3.2 && lw >= 3) { const ll = ld * 0.42; B(f, 0.62, 0.86, ll, MAT.cab, lw / 2 - 0.33, 0, bz + 0.64 + ll / 2); B(f, 0.64, 0.04, ll, MAT.marble, lw / 2 - 0.33, 0.86, bz + 0.64 + ll / 2); }
    if (ld >= 2.9) { const tl = Math.min(1.7, lw * 0.42); dining(f, -lw * 0.08, bz + 0.62 + (ld - 0.62) / 2 + 0.05, tl); }
  } else if (t === "d") {
    if (ld >= 1.3) { const wl = Math.min(2.4, lw * 0.5); B(f, wl, 2.0, 0.5, MAT.white, -lw / 2 + wl / 2 + 0.1, 0, bz + 0.27); }
    B(f, lw * 0.6, 0.012, Math.min(0.9, ld * 0.4), MAT.rug, 0.1, 0, ld > 1.6 ? ld * 0.12 : 0);
    if (lw > 2.4 && ld > 1.4) plant(f, lw / 2 - 0.3, fz - 0.3, 0.8);
  } else if (t === "v" || t === "s" || t === "vs") {
    const tub = (t === "v" && lw >= 1.55) || (t === "vs" && lw >= 2.3);
    if (tub) { B(f, 1.55, 0.55, 0.72, MAT.white, -lw / 2 + 0.82, 0, bz + 0.38); B(f, 1.35, 0.012, 0.52, MAT.water, -lw / 2 + 0.82, 0.55, bz + 0.38); }
    else if (t === "vs") { B(f, 0.85, 0.06, 0.85, MAT.white, -lw / 2 + 0.47, 0, bz + 0.47); B(f, 0.02, 1.9, 0.85, MAT.glass, -lw / 2 + 0.92, 0.06, bz + 0.47); }
    if (t !== "v") { const tx = t === "s" ? -lw / 2 + 0.35 : lw / 2 - 0.4; B(f, 0.4, 0.75, 0.18, MAT.white, tx, 0, bz + 0.1); C(f, 0.19, 0.4, MAT.white, tx, 0, bz + 0.42); }
    if ((t === "v" && ld >= 1.3) || (t === "s" && lw >= 1.35) || (t === "vs" && lw >= 2.6)) {
      const sx = t === "vs" ? 0.1 : lw / 2 - 0.35, sz = t === "v" ? fz - 0.24 : bz + 0.24;
      B(f, 0.55, 0.82, 0.42, MAT.cab, sx, 0, sz); B(f, 0.5, 0.04, 0.4, MAT.white, sx, 0.82, sz);
    }
  } else if (t === "k") { B(f, lw - 0.2, 2.0, 0.4, MAT.woodL, 0, 0, bz + 0.22); }
  else if (t === "bl" || t === "t") {
    plant(f, -lw / 2 + 0.35, 0, 1); if (lw > 2.4) plant(f, lw / 2 - 0.35, 0, 0.85);
    if (a > 10 && ld >= 2) {
      B(f, 0.75, 0.32, 1.7, MAT.white, -0.6, 0, 0); B(f, 0.7, 0.08, 1.5, MAT.fab, -0.6, 0.32, 0);
      B(f, 0.75, 0.32, 1.7, MAT.white, 0.5, 0, 0); B(f, 0.7, 0.08, 1.5, MAT.fab, 0.5, 0.32, 0); C(f, 0.28, 0.48, MAT.white, 1.4, 0, -0.2);
    } else if (lw > 2.2) { chair(f, -0.1, 0, 0); C(f, 0.24, 0.6, MAT.metal, 0.55, 0, 0); }
  }
}

// ---------- geometriya yordamchilari ----------
function boxes(list, res, y0, y1, out) {
  for (let i = 0; i < list.length; i += 4) {
    const w = list[i + 2] * res, d = list[i + 3] * res;
    const g = new T.BoxGeometry(w, y1 - y0, d);
    g.translate(list[i] * res + w / 2, (y0 + y1) / 2, list[i + 1] * res + d / 2);
    out.push(g);
  }
}
// pol: to'rtburchaklar, UV metrda — naqsh xonalar bo'ylab uzluksiz
function floorGeo(list, res, s, y) {
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < list.length; i += 4) {
    const x0 = list[i] * res, z0 = list[i + 1] * res, x1 = x0 + list[i + 2] * res, z1 = z0 + list[i + 3] * res, b = pos.length / 3;
    pos.push(x0, y, z0, x0, y, z1, x1, y, z1, x1, y, z0);
    uv.push(x0 / s, -z0 / s, x0 / s, -z1 / s, x1 / s, -z1 / s, x1 / s, -z0 / s);
    idx.push(b, b + 1, b + 2, b, b + 2, b + 3);
  }
  if (!idx.length) return null;
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.setAttribute("normal", new T.Float32BufferAttribute(new Array(pos.length).fill(0).map((_, j) => (j % 3 === 1 ? 1 : 0)), 3));
  g.setIndex(idx);
  return g;
}
function addMerged(group, geos, mat, { cast = true, receive = true } = {}) {
  if (!geos.length) return;
  const g = mergeBufferGeometries(geos.map((x) => (x.index ? x.toNonIndexed() : x)));
  geos.forEach((x) => x.dispose());
  const m = new T.Mesh(g, mat); m.castShadow = cast; m.receiveShadow = receive; group.add(m);
}
// mebelni material bo'yicha birlashtirish — minglab mesh o'rniga o'nlab
function bake(src, dst) {
  src.updateMatrixWorld(true);
  const by = new Map();
  src.traverse((o) => {
    if (!o.isMesh) return;
    const g = (o.geometry.index ? o.geometry.toNonIndexed() : o.geometry.clone()).applyMatrix4(o.matrixWorld);
    if (!by.has(o.material)) by.set(o.material, []);
    by.get(o.material).push(g);
    o.geometry.dispose();
  });
  by.forEach((gs, mat) => addMerged(dst, gs, mat, { cast: mat !== MAT.glass, receive: true }));
}

// pol, devor, deraza, eshik va mebel — butun qavat yoki bitta xonadon uchun
function shell(group, g, rooms, common) {
  const res = g.res;
  const fl = { liv: [], kit: [], wet: [], hall: [], out: [], common: [] };
  for (const rm of rooms) fl[KIND[rm.t] || "hall"].push(...rm.r);
  if (common) fl.common.push(...common);
  Object.entries(fl).forEach(([k, list]) => {
    const fg = floorGeo(list, res, TEX[FLOOR[k]].s, k === "common" ? 0.008 : 0.012);
    if (fg) { const m = new T.Mesh(fg, MAT["fl_" + k]); m.receiveShadow = true; group.add(m); }
  });
  const wall = [], cap = [], low = [], glass = [], frame = [];
  boxes(g.walls, res, 0, H, wall);
  boxes(g.walls, res, H, H + 0.04, cap);
  boxes(g.low, res, 0, LOW, low);
  boxes(g.low, res, LOW, LOW + 0.04, frame);
  boxes(g.win, res, 0, SILL, wall);
  boxes(g.win, res, SILL, SILL + 0.05, frame);
  boxes(g.win, res, SILL + 0.05, HEAD, glass);
  boxes(g.win, res, HEAD, H, wall);
  boxes(g.glz, res, 0, HEAD, glass);
  boxes(g.glz, res, HEAD, H, wall);
  boxes(g.door, res, HEAD, H, wall);
  boxes([...g.win, ...g.glz, ...g.door], res, H, H + 0.04, cap);
  addMerged(group, wall, MAT.wall);
  addMerged(group, cap, MAT.cap, { cast: false });
  addMerged(group, low, MAT.low);
  addMerged(group, frame, MAT.frame, { cast: false });
  addMerged(group, glass, MAT.glass, { cast: false, receive: false });
  const furn = new T.Group();
  for (const rm of rooms) {
    const [x, z, bw, bd] = rm.bb;
    furnish(furn, { t: rm.t, a: rm.a, x: x * res + 0.08, z: z * res + 0.08, w: bw * res - 0.16, d: bd * res - 0.16 });
  }
  bake(furn, group);
}

export function createScene(host, { onUser } = {}) {
  const r = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "high-performance" });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.shadowMap.enabled = true;
  r.shadowMap.type = T.PCFSoftShadowMap;
  r.outputEncoding = T.sRGBEncoding;
  r.toneMapping = T.ACESFilmicToneMapping;
  r.toneMappingExposure = 1.0;
  host.appendChild(r.domElement);
  initMats(Math.min(8, r.capabilities.getMaxAnisotropy()));

  const scene = new T.Scene();
  const cam = new T.PerspectiveCamera(35, 1, 0.3, 800);
  scene.add(new T.HemisphereLight(0xffffff, 0xb5a78e, 0.5));
  const sun = new T.DirectionalLight(0xffeed4, 1.45);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  const ctr = new OrbitControls(cam, r.domElement);
  ctr.enableDamping = true;
  ctr.dampingFactor = 0.08;
  ctr.maxPolarAngle = 1.2;
  ctr.screenSpacePanning = false;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let tw = null, cur = null, w = 1, h = 1, raf = 0, vis = true, dirty = true;
  ctr.addEventListener("start", () => { tw = null; onUser && onUser(); });
  ctr.addEventListener("change", () => { dirty = true; });

  const resize = () => {
    w = host.clientWidth; h = host.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); dirty = true;
  };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(host);

  const marks = [];
  const tmp = new T.Vector3();
  const place = () => {
    for (const p of marks) {
      tmp.copy(p.v).project(cam);
      p.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%,-50%)`;
      p.el.style.visibility = tmp.z > 1 ? "hidden" : "";
    }
  };
  const step = () => {
    if (tw) {
      tw.t = Math.min(1, tw.t + (reduced ? 1 : 0.045));
      const q = tw.t, e = q < 0.5 ? 4 * q * q * q : 1 - Math.pow(-2 * q + 2, 3) / 2;
      cam.position.lerpVectors(tw.p0, tw.p1, e);
      ctr.target.lerpVectors(tw.t0, tw.t1, e);
      if (tw.t >= 1) tw = null;
      dirty = true;
    }
    ctr.update();
    if (dirty) { r.render(scene, cam); place(); dirty = false; }
  };
  const loop = () => { raf = requestAnimationFrame(loop); if (vis && cur) step(); };
  loop();

  const view = (x, z, bw, bd, close, tight) => {
    const cx = x + bw / 2, cz = z + bd / 2;
    const fov = (cam.fov * Math.PI) / 180, aspect = w / h;
    const need = Math.max(bd, bw / aspect) * (tight || (close ? 0.85 : 0.52)) + 1;
    const dist = need / Math.tan(fov / 2);
    const phi = close ? 0.48 : 0.72, th = -0.45;
    return { t: new T.Vector3(cx, 0, cz), p: new T.Vector3(cx + dist * Math.sin(phi) * Math.sin(th), dist * Math.cos(phi), cz + dist * Math.sin(phi) * Math.cos(th)) };
  };
  const fly = (v, now) => {
    if (now || reduced) { cam.position.copy(v.p); ctr.target.copy(v.t); ctr.update(); dirty = true; return; }
    tw = { p0: cam.position.clone(), p1: v.p, t0: ctr.target.clone(), t1: v.t, t: 0 };
  };

  const clear = () => {
    if (!cur) return;
    scene.remove(cur.group);
    cur.apts.forEach((g) => { scene.remove(g); g.traverse((o) => { if (o.geometry) o.geometry.dispose(); }); });
    cur.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    cur.planMat.map && cur.planMat.map.dispose();
    cur.planMat.dispose();
    cur = null;
  };

  return {
    async load(plan, geo) {
      const tex = await new T.TextureLoader().loadAsync(plan.src);
      tex.encoding = T.sRGBEncoding;
      tex.anisotropy = Math.min(8, r.capabilities.getMaxAnisotropy());
      clear();
      const { res, w: W, h: D } = geo;
      const group = new T.Group();
      // pastda — chizmaning o'zi: hovli, terrasa chegaralari va o'lchamlar ko'rinib turadi
      const planMat = new T.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.55, toneMapped: false, depthWrite: false });
      const plane = new T.Mesh(new T.PlaneGeometry(W, D), planMat);
      plane.rotation.x = -Math.PI / 2; plane.position.set(W / 2, 0.002, D / 2); plane.renderOrder = -1;
      group.add(plane);
      const slab = new T.Mesh(new T.BoxGeometry(W + 1, 0.3, D + 1), MAT.slab);
      slab.position.set(W / 2, -0.15, D / 2); slab.receiveShadow = true;
      group.add(slab);

      shell(group, geo, geo.rooms, geo.common);
      scene.add(group);

      const s = Math.max(W, D);
      const sc = sun.shadow.camera;
      sc.left = -s * 0.7; sc.right = s * 0.7; sc.top = s * 0.7; sc.bottom = -s * 0.7; sc.near = 1; sc.far = s * 4;
      sc.updateProjectionMatrix();
      sun.shadow.mapSize.set(s > 50 ? 4096 : 2048, s > 50 ? 4096 : 2048);
      sun.position.set(W / 2 - s * 0.5, s * 1.2, D / 2 + s * 0.7);
      sun.target.position.set(W / 2, 0, D / 2);
      ctr.minDistance = 4; ctr.maxDistance = s * 2.2;
      cur = { group, planMat, W, D, geo, apts: new Map(), iso: null };
      dirty = true;
      return { W, D, rooms: geo.rooms.map((rm) => ({ t: rm.t, a: rm.a, n: rm.n, x: (rm.bb[0] + rm.bb[2] / 2) * res, z: (rm.bb[1] + rm.bb[3] / 2) * res })) };
    },
    // [{ el, x, z, y }] — metrda; DOM yorliqlar har kadrda joylanadi
    setMarks(list) {
      marks.length = 0;
      list.forEach((p) => marks.push({ el: p.el, v: new T.Vector3(p.x, p.y ?? 1.2, p.z) }));
      dirty = true;
    },
    // bitta xonadonni alohida ko'rsatish: faqat uning xonalari, devor, deraza, eshik va balkonlari
    isolate(n, now) {
      if (!cur) return;
      const a = n != null && cur.geo.apts && cur.geo.apts[n];
      if (cur.iso) cur.iso.visible = false;
      cur.iso = null;
      if (!a) { cur.group.visible = true; dirty = true; return false; }
      let g = cur.apts.get(n);
      if (!g) {
        g = new T.Group();
        const res = cur.geo.res, [bx, by, bw, bd] = a.bb;
        const own = cur.geo.rooms.filter((r) => String(r.n) === String(n));
        // pastki plita xonadonning o'z shaklida: xonalar + devorlar ostida
        const sl = [];
        own.forEach((rm) => boxes(rm.r, res, -0.3, 0, sl));
        [a.walls, a.low, a.win, a.glz, a.door].forEach((l) => boxes(l, res, -0.3, 0, sl));
        addMerged(g, sl, MAT.slab, { cast: false });
        shell(g, { ...a, res }, own, null);
        scene.add(g);
        cur.apts.set(n, g);
      }
      g.visible = true;
      cur.group.visible = false;
      cur.iso = g;
      const res = cur.geo.res, [bx, by, bw, bd] = a.bb;
      fly(view(bx * res, by * res, bw * res, bd * res, true, w / h < 1 ? 0.68 : 0.5), now);
      dirty = true;
      return true;
    },
    focus(box, now) {
      if (!cur) return;
      fly(box ? view(box[0], box[1], box[2], box[3], true) : view(0, 0, cur.W, cur.D, false), now);
    },
    zoom(k) {
      const off = cam.position.clone().sub(ctr.target).multiplyScalar(k);
      const len = Math.min(ctr.maxDistance, Math.max(ctr.minDistance, off.length()));
      fly({ t: ctr.target.clone(), p: ctr.target.clone().add(off.setLength(len)) });
    },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); clear(); ctr.dispose();
      r.dispose(); r.domElement.remove();
    },
  };
}
