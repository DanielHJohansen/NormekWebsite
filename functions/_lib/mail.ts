/**
 * The one mail adapter. Everything provider specific is in this file, so switching from Resend to
 * Scaleway or Postmark means rewriting sendMail() and nothing else (ADR 0001, A5).
 *
 * The adapter has no html field on purpose: a message is plain text only (CF-10).
 */
import { timedFetch } from "./fetch-timeout";

export interface MailMessage {
  readonly from: string;
  /** The inbox owner. The caller passes CONTACT_TO and nothing else (CF-11). */
  readonly to: string;
  /** One validated address, no display name (CF-10). */
  readonly replyTo: string;
  readonly subject: string;
  readonly text: string;
}

/** On failure, status is the provider's HTTP status, or 0 when there was none (network error, timeout). */
export type MailResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly status: number };

const RESEND_URL = "https://api.resend.com/emails";

/** Sends one mail through Resend. One attempt, 5 second limit, no retry (CF-12). */
export async function sendMail(message: MailMessage, apiKey: string): Promise<MailResult> {
  try {
    const status = await timedFetch(
      RESEND_URL,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: message.from,
          to: message.to,
          reply_to: message.replyTo,
          subject: message.subject,
          text: message.text,
        }),
        redirect: "error",
      },
      async (response) => {
        // The answer holds nothing we use. Dropping it keeps provider text out of everything else.
        await response.body?.cancel().catch(() => undefined);
        return response.status;
      },
    );
    return status >= 200 && status < 300 ? { ok: true } : { ok: false, status };
  } catch {
    return { ok: false, status: 0 };
  }
}
