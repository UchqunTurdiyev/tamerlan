"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import PlanViewer from "./PlanViewer";
import Plan3D from "./Plan3D";
import { BLOCKS, ALL_APTS, RN, KIND, fmtN } from "@/lib/data";
import PLANS from "@/lib/plans.json";
import { track } from "@/lib/pixel";

const r2 = (n) => Math.round(n * 100) / 100;
const RC_OPTS = [[0, "Hammasi"], [1, "1"], [2, "2"], [3, "3"], [4, "4+"]];
const rcOf = (a) => Math.min(4, a.rc);
const firstFloor = (b) => b.floors.find((x) => x.k === "2") || b.floors.find((x) => x.apts);
const balc = (a) => r2(a.rooms.filter((r) => r.t === "bl").reduce((s, r) => s + r.a, 0));
// xonadon turlari: necha xonali — nechta, qancha maydon
const TYPES = [1, 2, 3, 4].map((k) => {
  const l = ALL_APTS.filter((a) => rcOf(a) === k);
  return { k, n: l.length, min: Math.min(...l.map((a) => a.area)), max: Math.max(...l.map((a) => a.area)) };
}).filter((t) => t.n);
const webgl = () => { try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch (e) { return false; } };

export function pickApt(text, rooms) {
  window.dispatchEvent(new CustomEvent("bc:apt", { detail: { text, rooms } }));
  document.getElementById("ariza")?.scrollIntoView({ behavior: "smooth" });
}

export default function Selector() {
  const [block, setBlock] = useState(BLOCKS[0]);
  const [floor, setFloor] = useState(firstFloor(BLOCKS[0]));
  const [rc, setRc] = useState(0);
  const [n, setN] = useState(null);
  const [mode, setMode] = useState("3d");
  useEffect(() => { if (!webgl()) setMode("2d"); }, []);
  const seen = useRef(new Set());

  const apts = floor.apts || [];
  const list = useMemo(() => apts.filter((a) => !rc || rcOf(a) === rc), [apts, rc]);
  const hasRc = useMemo(() => new Set(apts.map(rcOf)), [apts]);
  const apt = apts.find((a) => a.n === n) || null;
  const plan = PLANS[`${block.id}-${floor.k}`];

  const chooseFloor = (f) => {
    setFloor(f);
    if (rc && !(f.apts || []).some((a) => rcOf(a) === rc)) setRc(0);
    setN(null);
  };
  const chooseBlock = (b) => { setBlock(b); chooseFloor(firstFloor(b)); };
  const chooseRc = (v) => { setRc(v); if (apt && v && rcOf(apt) !== v) setN(null); };
  // tur kartasi: joriy qavatda bunday xonadon bo'lmasa, bor joyga o'tamiz
  const has = (f, v) => (f.apts || []).some((a) => rcOf(a) === v);
  const chooseType = (v) => {
    if (!v || has(floor, v)) return chooseRc(v);
    const b = (block.floors.some((f) => has(f, v)) ? block : BLOCKS.find((x) => x.floors.some((f) => has(f, v))));
    const f = b.floors.find((x) => has(x, v));
    setBlock(b); setFloor(f); setRc(v); setN(null);
  };

  const aptTitle = apt ? `${block.id}-blok, ${floor.label}, ${apt.n}-xonadon` : "";

  // Mijoz qaysi xonadonni ko'rganini Meta'ga ViewContent sifatida yuborish
  useEffect(() => {
    if (!apt || seen.current.has(aptTitle)) return;
    seen.current.add(aptTitle);
    track("ViewContent", { content_name: aptTitle, content_category: `${apt.rc} xonali`, content_ids: [`${block.id}-${floor.k}-${apt.n}`], content_type: "home_listing" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aptTitle]);

  const info = !floor.apts;
  const infoTotal = info ? r2(floor.info.reduce((s, i) => s + i[1], 0)) : 0;

  return (
    <section className="section section--cream sel" id="tanlash">
      <div className="container">
        <div className="sel-head">
          <div data-r>
            <div className="eyebrow">Xonadonlar · 3D · haqiqiy rejalar</div>
            <h2 className="h2">Blok, qavat va <em>xonadonni</em> tanlang</h2>
          </div>
          <p className="lead-text" data-r style={{ "--d": ".1s" }}>Xonadonni tanlang — 3D maketda faqat shu xonadon qoladi: har bir xonasi, balkoni, deraza va eshiklari bilan.</p>
        </div>

        <div className="types" role="group" aria-label="Xonadon turlari" data-r>
          {TYPES.map((t) => (
            <button key={t.k} type="button" className={"type" + (rc === t.k ? " is-active" : "")} aria-pressed={rc === t.k} onClick={() => chooseType(rc === t.k ? 0 : t.k)}>
              <b>{t.k === 4 ? "4+" : t.k} xonali</b>
              <span>{t.n} ta · {Math.round(t.min)}–{Math.round(t.max)} m²</span>
            </button>
          ))}
        </div>

        <div className="blocks" role="group" aria-label="Bloklar" data-r>
          {BLOCKS.map((b) => (
            <button key={b.id} type="button" className={"blk" + (block === b ? " is-active" : "")} aria-pressed={block === b} onClick={() => chooseBlock(b)}>
              <b>{b.id}-blok</b><span>{b.tag}</span>
            </button>
          ))}
        </div>

        <div className="grid">
          <div className="side" data-r>
            <div>
              <div className="lbl-s">Qavat</div>
              <div className="pills" role="group" aria-label="Qavatlar">
                {block.floors.map((f) => (
                  <button key={f.k} type="button" className={"pill" + (floor === f ? " is-active" : "")} aria-pressed={floor === f} onClick={() => chooseFloor(f)}>{f.label}</button>
                ))}
              </div>
            </div>
            {!info && (
              <div>
                <div className="lbl-s">Xonalar soni</div>
                <div className="pills" role="group" aria-label="Xonalar soni">
                  {RC_OPTS.map(([v, t]) => (
                    <button key={v} type="button" className={"pill" + (rc === v ? " is-active" : "")} aria-pressed={rc === v} disabled={v !== 0 && !hasRc.has(v)} onClick={() => chooseRc(v)}>{v ? `${t} xonali` : t}</button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <div className="lbl-s">{info ? "Bu qavatda" : `Xonadonlar · ${list.length} ta`}</div>
              {info ? (
                <table className="ex"><tbody>
                  {floor.info.map((i, k) => <tr key={k}><td>{k + 1}</td><td>{i[0]}</td><td>{fmtN(i[1])} m²</td></tr>)}
                  {floor.info.length > 1 && <tr className="tot"><td></td><td>Jami</td><td>{fmtN(infoTotal)} m²</td></tr>}
                </tbody></table>
              ) : (
                <div className="cards" key={block.id + floor.k + rc}>
                  {list.map((a, i) => (
                    <button key={a.n} type="button" className="card" style={{ "--i": i }} aria-pressed={n === a.n} onClick={() => setN(n === a.n ? null : a.n)}>
                      <span className="card__n">{a.n}</span>
                      <span><span className="t">{a.rc} xonali</span><br /><span className="s">{a.ter > 0 ? `+ ${fmtN(a.ter)} m² terrasa` : balc(a) > 0 ? "balkon bilan" : " "}</span></span>
                      <span className="a">{fmtN(a.area)} m²</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="main">
            <div className="apt__stage" data-r style={{ "--d": ".1s" }}>
              <div className="stage">
                {plan && !info ? (
                  mode === "3d" && plan.g ? (
                    <Plan3D plan={plan} apts={apts} selected={n} dim={(a) => rc && rcOf(a) !== rc} onPick={(v) => setN(v === n ? null : v)} onFail={() => setMode("2d")} />
                  ) : (
                    <PlanViewer plan={plan} apts={apts} selected={n} dim={(a) => rc && rcOf(a) !== rc} onPick={(v) => setN(v === n ? null : v)} />
                  )
                ) : (
                  <div className="info">
                    <div className="eyebrow">{block.id}-blok · {floor.label}</div>
                    <div className="big">{floor.info.length === 1 ? floor.info[0][0] : "Tijorat va xizmat"}</div>
                    <div className="big big--num">{fmtN(infoTotal)} m²</div>
                    <p>{floor.note} Ijara yoki sotib olish shartlarini sotuv bo'limidan bilib oling.</p>
                    <button type="button" className="btn btn--green" onClick={() => pickApt(`${block.id}-blok, ${floor.label}: ${floor.info.map((i) => i[0]).join(", ")}`, "")}>Ma'lumot olish <span aria-hidden="true">→</span></button>
                  </div>
                )}
                <div className="stage-tag"><span className="pulse-dot" />{block.id}-blok · {floor.label}{apt ? ` · №${apt.n} · ${apt.rc} xonali` : ""}</div>
                {plan && !info && plan.g && (
                  <div className="mode" role="group" aria-label="Ko'rinish">
                    <button type="button" className={mode === "3d" ? "is-active" : ""} aria-pressed={mode === "3d"} onClick={() => setMode("3d")}>3D</button>
                    <button type="button" className={mode === "2d" ? "is-active" : ""} aria-pressed={mode === "2d"} onClick={() => setMode("2d")}>Reja</button>
                  </div>
                )}
              </div>
            </div>

            {apt ? (
              <div className="detail" key={aptTitle}>
                <div className="detail__main">
                  <div className="eyebrow">{block.id}-blok · {floor.label}</div>
                  <h3>{apt.n}-xonadon <small>{apt.rc} xonali</small></h3>
                  <div className="apt__price">
                    <span>Umumiy maydon</span>
                    <b>{fmtN(apt.area)}<em>m²</em></b>
                  </div>
                  <ul className="apt__facts">
                    <li><span>Xonalar</span><b>{apt.rc}</b></li>
                    <li><span>{apt.ter > 0 ? "Terrasa" : "Balkon"}</span><b>{apt.ter > 0 ? `${fmtN(apt.ter)} m²` : balc(apt) > 0 ? `${fmtN(balc(apt))} m²` : "—"}</b></li>
                    <li><span>Qavat</span><b>{floor.k === "P" ? "Penthaus" : floor.k}</b></li>
                  </ul>
                  <button type="button" className="btn btn--gold btn--block btn--shine" onClick={() => pickApt(`${aptTitle} (${fmtN(apt.area)} m²)`, apt.rc >= 4 ? "4 xonali" : `${apt.rc} xonali`)}>Shu xonadon narxini bilish <span aria-hidden="true">→</span></button>
                  {plan && <a className="note note--link" href={plan.src} target="_blank" rel="noopener">Qavat rejasini to'liq o'lchamda ochish ↗</a>}
                </div>
                <div style={{ minWidth: 0 }}>
                  <table className="ex"><caption>Xonalar, m²</caption><tbody>
                    {apt.rooms.filter((r) => r.t !== "t").map((r, i) => (
                      <tr key={i} style={{ "--i": i }}><td>{i + 1}</td><td><span className="dot" style={{ background: `var(--pl-${KIND[r.t]})` }} />{RN[r.t]}</td><td>{fmtN(r.a)}</td></tr>
                    ))}
                    <tr className="tot"><td></td><td>Umumiy maydon</td><td>{fmtN(apt.area)}</td></tr>
                    {apt.rooms.filter((r) => r.t === "t").map((r, i) => (
                      <tr key={"t" + i} className="ter"><td>—</td><td><span className="dot" style={{ background: "var(--pl-out)" }} />Terrasa</td><td>{fmtN(r.a)}</td></tr>
                    ))}
                  </tbody></table>
                </div>
              </div>
            ) : !info && (
              <p className="pick-hint">Rejadagi raqamni yoki chapdagi ro'yxatdan xonadonni tanlang.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
