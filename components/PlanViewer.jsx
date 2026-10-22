"use client";
import { useCallback, useEffect, useRef } from "react";

// Arxitektura rejasi: surish, chimchilab/tugma bilan kattalashtirish, tanlangan xonadonga yaqinlashish.
// Pinlar CSS o'zgaruvchilari orqali joylashadi — surishda React qayta chizmaydi.
const MAX = 2.6;

export default function PlanViewer({ plan, apts, selected, dim, onPick }) {
  const box = useRef(null);
  const world = useRef(null);
  const t = useRef({ x: 0, y: 0, s: 1, fit: 1, home: 1 });
  const anim = useRef(0);
  const ww = plan.w / 2, wh = plan.h / 2;

  const apply = useCallback(() => {
    const el = box.current, w = world.current;
    if (!el || !w) return;
    const { x, y, s, fit } = t.current;
    w.style.transform = `translate3d(${x}px,${y}px,0) scale(${s})`;
    el.style.setProperty("--tx", x);
    el.style.setProperty("--ty", y);
    el.style.setProperty("--sw", ww * s);
    el.style.setProperty("--sh", wh * s);
    el.dataset.zoomed = s > fit * 1.04 ? "1" : "0";
  }, [ww, wh]);

  const clamp = useCallback((x, y, s) => {
    const el = box.current, cw = el.clientWidth, ch = el.clientHeight, sw = ww * s, sh = wh * s;
    x = sw <= cw ? (cw - sw) / 2 : Math.min(0, Math.max(cw - sw, x));
    y = sh <= ch ? (ch - sh) / 2 : Math.min(0, Math.max(ch - sh, y));
    return { x, y };
  }, [ww, wh]);

  const go = useCallback((x, y, s, animate) => {
    cancelAnimationFrame(anim.current);
    s = Math.min(MAX, Math.max(t.current.fit, s));
    const to = { ...clamp(x, y, s), s };
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!animate || reduce) { Object.assign(t.current, to); apply(); return; }
    const from = { ...t.current }, t0 = performance.now(), dur = 420;
    const step = (now) => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      t.current.x = from.x + (to.x - from.x) * e;
      t.current.y = from.y + (to.y - from.y) * e;
      t.current.s = from.s + (to.s - from.s) * e;
      apply();
      if (k < 1) anim.current = requestAnimationFrame(step);
    };
    anim.current = requestAnimationFrame(step);
  }, [apply, clamp]);

  const zoomAt = useCallback((px, py, k, animate) => {
    const { x, y, s } = t.current;
    const ns = Math.min(MAX, Math.max(t.current.fit, s * k)), r = ns / s;
    go(px - (px - x) * r, py - (py - y) * r, ns, animate);
  }, [go]);

  const focus = useCallback((n, animate) => {
    const el = box.current, a = n != null && plan.apts[n];
    if (!el) return;
    const cw = el.clientWidth, ch = el.clientHeight;
    if (!a) { const s = t.current.home; go((cw - ww * s) / 2, (ch - wh * s) / 2, s, animate); return; }
    const [bx, by, bw, bh] = a.box;
    const s = Math.min(cw / (bw * ww), ch / (bh * wh)) * 0.8;
    const ns = Math.min(MAX, Math.max(t.current.fit, s));
    go(cw / 2 - (bx + bw / 2) * ww * ns, ch / 2 - (by + bh / 2) * wh * ns, ns, animate);
  }, [plan, go, ww, wh]);

  // o'lcham va reja o'zgarganda sig'dirish
  const selRef = useRef(selected);
  selRef.current = selected;
  useEffect(() => {
    const el = box.current;
    const fit = () => {
      const cw = el.clientWidth, ch = el.clientHeight;
      t.current.fit = Math.min(cw / ww, ch / wh);
      // telefonda butun qavat juda mayda chiqadi: balandlikni to'ldirib ochamiz, yon tomonga suriladi
      t.current.home = cw < 640 ? Math.min(Math.max(cw / ww, ch / wh), t.current.fit * 2.4) : t.current.fit;
      focus(selRef.current, false);
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(el);
    return () => ro.disconnect();
  }, [plan, ww, wh, focus]);

  useEffect(() => { focus(selected, true); }, [selected, focus]);

  // surish va chimchilash
  useEffect(() => {
    const el = box.current;
    const pts = new Map();
    let moved = 0, last = null;
    const rel = (e) => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    const down = (e) => {
      if (e.button) return;
      pts.set(e.pointerId, rel(e));
      if (pts.size === 1) moved = 0;
      last = null;
      cancelAnimationFrame(anim.current);
    };
    const move = (e) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId), cur = rel(e);
      pts.set(e.pointerId, cur);
      if (pts.size === 1) {
        const dx = cur[0] - prev[0], dy = cur[1] - prev[1];
        moved += Math.abs(dx) + Math.abs(dy);
        if (moved > 6 && !el.hasPointerCapture(e.pointerId)) el.setPointerCapture(e.pointerId);
        go(t.current.x + dx, t.current.y + dy, t.current.s);
      } else if (pts.size === 2) {
        const [a, b] = [...pts.values()];
        const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2], d = Math.hypot(a[0] - b[0], a[1] - b[1]);
        if (last) {
          const { x, y, s } = t.current, ns = Math.min(MAX, Math.max(t.current.fit, s * (d / last.d))), r = ns / s;
          go(mid[0] - (last.mid[0] - x) * r, mid[1] - (last.mid[1] - y) * r, ns);
        }
        last = { d, mid };
        moved = 99;
      }
    };
    const up = (e) => { pts.delete(e.pointerId); last = null; };
    const click = (e) => { if (moved > 6) { e.stopPropagation(); e.preventDefault(); } };
    const wheel = (e) => {
      if (!e.ctrlKey && !e.metaKey) return; // oddiy g'ildirak sahifani aylantiradi
      e.preventDefault();
      const [px, py] = rel(e);
      zoomAt(px, py, Math.exp(-e.deltaY * 0.01));
    };
    const dbl = (e) => { const [px, py] = rel(e); zoomAt(px, py, 1.8, true); };
    el.addEventListener("pointerdown", down);
    el.addEventListener("pointermove", move);
    el.addEventListener("pointerup", up);
    el.addEventListener("pointercancel", up);
    el.addEventListener("click", click, true);
    el.addEventListener("wheel", wheel, { passive: false });
    el.addEventListener("dblclick", dbl);
    return () => {
      el.removeEventListener("pointerdown", down);
      el.removeEventListener("pointermove", move);
      el.removeEventListener("pointerup", up);
      el.removeEventListener("pointercancel", up);
      el.removeEventListener("click", click, true);
      el.removeEventListener("wheel", wheel);
      el.removeEventListener("dblclick", dbl);
    };
  }, [go, zoomAt]);

  const btn = (k) => () => { const el = box.current; zoomAt(el.clientWidth / 2, el.clientHeight / 2, k, true); };

  return (
    <div className="pv" ref={box} data-zoomed="0">
      <div className="pv__world" ref={world} style={{ width: ww, height: wh }}>
        <img key={plan.src} src={plan.src} width={ww} height={wh} alt="Qavat rejasi (arxitektura chizmasi)" draggable={false} decoding="async" ref={(el) => { if (el && el.complete && el.naturalWidth) el.classList.add("is-in"); }} onLoad={(e) => e.currentTarget.classList.add("is-in")} />
      </div>
      <div className="pv__pins">
        {apts.filter((a) => plan.apts[a.n]).map((a) => {
          const [px, py] = plan.apts[a.n].pin;
          return (
            <button key={a.n} type="button" className={"pin" + (selected === a.n ? " is-active" : "") + (dim && dim(a) ? " is-dim" : "")} style={{ "--px": px, "--py": py }}
              aria-label={`${a.n}-xonadon, ${a.rc} xonali`} aria-pressed={selected === a.n} onClick={() => onPick(a.n)}>
              <b>{a.n}</b><span>{a.rc} xonali</span>
            </button>
          );
        })}
      </div>
      <div className="pv__tools">
        <button type="button" onClick={btn(1.5)} aria-label="Kattalashtirish">+</button>
        <button type="button" onClick={btn(1 / 1.5)} aria-label="Kichiklashtirish">−</button>
        <button type="button" className="pv__all" onClick={() => go(0, 0, t.current.fit, true)}>Butun qavat</button>
      </div>
    </div>
  );
}
