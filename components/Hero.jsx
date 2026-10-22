import LeadForm from "./LeadForm";
import { BLOCKS, ALL_APTS } from "@/lib/data";

const areas = ALL_APTS.map((a) => a.area);
const maxBal = Math.max(...ALL_APTS.map((a) => a.rooms.filter((r) => r.t === "bl").reduce((s, r) => s + r.a, 0)));
const STATS = [
  [<span key="a" data-count={ALL_APTS.length}>0</span>, "xonadon chizmalarda"],
  [<span key="b" data-count={BLOCKS.length}>0</span>, "turar joy bloki"],
  [`${Math.round(Math.min(...areas))}–${Math.round(Math.max(...areas))}`, "m², xonadon maydoni"],
  [<span key="d" data-count={maxBal} data-dec="2">0</span>, "m² gacha balkon"],
];

// Fon: chizilgan shahar silueti, binolar pastdan o'sib chiqadi, derazalarda chiroq yonadi
const rnd = (s) => () => ((s = (s * 16807) % 2147483647) / 2147483647);
const r = rnd(7);
const TOWERS = [];
for (let x = 0; x < 1440;) {
  const w = 60 + Math.floor(r() * 70), h = 120 + Math.floor(r() * 260);
  TOWERS.push({ x, w, h, d: (TOWERS.length % 9) * 0.09 });
  x += w + 10 + Math.floor(r() * 26);
}
const WINDOWS = [];
TOWERS.forEach((t, ti) => {
  for (let y = 520 - t.h + 18; y < 500; y += 26) for (let x = t.x + 10; x < t.x + t.w - 14; x += 18) if (r() < 0.16) WINDOWS.push({ x, y, d: (r() * 6).toFixed(2), ti });
});

function Skyline() {
  return (
    <svg className="hero__city" viewBox="0 0 1440 520" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
      <defs>
        <linearGradient id="tw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0a6b5e" stopOpacity=".55" /><stop offset="1" stopColor="#032a25" stopOpacity=".95" /></linearGradient>
      </defs>
      {TOWERS.map((t, i) => (
        <g key={i} className="tw" style={{ "--d": `${t.d}s` }}>
          <rect x={t.x} y={520 - t.h} width={t.w} height={t.h} rx="3" fill="url(#tw)" stroke="rgba(255,255,255,.08)" />
          <rect x={t.x} y={520 - t.h} width={t.w} height="3" fill="rgba(255,187,77,.35)" />
        </g>
      ))}
      {WINDOWS.map((w, i) => <rect key={i} className="win" x={w.x} y={w.y} width="8" height="12" rx="1" style={{ "--d": `${w.d}s` }} />)}
    </svg>
  );
}

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="hero__bg" aria-hidden="true"><div className="hero__grid-lines" /><Skyline /></div>
      <div className="hero__shade" aria-hidden="true" />
      <div className="hero__leaf" aria-hidden="true" />
      <div className="hero__leaf hero__leaf--2" aria-hidden="true" />
      <div className="container">
        <div className="hero__grid">
          <div>
            <div className="eyebrow eyebrow--light hero__eyebrow"><span className="pulse-dot" />Samarqand · Muqimiy ko'chasi, 48</div>
            <h1 className="hero__title">
              {["Bulvar", "maydondan"].map((w, i) => <span key={w} className="word-mask"><span style={{ "--i": i }}>{w}</span></span>)}
              <span className="word-mask"><span style={{ "--i": 2 }} className="accent">300 metr</span></span>
              {["masofada", "joylashgan", "premium", "uylar"].map((w, i) => <span key={w} className="word-mask"><span style={{ "--i": 3 + i }}>{w}</span></span>)}
            </h1>
            <p className="hero__urge"><span className="pulse-dot" />Sotib olishga ulgurib qoling</p>
            <p className="hero__lead">Tamerlan — yer osti avtoturargohi, garaj va penthaus qavatlar.</p>
            <div className="hero__actions">
              <a className="btn btn--gold btn--lg btn--shine" href="#tanlash">Xonadonni 3D da ko'rish <span aria-hidden="true">→</span></a>
              <a className="btn btn--glass btn--lg" href="#ariza">Narx va to'lov shartlari</a>
            </div>
          </div>
          <div className="hero__form">
            <div className="hero__badge"><span>{ALL_APTS.length} ta xonadon</span>Har biri 3D maketda</div>
            <LeadForm variant="card" />
          </div>
        </div>
        <div className="hero__stats">
          {STATS.map(([b, s], i) => <div key={s} className="stat" data-r style={{ "--d": `${0.2 + i * 0.1}s` }}><b>{b}</b><span>{s}</span></div>)}
        </div>
      </div>
      <a className="scroll-cue" href="#tanlash" aria-label="Pastga"><span /></a>
    </section>
  );
}
