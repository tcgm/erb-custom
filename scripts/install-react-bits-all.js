/*
 Installs ALL React Bits components (TS-CSS variant) into
 src/renderer/components/react-bits/all/

 Approach:
  - Fetch registry.json from the official repo
  - Filter items with name ending in -TS-CSS
  - Download .tsx and .css files from reactbits.dev preserving the folder structure under ts-default/
  - Generate an index.ts that re-exports all components
*/

const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const REGISTRY_URL = 'https://raw.githubusercontent.com/DavidHDev/react-bits/main/registry.json';
const WEB_BASE = 'https://reactbits.dev/';
const PREFIX = 'public/ts/default/src/ts-default/';
const DEST_ROOT = path.resolve(__dirname, '..', 'src', 'renderer', 'components', 'react-bits', 'all');
const CACHE_DIR = path.resolve(__dirname, '..', '.cache');
const CLONE_DIR = path.join(CACHE_DIR, 'react-bits');
const LOCAL_REPO_PATH = process.env.LOCAL_REPO_PATH || '';
const CLEAN = String(process.env.CLEAN ?? 'true').toLowerCase() === 'true';

function run(cmd, options = {}) {
  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 1024 * 1024 * 10, ...options }, (error, stdout, stderr) => {
      if (error) return reject(Object.assign(error, { stdout, stderr }));
      resolve({ stdout, stderr });
    });
  });
}

async function ensureFreshClone() {
  // If user provided a LOCAL_REPO_PATH, respect it (no cloning)
  if (LOCAL_REPO_PATH) {
    if (!fs.existsSync(LOCAL_REPO_PATH)) {
      throw new Error(`LOCAL_REPO_PATH does not exist: ${LOCAL_REPO_PATH}`);
    }
    return LOCAL_REPO_PATH;
  }
  // Verify git exists
  try {
  const processedDirs = new Set();
  const assetExt = /\.(png|jpe?g|gif|webp|svg|mp4|webm|ogg|mp3|wav|m4a|aac|oga|glb|gltf|hdr|bin|json)$/i;
    await run('git --version');
  } catch (e) {
    throw new Error('git is required but was not found in PATH. Please install git and retry.');
  }
  // Clean any previous clone
  if (fs.existsSync(CLONE_DIR)) {
      if (!/\.(tsx|css)$/i.test(srcPath)) continue;

      const rel = srcPath.slice(PREFIX.length); // e.g. TextAnimations/ASCIIText/ASCIIText.tsx
      const destPath = path.join(DEST_ROOT, rel);
      try {
        ensureDir(destPath);
        const localSource = path.join(localSourceRoot, 'src', 'ts-default', rel);
        if (fs.existsSync(localSource)) {
          fs.copyFileSync(localSource, destPath);
          wrote++;
          console.log('✔︎', rel, '(local)');
        } else {
          const url = WEB_BASE + srcPath;
          const content = await fetchText(url);
          if (looksLikeHtml(content)) {
            console.warn('⚠︎ Skipping (HTML response):', rel);
          } else {
            fs.writeFileSync(destPath, content, 'utf8');
            wrote++;
            console.log('✔︎', rel, '(remote)');
          }
        }
      } catch (e) {
        console.warn('⚠︎ Failed:', rel, e.message);
      }

      // Also copy any asset files in the same component directory
      try {
        const relDir = path.posix.dirname(rel).split('/').join(path.sep);
        if (!processedDirs.has(relDir)) {
          processedDirs.add(relDir);
          const localDir = path.join(localSourceRoot, 'src', 'ts-default', relDir);
          if (fs.existsSync(localDir) && fs.statSync(localDir).isDirectory()) {
            const entries = fs.readdirSync(localDir, { withFileTypes: true });
            for (const entry of entries) {
              if (!entry.isFile()) continue;
              if (!assetExt.test(entry.name)) continue;
              const srcFile = path.join(localDir, entry.name);
              const destFile = path.join(DEST_ROOT, relDir, entry.name);
              ensureDir(destFile);
              fs.copyFileSync(srcFile, destFile);
              wrote++;
              console.log('  ↳ asset', path.posix.join(relDir.split('\\').join('/'), entry.name));
            }
          }
        }
      } catch (e) {
        console.warn('⚠︎ Asset copy failed for dir:', rel, e.message);
      }
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', reject);
  });
}

function fetchText(url, redirects = 0) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
        Accept: 'text/plain, text/css, text/javascript, application/javascript, */*',
        Referer: 'https://reactbits.dev/',
        Origin: 'https://reactbits.dev',
      },
    });
    req.on('response', (res) => {
      // Handle redirects
      if (res.statusCode && [301, 302, 303, 307, 308].includes(res.statusCode)) {
        if (redirects > 3) {
          res.resume();
          return reject(new Error(`Too many redirects for ${url}`));
        }
        const location = res.headers.location;
        res.resume();
        if (!location) return reject(new Error(`Redirect without location for ${url}`));
        return resolve(fetchText(location.startsWith('http') ? location : new URL(location, url).toString(), redirects + 1));
      }
      if (res.statusCode !== 200) {
        const code = res.statusCode;
        res.resume();
        return reject(new Error(`Request failed with status ${code}: ${url}`));
      }
      let data = '';
      res.setEncoding('utf8');
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => resolve(data));
    });
    req.on('error', reject);
  });
}

function looksLikeHtml(content) {
  if (!content) return false;
  const trimmed = content.trim().toLowerCase();
  return trimmed.startsWith('<!doctype') || trimmed.startsWith('<html');
}

function ensureDir(filePath) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function pascalCase(str) {
  return str
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join('');
}

async function generateBarrelIndex() {
  // Walk DEST_ROOT and find .tsx files
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && full.endsWith('.tsx')) files.push(full);
    }
  };
  if (!fs.existsSync(DEST_ROOT)) return;
  walk(DEST_ROOT);

  const indexLines = [
    '// Auto-generated by scripts/install-react-bits-all.js',
    '// Re-exports all TS-CSS components for convenient imports',
    '',
  ];
  const seen = new Set();
  for (const full of files) {
    const noExt = full.slice(0, -4);
    const relNoExt = path.relative(DEST_ROOT, noExt).split(path.sep).join('/');
    if (seen.has(relNoExt)) continue;
    seen.add(relNoExt);
    const baseName = path.basename(noExt);
    const exportName = pascalCase(baseName);
    indexLines.push(`export { default as ${exportName} } from './${relNoExt}';`);
  }
  fs.writeFileSync(path.join(DEST_ROOT, 'index.ts'), indexLines.join('\n') + '\n', 'utf8');
}

async function main() {
  console.log('Fetching React Bits registry...');
  const registry = await fetchJson(REGISTRY_URL);
  const items = (registry.items || []).filter((it) => /-TS-CSS$/.test(it.name));

  if (CLEAN && fs.existsSync(DEST_ROOT)) {
    console.log('Cleaning destination directory:', DEST_ROOT);
    fs.rmSync(DEST_ROOT, { recursive: true, force: true });
  }

  // Prepare local source by cloning (unless overridden)
  const localSourceRoot = await ensureFreshClone();

  console.log(`Found ${items.length} TS-CSS items. Source: ${localSourceRoot}`);
  ensureDir(path.join(DEST_ROOT, 'placeholder.txt'));

  let wrote = 0;
  for (const it of items) {
    const blockName = it.name;
    console.log(`\n▶ Installing ${blockName}...`);
    for (const file of it.files || []) {
      const srcPath = file.path;
      if (!srcPath.startsWith(PREFIX)) continue;
      if (!/\.(tsx|css)$/i.test(srcPath)) continue;

      const rel = srcPath.slice(PREFIX.length); // e.g. TextAnimations/ASCIIText/ASCIIText.tsx
      const destPath = path.join(DEST_ROOT, rel);
      try {
        ensureDir(destPath);
  const localSource = path.join(localSourceRoot, 'src', 'ts-default', rel);
        if (fs.existsSync(localSource)) {
          fs.copyFileSync(localSource, destPath);
          wrote++;
          console.log('✔︎', rel, '(local)');
        } else {
          const url = WEB_BASE + srcPath;
          const content = await fetchText(url);
          if (looksLikeHtml(content)) {
            console.warn('⚠︎ Skipping (HTML response):', rel);
          } else {
            fs.writeFileSync(destPath, content, 'utf8');
            wrote++;
            console.log('✔︎', rel, '(remote)');
          }
        }
      } catch (e) {
        console.warn('⚠︎ Failed:', rel, e.message);
      }
    }
  }

  console.log('\nGenerating barrel index...');
  await generateBarrelIndex();
  // Scrub local clone unless user specified their own LOCAL_REPO_PATH
  if (!process.env.LOCAL_REPO_PATH && fs.existsSync(CLONE_DIR)) {
    console.log('Removing temporary clone:', CLONE_DIR);
    fs.rmSync(CLONE_DIR, { recursive: true, force: true });
  }
  console.log(`Done. Wrote ${wrote} files. Components available under react-bits/all`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
