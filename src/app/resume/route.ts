import { connection } from "next/server";
import { getSiteContent } from "@/lib/content";

/** /resume — redirects to the uploaded résumé with a friendly download filename. */
export async function GET(req: Request) {
  await connection();
  const { resume } = await getSiteContent();
  if (!resume.url) return new Response("Résumé not available yet.", { status: 404 });
  const target = new URL(resume.url, req.url);
  if (new URL(req.url).searchParams.has("download")) target.searchParams.set("download", resume.fileName);
  return Response.redirect(target, 302);
}
