/**
 * Writes identical small PNG placeholders for extension icon sizes.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'extension', 'icons');

const PNG_1PX = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64',
);

export function writePlaceholderIcons() {
  if (!fs.existsSync(iconsDir)) {
    fs.mkdirSync(iconsDir, { recursive: true });
  }
  fs.writeFileSync(path.join(iconsDir, 'icon16.png'), PNG_1PX);
  fs.writeFileSync(path.join(iconsDir, 'icon48.png'), PNG_1PX);
  fs.writeFileSync(path.join(iconsDir, 'icon128.png'), PNG_1PX);
  const svg = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">',
    '<rect width="128" height="128" rx="24" fill="#1DB954"/>',
    '<text x="64" y="88" font-size="72" text-anchor="middle" fill="#111">R</text>',
    '</svg>',
  ].join('');
  fs.writeFileSync(path.join(iconsDir, 'icon.svg'), svg);
}

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isMain = entryFile && import.meta.url === pathToFileURL(entryFile).href;

if (isMain) {
  writePlaceholderIcons();
}
