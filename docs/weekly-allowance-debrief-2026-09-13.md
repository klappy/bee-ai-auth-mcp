# Weekly allowance debrief — September 13, 2026

Cause: the merged production deploy script and quota mechanism assumed a UTC calendar month; the owner ruled a weekly allowance (700 reads/week). Shipping the monthly mechanism and switching later would have handed every early account one irregular period transition, so the cadence was changed before any production release.

Change: `quotaWeek()` replaces `quotaMonth()` (kept as a deprecated alias) — period key = ISO date of the week's Monday (UTC), `renewsAt` = the following Monday 00:00:00Z. Stored field names (`month`, `latestMonth`) are unchanged so existing staging state stays readable; they now hold week keys, which still sort chronologically (including across year boundaries — tested). Exhaustion message, `usage` tool description, meta description and Free-tier row say weekly. Deploy manifest and script use `weeklyLimit`; the bindings written stay `SELF_SERVICE_READ_LIMIT` / `SELF_SERVICE_POLICY_VERSION`.

Tests: week boundaries (Sunday 23:59:59Z → Monday, year boundary inside a week, leap day inside a week, chronological key ordering); existing atomic/spanning tests re-anchored on a Sunday→Monday boundary; integration renewal timestamp re-anchored; deploy-script refusals renamed; homepage release pin re-established (sha256 `fffb56e2…`, 10,907 bytes; previous approved pin `9289c819…`, 10,910 bytes, differs only by the three ruled words). Full suite 330 passed, 2 live skips, TypeScript clean.

Not claimed: any production or staging deployment; the numeric value (700) lives in the accepted manifest, not in source; the contract amendment file in the kitchen still says UTC months and is amended by the kitchen receipt for this dish, not here.
