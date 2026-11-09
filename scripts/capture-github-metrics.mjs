import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const API_VERSION = '2026-03-10';
const API_BASE_URL = String(process.env.GITHUB_API_URL || 'https://api.github.com').replace(/\/$/, '');
const commitMode = process.argv.includes('--commit');
const repository = String(process.env.GITHUB_REPOSITORY || '').trim();
const trafficToken = String(process.env.PORTAL_TRAFFIC_TOKEN || '').trim();
const commitToken = String(process.env.METRICS_COMMIT_TOKEN || '').trim();

if (!/^[^/]+\/[^/]+$/.test(repository)) throw new Error('Set GITHUB_REPOSITORY to owner/repository.');
if (!trafficToken) {
  throw new Error('PORTAL_TRAFFIC_TOKEN is required. Use a fine-grained token limited to this repository with Administration: read-only and Contents: read-only.');
}
if (commitMode && !commitToken) throw new Error('METRICS_COMMIT_TOKEN is required with --commit.');

const [owner, repo] = repository.split('/');

async function github(path, token, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'ellivien-openai-portal-metrics',
      'X-GitHub-Api-Version': API_VERSION,
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: AbortSignal.timeout(20_000),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`GitHub API ${response.status} for ${path}: ${body.message || 'unknown error'}`);
  return body;
}

async function allReleases(token) {
  const releases = [];
  for (let page = 1; page <= 10; page += 1) {
    const batch = await github(`/repos/${owner}/${repo}/releases?per_page=100&page=${page}`, token);
    releases.push(...batch);
    if (batch.length < 100) break;
  }
  return releases;
}

const metadataToken = commitToken || trafficToken;
const [repositoryData, views, clones, releases] = await Promise.all([
  github(`/repos/${owner}/${repo}`, metadataToken),
  github(`/repos/${owner}/${repo}/traffic/views?per=day`, trafficToken),
  github(`/repos/${owner}/${repo}/traffic/clones?per=day`, trafficToken),
  allReleases(metadataToken),
]);

const capturedAt = new Date().toISOString();
const releaseEvidence = releases.map(release => ({
  tagName: release.tag_name,
  name: release.name,
  publishedAt: release.published_at,
  url: release.html_url,
  assets: release.assets.map(asset => ({
    name: asset.name,
    size: asset.size,
    downloadCount: asset.download_count,
    downloadUrl: asset.browser_download_url,
  })),
}));
const snapshot = {
  schemaVersion: 1,
  capturedAt,
  repository: repositoryData.full_name,
  source: {
    provider: 'GitHub REST API',
    aggregateOnly: true,
    trafficWindowDays: 14,
    note: 'Overlapping snapshots preserve GitHub rolling totals without identifying visitors.',
  },
  repositoryTotals: {
    stars: repositoryData.stargazers_count,
    forks: repositoryData.forks_count,
    openIssuesAndPullRequests: repositoryData.open_issues_count,
  },
  traffic: { views, clones },
  releases: releaseEvidence,
  releasePackageDownloadTotal: releaseEvidence.reduce((total, release) =>
    total + release.assets.filter(asset => /\.zip$/i.test(asset.name))
      .reduce((releaseTotal, asset) => releaseTotal + asset.downloadCount, 0), 0),
};

const filename = `${capturedAt.replace(/:/g, '-').replace(/\.\d{3}Z$/, 'Z')}.json`;
const relativePath = `metrics/snapshots/${filename}`;
const serialised = `${JSON.stringify(snapshot, null, 2)}\n`;

if (commitMode) {
  const encodedPath = relativePath.split('/').map(encodeURIComponent).join('/');
  const result = await github(`/repos/${owner}/${repo}/contents/${encodedPath}`, commitToken, {
    method: 'PUT',
    body: {
      message: `metrics: preserve GitHub traffic snapshot ${capturedAt.slice(0, 10)}`,
      content: Buffer.from(serialised).toString('base64'),
      branch: repositoryData.default_branch,
    },
  });
  console.log(JSON.stringify({ capturedAt, path: result.content?.path || relativePath }));
} else {
  const outputPath = join(ROOT, relativePath);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, serialised, { flag: 'wx' });
  console.log(`Saved aggregate GitHub metrics to ${outputPath}`);
}
