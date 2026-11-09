const { existsSync, readFileSync } = require('node:fs');
const { dirname, join, normalize, relative, resolve, sep } = require('node:path');

const ROOT = resolve(__dirname, '..');

const included = [
  '.env.example',
  'CONTRIBUTING.md',
  'INSTALL-WITH-AI.md',
  'LICENSE',
  'NOTICE',
  'Password + KV Sync - Activate Later',
  'README.md',
  'README.txt',
  'RELEASE-ACCEPTANCE.md',
  'SECURITY & SYNC - READ THIS NEXT.txt',
  'SECURITY.md',
  'assets',
  'index.html',
  'manifest.webmanifest',
  'netlify',
  'netlify.toml',
  'package.json',
  'pwa-icon.png',
  'scripts/build-release.cjs',
  'scripts/release-files.cjs',
  'service-worker.js',
  'verify-portal.test.mjs',
];

const manifests = [
  'manifest.webmanifest',
  'Password + KV Sync - Activate Later/manifest.webmanifest',
];

function normaliseRelativePath(path) {
  return normalize(path).split(sep).join('/').replace(/^\.\//, '');
}

function manifestAssetPaths(root = ROOT) {
  const assets = [];
  for (const manifestPath of manifests) {
    const manifest = JSON.parse(readFileSync(join(root, manifestPath), 'utf8'));
    const base = dirname(manifestPath);
    const references = [
      manifest.start_url,
      ...(manifest.icons || []).map(icon => icon.src),
      ...(manifest.screenshots || []).map(screenshot => screenshot.src),
      ...(manifest.shortcuts || []).flatMap(shortcut => [
        shortcut.url,
        ...(shortcut.icons || []).map(icon => icon.src),
      ]),
    ];
    for (const reference of references) {
      if (!reference || /^(?:[a-z]+:|\/\/|data:)/i.test(reference)) continue;
      const localReference = reference.replace(/[?#].*$/, '');
      if (!localReference) continue;
      const assetPath = normaliseRelativePath(join(base, localReference));
      if (assetPath === '..' || assetPath.startsWith('../')) {
        throw new Error(`${manifestPath} references an asset outside the release root: ${reference}`);
      }
      assets.push({ manifestPath, assetPath });
    }
  }
  return assets;
}

function isIncluded(path) {
  const normalised = normaliseRelativePath(path);
  return included.some(entry => {
    const candidate = normaliseRelativePath(entry);
    return normalised === candidate || normalised.startsWith(`${candidate}/`);
  });
}

function assertManifestAssetsIncluded(root = ROOT) {
  for (const { manifestPath, assetPath } of manifestAssetPaths(root)) {
    const absolutePath = join(root, assetPath);
    if (!existsSync(absolutePath)) {
      throw new Error(`${manifestPath} references missing asset ${assetPath}.`);
    }
    if (!isIncluded(assetPath)) {
      throw new Error(`${manifestPath} references ${assetPath}, but it is absent from the release package.`);
    }
    if (relative(root, absolutePath).startsWith('..')) {
      throw new Error(`${manifestPath} references an asset outside the release root: ${assetPath}`);
    }
  }
}

module.exports = {
  ROOT,
  assertManifestAssetsIncluded,
  included,
  manifestAssetPaths,
};
