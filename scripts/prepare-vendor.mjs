import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = resolve(root, 'node_modules/phaser/dist/phaser.min.js');
const targetDir = resolve(root, 'vendor');
const target = resolve(targetDir, 'phaser.min.js');

await mkdir(targetDir, { recursive: true });
await copyFile(source, target);
console.log('Prepared vendor/phaser.min.js from pinned Phaser dependency.');
