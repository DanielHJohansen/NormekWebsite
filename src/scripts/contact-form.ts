/**
 * Browser behaviour of the contact form. The rules live in src/lib/contact-form.ts, the markup and the texts
 * in src/components/sections/ContactForm.astro. This file only connects them.
 *
 *  - Validate on blur and on submit. A field that has an error is checked again as the visitor types, so the
 *    error goes as soon as the value is fine.
 *  - A failed submit shows an error summary at the top with a link to each field, and moves focus to it.
 *    Each field gets an icon and a text, aria-invalid and an aria-describedby that names the text. Values stay.
 *  - Sending: the button reads "Sending...", carries aria-disabled (never disabled, so focus stays) and the
 *    form carries aria-busy.
 *  - Success: the visitor goes to /thanks/. That page is the confirmation and the conversion signal for analytics.
 *  - A failed send or a failed person check shows a message above the button and keeps the visitor's text.
 *  - Turnstile loads on first use of the form (see turnstile.ts).
 */
import {
  FIELD_NAMES,
  REQUEST_TIMEOUT_MS,
  encodeBody,
  errorForServerField,
  interpretResponse,
  messageKey,
  validateAll,
  validateField,
  type FieldError,
  type FieldName,
  type FieldValues,
  type SubmitOutcome,
} from "../lib/contact-form";
import { createTurnstile } from "./turnstile";

type Control = HTMLInputElement | HTMLTextAreaElement;

function required<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Contact form: ${selector} is missing from the markup.`);
  return element;
}

function setUp(form: HTMLFormElement): void {
  const endpoint = form.dataset["endpoint"] ?? "/api/contact";
  const thanksUrl = form.dataset["thanks"] ?? "/thanks/";
  const siteKey = form.dataset["sitekey"] ?? "";

  const submit = required<HTMLButtonElement>(form, "#contact-submit");
  const summary = required<HTMLElement>(form, "#contact-summary");
  const summaryList = required<HTMLElement>(summary, "[data-summary-list]");
  // Two live regions that exist before anything is put in them: a failure is announced as an alert,
  // a failed person check as a status (tokens.md 5.9).
  const alertRegion = required<HTMLElement>(form, "#contact-notice");
  const statusRegion = required<HTMLElement>(form, "#contact-warning");
  const honeypot = required<HTMLInputElement>(form, "#contact-website");
  const turnstile = createTurnstile(required<HTMLElement>(form, "[data-turnstile]"), siteKey);

  const controls = Object.fromEntries(
    FIELD_NAMES.map((name) => [name, required<Control>(form, `#contact-${name}`)]),
  ) as Record<FieldName, Control>;

  const messages = new Map<string, string>();
  const messageTemplate = required<HTMLTemplateElement>(form, "template[data-messages]");
  for (const element of messageTemplate.content.querySelectorAll<HTMLElement>("[data-message]")) {
    messages.set(element.dataset["message"] ?? "", element.textContent ?? "");
  }
  const notices = {
    failed: required<HTMLTemplateElement>(form, 'template[data-notice="failed"]'),
    person: required<HTMLTemplateElement>(form, 'template[data-notice="person-check"]'),
  };

  const buttonLabel = submit.textContent?.trim() ?? "";
  const shown: Partial<Record<FieldName, FieldError>> = {};
  let summaryActive = false;
  let sending = false;

  // ---- field errors ---------------------------------------------------------------------------

  function messageFor(field: FieldName, error: FieldError): string {
    return messages.get(messageKey(field, error)) ?? "";
  }

  function setFieldError(field: FieldName, error: FieldError | null): void {
    const control = controls[field];
    const errorElement = required<HTMLElement>(form, `#contact-${field}-error`);
    const describedBy = field === "message" ? ["contact-message-help"] : [];
    if (error) {
      shown[field] = error;
      required<HTMLElement>(errorElement, "[data-error-text]").textContent = messageFor(
        field,
        error,
      );
      errorElement.hidden = false;
      control.setAttribute("aria-invalid", "true");
      describedBy.push(errorElement.id);
    } else {
      delete shown[field];
      required<HTMLElement>(errorElement, "[data-error-text]").textContent = "";
      errorElement.hidden = true;
      control.removeAttribute("aria-invalid");
    }
    if (describedBy.length > 0) control.setAttribute("aria-describedby", describedBy.join(" "));
    else control.removeAttribute("aria-describedby");
  }

  // ---- the error summary ----------------------------------------------------------------------

  function renderSummary(): void {
    summaryList.replaceChildren();
    for (const field of FIELD_NAMES) {
      const error = shown[field];
      if (!error) continue;
      const link = document.createElement("a");
      link.className = "link";
      link.href = `#contact-${field}`;
      link.textContent = messageFor(field, error);
      link.addEventListener("click", (event) => {
        event.preventDefault();
        controls[field].focus();
      });
      const item = document.createElement("li");
      item.append(link);
      summaryList.append(item);
    }
    const hasErrors = Object.keys(shown).length > 0;
    summary.hidden = !(summaryActive && hasErrors);
    if (!hasErrors) summaryActive = false;
  }

  function checkField(field: FieldName): void {
    setFieldError(field, validateField(field, controls[field].value));
    renderSummary();
  }

  // ---- notices and the sending state ----------------------------------------------------------

  function clearNotices(): void {
    alertRegion.replaceChildren();
    statusRegion.replaceChildren();
  }

  function showNotice(kind: keyof typeof notices): void {
    clearNotices();
    const region = kind === "person" ? statusRegion : alertRegion;
    region.replaceChildren(notices[kind].content.cloneNode(true));
  }

  function setSending(on: boolean): void {
    sending = on;
    submit.textContent = on ? (messages.get("button.sending") ?? buttonLabel) : buttonLabel;
    if (on) {
      submit.setAttribute("aria-disabled", "true");
      form.setAttribute("aria-busy", "true");
    } else {
      submit.removeAttribute("aria-disabled");
      form.removeAttribute("aria-busy");
    }
  }

  // ---- submit ---------------------------------------------------------------------------------

  function collect(): FieldValues {
    return Object.fromEntries(
      FIELD_NAMES.map((name) => [name, controls[name].value]),
    ) as unknown as FieldValues;
  }

  async function post(values: FieldValues, token: string): Promise<SubmitOutcome> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
        body: encodeBody(values, honeypot.value, token),
        credentials: "same-origin",
        signal: controller.signal,
      });
      const body: unknown = await response.json().catch(() => null);
      return interpretResponse(response.status, body);
    } catch {
      // A network error and a timeout look the same to the visitor: the send failed.
      return { kind: "failed" };
    } finally {
      clearTimeout(timer);
    }
  }

  async function onSubmit(): Promise<void> {
    if (sending) return;
    clearNotices();

    const values = collect();
    const errors = validateAll(values);
    for (const field of FIELD_NAMES) setFieldError(field, errors[field] ?? null);
    if (Object.keys(errors).length > 0) {
      summaryActive = true;
      renderSummary();
      summary.focus();
      return;
    }
    summaryActive = false;
    renderSummary();

    setSending(true);
    let leaving = false;
    try {
      const result = await turnstile.getToken();
      if (result.status === "unavailable") {
        // No site key: the preview before the Cloudflare setup. The form still works as far as this.
        showNotice("failed");
        return;
      }
      if (result.status === "blocked") {
        showNotice("person");
        turnstile.reset();
        return;
      }

      const outcome = await post(values, result.token);
      if (outcome.kind === "success") {
        leaving = true;
        window.location.assign(thanksUrl);
        return;
      }
      if (outcome.kind === "validation") {
        // The client checks first, so this means its rules and the server's differ. The widget keeps its token,
        // because the function answers before it asks Turnstile.
        for (const field of outcome.fields) {
          setFieldError(field, errorForServerField(field, values[field]));
        }
        summaryActive = true;
        renderSummary();
        summary.focus();
        return;
      }
      showNotice(outcome.kind === "turnstile" ? "person" : "failed");
      // A token works once, so every answer that is not a success needs a fresh one.
      turnstile.reset();
    } finally {
      if (!leaving) setSending(false);
    }
  }

  // ---- wiring ---------------------------------------------------------------------------------

  for (const field of FIELD_NAMES) {
    const control = controls[field];
    control.addEventListener("blur", (event) => {
      // Going straight to the button is a submit. The submit checks every field, and a message that appears
      // now would move the button away from the pointer before the click lands.
      if ((event as FocusEvent).relatedTarget === submit) return;
      checkField(field);
    });
    control.addEventListener("input", () => {
      if (shown[field]) checkField(field);
    });
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void onSubmit();
  });

  // Turnstile loads the first time the visitor focuses or clicks in the form.
  const startTurnstile = (): void => turnstile.start();
  form.addEventListener("focusin", startTurnstile, { once: true });
  form.addEventListener("pointerdown", startTurnstile, { once: true });

  // The page can come back from the history with the form frozen in the sending state.
  window.addEventListener("pageshow", (event) => {
    if (event.persisted) setSending(false);
  });

  // The script is running, so the form can work. Without it the button stays disabled.
  submit.disabled = false;
}

const form = document.querySelector<HTMLFormElement>("[data-contact-form]");
if (form) setUp(form);
