# Staging post-OTP repair

Observed 2026-09-09 19:28:38 America/New_York. User successfully completed email OTP but saw `Isolated validation unavailable` at the homepage.

The deployed staging preview passed its audience binding to the existing verifier but inherited an empty ACCESS_TEAM_DOMAIN. The verifier therefore returned null before reading any JWT or fetching certs. Cloudflare's Access layer could admit the owner while the Worker rejected every request. This was a configuration defect, not an incorrect code or identity.

The isolated repair changes only ACCESS_TEAM_DOMAIN to the authenticated Access organization's klappy.cloudflareaccess.com. The source module is byte-for-byte unchanged. A version upload followed by explicit deployment was read back, including source hash, effective bindings, preserved Access app policies, closed data window, disabled logs, and unchanged production deployment.

The previous five staging route tests mocked the verifier and checked only the audience. They could not catch missing issuer configuration. The new bounded regression runs the actual staging transform and real JOSE verifier with synthetic signing keys and a synthetic JWKS network response. It reproduces the original503, proves corrected200, and rejects absent/malformed/wrong audience/wrong issuer/bad signature tokens. MCP remains closed. The independent reviewer reran this regression. No private JWT, identity, or key was collected.

Author receipt is staging-domain-repair-receipt.json. No authenticated owner rendering is claimed; browser-host URL-policy restrictions remain and are not bypassed. The user can reload their existing staging session after independent provider acceptance.
