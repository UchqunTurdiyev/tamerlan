import { Redis } from "@upstash/redis";

let client = null;
export function redis() {
  if (client) return client;
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) throw new Error("Redis sozlanmagan: UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN");
  client = new Redis({ url, token });
  return client;
}

const KEY = (id) => `bc:lead:${id}`;
const TTL = 60 * 60 * 24 * 365; // 1 yil

export async function saveLead(lead) {
  await redis().set(KEY(lead.id), JSON.stringify(lead), { ex: TTL });
}
export async function getLead(id) {
  const v = await redis().get(KEY(id));
  if (!v) return null;
  return typeof v === "string" ? JSON.parse(v) : v;
}
export async function updateLead(id, patch) {
  const lead = await getLead(id);
  if (!lead) return null;
  const next = { ...lead, ...patch, updatedAt: Date.now() };
  await saveLead(next);
  return next;
}
