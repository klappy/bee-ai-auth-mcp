/**
 * GitHub Actions OIDC verification — federation seat for machine callers.
 *
 * Actions jobs present a short-lived JWT from token.actions.githubusercontent.com.
 * We verify signature + audience + repo allow-list, then map repository_owner to
 * the configured GitHub login allow-list (same tenancy gate as OAuth consent).
 */

import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";
import type { Env } from "./types";

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

function repositoryFromClaims(payload: JWTPayload): string | null {
  const repo = payload.repository;
  if (typeof repo === "string" && repo.includes("/")) return repo;
  const owner = payload.repository_owner;
  const name = payload.repository_name;
  if (typeof owner === "string" && typeof name === "string") return `${owner}/${name}`;
  return null;
}

function ownerLoginFromClaims(payload: JWTPayload): string | null {
  const owner = payload.repository_owner;
  if (typeof owner === "string" && owner) return owner;
  const repo = payload.repository;
  if (typeof repo === "string" && repo.includes("/")) return repo.split("/")[0] ?? null;
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
    });
    payload = verified.payload;
  } catch {
    return null;
  }

  const repository = repositoryFromClaims(payload);
  if (!repository || !allowedRepos.includes(repository.toLowerCase())) return null;

  const login = ownerLoginFromClaims(payload);
  if (!login || !isAllowedLogin(login, env)) return null;

  return { login, repository };
}
