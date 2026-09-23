## Corrected exact-code acceptance

Disposition: PASS — technical candidate only, not execution or financial approval.
Exact corrected candidate blob202a24a131b867533b88b5a35cebb6231828511b at kitchen0ef59d3777d98d67bac246d5e9fa76cf130bc737.

Read the complete corrected executable. The two blocking findings below are addressed:
- Preflight asserts the known existing export/Container mappings, copies exports unchanged and compares uploaded exports and Container linkage before deployment. Canonical object-key comparison replaces order-sensitive object serialization.
- After an attempted explicit deployment, failure handling determines actual active state, restores exact prior expired version only if the candidate is current, refuses unrelated/split concurrent state, reads deployment/bindings back and checks Container inactivity. It returns test_allowed=false and explicit STOP when restoration/termination is not established.

The candidate preserves exact source/settings and performs no Access/counter/grant mutation. No automatic user retrieval occurs in the candidate; root's one no-retry call remains separate and must follow successful candidate and independent readback. Its PASS return is a configuration receipt, not permission to spend or proof of end-of-window shutdown.

Operational stop condition: a version-upload/predeploy failure returns no-test and may leave an unused uploaded version. Do not infer old traffic or inactivity solely from a failed result; Otto must inspect actual state before any further action, particularly if deploy=false unexpectedly had a side effect. No retry or test is authorized by failure. The bounded backout logic is reviewed code, not an exercised restoration claim.

Exact owner-only recommendation remains: authorize up to one additional US dollar incremental test cost for the single20-minute, one-existing-user /v1/me run, including10-minute shutdown estimation tail, no retry/enrollment/subscription/production change. Expected fixed compute is approximately0.016884. The ceiling is not a provider-enforced cap or a target to spend. Existing lifetime counters reduce workload risk but do not establish the remaining original cumulative5 balance; no exhaustion inferred.

No candidate execution, provider writes, activation or additional financial approval by reviewer. Stand down at this genuine authority gate after records/readback.


# Independent identity-window mutation code review

Disposition: ITERATE — not accepted for execution.
Exact candidate identity-only-window-mutation-candidate-2026-09-10.js blobc0eb827156d52eb82782f2cf7090829ff994f6b6 at kitchen861a94a6084d4f7c19bc6bb9e5dd71be2db91e1d.
Independent reviewer read actual code; no execution/provider mutation.

## Blocking findings

1. Timestamp-only preservation is not proved for export/Container mapping. Candidate overwrites BeeBridge export with a newly constructed object and maps Container name to BeeBridge. This may be necessary writable normalization, but exact preexisting semantic equivalence is neither asserted nor established by the code. Uploaded exports are omitted from its preservation comparison. Preserve complete current writable mapping or assert the exact known-equivalent shape before mutation; compare uploaded exports and Container linkage before deployment.

2. Post-deploy comparison failure returns accepted:false/phase/version but leaves the newly active window in place. The exact prior-expired-version backout promised by the envelope is not executable in this candidate or linked as a reviewed companion. Supply explicit bounded oldVersion redeploy/readback handling or a separately reviewed rollback companion with mandatory failure disposition. Check actual deployment/settings and Container state afterward; restoring expired source alone does not prove immediate termination. If backout itself fails, return honest active/unknown state and prevent the consumer call.

## Precision

Raw JSON string comparison is order-sensitive and may false-halt on semantically identical provider objects. Use canonical comparison for preserved writable fields where normalization occurs, especially after deployment; do not weaken comparisons to ignore actual security/settings differences. Access snapshots currently cover first100 apps, not a complete account-wide coverage proof; no Access mutations occur in this candidate, so do not upgrade this snapshot into a new exhaustive Access audit claim.

The code does bind exact module/version, checks expired/quota-disabled/inactive preconditions, inherits secrets within tooling, uploads with deploy=false, reads back before explicit deployment and emits limited result metadata. These strengths do not resolve the two blockers.

Technical envelope review and proposed financial risk decision remain separate. This review approves neither the new window nor additional spending, and does not require a broad product refactor.
