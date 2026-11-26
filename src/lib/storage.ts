import { DEFAULT_ALL_REGIONS, PILOT_REGION_ID } from '../data/regions';
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
} from '../types';

const LEGACY_STORAGE_KEY = 'areajam_v1_state';
const GUEST_STORAGE_KEY = 'areajam_v2_guest';

export function getStorageKeyForUid(uid?: string | null): string {
  return uid ? `areajam_v2_user_${uid}` : GUEST_STORAGE_KEY;
}

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
    const base =
      url.pathname.indexOf('/areajam/') === 0 || url.pathname === '/areajam' ? '/areajam/' : '/';
    url.pathname = base;
    url.search = '';
    url.hash = '';
    url.searchParams.set('area', regionId);
    url.searchParams.set('mode', mode);
    if (profileId) {
      url.searchParams.set('profile', profileId);
    }
    window.history.replaceState(null, '', url.toString());
  } catch {
    // Ignore history API restrictions in sandboxed frames
  }
}

export function getDefaultState(): AppState {
  return {
    regionId: PILOT_REGION_ID,
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
      : raw.portraitUrl
        ? []
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

function buildStateFromParsed(
  parsed: Partial<AppState>,
  uid: string | null | undefined,
  urlOverride: { regionId?: string; mode?: AppMode; profileId?: string },
  fallback: AppState
): AppState {
  const knownRegions: Region[] = [
    ...DEFAULT_ALL_REGIONS,
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

  const ownedListings = uid && Array.isArray(parsed.userListings)
    ? parsed.userListings.map(normalizeListing).filter((l) => l.ownerUid === uid)
    : [];

  return {
    regionId: resolvedRegionId,
    mode: 'jam',
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
    userListings: ownedListings,
    swiped: parsed.swiped && typeof parsed.swiped === 'object' ? parsed.swiped : {},
    history: Array.isArray(parsed.history) ? parsed.history : [],
  };
}

export function loadState(uid?: string | null): AppState {
  const fallback = getDefaultState();
  const urlOverride = parseUrlState();

  try {
    const storageKey = getStorageKeyForUid(uid);
    const raw = window.localStorage.getItem(storageKey);
    if (raw) {
      return buildStateFromParsed(JSON.parse(raw) as Partial<AppState>, uid, urlOverride, fallback);
    }

    // Only carry over region prefs and listings explicitly owned by this UID from legacy storage.
    if (uid) {
      const legacyRaw = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        const legacyParsed = JSON.parse(legacyRaw) as Partial<AppState>;
        const ownedLegacyListings = Array.isArray(legacyParsed.userListings)
          ? legacyParsed.userListings.filter((l) => l?.ownerUid === uid)
          : [];
        return buildStateFromParsed(
          {
            regionId: legacyParsed.regionId,
            mode: legacyParsed.mode,
            includeNearbyRegions: legacyParsed.includeNearbyRegions,
            locationConsent: legacyParsed.locationConsent,
            detectedCityLabel: legacyParsed.detectedCityLabel,
            customRegions: legacyParsed.customRegions,
            userListings: ownedLegacyListings,
          },
          uid,
          urlOverride,
          fallback
        );
      }
    }

    return {
      ...fallback,
      regionId: urlOverride.regionId ?? fallback.regionId,
      mode: 'jam',
    };
  } catch {
    return {
      ...fallback,
      regionId: urlOverride.regionId ?? fallback.regionId,
      mode: 'jam',
    };
  }
}

export function saveState(state: AppState, uid?: string | null): void {
  try {
    const scopedListings = uid
      ? state.userListings.filter((l) => l.ownerUid === uid)
      : [];
    window.localStorage.setItem(
      getStorageKeyForUid(uid),
      JSON.stringify({ ...state, userListings: scopedListings })
    );
  } catch {
    // Ignore quota errors
  }
}

export function clearStoredUserState(uid?: string | null): void {
  try {
    window.localStorage.removeItem(getStorageKeyForUid(uid));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  } catch {
    // Ignore storage errors
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
