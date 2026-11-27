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
const OUT_DIR = path.join(repoRoot, 'docs', 'screenshots');

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    const timer = setTimeout(() => reject(new Error(`Chrome timeout:\n${stderr}`)), 15000);
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
      reject(new Error(`Chrome exited ${code}:\n${stderr}`));
    });
  });

  const urlObj = new URL(wsBrowserUrl);
  const targetsRes = await fetch(`http://127.0.0.1:${urlObj.port}/json/list`);
  const targets = await targetsRes.json();
  const pageTarget = targets.find((t) => t.type === 'page') || targets[0];
  return { child, wsUrl: pageTarget.webSocketDebuggerUrl };
}

async function setStateAndNavigate(
  cdp,
  baseUrl,
  queryPath,
  { scheme = 'dark', regionId = 'la', includeRemoteFriendly = false, lookingForJam = [] } = {}
) {
  const guestState = {
    regionId,
    mode: 'jam',
    includeNearbyRegions: false,
    includeRemoteFriendly,
    locationConsent: 'declined',
    lookingForJam,
    lookingForGigs: [],
    customRegions: [],
    userListings: [],
    swiped: {},
    history: [],
    followedIds: [],
  };

  await cdp.send('Emulation.setEmulatedMedia', {
    features: [
      { name: 'prefers-color-scheme', value: scheme },
      { name: 'prefers-reduced-motion', value: 'reduce' },
    ],
  });

  const targetUrl = `${baseUrl.replace(/\/$/, '')}${queryPath}`;
  await cdp.send('Page.navigate', { url: targetUrl });
  await sleep(500);
  await cdp.eval(`
    window.localStorage.setItem('color-scheme', ${JSON.stringify(scheme)});
    window.localStorage.setItem('areajam_v2_guest', ${JSON.stringify(JSON.stringify(guestState))});
  `);
  await cdp.send('Page.navigate', { url: targetUrl });
  await sleep(600);
  await cdp.send('Page.reload', { ignoreCache: true });
  await sleep(700);
}

async function waitForImagesLoaded(cdp, minCount = 4) {
  await cdp.eval(`
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      const imgs = Array.from(document.querySelectorAll('img'));
      const ready = imgs.filter((img) => img.complete && img.naturalWidth > 0).length;
      if (ready >= ${minCount}) {
        await new Promise((r) => setTimeout(r, 400));
        break;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    document.activeElement?.blur?.();
  `);
}

async function waitForSwipeCard(cdp, expectedName = '') {
  await cdp.eval(`
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      const h2 = document.querySelector('h2.text-white');
      if (h2) break;
      const startBtn = Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent && (b.textContent.includes('Start swiping') || b.textContent.includes('Open clip reels')));
      if (startBtn) {
        startBtn.click();
        await new Promise((r) => setTimeout(r, 300));
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    const want = ${JSON.stringify(expectedName)};
    if (want) {
      for (let step = 0; step < 18; step++) {
        const h2 = document.querySelector('h2.text-white');
        if (h2 && h2.textContent && h2.textContent.includes(want)) break;
        const passBtn = Array.from(document.querySelectorAll('button'))
          .find((b) => (b.getAttribute('aria-label') || '').startsWith('Pass on '));
        if (!passBtn) break;
        passBtn.click();
        await new Promise((r) => setTimeout(r, 260));
      }
    }
    const mediaDeadline = Date.now() + 8000;
    while (Date.now() < mediaDeadline) {
      const vid = document.querySelector('video');
      if (!vid || vid.readyState >= 2) {
        await new Promise((r) => setTimeout(r, 400));
        break;
      }
      await new Promise((r) => setTimeout(r, 120));
    }
    document.activeElement?.blur?.();
  `);
}

async function captureFullProfile(cdp, baseUrl, profileId, outFile, width, maxHeight) {
  await setStateAndNavigate(cdp, baseUrl, `/?area=la&mode=jam&profile=${profileId}`, {
    scheme: 'dark',
  });
  const height = await cdp.eval(`
    const deadline = Date.now() + 9000;
    while (Date.now() < deadline) {
      const h1 = document.querySelector('h1');
      const vid = document.querySelector('video');
      if (h1 && (!vid || vid.readyState >= 2)) break;
      await new Promise((r) => setTimeout(r, 120));
    }
    window.scrollTo(0, document.documentElement.scrollHeight);
    await new Promise((r) => setTimeout(r, 500));
    window.scrollTo(0, 0);
    await new Promise((r) => setTimeout(r, 350));
    const nav = document.querySelector('nav[aria-label="Mobile navigation"]');
    if (nav) nav.style.display = 'none';
    document.activeElement?.blur?.();
    return Math.min(${maxHeight}, Math.max(1200, document.documentElement.scrollHeight || 1600));
  `);
  await cdp.capturePng(path.join(OUT_DIR, outFile), {
    x: 0,
    y: 0,
    width,
    height,
    scale: 2,
  });
  console.log(`[screens] saved ${outFile} (h=${height}px)`);
}

async function main() {
  const baseUrl = process.argv[2] || DEFAULT_URL;
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const tmpProfileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'areajam-v2-screens-'));
  let chromeChild = null;
  let cdp = null;

  try {
    const launched = await launchChrome(tmpProfileDir);
    chromeChild = launched.child;
    cdp = new CDPClient(launched.wsUrl);
    await cdp.connect();
    await cdp.send('Page.enable');
    await cdp.send('Runtime.enable');

    // ==================== DESKTOP 1440x900 @2x ====================
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 1440,
      height: 900,
      deviceScaleFactor: 2,
      mobile: false,
    });

    // 1. Landing Panoramic Hero
    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', { scheme: 'dark' });
    await waitForImagesLoaded(cdp, 6);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-landing-dark.png'));
    console.log('[screens] saved desktop-landing-dark.png');

    // 2. Find a Musician (LA, Dark)
    await cdp.eval(`
      Array.from(document.querySelectorAll('header nav button'))
        .find((b) => b.textContent?.includes('Find a Musician'))?.click();
    `);
    await sleep(500);
    await waitForImagesLoaded(cdp, 8);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-musicians-dark.png'));
    console.log('[screens] saved desktop-musicians-dark.png');

    // 3. Find a Teacher (LA, Light — shows Teacher · $XX/hr badges)
    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', { scheme: 'light' });
    await cdp.eval(`
      Array.from(document.querySelectorAll('header nav button'))
        .find((b) => b.textContent?.includes('Find a Teacher'))?.click();
    `);
    await sleep(500);
    await waitForImagesLoaded(cdp, 6);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-teachers-light.png'));
    console.log('[screens] saved desktop-teachers-light.png');

    // 4. Find a Session Player (Nashville + Include remote-friendly ON, Dark)
    await setStateAndNavigate(cdp, baseUrl, '/?area=nashville&mode=jam', {
      scheme: 'dark',
      regionId: 'nashville',
      includeRemoteFriendly: true,
    });
    await cdp.eval(`
      Array.from(document.querySelectorAll('header nav button'))
        .find((b) => b.textContent?.includes('Find a Session Player'))?.click();
    `);
    await sleep(500);
    await waitForImagesLoaded(cdp, 6);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-session-remote-dark.png'));
    console.log('[screens] saved desktop-session-remote-dark.png');

    // 5. Full Profile Page — Marcus Bell (Session · $85/hr, Teacher · $70/hr, Remote, Followers)
    await captureFullProfile(cdp, baseUrl, 'la-04-marcus-bell', 'desktop-profile-marcus-full.png', 1440, 2200);

    // 6. Desktop 4-tier Connect Modal on Marcus Bell
    await cdp.eval(`
      window.scrollTo(0, 0);
      const btn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.trim() === 'Connect');
      btn?.click();
    `);
    await sleep(450);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-connect-modal-dark.png'));
    console.log('[screens] saved desktop-connect-modal-dark.png');

    // 7. Onboarding / Profile & Studio Step 1 (YouTube channel import)
    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', { scheme: 'dark' });
    await cdp.eval(`
      Array.from(document.querySelectorAll('header nav button'))
        .find((b) => b.textContent?.includes('Profile & studio'))?.click();
    `);
    await sleep(500);
    await cdp.eval(`
      const ytInput = document.getElementById('post-yt-channel');
      if (ytInput) {
        const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
        setter.call(ytInput, '@marcusbellguitar');
        ytInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
      window.scrollTo(0, 140);
      document.activeElement?.blur?.();
    `);
    await sleep(300);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-studio-step1-yt.png'));
    console.log('[screens] saved desktop-studio-step1-yt.png');

    // 8. Onboarding / Profile & Studio Step 2 (Instruments + Teacher/Session/Remote Pricing)
    await cdp.eval(`
      Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('2. Instruments & vibe'))?.click();
    `);
    await sleep(400);
    await cdp.eval(`
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
        Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setVal('post-title', 'Marcus Bell');
      setVal('post-subtitle', 'Funk & pocket rhythm guitar');
      setVal('post-neighborhood', 'Culver City');
      setVal('post-seeking', 'Pocket drummers & bassists for LA funk sessions + remote stems');
      setVal('post-bio', 'Session guitarist tracking clean Strat and ES-335 rhythm stems from my Culver City room. Available for local jams, lessons, and remote tracking.');
      ['Session Player', 'Teacher', 'Remote-friendly'].forEach((label) => {
        Array.from(document.querySelectorAll('button'))
          .find((b) => b.textContent?.trim() === label)?.click();
      });
    `);
    await sleep(300);
    await cdp.eval(`
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (!el) return;
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(el, val);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      };
      setVal('post-session-rate', '$85/hr');
      setVal('post-lesson-rate', '$70/hr');
      setVal('post-service-note', 'Remote rhythm stems in 48h & 1-on-1 funk guitar coaching.');
      const target = document.getElementById('post-session-rate');
      target?.scrollIntoView({ block: 'center' });
      document.activeElement?.blur?.();
    `);
    await sleep(350);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-studio-step2-services.png'));
    console.log('[screens] saved desktop-studio-step2-services.png');

    // 9. Onboarding / Profile & Studio Step 3 (Live Preview & Publish)
    await cdp.eval(`
      Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent?.includes('3. Preview & publish'))?.click();
    `);
    await sleep(450);
    await cdp.eval('window.scrollTo(0, 180); document.activeElement?.blur?.();');
    await sleep(250);
    await cdp.capturePng(path.join(OUT_DIR, 'desktop-studio-step3-preview.png'));
    console.log('[screens] saved desktop-studio-step3-preview.png');

    // ==================== MOBILE 390x844 @2x ====================
    await cdp.send('Emulation.setDeviceMetricsOverride', {
      width: 390,
      height: 844,
      deviceScaleFactor: 2,
      mobile: true,
    });

    // --- Video 1: Find a Musician (Local Jam) ---
    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', {
      scheme: 'dark',
      lookingForJam: ['Guitarists'],
    });
    await waitForSwipeCard(cdp, 'Maya Delgado');
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-musician-swipe-maya.png'));
    console.log('[screens] saved mobile-musician-swipe-maya.png');

    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', {
      scheme: 'dark',
      lookingForJam: ['Drummers'],
    });
    await waitForSwipeCard(cdp, 'Chloe Park');
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-musician-swipe-chloe.png'));
    console.log('[screens] saved mobile-musician-swipe-chloe.png');

    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', { scheme: 'dark' });
    await cdp.eval(`
      Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] button'))
        .find((b) => b.textContent?.includes('Browse'))?.click();
    `);
    await sleep(450);
    await waitForImagesLoaded(cdp, 4);
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-musician-browse-la.png'));
    console.log('[screens] saved mobile-musician-browse-la.png');

    await captureFullProfile(cdp, baseUrl, 'la-13-amara-okafor', 'mobile-musician-profile-amara.png', 390, 2600);

    // --- Video 2: Find a Teacher (Local Lessons) ---
    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', { scheme: 'light' });
    await cdp.eval(`
      Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] button'))
        .find((b) => b.textContent?.includes('Browse'))?.click();
    `);
    await sleep(350);
    await cdp.eval(`
      Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === 'Teachers')?.click();
    `);
    await sleep(450);
    await waitForImagesLoaded(cdp, 4);
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-teacher-browse-la.png'));
    console.log('[screens] saved mobile-teacher-browse-la.png');

    // Mobile Teachers Swipe — Marcus Bell & Hannah Choi
    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', { scheme: 'dark' });
    await waitForSwipeCard(cdp, '');
    await cdp.eval(`
      Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === 'Teachers')?.click();
    `);
    await sleep(400);
    await waitForSwipeCard(cdp, 'Marcus Bell');
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-teacher-swipe-marcus.png'));
    console.log('[screens] saved mobile-teacher-swipe-marcus.png');

    await setStateAndNavigate(cdp, baseUrl, '/?area=la&mode=jam', { scheme: 'dark' });
    await waitForSwipeCard(cdp, '');
    await cdp.eval(`
      Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === 'Teachers')?.click();
    `);
    await sleep(400);
    await waitForSwipeCard(cdp, 'Hannah Choi');
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-teacher-swipe-hannah.png'));
    console.log('[screens] saved mobile-teacher-swipe-hannah.png');

    // Mobile Teacher Connect Modal (Lesson pre-selected)
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button'))
        .find((b) => (b.getAttribute('aria-label') || '').startsWith('Jam with '));
      btn?.click();
    `);
    await sleep(400);
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-teacher-connect-modal.png'));
    console.log('[screens] saved mobile-teacher-connect-modal.png');

    await captureFullProfile(cdp, baseUrl, 'la-04-marcus-bell', 'mobile-teacher-profile-marcus.png', 390, 2600);

    // --- Video 3: Find a Session Player (Remote Studio Work) ---
    await setStateAndNavigate(cdp, baseUrl, '/?area=nashville&mode=jam', {
      scheme: 'dark',
      regionId: 'nashville',
      includeRemoteFriendly: true,
    });
    await cdp.eval(`
      Array.from(document.querySelectorAll('nav[aria-label="Mobile navigation"] button'))
        .find((b) => b.textContent?.includes('Browse'))?.click();
    `);
    await sleep(350);
    await cdp.eval(`
      Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === 'Session')?.click();
    `);
    await sleep(450);
    await waitForImagesLoaded(cdp, 4);
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-session-remote-browse.png'));
    console.log('[screens] saved mobile-session-remote-browse.png');

    // Mobile Session Remote Swipe — Ethan Park & Darius Cole
    await setStateAndNavigate(cdp, baseUrl, '/?area=nashville&mode=jam', {
      scheme: 'dark',
      regionId: 'nashville',
      includeRemoteFriendly: true,
    });
    await waitForSwipeCard(cdp, '');
    await cdp.eval(`
      Array.from(document.querySelectorAll('button'))
        .find((b) => b.textContent?.trim() === 'Session')?.click();
    `);
    await sleep(400);
    await waitForSwipeCard(cdp, 'Darius Cole');
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-session-swipe-darius.png'));
    console.log('[screens] saved mobile-session-swipe-darius.png');

    await waitForSwipeCard(cdp, 'Ethan Park');
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-session-swipe-ethan.png'));
    console.log('[screens] saved mobile-session-swipe-ethan.png');

    // Mobile Session Connect Modal (Session pre-selected)
    await cdp.eval(`
      const btn = Array.from(document.querySelectorAll('button'))
        .find((b) => (b.getAttribute('aria-label') || '').startsWith('Jam with '));
      btn?.click();
    `);
    await sleep(400);
    await cdp.capturePng(path.join(OUT_DIR, 'mobile-session-connect-modal.png'));
    console.log('[screens] saved mobile-session-connect-modal.png');

    await captureFullProfile(cdp, baseUrl, 'la-24-claire-dupont', 'mobile-session-profile-claire.png', 390, 2600);

    console.log('\nDone! Captured all 23 fresh screenshots.');
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
