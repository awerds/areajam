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
const DEFAULT_URL = 'http://localhost:4173';
const DEFAULT_OUT_DIR = path.join(repoRoot, 'docs', 'screenshots');

function parseArgs(argv) {
  const opts = {
    url: DEFAULT_URL,
    outDir: DEFAULT_OUT_DIR,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith('--')) continue;
    const eqIdx = arg.indexOf('=');
    const key = (eqIdx !== -1 ? arg.slice(2, eqIdx) : arg.slice(2)).replace(/-([a-z])/g, (_, c) =>
      c.toUpperCase()
    );
    const val =
      eqIdx !== -1
        ? arg.slice(eqIdx + 1)
        : argv[i + 1] && !argv[i + 1].startsWith('--')
          ? argv[++i]
          : 'true';
    if (key in opts) opts[key] = val;
  }
  return opts;
}

class CDPClient {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.nextId = 1;
    this.pending = new Map();
  }

  async connect() {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('CDP WebSocket open timeout')), 12000);
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
        if (msg.error) reject(new Error(`${msg.error.message} (${msg.error.code})`));
        else resolve(msg.result || {});
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
    await this.send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y });
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
      // ignore
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
    const timer = setTimeout(
      () => reject(new Error(`Chrome DevTools startup timeout.\nStderr:\n${stderr}`)),
      15000
    );
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

async function setStateAndNavigate(cdp, baseUrl, queryPath, { scheme = 'dark', lookingForJam = [] } = {}) {
  const guestState = {
    regionId: 'la',
    mode: 'jam',
    includeNearbyRegions: false,
    locationConsent: 'declined',
    lookingForJam,
    lookingForGigs: [],
    customRegions: [],
    userListings: [],
    swiped: {},
    history: [],
  };

  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: scheme },
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ],
  });

  // Ensure origin is loaded once before touching localStorage
  const targetUrl = `${baseUrl.replace(/\/$/, '')}${queryPath}`;
  await cdp.send('Page.navigate', { url: targetUrl });
  await sleep(600);
  await cdp.eval(`
    window.localStorage.setItem('color-scheme', ${JSON.stringify(scheme)});
    window.localStorage.setItem('areajam_v2_guest', ${JSON.stringify(JSON.stringify(guestState))});
  `);
  await cdp.send('Page.navigate', { url: targetUrl });
  await sleep(700);
  // Force full reload so App initializes cleanly with localStorage state
  await cdp.send('Page.reload', { ignoreCache: true });
  await sleep(800);
}

async function waitForSwipeReady(cdp) {
  await cdp.eval(`
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      if (document.querySelector('h2.text-white')) break;
      const startBtn = Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent && b.textContent.includes('Start swiping'));
      if (startBtn) {
        startBtn.click();
        await new Promise((r) => setTimeout(r, 250));
        break;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    const mediaDeadline = Date.now() + 8000;
    while (Date.now() < mediaDeadline) {
      const h2 = document.querySelector('h2.text-white');
      const vid = document.querySelector('video');
      if (h2 && (!vid || vid.readyState >= 2)) {
        await new Promise((r) => setTimeout(r, 450));
        break;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    document.activeElement?.blur?.();
  `);
}

async function waitForImagesLoaded(cdp, minCount = 4) {
  await cdp.eval(`
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      const imgs = Array.from(document.querySelectorAll('img'));
      const ready = imgs.filter((img) => img.complete && img.naturalWidth > 0).length;
      if (ready >= ${minCount}) {
        await new Promise((r) => setTimeout(r, 450));
        break;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    document.activeElement?.blur?.();
  `);
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const outDir = path.isAbsolute(opts.outDir) ? opts.outDir : path.resolve(repoRoot, opts.outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const tmpProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'areajam-screens-'));
  let chromeChild = null;
  let cdp = null;

  try {
    console.log(`[screens] launching Chrome against ${opts.url}...`);
    const launched = await launchChrome(tmpProfileDir);
    chromeChild = launched.child;
    cdp = new CDPClient(launched.wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // ---------------- DESKTOP 1440x900 @2x ----------------
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    // 1. desktop-landing-dark.png
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam', { scheme: 'dark' });
    await waitForImagesLoaded(cdp, 6);
    await cdp.capturePng(path.join(outDir, 'desktop-landing-dark.png'));
    console.log('[screens] saved desktop-landing-dark.png');

    // 2. desktop-swipe-light.png
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam', { scheme: 'light' });
    await waitForSwipeReady(cdp);
    await cdp.capturePng(path.join(outDir, 'desktop-swipe-light.png'));
    console.log('[screens] saved desktop-swipe-light.png');

    // 3. desktop-browse-light.png (shows compact single-row filter bar + LA grid)
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('header nav button'))
        .find((b) => b.textContent?.includes('Browse'));
      btn?.click();
    `);
    await sleep(500);
    await waitForImagesLoaded(cdp, 6);
    await cdp.capturePng(path.join(outDir, 'desktop-browse-light.png'));
    console.log('[screens] saved desktop-browse-light.png');

    // 4. desktop-profile-synth-full.png (redesigned ProfilePage — Noah Kim)
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam&profile=la-23-noah-kim', {
      scheme: 'dark',
    });
    const desktopProfileHeight = await cdp.eval(`
      const deadline = Date.now() + 9000;
      while (Date.now() < deadline) {
        const h1 = document.querySelector('h1');
        const vid = document.querySelector('video');
        if (h1 && (!vid || vid.readyState >= 2)) break;
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 600));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 350));
      document.activeElement?.blur?.();
      return Math.min(2200, Math.max(1200, document.documentElement.scrollHeight || 1500));
    `);
    await cdp.capturePng(path.join(outDir, 'desktop-profile-synth-full.png'), {
      x: 0,
      y: 0,
      width: 1440,
      height: desktopProfileHeight,
      scale: 2,
    });
    console.log(`[screens] saved desktop-profile-synth-full.png (h=${desktopProfileHeight}px)`);

    // 5. desktop-studio-dark.png
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('header nav button'))
        .find((b) => b.textContent?.includes('Profile') || b.textContent?.includes('Studio'));
      btn?.click();
    `);
    await sleep(600);
    await cdp.eval('window.scrollTo(0, 0); document.activeElement?.blur?.();');
    await cdp.capturePng(path.join(outDir, 'desktop-studio-dark.png'));
    console.log('[screens] saved desktop-studio-dark.png');

    // ---------------- MOBILE 390x844 @2x ----------------
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    // 6. mobile-swipe-synth-dark.png (Noah Kim)
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam', {
      scheme: 'dark',
      lookingForJam: ['Keys & Synth'],
    });
    await waitForSwipeReady(cdp);
    await cdp.capturePng(path.join(outDir, 'mobile-swipe-synth-dark.png'));
    console.log('[screens] saved mobile-swipe-synth-dark.png');

    // 7. mobile-swipe-drummer-dark.png (Jordan Hayes)
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam', {
      scheme: 'dark',
      lookingForJam: ['Drummers'],
    });
    await waitForSwipeReady(cdp);
    await cdp.capturePng(path.join(outDir, 'mobile-swipe-drummer-dark.png'));
    console.log('[screens] saved mobile-swipe-drummer-dark.png');

    // 8. mobile-swipe-light.png (Maya Delgado)
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam', {
      scheme: 'light',
      lookingForJam: ['Guitarists'],
    });
    await waitForSwipeReady(cdp);
    await cdp.capturePng(path.join(outDir, 'mobile-swipe-light.png'));
    console.log('[screens] saved mobile-swipe-light.png');

    // 9. mobile-filter-dropdown-dark.png
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam', {
      scheme: 'dark',
      lookingForJam: [],
    });
    await waitForSwipeReady(cdp);
    const selectRect = await cdp.eval(`
      const sel = document.getElementById('mobile-player-type');
      if (!sel) return null;
      const r = sel.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    `);
    let capturedDropdown = false;
    if (selectRect) {
      await cdp.clickAt(selectRect.x, selectRect.y);
      await sleep(350);
      const isOpen = await cdp.eval(`
        const sel = document.getElementById('mobile-player-type');
        return Boolean(sel && sel.matches(':open'));
      `);
      if (isOpen) {
        await cdp.capturePng(path.join(outDir, 'mobile-filter-dropdown-dark.png'));
        capturedDropdown = true;
        console.log('[screens] saved mobile-filter-dropdown-dark.png (open picker)');
      }
    }
    if (!capturedDropdown) {
      await cdp.eval(`
        const btn = Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] button'))
          .find((b) => b.textContent?.includes('Browse'));
        btn?.click();
      `);
      await waitForImagesLoaded(cdp, 4);
      await cdp.capturePng(path.join(outDir, 'mobile-filter-dropdown-dark.png'));
      console.log('[screens] saved mobile-filter-dropdown-dark.png (Browse roster fallback)');
    }

    // 10. mobile-profile-synth-full.png (redesigned mobile ProfilePage — Noah Kim)
    await setStateAndNavigate(cdp, opts.url, '/?area=la&mode=jam&profile=la-23-noah-kim', {
      scheme: 'dark',
    });
    const mobileProfileHeight = await cdp.eval(`
      const deadline = Date.now() + 9000;
      while (Date.now() < deadline) {
        const h1 = document.querySelector('h1');
        const vid = document.querySelector('video');
        if (h1 && (!vid || vid.readyState >= 2)) break;
        await new Promise((r) => setTimeout(r, 120));
      }
      window.scrollTo(0, document.documentElement.scrollHeight);
      await new Promise((r) => setTimeout(r, 600));
      window.scrollTo(0, 0);
      await new Promise((r) => setTimeout(r, 350));
      const nav = document.querySelector('nav[aria-label="Mobile navigation"]');
      if (nav) nav.style.display = 'none';
      document.activeElement?.blur?.();
      return Math.min(2650, Math.max(1600, document.documentElement.scrollHeight || 2200));
    `);
    await cdp.capturePng(path.join(outDir, 'mobile-profile-synth-full.png'), {
      x: 0,
      y: 0,
      width: 390,
      height: mobileProfileHeight,
      scale: 2,
    });
    console.log(`[screens] saved mobile-profile-synth-full.png (h=${mobileProfileHeight}px)`);
    console.log(`\nDone! Captured 10 fresh screenshots into ${outDir}`);
  } finally {
    if (cdp) cdp.close();
    if (chromeChild) {
      chromeChild.stderr?.destroy();
      if (!chromeChild.killed) chromeChild.kill('SIGKILL');
    }
    fs.rmSync(tmpProfileDir, { recursive: true, force: true });
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
