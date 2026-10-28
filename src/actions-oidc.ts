/**
 * GitHub Actions OIDC verification — federation seat for machine callers.
 *
 * Actions jobs present a short-lived JWT from token.actions.githubusercontent.com.
 * We verify signature + audience + the exact refinery main subject, then map repository_owner to
 * the configured GitHub login allow-list (same tenancy gate as OAuth consent).
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { Env } from "./types";

const ACTIONS_REPOSITORY = "klappy/refinery";
const ACTIONS_REF = "refs/heads/main";
const ACTIONS_SUBJECT = "repo:klappy/refinery:ref:refs/heads/main";

const GH_ISSUER = "https://token.actions.githubusercontent.com";
const JWKS = createRemoteJWKSet(new URL(`${GH_ISSUER}/.well-known/jwks`));

export interface VerifiedActionsIdentity {
  /** GitHub login mapped from repository_owner (tenancy key). */
  login: string;
  /** Full repository slug from the token (e.g. klappy/refinery). */
  repository: string;
}

/** Extract Bearer credential or null. */
export function bearerOf(authorizationHeader: string | null): string | null {
  const m = /^Bearer\s+(\S+)$/i.exec((authorizationHeader ?? "").trim());
  return m ? m[1] : null;
}

function parseAllowedRepos(env: Env): string[] {
  return (env.ALLOWED_ACTIONS_REPOS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

function isAllowedLogin(login: string, env: Env): boolean {
  const list = (env.ALLOWED_GITHUB_LOGIN ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return list.includes(login.toLowerCase());
}

function audienceOf(env: Env, requestUrl: string): string {
  const configured = (env.GITHUB_ACTIONS_OIDC_AUDIENCE ?? "").trim();
  if (configured) return configured;
  return new URL(requestUrl).origin;
}

function deny(payload: JWTPayload): null {
  // Only verified claims reach here. Never log the JWT or grant.
  console.warn(JSON.stringify({ event: "actions_oidc_denied", sub: payload.sub ?? null }));
  return null;
}

/**
 * Verify a GitHub Actions OIDC JWT and return the mapped operator login.
 * Returns null on any failure (invalid token, wrong repo, not on allow-list).
 */
export async function verifyActionsOidc(
  token: string,
  env: Env,
  requestUrl: string
): Promise<VerifiedActionsIdentity | null> {
  const allowedRepos = parseAllowedRepos(env);
  if (!allowedRepos.length) return null;

  let payload: JWTPayload;
  try {
    const verified = await jwtVerify(token, JWKS, {
      issuer: GH_ISSUER,
      audience: audienceOf(env, requestUrl),
      requiredClaims: ["exp", "sub", "repository", "repository_owner", "ref"],
    });
    payload = verified.payload;
  } catch {
    return null;
  }

  // One machine seat, not a pattern or a configurable expansion to other refs.
  // Subject alone is insufficient when custom subjects or conflicting claims occur.
  if (
    payload.sub !== ACTIONS_SUBJECT ||
    payload.repository !== ACTIONS_REPOSITORY ||
    payload.ref !== ACTIONS_REF ||
    payload.repository_owner !== "klappy" ||
    payload.event_name === "pull_request" ||
    payload.event_name === "pull_request_target" ||
    !allowedRepos.includes(ACTIONS_REPOSITORY) ||
    !isAllowedLogin("klappy", env)
  ) return deny(payload);

  return { login: "klappy", repository: ACTIONS_REPOSITORY };
}
