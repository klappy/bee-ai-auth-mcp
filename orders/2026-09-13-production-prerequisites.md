# Production prerequisite manifest — order

Authority: captain rulings 2026-09-12 (validate/merge/ship; 700 reads per week free, unlimited paid) and 2026-09-13 ("Then do it"; "Continue"). Receipt: klappy/kitchen rail/3-pass/2026-08-13-bee-relay-cf-access/VALIDATION-RECEIPT-2026-09-13.md.

Declared product: `deploy/production-prerequisites.json` accepted:true with every value observed from the provider on 2026-09-13 by the CoS/Otto seat — active version 1a7996dd / deployment 614b5e3b (Aug 30), custody d9d07844 (module sha256 bbf09a90…, identical to active), production Access apps 7c23d2a0 (email, everyone) and 5d2d344f (owner admin), OTP-only, owner reference policy fb785d29, desiredMetadata computed by the script's own `candidateMetadata` (sha256 1b3d1945…), the seven hosted bindings from `desiredAdditions`, effective Worker logging snapshot as read, weeklyLimit 700, policyVersion weekly-700-2026-09, reviewedMain 023a5adb.

Not done here: no provider mutation, no deployment. The Git Build on the production branch runs the script; the main → production PR #55 carries this manifest to it.
