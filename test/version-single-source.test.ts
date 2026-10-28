import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { VERSION, BUILD_VERSION, COMMIT_SHA } from '../src/version';
describe('single-source version', () => {
  const pkg = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
  it('src/version.ts VERSION equals package.json version', () => expect(VERSION).toBe(pkg.version));
  it('BUILD_VERSION is <version>+<sha7>', () => expect(BUILD_VERSION).toBe(`${VERSION}+${COMMIT_SHA.slice(0, 7)}`));
  it('the MCP handshake uses BUILD_VERSION, not a literal', () => {
    const src = readFileSync(new URL('../src/mcp-api.ts', import.meta.url), 'utf8');
    expect(src).toMatch(/new McpServer\(\{ name: "bee-ai-auth-mcp", version: BUILD_VERSION \}\)/);
    expect(src).not.toMatch(/version: "\d+\.\d+\.\d+"/);
  });
});
