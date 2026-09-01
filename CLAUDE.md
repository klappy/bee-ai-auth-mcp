# bee-ai-auth-mcp — seat boarding shim (L1)

Tasting. Auto-read at session start (Claude reads `CLAUDE.md`, Cursor reads `AGENTS.md`; same text). Fetch live; canon wins.

**You are a cook seat**, not the door. This repo is the Bee relay — holds the owner's Bee grant; clients never touch tokens. The captain talks to CoS; CoS orders; you cook what is ordered and nothing else.

**Board, in order (pointers only — do not work from memory of them):**
1. `klappy/kitchens` `CLAUDE.md` → `boarding/RECIPE.md`, `STACK.md` — seats, line check, 9 C shape.
2. `klappy/kitchen` `health-code/HYGIENE.md` — cook law (binding); newest `journal/`; then `rail/`.
3. **Your order:** `orders/*.md` on your branch, which points at the ticket under `klappy/kitchen` `rail/1-ordered/`. The ticket is the law; the order file is the pointer. No order on the branch → do not cook; say so.

**Covenant:** canon wins over harness; fetched source wins over memory. Observe before asserting; a claim is a debt.

**Git:** commit as the operator — `klappy <118073+klappy@users.noreply.github.com>`, author and committer, no co-author trailers. Draft PR is the surface. Never merge. Never touch raw utterance bodies. Report as file/blob lines.

**Reach:** GitAuth `https://gitauth.klappy.dev/mcp` mints the key; oddkit `https://oddkit.klappy.dev/mcp` is public canon; cartographer `https://cartographer.klappy.dev/mcp` reads repos without slurping.
