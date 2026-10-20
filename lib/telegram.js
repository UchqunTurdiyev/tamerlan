const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).then((r) => r.json()).catch((e) => ({ ok: false, description: e.message }));

export const tg = {
  send: (chat_id, text, extra = {}) => api("sendMessage", { chat_id, text, parse_mode: "HTML", disable_web_page_preview: true, ...extra }),
  edit: (chat_id, message_id, text, reply_markup) => api("editMessageText", { chat_id, message_id, text, parse_mode: "HTML", disable_web_page_preview: true, reply_markup: reply_markup || { inline_keyboard: [] } }),
  answer: (callback_query_id, text, show_alert = false) => api("answerCallbackQuery", { callback_query_id, text, show_alert }),
  call: api,
};

export const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
export const money = (v, cur = "UZS") => Math.round(v).toLocaleString("ru-RU").replace(/ /g, " ") + (cur === "UZS" ? " so'm" : " $");

const STATUS = {
  new: "🆕 Yangi",
  qualified: "⭐ Sifatli lid — Meta'ga yuborildi",
  rejected: "❌ Rad etildi",
  purchased: "✅ Sotildi",
};

const time = (ts) => new Date(ts).toLocaleString("ru-RU", { timeZone: "Asia/Samarkand", day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

export function leadText(l) {
  const utm = l.utm && Object.keys(l.utm).length ? Object.entries(l.utm).map(([k, v]) => `${k.replace("utm_", "")}: ${esc(v)}`).join(" · ") : "";
  const lines = [
    `🏠 <b>Boulevard City — ariza #${l.id}</b>`,
    "",
    `👤 ${esc(l.name)}`,
    `📞 <code>${esc(l.phone)}</code>`,
    l.apt ? `🏢 ${esc(l.apt)}` : null,
    l.rooms ? `🛏 ${esc(l.rooms)}` : null,
    utm ? `📊 ${utm}` : l.fbc ? "📊 Meta reklamadan (fbclid)" : null,
    `🕒 ${time(l.createdAt)}`,
    "",
    `<b>Holat:</b> ${STATUS[l.status] || l.status}`,
  ];
  if (l.status === "purchased") lines.push(`💰 ${money(l.value, l.currency)}${l.metaOk ? " · Meta Purchase ✓" : " · Meta'ga yuborilmadi"}`);
  if (l.by) lines.push(`👨‍💼 ${esc(l.by)}`);
  return lines.filter((x) => x !== null).join("\n");
}

export function leadKeyboard(l) {
  if (l.status === "purchased") return { inline_keyboard: [] };
  const row1 = [];
  if (l.status !== "qualified") row1.push({ text: "⭐ Sifatli lid", callback_data: `q:${l.id}` });
  if (l.status !== "rejected") row1.push({ text: "❌ Rad etildi", callback_data: `x:${l.id}` });
  return { inline_keyboard: [row1, [{ text: "✅ Sotib oldi — summani kiritish", callback_data: `b:${l.id}` }]].filter((r) => r.length) };
}
