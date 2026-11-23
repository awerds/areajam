import { STARTER_REGIONS } from '../data/regions';
import type { AppMode, AppState, Region } from '../types';

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
    customRegions: [],
    userListings: [],
    swiped: {},
    history: [],
    matches: [],
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

    return {
      regionId: resolvedRegionId,
      mode: urlOverride.mode ?? (parsed.mode === 'gigs' ? 'gigs' : 'jam'),
      includeNearbyRegions: Boolean(parsed.includeNearbyRegions),
      customRegions: Array.isArray(parsed.customRegions) ? parsed.customRegions : [],
      userListings: Array.isArray(parsed.userListings) ? parsed.userListings : [],
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
    history: state.history.filter((h) => h.decision !== 'pass' || !listingIdsToKeepPassedClear.has(h.listingId)),
  };
}
