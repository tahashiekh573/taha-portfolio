import { promises as fs } from "node:fs";
import path from "node:path";
import { storeKind } from "@/lib/env";
import { FILE_UPLOAD_DIR } from "@/lib/store";

const TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  avif: "image/avif",
  gif: "image/gif",
  pdf: "application/pdf",
};

/** Serves files uploaded while using the local development file store. */
export async function GET(req: Request, ctx: { params: Promise<{ path: string[] }> }) {
  if (storeKind() !== "file") return new Response("Not found", { status: 404 });
  const { path: parts } = await ctx.params;
  const target = path.join(FILE_UPLOAD_DIR, ...parts);
  if (!target.startsWith(FILE_UPLOAD_DIR + path.sep)) return new Response("Not found", { status: 404 });
  try {
    const data = await fs.readFile(target);
    const ext = target.split(".").pop()?.toLowerCase() ?? "";
    const download = new URL(req.url).searchParams.get("download");
    const headers: Record<string, string> = {
      "Content-Type": TYPES[ext] ?? "application/octet-stream",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "public, max-age=3600",
    };
    if (download) headers["Content-Disposition"] = `attachment; filename="${download.replace(/[^\w.\- ]/g, "")}"`;
    return new Response(new Uint8Array(data), { headers });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
