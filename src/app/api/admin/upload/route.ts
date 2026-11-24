import { NextResponse } from "next/server";
import { adminRoute, jsonError } from "@/lib/api";
import { getStore } from "@/lib/store";
import { slugify } from "@/lib/utils";

const IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/gif": "gif",
};
const MAX_IMAGE = 5 * 1024 * 1024;
const MAX_PDF = 10 * 1024 * 1024;

function sniff(bytes: Buffer): string | null {
  if (bytes.subarray(0, 4).toString("latin1") === "%PDF") return "application/pdf";
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "image/png";
  if (bytes.subarray(0, 4).toString("latin1") === "RIFF" && bytes.subarray(8, 12).toString("latin1") === "WEBP") return "image/webp";
  if (bytes.subarray(4, 12).toString("latin1").startsWith("ftypavi")) return "image/avif";
  if (bytes.subarray(0, 3).toString("latin1") === "GIF") return "image/gif";
  return null;
}

export const POST = adminRoute(async (req) => {
  const form = await req.formData();
  const file = form.get("file");
  const folder = slugify(String(form.get("folder") ?? "misc")) || "misc";
  if (!(file instanceof File)) return jsonError("No file received");

  const bytes = Buffer.from(await file.arrayBuffer());
  const type = sniff(bytes);
  if (!type) return jsonError("Only JPG, PNG, WebP, AVIF, GIF images and PDF files are allowed", 415);
  const isPdf = type === "application/pdf";
  if (bytes.length > (isPdf ? MAX_PDF : MAX_IMAGE)) {
    return jsonError(`File too large (max ${isPdf ? "10" : "5"} MB)`, 413);
  }
  const ext = isPdf ? "pdf" : IMAGE_TYPES[type];
  const base = slugify(file.name.replace(/\.[^.]+$/, "")) || "file";
  const objectPath = `${folder}/${Date.now()}-${base}.${ext}`;
  const url = await getStore().upload(objectPath, bytes, type);
  return NextResponse.json({ ok: true, url, type, size: bytes.length });
});
