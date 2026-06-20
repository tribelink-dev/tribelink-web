import { mkdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'public', 'triberoutes-logo.png');

const outputs = [
  { path: join(root, 'app', 'icon.png'), size: 48 },
  { path: join(root, 'app', 'apple-icon.png'), size: 180 },
  { path: join(root, 'public', 'icons', 'pwa-192.png'), size: 192 },
  { path: join(root, 'public', 'icons', 'pwa-512.png'), size: 512 },
];

await mkdir(join(root, 'public', 'icons'), { recursive: true });

const buffer = await readFile(source);

for (const { path, size } of outputs) {
  await sharp(buffer)
    .resize(size, size, {
      fit: 'cover',
      kernel: sharp.kernel.lanczos3,
    })
    .png({ compressionLevel: 9 })
    .toFile(path);
  console.log(`wrote ${path} (${size}x${size})`);
}
