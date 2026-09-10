import { describe, expect, it } from 'vitest';
import { beeRead } from '../src/bee';
import { MCP_VIEW_TARGET_BYTES, mcpPayloadSize } from '../src/bee-utterance-pager';

describe('beeRead retains main-branch conversation paging', () => {
  const payload = { conversation: { id: 'synthetic-conversation', summary: 'synthetic summary', transcriptions: [{ utterances: Array.from({ length: 600 }, (_, id) => ({ id, text: 'synthetic '.repeat(100) })) }] } };
  const bridge = { fetch: async () => Response.json(payload) } as unknown as DurableObjectStub;
  it('returns every nested utterance once across readable pages even when upstream exceeds 512KB', async () => {
    expect(JSON.stringify(payload).length).toBeGreaterThan(512 * 1024);
    const ids: number[] = []; let cursor: string | undefined;
    for (let page = 0; page < 100; page++) {
      const result = await beeRead('synthetic-token', bridge, '/v1/conversations/synthetic-conversation?expand=transcriptions', undefined, { cursor, chunk: 20 });
      expect(result.ok).toBe(true); if (!result.ok) throw new Error('Expected successful synthetic read');
      expect(result.truncated).toBeUndefined();
      const body = result.body as any;
      expect(body.utterance_paging.paged).toBe(true);
      expect(mcpPayloadSize(body)).toBeLessThanOrEqual(MCP_VIEW_TARGET_BYTES);
      ids.push(...body.conversation.transcriptions.flatMap((t: any) => t.utterances.map((u: any) => u.id)));
      cursor = body.utterance_paging.next_cursor ?? undefined;
      if (!cursor) break;
    }
    expect(ids).toEqual(Array.from({ length: 600 }, (_, i) => i));
    const since = await beeRead('synthetic-token', bridge, '/v1/conversations/synthetic-conversation', undefined, { since: 10, chunk: 2 });
    expect(since.ok && (since.body as any).conversation.transcriptions[0].utterances.map((u: any) => u.id)).toEqual([11, 12]);
  });
  it('retains the existing read cap for large non-conversation responses', async () => {
    const result = await beeRead('synthetic-token', bridge, '/v1/conversations');
    expect(result.ok && result.truncated).toBe(true);
    expect(result.ok && (result.body as any).preview.length).toBe(512 * 1024);
  });
});
