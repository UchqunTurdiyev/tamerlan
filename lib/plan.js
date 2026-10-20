import { SERVICE, OUT, KIND } from "./data";

// Eksplikatsiya maydonlaridan to'rtburchak reja tuzish (squarified treemap)
function squarify(items, rect, out) {
  const total = items.reduce((s, r) => s + r.a, 0);
  if (!total) return;
  const sc = (rect.w * rect.d) / total;
  const list = items.map((r) => ({ ...r, v: r.a * sc })).sort((p, q) => q.v - p.v);
  const worst = (row, s) => {
    const sum = row.reduce((x, r) => x + r.v, 0);
    let mx = -1, mn = 1e9;
    row.forEach((r) => { mx = Math.max(mx, r.v); mn = Math.min(mn, r.v); });
    return Math.max((s * s * mx) / (sum * sum), (sum * sum) / (s * s * mn));
  };
  const lay = (row, r) => {
    const sum = row.reduce((x, q) => x + q.v, 0);
    if (r.w >= r.d) {
      const cw = sum / r.d;
      let z = r.z;
      row.forEach((q) => { const h = q.v / cw; out.push(Object.assign(q, { x: r.x, z, w: cw, d: h })); z += h; });
      return { x: r.x + cw, z: r.z, w: r.w - cw, d: r.d };
    }
    const rd = sum / r.w;
    let x = r.x;
    row.forEach((q) => { const w = q.v / rd; out.push(Object.assign(q, { x, z: r.z, w, d: rd })); x += w; });
    return { x: r.x, z: r.z + rd, w: r.w, d: r.d - rd };
  };
  let row = [], r = { ...rect };
  while (list.length) {
    const s = Math.min(r.w, r.d), c = list[0];
    if (!row.length || worst(row.concat(c), s) <= worst(row, s)) row.push(list.shift());
    else { r = lay(row, r); row = []; }
  }
  if (row.length) lay(row, r);
}

export function layout(rooms) {
  const inner = rooms.filter((r) => !OUT.has(r.t)), out = rooms.filter((r) => OUT.has(r.t));
  const Ar = inner.reduce((s, r) => s + r.a, 0);
  const W = Math.sqrt(Ar * 1.45), D = Ar / W;
  const sv = inner.filter((r) => SERVICE.has(r.t)), lv = inner.filter((r) => !SERVICE.has(r.t));
  const sa = sv.reduce((s, r) => s + r.a, 0);
  const ws = lv.length ? (sv.length ? sa / D : 0) : W;
  const placed = [];
  if (sv.length) squarify(sv, { x: 0, z: 0, w: ws, d: D }, placed);
  if (lv.length) squarify(lv, { x: ws, z: 0, w: W - ws, d: D }, placed);
  const outs = [];
  const side = (list, front) => {
    if (!list.length) return;
    const sum = list.reduce((s, o) => s + o.a, 0);
    let depth = Math.max(1.3, Math.min(4.6, sum / (W * 0.7)));
    let ws2 = list.map((o) => o.a / depth);
    let tot = ws2.reduce((a, b) => a + b, 0);
    if (tot > W) { depth = sum / W; ws2 = list.map((o) => o.a / depth); tot = W; }
    let x = W - tot;
    list.forEach((o, i) => { outs.push({ ...o, x, w: ws2[i], d: depth, z: front ? D : -depth, front }); x += ws2[i]; });
  };
  side(out.filter((_, i) => i % 2 === 0), true);
  side(out.filter((_, i) => i % 2 === 1), false);
  let z0 = 0, z1 = D;
  outs.forEach((o) => { z0 = Math.min(z0, o.z); z1 = Math.max(z1, o.z + o.d); });
  return { W, D, rooms: placed, outs, bounds: { x0: 0, x1: W, z0, z1 } };
}

// Kartalar uchun kichik 2D reja (SVG satri)
export function planSVG(apt) {
  const L = layout(apt.rooms), b = L.bounds, p = 0.35;
  const vw = b.x1 - b.x0 + 2 * p, vh = b.z1 - b.z0 + 2 * p, s = Math.max(vw, vh);
  const ox = b.x0 - p - (s - vw) / 2, oz = b.z0 - p - (s - vh) / 2;
  const sw = ((s / 64) * 1.1).toFixed(3);
  const rect = (r) =>
    `<rect x="${r.x.toFixed(2)}" y="${r.z.toFixed(2)}" width="${r.w.toFixed(2)}" height="${r.d.toFixed(2)}" fill="var(--pl-${KIND[r.t]})" stroke="var(--pl-stroke)" stroke-width="${sw}"/>`;
  const tr = apt.mir ? `transform="translate(${(b.x0 + b.x1).toFixed(2)},0) scale(-1,1)"` : "";
  return `<svg viewBox="${ox.toFixed(2)} ${oz.toFixed(2)} ${s.toFixed(2)} ${s.toFixed(2)}" aria-hidden="true"><g ${tr}>${L.outs.map(rect).join("")}${L.rooms.map(rect).join("")}</g></svg>`;
}
