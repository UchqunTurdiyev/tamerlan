"use client";
import { useEffect, useRef, useState } from "react";
import { RN, fmtN } from "@/lib/data";

// Qavatning 3D ko'rinishi: three.js faqat shu komponent ochilganda yuklanadi
export default function Plan3D({ plan, apts, selected, dim, onPick, onFail }) {
  const host = useRef(null);
  const layer = useRef(null);
  const inst = useRef(null);
  const info = useRef(null);
  const sel = useRef(selected);
  sel.current = selected;
  const [ready, setReady] = useState(false);
  const [rooms, setRooms] = useState([]);

  const boxOf = (n) => {
    const a = n != null && plan.apts[n], s = info.current;
    if (!a || !s) return null;
    const [x, y, w, h] = a.box;
    return [x * s.W, y * s.D, w * s.W, h * s.D];
  };

  useEffect(() => {
    let dead = false;
    import("@/lib/scene3d")
      .then((m) => { if (!dead && host.current) inst.current = m.createScene(host.current); })
      .catch(() => onFail && onFail());
    return () => { dead = true; inst.current && inst.current.destroy(); inst.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    let dead = false;
    setReady(false);
    const wait = () => new Promise((ok) => { const t = setInterval(() => { if (inst.current || dead) { clearInterval(t); ok(); } }, 30); });
    (async () => {
      await wait();
      if (dead || !inst.current) return;
      try {
        const geo = await fetch(plan.g).then((r) => r.json());
        if (dead) return;
        info.current = await inst.current.load(plan, geo);
        if (dead) return;
        setReady(true);
        if (!inst.current.isolate(sel.current, true)) inst.current.focus(boxOf(sel.current), true);
      } catch (e) { onFail && onFail(); }
    })();
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan]);

  // tanlangan xonadon xonalari: nomi va maydoni
  useEffect(() => {
    if (!ready || !info.current) return;
    setRooms(selected == null ? [] : info.current.rooms.filter((r) => r.n === selected && r.t !== "s" && r.t !== "k"));
  }, [ready, selected]);

  // pin va yorliqlar DOM'da, joyi har kadrda sahna tomonidan yangilanadi
  useEffect(() => {
    if (!ready || !inst.current) return;
    const s = info.current;
    const list = [...layer.current.querySelectorAll("[data-n]")].map((el) => { const [px, py] = plan.apts[el.dataset.n].pin; return { el, x: px * s.W, z: py * s.D, y: 3.1 }; });
    layer.current.querySelectorAll("[data-room]").forEach((el, i) => { const r = rooms[i]; if (r) list.push({ el, x: r.x, z: r.z, y: 0.9 }); });
    inst.current.setMarks(list);
  }, [ready, plan, apts, rooms]);

  // xonadon tanlansa — faqat o'zi qoladi; bekor qilinsa — butun qavat
  useEffect(() => {
    if (!ready || !inst.current) return;
    if (!inst.current.isolate(selected)) inst.current.focus(boxOf(selected));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected, ready]);

  return (
    <div className="p3">
      <div ref={host} className="p3__gl" />
      <div ref={layer} className={"p3__pins" + (selected != null ? " has-sel" : "")} style={{ opacity: ready ? 1 : 0 }}>
        {rooms.map((r, i) => (
          <span key={`${selected}-${i}`} data-room className="rlb"><b>{RN[r.t]}</b>{r.a ? <span>{fmtN(r.a)} m²</span> : null}</span>
        ))}
        {apts.filter((a) => plan.apts[a.n] && (selected == null || a.n === selected)).map((a) => (
          <button key={a.n} data-n={a.n} type="button" className={"pin pin--3d" + (selected === a.n ? " is-active" : "") + (dim && dim(a) ? " is-dim" : "")}
            aria-label={`${a.n}-xonadon, ${a.rc} xonali`} aria-pressed={selected === a.n} onClick={() => onPick(a.n)}>
            <b>{a.n}</b><span>{a.rc} xonali</span>
          </button>
        ))}
      </div>
      {!ready && <div className="p3__load"><span className="spin spin--dark" />3D maket yuklanmoqda…</div>}
      <div className="pv__tools">
        <button type="button" onClick={() => inst.current && inst.current.zoom(0.7)} aria-label="Yaqinlashtirish">+</button>
        <button type="button" onClick={() => inst.current && inst.current.zoom(1.4)} aria-label="Uzoqlashtirish">−</button>
        <button type="button" className="pv__all" onClick={() => (selected != null ? onPick(selected) : inst.current && inst.current.focus(null))}>{selected != null ? "← Butun qavat" : "Butun qavat"}</button>
      </div>
    </div>
  );
}
