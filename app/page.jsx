import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Selector from "@/components/Selector";
import LeadForm from "@/components/LeadForm";
import Viewer3D from "@/components/Viewer3D";
import { BLOCKS, fmtN } from "@/lib/data";

const I = {
  car: <><path d="M5 17h14M6 17v2m12-2v2M4 13l2-5h12l2 5v4H4z" /><circle cx="8" cy="14.5" r=".8" /><circle cx="16" cy="14.5" r=".8" /></>,
  pool: <><path d="M3 18c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0M3 14c2 1.3 4 1.3 6 0s4-1.3 6 0 4 1.3 6 0" /><path d="M8 12V5a2 2 0 014 0M16 12V5a2 2 0 00-4 0" /></>,
  garage: <><path d="M3 20V9l9-5 9 5v11" /><path d="M7 20v-7h10v7M7 16h10" /></>,
  shop: <><path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16" /><path d="M10 20v-6h4v6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  lift: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 9l1.5-2L12 9M12 15l1.5 2 1.5-2M12 3v18" /></>,
  wall: <><path d="M3 6h18M3 12h18M3 18h18M8 6v6M16 6v6M12 12v6M6 18v3M18 18v3" /></>,
  kitchen: <><path d="M6 3v7a2 2 0 004 0V3M8 10v11M17 21V3c-2 1-3 4-3 8h3" /></>,
};

const FEATURES = [
  ["car", "Yer osti avtoturargohi", "1-blok 532,80 m² · 2-blok 494,70 m² · 3-blok 485,20 m² · 8-blok 309,40 m²", "Podval"],
  ["pool", "Basseyn va dam olish zonasi", "4-blok podvalida: basseyn 94,59 m², dam olish zonasi 42,77 m²", "4-blok"],
  ["garage", "Garaj", "6-blok podvalida 177,50 m² garaj", "6-blok"],
  ["shop", "Birinchi qavatda tijorat", "Do'kon va savdo maydonlari 1, 2, 3, 5, 6 va 8-bloklarda", "1-qavat"],
  ["sun", "Terrasali penthauslar", "Har blokda penthaus qavat, terrasa maydoni 76,80 m² gacha", "Penthaus"],
  ["lift", "Har podyezdda lift", "Har podyezd lift va zinapoya bilan jihozlangan", "Podyezd"],
  ["wall", "Issiq devor", "Tashqi devor 400 mm g'isht va 100 mm mineral paxta issiqlik izolyatsiyasi", "Konstruksiya"],
  ["kitchen", "Keng oshxonalar", "Ko'p xonadonlarda oshxona 20–30 m², katta oilaviy dasturxon uchun yetadi", "Reja"],
];

const TICKER = ["Yer osti avtoturargohi", "Basseyn", "Terrasali penthauslar", "Har podyezdda lift", "Issiq devor", "Keng oshxonalar", "Xonadonlar 3D ko'rinishda", "1-qavatda tijorat"];

const featured = BLOCKS.find((b) => b.id === 4).floors.find((f) => f.k === "2").apts.find((a) => a.n === 3);

const BLOCK_STATS = BLOCKS.map((b) => {
  const apts = b.floors.flatMap((f) => f.apts || []);
  const ph = b.floors.find((f) => f.k === "P");
  return { id: b.id, tag: b.tag, n: apts.length, floors: b.floors.length, ph: ph?.apts?.length || 0, max: Math.max(...apts.map((a) => a.area)), ter: Math.max(...apts.map((a) => a.ter)) };
});
const maxN = Math.max(...BLOCK_STATS.map((b) => b.n));

const STEPS = [
  ["Tanlang", "Blok, qavat va xonadonni 3D maketda ko'rib chiqing."],
  ["Ariza qoldiring", "Tanlangan xonadon formaga avtomatik qo'shiladi."],
  ["Narxni biling", "Menejer qo'ng'iroq qilib, narx va to'lov shartlarini aytadi."],
  ["Joyida ko'ring", "Sotuv bo'limida chizmalar bilan tanishib, shartnoma tuzing."],
];

const Ico = ({ k }) => <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{I[k]}</svg>;

export default function Page() {
  const tel = process.env.NEXT_PUBLIC_PHONE, tg = process.env.NEXT_PUBLIC_TELEGRAM;
  return (
    <>
      <Header />
      <main>
        <Hero />

        <div className="ticker" aria-hidden="true">
          <div className="ticker__track">
            {[0, 1, 2].map((k) => <span key={k}>{TICKER.map((t) => <span key={t}><i>✦</i>{t}</span>)}</span>)}
          </div>
        </div>

        <section className="section" id="majmua">
          <div className="container split">
            <div>
              <div className="eyebrow" data-r>Majmua haqida</div>
              <h2 className="h2" data-r style={{ "--d": ".08s" }}>Chizmalarda <em>nima bor</em></h2>
              <p className="lead-text" data-r style={{ "--d": ".16s" }}>Quyidagi ma'lumotlar «Universal Proekt Plyus» MChJ ishlab chiqqan arxitektura chizmalaridan olingan. Narx, to'lov jadvali va topshirish muddatini sotuv bo'limi aytib beradi.</p>
              <ul className="inside">
                {FEATURES.slice(0, 6).map(([, b], i) => <li key={b} data-r style={{ "--d": `${0.2 + i * 0.06}s` }}><i>✓</i>{b}</li>)}
              </ul>
              <a className="btn btn--green btn--shine" href="#tanlash" style={{ marginTop: 32 }} data-r>Xonadonlarni ko'rish →</a>
            </div>
            <div className="show" data-r style={{ "--d": ".1s" }}>
              <div className="show__stage" data-tilt="5">
                <div className="stage nolabels"><Viewer3D apt={featured} labels={false} /></div>
                <div className="tilt-glare" />
              </div>
              <div className="show__chip"><b>{fmtN(featured.area)} m²</b><span>4-blok · 2-qavat · {featured.rc} xonali</span></div>
              <div className="show__hint">↻ Aylantirish uchun suring</div>
            </div>
          </div>
        </section>

        <Selector />

        <section className="section section--dark" id="bloklar">
          <div className="dark-orb" aria-hidden="true" />
          <div className="container">
            <div className="section__head">
              <div className="eyebrow eyebrow--light" data-r>{BLOCKS.length} ta blok</div>
              <h2 className="h2" data-r style={{ "--d": ".08s" }}>Har bir blokning <em>o'z xarakteri</em></h2>
              <p className="lead-text" data-r style={{ "--d": ".16s" }}>Avtoturargohli, basseynli yoki katta terrasali — o'zingizga mos blokni tanlang.</p>
            </div>
            <div className="near">
              {BLOCK_STATS.map((b, i) => (
                <a key={b.id} href="#tanlash" className="near__item" data-r style={{ "--d": `${i * 0.07}s`, "--w": `${Math.round((b.n / maxN) * 100)}%` }}>
                  <span className="near__icon">{b.id}<small>-blok</small></span>
                  <span className="near__name">{b.tag}</span>
                  <span className="near__time"><span data-count={b.n}>0</span> <small>xonadon</small></span>
                  <span className="near__meta">{b.floors} qavat · {b.ph} penthaus · {Math.round(b.max)} m² gacha</span>
                  <span className="near__bar" />
                </a>
              ))}
              <a href="#ariza" className="near__item near__item--cta" data-r style={{ "--d": `${BLOCKS.length * 0.07}s` }}>
                <span className="near__name">Qaysi blok sizga mos?</span>
                <span className="near__meta">Menejer bo'sh xonadonlarni aytib beradi</span>
                <span className="btn btn--gold btn--sm">Maslahat olish →</span>
              </a>
            </div>
          </div>
        </section>

        <section className="genplan" aria-label="Iqtibos">
          <div className="parallax" data-px="120" aria-hidden="true"><div className="genplan__art" /></div>
          <div className="genplan__overlay">
            <div className="container">
              <p className="genplan__quote" data-r>Har bir xonadon — <em>chizmadagi aniq maydonlar</em> bilan, uyga kirmasdan oldin ichidan ko'ring.</p>
            </div>
          </div>
        </section>

        <section className="section" id="qulayliklar">
          <div className="container">
            <div className="section__head">
              <div className="eyebrow" data-r>Qulayliklar</div>
              <h2 className="h2" data-r style={{ "--d": ".08s" }}>Kundalik hayot <em>uchun hammasi</em></h2>
            </div>
            <div className="perks">
              {FEATURES.map(([k, b, s, n], i) => (
                <div key={b} className="perk" data-r style={{ "--d": `${(i % 4) * 0.08}s` }}>
                  <div className="perk__icon"><Ico k={k} /></div>
                  <span className="tag tag--green">{n}</span>
                  <h3>{b}</h3>
                  <p>{s}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--cream steps-s">
          <div className="container">
            <div className="section__head">
              <div className="eyebrow" data-r>Qanday sotib olinadi</div>
              <h2 className="h2" data-r style={{ "--d": ".08s" }}>4 qadam — <em>yangi uyingizgacha</em></h2>
            </div>
            <ol className="steps">
              {STEPS.map(([t, s], i) => (
                <li key={t} data-r style={{ "--d": `${i * 0.12}s` }}>
                  <span className="steps__n">0{i + 1}</span>
                  <h3>{t}</h3>
                  <p>{s}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section section--dark contact" id="ariza">
          <div className="dark-orb dark-orb--l" aria-hidden="true" />
          <div className="container split split--top">
            <div>
              <div className="eyebrow eyebrow--light" data-r>Bog'lanish</div>
              <h2 className="h2" data-r style={{ "--d": ".08s" }}>Narx va bo'sh <em>xonadonlarni</em> bilib oling</h2>
              <p className="lead-text" data-r style={{ "--d": ".16s" }}>Tanlagan xonadoningiz avtomatik qo'shiladi. Menejer qo'ng'iroq qilib, narx, to'lov shartlari va bo'sh qavatlar haqida ma'lumot beradi.</p>
              <div className="addr">
                <div data-r style={{ "--d": ".2s" }}><span>Manzil</span>Samarqand shahri, Xo'ja Ahror Valiy MFY, Muqimiy ko'chasi, 48</div>
                {tel && <div data-r style={{ "--d": ".26s" }}><span>Telefon</span><a href={`tel:${tel.replace(/\s/g, "")}`}>{tel}</a></div>}
                {tg && <div data-r style={{ "--d": ".32s" }}><span>Telegram</span><a href={`https://t.me/${tg.replace("@", "")}`} target="_blank" rel="noopener">@{tg.replace("@", "")}</a></div>}
                <div data-r style={{ "--d": ".38s" }}><span>Buyurtmachi</span>«BOULEVARD CITY» MChJ</div>
              </div>
              <a className="btn btn--glass" href="https://www.google.com/maps/search/?api=1&query=Samarqand%2C%20Muqimiy%20ko%27chasi%2048" target="_blank" rel="noopener" style={{ marginTop: 28 }} data-r>Google xaritada ochish ↗</a>
            </div>
            <div data-r style={{ "--d": ".12s" }}><LeadForm /></div>
          </div>
        </section>
      </main>
      <footer className="footer">
        <div className="container footer__row">
          <a className="logo" href="#top"><span className="logo__mark" aria-hidden="true"><i /><i /><i /></span><span className="logo__txt">TAMERLAN</span></a>
          <span>© 2026 Boulevard City · Samarqand</span>
          <span>Loyihachi: «Universal Proekt Plyus» MChJ</span>
        </div>
      </footer>
      <a className="mcta btn btn--gold btn--shine" href="#ariza">Narxini bilish</a>
    </>
  );
}
