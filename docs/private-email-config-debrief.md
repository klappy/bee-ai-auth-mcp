# Private email configuration refire

Spec recorded before edits: kitchen rail/3-pass/2026-08-13-bee-relay-cf-access/PRIVATE-EMAIL-CONFIG-AMENDMENT.md (initial commit e8b0702). Existing order pointer added before implementation.

Removed tracked ALLOWED_EMAILS var; documented private Worker secret and deny-empty behavior in setup and Env comments. No runtime logic, signing behavior, actual secret values, provisioning, deployment or merge changed.

Validation: local patch inspected. The npm typecheck/test invocation was blocked before execution by an approval cancellation; neither suite is claimed run by this cook. New branch CI must be observed separately.

Integration review: current main has later utterance paging changes and other differences; no merge/rebase attempted. The BOTH-doors edge-topology check named here was later corrected in source: public `/authorize` chooser, Access only on `/authorize/email`, independent GitHub route. That correction is recorded in `docs/email-route-debrief.md`. Remaining release holds are configuration and hosted acceptance, not that routing question.

Release limitations reported by parent: missing CONSENT_SIGNING_SECRET, no matching Bee Access app, existing OTP IdP only; Cloudflare preview unsupported for the Durable Object/Container configuration. No workflow or deployment bypass attempted. Human approval and end-to-end validation remain required.
