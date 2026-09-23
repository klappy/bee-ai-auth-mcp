# Independent combined PR58 deployed review

Disposition: PASS — deployed-source/configuration/public-protocol readback only.
Observed September10,12:32 EDT.
Source maina2a3a9fa84b5c24f000a1040f3dea3ba0261d3ec.

Authenticated read-only Cloudflare calls independently returned200 for current deployments, exact Worker version modules, Worker details/settings and Container configuration. Module hash calculated within trusted tooling; raw module/private metadata not emitted. Public HTTPS reads independently verified /version, metadata and unauthenticated MCP challenge.

Observed:
- Staging deployment3478a516-50bc-430e-afa7-0c3ee58dc913/version62523939-98ba-4f89-bb96-c9c646d97950 at100%.
- Module2603402bytes, SHA256 5b3035cebc5d9705ccc5f5a1e60f2b8c1fcfc1a08269b06b80aa82434c9a428d, contains exact main; public /version matches that main.
- Worker observability/logs/traces/logpush all disabled; query redactionfalse unchanged.
- No SELF_SERVICE or QUOTA bindings. Feature remains disabled; no allowance activated.
- Window remains2026-09-10T13:18:31.966Z to15:18:31.966Z, expired. No extension.
- Same BEE_BRIDGE DO5b99701b01df4b2b886be69a0202a0e9 and OAUTH_KVd57ff6004e48496893132f343a8f4a81.
- Existing private Containera0362707-1337-4517-9f84-49b53ecfdfa9, max1,0.25vCPU,1024MiB,4000MB,logsfalse,image sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306.
- Expected OAuth issuer, supported client_secret_basic/client_secret_post/none, S256-only, issuer-response supporttrue,CIMDfalse.
- Public MCP401 includes correct Bearer resource_metadata, not an Access interstitial.
- Production remains deployment614b5e3b-5581-4821-8daf-d19289c45ba9/version1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 at100%.

Safe projections only; provider mutations0, grant/identity content reads0. Build success is separately recorded by Otto; this review proves deployed artifact/state independently rather than treating that receipt as observation.

Not proven here: authenticated native consumer use, actual ChatGPT installation, own-Bee grant/retrieval, denied/cross-user hosted negatives, cleanup or complete meal closure. No quota/referral/billing activation, runtime authority or production promotion implied.
