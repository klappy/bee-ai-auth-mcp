/** Validation-only guard. Never imported by the production entry point. */
export interface ValidationWindow {
  VALIDATION_STARTS_AT?: string;
  VALIDATION_EXPIRES_AT?: string;
}

export function validationExpiry(env: ValidationWindow, now = Date.now()): number | null {
  const start = env.VALIDATION_STARTS_AT;
  const end = env.VALIDATION_EXPIRES_AT;
  const utc = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!start || !end || !utc.test(start) || !utc.test(end)) return null;
  const from = Date.parse(start), until = Date.parse(end);
  if (!Number.isFinite(from) || !Number.isFinite(until) ||
      new Date(from).toISOString() !== start || new Date(until).toISOString() !== end ||
      until <= from || until - from > 2 * 60 * 60 * 1000 || now < from || now >= until) return null;
  return until;
}

export const VALIDATION_REQUEST_LIMIT = 10_000;
export function validationClosed(): Response {
  return new Response("Isolated validation unavailable", {
    status: 503, headers: { "Cache-Control": "no-store" },
  });
}
