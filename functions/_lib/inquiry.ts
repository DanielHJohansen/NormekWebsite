/**
 * Builds the one mail that an accepted request produces (CF-10).
 *
 * The sender and the subject are constants. Visitor text appears only in the plain text body, and
 * the message comes last, so nothing a visitor types can pose as one of the lines above it.
 */
import type { MailMessage } from "./mail";
import type { Inquiry } from "./validate";

/**
 * Resend's test sender. It delivers only to the address that owns the Resend account, which is why
 * the guide has Daniel sign up with daniel@normek.dk. At launch this becomes an address on
 * notify.normek.dk, after the three DNS records are verified (docs/ops/cloudflare-and-resend-setup.md A6).
 */
export const MAIL_FROM = "Normek website <onboarding@resend.dev>";

export const MAIL_SUBJECT = "New inquiry from the Normek website";

/**
 * @param origin The page the form was sent from. It is already checked against ALLOWED_ORIGINS.
 * @param to CONTACT_TO. Never the visitor's address (CF-11).
 */
export function buildInquiryMail(inquiry: Inquiry, origin: string, to: string): MailMessage {
  const text = [
    "New inquiry from the Normek website contact form.",
    "",
    `Name: ${inquiry.name}`,
    `Email: ${inquiry.email}`,
    `Company: ${inquiry.company === "" ? "(not given)" : inquiry.company}`,
    `Sent from: ${origin}`,
    "",
    "Message:",
    inquiry.message,
  ].join("\n");

  return { from: MAIL_FROM, to, replyTo: inquiry.email, subject: MAIL_SUBJECT, text };
}
