# Phase 2 — 6B Borrow-Evaluation

**Date**: 2026-06-16  
**Status**: Ready for review

| Step | Verdict | Justification |
|------|---------|---------------|
| **Borrow** | `applied` | `@modelcontextprotocol/sdk` + `@cloudflare/agents` (McpAgent) — already adopted in Phase 1. `git-repo-auth-mcp` docs-tool pattern reused for `bee_docs`. Tweetnacl (pure JS) + `bee-cli/appPairingCrypto.ts` for QR pairing decryption. |
| **Bend** | `applied` | Bend the git-auth docs-tool pattern to serve a project-authored `Bee-API-usage` document. Bend the pairing flow to run inside the existing Worker (no per-user container). Expose the read surface as a single GET-only `bee_read` passthrough (write primitives via a deferred `bee_write`) rather than per-endpoint tools. |
| **Break** | `observed` | Pure-JS tweetnacl decryption adds a small in-Worker crypto surface (kept minimal). Bee pairing still requires a registered `app_id`. |
| **Beget** | `n/a` | No external party ships a hosted Bee relay with per-grant encrypted custody + private-CA bridge. |
| **Bide** | `inspected-and-rejected` (delivery) | Bee’s official local MCP was already inspected-and-rejected in Phase 1 on the foundational-gap criterion (local-stdio only). No hosted/remote MCP has appeared. **Tripwire:** Re-inspect if Bee ships an official hosted MCP. |
| **Build** | `minimal` | Only: Author `Bee-API-usage` doc, `bee_docs` tool, the `bee_read` GET-only passthrough (deferred `bee_write`), and QR pairing-caller inside the existing relay. All transport, OAuth, custody, and bridge logic is already Borrowed/Bent from Phase 1. |

**Reversibility:**  
- **forward = low**  
- **backward = medium** (connector swap if Bee ships a first-class hosted MCP)
