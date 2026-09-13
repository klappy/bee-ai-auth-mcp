# OAuth negotiation repair order

Owner: Auggie. Cook: source_cook. Independent design PASS before fire.
Ticket: https://github.com/klappy/kitchen/tree/main/rail/3-pass/2026-08-13-bee-relay-cf-access
Contract: OAUTH-NEGOTIATION-AMENDMENT-2026-09-10.md v1.0, design blob 209e105caa1884746d0a6499671b605f93c889e3; independent-source sequencing correction now in blob bc9f6ca8f91ed93c5f008250bff30ae679b6bfd8.

Pin maintained provider 0.10.3 and validate migration with synthetic native OAuth tests. Preserve monthly PR56. Parent's explicit September 10 sequencing correction authorizes this independent feature from current main15d4deb6, without waiting for monthly work; combined landing trees require revalidation. No broad dependency upgrade, custom negotiation parser, CIMD activation, provider/config mutation, runtime extension, live private identity/grant, billing or production promotion. Cargo includes before/after evidence, docs and debrief; expeditor owns merges.
