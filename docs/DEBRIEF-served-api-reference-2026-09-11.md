# Debrief — served API reference repair

Date: 2026-09-11 (America/New_York). Existing [Bee auth ticket](https://github.com/klappy/kitchen/tree/main/rail/3-pass/2026-08-13-bee-relay-cf-access); [source order](../orders/2026-09-11-served-api-reference.md).

The `bee_docs` runtime constant had drifted from its authoritative Markdown. The generated source still called D0034 a pending decision and omitted the already-documented relay conversation paging contract. This could lead a connected AI client to avoid supported search or miss subsequent utterance pages.

Regenerated `src/bee-api-usage-doc.ts` with the existing `scripts/gen-bee-docs.mjs`. Canonical Markdown blob `d8164e1679e7d766bc2d80d1c048bde21fa2aee7` and generator blob `98a941612fbcee2fa3842408d7d0b34b9f98c750` are unchanged. CI now runs that generator and requires a clean diff for the generated file before installing dependencies. This puts the prevention at the same source boundary that drifted.

Verification performed locally:

- Generated module imports successfully; its exported string equals the canonical Markdown byte for byte.
- Re-running the generator produces identical output.
- The exact CI generator/diff commands pass against synchronized files and fail against a synthetic unregenerated Markdown change.
- No local application suite or TypeScript claim: this documentation-only cook reconstructed the minimal generator inputs, not a full installed checkout. Existing CI runs TypeScript and the unit suite on the PR; their results and independent review remain gates.

No API behavior, dependencies, limits, provider settings, public homepage copy or production changes. Existing manual-token guidance in `src/bee.ts` is outside this served-reference repair and was not silently rewritten. No real Bee read was made by this cook. The active staging validation artifact remains unchanged until the window expires and Otto verifies inactivity; the cook does not merge.

Source regeneration is not deployed acceptance. After review/checks and authorized staging merge, verify the exact deployed revision and call `bee_docs` to confirm the settled decision and paging section are served. Hosted tenancy, cleanup and whole-meal acceptance remain separate open gates.
