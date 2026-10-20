import { NextResponse } from "next/server";
import { redis, saveLead } from "@/lib/redis";
import { sendEvent } from "@/lib/meta";
import { tg, leadText, leadKeyboard } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const clip = (v, n = 200) => String(v ?? "").slice(0, n).trim();
const newId = () => Math.random().toString(36).slice(2, 8).toUpperCase();

export async function POST(req) {
  let b;
  try { b = await req.json(); } catch { return NextResponse.json({ ok: false, error: "bad json" }, { status: 400 }); }

  // Bot himoyasi: yashirin maydon to'ldirilgan bo'lsa, jim qabul qilamiz
  if (b.website) return NextResponse.json({ ok: true });

  const name = clip(b.name, 80);
  const phone = clip(b.phone, 20).replace(/[^\d+]/g, "");
  if (name.length < 2 || phone.replace(/\D/g, "").length !== 12) {
    return NextResponse.json({ ok: false, error: "Ism yoki telefon noto'g'ri" }, { status: 400 });
  }

  const ip = (req.headers.get("x-forwarded-for") || "").split(",")[0].trim() || req.headers.get("x-real-ip") || "";
  const ua = clip(req.headers.get("user-agent"), 400);

  // IP bo'yicha cheklov: daqiqasiga 5 ta ariza
  try {
    const k = `bc:rl:${ip || "x"}`;
    const n = await redis().incr(k);
    if (n === 1) await redis().expire(k, 60);
    if (n > 5) return NextResponse.json({ ok: false, error: "Juda ko'p urinish" }, { status: 429 });
  } catch (e) {
    console.error("redis", e.message);
    return NextResponse.json({ ok: false, error: "server sozlanmagan" }, { status: 500 });
  }

  const lead = {
    id: newId(),
    name, phone,
    apt: clip(b.apt, 160),
    rooms: clip(b.rooms, 30),
    eventId: clip(b.eventId, 80) || `lead_${Date.now()}`,
    fbp: clip(b.fbp, 120), fbc: clip(b.fbc, 300),
    url: clip(b.url, 500), utm: typeof b.utm === "object" && b.utm ? Object.fromEntries(Object.entries(b.utm).slice(0, 6).map(([k, v]) => [clip(k, 20), clip(v, 120)])) : {},
    ip, ua,
    status: "new",
    createdAt: Date.now(),
  };

  // Meta CAPI: Lead (brauzer Pixel bilan bir xil event_id — dublikat bo'lmaydi)
  const meta = await sendEvent({ name: "Lead", eventId: lead.eventId, lead });
  lead.leadMeta = meta.ok;
  if (!meta.ok) console.error("CAPI Lead:", meta.error);

  // Telegram
  const chat = process.env.TELEGRAM_CHAT_ID;
  if (chat && process.env.TELEGRAM_BOT_TOKEN) {
    const r = await tg.send(chat, leadText(lead), { reply_markup: leadKeyboard(lead) });
    if (r.ok) lead.tg = { chat: r.result.chat.id, msg: r.result.message_id };
    else console.error("Telegram:", r.description);
  }

  await saveLead(lead);
  return NextResponse.json({ ok: true, id: lead.id });
}
