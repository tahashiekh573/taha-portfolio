import "server-only";
import { env } from "@/lib/env";

type Bucket = { count: number; reset: number };
const memory = new Map<string, Bucket>();

/**
 * Fixed-window rate limiter. Uses Upstash Redis (REST) when configured so limits are shared
 * across serverless instances; otherwise falls back to best-effort in-memory limiting.
 */
export async function rateLimit(key: string, limit: number, windowSeconds: number) {
  if (env.upstashUrl && env.upstashToken) {
    try {
      const k = `rl:${key}`;
      const res = await fetch(`${env.upstashUrl}/pipeline`, {
        method: "POST",
        headers: { Authorization: `Bearer ${env.upstashToken}`, "Content-Type": "application/json" },
        body: JSON.stringify([
          ["INCR", k],
          ["EXPIRE", k, String(windowSeconds), "NX"],
        ]),
        cache: "no-store",
      });
      if (res.ok) {
        const data = (await res.json()) as { result: number }[];
        const count = Number(data[0]?.result ?? 0);
        return { ok: count <= limit, remaining: Math.max(0, limit - count) };
      }
    } catch (error) {
      console.warn("[rate-limit] Upstash unavailable, using memory:", (error as Error).message);
    }
  }
  const now = Date.now();
  const bucket = memory.get(key);
  if (!bucket || bucket.reset < now) {
    memory.set(key, { count: 1, reset: now + windowSeconds * 1000 });
    if (memory.size > 5000) for (const [k, b] of memory) if (b.reset < now) memory.delete(k);
    return { ok: true, remaining: limit - 1 };
  }
  bucket.count++;
  return { ok: bucket.count <= limit, remaining: Math.max(0, limit - bucket.count) };
}

export function clientIp(req: Request) {
  const fwd = req.headers.get("x-forwarded-for");
  return (fwd?.split(",")[0] ?? req.headers.get("x-real-ip") ?? "unknown").trim();
}
