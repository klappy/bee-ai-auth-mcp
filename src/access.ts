/**
 * Cloudflare Access JWT validation — the email door beside GitHub OAuth.
 *
 * 6B verdict (ticket bee-relay-cf-access, 2026-08-29 amendment): Borrow `jose`
 * (npm, panva) — `jwtVerify` + `createRemoteJWKSet` against the team's
 * published certs, issuer + AUD pinned. This is the pattern in Cloudflare's own
 * Workers reference sample; JWKS fetch, cache, and key rotation are the
 * library's job. Build = none: everything below is application glue (header
 * read, claim mapping), never crypto.
 *
 * The identity decision lives HERE, in code: the relay validates the JWT
 * itself and never trusts a bare `Cf-Access-Authenticated-User-Email` header
 * (trust-the-edge was rejected in the 6B table as a foundational gap — an
 * unvalidated header fails under Access misconfiguration or route bypass).
 *
 * Door-off by construction: with ACCESS_TEAM_DOMAIN / ACCESS_AUD unset, every
 * call returns null and /authorize falls through to the GitHub leg unchanged.
 */

import { createRemoteJWKSet, jwtVerify } from "jose";
import type { Env } from "./types";

export const ACCESS_JWT_HEADER = "Cf-Access-Jwt-Assertion";

/** Per-isolate JWKS cache keyed by team domain — jose handles refresh and key
 *  rotation internally; we just avoid re-constructing the remote set per request. */
const jwksByTeam = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

function jwksFor(teamDomain: string): ReturnType<typeof createRemoteJWKSet> {
  let set = jwksByTeam.get(teamDomain);
  if (!set) {
    set = createRemoteJWKSet(new URL(`https://${teamDomain}/cdn-cgi/access/certs`));
    jwksByTeam.set(teamDomain, set);
  }
  return set;
}

/** Test seam only: drop cached JWKS so a test can re-stub the certs fetch. */
export function __resetJwksCacheForTests(): void {
  jwksByTeam.clear();
}

/** Validate the request's `Cf-Access-Jwt-Assertion` server-side.
 *
 *  Returns `{ email }` only when ALL hold: the door is configured
 *  (ACCESS_TEAM_DOMAIN + ACCESS_AUD set), the header is present, the signature
 *  verifies against the team's certs, issuer and audience match the pinned
 *  values, and the token carries a non-empty `email` claim. Anything else —
 *  absent header, unconfigured door, bad signature, wrong issuer/AUD, expiry,
 *  missing email — returns null, and the caller falls through to GitHub.
 *
 *  Allow-list membership is deliberately NOT checked here: the caller owns
 *  that decision so a VALID identity that is simply off-list can be denied
 *  loudly (403) instead of silently bounced to a GitHub login it may not have.
 */
export async function verifyAccessJwt(request: Request, env: Env): Promise<{ email: string } | null> {
  const teamDomain = (env.ACCESS_TEAM_DOMAIN ?? "").trim();
  const aud = (env.ACCESS_AUD ?? "").trim();
  if (!teamDomain || !aud) return null;

  const token = request.headers.get(ACCESS_JWT_HEADER);
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, jwksFor(teamDomain), {
      issuer: `https://${teamDomain}`,
      audience: aud,
    });
    const email = typeof payload["email"] === "string" ? payload["email"].trim() : "";
    if (!email) return null;
    return { email };
  } catch {
    // Invalid signature, wrong iss/aud, expired, malformed — all one answer:
    // this is not a proven Access identity. Never leak why to the caller.
    return null;
  }
}
