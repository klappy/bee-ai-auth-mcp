import { describe, it, expect } from 'vitest';
import { releasedHomepage } from '../src/homepage-release';
import { HOSTED_HOMEPAGE_HTML } from '../src/hosted-homepage';
describe('runtime release of the approved hosted homepage', () => {
  it('returns null unless the weekly allowance is enabled (staging keeps its notice)', () => {
    expect(releasedHomepage({})).toBeNull();
    expect(releasedHomepage({ SELF_SERVICE_ENABLED: 'false' })).toBeNull();
  });
  it('removes exactly the review-only notice and nothing else when enabled', () => {
    const html = releasedHomepage({ SELF_SERVICE_ENABLED: 'true' })!;
    expect(html).not.toBeNull();
    expect(html).not.toContain('Homepage draft — review only');
    expect(html).toContain('renews weekly');
    expect(html).toContain('renews each week');
    expect(html).not.toMatch(/renews (each|every) month|monthly (free )?allowance|renews monthly/i);
    expect(HOSTED_HOMEPAGE_HTML.length - html.length).toBeGreaterThan(100);
    // every approved byte outside the notice is present, in order
    const [before, after] = HOSTED_HOMEPAGE_HTML.split('<aside class="pair-help" aria-label="Draft status">');
    expect(html.startsWith(before)).toBe(true);
    expect(html.endsWith(after.slice(after.indexOf('</aside>') + '</aside>'.length))).toBe(true);
  });
});
