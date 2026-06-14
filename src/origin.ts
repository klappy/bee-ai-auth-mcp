/**
 * Origin-header validation — Connectors Directory technical requirement.
 * Ported verbatim from git-repo-auth-mcp (6B borrow, 2026-06-10): no substrate
 * covers Origin validation for a Workers MCP deployment, so this ~20-line check
 * is hand-rolled deliberately.
 *
 * Rule: requests without an Origin header pass (server-to-server clients send
 * none; OAuth navigations send none). Requests WITH an Origin must match the
 * deployment's own host or an entry in ALLOWED_ORIGINS (comma-separated,
 * per-deployment — policy in config, not code).
 */
export function isOriginAllowed(
  originHeader: string | null,
  requestUrl: string,
  allowedOrigins?: string
): boolean {
  if (!originHeader) return true; // non-browser clients and navigations
  let origin: URL;
  try {
    origin = new URL(originHeader);
  } catch {
    return false; // malformed Origin is hostile until proven otherwise
  }
  const self = new URL(requestUrl);
  if (origin.host === self.host && origin.protocol === self.protocol) return true;
  if (!allowedOrigins) return false;
  return allowedOrigins
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .some((allowed) => {
      try {
        const a = new URL(allowed);
        return a.host === origin.host && a.protocol === origin.protocol;
      } catch {
        return false;
      }
    });
}
