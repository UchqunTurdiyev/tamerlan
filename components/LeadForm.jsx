"use client";
import { useEffect, useState } from "react";
import { track, getAttribution } from "@/lib/pixel";

const fmtPhone = (raw) => {
  let d = raw.replace(/\D/g, "");
  if (d.startsWith("998")) d = d.slice(3);
  d = d.slice(0, 9);
  const p = [d.slice(0, 2), d.slice(2, 5), d.slice(5, 7), d.slice(7, 9)].filter(Boolean);
  return d ? "+998 " + p.join(" ") : "";
};

const ROOMS = [["1 xonali", "1"], ["2 xonali", "2"], ["3 xonali", "3"], ["4 xonali", "4+"]];

// variant="card" — hero ichidagi qisqa forma; standart — #ariza bo'limidagi to'liq forma (tanlangan xonadon shu yerga tushadi)
export default function LeadForm({ variant }) {
  const full = variant !== "card";
  const idp = full ? "f" : "h";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [apt, setApt] = useState("");
  const [rooms, setRooms] = useState("");
  const [hp, setHp] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    if (!full) return;
    const on = (e) => { setApt(e.detail.text || ""); if (e.detail.rooms) setRooms(e.detail.rooms); setDone(null); setTimeout(() => document.getElementById("fName")?.focus({ preventScroll: true }), 700); };
    window.addEventListener("bc:apt", on);
    return () => window.removeEventListener("bc:apt", on);
  }, [full]);

  const submit = async (e) => {
    e.preventDefault();
    const digits = phone.replace(/\D/g, "");
    if (name.trim().length < 2) return setErr("Ismingizni kiriting.");
    if (digits.length !== 12) return setErr("Telefon raqamini to'liq kiriting: +998 va 9 ta raqam.");
    setErr(""); setBusy(true);
    const eventId = "lead_" + (crypto.randomUUID ? crypto.randomUUID() : Date.now() + "_" + Math.random().toString(36).slice(2));
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: "+" + digits, apt, rooms, website: hp, eventId, url: window.location.href, ...getAttribution() }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || !j.ok) throw new Error(j.error || "xato");
      track("Lead", { content_name: apt || "Boulevard City", content_category: rooms || "umumiy" }, eventId);
      setDone({ name: name.trim(), phone: "+" + digits });
    } catch (e2) {
      setErr("Ariza yuborilmadi. Internetni tekshirib, qayta urinib ko'ring.");
    } finally { setBusy(false); }
  };

  if (done) return (
    <div className="lead lead__done" role="status">
      <div className="lead__check"><svg viewBox="0 0 24 24" width="34" height="34" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg></div>
      <h3>Rahmat, arizangiz qabul qilindi</h3>
      <p>{done.name}, menejer {done.phone} raqamiga tez orada qo'ng'iroq qiladi.{apt ? ` Tanlov: ${apt}.` : ""}</p>
      <button type="button" className="btn btn--ghost btn--sm" onClick={() => { setDone(null); setName(""); setPhone(""); }}>Yana ariza qoldirish</button>
    </div>
  );

  return (
    <form className="lead" onSubmit={submit} noValidate data-tilt={full ? undefined : "4"}>
      <div className="lead__title">{full ? "Ariza qoldiring" : "Narx va bo'sh xonadonlarni bilib oling"}</div>
      <p className="lead__sub">{full ? "Menejer qo'ng'iroq qilib, narx, to'lov shartlari va bo'sh qavatlarni aytib beradi." : "3 ta savol — menejer sizga qo'ng'iroq qiladi."}</p>
      <label className="field" htmlFor={idp + "Name"}><span>Ismingiz</span><input id={idp + "Name"} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ism" /></label>
      <label className="field" htmlFor={idp + "Phone"}><span>Telefon raqamingiz</span><input id={idp + "Phone"} value={phone} onChange={(e) => setPhone(fmtPhone(e.target.value))} type="tel" inputMode="tel" autoComplete="tel" placeholder="+998 __ ___ __ __" /></label>
      {full && <label className="field" htmlFor="fApt"><span>Tanlangan xonadon</span><input id="fApt" value={apt} onChange={(e) => setApt(e.target.value)} placeholder="Masalan: 4-blok, 2-qavat, 3-xonadon" /></label>}
      <fieldset className="field">
        <legend>Necha xonali uy kerak?</legend>
        <div className="chips chips--4">
          {ROOMS.map(([v, t]) => (
            <button key={v} type="button" className={"chip" + (rooms === v ? " is-active" : "")} aria-pressed={rooms === v} onClick={() => setRooms(rooms === v ? "" : v)}>
              <span className="chip__bg" /><span className="chip__label"><b>{t}</b> xona</span>
            </button>
          ))}
        </div>
      </fieldset>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
      {err && <div className="lead__error" role="alert">{err}</div>}
      <button className="btn btn--green btn--lg btn--block btn--shine" type="submit" disabled={busy}>{busy ? <><span className="spin" />Yuborilmoqda…</> : <>Ariza qoldirish <span aria-hidden="true">→</span></>}</button>
      <p className="lead__note"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 018 0v4" /></svg>Ma'lumotlaringiz uchinchi shaxslarga berilmaydi</p>
    </form>
  );
}
