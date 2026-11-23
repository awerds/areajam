import { STARTER_REGIONS } from '../data/regions';
import type { AppMode, AppState, Listing, LocationConsent, Region } from '../types';

const STORAGE_KEY = 'areajam_v1_state';

export function parseUrlRegionAndMode(): { regionId?: string; mode?: AppMode } {
  if (typeof window === 'undefined') return {};
  const params = new URLSearchParams(window.location.search);
  const area = params.get('area')?.trim().toLowerCase();
  const rawMode = params.get('mode')?.trim().toLowerCase();
  const mode: AppMode | undefined = rawMode === 'jam' || rawMode === 'gigs' ? rawMode : undefined;
  return {
    regionId: area || undefined,
    mode,
  };
}

export function syncUrlRegionAndMode(regionId: string, mode: AppMode): void {
  if (typeof window === 'undefined') return;
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('area', regionId);
    url.searchParams.set('mode', mode);
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
  };
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

  return {
    ...raw,
    roleCategory: raw.roleCategory || fallbackRole,
    clips: fallbackClips,
  };
}

export function loadState(): AppState {
  const fallback = getDefaultState();
  const urlOverride = parseUrlRegionAndMode();

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
      lookingForJam: Array.isArray(parsed.lookingForJam) ? parsed.lookingForJam : [],
      lookingForGigs: Array.isArray(parsed.lookingForGigs) ? parsed.lookingForGigs : [],
      customRegions: Array.isArray(parsed.customRegions) ? parsed.customRegions : [],
      userListings: Array.isArray(parsed.userListings)
        ? parsed.userListings.map(normalizeListing)
        : [],
      swiped: parsed.swiped && typeof parsed.swiped === 'object' ? parsed.swiped : {},
      history: Array.isArray(parsed.history) ? parsed.history : [],
      matches: Array.isArray(parsed.matches) ? parsed.matches : [],
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
