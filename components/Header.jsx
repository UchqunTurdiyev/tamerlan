"use client";
import { useEffect, useState } from "react";

const LINKS = [["#tanlash", "Xonadonlar"], ["#bloklar", "Bloklar"], ["#qulayliklar", "Qulayliklar"], ["#ariza", "Bog'lanish"]];

export default function Header() {
  const [open, setOpen] = useState(false);
  const tel = process.env.NEXT_PUBLIC_PHONE;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const esc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open]);

  return (
    <header className={"header" + (open ? " is-open" : "")}>
      <div className="container header__row">
        <a className="logo" href="#top" aria-label="Tamerlan">
          <span className="logo__mark" aria-hidden="true"><i /><i /><i /></span>
          <span className="logo__txt">TAMERLAN</span>
        </a>
        <nav className="header__nav" aria-label="Bo'limlar">
          {LINKS.map(([h, t]) => <a key={h} href={h}>{t}</a>)}
        </nav>
        {tel && <a className="header__phone" href={`tel:${tel.replace(/\s/g, "")}`}><span className="pulse-dot" />{tel}</a>}
        <a className="btn btn--gold btn--sm btn--shine header__cta" href="#ariza">Narxini bilish</a>
        <button type="button" className="burger" aria-label="Menyu" aria-expanded={open} onClick={() => setOpen(!open)}><span /><span /></button>
      </div>
      {open && (
        <nav className="mnav" aria-label="Mobil menyu">
          {LINKS.map(([h, t], i) => <a key={h} href={h} style={{ "--i": i }} onClick={() => setOpen(false)}>{t}</a>)}
          <a className="btn btn--gold btn--block" href="#ariza" onClick={() => setOpen(false)}>Narxini bilish</a>
        </nav>
      )}
      <div className="progress" aria-hidden="true" />
    </header>
  );
}
