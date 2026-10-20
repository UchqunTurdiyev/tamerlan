import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { layout } from "./plan";
import { RN, KIND, SERVICE, fmt } from "./data";

const T = THREE;
let MAT = null, TEX = null;
const FLOORTEX = { liv: "parq", hall: "parq", kit: "stone", wet: "tile", out: "deck" };

function initMats() {
  if (MAT) return;
  const m = (c, o) => new T.MeshStandardMaterial({ color: c, roughness: 0.75, metalness: 0, ...(o || {}) });
  MAT = {
    wall: m(0xf3f1ec, { roughness: 0.92 }), cap: m(0x1c1f23, { roughness: 0.6 }), slab: m(0xd8dad6, { roughness: 0.95 }),
    white: m(0xf6f6f4, { roughness: 0.45 }), wood: m(0x5a3e2b, { roughness: 0.6 }), woodL: m(0xa98159, { roughness: 0.6 }),
    dark: m(0x2a2d32, { roughness: 0.55 }), cab: m(0x4b3729, { roughness: 0.5 }), marble: m(0xeceae6, { roughness: 0.2 }),
    fab: m(0x9097a0, { roughness: 0.95 }), fabD: m(0x5d636b, { roughness: 0.95 }), blanket: m(0x6b645e, { roughness: 1 }),
    rug: m(0xdad2c4, { roughness: 1 }), rug2: m(0xc5cbd0, { roughness: 1 }),
    green: m(0x4b8a38, { roughness: 0.8, flatShading: true }), green2: m(0x2f6b2c, { roughness: 0.8, flatShading: true }),
    pot: m(0xd5cfc5, { roughness: 0.8 }), glass: m(0x9fc8dc, { transparent: true, opacity: 0.26, roughness: 0.05 }),
    metal: m(0x23262a, { roughness: 0.4, metalness: 0.5 }), chrome: m(0xb7bcc2, { roughness: 0.2, metalness: 0.8 }),
    black: m(0x111214, { roughness: 0.3 }), water: m(0xdbe8ef, { roughness: 0.1 }),
  };
  const canvasTex = (draw) => {
    const c = document.createElement("canvas"); c.width = c.height = 512;
    draw(c.getContext("2d"), 512);
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    return t;
  };
  const rnd = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
  TEX = {
    parq: canvasTex((x, S) => {
      const r = rnd(11); x.fillStyle = "#6e4e33"; x.fillRect(0, 0, S, S);
      const cw = 64, pw = S / (Math.SQRT2 * 20), L = cw * 1.6;
      for (let c = 0; c < S / cw; c++) {
        x.save(); x.beginPath(); x.rect(c * cw, 0, cw, S); x.clip(); x.translate(c * cw + cw / 2, S / 2); x.rotate(((c % 2) ? 1 : -1) * Math.PI / 4);
        for (let i = -30; i < 30; i++) for (let k = -8; k < 8; k++) {
          const t = r(); x.fillStyle = `rgb(${(168 + t * 28) | 0},${(124 + t * 22) | 0},${(84 + t * 16) | 0})`;
          x.fillRect(k * L + (i % 2 ? L / 2 : 0), i * pw, L - 1.5, pw - 1.5);
        }
        x.restore();
      }
    }),
    tile: canvasTex((x, S) => { const r = rnd(5); x.fillStyle = "#b9bbb7"; x.fillRect(0, 0, S, S); for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { const t = r(); x.fillStyle = `rgb(${(208 + t * 10) | 0},${(210 + t * 10) | 0},${(207 + t * 10) | 0})`; x.fillRect(i * 128 + 2, j * 128 + 2, 124, 124); } }),
    stone: canvasTex((x, S) => { const r = rnd(3); x.fillStyle = "#c9c4bb"; x.fillRect(0, 0, S, S); for (let i = 0; i < 2; i++) for (let j = 0; j < 4; j++) { const t = r(); x.fillStyle = `rgb(${(226 + t * 10) | 0},${(222 + t * 10) | 0},${(214 + t * 10) | 0})`; x.fillRect(i * 256 + 2, j * 128 + 2, 252, 124); } }),
    deck: canvasTex((x, S) => { const r = rnd(9); x.fillStyle = "#4a3828"; x.fillRect(0, 0, S, S); for (let j = 0; j < 16; j++) { const t = r(); x.fillStyle = `rgb(${(128 + t * 24) | 0},${(96 + t * 18) | 0},${(68 + t * 12) | 0})`; x.fillRect(0, j * 32 + 2, S, 28); } }),
  };
}

function B(g, w, h, d, m, x, y, z) { const me = new T.Mesh(new T.BoxGeometry(w, h, d), m); me.position.set(x, y + h / 2, z); me.castShadow = m !== MAT.glass; me.receiveShadow = true; g.add(me); return me; }
function C(g, r, h, m, x, y, z) { const me = new T.Mesh(new T.CylinderGeometry(r, r, h, 22), m); me.position.set(x, y + h / 2, z); me.castShadow = me.receiveShadow = true; g.add(me); return me; }
function plant(g, x, z, s = 1) {
  C(g, 0.17 * s, 0.34 * s, MAT.pot, x, 0, z);
  const l = new T.Mesh(new T.IcosahedronGeometry(0.32 * s, 0), MAT.green); l.position.set(x, 0.62 * s, z); l.castShadow = true; g.add(l);
  const l2 = new T.Mesh(new T.IcosahedronGeometry(0.22 * s, 0), MAT.green2); l2.position.set(x + 0.1 * s, 0.86 * s, z - 0.05 * s); l2.castShadow = true; g.add(l2);
}
function chair(g, x, z, ry) { const c = new T.Group(); c.position.set(x, 0, z); c.rotation.y = ry; B(c, 0.44, 0.44, 0.44, MAT.dark, 0, 0, 0); B(c, 0.44, 0.46, 0.06, MAT.dark, 0, 0.44, 0.2); g.add(c); }
function dining(g, cx, cz, len) {
  B(g, len, 0.05, 0.95, MAT.wood, cx, 0.72, cz); B(g, 0.08, 0.72, 0.7, MAT.metal, cx - len / 2 + 0.25, 0, cz); B(g, 0.08, 0.72, 0.7, MAT.metal, cx + len / 2 - 0.25, 0, cz);
  const n = Math.max(1, Math.floor(len / 0.62));
  for (let i = 0; i < n; i++) {
    const x = cx - len / 2 + ((i + 0.5) * len) / n;
    chair(g, x, cz - 0.78, Math.PI); chair(g, x, cz + 0.78, 0);
    C(g, 0.13, 0.015, MAT.white, x, 0.77, cz - 0.27); C(g, 0.13, 0.015, MAT.white, x, 0.77, cz + 0.27);
  }
  if (len >= 1.8) { chair(g, cx - len / 2 - 0.42, cz, -Math.PI / 2); chair(g, cx + len / 2 + 0.42, cz, Math.PI / 2); }
  C(g, 0.05, 0.18, MAT.glass, cx, 0.77, cz);
}
function sofa(g, x, z, len) {
  const s = new T.Group(); s.position.set(x, 0, z);
  B(s, len, 0.42, 0.9, MAT.fab, 0, 0, 0); B(s, len, 0.4, 0.22, MAT.fab, 0, 0.42, 0.34);
  B(s, 0.18, 0.62, 0.9, MAT.fabD, -len / 2 + 0.09, 0, 0); B(s, 0.18, 0.62, 0.9, MAT.fabD, len / 2 - 0.09, 0, 0);
  B(s, 0.4, 0.3, 0.12, MAT.white, -len / 4, 0.42, 0.18); g.add(s);
}

function furnish(g, r) {
  const lw = Math.max(r.w, r.d), ld = Math.min(r.w, r.d), t = r.t, a = r.a;
  const f = new T.Group(); f.position.set(r.x + r.w / 2, 0, r.z + r.d / 2); if (r.d > r.w) f.rotation.y = Math.PI / 2; g.add(f);
  const bz = -ld / 2, fz = ld / 2;
  if (t === "y") {
    let bw = Math.min(1.8, lw - 1.4), bl = Math.min(2.05, ld - 0.8);
    if (bw < 1.2 || bl < 1.6) { bw = Math.min(1.4, lw - 0.4); bl = Math.min(1.95, ld - 0.35); }
    const ward = lw - bw > 2.5, bx = ward ? -0.4 : 0, zb = bz + bl / 2 + 0.08;
    B(f, bw + 1.0, 0.012, 1.7, MAT.rug2, bx, 0, zb + bl * 0.25);
    B(f, bw + 0.3, 0.95, 0.08, MAT.fabD, bx, 0, bz + 0.05); B(f, bw + 0.08, 0.32, bl, MAT.wood, bx, 0, zb); B(f, bw - 0.04, 0.2, bl - 0.1, MAT.white, bx, 0.32, zb + 0.03);
    B(f, bw, 0.06, bl * 0.55, MAT.blanket, bx, 0.5, zb + bl * 0.22);
    B(f, bw / 2 - 0.12, 0.12, 0.34, MAT.white, bx - bw / 4, 0.52, zb - bl / 2 + 0.3); B(f, bw / 2 - 0.12, 0.12, 0.34, MAT.white, bx + bw / 4, 0.52, zb - bl / 2 + 0.3);
    if (lw - bw > 1.2) { B(f, 0.42, 0.45, 0.4, MAT.woodL, bx - bw / 2 - 0.3, 0, bz + 0.26); B(f, 0.42, 0.45, 0.4, MAT.woodL, bx + bw / 2 + 0.3, 0, bz + 0.26); }
    if (ward) B(f, 0.6, 1.1, Math.min(2.2, ld - 0.5), MAT.white, lw / 2 - 0.33, 0, 0);
  } else if (t === "b") {
    const bl = Math.min(2, ld - 0.4);
    B(f, 0.95, 0.32, bl, MAT.woodL, -lw / 2 + 0.55, 0, bz + bl / 2 + 0.05); B(f, 0.88, 0.18, bl - 0.1, MAT.white, -lw / 2 + 0.55, 0.32, bz + bl / 2 + 0.08); B(f, 0.9, 0.05, bl * 0.5, MAT.rug2, -lw / 2 + 0.55, 0.5, bz + bl * 0.68);
    if (lw > 2.6) { B(f, 1.2, 0.74, 0.6, MAT.woodL, lw / 2 - 0.75, 0, bz + 0.32); chair(f, lw / 2 - 0.75, bz + 0.85, 0); }
    B(f, 1.6, 0.012, 1.4, MAT.rug, 0.2, 0, 0.2);
  } else if (t === "m") {
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
  } else if (t === "o") {
    const cl = lw - 1.05, cx0 = (-lw / 2 + 0.85 + lw / 2 - 0.2) / 2;
    B(f, 0.7, 1.18, 0.66, MAT.white, -lw / 2 + 0.45, 0, bz + 0.35);
    B(f, cl, 0.86, 0.62, MAT.cab, cx0, 0, bz + 0.32); B(f, cl + 0.02, 0.04, 0.64, MAT.marble, cx0, 0.86, bz + 0.33);
    B(f, 0.58, 0.012, 0.48, MAT.black, cx0 + cl / 4, 0.9, bz + 0.33); B(f, 0.5, 0.012, 0.38, MAT.chrome, cx0 - cl / 4, 0.9, bz + 0.33);
    if (ld >= 3.2 && lw >= 3) { const ll = ld * 0.42; B(f, 0.62, 0.86, ll, MAT.cab, lw / 2 - 0.33, 0, bz + 0.64 + ll / 2); B(f, 0.64, 0.04, ll, MAT.marble, lw / 2 - 0.33, 0.86, bz + 0.64 + ll / 2); }
    if (ld >= 2.9) { const tl = Math.min(1.7, lw * 0.42); dining(f, -lw * 0.08, bz + 0.62 + (ld - 0.62) / 2 + 0.05, tl); }
  } else if (t === "d") {
    if (ld >= 1.3) { const wl = Math.min(2.4, lw * 0.5); B(f, wl, 1.1, 0.5, MAT.white, -lw / 2 + wl / 2 + 0.1, 0, bz + 0.27); }
    B(f, lw * 0.6, 0.012, Math.min(0.9, ld * 0.4), MAT.rug, 0.1, 0, ld > 1.6 ? ld * 0.12 : 0);
    if (lw > 2.4 && ld > 1.4) plant(f, lw / 2 - 0.3, fz - 0.3, 0.8);
  } else if (t === "v" || t === "s" || t === "vs") {
    const tub = (t === "v" && lw >= 1.55) || (t === "vs" && lw >= 2.3);
    if (tub) { B(f, 1.55, 0.55, 0.72, MAT.white, -lw / 2 + 0.82, 0, bz + 0.38); B(f, 1.35, 0.012, 0.52, MAT.water, -lw / 2 + 0.82, 0.55, bz + 0.38); }
    else if (t === "vs") { B(f, 0.85, 0.06, 0.85, MAT.white, -lw / 2 + 0.47, 0, bz + 0.47); B(f, 0.02, 1.0, 0.85, MAT.glass, -lw / 2 + 0.92, 0.06, bz + 0.47); }
    if (t !== "v") { const tx = t === "s" ? -lw / 2 + 0.35 : lw / 2 - 0.4; B(f, 0.4, 0.75, 0.18, MAT.white, tx, 0, bz + 0.1); C(f, 0.19, 0.4, MAT.white, tx, 0, bz + 0.42); }
    if ((t === "v" && ld >= 1.3) || (t === "s" && lw >= 1.35) || (t === "vs" && lw >= 2.6)) {
      const sx = t === "vs" ? 0.1 : lw / 2 - 0.35, sz = t === "v" ? fz - 0.24 : bz + 0.24;
      B(f, 0.55, 0.82, 0.42, MAT.cab, sx, 0, sz); B(f, 0.5, 0.04, 0.4, MAT.white, sx, 0.82, sz);
    }
  } else if (t === "k") { B(f, lw - 0.2, 1.0, 0.4, MAT.woodL, 0, 0, bz + 0.22); if (ld > 1.2) B(f, 0.4, 1.0, ld - 0.7, MAT.woodL, lw / 2 - 0.22, 0, 0.2); }
  else if (t === "z") { const n = 8; for (let i = 0; i < n; i++) B(f, (lw / n) * 0.97, (i + 1) * 0.13, ld * 0.72, MAT.white, -lw / 2 + ((i + 0.5) * lw) / n, 0, 0); }
  else if (t === "bl" || t === "t") {
    plant(f, -lw / 2 + 0.35, 0, 1); if (lw > 2.4) plant(f, lw / 2 - 0.35, 0, 0.85);
    if (a > 10 && ld >= 2) {
      B(f, 0.75, 0.32, 1.7, MAT.white, -0.6, 0, 0); B(f, 0.7, 0.08, 1.5, MAT.fab, -0.6, 0.32, 0);
      B(f, 0.75, 0.32, 1.7, MAT.white, 0.5, 0, 0); B(f, 0.7, 0.08, 1.5, MAT.fab, 0.5, 0.32, 0); C(f, 0.28, 0.48, MAT.white, 1.4, 0, -0.2);
    } else if (lw > 2.2) { chair(f, -0.1, 0, 0); C(f, 0.24, 0.6, MAT.metal, 0.55, 0, 0); }
  }
}

function wall(g, hz, a0, a1, c, t, gaps, H) {
  const len = a1 - a0;
  const gs = (gaps || [])
    .map((q) => ({ s: Math.max(0.15, q.p - a0 - q.w / 2), e: Math.min(len - 0.15, q.p - a0 + q.w / 2), win: q.win }))
    .filter((q) => q.e - q.s > 0.3).sort((p, q) => p.s - q.s);
  const gg = []; for (const q of gs) { if (gg.length && q.s < gg[gg.length - 1].e + 0.12) continue; gg.push(q); }
  const seg = (s, e, y, h, m) => { const L = e - s, mid = (s + e) / 2; if (L <= 0.01) return; return hz ? B(g, L, h, t, m, a0 + mid, y, c) : B(g, t, h, L, m, c, y, a0 + mid); };
  let cur = -t / 2;
  for (const q of gg) {
    seg(cur, q.s, 0, H, MAT.wall); seg(cur, q.s, H, 0.035, MAT.cap);
    if (q.win) { seg(q.s, q.e, 0, 0.55, MAT.wall); seg(q.s, q.e, 0.55, 0.03, MAT.cap); seg(q.s, q.e, 0.58, H - 0.58, MAT.glass); seg(q.s, q.e, H, 0.035, MAT.cap); }
    cur = q.e;
  }
  seg(cur, len + t / 2, 0, H, MAT.wall); seg(cur, len + t / 2, H, 0.035, MAT.cap);
}

function build(apt) {
  const L = layout(apt.rooms), { W, D, rooms, outs, bounds: b } = L, H = 1.3, E = 0.01;
  const outer = new T.Group(), g = new T.Group(); outer.add(g);
  B(g, b.x1 - b.x0 + 0.5, 0.28, b.z1 - b.z0 + 0.5, MAT.slab, (b.x0 + b.x1) / 2, -0.28, (b.z0 + b.z1) / 2);
  const floor = (r) => {
    const tex = TEX[FLOORTEX[KIND[r.t]]].clone(); tex.needsUpdate = true; tex.repeat.set(r.w / 2, r.d / 2);
    const me = new T.Mesh(new T.PlaneGeometry(r.w, r.d), new T.MeshStandardMaterial({ map: tex, roughness: 0.7 }));
    me.rotation.x = -Math.PI / 2; me.position.set(r.x + r.w / 2, 0.004, r.z + r.d / 2); me.receiveShadow = true; g.add(me);
  };
  rooms.forEach((r) => { floor(r); furnish(g, r); });
  outs.forEach((o) => {
    floor(o); furnish(g, o);
    const zo = o.front ? o.z + o.d : o.z, zi = o.front ? o.z : o.z + o.d;
    B(g, o.w, 0.92, 0.02, MAT.glass, o.x + o.w / 2, 0, zo); B(g, o.w + 0.04, 0.04, 0.06, MAT.metal, o.x + o.w / 2, 0.92, zo);
    [o.x, o.x + o.w].forEach((x) => { B(g, 0.02, 0.92, o.d, MAT.glass, x, 0, (zo + zi) / 2); B(g, 0.06, 0.04, o.d, MAT.metal, x, 0.92, (zo + zi) / 2); });
  });
  const win = (r) => KIND[r.t] === "liv" || KIND[r.t] === "kit";
  const overlapsOut = (r, front) => outs.some((o) => o.front === front && o.x < r.x + r.w - 0.2 && o.x + o.w > r.x + 0.2);
  const fg = [], bg = [], lg = [], rg = [];
  outs.forEach((o) => (o.front ? fg : bg).push({ p: o.x + o.w / 2, w: Math.min(1.3, o.w * 0.5) }));
  rooms.forEach((r) => {
    if (!win(r)) return;
    const ww = Math.min(1.7, r.w * 0.55), wd = Math.min(1.7, r.d * 0.55);
    if (Math.abs(r.z + r.d - D) < E && !overlapsOut(r, true)) fg.push({ p: r.x + r.w / 2, w: ww, win: 1 });
    if (r.z < E && !overlapsOut(r, false)) bg.push({ p: r.x + r.w / 2, w: ww, win: 1 });
    if (r.x < E) lg.push({ p: r.z + r.d / 2, w: wd, win: 1 });
    if (Math.abs(r.x + r.w - W) < E) rg.push({ p: r.z + r.d / 2, w: wd, win: 1 });
  });
  const te = 0.22;
  wall(g, true, 0, W, D, te, fg, H); wall(g, true, 0, W, 0, te, bg, H); wall(g, false, 0, D, 0, te, lg, H); wall(g, false, 0, D, W, te, rg, H);
  rooms.forEach((r) => {
    const left = r.x > E, top = r.z > E; if (!left && !top) return;
    const svc = SERVICE.has(r.t), side = svc ? (top ? "T" : "L") : (left ? "L" : "T");
    const len = side === "L" ? r.d : r.w;
    const gp = len > 1.3 ? [{ p: (side === "L" ? r.z : r.x) + Math.max(0.6, len * 0.28), w: 0.85 }] : [];
    if (left) wall(g, false, r.z, r.z + r.d, r.x, 0.1, side === "L" ? gp : [], H);
    if (top) wall(g, true, r.x, r.x + r.w, r.z, 0.1, side === "T" ? gp : [], H);
  });
  g.position.set(-(b.x0 + b.x1) / 2, 0, -(b.z0 + b.z1) / 2);
  if (apt.mir) outer.scale.x = -1;
  const labels = rooms.concat(outs).map((r) => ({ t: r.t, a: r.a, v: new T.Vector3(r.x + r.w / 2, 0.35, r.z + r.d / 2) }));
  return { group: outer, inner: g, labels, size: Math.max(b.x1 - b.x0, b.z1 - b.z0) };
}

export function createViewer(host, opt = {}) {
  initMats();
  const r = new T.WebGLRenderer({ antialias: true, alpha: true });
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
  r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.08;
  host.appendChild(r.domElement);
  const scene = new T.Scene(), cam = new T.PerspectiveCamera(32, 1, 0.1, 300);
  scene.add(new T.HemisphereLight(0xffffff, 0xb8b1a6, 0.72));
  const sun = new T.DirectionalLight(0xfff4e6, 1.0);
  sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); sun.shadow.bias = -0.0004; sun.shadow.radius = 4;
  scene.add(sun); scene.add(sun.target);
  const sp = new T.Mesh(new T.PlaneGeometry(200, 200), new T.ShadowMaterial({ opacity: 0.16 }));
  sp.rotation.x = -Math.PI / 2; sp.position.y = -0.281; sp.receiveShadow = true; scene.add(sp);
  const ctr = new OrbitControls(cam, r.domElement);
  ctr.enableDamping = true; ctr.dampingFactor = 0.08; ctr.enablePan = false; ctr.minPolarAngle = 0.05; ctr.maxPolarAngle = 1.22;
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  ctr.autoRotate = !reduced; ctr.autoRotateSpeed = 0.75;
  let tw = null, cur = null, vis = true, w = 1, h = 1, raf = 0;
  ctr.addEventListener("start", () => { ctr.autoRotate = false; tw = null; opt.onUser && opt.onUser(); });
  const lbl = document.createElement("div"); lbl.className = "lbls"; host.appendChild(lbl);
  const tmp = new T.Vector3();
  const resize = () => { w = host.clientWidth; h = host.clientHeight; if (!w || !h) return; r.setSize(w, h, false); cam.aspect = w / h; cam.updateProjectionMatrix(); };
  const ro = new ResizeObserver(resize); ro.observe(host); resize();
  const io = new IntersectionObserver((e) => { vis = e[0].isIntersecting; }); io.observe(host);

  const viewPos = (top) => {
    const s = cur.size, dist = s * (w / h < 1 ? 2.5 : 1.85), phi = top ? 0.06 : 0.9, th = 0.72;
    return new T.Vector3(dist * Math.sin(phi) * Math.sin(th), dist * Math.cos(phi), dist * Math.sin(phi) * Math.cos(th));
  };
  const tween = (to) => { tw = { from: cam.position.clone(), to, t: 0 }; };
  const clear = () => {
    if (!cur) return;
    scene.remove(cur.group);
    cur.group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) { o.material.map.dispose(); o.material.dispose(); } });
    lbl.innerHTML = ""; cur = null;
  };
  const step = () => {
    if (tw) { tw.t = Math.min(1, tw.t + (reduced ? 1 : 0.045)); const q = tw.t, e = q < 0.5 ? 2 * q * q : 1 - Math.pow(-2 * q + 2, 2) / 2; cam.position.lerpVectors(tw.from, tw.to, e); if (tw.t >= 1) tw = null; }
    ctr.update(); r.render(scene, cam);
    if (opt.labels === false) return;
    const m = cur.inner.matrixWorld;
    for (const l of cur.labels) {
      tmp.copy(l.v).applyMatrix4(m).project(cam);
      l.el.style.transform = `translate(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px) translate(-50%,-50%)`;
    }
  };
  const loop = () => { raf = requestAnimationFrame(loop); if (!vis || !cur) return; step(); };
  loop();

  return {
    get autoRotate() { return ctr.autoRotate; },
    set autoRotate(v) { ctr.autoRotate = v && !reduced; },
    show(apt) {
      clear();
      const res = build(apt); scene.add(res.group); cur = res;
      res.labels.forEach((l) => { const el = document.createElement("div"); el.className = "lb"; el.innerHTML = `<b>${RN[l.t]}</b><span>${fmt(l.a)}</span>`; lbl.appendChild(el); l.el = el; });
      const s = res.size, d = s * 0.85, sc = sun.shadow.camera;
      sc.left = sc.bottom = -d; sc.right = sc.top = d; sc.near = 0.5; sc.far = s * 5; sc.updateProjectionMatrix();
      sun.position.set(s * 0.55, s * 1.5, s * 0.7);
      ctr.minDistance = s * 0.75; ctr.maxDistance = s * 3.2;
      cam.position.copy(viewPos(false)); ctr.target.set(0, 0, 0); ctr.update();
    },
    top() { if (!cur) return; ctr.autoRotate = false; tween(viewPos(true)); },
    home() { if (!cur) return; tween(viewPos(false)); },
    destroy() {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); clear(); ctr.dispose(); r.dispose();
      r.domElement.remove(); lbl.remove();
    },
  };
}
