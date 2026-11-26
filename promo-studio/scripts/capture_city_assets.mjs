#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const studioRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(studioRoot, '..');

const CHROME_BIN = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DEFAULT_APP_URL = 'https://areajam.com';

function parseArgs(argv) {
  const opts = {
    city: '',
    role: 'Musicians',
    outDir: '',
    force: false,
    url: DEFAULT_APP_URL,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eqIdx = arg.indexOf('=');
    let key;
    let val;
    if (eqIdx !== -1) {
      key = arg.slice(2, eqIdx);
      val = arg.slice(eqIdx + 1);
    } else {
      key = arg.slice(2);
      val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    }
    const camelKey = key.replace(/-([a-z])/g, (_, ch) => ch.toUpperCase());
    if (camelKey === 'force') {
      opts.force = val !== 'false';
    } else if (camelKey in opts) {
      opts[camelKey] = val;
    }
  }
  return opts;
}

function loadRegions() {
  const src = fs.readFileSync(path.join(repoRoot, 'src', 'data', 'regions.ts'), 'utf-8');
  const regions = [];
  const rx = /\{\s*id:\s*'([^']+)',\s*city:\s*'([^']+)',\s*state:\s*'([^']+)',\s*areaCode:\s*'([^']+)',\s*label:\s*'([^']+)'/g;
  let match;
  while ((match = rx.exec(src)) !== null) {
    regions.push({
      id: match[1],
      city: match[2],
      state: match[3],
      areaCode: match[4],
      label: match[5],
    });
  }
  return regions;
}

function resolveRegion(cityInput, regions) {
  const q = (cityInput || '').trim().toLowerCase();
  if (!q) return regions.find((r) => r.id === 'la') || regions[0];

  const aliases = {
    'new york': 'nyc',
    'new york city': 'nyc',
    brooklyn: 'nyc',
    la: 'la',
    'los angeles': 'la',
  };
  if (aliases[q]) {
    const hit = regions.find((r) => r.id === aliases[q]);
    if (hit) return hit;
  }

  return (
    regions.find((r) => r.id.toLowerCase() === q) ||
    regions.find((r) => r.city.toLowerCase() === q) ||
    regions.find((r) => r.label.toLowerCase().includes(q)) ||
    regions.find((r) => r.id === 'la') ||
    regions[0]
  );
}

function resolveCanonicalRole(roleInput) {
  const q = (roleInput || '').trim().toLowerCase();
  if (!q || q === 'all' || q === 'all players' || q.includes('musician')) return '';
  if (q.includes('drum') || q.includes('percussion')) return 'Drummers';
  if (q.includes('guitar')) return 'Guitarists';
  if (q.includes('bass')) return 'Bassists';
  if (q.includes('vocal') || q.includes('sing')) return 'Vocalists';
  if (q.includes('key') || q.includes('synth') || q.includes('piano')) return 'Keys & Synth';
  if (q.includes('horn') || q.includes('string') || q.includes('sax') || q.includes('violin') || q.includes('cello')) {
    return 'Horns & Strings';
  }
  if (q.includes('produc') || q.includes('beat')) return 'Producers';
  if (q.includes('song') || q.includes('writ')) return 'Songwriters';
  return '';
}

function loadProfileIndex() {
  const srcPath = path.join(repoRoot, 'src', 'data', 'laProfiles.ts');
  const byTitle = new Map();
  if (!fs.existsSync(srcPath)) return byTitle;
  const src = fs.readFileSync(srcPath, 'utf-8');
  const blocks = src.split('\n  {\n    id: "');
  for (let i = 1; i < blocks.length; i += 1) {
    const b = blocks[i];
    const id = b.split('"')[0];
    const mTitle = b.match(/title:\s*"([^"]+)"/);
    if (mTitle) {
      const title = mTitle[1].trim();
      const localMp4 = path.join(repoRoot, 'public', 'profiles', 'la', `${id}.mp4`);
      const clipUrl = fs.existsSync(localMp4) ? localMp4 : '';
      const clipSlug = clipUrl ? `${id}.mp4` : '';
      byTitle.set(title.toLowerCase(), { id, title, clipUrl, clipSlug });
    }
  }
  return byTitle;
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
    this.listeners = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP WebSocket open timeout')), 10000);
      this.ws.addEventListener('open', () => {
        clearTimeout(timer);
        resolve();
      });
      this.ws.addEventListener('error', (err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    this.ws.addEventListener('message', (evt) => {
      const msg = JSON.parse(String(evt.data));
      if (msg.id && this.pending.has(msg.id)) {
        const { resolve, reject } = this.pending.get(msg.id);
        this.pending.delete(msg.id);
        if (msg.error) {
          reject(new Error(`${msg.error.message} (${msg.error.code})`));
        } else {
          resolve(msg.result || {});
        }
      } else if (msg.method && this.listeners.has(msg.method)) {
        for (const fn of this.listeners.get(msg.method)) {
          fn(msg.params || {});
        }
      }
    });
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async eval(expression) {
    const res = await this.send('Runtime.evaluate', {
      expression: `(async () => { ${expression} })()`,
      awaitPromise: true,
      returnByValue: true,
    });
    if (res.exceptionDetails) {
      const text = res.exceptionDetails.exception?.description || res.exceptionDetails.text;
      throw new Error(`Page eval error: ${text}`);
    }
    return res.result?.value;
  }

  async clickAt(x, y) {
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseMoved',
      x,
      y,
    });
    await this.send('Input.dispatchMouseEvent', {
      type: 'mousePressed',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
    await this.send('Input.dispatchMouseEvent', {
      type: 'mouseReleased',
      x,
      y,
      button: 'left',
      clickCount: 1,
    });
  }

  async pressKey(key, code, keyCode) {
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyDown',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
    await this.send('Input.dispatchKeyEvent', {
      type: 'keyUp',
      key,
      code,
      windowsVirtualKeyCode: keyCode,
      nativeVirtualKeyCode: keyCode,
    });
  }

  async capturePng(outPath, clip) {
    const params = { format: 'png' };
    if (clip) {
      params.captureBeyondViewport = true;
      params.clip = clip;
    }
    const { data } = await this.send('Page.captureScreenshot', params);
    fs.writeFileSync(outPath, Buffer.from(data, 'base64'));
  }

  close() {
    try {
      this.ws.close();
    } catch {
      // Ignore close error
    }
  }
}

async function launchChrome(tmpDir) {
  if (!fs.existsSync(CHROME_BIN)) {
    throw new Error(`Chrome binary not found at ${CHROME_BIN}`);
  }
  const child = spawn(
    CHROME_BIN,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--hide-scrollbars',
      '--mute-audio',
      '--autoplay-policy=no-user-gesture-required',
      '--remote-debugging-port=0',
      `--user-data-dir=${tmpDir}`,
      'about:blank',
    ],
    { stdio: ['ignore', 'ignore', 'pipe'] }
  );

  const wsBrowserUrl = await new Promise((resolve, reject) => {
    let stderr = '';
    const timer = setTimeout(() => {
      reject(new Error(`Chrome DevTools startup timeout.\nStderr:\n${stderr}`));
    }, 15000);

    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString();
      const match = stderr.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) {
        clearTimeout(timer);
        resolve(match[1]);
      }
    });

    child.once('exit', (code) => {
      clearTimeout(timer);
      reject(new Error(`Chrome exited prematurely with code ${code}.\nStderr:\n${stderr}`));
    });
  });

  const urlObj = new URL(wsBrowserUrl);
  const targetsRes = await fetch(`http://127.0.0.1:${urlObj.port}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  if (!pageTarget?.webSocketDebuggerUrl) {
    throw new Error('Could not find Chrome page target WebSocket URL');
  }
  return { child, wsUrl: pageTarget.webSocketDebuggerUrl };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function enterSwipeDeck(cdp) {
  await cdp.eval(`
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      if (document.querySelector('h2.text-white')) return 'deck';
      const startBtn = Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent && b.textContent.includes('Start swiping'));
      if (startBtn) {
        startBtn.click();
        return 'clicked-hero';
      }
      const swipeNav = Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] button'))
        .find((b) => b.textContent && b.textContent.includes('Swipe'));
      if (swipeNav) {
        swipeNav.click();
        return 'clicked-nav';
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    return 'timeout';
  `);
}

async function waitForTopCard(cdp, prevTitle = null) {
  return cdp.eval(`
    const prev = ${JSON.stringify(prevTitle)};
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      const h2 = document.querySelector('h2.text-white');
      const title = h2 ? h2.textContent.trim() : '';
      if (title && (!prev || title !== prev)) {
        const card = h2.closest('article') || h2.parentElement?.parentElement?.parentElement || document;
        const vid = card.querySelector('video');
        const img = card.querySelector('img');
        const mediaReady = vid
          ? (vid.readyState >= 2 || (Date.now() + 3000 > deadline))
          : (img ? (img.complete && img.naturalWidth > 0) : true);
        if (mediaReady) {
          await new Promise((r) => setTimeout(r, 420));
          document.activeElement?.blur?.();
          return title;
        }
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    document.activeElement?.blur?.();
    return document.querySelector('h2.text-white')?.textContent?.trim() || '';
  `);
}

function resolveMatchedCard(title, profileIndex, fallbackCard) {
  const hit = title ? profileIndex.get(title.toLowerCase()) : null;
  if (hit) return hit;
  return fallbackCard || { id: '', title: title || 'Musician', clipUrl: '', clipSlug: '' };
}

function toPublicRelative(absPath) {
  const pubRoot = path.join(studioRoot, 'public');
  return path.relative(pubRoot, absPath).split(path.sep).join('/');
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  if (!opts.outDir) {
    throw new Error('--out-dir is required');
  }

  const outDir = path.isAbsolute(opts.outDir) ? opts.outDir : path.resolve(studioRoot, opts.outDir);
  const manifestPath = path.join(outDir, 'capture-manifest.json');
  const regions = loadRegions();
  const region = resolveRegion(opts.city, regions);
  const canonicalRole = resolveCanonicalRole(opts.role);

  if (!opts.force && fs.existsSync(manifestPath)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
      const pubRoot = path.join(studioRoot, 'public');
      const allPresent =
        existing.regionId === region.id &&
        existing.canonicalRole === canonicalRole &&
        Array.isArray(existing.cards) &&
        existing.cards.length >= 3 &&
        existing.cards.every((c) => fs.existsSync(path.join(pubRoot, c.media))) &&
        fs.existsSync(path.join(pubRoot, existing.filterMedia)) &&
        fs.existsSync(path.join(pubRoot, existing.profileMedia));
      if (allPresent) {
        console.log(`[capture] using cached ${region.city} / ${canonicalRole || 'All players'} assets`);
        return;
      }
    } catch {
      // Regenerate manifest on parse failure
    }
  }

  fs.mkdirSync(outDir, { recursive: true });
  const profileIndex = loadProfileIndex();
  const tmpProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'areajam-cdp-'));
  let chromeChild = null;
  let cdp = null;

  try {
    console.log(`[capture] launching Chrome for ${region.label} | ${canonicalRole || 'All players'}...`);
    const launched = await launchChrome(tmpProfileDir);
    chromeChild = launched.child;
    cdp = new CDPClient(launched.wsUrl);
    await cdp.connect();

    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });
    await cdp.send('Emulation.setEmulatedMedia', {
      features: [
        { name: 'prefers-color-scheme', value: 'dark' },
        { name: 'prefers-reduced-motion', value: 'reduce' },
      ],
    });

    const guestState = {
      regionId: region.id,
      mode: 'jam',
      samplesEnabled: true,
      includeNearbyRegions: false,
      locationConsent: 'declined',
      lookingForJam: canonicalRole ? [canonicalRole] : [],
      lookingForGigs: [],
      customRegions: [],
      userListings: [],
      swiped: {},
      history: [],
      matches: [],
      wallComments: {},
    };

    await cdp.send('Page.addScriptToEvaluateOnNewDocument', {
      source: `
        try {
          window.localStorage.setItem('color-scheme', 'dark');
          window.localStorage.setItem('areajam_v2_guest', ${JSON.stringify(JSON.stringify(guestState))});
        } catch {}
      `,
    });

    const targetUrl = `${opts.url.replace(/\/$/, '')}/?area=${encodeURIComponent(region.id)}&mode=jam`;
    await cdp.send('Page.navigate', { url: targetUrl });
    await enterSwipeDeck(cdp);

    // Capture Card 1
    const title1 = await waitForTopCard(cdp);
    const card1Path = path.join(outDir, 'card-1.png');
    await cdp.capturePng(card1Path);
    const meta1 = resolveMatchedCard(title1, profileIndex);
    console.log(`[capture] card-1: ${meta1.title} (${meta1.id || 'live'})`);

    // Open mobile instrument filter dropdown and capture filter screenshot
    const filterPath = path.join(outDir, 'filter-dropdown.png');
    const selectRect = await cdp.eval(`
      const sel = document.getElementById('mobile-player-type');
      if (!sel) return null;
      const r = sel.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    `);

    let dropdownCaptured = false;
    if (selectRect) {
      await cdp.clickAt(selectRect.x, selectRect.y);
      await sleep(320);
      const isOpen = await cdp.eval(`
        const sel = document.getElementById('mobile-player-type');
        return Boolean(sel && sel.matches(':open'));
      `);
      if (isOpen) {
        await cdp.capturePng(filterPath);
        dropdownCaptured = true;
        console.log('[capture] filter-dropdown: captured open picker');
      }
      await cdp.pressKey('Escape', 'Escape', 27);
      await sleep(220);
      await cdp.eval('document.activeElement?.blur?.()');
    }

    if (!dropdownCaptured) {
      // Fallback: open Browse tab to show active filtered roster header + grid
      await cdp.eval(`
        const btn = Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] button'))
          .find((b) => b.textContent?.includes('Browse'));
        btn?.click();
      `);
      await sleep(500);
      await cdp.eval('document.activeElement?.blur?.()');
      await cdp.capturePng(filterPath);
      console.log('[capture] filter-dropdown: captured Browse filtered roster fallback');
      await cdp.eval(`
        const btn = Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] button'))
          .find((b) => b.textContent?.includes('Swipe'));
        btn?.click();
      `);
      await waitForTopCard(cdp);
    }

    // Pass Card 1 -> capture Card 2
    let meta2 = { ...meta1 };
    const card2Path = path.join(outDir, 'card-2.png');
    const pass1Rect = await cdp.eval(`
      const btn = document.querySelector('button[aria-label^="Pass on "]');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    `);
    if (pass1Rect) {
      await cdp.clickAt(pass1Rect.x, pass1Rect.y);
      const title2 = await waitForTopCard(cdp, title1);
      if (title2 && title2 !== title1) {
        await cdp.capturePng(card2Path);
        meta2 = resolveMatchedCard(title2, profileIndex, meta1);
        console.log(`[capture] card-2: ${meta2.title} (${meta2.id || 'live'})`);
      } else {
        console.log(`[capture] card-2 unchanged (${title2 || 'empty'})`);
        fs.copyFileSync(card1Path, card2Path);
      }
    } else {
      fs.copyFileSync(card1Path, card2Path);
    }

    // Pass Card 2 -> capture Card 3
    let meta3 = { ...meta1 };
    const card3Path = path.join(outDir, 'card-3.png');
    const pass2Rect = await cdp.eval(`
      const btn = document.querySelector('button[aria-label^="Pass on "]');
      if (!btn) return null;
      const r = btn.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    `);
    if (pass2Rect && meta2.title !== meta1.title) {
      await cdp.clickAt(pass2Rect.x, pass2Rect.y);
      const title3 = await waitForTopCard(cdp, meta2.title);
      if (title3 && title3 !== meta2.title) {
        await cdp.capturePng(card3Path);
        meta3 = resolveMatchedCard(title3, profileIndex, meta1);
        console.log(`[capture] card-3: ${meta3.title} (${meta3.id || 'live'})`);
      } else {
        console.log(`[capture] card-3 unchanged (${title3 || 'empty'})`);
        fs.copyFileSync(card1Path, card3Path);
      }
    } else {
      fs.copyFileSync(card1Path, card3Path);
    }

    // Capture full profile screenshot for featured matched player (prefer one with MP4 clip)
    const cardsList = [
      { ...meta1, media: toPublicRelative(card1Path) },
      { ...meta2, media: toPublicRelative(card2Path) },
      { ...meta3, media: toPublicRelative(card3Path) },
    ];
    const featured = cardsList.find((c) => c.id && c.clipUrl) || cardsList.find((c) => c.id) || cardsList[0];
    const profilePath = path.join(outDir, 'profile-full.png');
    if (featured?.id) {
      const profileUrl = `${opts.url.replace(/\/$/, '')}/?area=${encodeURIComponent(region.id)}&mode=jam&profile=${encodeURIComponent(featured.id)}`;
      await cdp.send('Page.navigate', { url: profileUrl });
      const scrollHeight = await cdp.eval(`
        const deadline = Date.now() + 9000;
        while (Date.now() < deadline) {
          const h1 = document.querySelector('h1');
          const vid = document.querySelector('video');
          if (h1 && (!vid || vid.readyState >= 2 || Date.now() + 2500 > deadline)) {
            await new Promise((r) => setTimeout(r, 450));
            break;
          }
          await new Promise((r) => setTimeout(r, 120));
        }
        window.scrollTo(0, document.documentElement.scrollHeight);
        await new Promise((r) => setTimeout(r, 550));
        window.scrollTo(0, 0);
        await new Promise((r) => setTimeout(r, 300));
        const nav = document.querySelector('nav[aria-label="Mobile navigation"]');
        if (nav) nav.style.display = 'none';
        document.activeElement?.blur?.();
        return Math.min(2650, Math.max(1500, document.documentElement.scrollHeight || 2000));
      `);
      await cdp.capturePng(profilePath, {
        x: 0,
        y: 0,
        width: 390,
        height: scrollHeight || 1850,
        scale: 2,
      });
      console.log(`[capture] profile-full (${featured.title}, h=${scrollHeight}px)`);
    } else {
      fs.copyFileSync(card1Path, profilePath);
    }

    const manifest = {
      regionId: region.id,
      regionLabel: region.label,
      canonicalRole,
      cards: cardsList,
      filterMedia: toPublicRelative(filterPath),
      profileMedia: toPublicRelative(profilePath),
      profileClip: {
        id: featured.id,
        title: featured.title,
        clipUrl: featured.clipUrl,
        clipSlug: featured.clipSlug,
      },
    };
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log(`[capture] saved manifest -> ${manifestPath}`);
  } finally {
    if (cdp) cdp.close();
    if (chromeChild) {
      chromeChild.stderr?.destroy();
      if (!chromeChild.killed) {
        chromeChild.kill('SIGKILL');
      }
    }
    fs.rmSync(tmpProfileDir, { recursive: true, force: true });
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
