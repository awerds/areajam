import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ChevronDown,
  Compass,
  Flame,
  HelpCircle,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Moon,
  Navigation,
  PlusSquare,
  Sun,
  Ticket,
  UserCheck,
  Video,
  X,
} from 'lucide-react';
import { AuthDialog } from './components/AuthDialog';
import { BrowseGrid } from './components/BrowseGrid';
import { DetailDialog } from './components/DetailDialog';
import { HowItWorksDialog } from './components/HowItWorksDialog';
import { InstrumentIconSprite } from './components/InstrumentIcons';
import { MatchDialog } from './components/MatchDialog';
import { MatchesView } from './components/MatchesView';
import { PostView } from './components/PostView';
import { ProfilePage } from './components/ProfilePage';
import { RegionDialog } from './components/RegionDialog';
import { SwipeDeck } from './components/SwipeDeck';
import { GIGS_PREFERENCES, JAM_PREFERENCES, STARTER_REGIONS } from './data/regions';
import { SEED_LISTINGS } from './data/seedListings';
import { stopCardPreview } from './lib/audioPreview';
import { signOutUser, subscribeAuth } from './lib/auth';
import { subscribeColorScheme, toggleColorScheme } from './lib/colorScheme';
import { detectLocationByIp } from './lib/location';
import { deleteMediaBlob } from './lib/mediaStorage';
import {
  loadState,
  parseUrlState,
  resetPassedSwipes,
  saveState,
  syncUrlState,
} from './lib/storage';
import type {
  AppMode,
  AppState,
  AuthUser,
  Listing,
  NavTab,
  Region,
  SwipeDecision,
} from './types';

function matchesPreferences(listing: Listing, selectedPrefs: string[]): boolean {
  if (selectedPrefs.length === 0) return true;

  return selectedPrefs.some((pref) => {
    if (listing.roleCategory === pref) return true;
    const text = `${listing.subtitle} ${listing.seekingOrOffer} ${listing.tags.join(' ')} ${listing.genres.join(' ')} ${listing.payOrSplit ?? ''}`.toLowerCase();
    if (pref === 'Paid guarantee') return /guarantee|\$[1-9]/.test(text);
    if (pref === 'Acoustic & patio') return /acoustic|patio|folk|listening/.test(text);
    if (pref === 'Club & loud bills') return /club|punk|garage|rock|brass|backline/.test(text);
    if (pref === 'Drummers') return listing.instruments.includes('drums');
    if (pref === 'Guitarists') return listing.instruments.includes('guitar');
    if (pref === 'Bassists') return listing.instruments.includes('bass');
    if (pref === 'Vocalists') return listing.instruments.includes('vocals');
    if (pref === 'Keys & Synth') {
      return listing.instruments.includes('keys') || listing.instruments.includes('synth');
    }
    if (pref === 'Horns & Strings') {
      return listing.instruments.includes('horns') || listing.instruments.includes('strings');
    }
    return text.includes(pref.toLowerCase());
  });
}

interface ScopedAppState {
  scopeUid: string | null;
  data: AppState;
}

export function App() {
  const [scopedState, setScopedState] = useState<ScopedAppState>(() => ({
    scopeUid: null,
    data: loadState(null),
  }));
  const state = scopedState.data;
  const setState = (updater: AppState | ((prev: AppState) => AppState)) => {
    setScopedState((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? updater(prev.data) : updater,
    }));
  };

  const [user, setUser] = useState<AuthUser | null>(null);
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    () => parseUrlState().profileId ?? null
  );
  const [chipFilter, setChipFilter] = useState<string>('All');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [ipDetecting, setIpDetecting] = useState<boolean>(false);

  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authReason, setAuthReason] = useState<string | undefined>(undefined);
  const [pendingMessage, setPendingMessage] = useState<{ matchId: string; text: string } | null>(
    null
  );
  const [pendingWallNote, setPendingWallNote] = useState<{
    listingId: string;
    text: string;
  } | null>(null);

  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [matchPopupListing, setMatchPopupListing] = useState<Listing | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const browseSectionRef = useRef<HTMLDivElement>(null);
  const replyTimersRef = useRef<number[]>([]);
  const toastTimerRef = useRef<number | undefined>(undefined);
  const activeUidRef = useRef<string | null>(null);

  useEffect(() => {
    return subscribeAuth((nextUser) => {
      const nextUid = nextUser?.uid ?? null;
      const prevUid = activeUidRef.current;
      const uidChanged = nextUid !== prevUid;
      activeUidRef.current = nextUid;
      setUser(nextUser);

      if (uidChanged) {
        stopCardPreview();
        replyTimersRef.current.forEach((id) => window.clearTimeout(id));
        replyTimersRef.current = [];
        setDetailListing(null);
        setMatchPopupListing(null);
        setSelectedMatchId(null);
        // Clear any pending cross-account drafts on sign-out or account switch.
        if (prevUid !== null || nextUid === null) {
          setPendingMessage(null);
          setPendingWallNote(null);
        }
        setScopedState({ scopeUid: nextUid, data: loadState(nextUid) });
      }
    });
  }, []);

  useEffect(() => {
    return subscribeColorScheme(() => {});
  }, []);

  useEffect(() => {
    saveState(scopedState.data, scopedState.scopeUid);
    syncUrlState(scopedState.data.regionId, scopedState.data.mode, activeProfileId);
    document.documentElement.style.setProperty(
      '--accent',
      scopedState.data.mode === 'jam' ? 'var(--jam)' : 'var(--gigs)'
    );
    document.documentElement.style.setProperty(
      '--accent-ink',
      scopedState.data.mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)'
    );
  }, [scopedState, activeProfileId]);

  useEffect(() => {
    return () => {
      stopCardPreview();
      replyTimersRef.current.forEach((id) => window.clearTimeout(id));
      window.clearTimeout(toastTimerRef.current);
    };
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2800);
  };

  const handleToggleColorScheme = () => {
    const { resolved, followingSystem } = toggleColorScheme();
    showToast(
      followingSystem
        ? `Following system theme (${resolved})`
        : resolved === 'dark'
          ? 'Dark mode'
          : 'Light mode'
    );
  };

  const allRegions = useMemo<Region[]>(
    () => [...STARTER_REGIONS, ...state.customRegions],
    [state.customRegions]
  );

  const currentRegion = useMemo<Region>(
    () => allRegions.find((r) => r.id === state.regionId) ?? allRegions[0],
    [allRegions, state.regionId]
  );

  const ownedUserListings = useMemo<Listing[]>(
    () => (user ? state.userListings.filter((l) => l.ownerUid === user.uid) : []),
    [state.userListings, user]
  );

  const allListings = useMemo<Listing[]>(
    () => [...ownedUserListings, ...SEED_LISTINGS],
    [ownedUserListings]
  );

  const activeProfile = useMemo<Listing | null>(
    () => (activeProfileId ? allListings.find((l) => l.id === activeProfileId) ?? null : null),
    [activeProfileId, allListings]
  );
  const hasMissingProfile = Boolean(activeProfileId && !activeProfile);

  const activePrefs = state.mode === 'jam' ? state.lookingForJam : state.lookingForGigs;
  const prefChoices = state.mode === 'jam' ? JAM_PREFERENCES : GIGS_PREFERENCES;

  const togglePreference = (pref: string) => {
    setState((prev) => {
      const key = prev.mode === 'jam' ? 'lookingForJam' : 'lookingForGigs';
      const current = prev[key];
      const next = current.includes(pref)
        ? current.filter((item) => item !== pref)
        : [...current, pref];
      return { ...prev, [key]: next };
    });
  };

  const clearPreferences = () => {
    setState((prev) => ({
      ...prev,
      [prev.mode === 'jam' ? 'lookingForJam' : 'lookingForGigs']: [],
    }));
  };

  const handleAllowIpLocation = async () => {
    setIpDetecting(true);
    const result = await detectLocationByIp(allRegions);
    setIpDetecting(false);

    if (!result) {
      setState((prev) => ({ ...prev, locationConsent: 'declined' }));
      setRegionModalOpen(true);
      showToast('Could not auto-detect city from IP — pick your metro board below.');
      return;
    }

    setState((prev) => ({
      ...prev,
      locationConsent: 'granted',
      detectedCityLabel: result.detectedLabel,
      regionId: result.region.id,
      includeNearbyRegions: result.created ? true : prev.includeNearbyRegions,
      customRegions:
        result.created && !prev.customRegions.some((r) => r.id === result.region.id)
          ? [...prev.customRegions, result.region]
          : prev.customRegions,
    }));
    showToast(`Local board set to ${result.detectedLabel}`);
  };

  const availableFilters = useMemo(() => {
    const modeListings = allListings.filter(
      (l) =>
        l.side === state.mode &&
        (state.includeNearbyRegions || l.regionId === state.regionId)
    );
    const counts = new Map<string, number>();
    for (const item of modeListings) {
      for (const genre of item.genres) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 6);
    return ['All', ...sorted];
  }, [allListings, state.includeNearbyRegions, state.mode, state.regionId]);

  useEffect(() => {
    if (!availableFilters.includes(chipFilter)) {
      setChipFilter('All');
    }
  }, [availableFilters, chipFilter]);

  const regionalPool = useMemo(() => {
    const sidePool = allListings.filter((l) => l.side === state.mode);
    const local = sidePool.filter((l) => l.regionId === state.regionId);
    const nearby = state.includeNearbyRegions
      ? sidePool.filter((l) => l.regionId !== state.regionId)
      : [];
    const combined = [...local, ...nearby];

    return combined.filter((item) => {
      if (!matchesPreferences(item, activePrefs)) return false;
      if (chipFilter === 'All') return true;
      return item.genres.includes(chipFilter) || item.tags.includes(chipFilter);
    });
  }, [activePrefs, allListings, chipFilter, state.includeNearbyRegions, state.mode, state.regionId]);

  const deckCards = useMemo(
    () => regionalPool.filter((l) => !l.isUserCreated && !state.swiped[l.id]),
    [regionalPool, state.swiped]
  );

  const handleModeChange = (nextMode: AppMode) => {
    stopCardPreview();
    setActiveProfileId(null);
    setState((prev) => ({ ...prev, mode: nextMode }));
    setChipFilter('All');
  };

  const handleTabChange = (nextTab: NavTab) => {
    stopCardPreview();
    setActiveProfileId(null);
    setActiveTab(nextTab);
    if (nextTab !== 'matches') {
      setSelectedMatchId(null);
    }
  };

  const handleOpenProfile = (listing: Listing) => {
    stopCardPreview();
    setDetailListing(null);
    setActiveProfileId(listing.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwipe = (listing: Listing, decision: SwipeDecision) => {
    stopCardPreview();
    let createdMatch = false;

    setState((prev) => {
      if (prev.swiped[listing.id]) return prev;
      const shouldMatch = decision === 'like' && listing.autoMatch;
      const matchId = shouldMatch ? `match-${listing.id}` : undefined;
      if (shouldMatch) createdMatch = true;

      const nextMatches =
        shouldMatch && !prev.matches.some((m) => m.listingId === listing.id)
          ? [
              {
                id: matchId!,
                listingId: listing.id,
                side: listing.side,
                matchedAt: Date.now(),
                messages: [],
              },
              ...prev.matches,
            ]
          : prev.matches;

      return {
        ...prev,
        swiped: { ...prev.swiped, [listing.id]: decision },
        history: [...prev.history, { listingId: listing.id, decision, createdMatchId: matchId }],
        matches: nextMatches,
      };
    });

    if (createdMatch) {
      setMatchPopupListing(listing);
    } else if (decision === 'like') {
      showToast(`Saved local interest in ${listing.title} (sample demo).`);
    }
  };

  const handleUndo = () => {
    stopCardPreview();
    setState((prev) => {
      const idx = [...prev.history]
        .reverse()
        .findIndex((h) => {
          const item = allListings.find((l) => l.id === h.listingId);
          return item?.side === prev.mode;
        });

      if (idx === -1) return prev;
      const targetIndex = prev.history.length - 1 - idx;
      const entry = prev.history[targetIndex];
      const nextSwiped = { ...prev.swiped };
      delete nextSwiped[entry.listingId];

      const nextMatches = entry.createdMatchId
        ? prev.matches.filter((m) => m.id !== entry.createdMatchId)
        : prev.matches;

      return {
        ...prev,
        swiped: nextSwiped,
        history: prev.history.filter((_, i) => i !== targetIndex),
        matches: nextMatches,
      };
    });
  };

  const canUndo = useMemo(
    () =>
      state.history.some((h) => {
        const item = allListings.find((l) => l.id === h.listingId);
        return item?.side === state.mode;
      }),
    [allListings, state.history, state.mode]
  );

  const handleResetPassed = () => {
    const modePoolIds = new Set(
      allListings
        .filter((l) => l.side === state.mode && (state.includeNearbyRegions || l.regionId === state.regionId))
        .map((l) => l.id)
    );
    setState((prev) => resetPassedSwipes(prev, modePoolIds));
    showToast(`Cleared passed ${state.mode === 'jam' ? 'players' : 'gigs'} in ${currentRegion.city}.`);
  };

  const handleAddCustomRegion = (city: string, stateCode: string, areaCode: string) => {
    const slugBase = city
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    const id = slugBase || `city-${Date.now()}`;
    const existing = allRegions.find((r) => r.id === id);
    if (existing) {
      setState((prev) => ({ ...prev, regionId: existing.id }));
      return;
    }

    const newRegion: Region = {
      id,
      city,
      state: stateCode,
      areaCode: areaCode || 'LOC',
      label: areaCode ? `${city} (${areaCode})` : city,
      isCustom: true,
    };

    setState((prev) => ({
      ...prev,
      customRegions: [...prev.customRegions, newRegion],
      regionId: newRegion.id,
      includeNearbyRegions: true,
    }));
    showToast(`Created regional board for ${newRegion.label}`);
  };

  const deliverMessage = (matchId: string, text: string) => {
    let shouldScheduleReply = false;
    let replyText = '';

    setState((prev) => {
      const target = prev.matches.find((m) => m.id === matchId);
      if (!target) return prev;
      if (target.messages.length === 0) {
        const listing = allListings.find((l) => l.id === target.listingId);
        if (listing) {
          shouldScheduleReply = true;
          replyText = listing.autoReply;
        }
      }

      const nextMatches = prev.matches.map((m) =>
        m.id === matchId
          ? {
              ...m,
              messages: [
                ...m.messages,
                { id: `msg-${Date.now()}`, sender: 'me' as const, text, sentAt: Date.now() },
              ],
            }
          : m
      );

      return { ...prev, matches: nextMatches };
    });

    if (shouldScheduleReply && replyText) {
      const scheduledUid = activeUidRef.current;
      const timerId = window.setTimeout(() => {
        if (activeUidRef.current !== scheduledUid) return;
        setState((prev) => ({
          ...prev,
          matches: prev.matches.map((m) =>
            m.id === matchId
              ? {
                  ...m,
                  messages: [
                    ...m.messages,
                    {
                      id: `reply-${Date.now()}`,
                      sender: 'them' as const,
                      text: replyText,
                      sentAt: Date.now(),
                      isSimulated: true,
                    },
                  ],
                }
              : m
          ),
        }));
      }, 650);
      replyTimersRef.current.push(timerId);
    }
  };

  const handleSendMessage = (matchId: string, text: string) => {
    if (!user) {
      setPendingMessage({ matchId, text });
      setAuthReason('Sign in with Google or Apple so your match knows who is messaging them.');
      setAuthModalOpen(true);
      return;
    }
    deliverMessage(matchId, text);
  };

  const deliverWallComment = (listingId: string, text: string, author: AuthUser) => {
    setState((prev) => {
      const existing = prev.wallComments[listingId] ?? [];
      return {
        ...prev,
        wallComments: {
          ...prev.wallComments,
          [listingId]: [
            ...existing,
            {
              id: `wall-${Date.now()}`,
              authorName: author.displayName,
              authorUid: author.uid,
              text,
              createdAt: Date.now(),
            },
          ],
        },
      };
    });
    showToast('Posted note to scene wall.');
  };

  const handleAddWallComment = (listingId: string, text: string) => {
    if (!user) {
      setPendingWallNote({ listingId, text });
      setAuthReason('Sign in with Google or Apple to leave a public note on this page.');
      setAuthModalOpen(true);
      return;
    }
    deliverWallComment(listingId, text, user);
  };

  const handleUpdateUserListing = (updated: Listing) => {
    if (!user || updated.ownerUid !== user.uid) {
      showToast('Only the creator can edit this local draft.');
      return;
    }
    setState((prev) => ({
      ...prev,
      userListings: prev.userListings.map((l) =>
        l.id === updated.id && l.ownerUid === user.uid ? updated : l
      ),
    }));
  };

  const handleOpenChatFromMatchPopup = (listing: Listing) => {
    const found = state.matches.find((m) => m.listingId === listing.id);
    setMatchPopupListing(null);
    setActiveProfileId(null);
    if (found) {
      setSelectedMatchId(found.id);
      setActiveTab('matches');
    }
  };

  const openAuthPrompt = (reason?: string) => {
    setAuthReason(reason);
    setAuthModalOpen(true);
  };

  const handleShareProfileUrl = (listing?: Listing | null) => {
    const isLocalDraft = Boolean(listing?.isUserCreated);
    const copiedToast = isLocalDraft
      ? 'Copied link (local browser draft only — opens on this browser & account).'
      : 'Copied sample demo profile link.';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href).then(
        () => showToast(copiedToast),
        () => showToast('Share the URL in your browser bar.')
      );
    } else {
      showToast('Share the URL in your browser bar.');
    }
  };

  const activeSeed = deckCards[0]?.visualSeed ?? 1;
  const secondaryOrbColor = activeSeed % 2 === 0 ? 'var(--orb-sec-a)' : 'var(--orb-sec-b)';

  return (
    <div className="relative min-h-dvh pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] md:pb-12">
      <InstrumentIconSprite />

      {/* Ambient spatial lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="ambient-orb -top-32 right-[-6rem] h-[28rem] w-[28rem]"
          style={{
            backgroundColor: state.mode === 'jam' ? 'var(--orb-jam)' : 'var(--orb-gigs)',
          }}
        />
        <div
          className="ambient-orb bottom-[-8rem] left-[-6rem] h-[25rem] w-[25rem]"
          style={{ backgroundColor: secondaryOrbColor }}
        />
      </div>

      {/* Full-width edge-to-edge sticky header */}
      <header className="safe-top sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
        <div className="toolbar mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 pb-3 md:px-6 xl:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleTabChange('discover')}
              className="flex items-center gap-2.5 text-left"
            >
              <img src="./icon.svg" alt="" className="h-9 w-9 rounded-xl shadow-sm" />
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-display block text-lg font-bold leading-none tracking-tight">
                    AreaJam
                  </span>
                  <span className="hidden rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)] sm:inline-block">
                    Demo
                  </span>
                </div>
                <span className="mt-0.5 block text-[10px] font-semibold leading-none text-[var(--muted)] sm:hidden">
                  Interactive demo
                </span>
                <span className="mt-0.5 hidden text-[11px] text-[var(--muted)] sm:block">
                  Interactive demo, local preview
                </span>
              </div>
            </button>

            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {(
                [
                  { id: 'discover', label: 'Discover' },
                  { id: 'browse', label: 'Browse players' },
                  {
                    id: 'matches',
                    label: state.matches.length > 0 ? `Matches (${state.matches.length})` : 'Matches',
                  },
                  { id: 'post', label: 'Profile & studio' },
                ] as const
              ).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  aria-current={!activeProfileId && activeTab === item.id ? 'page' : undefined}
                  onClick={() => handleTabChange(item.id)}
                  className="nav-pill-btn rounded-full px-3.5 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setRegionModalOpen(true)}
              aria-label={`Change local region, currently ${currentRegion.label}`}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)]"
            >
              <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
              <span>
                {currentRegion.city}
                {currentRegion.areaCode !== 'LOC' ? `, ${currentRegion.areaCode}` : ''}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
            </button>

            <div
              role="group"
              aria-label="Switch mode between Jam and Gigs"
              className="inline-flex rounded-full border border-[var(--border)] bg-[var(--track-bg)] p-0.5"
            >
              <button
                type="button"
                aria-pressed={state.mode === 'jam'}
                onClick={() => handleModeChange('jam')}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                style={
                  state.mode === 'jam'
                    ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                    : { color: 'var(--muted)' }
                }
              >
                <Flame className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Jam</span>
              </button>
              <button
                type="button"
                aria-pressed={state.mode === 'gigs'}
                onClick={() => handleModeChange('gigs')}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold transition"
                style={
                  state.mode === 'gigs'
                    ? { backgroundColor: 'var(--gigs)', color: 'var(--gigs-ink)' }
                    : { color: 'var(--muted)' }
                }
              >
                <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gigs</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleToggleColorScheme}
              title="Switch light or dark theme"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              <span className="if-dark inline-flex items-center justify-center">
                <Sun className="h-4 w-4 text-amber-400" aria-hidden="true" />
                <span className="visually-hidden">Switch to light mode</span>
              </span>
              <span className="if-light inline-flex items-center justify-center">
                <Moon className="h-4 w-4 text-indigo-600" aria-hidden="true" />
                <span className="visually-hidden">Switch to dark mode</span>
              </span>
            </button>

            <button
              type="button"
              onClick={() => setHowItWorksOpen(true)}
              aria-label="How AreaJam works"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => handleTabChange('post')}
                aria-label="Open your profile and studio"
                className="hidden items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)] sm:inline-flex"
              >
                <UserCheck className="h-3.5 w-3.5 text-[var(--ok)]" aria-hidden="true" />
                <span className="max-w-[7rem] truncate">{user.displayName}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthPrompt()}
                className="hidden rounded-full bg-[var(--ink)] px-3.5 py-1.5 text-xs font-bold text-[var(--bg)] transition hover:opacity-90 sm:inline-flex"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Opt-in IP Geolocation consent bar */}
      {!activeProfileId && state.locationConsent === 'unknown' && (
        <div className="relative z-10 border-b border-[var(--border)] bg-[var(--surface-subtle)]">
          <div className="mx-auto flex w-full max-w-[1440px] flex-wrap items-center justify-between gap-2 px-4 py-1.5 text-xs md:gap-3 md:px-6 md:py-2.5 xl:px-10">
            <div className="flex items-center gap-1.5 text-[var(--ink)] md:gap-2">
              <Navigation className="h-3.5 w-3.5 shrink-0 text-[var(--accent)] md:h-4 md:w-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                Use your IP address to jump to sample profiles near your city automatically?
              </span>
              <span className="sm:hidden">Detect city via IP?</span>
            </div>

            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                type="button"
                disabled={ipDetecting}
                onClick={() => void handleAllowIpLocation()}
                className="rounded-full bg-[var(--ink)] px-3 py-1 text-xs font-bold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-60 md:px-3.5 md:py-1.5"
              >
                {ipDetecting ? 'Detecting...' : 'Allow'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setState((prev) => ({ ...prev, locationConsent: 'declined' }));
                  setRegionModalOpen(true);
                }}
                className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] md:px-3 md:py-1.5"
              >
                Pick city
              </button>
              <button
                type="button"
                aria-label="Dismiss location prompt"
                onClick={() => setState((prev) => ({ ...prev, locationConsent: 'declined' }))}
                className="inline-flex h-7 w-7 items-center justify-center rounded-full text-[var(--muted)] hover:text-[var(--ink)] md:h-8 md:w-8"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Full-width main container */}
      <main className="stage-shell relative z-10 mx-auto w-full max-w-[1440px] px-4 pt-2.5 md:px-6 md:pt-8 xl:px-10">
        {activeProfile ? (
          <ProfilePage
            listing={activeProfile}
            region={allRegions.find((r) => r.id === activeProfile.regionId)}
            allListings={allListings}
            allRegions={allRegions}
            user={user}
            isMatched={state.matches.some((m) => m.listingId === activeProfile.id)}
            soundEnabled={soundEnabled}
            wallComments={state.wallComments[activeProfile.id] ?? []}
            onToggleSound={() => setSoundEnabled((s) => !s)}
            onBack={() => setActiveProfileId(null)}
            onSwipe={handleSwipe}
            onOpenChat={handleOpenChatFromMatchPopup}
            onOpenProfile={handleOpenProfile}
            onUpdateListing={handleUpdateUserListing}
            onAddWallComment={handleAddWallComment}
            onShareUrl={() => handleShareProfileUrl(activeProfile)}
          />
        ) : hasMissingProfile ? (
          <section className="mx-auto max-w-xl py-8 md:py-12">
            <div className="glass-surface space-y-4 rounded-[2rem] p-6 md:p-8">
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                <AlertCircle className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                <span>Unavailable link</span>
              </span>
              <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
                This profile is unavailable
              </h1>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                We could not open <code className="rounded bg-[var(--pill-bg)] px-1.5 py-0.5 text-xs text-[var(--ink)]">?profile={activeProfileId}</code>. User-created drafts in this demo are saved only in the browser and signed-in account where they were created, or the profile may have been removed.
              </p>
              <div className="flex flex-wrap gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setActiveProfileId(null);
                    setActiveTab('discover');
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-[var(--ink)] px-4 py-2.5 text-sm font-bold text-[var(--bg)] transition hover:opacity-90"
                >
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  <span>Back to Discover</span>
                </button>
                {!user && (
                  <button
                    type="button"
                    onClick={() =>
                      openAuthPrompt(
                        'Sign in if you created this local draft on this browser under your account.'
                      )
                    }
                    className="rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                  >
                    Sign in
                  </button>
                )}
              </div>
            </div>
          </section>
        ) : (
          <>
            {activeTab === 'discover' && (
              <div className="space-y-8 md:space-y-12">
                <div className="grid grid-cols-1 items-start gap-2.5 md:gap-8 lg:grid-cols-12 lg:items-center lg:gap-10">
                  {/* Mobile single-row compact filter strip */}
                  <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto pb-0.5 md:hidden">
                    {activePrefs.length > 0 && (
                      <button
                        type="button"
                        onClick={clearPreferences}
                        className="shrink-0 rounded-full border border-[var(--accent)] bg-[var(--pill-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--accent)]"
                      >
                        Clear ({activePrefs.length})
                      </button>
                    )}
                    {prefChoices.map((pref) => {
                      const selected = activePrefs.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => togglePreference(pref)}
                          className="shrink-0 rounded-full border px-2.5 py-1 text-xs font-semibold transition"
                          style={
                            selected
                              ? {
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-ink)',
                                  borderColor: 'var(--accent)',
                                }
                              : {
                                  backgroundColor: 'var(--pill-bg)',
                                  color: 'var(--muted)',
                                  borderColor: 'var(--border)',
                                }
                          }
                        >
                          {pref}
                        </button>
                      );
                    })}
                  </div>

                  {/* Desktop & Tablet Intro + How it Works + Looking For selector */}
                  <div className="hidden space-y-6 md:block lg:col-span-7">
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                          {currentRegion.label}
                          {state.detectedCityLabel ? ` (near ${state.detectedCityLabel})` : ''}
                        </span>
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
                          Interactive demo, sample profiles &amp; local storage
                        </span>
                      </div>

                      <h1 className="hero-title font-bold text-[var(--ink)]">
                        {state.mode === 'jam'
                          ? 'Preview local players. Explore Jam & Gigs.'
                          : 'Preview local bands and venue bills.'}
                      </h1>

                      <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)]">
                        {state.mode === 'jam'
                          ? 'Spot instruments at a glance, watch intro clips, and open customizable sample artist pages. Matches, auto-replies, wall notes, and new drafts stay simulated in this browser.'
                          : 'Explore the Gigs side of the preview with sample venue slots, bands for hire, backline details, and simulated inquiry threads saved in this browser.'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass-surface rounded-2xl p-4">
                        <p className="text-xs font-bold text-[var(--accent)]">1. Pick your city</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                          Allow IP city detection or pick any metro board to keep sessions local.
                        </p>
                      </div>
                      <div className="glass-surface rounded-2xl p-4">
                        <p className="text-xs font-bold text-[var(--accent)]">2. Watch &amp; inspect</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                          Every card plays its main clip and opens into a customizable artist page.
                        </p>
                      </div>
                      <div className="glass-surface rounded-2xl p-4">
                        <p className="text-xs font-bold text-[var(--accent)]">3. Join to post</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                          Sign in with Google or Apple to record clips and showcase your gear locker.
                        </p>
                      </div>
                    </div>

                    <div className="glass-surface space-y-3 rounded-3xl p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-display text-base font-bold">
                          {state.mode === 'jam'
                            ? 'What kind of players are you looking to match with?'
                            : 'What kind of gigs or bands are you looking for?'}
                        </h2>
                        {activePrefs.length > 0 && (
                          <button
                            type="button"
                            onClick={clearPreferences}
                            className="text-xs font-semibold text-[var(--accent)] hover:underline"
                          >
                            Show all ({activePrefs.length} selected)
                          </button>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {prefChoices.map((pref) => {
                          const selected = activePrefs.includes(pref);
                          return (
                            <button
                              key={pref}
                              type="button"
                              aria-pressed={selected}
                              onClick={() => togglePreference(pref)}
                              className="rounded-full border px-3.5 py-2 text-xs font-semibold transition"
                              style={
                                selected
                                  ? {
                                      backgroundColor: 'var(--accent)',
                                      color: 'var(--accent-ink)',
                                      borderColor: 'var(--accent)',
                                    }
                                  : {
                                      backgroundColor: 'var(--pill-bg)',
                                      color: 'var(--ink)',
                                      borderColor: 'var(--border)',
                                    }
                              }
                            >
                              {pref}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          browseSectionRef.current?.scrollIntoView({ behavior: 'smooth' })
                        }
                        className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                      >
                        <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                        <span>Browse all ({regionalPool.length})</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleTabChange('post')}
                        className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:opacity-90"
                        style={{
                          backgroundColor: state.mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                          color: state.mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                        }}
                      >
                        <Video className="h-4 w-4" aria-hidden="true" />
                        <span>Build profile &amp; clips</span>
                      </button>
                    </div>
                  </div>

                  {/* Live 9:16 TikTok / Tinder card stage */}
                  <div className="space-y-3 lg:col-span-5">
                    <div className="no-scrollbar hidden items-center justify-start gap-2 overflow-x-auto pb-1 md:flex lg:justify-center">
                      {availableFilters.map((filter) => {
                        const active = chipFilter === filter;
                        return (
                          <button
                            key={filter}
                            type="button"
                            onClick={() => setChipFilter(filter)}
                            className="shrink-0 rounded-full border px-3 py-1 text-xs font-semibold transition"
                            style={
                              active
                                ? {
                                    backgroundColor: 'var(--accent)',
                                    color: 'var(--accent-ink)',
                                    borderColor: 'var(--accent)',
                                  }
                                : {
                                    backgroundColor: 'var(--pill-bg)',
                                    color: 'var(--muted)',
                                    borderColor: 'var(--border)',
                                  }
                            }
                          >
                            {filter}
                          </button>
                        );
                      })}
                    </div>

                    <SwipeDeck
                      cards={deckCards}
                      mode={state.mode}
                      region={currentRegion}
                      allRegions={allRegions}
                      canUndo={canUndo}
                      includeNearbyRegions={state.includeNearbyRegions}
                      soundEnabled={soundEnabled}
                      onToggleSound={() => setSoundEnabled((s) => !s)}
                      onSwipe={handleSwipe}
                      onUndo={handleUndo}
                      onOpenDetails={setDetailListing}
                      onOpenProfile={handleOpenProfile}
                      onEnableNearby={() =>
                        setState((prev) => ({ ...prev, includeNearbyRegions: true }))
                      }
                      onResetPassed={handleResetPassed}
                      onGoToPost={() => handleTabChange('post')}
                    />
                  </div>
                </div>

                <div
                  ref={browseSectionRef}
                  className="hidden border-t border-[var(--border)] pt-10 md:block"
                >
                  <BrowseGrid
                    listings={regionalPool}
                    mode={state.mode}
                    region={currentRegion}
                    allRegions={allRegions}
                    swiped={state.swiped}
                    onInspect={setDetailListing}
                    onOpenProfile={handleOpenProfile}
                    onSwipe={handleSwipe}
                  />
                </div>
              </div>
            )}

            {activeTab === 'browse' && (
              <div className="space-y-6">
                <div className="glass-surface space-y-3 rounded-3xl p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[var(--muted)]">
                      {state.mode === 'jam'
                        ? 'Filter by players you want to match with'
                        : 'Filter by gig or band type'}
                    </p>
                    {activePrefs.length > 0 && (
                      <button
                        type="button"
                        onClick={clearPreferences}
                        className="text-xs font-semibold text-[var(--accent)]"
                      >
                        Clear filters
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {prefChoices.map((pref) => {
                      const selected = activePrefs.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => togglePreference(pref)}
                          className="rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                          style={
                            selected
                              ? {
                                  backgroundColor: 'var(--accent)',
                                  color: 'var(--accent-ink)',
                                  borderColor: 'var(--accent)',
                                }
                              : {
                                  backgroundColor: 'var(--pill-bg)',
                                  color: 'var(--muted)',
                                  borderColor: 'var(--border)',
                                }
                          }
                        >
                          {pref}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <BrowseGrid
                  listings={regionalPool}
                  mode={state.mode}
                  region={currentRegion}
                  allRegions={allRegions}
                  swiped={state.swiped}
                  onInspect={setDetailListing}
                  onOpenProfile={handleOpenProfile}
                  onSwipe={handleSwipe}
                  onWatchInReels={() => handleTabChange('discover')}
                />
              </div>
            )}

            {activeTab === 'matches' && (
              <MatchesView
                matches={state.matches}
                listings={allListings}
                regions={allRegions}
                selectedMatchId={selectedMatchId}
                onSelectMatch={setSelectedMatchId}
                onSendMessage={handleSendMessage}
                onInspectListing={handleOpenProfile}
                onBackToDiscover={() => handleTabChange('discover')}
              />
            )}

            {activeTab === 'post' && (
              <PostView
                user={user}
                onRequireAuth={openAuthPrompt}
                onSignOut={() => void signOutUser()}
                defaultSide={state.mode}
                region={currentRegion}
                userListings={ownedUserListings}
                onCreateListing={(listing) => {
                  if (!user) return;
                  const ownedListing: Listing = {
                    ...listing,
                    ownerUid: user.uid,
                    ownerName: user.displayName,
                    isUserCreated: true,
                  };
                  setState((prev) => ({
                    ...prev,
                    userListings: [ownedListing, ...prev.userListings],
                  }));
                }}
                onDeleteListing={(listingId) => {
                  if (!user) return;
                  const target = state.userListings.find(
                    (l) => l.id === listingId && l.ownerUid === user.uid
                  );
                  if (!target) {
                    showToast('Only the creator can delete this local draft.');
                    return;
                  }
                  target.clips.forEach((clip) => {
                    if (clip.mediaId) void deleteMediaBlob(clip.mediaId);
                  });
                  setState((prev) => ({
                    ...prev,
                    userListings: prev.userListings.filter(
                      (l) => !(l.id === listingId && l.ownerUid === user.uid)
                    ),
                  }));
                  if (activeProfileId === listingId) {
                    setActiveProfileId(null);
                  }
                  showToast(`Removed ${target.title} from this browser.`);
                }}
                onPreviewListing={handleOpenProfile}
              />
            )}
          </>
        )}
      </main>

      {/* Custom Mobile Phone 4-Tab Bottom Glass Dock */}
      <nav
        aria-label="Mobile navigation"
        className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 md:hidden"
      >
        <div className="glass-dock pointer-events-auto grid w-full max-w-md grid-cols-4 gap-1 rounded-full p-1.5">
          <button
            type="button"
            aria-current={!activeProfileId && activeTab === 'discover' ? 'page' : undefined}
            onClick={() => handleTabChange('discover')}
            className="nav-pill-btn flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold text-[var(--muted)]"
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Reels</span>
          </button>

          <button
            type="button"
            aria-current={!activeProfileId && activeTab === 'browse' ? 'page' : undefined}
            onClick={() => handleTabChange('browse')}
            className="nav-pill-btn flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold text-[var(--muted)]"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
            <span>Browse</span>
          </button>

          <button
            type="button"
            aria-current={!activeProfileId && activeTab === 'matches' ? 'page' : undefined}
            onClick={() => handleTabChange('matches')}
            className="nav-pill-btn relative flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold text-[var(--muted)]"
          >
            <span className="relative">
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              {state.matches.length > 0 && (
                <span
                  className="absolute -right-2.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                  style={{
                    backgroundColor: state.mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                    color: state.mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                  }}
                >
                  {state.matches.length}
                </span>
              )}
            </span>
            <span>Matches</span>
          </button>

          <button
            type="button"
            aria-current={!activeProfileId && activeTab === 'post' ? 'page' : undefined}
            onClick={() => handleTabChange('post')}
            className="nav-pill-btn flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold text-[var(--muted)]"
          >
            <PlusSquare className="h-4 w-4" aria-hidden="true" />
            <span>Profile</span>
          </button>
        </div>
      </nav>

      {/* Non-blocking status toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="glass-dock fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold text-[var(--ink)] md:bottom-8"
        >
          {toast}
        </div>
      )}

      {/* Native top-layer modal dialogs */}
      <RegionDialog
        open={regionModalOpen}
        regions={allRegions}
        currentRegionId={state.regionId}
        includeNearbyRegions={state.includeNearbyRegions}
        listings={allListings}
        onClose={() => setRegionModalOpen(false)}
        onSelectRegion={(regionId) => setState((prev) => ({ ...prev, regionId }))}
        onToggleNearby={(next) => setState((prev) => ({ ...prev, includeNearbyRegions: next }))}
        onAddCustomRegion={handleAddCustomRegion}
      />

      <HowItWorksDialog
        open={howItWorksOpen}
        onClose={() => setHowItWorksOpen(false)}
        onPickRegion={() => setRegionModalOpen(true)}
        onGoToStudio={() => handleTabChange('post')}
      />

      <AuthDialog
        open={authModalOpen}
        reason={authReason}
        onClose={() => {
          setAuthModalOpen(false);
          setPendingMessage(null);
          setPendingWallNote(null);
        }}
        onAuthenticated={(signedUser) => {
          showToast(`Signed in as ${signedUser.displayName}`);
          if (pendingMessage) {
            deliverMessage(pendingMessage.matchId, pendingMessage.text);
            setPendingMessage(null);
          }
          if (pendingWallNote) {
            deliverWallComment(pendingWallNote.listingId, pendingWallNote.text, signedUser);
            setPendingWallNote(null);
          }
        }}
      />

      <DetailDialog
        listing={detailListing}
        region={detailListing ? allRegions.find((r) => r.id === detailListing.regionId) : undefined}
        alreadyMatched={
          detailListing
            ? state.matches.some((m) => m.listingId === detailListing.id) ||
              Boolean(detailListing.isUserCreated)
            : false
        }
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onClose={() => setDetailListing(null)}
        onOpenProfile={handleOpenProfile}
        onSwipe={handleSwipe}
      />

      <MatchDialog
        listing={matchPopupListing}
        region={
          matchPopupListing
            ? allRegions.find((r) => r.id === matchPopupListing.regionId)
            : undefined
        }
        onClose={() => setMatchPopupListing(null)}
        onOpenChat={handleOpenChatFromMatchPopup}
      />
    </div>
  );
}

export default App;
