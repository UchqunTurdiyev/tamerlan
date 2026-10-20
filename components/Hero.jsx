"use client";
import Viewer3D from "./Viewer3D";
import { BLOCKS, ALL_APTS, fmtN } from "@/lib/data";

const featured = BLOCKS.find((b) => b.id === 4).floors.find((f) => f.k === "2").apts.find((a) => a.n === 3);
const areas = ALL_APTS.map((a) => a.area);
const STATS = [
  [ALL_APTS.length, "xonadon chizmalarda"],
  [BLOCKS.length, "blok"],
  [`${fmtN(Math.min(...areas))}–${Math.round(Math.max(...areas))}`, "m², xonadon maydoni"],
  [fmtN(Math.max(...ALL_APTS.map((a) => a.ter))), "m² gacha terrasa"],
];

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="wrap">
        <div>
          <div className="eyebrow">Samarqand · Muqimiy ko'chasi, 48</div>
          <h1>Boulevard <em>City</em></h1>
          <p className="lead">Podval avtoturargohi, basseyn va terrasali penthauslarga ega turar joy majmuasi. Har bir xonadonni loyiha chizmasidagi maydonlar asosida 3D ko'rinishda, ichidan ko'ring.</p>
          <div className="cta">
            <a className="btn btn-p" href="#tanlash">Xonadonni 3D ko'rish</a>
            <a className="btn btn-g" href="#ariza">Narx va to'lov shartlari</a>
          </div>
          <div className="stats">
            {STATS.map(([b, s]) => <div key={s}><b>{b}</b><span>{s}</span></div>)}
          </div>
        </div>
        <div className="hero-stage stage" aria-label="Namunaviy xonadonning 3D maketi">
          <Viewer3D apt={featured} labels={false} />
          <div className="hero-cap"><span>4-blok · 2-qavat · {featured.rc} xonali · {fmtN(featured.area)} m²</span><span>Aylantirish uchun suring</span></div>
        </div>
      </div>
    </section>
  );
}
