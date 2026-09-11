import { afterEach, describe, expect, it } from 'vitest';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { HOSTED_HOMEPAGE_HTML } from '../src/hosted-homepage';
import { materializeHostedHomepage } from '../scripts/materialize-hosted-homepage.mjs';

const temps: string[] = [];
afterEach(async () => { await Promise.all(temps.splice(0).map(p => rm(p, { recursive: true, force: true }))); });
describe('approved homepage release artifact', () => {
  it('preserves every byte of the approved page, including script and review notice', () => {
    // Original HOMEPAGE_DRAFT at preview module blob7783ea350e2d4f62b160054a1eb3ce89683f777e.
    expect(createHash('sha256').update(HOSTED_HOMEPAGE_HTML).digest('hex')).toBe('9289c8194ea3240790eb28a7ae74c1f8f2d93003959fd1aa2bc294875f97bdbc');
  });
  it('builds a separate complete asset set without changing the public source', async () => {
    const parent = await mkdtemp(join(tmpdir(), 'bee-homepage-release-')); temps.push(parent);
    const output = join(parent, 'assets');
    const publicDir = new URL('../public/', import.meta.url);
    const names = await readdir(publicDir);
    const before = await Promise.all(names.map(name => readFile(new URL(name, publicDir))));
    const receipt = await materializeHostedHomepage(output);
    expect(await readdir(output)).toEqual(names);
    expect(await readFile(join(output, 'index.html'), 'utf8')).toBe(HOSTED_HOMEPAGE_HTML);
    expect(receipt.bytes).toBe(10910);
    for (let i = 0; i < names.length; i++) {
      expect(await readFile(new URL(names[i], publicDir))).toEqual(before[i]);
      if (names[i] !== 'index.html') expect(await readFile(join(output, names[i]))).toEqual(before[i]);
    }
    await expect(materializeHostedHomepage(output)).rejects.toThrow();
    expect(await readFile(join(output, 'index.html'), 'utf8')).toBe(HOSTED_HOMEPAGE_HTML);
    await expect(materializeHostedHomepage(new URL('../public/release-artifact', import.meta.url).pathname)).rejects.toThrow('outside the source repository');
  });
});
