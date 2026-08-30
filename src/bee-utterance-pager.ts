/**
 * Relay-side utterance paging for conversation GET responses.
 * Bee returns the full conversation; the MCP harness truncates tool results
 * around ~40k chars. We slice utterances after Bee responds so each page fits.
 */

/** Target serialized MCP payload size — headroom under the ~40k view cap. */
export const MCP_VIEW_TARGET_BYTES = 28 * 1024;

export interface UtterancePagerOpts {
  /** Utterance id — return utterances strictly after this id (exclusive). */
  since?: string | number;
  /** Alias for `since` (same exclusive semantics). */
  cursor?: string | number;
  /** Soft max utterances per page; serialized size is the hard limit. */
  chunk?: number;
}

export interface UtterancePagingMeta {
  paged: true;
  since: string | null;
  next_cursor: string | null;
  utterances_in_page: number;
  utterances_total: number;
  summary_omitted: boolean;
}

type UtteranceRef = { txIndex: number; utterance: Record<string, unknown> };

export function isConversationDetailPath(pathname: string): boolean {
  return /^\/v1\/conversations\/[^/]+$/.test(pathname);
}

export function mcpPayloadSize(body: unknown, status = 200, truncated = false): number {
  return JSON.stringify({ status, truncated, body }, null, 2).length;
}

function utteranceId(u: Record<string, unknown>): string {
  return String(u.id);
}

function collectUtterances(transcriptions: unknown): UtteranceRef[] {
  if (!Array.isArray(transcriptions)) return [];
  const out: UtteranceRef[] = [];
  for (let i = 0; i < transcriptions.length; i++) {
    const tx = transcriptions[i];
    if (!tx || typeof tx !== "object") continue;
    const utterances = (tx as { utterances?: unknown }).utterances;
    if (!Array.isArray(utterances)) continue;
    for (const u of utterances) {
      if (u && typeof u === "object") out.push({ txIndex: i, utterance: u as Record<string, unknown> });
    }
  }
  return out;
}

function startIndexAfter(refs: UtteranceRef[], since: string | number | undefined): number {
  if (since === undefined || since === null || since === "") return 0;
  const needle = String(since);
  for (let i = 0; i < refs.length; i++) {
    if (utteranceId(refs[i].utterance) === needle) return i + 1;
  }
  return refs.length;
}

function stubSummary(original: unknown): { omitted: true; reason: string; bytes?: number } {
  const bytes = typeof original === "string" ? original.length : JSON.stringify(original ?? "").length;
  return { omitted: true, reason: "relay utterance paging — use utterance_paging.next_cursor to continue", bytes };
}

function rebuildTranscriptions(
  original: unknown[],
  selected: UtteranceRef[]
): unknown[] {
  const byTx = new Map<number, Record<string, unknown>[]>();
  for (const { txIndex, utterance } of selected) {
    let list = byTx.get(txIndex);
    if (!list) {
      list = [];
      byTx.set(txIndex, list);
    }
    list.push(utterance);
  }
  const out: unknown[] = [];
  for (const [txIndex, utterances] of byTx) {
    const tx = original[txIndex];
    if (tx && typeof tx === "object") {
      out.push({ ...(tx as Record<string, unknown>), utterances });
    } else {
      out.push({ utterances });
    }
  }
  return out;
}

function withPagingMeta(
  body: Record<string, unknown>,
  meta: UtterancePagingMeta
): Record<string, unknown> {
  return { ...body, utterance_paging: meta };
}

type TranscriptionSite = {
  /** Object holding transcriptions and summary (top-level body or nested conversation). */
  content: Record<string, unknown>;
  /** Client-visible envelope; utterance_paging attaches here. */
  envelope: Record<string, unknown>;
};

function resolveTranscriptionSite(body: Record<string, unknown>): TranscriptionSite | null {
  const nested = body.conversation;
  if (nested && typeof nested === "object") {
    const content = nested as Record<string, unknown>;
    if (Array.isArray(content.transcriptions)) {
      return { content, envelope: body };
    }
  }
  if (Array.isArray(body.transcriptions)) {
    return { content: body, envelope: body };
  }
  return null;
}

function buildPagedEnvelope(
  site: TranscriptionSite,
  transcriptions: unknown[],
  summaryOmitted: boolean
): Record<string, unknown> {
  const content = {
    ...site.content,
    summary: summaryOmitted ? stubSummary(site.content.summary) : site.content.summary,
    transcriptions,
  };
  if (site.content === site.envelope) {
    return content;
  }
  return { ...site.envelope, conversation: content };
}

/**
 * Page utterances inside a conversation body when the full MCP payload would
 * exceed MCP_VIEW_TARGET_BYTES, or when the client passes since/cursor.
 */
export function pageConversationUtterances(
  pathname: string,
  body: unknown,
  opts: UtterancePagerOpts = {}
): unknown {
  if (!isConversationDetailPath(pathname) || !body || typeof body !== "object") {
    return body;
  }
  const site = resolveTranscriptionSite(body as Record<string, unknown>);
  if (!site) return body;

  const transcriptions = site.content.transcriptions as unknown[];
  const refs = collectUtterances(transcriptions);
  if (refs.length === 0) return body;

  const since = opts.since ?? opts.cursor;
  const fullFits = mcpPayloadSize(body) <= MCP_VIEW_TARGET_BYTES;
  if (fullFits && (since === undefined || since === null || since === "")) {
    return body;
  }

  const start = startIndexAfter(refs, since);
  const chunkLimit = opts.chunk && opts.chunk > 0 ? Math.floor(opts.chunk) : undefined;
  const summaryOmitted =
    site.content.summary !== undefined && site.content.summary !== null;

  const selected: UtteranceRef[] = [];
  for (let i = start; i < refs.length; i++) {
    const candidate = [...selected, refs[i]];
    if (chunkLimit !== undefined && candidate.length > chunkLimit) break;

    const trialBody = buildPagedEnvelope(
      site,
      rebuildTranscriptions(transcriptions, candidate),
      summaryOmitted
    );
    const trialWithMeta = withPagingMeta(trialBody, {
      paged: true,
      since: since != null && since !== "" ? String(since) : null,
      next_cursor: null,
      utterances_in_page: candidate.length,
      utterances_total: refs.length,
      summary_omitted: summaryOmitted,
    });

    if (mcpPayloadSize(trialWithMeta) > MCP_VIEW_TARGET_BYTES) {
      if (candidate.length === 1) {
        // Single utterance exceeds cap — still return it; 512KB backstop upstream.
        selected.push(refs[i]);
      }
      break;
    }
    selected.push(refs[i]);
  }

  const lastId = selected.length > 0 ? utteranceId(selected[selected.length - 1].utterance) : null;
  const next_cursor =
    lastId !== null && start + selected.length < refs.length ? lastId : null;

  const pagedBody = buildPagedEnvelope(
    site,
    rebuildTranscriptions(transcriptions, selected),
    summaryOmitted
  );

  return withPagingMeta(pagedBody, {
    paged: true,
    since: since != null && since !== "" ? String(since) : null,
    next_cursor,
    utterances_in_page: selected.length,
    utterances_total: refs.length,
    summary_omitted: summaryOmitted,
  });
}

/** Walk all pages and return utterance ids in order (for tests). */
export function reassembleUtteranceIds(
  pathname: string,
  body: unknown,
  opts: UtterancePagerOpts = {}
): string[] {
  const ids: string[] = [];
  let since: string | number | undefined = opts.since ?? opts.cursor;
  let current = pageConversationUtterances(pathname, body, { ...opts, since, cursor: since });
  const seen = new Set<string>();

  while (current && typeof current === "object") {
    const conv = current as Record<string, unknown>;
    const paging = conv.utterance_paging as UtterancePagingMeta | undefined;
    const site = resolveTranscriptionSite(conv);
    const refs = collectUtterances(site?.content.transcriptions);
    for (const { utterance } of refs) {
      const id = utteranceId(utterance);
      if (!seen.has(id)) {
        seen.add(id);
        ids.push(id);
      }
    }
    if (!paging?.next_cursor) break;
    if (since === paging.next_cursor) break;
    since = paging.next_cursor;
    current = pageConversationUtterances(pathname, body, { ...opts, since, cursor: since });
  }

  return ids;
}
