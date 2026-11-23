import { STARTER_REGIONS } from '../data/regions';
import { PROFILE_THEMES } from '../data/themes';
import type {
  AppMode,
  AppState,
  GearItem,
  InstrumentId,
  Listing,
  LocationConsent,
  ProfileThemeId,
  Region,
  WallComment,
} from '../types';

const STORAGE_KEY = 'areajam_v1_state';

const STARTER_WALL_COMMENTS: Record<string, WallComment[]> = {
  'atx-jam-1': [
    {
      id: 'wall-atx-1',
      authorName: 'Devon R.',
      text: 'Watched your Vistalite clip — that Can-style motorik pocket is ridiculous. Down to trade guitar tracks Thursday.',
      createdAt: 1730001000000,
    },
  ],
  'atx-gigs-1': [
    {
      id: 'wall-gigs-1',
      authorName: 'Sunburn Velvet',
      text: 'Played this patio last month — house engineer gets mixes dialed in 10 minutes flat.',
      createdAt: 1730002000000,
    },
  ],
};

export function parseUrlState(): { regionId?: string; mode?: AppMode; profileId?: string } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area')?.trim().toLowerCase();
  const rawMode = params.get('mode')?.trim().toLowerCase();
  const profileId = params.get('profile')?.trim();
  const mode: AppMode | undefined = rawMode === 'jam' || rawMode === 'gigs' ? rawMode : undefined;
  return {
    regionId: area || undefined,
    mode,
    profileId: profileId || undefined,
  };
}

export function syncUrlState(regionId: string, mode: AppMode, profileId?: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('area', regionId);
    url.searchParams.set('mode', mode);
    if (profileId) {
      url.searchParams.set('profile', profileId);
    } else {
      url.searchParams.delete('profile');
    }
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Ignore history API restrictions in sandboxed frames
  }
}

export function getDefaultState(): AppState {
  return {
    regionId: 'austin',
    mode: 'jam',
    includeNearbyRegions: false,
    locationConsent: 'unknown',
    detectedCityLabel: undefined,
    lookingForJam: [],
    lookingForGigs: [],
    customRegions: [],
    userListings: [],
    swiped: {},
    history: [],
    matches: [],
    wallComments: STARTER_WALL_COMMENTS,
  };
}

function inferInstruments(raw: Partial<Listing>): InstrumentId[] {
  if (Array.isArray(raw.instruments) && raw.instruments.length > 0) {
    return raw.instruments;
  }
  const text = `${raw.roleCategory ?? ''} ${raw.subtitle ?? ''} ${raw.tags?.join(' ') ?? ''}`.toLowerCase();
  const found: InstrumentId[] = [];
  if (/drum|kit|percussion/.test(text)) found.push('drums');
  if (/guitar|tele|strat|jazzmaster/.test(text)) found.push('guitar');
  if (/bass/.test(text)) found.push('bass');
  if (/vocal|singer|frontperson|harmony/.test(text)) found.push('vocals');
  if (/key|piano|organ|hammond|rhodes/.test(text)) found.push('keys');
  if (/synth|electronic|ableton/.test(text)) found.push('synth');
  if (/horn|sax|brass|trumpet/.test(text)) found.push('horns');
  if (/cello|violin|fiddle|string/.test(text)) found.push('strings');
  if (/producer|studio/.test(text)) found.push('producer');
  if (found.length === 0) found.push(raw.side === 'gigs' ? 'band' : 'guitar');
  return found;
}

function normalizeListing(raw: Listing): Listing {
  const fallbackRole =
    raw.side === 'jam'
      ? 'Songwriters'
      : raw.gigSubtype === 'open-gig'
        ? 'Open venue slots'
        : 'Bands for hire';

  const fallbackClips =
    Array.isArray(raw.clips) && raw.clips.length > 0
      ? raw.clips
      : [
          {
            id: `${raw.id}-c1`,
            title: 'Intro reel',
            kind: 'synth-reel' as const,
            durationSec: 8,
            clipVariation: 0,
          },
        ];

  const fallbackLocker: GearItem[] =
    Array.isArray(raw.gearLocker) && raw.gearLocker.length > 0
      ? raw.gearLocker
      : raw.gearOrBackline
        ? [{ id: `${raw.id}-g1`, category: raw.side === 'jam' ? 'Instruments' : 'PA & Backline', name: raw.gearOrBackline }]
        : [];

  const themeId: ProfileThemeId =
    raw.profileStyle?.themeId && raw.profileStyle.themeId in PROFILE_THEMES
      ? raw.profileStyle.themeId
      : raw.side === 'jam'
        ? 'stage-coral'
        : 'emerald-club';

  return {
    ...raw,
    roleCategory: raw.roleCategory || fallbackRole,
    instruments: inferInstruments(raw),
    genres: Array.isArray(raw.genres) ? raw.genres.filter((x) => typeof x === 'string') : ['Indie'],
    tags: Array.isArray(raw.tags) ? raw.tags.filter((x) => typeof x === 'string') : [],
    clips: fallbackClips,
    featuredClipId: raw.featuredClipId || fallbackClips[0]?.id,
    gearLocker: fallbackLocker,
    profileStyle: {
      themeId,
      moodStatus: raw.profileStyle?.moodStatus || raw.availability,
      soundsLike: Array.isArray(raw.profileStyle?.soundsLike) ? raw.profileStyle.soundsLike : [],
      bannerPattern: raw.profileStyle?.bannerPattern || 'waves',
    },
  };
}

export function loadState(): AppState {
  const fallback = getDefaultState();
  const urlOverride = parseUrlState();

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        ...fallback,
        regionId: urlOverride.regionId ?? fallback.regionId,
        mode: urlOverride.mode ?? fallback.mode,
      };
    }

    const parsed = JSON.parse(raw) as Partial<AppState>;
    const knownRegions: Region[] = [
      ...STARTER_REGIONS,
      ...(Array.isArray(parsed.customRegions) ? parsed.customRegions : []),
    ];

    const resolvedRegionId =
      urlOverride.regionId && knownRegions.some((r) => r.id === urlOverride.regionId)
        ? urlOverride.regionId
        : parsed.regionId && knownRegions.some((r) => r.id === parsed.regionId)
          ? parsed.regionId
          : fallback.regionId;

    const consent: LocationConsent =
      parsed.locationConsent === 'granted' || parsed.locationConsent === 'declined'
        ? parsed.locationConsent
        : 'unknown';

    return {
      regionId: resolvedRegionId,
      mode: urlOverride.mode ?? (parsed.mode === 'gigs' ? 'gigs' : 'jam'),
      includeNearbyRegions: Boolean(parsed.includeNearbyRegions),
      locationConsent: consent,
      detectedCityLabel:
        typeof parsed.detectedCityLabel === 'string' ? parsed.detectedCityLabel : undefined,
      lookingForJam: Array.isArray(parsed.lookingForJam)
        ? parsed.lookingForJam.filter((x) => typeof x === 'string')
        : [],
      lookingForGigs: Array.isArray(parsed.lookingForGigs)
        ? parsed.lookingForGigs.filter((x) => typeof x === 'string')
        : [],
      customRegions: Array.isArray(parsed.customRegions) ? parsed.customRegions : [],
      userListings: Array.isArray(parsed.userListings)
        ? parsed.userListings.map(normalizeListing)
        : [],
      swiped: parsed.swiped && typeof parsed.swiped === 'object' ? parsed.swiped : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
      wallComments:
        parsed.wallComments && typeof parsed.wallComments === 'object'
          ? parsed.wallComments
          : STARTER_WALL_COMMENTS,
    };
  } catch {
    return {
      ...fallback,
      regionId: urlOverride.regionId ?? fallback.regionId,
      mode: urlOverride.mode ?? fallback.mode,
    };
  }
}

export function saveState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors
  }
}

export function resetPassedSwipes(state: AppState, listingIdsToKeepPassedClear: Set<string>): AppState {
  const nextSwiped: Record<string, 'like' | 'pass'> = {};
  for (const [id, decision] of Object.entries(state.swiped)) {
    if (decision === 'like' || !listingIdsToKeepPassedClear.has(id)) {
      nextSwiped[id] = decision;
    }
  }
  return {
    ...state,
    swiped: nextSwiped,
    history: state.history.filter(
      (h) => h.decision !== 'pass' || !listingIdsToKeepPassedClear.has(h.listingId)
    ),
  };
}
