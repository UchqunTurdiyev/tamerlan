import { NextResponse } from "next/server";
import { tg } from "@/lib/telegram";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Bir marta oching: https://SAYT/api/telegram/setup?key=SETUP_KEY
export async function GET(req) {
  const key = new URL(req.url).searchParams.get("key");
  if (!process.env.SETUP_KEY || key !== process.env.SETUP_KEY) return new NextResponse("forbidden", { status: 403 });
  const base = (process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin).replace(/\/$/, "");
  const set = await tg.call("setWebhook", {
    url: `${base}/api/telegram`,
    secret_token: process.env.TELEGRAM_WEBHOOK_SECRET || undefined,
    allowed_updates: ["message", "callback_query"],
    drop_pending_updates: true,
  });
  const info = await tg.call("getWebhookInfo", {});
  return NextResponse.json({ setWebhook: set, info: info.result });
}
