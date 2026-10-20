import { NextResponse } from "next/server";
import { redis, getLead, updateLead } from "@/lib/redis";
import { sendEvent } from "@/lib/meta";
import { tg, esc, money, leadText, leadKeyboard } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ok = () => NextResponse.json({ ok: true });
const admins = () => (process.env.TELEGRAM_ADMIN_IDS || "").split(",").map((s) => s.trim()).filter(Boolean);
const allowed = (uid) => { const a = admins(); return !a.length || a.includes(String(uid)); };
const who = (u) => [u.first_name, u.last_name].filter(Boolean).join(" ") + (u.username ? ` (@${u.username})` : "");
const askKey = (chat, msg) => `bc:ask:${chat}:${msg}`;

// "750 000 000", "750 mln", "1,2 mlrd", "85000$" kabi summani o'qish
function parseAmount(text) {
  const t = String(text || "").toLowerCase().replace(/\s+/g, "");
  const usd = /\$|usd|dollar/.test(t);
  const unit = /mlrd|milliard|млрд/.test(t) ? 1e9 : /mln|million|млн/.test(t) ? 1e6 : /ming|тыс/.test(t) ? 1e3 : 1;
  let v;
  if (unit === 1) v = parseInt(t.replace(/\D/g, ""), 10);
  else { const m = t.match(/(\d+(?:[.,]\d+)?)/); v = m ? parseFloat(m[1].replace(",", ".")) * unit : NaN; }
  if (!isFinite(v) || v <= 0) return null;
  return { value: Math.round(v), currency: usd ? "USD" : "UZS" };
}

async function refresh(lead) {
  if (lead.tg) await tg.edit(lead.tg.chat, lead.tg.msg, leadText(lead), leadKeyboard(lead));
}

export async function POST(req) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret && req.headers.get("x-telegram-bot-api-secret-token") !== secret) return new NextResponse("forbidden", { status: 403 });
  let u;
  try { u = await req.json(); } catch { return ok(); }

  try {
    // ===== Tugmalar =====
    if (u.callback_query) {
      const q = u.callback_query;
      if (!allowed(q.from.id)) { await tg.answer(q.id, "Sizda ruxsat yo'q", true); return ok(); }
      const [act, id] = String(q.data || "").split(":");
      const lead = await getLead(id);
      if (!lead) { await tg.answer(q.id, "Ariza topilmadi", true); return ok(); }

      if (act === "q") {
        if (lead.status === "purchased") { await tg.answer(q.id, "Bu mijoz allaqachon sotib olgan"); return ok(); }
        const name = process.env.META_QUALIFIED_EVENT || "QualifiedLead";
        const r = lead.qualifiedSent ? { ok: true } : await sendEvent({ name, eventId: `qual_${lead.id}`, lead, actionSource: "system_generated" });
        const next = await updateLead(id, { status: "qualified", qualifiedSent: lead.qualifiedSent || r.ok, by: who(q.from) });
        await refresh(next);
        await tg.answer(q.id, r.ok ? `${name} Meta'ga yuborildi` : `Meta xatosi: ${r.error}`, !r.ok);
      } else if (act === "x") {
        if (lead.status === "purchased") { await tg.answer(q.id, "Bu mijoz allaqachon sotib olgan"); return ok(); }
        const next = await updateLead(id, { status: "rejected", by: who(q.from) });
        await refresh(next);
        await tg.answer(q.id, "Rad etildi deb belgilandi");
      } else if (act === "b") {
        if (lead.status === "purchased") { await tg.answer(q.id, "Bu sotuv allaqachon Meta'ga yuborilgan"); return ok(); }
        const chat = q.message.chat.id;
        const r = await tg.send(chat,
          `🧾 <b>#${lead.id}</b> · ${esc(lead.name)}\nSotuv summasini shu xabarga javob qilib yozing.\nMasalan: <code>750000000</code>, <code>750 mln</code> yoki <code>65000$</code>`,
          { reply_markup: { force_reply: true, selective: true, input_field_placeholder: "Summa, so'm" }, reply_to_message_id: q.message.message_id });
        if (r.ok) await redis().set(askKey(chat, r.result.message_id), JSON.stringify({ id: lead.id, uid: q.from.id }), { ex: 3600 });
        await tg.answer(q.id, "Summani yozing");
      } else {
        await tg.answer(q.id, "");
      }
      return ok();
    }

    // ===== Xabarlar =====
    const m = u.message;
    if (!m || !m.text) return ok();
    const text = m.text.trim();

    if (text.startsWith("/start") || text.startsWith("/id")) {
      await tg.send(m.chat.id, `Chat ID: <code>${m.chat.id}</code>\nSizning ID: <code>${m.from.id}</code>\n\nBu ID'larni Vercel'dagi TELEGRAM_CHAT_ID va TELEGRAM_ADMIN_IDS ga yozing.`);
      return ok();
    }

    // Summa so'ralgan xabarga javob
    if (m.reply_to_message) {
      const raw = await redis().get(askKey(m.chat.id, m.reply_to_message.message_id));
      if (!raw) return ok();
      const ask = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!allowed(m.from.id)) return ok();
      const amt = parseAmount(text);
      if (!amt) { await tg.send(m.chat.id, "Summani tushunmadim. Faqat raqam yozing, masalan: <code>750000000</code>", { reply_to_message_id: m.message_id }); return ok(); }
      const lead = await getLead(ask.id);
      if (!lead) return ok();
      if (lead.status === "purchased") { await tg.send(m.chat.id, `#${lead.id} allaqachon sotilgan deb belgilangan.`, { reply_to_message_id: m.message_id }); return ok(); }

      const src = process.env.META_PURCHASE_SOURCE || "website";
      const r = await sendEvent({ name: "Purchase", eventId: `purchase_${lead.id}`, lead, actionSource: src, custom: { value: amt.value, currency: amt.currency, content_type: "home_listing" } });
      const next = await updateLead(lead.id, { status: "purchased", value: amt.value, currency: amt.currency, metaOk: r.ok, purchasedAt: Date.now(), by: who(m.from) });
      await redis().del(askKey(m.chat.id, m.reply_to_message.message_id));
      await refresh(next);
      await tg.send(m.chat.id,
        r.ok ? `✅ <b>#${lead.id}</b> sotildi: ${money(amt.value, amt.currency)}\nMeta'ga Purchase yuborildi (qabul qilindi: ${r.received ?? 1}).`
             : `⚠️ <b>#${lead.id}</b> sotildi deb belgilandi, lekin Meta xato qaytardi:\n<code>${esc(r.error)}</code>`,
        { reply_to_message_id: m.message_id });
    }
  } catch (e) {
    console.error("telegram webhook", e);
  }
  return ok();
}
