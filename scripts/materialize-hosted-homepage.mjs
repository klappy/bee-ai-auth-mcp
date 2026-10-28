import { build } from 'esbuild';
import { cp, mkdir, readdir, realpath, writeFile } from 'node:fs/promises';
import { resolve, dirname, join, basename, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Prepare a fresh asset directory. Never modifies public or invokes a deploy. */
export async function materializeHostedHomepage(destination) {
  if (!destination) throw new Error('An explicit new output directory is required');
  const requested = resolve(destination);
  const output = join(await realpath(dirname(requested)), basename(requested));
  const sourceRoot = await realpath(root);
  if (output === sourceRoot || output.startsWith(sourceRoot + sep)) throw new Error('Output must be outside the source repository');
  // mkdir without recursive/overwrite semantics refuses an existing destination.
  // This also prevents using public, the repository root, or a symlink as output.
  await mkdir(output);
  const compiled = await build({
    absWorkingDir: root, entryPoints: ['src/hosted-homepage.ts'], bundle: true,
    format: 'esm', platform: 'neutral', write: false, legalComments: 'none',
  });
  const module = await import('data:text/javascript;base64,' + Buffer.from(compiled.outputFiles[0].contents).toString('base64'));
  const html = module.HOSTED_HOMEPAGE_HTML;
  if (typeof html !== 'string' || !html.startsWith('<!DOCTYPE html>')) throw new Error('Invalid homepage source');
  for (const name of await readdir(join(root, 'public'))) {
    if (name !== 'index.html') await cp(join(root, 'public', name), join(output, name), { recursive: true, force: false, errorOnExist: true });
  }
  await writeFile(join(output, 'index.html'), html, { encoding: 'utf8', flag: 'wx' });
  return { output, homepage_sha256: createHash('sha256').update(html).digest('hex'), bytes: Buffer.byteLength(html) };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (process.argv.length !== 3) throw new Error('Usage: node scripts/materialize-hosted-homepage.mjs <new-output-directory>');
  console.log(JSON.stringify(await materializeHostedHomepage(process.argv[2])));
}
