import { describe, it, expect } from "vitest";
import {
  MCP_VIEW_TARGET_BYTES,
  isConversationDetailPath,
  mcpPayloadSize,
  pageConversationUtterances,
  reassembleUtteranceIds,
} from "../src/bee-utterance-pager";

const PATH = "/v1/conversations/10189141";

function makeUtterance(id: number, text: string) {
  return { id, text, speaker: "user", start_ms: id * 1000 };
}

function makeConversation(utteranceCount: number) {
  const utterances = Array.from({ length: utteranceCount }, (_, i) =>
    makeUtterance(3_260_382_100 + i, `Utterance ${i + 1}: ${"word ".repeat(40)}`)
  );
  return {
    id: "10189141",
    state: "COMPLETED",
    utterances_count: utteranceCount,
    summary: "x".repeat(20_000),
    transcriptions: [{ id: 15_125_552, utterances }],
  };
}

describe("isConversationDetailPath", () => {
  it("matches single conversation GET only", () => {
    expect(isConversationDetailPath("/v1/conversations/10189141")).toBe(true);
    expect(isConversationDetailPath("/v1/conversations")).toBe(false);
    expect(isConversationDetailPath("/v1/conversations/10189141/related")).toBe(false);
    expect(isConversationDetailPath("/v1/search/conversations")).toBe(false);
  });
});

describe("pageConversationUtterances", () => {
  it("returns the body unchanged when it already fits the MCP view target", () => {
    const body = { id: "1", transcriptions: [{ utterances: [makeUtterance(1, "hi")] }] };
    expect(pageConversationUtterances(PATH, body)).toBe(body);
  });

  it("pages a large fake conversation into sub-cap chunks with a stable cursor", () => {
    const original = makeConversation(120);
    const originalIds = (original.transcriptions[0].utterances as { id: number }[]).map((u) =>
      String(u.id)
    );

    const pages: ReturnType<typeof pageConversationUtterances>[] = [];
    let since: string | undefined;
    const cursors: (string | null)[] = [];

    for (let guard = 0; guard < 50; guard++) {
      const page = pageConversationUtterances(PATH, original, { since }) as Record<string, unknown>;
      pages.push(page);
      expect(mcpPayloadSize(page)).toBeLessThanOrEqual(MCP_VIEW_TARGET_BYTES);

      const paging = page.utterance_paging as {
        next_cursor: string | null;
        utterances_in_page: number;
      };
      cursors.push(paging.next_cursor);
      expect(paging.utterances_in_page).toBeGreaterThan(0);

      if (!paging.next_cursor) break;
      expect(paging.next_cursor).not.toBe(since);
      since = paging.next_cursor;
    }

    expect(pages.length).toBeGreaterThan(1);
    expect(cursors.filter(Boolean).length).toBeGreaterThan(0);

    const reassembled = reassembleUtteranceIds(PATH, original);
    expect(reassembled).toEqual(originalIds);
  });

  it("stubs summary on paged responses", () => {
    const original = makeConversation(80);
    const page = pageConversationUtterances(PATH, original) as Record<string, unknown>;
    expect(page.utterance_paging).toBeDefined();
    expect((page.summary as { omitted?: boolean }).omitted).toBe(true);
  });

  it("does not page non-conversation paths", () => {
    const body = makeConversation(80);
    const result = pageConversationUtterances("/v1/conversations", body);
    expect(result).toBe(body);
  });
});
