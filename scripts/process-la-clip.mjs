#!/usr/bin/env node
import { execFileSync, spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const REMOTION_BIN_DIR = path.join(
  repoRoot,
  'promo-studio',
  'node_modules',
  '@remotion',
  'compositor-darwin-arm64'
);
const FFMPEG = path.join(REMOTION_BIN_DIR, 'ffmpeg');
const FFPROBE = path.join(REMOTION_BIN_DIR, 'ffprobe');
const CHROME_HEADLESS_SHELL = path.join(
  repoRoot,
  'promo-studio',
  'node_modules',
  '.remotion',
  'chrome-headless-shell',
  '158.0.8127.2-remotion-v3',
  'mac-arm64',
  'chrome-headless-shell-mac-arm64',
  'chrome-headless-shell'
);
const CHROME = fs.existsSync(CHROME_HEADLESS_SHELL)
  ? CHROME_HEADLESS_SHELL
  : '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const USE_HEADLESS_SHELL = CHROME === CHROME_HEADLESS_SHELL;
const OUT_DIR = path.join(repoRoot, 'public', 'profiles', 'la');

function parseArgs(argv) {
  let inPath = '';
  let id = '';
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--in' && argv[i + 1]) {
      inPath = argv[++i];
    } else if (argv[i] === '--id' && argv[i + 1]) {
      id = argv[++i];
    }
  }
  if (!inPath || !id) {
    throw new Error('Usage: node scripts/process-la-clip.mjs --in <raw.mp4> --id <profile-id>');
  }
  return { inPath: path.resolve(inPath), id };
}

function runBin(bin, args) {
  return execFileSync(bin, args, {
    env: {
      ...process.env,
      DYLD_LIBRARY_PATH: `${REMOTION_BIN_DIR}${process.env.DYLD_LIBRARY_PATH ? `:${process.env.DYLD_LIBRARY_PATH}` : ''}`,
    },
    encoding: 'utf-8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
}

function probeMedia(filePath) {
  const out = runBin(FFPROBE, [
    '-v',
    'error',
    '-show_entries',
    'stream=codec_type,codec_name,width,height,r_frame_rate,sample_rate,channels',
    '-show_entries',
    'format=duration,size',
    '-of',
    'json',
    filePath,
  ]);
  return JSON.parse(out);
}

function applyMicroFadeWav(wavPath, fadeSec = 0.02) {
  const buf = fs.readFileSync(wavPath);
  const dataMarker = Buffer.from('data');
  const dataIdx = buf.indexOf(dataMarker);
  if (dataIdx === -1 || dataIdx + 8 > buf.length) {
    throw new Error(`Invalid WAV (missing data chunk): ${wavPath}`);
  }
  const channels = buf.readUInt16LE(22) || 2;
  const sampleRate = buf.readUInt32LE(24) || 48000;
  const bitsPerSample = buf.readUInt16LE(34) || 16;
  if (bitsPerSample !== 16) {
    throw new Error(`Expected 16-bit PCM WAV, got ${bitsPerSample}-bit`);
  }
  const dataStart = dataIdx + 8;
  const declaredBytes = buf.readUInt32LE(dataIdx + 4);
  const dataEnd = Math.min(buf.length, dataStart + declaredBytes);
  const bytesPerFrame = channels * 2;
  const totalFrames = Math.floor((dataEnd - dataStart) / bytesPerFrame);
  const fadeFrames = Math.min(Math.floor(sampleRate * fadeSec), Math.floor(totalFrames / 4));

  for (let f = 0; f < fadeFrames; f += 1) {
    const gIn = f / Math.max(1, fadeFrames);
    for (let c = 0; c < channels; c += 1) {
      const off = dataStart + (f * channels + c) * 2;
      buf.writeInt16LE(Math.round(buf.readInt16LE(off) * gIn), off);
    }
    const endFrame = totalFrames - 1 - f;
    for (let c = 0; c < channels; c += 1) {
      const off = dataStart + (endFrame * channels + c) * 2;
      buf.writeInt16LE(Math.round(buf.readInt16LE(off) * gIn), off);
    }
  }
  fs.writeFileSync(wavPath, buf);
}

async function pngToWebpViaChrome(pngPath, outWebpPath) {
  const pngB64 = fs.readFileSync(pngPath).toString('base64');
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'la-webp-'));
  const htmlPath = path.join(tmpDir, 'frame.html');
  const userDataDir = path.join(tmpDir, 'profile');
  fs.mkdirSync(userDataDir, { recursive: true });
  fs.writeFileSync(
    htmlPath,
    `<!doctype html><html><body style="margin:0;background:#000"><img src="data:image/png;base64,${pngB64}" style="width:720px;height:1280px;display:block"/></body></html>`
  );

  const port = 9400 + Math.floor(Math.random() * 500);
  const chromeArgs = [
    ...(USE_HEADLESS_SHELL ? [] : ['--headless=new']),
    '--no-sandbox',
    '--disable-gpu',
    '--no-first-run',
    '--no-default-browser-check',
    `--remote-debugging-port=${port}`,
    `--user-data-dir=${userDataDir}`,
    '--window-size=720,1280',
    `file://${htmlPath}`,
  ];
  const chrome = spawn(CHROME, chromeArgs, { stdio: 'ignore' });

  let ws;
  try {
    let wsUrl = '';
    for (let i = 0; i < 120; i += 1) {
      try {
        const res = await fetch(`http://127.0.0.1:${port}/json`);
        const targets = await res.json();
        const page = targets.find((t) => t.type === 'page');
        if (page?.webSocketDebuggerUrl) {
          wsUrl = page.webSocketDebuggerUrl;
          break;
        }
      } catch {
        // retry until CDP port opens
      }
      await new Promise((r) => setTimeout(r, 100));
    }
    if (!wsUrl) {
      throw new Error('Chrome CDP timeout while converting poster PNG to WebP');
    }

    ws = new WebSocket(wsUrl);
    await new Promise((resolve, reject) => {
      ws.onopen = resolve;
      ws.onerror = reject;
    });

    let seq = 1;
    const cdpCall = (method, params = {}) =>
      new Promise((resolve, reject) => {
        const id = seq++;
        const onMessage = (ev) => {
          const msg = JSON.parse(ev.data);
          if (msg.id === id) {
            ws.removeEventListener('message', onMessage);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        };
        ws.addEventListener('message', onMessage);
        ws.send(JSON.stringify({ id, method, params }));
      });

    await cdpCall('Emulation.setDeviceMetricsOverride', {
      width: 720,
      height: 1280,
      deviceScaleFactor: 1,
      mobile: false,
    });
    await new Promise((r) => setTimeout(r, 250));
    const shot = await cdpCall('Page.captureScreenshot', { format: 'webp', quality: 82 });
    fs.writeFileSync(outWebpPath, Buffer.from(shot.data, 'base64'));
  } finally {
    try {
      ws?.close();
    } catch {
      // ignore close errors
    }
    try {
      chrome.kill('SIGTERM');
    } catch {
      // ignore kill errors
    }
    await new Promise((r) => setTimeout(r, 200));
    try {
      fs.rmSync(tmpDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // ignore lingering temp lock
    }
  }
}

async function main() {
  const { inPath, id } = parseArgs(process.argv.slice(2));
  if (!fs.existsSync(inPath)) {
    throw new Error(`Input file not found: ${inPath}`);
  }
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const inputProbe = probeMedia(inPath);
  const streams = inputProbe.streams ?? [];
  if (!streams.some((s) => s.codec_type === 'video')) {
    throw new Error(`No video stream found in ${inPath}`);
  }
  if (!streams.some((s) => s.codec_type === 'audio')) {
    throw new Error(`No audio stream found in ${inPath}`);
  }

  const workDir = fs.mkdtempSync(path.join(os.tmpdir(), `la-proc-${id}-`));
  const tmpWav = path.join(workDir, `${id}-norm.wav`);
  const tmpPng = path.join(workDir, `${id}-poster.png`);
  const outMp4 = path.join(OUT_DIR, `${id}.mp4`);
  const outWebp = path.join(OUT_DIR, `${id}.webp`);

  try {
    runBin(FFMPEG, [
      '-y',
      '-i',
      inPath,
      '-vn',
      '-af',
      'loudnorm=I=-14:TP=-1.5:LRA=11',
      '-ar',
      '48000',
      '-ac',
      '2',
      '-c:a',
      'pcm_s16le',
      tmpWav,
    ]);

    applyMicroFadeWav(tmpWav, 0.02);

    runBin(FFMPEG, [
      '-y',
      '-i',
      inPath,
      '-i',
      tmpWav,
      '-map',
      '0:v:0',
      '-map',
      '1:a:0',
      '-vf',
      'scale=720:1280:force_original_aspect_ratio=increase,crop=720:1280',
      '-r',
      '30',
      '-pix_fmt',
      'yuv420p',
      '-c:v',
      'libx264',
      '-preset',
      'medium',
      '-crf',
      '23',
      '-movflags',
      '+faststart',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-ar',
      '48000',
      '-shortest',
      outMp4,
    ]);

    const outProbe = probeMedia(outMp4);
    const outDuration = Number.parseFloat(outProbe.format?.duration ?? '8') || 8;
    const frameTime = Math.min(1.5, Math.max(0.25, outDuration * 0.25)).toFixed(2);

    runBin(FFMPEG, [
      '-y',
      '-ss',
      frameTime,
      '-i',
      outMp4,
      '-frames:v',
      '1',
      '-update',
      '1',
      tmpPng,
    ]);

    await pngToWebpViaChrome(tmpPng, outWebp);

    const mp4Bytes = fs.statSync(outMp4).size;
    const webpBytes = fs.statSync(outWebp).size;
    const durationSec = Math.max(5, Math.min(10, Math.round(outDuration)));

    console.log(
      JSON.stringify({
        id,
        durationSec,
        durationRaw: Number(outDuration.toFixed(3)),
        mp4Bytes,
        webpBytes,
      })
    );
  } finally {
    try {
      fs.rmSync(workDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
    } catch {
      // ignore temp cleanup errors
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
