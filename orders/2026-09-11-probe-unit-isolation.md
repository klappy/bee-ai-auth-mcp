# Isolate probe unit tests from ambient Docker

Accepted bounded deployment repair under existing Bee auth ticket, Auggie/root and independent proposed-contract review, September 11 2026. The actual staging build timed out on the missing-image unit test because it consulted ambient Docker. A six-second synthetic docker info delay reproduced the exact failure.

Use deterministic temporary PATH docker/sudo fixtures for unavailable and named-missing cases, asserting exact exit2/message and no container run. Bound helper child execution at2seconds. Preserve the actual image probe and test:image command; do not increase global timeout or claim image acceptance. Source test and debrief ship together through independent exact-head review and CI/Bugbot. Cook does not merge or deploy.

Accepted rail amendment: kitchen commit8376c76f, blob3ef9aa35.
