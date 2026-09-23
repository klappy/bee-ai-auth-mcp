# Independent readonly review — signup draft

Reviewer: /root/auggie_signup/signup_review. 2026-09-10. Disposition: not accepted for deployment.

Reviewed admission.ts, signup.ts, staging.ts, admission hooks in bee-auth.ts/mcp-api.ts and both provider envelopes. Source was not yet declared frozen at this review.

Blocking finding: staging.ts requires CONSENT_SIGNING_SECRET before neutral root/discovery, violating amendment item1. Public metadata/neutral entry must remain independent of signing-secret configuration; sensitive operations retain their requirement. Routed to author for bounded correction; no subsequent source acceptance claimed in this receipt.

Inspection supports transactional admission and epochs at consent/pairing/token/MCP, separate owner audience plus owner-email equality, same-origin expiring one-use target/action-bound admin state, lifetime quota retention and expiry-aware old alarms. Ordinary admission operations do not invoke the Container.

Provider envelope preserved app/version settings and actual use_containers readbacks are accepted in shape only; exact tested module is still required. Documented existing Access-seat capacity resolves automatic billing concern without a subscription mutation, but actual remaining capacity is unknown after billing GET403.

Tests were not run: host network approval was cancelled before local npm run typecheck executed. No retry, alternate runtime, secrets or provider mutation. No implementation PASS or hosted readiness established.
