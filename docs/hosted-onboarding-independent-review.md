# Independent static review: hosted Bee homepage

Verdict: no blocking finding in the reviewed homepage and consequential companion-copy scope.

Reviewed public/index.html, public/style.css, and hosted-flow/custody passages in public/security.html, public/setup.html, public/under-the-hood.html, public/roadmap.html, README.md, and docs/connecting-and-getting-your-bee-token.md. This is an artifact review, not an executed connection flow or runtime/security audit.

- The first-use path clearly identifies invited friends and family, Chris's GitHub approval, the user's own Bee account, the shared https://bee.klappy.dev/mcp endpoint, app-specific setup, Bee approval, and a first retrieval prompt.
- Self-hosting is secondary. Companion pages redirect invitees to the hosted guide; their remaining operator/CLI steps do not become the homepage's primary route.
- The homepage explicitly describes operator custody, encrypted grants, processing through the host, AI-provider receipt, and the limits of disconnecting. It neither asks users to reveal credentials in chat nor claims that hosted operation eliminates trust in Chris.
- Copy URL uses a labeled readonly field, a real button, and a polite status region. Clipboard failure focuses/selects the field for manual copying. With JavaScript unavailable, the URL remains selectable and the button remains hidden.
- Static CSS supports a constrained fluid width, wrapping endpoint controls, a narrow-screen adjustment, visible focus for controls and summaries, a skip link, and reduced-motion preference. Native details/summary supplies keyboard interaction without scripted disclosure state.
- Claude, ChatGPT, and Grok instructions link to the exact official sources reported as verified by the coordinator. Platform/account availability is qualified, and the page explicitly avoids claiming service testing across all platforms or devices. Bee pairing help links to its official developer-mode guide.

Limits and nonblocking observations:

- No browser, DOM, screenshot, live login, clipboard execution, or platform connection QA was performed, as instructed. Responsive/accessibility assessment is static only.
- This local artifact set has no Git metadata or runtime implementation. I did not independently establish the exact changed-line baseline, deployed asset availability, routing behavior, allow-list implementation, grant isolation, encryption behavior, read-only enforcement, or revocation behavior.
- Companion security and technical prose retains absolute legacy design claims about logs, errors, URLs, persistent storage and storage-only leaks. Those claims require implementation/security evidence; they are not validated by this review. The new hosted framing does explicitly retain operator trust and unfinished hardening gates, so no new contradiction was identified in the bounded rewrite.
- Review/DEBRIEF documents were not available during this review and are outside this verdict.

No product file, runtime, auth, configuration, or deployment was changed by this reviewer. Exact public copy still awaits the user's approval; this verdict does not authorize merge or deployment.

## Final bounded security-copy recheck

Re-read the final public/security.html after the three wording changes. No blocking finding; original verdict stands. The page now says Bee credentials are held in OAuth grants without asserting that grants are the only persistent state; replaces the storage-only leak guarantee with an explicit running-service compromise limitation; and describes keeping credentials out of logs, URLs, errors and tool output as design intent. It also explicitly states that retrieved conversation data passes through the service to the AI provider.

This supersedes the earlier observation about those particular absolute claims in public/security.html. The observation remains applicable to legacy technical prose elsewhere, which was not part of this bounded recheck. Runtime and browser validation limits remain unchanged. This recheck changed only this review document and does not authorize merge or deployment.
