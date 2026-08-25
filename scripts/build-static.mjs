import { cp, mkdir, rm } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dist = resolve(root, 'dist');

await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });

for (const file of ['index.html', 'style.css', '.nojekyll']) {
  await cp(resolve(root, file), resolve(dist, file));
}

for (const dir of ['src', 'assets', 'vendor']) {
  await cp(resolve(root, dir), resolve(dist, dir), { recursive: true });
}

console.log('Built current Wreckmarch runtime into dist/ without changing gameplay semantics.');
