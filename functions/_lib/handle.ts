/**
 * POST /api/contact, start to finish.
 *
 * The order of the checks is part of the contract (CF-09, docs/security/contact-api.md section 5).
 * Each step either returns a response or hands over to the next one, and nothing after a failed
 * step runs. In particular, Turnstile is asked only after every cheap local check has passed, and
 * the mail is sent only after Turnstile has said yes.
 */
import { isLoopbackUrl, loadConfig, type Env } from "./env";
import {
  declaredLengthExceeds,
  isFormContentType,
  MAX_BODY_BYTES,
  parseForm,
  readBody,
} from "./form";
import { failure, success } from "./http";
import { buildInquiryMail } from "./inquiry";
import { logEvent } from "./log";
import { sendMail } from "./mail";
import { verifyTurnstile } from "./turnstile";
import { validateInquiry } from "./validate";

/** CF-08. A Turnstile token is far shorter than this. */
const MAX_TOKEN_LENGTH = 2048;

export async function handleContact(request: Request, env: Env | undefined): Promise<Response> {
  try {
    return await route(request, env);
  } catch {
    // The error is not logged and not returned. Its message can quote the request body (CF-13).
    logEvent("unexpected_error");
    return failure("internal");
  }
}

async function route(request: Request, env: Env | undefined): Promise<Response> {
  // CF-01
  if (request.method !== "POST") return failure("method_not_allowed");

  // CF-15, and the Turnstile test secret rule of CF-08
  const config = loadConfig(env, isLoopbackUrl(request.url));
  if (config === null) {
    logEvent("config_error");
    return failure("config");
  }

  // CF-02
  const origin = request.headers.get("origin");
  if (origin === null || !config.allowedOrigins.has(origin)) return failure("origin_not_allowed");

  // CF-03
  if (!isFormContentType(request.headers.get("content-type"))) {
    return failure("unsupported_media_type");
  }

  // CF-04
  if (declaredLengthExceeds(request.headers.get("content-length"), MAX_BODY_BYTES)) {
    return failure("payload_too_large");
  }
  const body = await readBody(request, MAX_BODY_BYTES);
  if (body.kind === "too_large") return failure("payload_too_large");
  if (body.kind === "unreadable") return failure("bad_request");

  // CF-05
  const form = parseForm(body.bytes);
  if (form === null) return failure("bad_request");

  // CF-06. Same response as a real success, and nothing is sent.
  if ((form.get("website") ?? "") !== "") return success();

  // CF-07
  const validation = validateInquiry(form);
  if (!validation.ok) return failure("validation", validation.fields);

  // CF-08
  const token = form.get("cf-turnstile-response") ?? "";
  if (token === "" || token.length > MAX_TOKEN_LENGTH) return failure("turnstile");
  const person = await verifyTurnstile(config.turnstileSecret, token, config.allowedHostnames);
  if (person.kind === "rejected") return failure("turnstile");
  if (person.kind === "unavailable") {
    logEvent("turnstile_unavailable", person.status);
    return failure("turnstile_unavailable");
  }

  // CF-10 to CF-12. The one place in the code that sends mail, and it sends to CONTACT_TO only.
  const mail = buildInquiryMail(validation.inquiry, origin, config.contactTo);
  const sent = await sendMail(mail, config.resendApiKey);
  if (!sent.ok) {
    logEvent("mail_failed", sent.status);
    return failure("mail_failed");
  }
  return success();
}
