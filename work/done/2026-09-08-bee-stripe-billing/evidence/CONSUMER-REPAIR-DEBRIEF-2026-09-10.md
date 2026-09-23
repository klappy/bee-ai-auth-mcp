# Bee consumer repair and delivery topology debrief — 2026-09-10

## Outcome and limits

The admin form repair and recovered hosted source are deployed from reviewed main15d4deb6a0b18fc17ec7eb3f4967168f12ba174c through actual Cloudflare Builds. Public /version and independently downloaded module identify that source. Feature branches no longer upload into production; main deploys isolated staging with a metadata-preserving script, and production uses its explicit configuration through a separate branch trigger. PR34/50/39 are superseded by mergedPR53; historical cargo is linked immutably in the product. DraftproductionPR55 remains blocked, with no auto-merge.

This does not complete consumer onboarding. Owner approval after the repair, ChatGPT installation, personal Bee grant/retrieval and remaining hosted isolation/cleanup evidence are unobserved. Exact public copy and production preparation/promotion remain separate approvals. Auth/homepage remain3-pass; Stripe1-ordered. No background monitor or extended runtime allowance exists.

## What failed and what changed

1. Admin page no-referrer policy caused standards-compliant browser form POST Origin:null, while the handler correctly required a same-origin Origin. The admin page now uses same-origin referrer policy; strict Origin, one-use actions and approval-epoch protection remain. Reloading the list no longer invalidates unrelated unexpired forms.
2. Recovery-workspace tests depended on an untracked runtime manifest and a transform outside the repo. Real PR CI exposed those missing inputs. Repository-local frozen asset expectations and the actual staging entry replace that dependency; a clean source/test reconstruction and actual CI now pass.
3. Source reconstruction overwrote existing conversation-paging integration in beeRead and MCP tool arguments. Bugbot found it; existing automatic Bugbot Autofix4c31ab7 was preserved and independently tested against a synthetic large conversation. Local cooks added coverage, not a duplicate implementation. Final suite198passed/two skipped.
4. Production Builds still had a wildcard feature upload trigger. PATCH requests returned400/12002. A separately reviewed deletion removed that obsolete trigger after a safe reconstruction was persisted. DocumentedCREATE worked for staging; production replacementCREATE encountered409 duplicate configuration. Reviewed delete-then-create produced the explicit production-config trigger while deployed code/settings remained unchanged. Reconstruction is durable; a restore operation is not claimed tested.
5. Curl-only discovery checks were insufficient to characterize all clients. A Python user-agent receives Cloudflare edge1010 while diagnostic OpenAI/ChatGPT user agents succeed. No customer-controlled workers.dev rule was identified. This is a documented compatibility observation, not proof of the screenshot's cause or permission to weaken unrelated security.

## Learning bound to the work

The product now contains test/fixtures/README.md and docs/conversation-paging-recovery-2026-09-10.md describing the two recovery failures. Their regression tests exercise committed inputs and actual beeRead continuation. README, RESUME and docs/ci-cd.md now point to the real branch/config convention and current meal rather than stale operational history. docs/recovery-provenance-2026-09-10.md preserves all eleven historical cargo links.

The concrete prevention is executable: source checks run on PRs and main; production PR source must be main; staging deployment refuses other branches and reads/clones actual provider metadata before version upload and explicit deployment. It preserves secrets, namespace, Container configuration and the existing runtime deadline, then verifies the deployed module and settings. Actual first CI execution proved the necessary token permissions; the earlier metadata-permission403 is not a continuing deployment blocker.

The learning machinery caught the missing fixtures in clean-checkout CI and the lost pager in Bugbot, after local-only review had missed them. That is the useful correction: validate the committed tree and current-base behavior before calling recovered source complete. The remaining consumer acceptance must be observed at its own boundary and must not be relabeled from these engineering passes.

## Receipts

- Product PR53 and main15d4deb6; final sourceheadcac49c3 current Bugbot102902251614 SUCCESS.
- Builds234fd53f-64a9-4af4-97de-de6586f7e0b7 success; stagingversiond7f2063f-81d9-4775-9b06-f8c6a7c75b24, deployment84ac5750-6c6c-4a66-b4a0-4b4eb297280a, module2721c4b1b32c21a0d1a5fe45f20dbfcb8223e85051f7db14216e65c64cd6700e.
- evidence/main-build-deployment-receipt-2026-09-10.json and independent-main-deployment-{receipt.json,review.md} record actual readbacks.
- evidence/independent-admin-repair-review-2026-09-10.md, independent-ci-portability-review-2026-09-10.md and independent-paging-recovery-review-2026-09-10.md carry separate review scopes.

Remaining crew execution is cleanly waiting on real consumer observations and release gates. No broad meal acceptance or learning-lane move follows from this bounded debrief.
