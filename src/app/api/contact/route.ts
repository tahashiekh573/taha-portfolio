import { NextResponse } from "next/server";
import { env } from "@/lib/env";
import { mailConfigured, sendMail } from "@/lib/mailer";
import { contactSchema } from "@/lib/schemas";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { sameOrigin } from "@/lib/api";
import { getSiteContent } from "@/lib/content";

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
const oneLine = (s: string) => s.replace(/[\r\n]+/g, " ").trim();

export async function POST(req: Request) {
  if (!sameOrigin(req)) return NextResponse.json({ ok: false, error: "Invalid origin" }, { status: 403 });

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid request" }, { status: 400 });
  }

  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors = parsed.error.flatten().fieldErrors;
    // Honeypot filled in: pretend success so bots learn nothing.
    if (fieldErrors.website) return NextResponse.json({ ok: true });
    return NextResponse.json(
      { ok: false, error: "Please check the highlighted fields.", fieldErrors },
      { status: 422 },
    );
  }
  const data = parsed.data;

  // Submissions faster than 3 seconds after the form was shown are almost always bots.
  if (data.startedAt && Date.now() - data.startedAt < 3000) return NextResponse.json({ ok: true });

  const ip = clientIp(req);
  const limit = await rateLimit(`contact:${ip}`, 5, 60 * 15);
  if (!limit.ok) {
    return NextResponse.json(
      { ok: false, error: "Too many messages. Please try again later or email me directly." },
      { status: 429 },
    );
  }

  const { settings } = await getSiteContent();
  if (!settings.contactFormEnabled) {
    return NextResponse.json({ ok: false, error: "The contact form is currently disabled." }, { status: 503 });
  }
  if (!mailConfigured()) {
    console.error("[contact] No email provider: set GMAIL_USER + GMAIL_APP_PASSWORD (or RESEND_API_KEY)");
    return NextResponse.json(
      { ok: false, error: "The contact form is not configured yet. Please email me directly." },
      { status: 503 },
    );
  }

  const name = oneLine(data.name);
  const subject = oneLine(data.subject);
  const html = `
    <div style="font-family:system-ui,sans-serif;font-size:15px;color:#0f172a">
      <h2 style="margin:0 0 12px">New portfolio message</h2>
      <p><strong>Name:</strong> ${escapeHtml(name)}<br/>
      <strong>Email:</strong> ${escapeHtml(data.email)}<br/>
      <strong>Subject:</strong> ${escapeHtml(subject)}</p>
      <div style="white-space:pre-wrap;border-left:3px solid #6366f1;padding:8px 12px;background:#f8fafc">${escapeHtml(data.message)}</div>
      <p style="color:#64748b;font-size:12px">Sent from the portfolio contact form. Reply directly to respond.</p>
    </div>`;
  const text = `New portfolio message\n\nName: ${name}\nEmail: ${data.email}\nSubject: ${subject}\n\n${data.message}`;

  const sent = await sendMail({
    to: env.contactEmail,
    replyTo: data.email,
    subject: `[Portfolio] ${subject}`.slice(0, 200),
    html,
    text,
  });

  if (!sent.ok) {
    console.error("[contact] send failed:", sent.error);
    return NextResponse.json(
      { ok: false, error: "Your message could not be sent right now. Please try again or email me directly." },
      { status: 502 },
    );
  }

  if (settings.sendConfirmationEmail) {
    // Requires a verified sending domain; failures here do not affect the main result.
    const confirm = await sendMail({
      to: data.email,
      subject: "Thanks for reaching out — Muhammad Taha",
      text: `Hi ${name},\n\nThanks for your message about "${subject}". I've received it and will get back to you soon.\n\nBest regards,\nMuhammad Taha`,
    });
    if (!confirm.ok) console.warn("[contact] confirmation email failed:", confirm.error);
  }

  return NextResponse.json({ ok: true, id: sent.id });
}
