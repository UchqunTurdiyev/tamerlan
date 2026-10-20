import Hero from "@/components/Hero";
import Selector from "@/components/Selector";
import LeadForm from "@/components/LeadForm";

const FEATURES = [
  ["Yer osti avtoturargohi", "1-blok 532,80 m² · 2-blok 494,70 m² · 3-blok 485,20 m² · 8-blok 309,40 m²", "Podval"],
  ["Basseyn va dam olish zonasi", "4-blok podvalida: basseyn 94,59 m², dam olish zonasi 42,77 m²", "4-blok"],
  ["Garaj", "6-blok podvalida 177,50 m² garaj", "6-blok"],
  ["Birinchi qavatda tijorat", "Do'kon va savdo maydonlari 1, 2, 3, 5, 6 va 8-bloklarda", "1-qavat"],
  ["Terrasali penthauslar", "Har blokda penthaus qavat, terrasa maydoni 76,80 m² gacha", "Penthaus"],
  ["Har podyezdda lift", "Har podyezd lift va zinapoya bilan jihozlangan", "Podyezd"],
  ["Issiq devor", "Tashqi devor 400 mm g'isht va 100 mm mineral paxta issiqlik izolyatsiyasi", "Konstruksiya"],
  ["Keng oshxonalar", "Ko'p xonadonlarda oshxona 20–30 m², katta oilaviy dasturxon uchun yetadi", "Reja"],
];

export default function Page() {
  return (
    <>
      <header className="top">
        <div className="wrap">
          <a className="logo" href="#top">BOULEVARD <span>CITY</span></a>
          <nav className="nav" aria-label="Bo'limlar">
            <a href="#tanlash">Xonadonlar</a>
            <a href="#majmua">Majmua</a>
            <a href="#ariza">Bog'lanish</a>
          </nav>
          <a className="btn btn-p" href="#ariza">Narxini bilish</a>
        </div>
      </header>
      <main>
        <Hero />
        <div className="band" aria-hidden="true" />
        <Selector />
        <section className="cx" id="majmua">
          <div className="wrap">
            <div className="cx-grid">
              <div>
                <div className="eyebrow">Majmua</div>
                <h2 style={{ marginTop: 12 }}>Chizmalarda nima bor</h2>
                <p>Quyidagi ma'lumotlar «Universal Proekt Plyus» MChJ ishlab chiqqan arxitektura chizmalaridan olingan. Narx, to'lov jadvali va topshirish muddatini sotuv bo'limi aytib beradi.</p>
              </div>
              <ul className="feat">
                {FEATURES.map(([b, s, n]) => <li key={b}><span className="num">{n}</span><b>{b}</b><span>{s}</span></li>)}
              </ul>
            </div>
          </div>
        </section>
        <LeadForm />
      </main>
      <footer><div className="wrap"><span>© 2026 Boulevard City · Samarqand</span><span>Loyihachi: «Universal Proekt Plyus» MChJ</span></div></footer>
      <a className="mcta btn btn-p" href="#ariza">Narxini bilish</a>
    </>
  );
}
