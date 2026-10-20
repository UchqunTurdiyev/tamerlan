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

export default function LeadForm() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [apt, setApt] = useState("");
  const [rooms, setRooms] = useState("");
  const [hp, setHp] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null);

  useEffect(() => {
    const on = (e) => { setApt(e.detail.text || ""); if (e.detail.rooms) setRooms(e.detail.rooms); setTimeout(() => document.getElementById("fName")?.focus({ preventScroll: true }), 500); };
    window.addEventListener("bc:apt", on);
    return () => window.removeEventListener("bc:apt", on);
  }, []);

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

  const tel = process.env.NEXT_PUBLIC_PHONE, tg = process.env.NEXT_PUBLIC_TELEGRAM;

  return (
    <section className="lead-s" id="ariza">
      <div className="wrap lead-grid">
        <div>
          <div className="eyebrow">Bog'lanish</div>
          <h2 style={{ marginTop: 12 }}>Narx va bo'sh xonadonlarni bilib oling</h2>
          <p>Tanlagan xonadoningiz avtomatik qo'shiladi. Menejer qo'ng'iroq qilib, narx, to'lov shartlari va bo'sh qavatlar haqida ma'lumot beradi.</p>
          <div className="addr">
            <div><span>Manzil</span>Samarqand shahri, Xo'ja Ahror Valiy MFY, Muqimiy ko'chasi, 48</div>
            {tel && <div><span>Telefon</span><a href={`tel:${tel.replace(/\s/g, "")}`}>{tel}</a></div>}
            {tg && <div><span>Telegram</span><a href={`https://t.me/${tg.replace("@", "")}`} target="_blank" rel="noopener">@{tg.replace("@", "")}</a></div>}
            <div><span>Xarita</span><a href="https://www.google.com/maps/search/?api=1&query=Samarqand%2C%20Muqimiy%20ko%27chasi%2048" target="_blank" rel="noopener">Google xaritada ochish ↗</a></div>
            <div><span>Buyurtmachi</span>«BOULEVARD CITY» MChJ</div>
          </div>
        </div>
        <div>
          {done ? (
            <div className="ok" role="status"><b>Rahmat, arizangiz qabul qilindi</b><span>{done.name}, menejer {done.phone} raqamiga tez orada qo'ng'iroq qiladi.{apt ? ` Tanlov: ${apt}.` : ""}</span></div>
          ) : (
            <form onSubmit={submit} noValidate>
              <div className="row2">
                <label htmlFor="fName">Ismingiz<input id="fName" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Ism" /></label>
                <label htmlFor="fPhone">Telefon raqamingiz<input id="fPhone" value={phone} onChange={(e) => setPhone(fmtPhone(e.target.value))} type="tel" inputMode="tel" autoComplete="tel" placeholder="+998 __ ___ __ __" /></label>
              </div>
              <label htmlFor="fApt">Tanlangan xonadon<input id="fApt" value={apt} onChange={(e) => setApt(e.target.value)} placeholder="Masalan: 4-blok, 2-qavat, 3-xonadon" /></label>
              <label htmlFor="fRooms">Necha xonali uy kerak?
                <select id="fRooms" value={rooms} onChange={(e) => setRooms(e.target.value)}>
                  <option value="">Farqi yo'q</option><option>1 xonali</option><option>2 xonali</option><option>3 xonali</option><option>4 xonali</option>
                </select>
              </label>
              <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} name="website" />
              <div className="err" role="alert">{err}</div>
              <button className="btn btn-p" type="submit" disabled={busy}>{busy ? "Yuborilmoqda…" : "Ariza qoldirish"}</button>
              <p className="note">Ma'lumotlaringiz uchinchi shaxslarga berilmaydi.</p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
