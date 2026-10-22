import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Selector from "@/components/Selector";
import LeadForm from "@/components/LeadForm";
import { BLOCKS, ALL_APTS, fmtN } from "@/lib/data";

const I = {
  car: <><path d="M5 17h14M6 17v2m12-2v2M4 13l2-5h12l2 5v4H4z" /><circle cx="8" cy="14.5" r=".8" /><circle cx="16" cy="14.5" r=".8" /></>,
  shop: <><path d="M4 9l1.5-5h13L20 9M4 9v11h16V9M4 9h16" /><path d="M10 20v-6h4v6" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  lift: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="M9 9l1.5-2L12 9M12 15l1.5 2 1.5-2M12 3v18" /></>,
  wall: <><path d="M3 6h18M3 12h18M3 18h18M8 6v6M16 6v6M12 12v6M6 18v3M18 18v3" /></>,
  kitchen: <><path d="M6 3v7a2 2 0 004 0V3M8 10v11M17 21V3c-2 1-3 4-3 8h3" /></>,
  plan: <><rect x="3" y="3" width="18" height="18" rx="1" /><path d="M3 12h7v9M14 3v7h7M14 14h3" /></>,
};

// Hammasi lib/data.js dan hisoblanadi — chizma o'zgarsa matn ham o'zgaradi
const infoOf = (re) => BLOCKS.flatMap((b) => b.floors.filter((f) => f.k === "-1").flatMap((f) => f.info.filter(([n]) => re.test(n)).map(([, a]) => `${b.id}-blok ${fmtN(a)} m²`)));
const shops = BLOCKS.filter((b) => b.floors.some((f) => f.k === "1" && f.info)).map((b) => b.id);
const bigKitchen = ALL_APTS.filter((a) => a.rooms.some((r) => r.t === "o" && r.a >= 20)).length;

const FEATURES = [
  ["car", "Yer osti avtoturargohi va garaj", infoOf(/Avtoturargoh|Garaj/).join(" · "), "Podval"],
  ["sun", "Penthaus qavatlar", `Har blokda penthaus qavat: ${BLOCKS.reduce((s, b) => s + (b.floors.find((f) => f.k === "P")?.apts?.length || 0), 0)} ta xonadon`, "Penthaus"],
  ["kitchen", "Keng oshxonalar", `${bigKitchen} ta xonadonda oshxona 20 m² dan katta`, "Reja"],
  ["shop", "Birinchi qavatda tijorat", `Do'kon va savdo maydonlari ${shops.join(", ")}-bloklarda`, "1-qavat"],
  ["lift", "Har podyezdda lift", "Har podyezd lift va zinapoya bilan", "Podyezd"],
  ["wall", "Issiq devor", "Tashqi devor 400 mm g'isht + 100 mm mineral paxta", "Konstruksiya"],
  ["plan", "Haqiqiy rejalar", "Har bir xonadon rejasi arxitektura chizmasidan, xona maydonlari bilan", "Loyiha"],
];

const BLOCK_STATS = BLOCKS.map((b) => {
  const apts = b.floors.flatMap((f) => f.apts || []);
  const ph = b.floors.find((f) => f.k === "P");
  return { id: b.id, tag: b.tag, n: apts.length, floors: b.floors.length, ph: ph?.apts?.length || 0, min: Math.min(...apts.map((a) => a.area)), max: Math.max(...apts.map((a) => a.area)) };
});
const maxN = Math.max(...BLOCK_STATS.map((b) => b.n));

const STEPS = [
  ["Tanlang", "Blok va qavatni tanlab, xonadonning haqiqiy rejasini ko'ring."],
  ["Ariza qoldiring", "Tanlangan xonadon formaga o'zi tushadi."],
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

        <Selector />

        <section className="section section--dark" id="bloklar">
          <div className="dark-orb" aria-hidden="true" />
          <div className="container">
            <div className="section__head">
              <div className="eyebrow eyebrow--light" data-r>{BLOCKS.length} ta blok · {ALL_APTS.length} ta xonadon</div>
              <h2 className="h2" data-r style={{ "--d": ".08s" }}>Har bir blokning <em>o'z xarakteri</em></h2>
            </div>
            <div className="near">
              {BLOCK_STATS.map((b, i) => (
                <a key={b.id} href="#tanlash" className="near__item" data-r style={{ "--d": `${i * 0.07}s`, "--w": `${Math.round((b.n / maxN) * 100)}%` }}>
                  <span className="near__icon">{b.id}<small>-blok</small></span>
                  <span className="near__name">{b.tag}</span>
                  <span className="near__time"><span data-count={b.n}>0</span> <small>xonadon</small></span>
                  <span className="near__meta">{b.ph} penthaus · {Math.round(b.min)}–{Math.round(b.max)} m²</span>
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

        <section className="section" id="qulayliklar">
          <div className="container">
            <div className="section__head">
              <div className="eyebrow" data-r>Qulayliklar</div>
              <h2 className="h2" data-r style={{ "--d": ".08s" }}>Chizmalarda <em>nima bor</em></h2>
              <p className="lead-text" data-r style={{ "--d": ".16s" }}>Ma'lumotlar «Universal Proekt Plyus» MChJ arxitektura chizmalaridan. Narx, to'lov jadvali va topshirish muddatini sotuv bo'limi aytadi.</p>
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
              <p className="lead-text" data-r style={{ "--d": ".16s" }}>Tanlagan xonadoningiz formaga o'zi tushadi. Menejer qo'ng'iroq qilib, narx, to'lov shartlari va bo'sh qavatlarni aytadi.</p>
              <div className="addr">
                <div data-r style={{ "--d": ".2s" }}><span>Manzil</span>Samarqand shahri, Xo'ja Ahror Valiy MFY, Muqimiy ko'chasi, 48</div>
                {tel && <div data-r style={{ "--d": ".26s" }}><span>Telefon</span><a href={`tel:${tel.replace(/\s/g, "")}`}>{tel}</a></div>}
                {tg && <div data-r style={{ "--d": ".32s" }}><span>Telegram</span><a href={`https://t.me/${tg.replace("@", "")}`} target="_blank" rel="noopener">@{tg.replace("@", "")}</a></div>}
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
          <span>© 2026 Tamerlan · Samarqand</span>
        </div>
      </footer>
      <a className="mcta btn btn--gold btn--shine" href="#ariza">Narxini bilish</a>
    </>
  );
}
