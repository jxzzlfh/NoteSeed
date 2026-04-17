/**
 * Generates solid #4A8B5C (seed) PNG icons for the extension manifest.
 * Run: pnpm run icons (from apps/extension) or tsx ./icons/generate-icons.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PNG } from 'pngjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SEED = { r: 0x4a, g: 0x8b, b: 0x5c, a: 0xff };

function writeSolidPng(size: number, filename: string): void {
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (size * y + x) << 2;
      png.data[idx] = SEED.r;
      png.data[idx + 1] = SEED.g;
      png.data[idx + 2] = SEED.b;
      png.data[idx + 3] = SEED.a;
    }
  }
  const buf = PNG.sync.write(png);
  writeFileSync(join(__dirname, filename), buf);
}

for (const [size, name] of [
  [16, '16.png'],
  [48, '48.png'],
  [128, '128.png'],
] as const) {
  writeSolidPng(size, name);
}

console.info('[generate-icons] wrote 16.png, 48.png, 128.png');
