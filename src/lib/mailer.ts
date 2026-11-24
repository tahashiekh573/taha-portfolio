import "server-only";
import nodemailer from "nodemailer";
import { Resend } from "resend";
import { env } from "@/lib/env";

export type Mail = { to: string; subject: string; html?: string; text: string; replyTo?: string };

/** Gmail (SMTP + App Password) is used when configured, otherwise Resend. */
export function mailConfigured() {
  return Boolean((env.gmailUser && env.gmailAppPassword) || env.resendKey);
}

export async function sendMail(mail: Mail): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (env.gmailUser && env.gmailAppPassword) {
    try {
      const transport = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 465,
        secure: true,
        auth: { user: env.gmailUser, pass: env.gmailAppPassword },
      });
      const info = await transport.sendMail({
        from: `"Portfolio Contact" <${env.gmailUser}>`,
        to: mail.to,
        replyTo: mail.replyTo,
        subject: mail.subject,
        text: mail.text,
        html: mail.html,
      });
      return { ok: true, id: info.messageId };
    } catch (error) {
      return { ok: false, error: `Gmail: ${(error as Error).message}` };
    }
  }
  if (env.resendKey) {
    const { data, error } = await new Resend(env.resendKey).emails.send({
      from: env.contactFrom,
      to: [mail.to],
      replyTo: mail.replyTo,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (error || !data?.id) return { ok: false, error: `Resend: ${error?.message ?? "no id returned"}` };
    return { ok: true, id: data.id };
  }
  return { ok: false, error: "No email provider configured (set GMAIL_USER + GMAIL_APP_PASSWORD, or RESEND_API_KEY)" };
}
