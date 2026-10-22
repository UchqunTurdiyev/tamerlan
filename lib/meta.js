import crypto from "crypto";

const API = "https://graph.facebook.com/v21.0";
const sha = (v) => crypto.createHash("sha256").update(String(v).trim().toLowerCase()).digest("hex");

export function normPhone(p) {
  let d = String(p || "").replace(/\D/g, "");
  if (d.length === 9) d = "998" + d;
  return d;
}

// Lead obyektidan Meta user_data tuzish (shaxsiy ma'lumotlar SHA-256 bilan)
export function userData(lead) {
  const u = {
    ph: [sha(normPhone(lead.phone))],
    country: [sha("uz")],
    ct: [sha("samarkand")],
    external_id: [sha(lead.id)],
  };
  const first = (lead.name || "").split(/\s+/)[0];
  if (first) u.fn = [sha(first)];
  if (lead.fbp) u.fbp = lead.fbp;
  if (lead.fbc) u.fbc = lead.fbc;
  if (lead.ip) u.client_ip_address = lead.ip;
  if (lead.ua) u.client_user_agent = lead.ua;
  return u;
}

export async function sendEvent({ name, eventId, lead, custom = {}, actionSource = "website" }) {
  const pixel = process.env.META_PIXEL_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID;
  const token = process.env.META_ACCESS_TOKEN;
  if (!pixel || !token) return { ok: false, error: "META_PIXEL_ID yoki META_ACCESS_TOKEN yo'q" };
  const event = {
    event_name: name,
    event_time: Math.floor(Date.now() / 1000),
    event_id: eventId,
    action_source: actionSource,
    user_data: userData(lead),
    custom_data: { content_name: lead.apt || "Tamerlan", content_category: lead.rooms || "umumiy", ...custom },
  };
  if (actionSource === "website") event.event_source_url = lead.url || process.env.NEXT_PUBLIC_SITE_URL;
  const body = { data: [event] };
  if (process.env.META_TEST_EVENT_CODE) body.test_event_code = process.env.META_TEST_EVENT_CODE;
  try {
    const res = await fetch(`${API}/${pixel}/events?access_token=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const j = await res.json();
    if (!res.ok) return { ok: false, error: j?.error?.message || `HTTP ${res.status}` };
    return { ok: true, received: j.events_received, fbtrace: j.fbtrace_id };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}
