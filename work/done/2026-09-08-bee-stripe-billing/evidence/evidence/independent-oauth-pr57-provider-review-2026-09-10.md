## Completed independent readback — September10,12:25:16 EDT

Disposition: PASS for OAuth PR57 deployed-source/settings receipt, not hosted acceptance.

Independent authenticated GETs against Worker-ID version modules and Worker details both returned200. Trusted-tool byte decoding/hash computation returned only safe scalars: module2594702bytes, SHA256 ea1ea6346544eb019728a656d9872a41d9267f5eb2d2662683e2128d6754a21e, embedded main33c80b8a44385482e346b554f9da357f3b87f5da matches. Worker observability enabled=false, logs.enabled=false, traces.enabled=false, logpush=false, redact_query_string=false.

This closes the two receipt-only limitations below with independent fresh observation. No raw modules, bindings, author/account metadata, secrets or grants were emitted by these reads. No provider mutations. All hosted/activation/production limitations remain.

# Independent OAuth PR57 deployed readback

Disposition: scoped observed checks PASS; module-hash and Worker-observability verification remain receipt-only pending an appropriate read-only projection.
Observed September10,12:21–12:22 EDT, after OAuth main33c80b8a44385482e346b554f9da357f3b87f5da deployment.

Independent authenticated Cloudflare GETs returned200 for staging settings/deployments/version detail, production deployments and Container application. Separately executed public HTTPS GETs for version, authorization-server metadata and MCP.

Observed directly:
- Staging deployment162f84d4-b392-426e-8a70-40785df48f42, version3c75acf3-3aa9-46af-8a43-741bad182a15 at100%.
- Public /version exact33c80b8a44385482e346b554f9da357f3b87f5da.
- Expected staging issuer, client_secret_basic/client_secret_post/none, S256-only, issuer-response support true, CIMD false.
- Public MCP returns401 with correct Bearer resource_metadata challenge, not an Access interstitial.
- No SELF_SERVICE bindings; runtime remains2026-09-10T13:18:31.966Z through15:18:31.966Z, already expired. KVd57ff6004e48496893132f343a8f4a81 and DO5b99701b01df4b2b886be69a0202a0e9 unchanged.
- Containera0362707-1337-4517-9f84-49b53ecfdfa9 remains max1,0.25vCPU,1024MiB,4000MB,private network,logs disabled,image sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306.
- Production deployment614b5e3b-5581-4821-8daf-d19289c45ba9/version1a7996dd-1cc0-4046-9e39-56d0aaea4bc8 at100%, unchanged. Worker logpush false.

The settings/version projections available in these GETs omit Worker observability. Otto receipt blobfc4e116c reports effective logs/traces off and module hash ea1ea6346544eb019728a656d9872a41d9267f5eb2d2662683e2128d6754a21e; those two details are not yet independent observations by this reviewer.

Projection limitation: an initial deployment read returned provider author metadata before output was narrowed to explicit scalar allowlists. No such metadata is persisted here; no grant content, secret values or test identities were read. Subsequent outputs used bounded safe fields. Provider mutations0; no DCR writes, runtime start, live Bee request or browser-policy workaround.

This does not prove actual ChatGPT installation, own-Bee authorization/retrieval, hosted cross-user negatives or meal closure.
