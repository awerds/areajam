#!/usr/bin/env node
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
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
const FFPROBE = path.join(REMOTION_BIN_DIR, 'ffprobe');
const PUBLIC_LA_DIR = path.join(repoRoot, 'public', 'profiles', 'la');
const MANIFEST_PATH = path.join(repoRoot, 'scripts', 'la-roster-manifest.json');
const OUT_TS_PATH = path.join(repoRoot, 'src', 'data', 'laProfiles.ts');

function getDurationSec(mp4Path) {
  const out = execFileSync(
    FFPROBE,
    ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=noprint_wrappers=1:nokey=1', mp4Path],
    {
      env: {
        ...process.env,
        DYLD_LIBRARY_PATH: `${REMOTION_BIN_DIR}${process.env.DYLD_LIBRARY_PATH ? `:${process.env.DYLD_LIBRARY_PATH}` : ''}`,
      },
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'pipe'],
    }
  );
  const raw = Number.parseFloat(out.trim());
  return Number.isFinite(raw) ? Math.max(5, Math.min(10, Math.round(raw))) : 8;
}

const MAYA_PROFILE = {
  id: 'la-01-maya-delgado',
  side: 'jam',
  roleCategory: 'Guitarists',
  instruments: ['guitar'],
  regionId: 'la',
  regionLabel: 'Los Angeles (213)',
  regionState: 'CA',
  neighborhood: 'Echo Park',
  title: 'Maya Delgado',
  subtitle: 'Indie & shoegaze rhythm/lead guitar',
  seekingOrOffer:
    'Tight pocket drummer and melodic bassist for a 2x/wk Echo Park indie/shoegaze project — demos ready, aiming for local shows by spring.',
  genres: ['Indie Rock', 'Shoegaze', 'Alt-Rock'],
  tags: ['Indie Rock', 'Shoegaze', 'Alt-Rock', 'Eastside LA'],
  bio: '24-year-old guitarist tracking guitar-driven indie rock and shoegaze out of Echo Park. Big on interlocking clean and light-overdrive chord voicings, chorus textures, and locked-in live dynamics. Looking for consistent weekly rehearsals.',
  gearOrBackline:
    "Fender Classic Player Jazzmaster, '65 Deluxe Reverb Reissue, Boss BD-2, Strymon Deco, Boss CE-2W",
  gearLocker: [
    {
      id: 'la-01-maya-delgado-g1',
      category: 'Instruments',
      name: 'Fender Classic Player Jazzmaster',
      notes: '3-Color Sunburst, mastery bridge',
    },
    {
      id: 'la-01-maya-delgado-g2',
      category: 'Amps & Cabs',
      name: "Fender '65 Deluxe Reverb Reissue",
      notes: '22W 1x12 tube combo',
    },
    {
      id: 'la-01-maya-delgado-g3',
      category: 'Pedals & Synth',
      name: 'Boss BD-2, Strymon Deco & Boss CE-2W',
      notes: 'Echo Park bedroom board',
    },
  ],
  availability: 'Tue & Thu evenings, Sun afternoons',
  visualSeed: 11,
  portraitFile: 'la-01-maya-delgado.webp',
  portraitAlt:
    'Maya Delgado playing a sunburst Fender Jazzmaster electric guitar in her Echo Park bedroom studio.',
  clipId: 'la-01-maya-delgado-clip-1',
  clipTitle: 'Bedroom studio take',
  clipFile: 'la-01-maya-delgado.mp4',
  profileStyle: {
    themeId: 'midnight-vinyl',
    moodStatus: 'Writing a 5-track EP — need drums & bass in Echo Park',
    bannerPattern: 'waves',
    soundsLike: ['Alvvays', 'Turnover', 'Slowdive'],
  },
  isPublished: true,
  isUserCreated: false,
  createdAt: 1795656000000,
};

const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf-8'));

const allSpecs = [
  MAYA_PROFILE,
  ...manifest.map((entry) => ({
    id: entry.id,
    side: 'jam',
    roleCategory: entry.roleCategory,
    instruments: entry.instruments,
    regionId: 'la',
    regionLabel: 'Los Angeles (213)',
    regionState: 'CA',
    neighborhood: entry.neighborhood,
    title: entry.title,
    subtitle: entry.subtitle,
    seekingOrOffer: entry.seekingOrOffer,
    genres: entry.genres,
    tags: entry.tags,
    bio: entry.bio,
    gearOrBackline: entry.gearOrBackline,
    gearLocker: entry.gearLocker,
    availability: entry.availability,
    visualSeed: entry.visualSeed,
    portraitFile: `${entry.id}.webp`,
    portraitAlt: entry.portraitAlt,
    clipId: `${entry.id}-clip-1`,
    clipTitle: entry.clipTitle,
    clipFile: `${entry.id}.mp4`,
    profileStyle: entry.profileStyle,
    isPublished: true,
    isUserCreated: false,
    createdAt: entry.createdAt,
  })),
];

const activeProfiles = [];
for (const spec of allSpecs) {
  const mp4Path = path.join(PUBLIC_LA_DIR, spec.clipFile);
  const webpPath = path.join(PUBLIC_LA_DIR, spec.portraitFile);
  if (!fs.existsSync(mp4Path) || !fs.existsSync(webpPath)) {
    continue;
  }
  const durationSec = getDurationSec(mp4Path);
  const { portraitFile, clipId, clipTitle, clipFile, ...rest } = spec;
  activeProfiles.push({
    ...rest,
    portraitFile,
    clipId,
    clipTitle,
    clipFile,
    durationSec,
  });
}

function serializeListing(p) {
  const posterExpr = `\`\${LA_MEDIA_BASE}/${p.portraitFile}\``;
  const videoExpr = `\`\${LA_MEDIA_BASE}/${p.clipFile}\``;
  return `  {
    id: ${JSON.stringify(p.id)},
    side: ${JSON.stringify(p.side)},
    roleCategory: ${JSON.stringify(p.roleCategory)},
    instruments: ${JSON.stringify(p.instruments)},
    regionId: ${JSON.stringify(p.regionId)},
    regionLabel: ${JSON.stringify(p.regionLabel)},
    regionState: ${JSON.stringify(p.regionState)},
    neighborhood: ${JSON.stringify(p.neighborhood)},
    title: ${JSON.stringify(p.title)},
    subtitle: ${JSON.stringify(p.subtitle)},
    seekingOrOffer: ${JSON.stringify(p.seekingOrOffer)},
    genres: ${JSON.stringify(p.genres)},
    tags: ${JSON.stringify(p.tags)},
    bio: ${JSON.stringify(p.bio)},
    gearOrBackline: ${JSON.stringify(p.gearOrBackline)},
    gearLocker: ${JSON.stringify(p.gearLocker, null, 6).replace(/\n/g, '\n    ')},
    availability: ${JSON.stringify(p.availability)},
    visualSeed: ${p.visualSeed},
    portraitUrl: ${posterExpr},
    portraitAlt: ${JSON.stringify(p.portraitAlt)},
    clips: [
      {
        id: ${JSON.stringify(p.clipId)},
        title: ${JSON.stringify(p.clipTitle)},
        kind: 'video',
        embedUrl: ${videoExpr},
        embedProvider: 'direct',
        posterUrl: ${posterExpr},
        durationSec: ${p.durationSec},
      },
    ],
    featuredClipId: ${JSON.stringify(p.clipId)},
    profileStyle: ${JSON.stringify(p.profileStyle, null, 6).replace(/\n/g, '\n    ')},
    isPublished: true,
    isUserCreated: false,
    createdAt: ${p.createdAt},
  }`;
}

const tsOutput = `import type { Listing } from '../types';

export const LA_MEDIA_BASE = './profiles/la';

export const LA_PROFILES: Listing[] = [
${activeProfiles.map(serializeListing).join(',\n')}
];
`;

fs.writeFileSync(OUT_TS_PATH, tsOutput);
console.log(`Synced ${activeProfiles.length} LA profiles -> ${path.relative(repoRoot, OUT_TS_PATH)}`);
