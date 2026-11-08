/**
 * Outbound calls (Turnstile, mail provider) are cut off after 5 seconds (CF-08, CF-12).
 */
export const OUTBOUND_TIMEOUT_MS = 5000;

/**
 * fetch() with a 5 second limit. An AbortController cancels the request when the time is up.
 * The timer also rejects the returned promise itself, so a fetch that ignores its signal cannot
 * hang the visitor. `read` runs inside the limit, so reading a slow body is limited too.
 * There is no retry: any failure rejects and the caller decides what to answer.
 */
export async function timedFetch<T>(
  url: string,
  init: RequestInit,
  read: (response: Response) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const expired = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new Error("timeout"));
    }, OUTBOUND_TIMEOUT_MS);
  });
  const work = (async () => read(await fetch(url, { ...init, signal: controller.signal })))();
  try {
    return await Promise.race([work, expired]);
  } finally {
    clearTimeout(timer);
  }
}
