# Independent Container association review

Reviewer: `/root/auggie_resume/review_hosted`; implementation: separate Otto receiver. Observed 2026-09-09, approximately 17:20–17:22 UTC. Reviewer performed read-only provider calls and authored no implementation.

## Disposition

ACCEPTED narrowly as an isolated, correctly linked Container application with no observed active logical instance. This supersedes the unresolved interpretation of the two false guards in the raw association receipt; it does not alter that historical receipt or claim that the requested zero desired instances was honored.

Independent GETs returned HTTP 200 for application `a0362707-1337-4517-9f84-49b53ecfdfa9` and its `/instances` endpoint.

| Field | Observed value |
| --- | --- |
| Application name | bee-validation-20260909-beebridge |
| Durable Object namespace | 5b99701b01df4b2b886be69a0202a0e9 |
| Image | registry.cloudflare.com/b03e6ea242724c05eb97eb732cceb21d/bee-validation-20260909-455501a57e820ab6c3eb927b699d02cb@sha256:5f732c594b2c5dbb1b06de2ff2ec81bfb45ca075eb6dcb9f71ea6c839ac09306 |
| Scheduling policy | default |
| Desired / maximum instances | 1 / 1 |
| Resources | 0.25 vCPU; memory_mib 1024; disk.size_mb 4000 |
| Network | private; assign_ipv4 none; assign_ipv6 none |
| Container logs | configuration.observability.logs.enabled false |
| Health | active 0; assigned 0; healthy 0; stopped 0; failed 0; scheduling 0; starting 1 |
| Logical instance response | result.instances []; result_info {} |

The API's live schema defines basic as 0.25 vCPU, 1 GiB memory and 4 GB disk, so the normalized resources match the accepted basic envelope. Its instance-list schema defines an object containing an `instances` array, not a bare array. The empty list with no continuation token is complete.

The create request asked for instances 0, but the provider returned 1. This discrepancy remains explicit. [Cloudflare's lifecycle documentation](https://developers.cloudflare.com/containers/concepts/architecture/) states that deployment pre-schedules instances and pre-fetches images; only actively running instances are charged, not unused pre-warmed images. The observed active 0, assigned 0 and empty logical-instance list are consistent with preparation rather than a running application process. This is an evidence-backed interpretation, not a provider-enforced spending cap or proof from the desired-instance count alone.

## Independently confirmed prerequisite

Deployment `a7d0312a-5391-459d-a1b3-a9d9d3fff0db` activates version `996e2832-df16-4ad5-a995-61e0b998f775` at 100 percent. Namespace ownership, class BeeBridge and SQLite remain unchanged; `use_containers` is now true. Active module independently read back as 2,629,419 bytes with SHA256 `541413ce0e278571ed8fb47b62f0077090d1cfd5852030e3fc8bff38ac2974fe`. Nine bindings remain unchanged, no secret bindings, and general validation dates are empty. Worker observability, logs, traces and Logpush remain disabled; subdomain and previews remain disabled. Previously documented inactive privacy defaults remain unchanged.

## Remaining gate

This accepts association only. No real CLI execution, broker negative result, OTP, approved identity, Bee grant, MCP retrieval, public-copy publication, production release or Stripe operation is proven. The next permissible action is the separately reviewed secret-only, one-attempt, at-most-five-minute probe and independent outcome/cleanup verification, within the existing incremental five-dollar allowance.
