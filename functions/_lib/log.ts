/**
 * The only place in functions/ that writes to the console (CF-13).
 *
 * A log line is a fixed event name and, at most, one HTTP status number. The types below make
 * anything else a compile error, so a name, an address, a message, a token, an IP address, a secret
 * or an error message cannot reach a log through this function. Never log a caught error: the
 * message of a parse error can quote the text that failed to parse.
 *
 * Request logs for Functions stay off in the Cloudflare dashboard
 * (docs/ops/cloudflare-and-resend-setup.md, Part 6). These lines are for a short debugging session.
 */
export type LogEvent =
  "config_error" | "turnstile_unavailable" | "mail_failed" | "unexpected_error";

/** @param status The HTTP status of the upstream answer, or 0 when there was none. */
export function logEvent(event: LogEvent, status?: number): void {
  const suffix = status !== undefined && Number.isInteger(status) ? ` ${status}` : "";
  // eslint-disable-next-line no-console -- fixed event name and an integer, see the comment above
  console.error(`contact ${event}${suffix}`);
}
