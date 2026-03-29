/**
 * Bundles extension scripts and copies the target manifest.
 * Usage: node scripts/build.mjs [chrome|firefox]
 */

import esbuild from 'esbuild';
import fs, { createWriteStream } from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import archiver from 'archiver';
import { writePlaceholderIcons } from './write-placeholder-icons.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..');

/**
 * @param {string} [target]
 */
export async function runBuild(target = 'chrome') {
  const t = (target || 'chrome').toLowerCase();
  if (t !== 'chrome' && t !== 'firefox') {
    throw new Error('Target must be chrome or firefox');
  }

  writePlaceholderIcons();

  const extDir = path.join(root, 'extension');
  const srcDir = path.join(extDir, 'src-src');
  const outDir = path.join(extDir, 'src');

  await esbuild.build({
    entryPoints: [
      path.join(srcDir, 'background.js'),
      path.join(srcDir, 'content.js'),
      path.join(srcDir, 'popup.js'),
    ],
    bundle: true,
    outdir: outDir,
    platform: 'browser',
    format: 'iife',
    target: ['chrome91', 'firefox91'],
    sourcemap: false,
    entryNames: '[name]',
    logLevel: 'info',
  });

  const manifestName = t === 'chrome' ? 'manifest.chrome.json' : 'manifest.firefox.json';
  const srcManifest = path.join(extDir, manifestName);
  const dstManifest = path.join(extDir, 'manifest.json');
  fs.copyFileSync(srcManifest, dstManifest);
  console.log(`Wrote ${path.relative(root, dstManifest)} from ${manifestName}`);

  const distDir = path.join(root, 'dist');
  if (!fs.existsSync(distDir)) {
    fs.mkdirSync(distDir, { recursive: true });
  }
  const zipPath = path.join(distDir, `randomify-${t}.zip`);
  await new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });
    output.on('close', resolve);
    archive.on('error', reject);
    archive.pipe(output);

    // Keep built output (`src/`) in the release zip. Skip sources and build-only manifests.
    const skipRoot = new Set(['src-src', 'manifest.chrome.json', 'manifest.firefox.json']);

    function addDirRecursive(relDir) {
      const absDir = path.join(extDir, relDir);
      if (!fs.existsSync(absDir)) {
        return;
      }
      const names = fs.readdirSync(absDir);
      names.forEach((name) => {
        if (relDir === '' && skipRoot.has(name)) {
          return;
        }
        const rel = path.join(relDir, name);
        const full = path.join(extDir, rel);
        const st = fs.statSync(full);
        if (st.isDirectory()) {
          addDirRecursive(rel);
        } else {
          archive.file(full, { name: rel.replace(/\\/g, '/') });
        }
      });
    }

    addDirRecursive('');
    archive.finalize();
  });
  console.log(`Packed ${path.relative(root, zipPath)}`);
}

const entryFile = process.argv[1] ? path.resolve(process.argv[1]) : '';
const isMainModule = entryFile && import.meta.url === pathToFileURL(entryFile).href;

if (isMainModule) {
  const target = (process.argv[2] || 'chrome').toLowerCase();
  runBuild(target).catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
