"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Viewer3D from "./Viewer3D";
import { BLOCKS, RN, KIND, fmtN } from "@/lib/data";
import { planSVG } from "@/lib/plan";
import { track } from "@/lib/pixel";

const r2 = (n) => Math.round(n * 100) / 100;
const RC_OPTS = [[0, "Hammasi"], [1, "1"], [2, "2"], [3, "3"], [4, "4+"]];
const firstFloor = (b) => b.floors.find((x) => x.k === "2") || b.floors.find((x) => x.apts);

export function pickApt(text, rooms) {
  window.dispatchEvent(new CustomEvent("bc:apt", { detail: { text, rooms } }));
  document.getElementById("ariza")?.scrollIntoView({ behavior: "smooth" });
}

export default function Selector() {
  const [block, setBlock] = useState(BLOCKS[0]);
  const [floor, setFloor] = useState(firstFloor(BLOCKS[0]));
  const [rc, setRc] = useState(0);
  const [apt, setApt] = useState(firstFloor(BLOCKS[0]).apts[0]);
  const [auto, setAuto] = useState(true);
  const [topView, setTopView] = useState(false);
  const [labels, setLabels] = useState(true);
  const viewer = useRef(null);
  const seen = useRef(new Set());

  const list = useMemo(() => (floor.apts || []).filter((a) => !rc || Math.min(4, a.rc) === rc), [floor, rc]);
  const hasRc = useMemo(() => new Set((floor.apts || []).map((a) => Math.min(4, a.rc))), [floor]);

  const chooseFloor = (f, keepRc = rc) => {
    setFloor(f);
    let r = keepRc;
    if (r && !(f.apts || []).some((a) => Math.min(4, a.rc) === r)) r = 0;
    setRc(r);
    const l = (f.apts || []).filter((a) => !r || Math.min(4, a.rc) === r);
    setApt(l[0] || null);
  };
  const chooseBlock = (b) => { setBlock(b); chooseFloor(firstFloor(b)); };
  const chooseRc = (v) => { setRc(v); const l = (floor.apts || []).filter((a) => !v || Math.min(4, a.rc) === v); if (!l.includes(apt)) setApt(l[0] || null); };

  const aptTitle = apt ? `${block.id}-blok, ${floor.label}, ${apt.n}-xonadon` : "";

  // Mijoz qaysi xonadonni ko'rganini Meta'ga ViewContent sifatida yuborish
  useEffect(() => {
    if (!apt) return;
    const key = aptTitle;
    if (seen.current.has(key) || seen.current.size === 0) { seen.current.add(key); return; }
    seen.current.add(key);
    track("ViewContent", { content_name: aptTitle, content_category: `${apt.rc} xonali`, content_ids: [`${block.id}-${floor.k}-${apt.n}`], content_type: "home_listing" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apt]);

  useEffect(() => { setAuto(true); setTopView(false); }, [apt]);

  const toggleAuto = () => { const v = viewer.current; if (!v) return; const on = !auto; v.autoRotate = on; if (on) { v.home(); setTopView(false); } setAuto(on); };
  const toggleTop = () => { const v = viewer.current; if (!v) return; const on = !topView; if (on) v.top(); else v.home(); setTopView(on); setAuto(false); };

  const info = !floor.apts;
  const infoTotal = info ? r2(floor.info.reduce((s, i) => s + i[1], 0)) : 0;

  return (
    <section className="section section--cream sel" id="tanlash">
      <div className="container">
        <div className="sel-head">
          <div data-r>
            <div className="eyebrow">Xonadonlar · 3D</div>
            <h2 className="h2">Blok, qavat va <em>xonadonni</em> tanlang</h2>
          </div>
          <p className="lead-text" data-r style={{ "--d": ".1s" }}>Har bir xonadon loyiha eksplikatsiyasidagi xona maydonlari asosida 3D ko'rinishda ko'rsatiladi. Mebel va xonalar joylashuvi taxminiy, aniq chizma sotuv bo'limida.</p>
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
            <div>
              <div className="lbl-s">Xonalar soni</div>
              <div className="pills" role="group" aria-label="Xonalar soni">
                {RC_OPTS.map(([v, t]) => (
                  <button key={v} type="button" className={"pill" + (rc === v ? " is-active" : "")} aria-pressed={rc === v} disabled={info || (v !== 0 && !hasRc.has(v))} onClick={() => chooseRc(v)}>{t}</button>
                ))}
              </div>
            </div>
            <div>
              <div className="lbl-s">{info ? "Xonadonlar" : `Xonadonlar · ${list.length} ta`}</div>
              <div className="cards" key={block.id + floor.k + rc}>
                {info && <p className="empty">Bu qavatda turar joy yo'q.</p>}
                {list.map((a, i) => (
                  <button key={a.n} type="button" className="card" style={{ "--i": i }} aria-pressed={apt === a} onClick={() => setApt(a)}>
                    <span className="card__plan" dangerouslySetInnerHTML={{ __html: planSVG(a) }} />
                    <span><span className="t">{a.n}-xonadon</span><br /><span className="s">{a.rc} xonali{a.mir ? " · ko'zgu reja" : ""}</span></span>
                    <span className="a">{fmtN(a.area)} m²{a.ter > 0 && <small>+ {fmtN(a.ter)} m² terrasa</small>}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="main">
            <div className="apt__stage" data-r style={{ "--d": ".1s" }}>
              <div className={"stage" + (labels ? "" : " nolabels")}>
                <Viewer3D apt={info ? null : apt} onReady={(v) => (viewer.current = v)} onUser={() => setAuto(false)} />
                <div className="stage-tag"><span className="pulse-dot" />{block.id}-blok · {floor.label}{apt && !info ? ` · №${apt.n}` : ""}</div>
                {!info && (
                  <div className="tools">
                    <button type="button" aria-pressed={auto} className={auto ? "is-active" : ""} onClick={toggleAuto}>Aylantirish</button>
                    <button type="button" aria-pressed={topView} className={topView ? "is-active" : ""} onClick={toggleTop}>Yuqoridan</button>
                    <button type="button" aria-pressed={labels} className={labels ? "is-active" : ""} onClick={() => setLabels(!labels)}>Yorliqlar</button>
                  </div>
                )}
                {!info && <div className="stage-hint">↻ Suring — aylantirish · g'ildirak — yaqinlashtirish</div>}
                {info && (
                  <div className="info">
                    <div className="eyebrow">{block.id}-blok · {floor.label}</div>
                    <div className="big">{floor.info.length === 1 ? floor.info[0][0] : floor.info[0][0].replace(/ \d+$/, "") + "lar"}</div>
                    <div className="big big--num">{fmtN(infoTotal)} m²</div>
                    <p>{floor.note}</p>
                  </div>
                )}
              </div>
            </div>

            {info ? (
              <div className="detail" key={"i" + block.id + floor.k}>
                <div>
                  <div className="eyebrow">{block.id}-blok</div>
                  <h3>{floor.label}</h3>
                  <p className="note" style={{ marginTop: 0 }}>{floor.note} Ijara yoki sotib olish shartlarini sotuv bo'limidan bilib oling.</p>
                  <div style={{ marginTop: 18 }}>
                    <button type="button" className="btn btn--green" onClick={() => pickApt(`${block.id}-blok, ${floor.label}: ${floor.info.map((i) => i[0]).join(", ")}`, "")}>Ma'lumot olish →</button>
                  </div>
                </div>
                <div style={{ minWidth: 0 }}>
                  <table className="ex"><caption>Eksplikatsiya, m²</caption><tbody>
                    {floor.info.map((i, k) => <tr key={k}><td>{k + 1}</td><td>{i[0]}</td><td>{fmtN(i[1])}</td></tr>)}
                    <tr className="tot"><td></td><td>Jami</td><td>{fmtN(infoTotal)}</td></tr>
                  </tbody></table>
                </div>
              </div>
            ) : apt && (
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
                    <li><span>Terrasa</span><b>{apt.ter > 0 ? `${fmtN(apt.ter)} m²` : "—"}</b></li>
                    <li><span>Reja</span><b>{apt.mir ? "Ko'zgu" : "Asosiy"}</b></li>
                  </ul>
                  <button type="button" className="btn btn--gold btn--block btn--shine" onClick={() => pickApt(`${aptTitle} (${fmtN(apt.area)} m²)`, apt.rc >= 4 ? "4 xonali" : `${apt.rc} xonali`)}>Shu xonadon narxini bilish →</button>
                  <p className="note">Maydonlar loyiha eksplikatsiyasidan olingan. 3D maketdagi xonalar joylashuvi va mebel taxminiy.</p>
                </div>
                <div style={{ minWidth: 0 }}>
                  <table className="ex"><caption>Eksplikatsiya, m²</caption><tbody>
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
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
