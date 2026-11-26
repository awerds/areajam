import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const studioRoot = path.resolve(__dirname, '..');
const repoRoot = path.resolve(studioRoot, '..');

function parseArgs(argv) {
  const opts = {
    preset: '',
    city: '',
    role: 'Musicians',
    format: '',
    url: '',
    tts: 'edge',
    voice: 'en-US-AndrewMultilingualNeural',
    rate: '+6%',
    music: 'auto',
    fresh: 'false',
    out: '',
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
    if (key in opts) {
      opts[key] = val;
    }
  }
  return opts;
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'custom';
}

function buildCityScript(city, role, format, captured = null) {
  const cleanRole = role || 'Musicians';
  const rolePhrase = cleanRole.toLowerCase();
  const isLandscape = format === 'landscape';
  const hasCityMobile = !isLandscape && captured && Array.isArray(captured.cards) && captured.cards.length >= 3;
  const c0 = hasCityMobile ? captured.cards[0] : null;
  const c1 = hasCityMobile ? captured.cards[1] : null;
  const c2 = hasCityMobile ? captured.cards[2] : null;

  return {
    title: `AreaJam ${city} ${cleanRole}`,
    width: isLandscape ? 1920 : 1080,
    height: isLandscape ? 1080 : 1920,
    fps: 30,
    ctaUrl: 'areajam.com',
    ctaTagline: 'Find your tribe. Match with musicians today.',
    scenes: [
      {
        id: 'hook',
        badge: `Tinder for ${city} ${cleanRole}`,
        headline: `Like Tinder — for ${city} ${rolePhrase}`,
        subline: 'Real clips. Zero small talk.',
        media: isLandscape ? 'screenshots/desktop-landing-dark.png' : (c0 ? c0.media : 'screenshots/mobile-swipe-synth-dark.png'),
        chromeMedia: c0 ? c0.media : 'screenshots/mobile-swipe-synth-dark.png',
        secondaryMedia: c1 ? c1.media : 'screenshots/mobile-swipe-drummer-dark.png',
        primaryVideo: c0 ? (c0.videoRel || '') : 'generated/clips/la-23-noah-kim.mp4',
        secondaryVideo: c1 ? (c1.videoRel || '') : 'generated/clips/la-07-jordan-hayes.mp4',
        primaryAudio: c0 ? (c0.audioRel || '') : 'generated/clips/la-23-noah-kim.wav',
        secondaryAudio: c1 ? (c1.audioRel || '') : 'generated/clips/la-07-jordan-hayes.wav',
        mediaType: isLandscape ? 'desktop' : 'phone-swipe',
        motion: 'zoom-in',
        narration: `Like Tinder for finding ${rolePhrase} in ${city} — meet AreaJam, built around real local clips.`,
      },
      {
        id: 'swipe',
        badge: 'Swipe Right to Jam',
        headline: 'Swipe left to pass, swipe right to jam',
        subline: 'YouTube, Instagram & SoundCloud',
        media: isLandscape ? 'screenshots/desktop-swipe-light.png' : (c1 ? c1.media : 'screenshots/mobile-swipe-drummer-dark.png'),
        chromeMedia: c0 ? c0.media : 'screenshots/mobile-swipe-synth-dark.png',
        midMedia: c2 ? c2.media : 'screenshots/mobile-swipe-light.png',
        secondaryMedia: c0 ? c0.media : 'screenshots/mobile-swipe-synth-dark.png',
        primaryVideo: c1 ? (c1.videoRel || '') : 'generated/clips/la-07-jordan-hayes.mp4',
        midVideo: c2 ? (c2.videoRel || '') : 'generated/clips/la-01-maya-delgado.mp4',
        secondaryVideo: c0 ? (c0.videoRel || '') : 'generated/clips/la-23-noah-kim.mp4',
        primaryAudio: c1 ? (c1.audioRel || '') : 'generated/clips/la-07-jordan-hayes.wav',
        midAudio: c2 ? (c2.audioRel || '') : 'generated/clips/la-01-maya-delgado.wav',
        secondaryAudio: c0 ? (c0.audioRel || '') : 'generated/clips/la-23-noah-kim.wav',
        mediaType: isLandscape ? 'desktop' : 'phone-swipe',
        motion: 'zoom-in',
        narration: 'Swipe left to pass, swipe right to send a jam invite, and hear linked YouTube or Instagram clips right on the card.',
      },
      {
        id: 'filter',
        badge: `${city} | ${cleanRole}`,
        headline: 'Filter city and instrument in one tap',
        subline: 'Browse free without signing in',
        media: (!isLandscape && captured?.filterMedia) ? captured.filterMedia : 'screenshots/mobile-filter-dropdown-dark.png',
        mediaType: 'phone',
        motion: 'tilt-left',
        narration: `Set your board to ${city}, filter straight to ${rolePhrase}, and browse nearby players with zero account required.`,
      },
      {
        id: 'profile',
        badge: 'Full Profile & Gear',
        headline: 'Scroll rigs, clips & vibe before you jam',
        subline: 'Link your YouTube handle in 60 seconds',
        media: isLandscape
          ? 'screenshots/desktop-profile-synth-full.png'
          : (captured?.profileMedia || 'screenshots/mobile-profile-synth-full.png'),
        clipAudio: captured?.profileClip?.audioRel || c0?.audioRel || 'generated/clips/la-23-noah-kim.wav',
        mediaType: isLandscape ? 'desktop-scroll' : 'phone-scroll',
        scrollEndPct: isLandscape ? 45 : 68,
        motion: 'zoom-out',
        narration: 'Open any profile to scroll through live studio clips, inspect their gear locker, and message one-on-one once you match.',
      },
      {
        id: 'cta',
        badge: 'Free Web App',
        headline: 'Find your tribe. Match with musicians today.',
        subline: `Drop ${city} in the comments`,
        media: '',
        mediaType: 'endcard',
        motion: 'pulse',
        narration: `Go to areajam dot com right now and drop ${city} and what you play in the comments.`,
      },
    ],
  };
}

function syncScreenshots() {
  const srcDir = path.join(repoRoot, 'docs', 'screenshots');
  const destDir = path.join(studioRoot, 'public', 'screenshots');
  if (!fs.existsSync(srcDir)) {
    throw new Error(`Missing docs screenshots folder at ${srcDir}`);
  }
  fs.mkdirSync(destDir, { recursive: true });
  for (const file of fs.readdirSync(srcDir)) {
    if (file.endsWith('.png') || file.endsWith('.jpg') || file.endsWith('.webp')) {
      fs.copyFileSync(path.join(srcDir, file), path.join(destDir, file));
    }
  }
}

function resolvePythonBin() {
  const venvPy = path.join(studioRoot, '.venv', 'bin', 'python');
  if (fs.existsSync(venvPy)) return venvPy;
  return 'python3';
}

const SAMPLE_CLIPS = [
  {
    filename: 'la-36-darius-cole.mp4',
    url: path.join(repoRoot, 'public', 'profiles', 'la', 'la-36-darius-cole.mp4'),
  },
  {
    filename: 'la-32-jaylen-scott.mp4',
    url: path.join(repoRoot, 'public', 'profiles', 'la', 'la-32-jaylen-scott.mp4'),
  },
  {
    filename: 'la-40-sam-whitaker.mp4',
    url: path.join(repoRoot, 'public', 'profiles', 'la', 'la-40-sam-whitaker.mp4'),
  },
  {
    filename: 'la-23-noah-kim.mp4',
    url: path.join(repoRoot, 'public', 'profiles', 'la', 'la-23-noah-kim.mp4'),
  },
];

function ensureMusicDir() {
  const musicDir = path.join(studioRoot, 'music');
  fs.mkdirSync(musicDir, { recursive: true });
  const readmePath = path.join(musicDir, 'README.txt');
  if (!fs.existsSync(readmePath)) {
    fs.writeFileSync(
      readmePath,
      [
        'Drop any studio backing track (.mp3, .wav, .m4a, .aac, or .ogg) into this folder.',
        'generate.mjs automatically selects the first audio file found here on render and',
        'ducks it cleanly behind the live musician clip cards during swipe scenes.',
        '',
        'To force the fallback synthetic test groove instead, run:',
        '  npm run render -- --music=synth',
        '',
      ].join('\n')
    );
  }
  return musicDir;
}

function findStudioMusicTrack(musicDir) {
  if (!fs.existsSync(musicDir)) return '';
  const files = fs
    .readdirSync(musicDir)
    .filter((f) => !f.startsWith('.') && /\.(mp3|wav|m4a|aac|ogg)$/i.test(f))
    .sort();
  return files.length > 0 ? path.join(musicDir, files[0]) : '';
}

async function ensureClipAsset(clipsDir, pyBin, filename, url) {
  fs.mkdirSync(clipsDir, { recursive: true });
  const extractScript = path.join(studioRoot, 'scripts', 'extract_clip_audio.py');
  const dest = path.join(clipsDir, filename);
  if (fs.existsSync(dest) && fs.statSync(dest).size > 10000) {
    console.log(`[media] cached clip -> generated/clips/${filename}`);
  } else if (/^https?:\/\//i.test(url)) {
    console.log(`[media] downloading clip -> ${filename}`);
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`Failed to download clip ${url}: HTTP ${res.status}`);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.log(`[media] saved ${(buf.length / (1024 * 1024)).toFixed(2)} MB -> generated/clips/${filename}`);
  } else if (fs.existsSync(url)) {
    fs.copyFileSync(url, dest);
    const mb = (fs.statSync(dest).size / (1024 * 1024)).toFixed(2);
    console.log(`[media] copied local clip (${mb} MB) -> generated/clips/${filename}`);
  } else {
    throw new Error(`Clip source not found: ${url}`);
  }

  const wavDest = dest.replace(/\.mp4$/i, '.wav');
  const needsExtract =
    !fs.existsSync(wavDest) ||
    fs.statSync(wavDest).size < 1000 ||
    fs.statSync(wavDest).mtimeMs < fs.statSync(dest).mtimeMs;
  if (needsExtract) {
    execFileSync(pyBin, [extractScript, '--in', dest, '--out', wavDest], {
      cwd: studioRoot,
      stdio: 'inherit',
    });
  }

  const stem = filename.replace(/\.mp4$/i, '');
  return {
    videoRel: `generated/clips/${filename}`,
    audioRel: `generated/clips/${stem}.wav`,
  };
}

function hasMidClipSilenceDip(wavPath) {
  if (!fs.existsSync(wavPath)) return false;
  const buf = fs.readFileSync(wavPath);
  const dataIdx = buf.indexOf(Buffer.from('data'));
  if (dataIdx === -1 || dataIdx + 8 >= buf.length) return false;
  const dataStart = dataIdx + 8;
  const dataEnd = Math.min(buf.length, dataStart + buf.readUInt32LE(dataIdx + 4));
  const sr = buf.readUInt32LE(24) || 44100;
  const ch = buf.readUInt16LE(22) || 2;
  const bytesPerSampleFrame = ch * 2;
  const winFrames = Math.floor(sr * 0.5);
  const minOffset = dataStart + Math.floor(sr * 0.5) * bytesPerSampleFrame;
  const maxOffset = Math.min(dataEnd, dataStart + Math.floor(sr * 7.0) * bytesPerSampleFrame);

  for (let off = minOffset; off + winFrames * bytesPerSampleFrame <= maxOffset; off += winFrames * bytesPerSampleFrame) {
    let sumSq = 0;
    const sampleCount = winFrames * ch;
    for (let i = 0; i < sampleCount; i += 1) {
      const s = buf.readInt16LE(off + i * 2) / 32768.0;
      sumSq += s * s;
    }
    const rmsDb = 20 * Math.log10(Math.max(Math.sqrt(sumSq / sampleCount), 1e-9));
    if (rmsDb < -32.0) {
      return true;
    }
  }
  return false;
}

async function ensureSampleClips(generatedDir, pyBin) {
  const clipsDir = path.join(generatedDir, 'clips');
  for (const clip of SAMPLE_CLIPS) {
    await ensureClipAsset(clipsDir, pyBin, clip.filename, clip.url);
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  syncScreenshots();

  const generatedDir = path.join(studioRoot, 'public', 'generated');
  fs.mkdirSync(generatedDir, { recursive: true });
  const clipsDir = path.join(generatedDir, 'clips');
  const musicDir = ensureMusicDir();
  const pyBin = resolvePythonBin();

  let scriptPath;
  let defaultSlug;

  if (opts.city && !opts.preset) {
    const captureSlug = `${slugify(opts.city)}-${slugify(opts.role)}`;
    const captureDir = path.join(generatedDir, 'captures', captureSlug);
    const captureScript = path.join(studioRoot, 'scripts', 'capture_city_assets.mjs');
    const captureArgs = [captureScript, '--city', opts.city, '--role', opts.role, '--out-dir', captureDir];
    if (opts.url) {
      captureArgs.push('--url', opts.url);
    }
    if (opts.fresh === 'true') {
      captureArgs.push('--force');
    }
    execFileSync('node', captureArgs, { cwd: studioRoot, stdio: 'inherit' });
    const captured = JSON.parse(fs.readFileSync(path.join(captureDir, 'capture-manifest.json'), 'utf-8'));

    const clipItems = [...(captured.cards || []), ...(captured.profileClip ? [captured.profileClip] : [])];
    for (const item of clipItems) {
      if (item?.clipUrl && item?.clipSlug) {
        const rels = await ensureClipAsset(clipsDir, pyBin, item.clipSlug, item.clipUrl);
        item.videoRel = rels.videoRel;
        item.audioRel = rels.audioRel;
      }
    }
    if (captured.cards?.length >= 3 && captured.cards[1].audioRel && captured.cards[2].audioRel) {
      const dip1 = hasMidClipSilenceDip(path.join(studioRoot, 'public', captured.cards[1].audioRel));
      const dip2 = hasMidClipSilenceDip(path.join(studioRoot, 'public', captured.cards[2].audioRel));
      if (dip1 && !dip2) {
        const tmpCard = captured.cards[1];
        captured.cards[1] = captured.cards[2];
        captured.cards[2] = tmpCard;
        console.log(`[media] promoted continuous clip -> ${captured.cards[1].title} (avoids mid-clip pause)`);
      }
    }
    if (opts.format === 'landscape') {
      await ensureSampleClips(generatedDir, pyBin);
    }

    const cityScript = buildCityScript(opts.city, opts.role, opts.format || 'short', captured);
    scriptPath = path.join(generatedDir, 'active-script.json');
    fs.writeFileSync(scriptPath, JSON.stringify(cityScript, null, 2));
    defaultSlug = `${slugify(opts.city)}-${slugify(opts.role)}-${opts.format === 'landscape' ? 'wide' : 'short'}`;
  } else {
    await ensureSampleClips(generatedDir, pyBin);
    const chosenPreset = opts.preset || 'presets/general-short.json';
    scriptPath = path.isAbsolute(chosenPreset)
      ? chosenPreset
      : path.join(studioRoot, chosenPreset);
    if (!fs.existsSync(scriptPath)) {
      throw new Error(`Preset file not found: ${scriptPath}`);
    }
    defaultSlug = path.basename(scriptPath, path.extname(scriptPath));
  }

  const ttsScript = path.join(studioRoot, 'scripts', 'tts_generate.py');

  console.log(`\n[1/3] Synthesizing ${opts.tts} voiceover (${opts.voice})...`);
  execFileSync(
    pyBin,
    [
      ttsScript,
      '--script',
      scriptPath,
      '--out-dir',
      generatedDir,
      '--provider',
      opts.tts,
      '--voice',
      opts.voice,
      '--rate',
      opts.rate,
    ],
    { cwd: studioRoot, stdio: 'inherit' }
  );

  const manifestPath = path.join(generatedDir, 'timeline.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

  console.log('\n[2/3] Preparing background music & card SFX...');
  const grooveScript = path.join(studioRoot, 'scripts', 'make_groove.py');
  if (opts.music === 'none') {
    execFileSync(pyBin, [grooveScript, '--skip-groove', '--sfx-dir', generatedDir], {
      cwd: studioRoot,
      stdio: 'inherit',
    });
    manifest.musicFile = '';
  } else if (opts.music === 'synth') {
    const groovePath = path.join(generatedDir, 'groove.wav');
    execFileSync(pyBin, [grooveScript, '--out', groovePath, '--sfx-dir', generatedDir], {
      cwd: studioRoot,
      stdio: 'inherit',
    });
    manifest.musicFile = 'generated/groove.wav';
  } else if (opts.music === 'auto') {
    execFileSync(pyBin, [grooveScript, '--skip-groove', '--sfx-dir', generatedDir], {
      cwd: studioRoot,
      stdio: 'inherit',
    });
    const studioTrack = findStudioMusicTrack(musicDir);
    if (studioTrack) {
      const ext = path.extname(studioTrack) || '.mp3';
      const destMusic = path.join(generatedDir, `custom-music${ext}`);
      fs.copyFileSync(studioTrack, destMusic);
      manifest.musicFile = `generated/custom-music${ext}`;
      console.log(`[music] using studio track -> music/${path.basename(studioTrack)}`);
    } else {
      manifest.musicFile = '';
      console.log(
        '[music] no track found in promo-studio/music/ — using real musician clip audio only (drop an .mp3/.wav track in promo-studio/music/ or pass --music=synth).'
      );
    }
  } else {
    execFileSync(pyBin, [grooveScript, '--skip-groove', '--sfx-dir', generatedDir], {
      cwd: studioRoot,
      stdio: 'inherit',
    });
    const customSrc = path.isAbsolute(opts.music) ? opts.music : path.resolve(studioRoot, opts.music);
    if (!fs.existsSync(customSrc)) {
      throw new Error(`Custom music file not found: ${customSrc}`);
    }
    const ext = path.extname(customSrc) || '.mp3';
    const destMusic = path.join(generatedDir, `custom-music${ext}`);
    fs.copyFileSync(customSrc, destMusic);
    manifest.musicFile = `generated/custom-music${ext}`;
    console.log(`[music] using custom track -> ${customSrc}`);
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const outFile = opts.out
    ? path.isAbsolute(opts.out)
      ? opts.out
      : path.join(studioRoot, opts.out)
    : path.join(studioRoot, 'out', `areajam-${defaultSlug}.mp4`);
  fs.mkdirSync(path.dirname(outFile), { recursive: true });

  console.log(`\n[3/3] Rendering ${manifest.width}x${manifest.height} video with Remotion...`);
  const remotionBin = path.join(studioRoot, 'node_modules', '.bin', 'remotion');
  execFileSync(
    remotionBin,
    ['render', 'src/index.ts', 'AreaJamPromo', outFile, `--props=${manifestPath}`],
    { cwd: studioRoot, stdio: 'inherit' }
  );

  const stats = fs.statSync(outFile);
  const mb = (stats.size / (1024 * 1024)).toFixed(2);
  const totalSec = (manifest.totalFrames / manifest.fps).toFixed(1);
  console.log(`\nDone! Rendered ${totalSec}s video (${mb} MB):\n${outFile}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
