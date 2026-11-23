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
import { AreaJamLogo, AreaJamMark, BrandContourBackdrop } from './components/BrandLogo';
import { BrowseGrid } from './components/BrowseGrid';
import { DetailDialog } from './components/DetailDialog';
import { HowItWorksDialog } from './components/HowItWorksDialog';
import { InstrumentIconSprite } from './components/InstrumentIcons';
import { JamInviteDialog } from './components/JamInviteDialog';
import { SafetyDialog, type SafetyTarget } from './components/SafetyDialog';
import { MatchesView } from './components/MatchesView';
import { PostView } from './components/PostView';
import { ProfilePage } from './components/ProfilePage';
import { RegionDialog } from './components/RegionDialog';
import { SwipeDeck } from './components/SwipeDeck';
import { DEFAULT_ALL_REGIONS, GIGS_PREFERENCES, JAM_PREFERENCES } from './data/regions';
import {
  addProfileWallNote,
  blockUser,
  cancelJamInvite,
  deleteProfileWallNote,
  deleteSharedProfile,
  fetchProfileById,
  respondToJamInvite,
  saveSharedProfile,
  sendJamInvite,
  sendThreadMessage,
  submitSafetyReport,
  subscribeMyBlocks,
  subscribeMyInvites,
  subscribeMyThreads,
  subscribeProfileWallNotes,
  subscribePublishedProfiles,
  unblockUser,
} from './lib/firestorePilot';
import { SEED_LISTINGS } from './data/seedListings';
import { stopCardPreview } from './lib/audioPreview';
import { signOutUser, subscribeAuth } from './lib/auth';
import { subscribeColorScheme, toggleColorScheme } from './lib/colorScheme';
import { detectLocationByIp, estimateRoughDistanceMiles } from './lib/location';
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
  BlockedUser,
  JamInvite,
  Listing,
  NavTab,
  PrivateThread,
  Region,
  SwipeDecision,
  WallComment,
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
    data: { ...loadState(null), mode: 'jam' },
  }));
  const state = scopedState.data;
  const setState = (updater: AppState | ((prev: AppState) => AppState)) => {
    setScopedState((prev) => ({
      ...prev,
      data: typeof updater === 'function' ? updater(prev.data) : updater,
    }));
  };

  const [user, setUser] = useState<AuthUser | null>(null);
  const [remoteProfiles, setRemoteProfiles] = useState<Listing[]>([]);
  const [deepLinkProfile, setDeepLinkProfile] = useState<Listing | null>(null);
  const [deepLinkLoading, setDeepLinkLoading] = useState<boolean>(false);
  const [invites, setInvites] = useState<JamInvite[]>([]);
  const [threads, setThreads] = useState<PrivateThread[]>([]);
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [liveWallNotes, setLiveWallNotes] = useState<WallComment[]>([]);

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
  const [pendingInviteTarget, setPendingInviteTarget] = useState<Listing | null>(null);
  const [pendingSafetyTarget, setPendingSafetyTarget] = useState<SafetyTarget | null>(null);
  const [pendingWallNote, setPendingWallNote] = useState<{
    listingId: string;
    text: string;
  } | null>(null);

  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [inviteTarget, setInviteTarget] = useState<Listing | null>(null);
  const [safetyTarget, setSafetyTarget] = useState<SafetyTarget | null>(null);
  const [selectedThreadId, setSelectedThreadId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const browseSectionRef = useRef<HTMLDivElement>(null);
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
        setDetailListing(null);
        setInviteTarget(null);
        setSafetyTarget(null);
        setSelectedThreadId(null);
        setInvites([]);
        setThreads([]);
        setBlocks([]);
        // Clear pending cross-account intentions on sign-out or account switch.
        if (prevUid !== null || nextUid === null) {
          setPendingInviteTarget(null);
          setPendingSafetyTarget(null);
          setPendingWallNote(null);
        }
        setScopedState({ scopeUid: nextUid, data: { ...loadState(nextUid), mode: 'jam' } });
      }
    });
  }, []);

  useEffect(() => {
    return subscribePublishedProfiles(setRemoteProfiles, () => {});
  }, []);

  useEffect(() => {
    if (!user) {
      setInvites([]);
      setThreads([]);
      setBlocks([]);
      return;
    }
    const unsubInvites = subscribeMyInvites(user.uid, setInvites, () => {});
    const unsubThreads = subscribeMyThreads(user.uid, setThreads, () => {});
    const unsubBlocks = subscribeMyBlocks(user.uid, setBlocks, () => {});
    return () => {
      unsubInvites();
      unsubThreads();
      unsubBlocks();
    };
  }, [user?.uid]);

  useEffect(() => {
    return subscribeColorScheme(() => {});
  }, []);

  useEffect(() => {
    saveState(scopedState.data, scopedState.scopeUid);
    syncUrlState(scopedState.data.regionId, scopedState.data.mode, activeProfileId);
    document.documentElement.style.setProperty('--accent', 'var(--jam)');
    document.documentElement.style.setProperty('--accent-ink', 'var(--jam-ink)');
    document.documentElement.style.setProperty('--accent-text', 'var(--jam-text)');
  }, [scopedState, activeProfileId]);

  useEffect(() => {
    return () => {
      stopCardPreview();
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

  const blockedUidSet = useMemo(
    () => new Set(blocks.map((b) => b.blockedUid)),
    [blocks]
  );

  const inviteByTargetUid = useMemo(() => {
    const map: Record<string, JamInvite> = {};
    if (!user) return map;
    for (const inv of invites) {
      const otherUid = inv.participants.find((uid) => uid !== user.uid);
      if (otherUid && !map[otherUid]) {
        map[otherUid] = inv;
      }
    }
    return map;
  }, [invites, user]);

  const visibleInvites = useMemo(
    () => invites.filter((inv) => inv.participants.every((uid) => !blockedUidSet.has(uid))),
    [invites, blockedUidSet]
  );

  const visibleThreads = useMemo(
    () => threads.filter((t) => t.participants.every((uid) => !blockedUidSet.has(uid))),
    [threads, blockedUidSet]
  );

  const incomingPendingCount = useMemo(
    () =>
      user
        ? visibleInvites.filter((inv) => inv.status === 'pending' && inv.toUid === user.uid).length
        : 0,
    [visibleInvites, user]
  );

  const allRegions = useMemo<Region[]>(() => {
    const map = new Map<string, Region>();
    for (const r of DEFAULT_ALL_REGIONS) {
      map.set(r.id, r);
    }
    for (const r of state.customRegions) {
      map.set(r.id, r);
    }
    for (const profile of remoteProfiles) {
      if (profile.regionId && !map.has(profile.regionId)) {
        const label = profile.regionLabel || profile.regionId;
        map.set(profile.regionId, {
          id: profile.regionId,
          city: label.split(',')[0]?.split('(')[0]?.trim() || profile.regionId,
          state: profile.regionState || 'US',
          areaCode: label.match(/\((\d{3})\)/)?.[1] || 'US',
          label,
          isCustom: true,
        });
      }
    }
    return Array.from(map.values());
  }, [state.customRegions, remoteProfiles]);

  const currentRegion = useMemo<Region>(
    () => allRegions.find((r) => r.id === state.regionId) ?? allRegions[0],
    [allRegions, state.regionId]
  );

  const visibleRemoteProfiles = useMemo<Listing[]>(
    () => remoteProfiles.filter((l) => !l.ownerUid || !blockedUidSet.has(l.ownerUid)),
    [remoteProfiles, blockedUidSet]
  );

  const ownedUserListings = useMemo<Listing[]>(
    () => (user ? visibleRemoteProfiles.filter((l) => l.ownerUid === user.uid) : []),
    [visibleRemoteProfiles, user]
  );

  const allListings = useMemo<Listing[]>(
    () => [
      ...visibleRemoteProfiles,
      ...(state.showSampleCards ? SEED_LISTINGS.filter((l) => l.side === 'jam') : []),
    ],
    [visibleRemoteProfiles, state.showSampleCards]
  );

  const activeProfile = useMemo<Listing | null>(() => {
    if (!activeProfileId) return null;
    const fromVisible = visibleRemoteProfiles.find((l) => l.id === activeProfileId);
    if (fromVisible) return fromVisible;
    const fromSample = SEED_LISTINGS.find((l) => l.id === activeProfileId);
    if (fromSample) return fromSample;
    if (deepLinkProfile && deepLinkProfile.id === activeProfileId) {
      if (deepLinkProfile.ownerUid && blockedUidSet.has(deepLinkProfile.ownerUid)) return null;
      return deepLinkProfile;
    }
    return null;
  }, [activeProfileId, visibleRemoteProfiles, deepLinkProfile, blockedUidSet]);

  const hasMissingProfile = Boolean(activeProfileId && !deepLinkLoading && !activeProfile);

  useEffect(() => {
    if (!activeProfileId) {
      setDeepLinkProfile(null);
      setDeepLinkLoading(false);
      return;
    }
    const alreadyLoaded =
      remoteProfiles.some((l) => l.id === activeProfileId) ||
      SEED_LISTINGS.some((l) => l.id === activeProfileId);
    if (alreadyLoaded) {
      setDeepLinkLoading(false);
      return;
    }
    let cancelled = false;
    setDeepLinkLoading(true);
    fetchProfileById(activeProfileId)
      .then((profile) => {
        if (!cancelled) {
          setDeepLinkProfile(profile);
          setDeepLinkLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setDeepLinkLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [activeProfileId, remoteProfiles]);

  useEffect(() => {
    if (!activeProfile || activeProfile.isSample) {
      setLiveWallNotes([]);
      return;
    }
    return subscribeProfileWallNotes(activeProfile.id, setLiveWallNotes, () => {});
  }, [activeProfile?.id, activeProfile?.isSample]);

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

  const regionById = useMemo(
    () => new Map(allRegions.map((r) => [r.id, r])),
    [allRegions]
  );

  const sidePool = useMemo(
    () => allListings.filter((l) => l.side === state.mode),
    [allListings, state.mode]
  );

  const localUnfiltered = useMemo(
    () => sidePool.filter((l) => l.regionId === state.regionId),
    [sidePool, state.regionId]
  );

  const otherUnfiltered = useMemo(() => {
    const distanceCache = new Map<string, number | null>();
    const getDist = (regionId: string): number | null => {
      if (!distanceCache.has(regionId)) {
        distanceCache.set(
          regionId,
          estimateRoughDistanceMiles(currentRegion, regionById.get(regionId))
        );
      }
      return distanceCache.get(regionId) ?? null;
    };

    return sidePool
      .filter((l) => l.regionId !== state.regionId)
      .sort((a, b) => {
        const distA = getDist(a.regionId);
        const distB = getDist(b.regionId);
        if (distA !== null && distB !== null && distA !== distB) return distA - distB;
        if (distA !== null && distB === null) return -1;
        if (distA === null && distB !== null) return 1;
        const aSample = Boolean(a.isSample);
        const bSample = Boolean(b.isSample);
        if (aSample !== bSample) return aSample ? 1 : -1;
        return b.createdAt - a.createdAt;
      });
  }, [sidePool, state.regionId, currentRegion, regionById]);

  const availableFilters = useMemo(() => {
    const modeListings =
      localUnfiltered.length === 0 || state.includeNearbyRegions ? sidePool : localUnfiltered;
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
  }, [localUnfiltered, sidePool, state.includeNearbyRegions]);

  useEffect(() => {
    if (!availableFilters.includes(chipFilter)) {
      setChipFilter('All');
    }
  }, [availableFilters, chipFilter]);

  const { localFiltered, otherFiltered, showingNearestFallback } = useMemo(() => {
    const matchesCurrentFilters = (item: Listing) => {
      if (!matchesPreferences(item, activePrefs)) return false;
      if (chipFilter === 'All') return true;
      return item.genres.includes(chipFilter) || item.tags.includes(chipFilter);
    };
    const nextLocal = localUnfiltered.filter(matchesCurrentFilters);
    const nextOther = otherUnfiltered.filter(matchesCurrentFilters);
    return {
      localFiltered: nextLocal,
      otherFiltered: nextOther,
      showingNearestFallback: nextLocal.length === 0 && nextOther.length > 0,
    };
  }, [localUnfiltered, otherUnfiltered, activePrefs, chipFilter]);

  const regionalPool = useMemo(() => {
    if (showingNearestFallback) return otherFiltered;
    return state.includeNearbyRegions ? [...localFiltered, ...otherFiltered] : localFiltered;
  }, [showingNearestFallback, state.includeNearbyRegions, localFiltered, otherFiltered]);

  const { deckCards, showingDeckNearestFallback } = useMemo(() => {
    const isSwipeable = (l: Listing) => (!user || l.ownerUid !== user.uid) && !state.swiped[l.id];
    const eligibleLocal = localFiltered.filter(isSwipeable);
    const eligibleOther = otherFiltered.filter(isSwipeable);
    const localOnlySelf =
      !showingNearestFallback &&
      eligibleLocal.length === 0 &&
      eligibleOther.length > 0 &&
      localFiltered.every((l) => user && l.ownerUid === user.uid);
    const useNearestDeck = showingNearestFallback || localOnlySelf;

    return {
      deckCards: useNearestDeck
        ? eligibleOther
        : state.includeNearbyRegions
          ? [...eligibleLocal, ...eligibleOther]
          : eligibleLocal,
      showingDeckNearestFallback: useNearestDeck,
    };
  }, [
    localFiltered,
    otherFiltered,
    showingNearestFallback,
    state.includeNearbyRegions,
    state.swiped,
    user,
  ]);

  const handleModeChange = (nextMode: AppMode) => {
    if (nextMode === 'gigs') {
      showToast('Gigs board opens soon once local venues join — Jam pilot is live now!');
      return;
    }
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
      setSelectedThreadId(null);
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

    if (decision === 'like' && !listing.isSample) {
      handleRequestInvite(listing);
      return;
    }

    setState((prev) => {
      if (prev.swiped[listing.id]) return prev;
      return {
        ...prev,
        swiped: { ...prev.swiped, [listing.id]: decision },
        history: [...prev.history, { listingId: listing.id, decision }],
      };
    });

    if (decision === 'like' && listing.isSample) {
      showToast(
        `${listing.title} is a sample demo card — turn to Live profiles to send real Jam invites.`
      );
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
    const includeAll =
      showingNearestFallback || showingDeckNearestFallback || state.includeNearbyRegions;
    const modePoolIds = new Set(
      allListings
        .filter((l) => l.side === state.mode && (includeAll || l.regionId === state.regionId))
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

  const handleOpenInvites = (threadId?: string) => {
    stopCardPreview();
    setActiveProfileId(null);
    setDetailListing(null);
    setActiveTab('matches');
    setSelectedThreadId(threadId ?? null);
  };

  const handleRequestInvite = (listing: Listing) => {
    if (listing.isSample || !listing.ownerUid) {
      showToast('Sample preview cards cannot receive Jam invites. Browse or post live players.');
      return;
    }
    if (!user) {
      setPendingInviteTarget(listing);
      setAuthReason(`Sign in with Google or Apple to invite ${listing.title} to jam.`);
      setAuthModalOpen(true);
      return;
    }
    if (listing.ownerUid === user.uid) {
      handleOpenProfile(listing);
      return;
    }
    const existing = inviteByTargetUid[listing.ownerUid];
    if (existing?.status === 'accepted') {
      handleOpenInvites(existing.threadId);
      return;
    }
    if (existing?.status === 'pending') {
      handleOpenInvites();
      return;
    }
    setDetailListing(null);
    setInviteTarget(listing);
  };

  const handleSubmitInvite = async (listing: Listing, note: string) => {
    if (!user) return;
    const outcome = await sendJamInvite({ fromUser: user, targetListing: listing, note });
    if (outcome === 'already-accepted') {
      showToast(`You already have a private thread with ${listing.title}.`);
      handleOpenInvites();
    } else if (outcome === 'incoming-pending') {
      showToast(`${listing.title} already invited you — check Incoming invites!`);
      handleOpenInvites();
    } else if (outcome === 'already-pending') {
      showToast(`Jam invite already pending for ${listing.title}.`);
    } else {
      showToast(`Sent jam invite to ${listing.title}.`);
    }
  };

  const handleRespondInvite = async (
    invite: JamInvite,
    decision: 'accepted' | 'declined'
  ) => {
    if (!user) return;
    const openedThreadId = await respondToJamInvite({ invite, responderUser: user, decision });
    if (decision === 'accepted' && openedThreadId) {
      setSelectedThreadId(openedThreadId);
      showToast(`Private thread opened with ${invite.fromName}.`);
    } else {
      showToast(`Declined jam invite from ${invite.fromName}.`);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    await cancelJamInvite(inviteId);
    showToast('Withdrew jam invite.');
  };

  const handleSendMessage = async (threadId: string, text: string) => {
    if (!user) {
      setAuthReason('Sign in with Google or Apple to send messages.');
      setAuthModalOpen(true);
      return;
    }
    await sendThreadMessage({ threadId, user, text });
  };

  const handleSafetyAction = (target: SafetyTarget) => {
    if (!user) {
      setPendingSafetyTarget(target);
      setAuthReason('Sign in with Google or Apple to submit a report or block a user.');
      setAuthModalOpen(true);
      return;
    }
    setSafetyTarget(target);
  };

  const handleConfirmBlock = async (blockedUid: string, blockedName: string) => {
    if (!user) return;
    await blockUser(user.uid, blockedUid, blockedName);
    if (activeProfile?.ownerUid === blockedUid) {
      setActiveProfileId(null);
    }
    setSelectedThreadId(null);
    showToast(`Blocked ${blockedName}.`);
  };

  const handleUnblockUser = async (blockedUid: string) => {
    if (!user) return;
    await unblockUser(user.uid, blockedUid);
    showToast('Account unblocked.');
  };

  const handleSubmitReport = async (params: {
    targetUid: string;
    targetType: 'profile' | 'thread' | 'wallNote';
    targetId: string;
    reason: import('./types').ReportReason;
    details: string;
  }) => {
    if (!user) return;
    await submitSafetyReport({ reporterUid: user.uid, ...params });
    showToast('Safety report submitted. Thank you for helping keep AreaJam safe.');
  };

  const deliverWallComment = async (listingId: string, text: string, author: AuthUser) => {
    const targetListing = allListings.find((l) => l.id === listingId) ?? activeProfile;
    if (targetListing && !targetListing.isSample) {
      await addProfileWallNote(listingId, author, text);
      showToast('Posted public note to Firestore scene wall.');
      return;
    }
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
    showToast('Saved local preview note on sample wall.');
  };

  const handleAddWallComment = (listingId: string, text: string) => {
    if (!user) {
      setPendingWallNote({ listingId, text });
      setAuthReason('Sign in with Google or Apple to leave a public note on this page.');
      setAuthModalOpen(true);
      return;
    }
    void deliverWallComment(listingId, text, user);
  };

  const handleDeleteWallComment = async (listingId: string, noteId: string) => {
    try {
      await deleteProfileWallNote(listingId, noteId);
      showToast('Deleted wall note.');
    } catch {
      showToast('Could not delete this wall note.');
    }
  };

  const handleUpdateUserListing = async (updated: Listing) => {
    if (!user || updated.ownerUid !== user.uid) {
      showToast('Only the creator can edit this profile.');
      return;
    }
    try {
      const regionObj = allRegions.find((r) => r.id === updated.regionId);
      const saved = await saveSharedProfile(updated, user, regionObj);
      setRemoteProfiles((prev) => prev.map((l) => (l.id === saved.id ? saved : l)));
      showToast('Saved profile changes to Firestore.');
    } catch {
      showToast('Could not save profile updates right now.');
    }
  };

  const openAuthPrompt = (reason?: string) => {
    setAuthReason(reason);
    setAuthModalOpen(true);
  };

  const handleShareProfileUrl = (listing?: Listing | null) => {
    const copiedToast = listing?.isSample
      ? 'Copied sample demo profile link.'
      : 'Copied live profile share link.';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href).then(
        () => showToast(copiedToast),
        () => showToast('Share the URL in your browser bar.')
      );
    } else {
      showToast('Share the URL in your browser bar.');
    }
  };

  return (
    <div className="relative min-h-dvh pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] md:pb-12">
      <InstrumentIconSprite />

      {/* Architectural pink/gigs acoustic contour lines */}
      <BrandContourBackdrop mode={state.mode} />

      {/* Full-width edge-to-edge sticky header */}
      <header className="safe-top sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
        <div className="toolbar mx-auto flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 pb-3 md:px-6 xl:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => handleTabChange('discover')}
              aria-label="AreaJam home"
              className="flex items-center gap-2.5 text-left"
            >
              <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-1.5 shadow-sm sm:hidden">
                <AreaJamMark className="h-full w-full" />
              </span>
              <span className="sm:hidden">
                <span className="font-display block text-base font-bold leading-none tracking-tight text-[var(--ink)]">
                  AreaJam
                </span>
                <span className="mt-0.5 block text-[10px] font-semibold leading-none text-[var(--muted)]">
                  Nashville pilot
                </span>
              </span>

              <span className="hidden items-center gap-2.5 sm:inline-flex">
                <AreaJamLogo className="h-10 w-[164px] shrink-0 text-[var(--ink)]" />
                <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                  Nashville pilot + all US cities
                </span>
              </span>
            </button>

            <nav aria-label="Primary" className="hidden items-center gap-1 md:flex">
              {(
                [
                  { id: 'discover', label: 'Discover' },
                  { id: 'browse', label: 'Browse players' },
                  {
                    id: 'matches',
                    label:
                      incomingPendingCount + visibleThreads.length > 0
                        ? `Invites (${incomingPendingCount + visibleThreads.length})`
                        : 'Invites',
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
              <MapPin className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
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
                aria-pressed={false}
                onClick={() => handleModeChange('gigs')}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
              >
                <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Gigs (Soon)</span>
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
              <Navigation className="h-3.5 w-3.5 shrink-0 text-[var(--accent-text)] md:h-4 md:w-4" aria-hidden="true" />
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
            selectedRegion={currentRegion}
            allListings={allListings}
            allRegions={allRegions}
            user={user}
            inviteByTargetUid={inviteByTargetUid}
            soundEnabled={soundEnabled}
            wallComments={
              activeProfile.isSample ? (state.wallComments[activeProfile.id] ?? []) : liveWallNotes
            }
            onToggleSound={() => setSoundEnabled((s) => !s)}
            onBack={() => setActiveProfileId(null)}
            onInvite={handleRequestInvite}
            onOpenInvites={handleOpenInvites}
            onSafetyAction={handleSafetyAction}
            onOpenProfile={handleOpenProfile}
            onUpdateListing={handleUpdateUserListing}
            onAddWallComment={handleAddWallComment}
            onDeleteWallComment={activeProfile.isSample ? undefined : handleDeleteWallComment}
            onShareUrl={() => handleShareProfileUrl(activeProfile)}
          />
        ) : activeProfileId && deepLinkLoading ? (
          <section className="mx-auto max-w-xl py-8 md:py-12">
            <div className="glass-surface space-y-3 rounded-[2rem] p-6 text-center md:p-8">
              <AreaJamMark className="mx-auto h-10 w-10" />
              <h1 className="font-display text-xl font-bold text-[var(--ink)]">
                Loading shared profile...
              </h1>
              <p className="text-xs text-[var(--muted)]">
                Fetching public musician card <code className="rounded bg-[var(--pill-bg)] px-1.5 py-0.5 text-[var(--ink)]">{activeProfileId}</code> from Cloud Firestore.
              </p>
            </div>
          </section>
        ) : hasMissingProfile ? (
          <section className="mx-auto max-w-xl py-8 md:py-12">
            <div className="glass-surface space-y-4 rounded-[2rem] p-6 md:p-8">
              <AreaJamMark className="h-10 w-10" />
              <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                <AlertCircle className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
                <span>Unavailable link</span>
              </span>
              <h1 className="font-display text-2xl font-bold text-[var(--ink)]">
                This profile is unavailable
              </h1>
              <p className="text-sm leading-relaxed text-[var(--muted)]">
                We could not find <code className="rounded bg-[var(--pill-bg)] px-1.5 py-0.5 text-xs text-[var(--ink)]">?profile={activeProfileId}</code>. The profile may have been unpublished, deleted by its owner, or shared with an invalid link.
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
                    <button
                      type="button"
                      onClick={() =>
                        setState((prev) => ({ ...prev, showSampleCards: !prev.showSampleCards }))
                      }
                      className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--muted)]"
                    >
                      {state.showSampleCards ? 'Samples: On' : 'Samples: Off'}
                    </button>
                    {activePrefs.length > 0 && (
                      <button
                        type="button"
                        onClick={clearPreferences}
                        className="shrink-0 rounded-full border border-[var(--accent-text)] bg-[var(--pill-bg)] px-2.5 py-1 text-xs font-semibold text-[var(--accent-text)]"
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
                        <span className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-1 text-xs font-semibold text-[var(--accent-text)]">
                          Live Jam pilot across all US cities
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setState((prev) => ({ ...prev, showSampleCards: !prev.showSampleCards }))
                          }
                          className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
                        >
                          {state.showSampleCards ? 'Sample demos: On' : 'Sample demos: Off'}
                        </button>
                      </div>

                      <h1 className="hero-title font-bold text-[var(--ink)]">
                        Find your people. Make some noise.
                      </h1>

                      <p className="max-w-2xl text-base leading-relaxed text-[var(--muted)]">
                        Hear linked Instagram Reels, YouTube clips, and SoundCloud tracks right on the card. Spot instruments fast, send a Jam invite with a note, and unlock one private thread when they accept.
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="glass-surface brand-card-accent rounded-2xl p-4">
                        <p className="text-xs font-bold text-[var(--accent-text)]">Nashville + all US</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                          Spotlighting Nashville (615) first, with every US state and custom city searchable in one tap.
                        </p>
                      </div>
                      <div className="glass-surface brand-card-accent rounded-2xl p-4">
                        <p className="text-xs font-bold text-[var(--accent-text)]">Linked clips + IG</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                          Paste public Reels, YouTube, TikTok, or SoundCloud links and showcase your Instagram handle.
                        </p>
                      </div>
                      <div className="glass-surface brand-card-accent rounded-2xl p-4">
                        <p className="text-xs font-bold text-[var(--accent-text)]">Invite to jam</p>
                        <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                          Accept or decline invites on your terms to open a single private 1-on-1 Firestore thread.
                        </p>
                      </div>
                    </div>

                    <div className="glass-surface space-y-3 rounded-3xl p-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h2 className="font-display text-base font-bold">
                          What kind of players are you looking to jam with?
                        </h2>
                        {activePrefs.length > 0 && (
                          <button
                            type="button"
                            onClick={clearPreferences}
                            className="text-xs font-semibold text-[var(--accent-text)] hover:underline"
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
                      showingNearestFallback={showingDeckNearestFallback}
                      showSampleCards={state.showSampleCards}
                      soundEnabled={soundEnabled}
                      currentUserUid={user?.uid}
                      inviteByTargetUid={inviteByTargetUid}
                      onToggleSound={() => setSoundEnabled((s) => !s)}
                      onSwipe={handleSwipe}
                      onUndo={handleUndo}
                      onOpenDetails={setDetailListing}
                      onOpenProfile={handleOpenProfile}
                      onInvite={handleRequestInvite}
                      onOpenInvites={handleOpenInvites}
                      onEnableNearby={() =>
                        setState((prev) => ({ ...prev, includeNearbyRegions: true }))
                      }
                      onToggleSampleCards={() =>
                        setState((prev) => ({ ...prev, showSampleCards: !prev.showSampleCards }))
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
                    showingNearestFallback={showingNearestFallback}
                    currentUserUid={user?.uid}
                    inviteByTargetUid={inviteByTargetUid}
                    onInspect={setDetailListing}
                    onOpenProfile={handleOpenProfile}
                    onSwipe={handleSwipe}
                    onInvite={handleRequestInvite}
                    onOpenInvites={handleOpenInvites}
                    onGoToPost={() => handleTabChange('post')}
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
                        className="text-xs font-semibold text-[var(--accent-text)]"
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
                  showingNearestFallback={showingNearestFallback}
                  currentUserUid={user?.uid}
                  inviteByTargetUid={inviteByTargetUid}
                  onInspect={setDetailListing}
                  onOpenProfile={handleOpenProfile}
                  onSwipe={handleSwipe}
                  onInvite={handleRequestInvite}
                  onOpenInvites={handleOpenInvites}
                  onWatchInReels={() => handleTabChange('discover')}
                  onGoToPost={() => handleTabChange('post')}
                />
              </div>
            )}

            {activeTab === 'matches' && (
              <MatchesView
                user={user}
                invites={visibleInvites}
                threads={visibleThreads}
                listings={allListings}
                regions={allRegions}
                selectedThreadId={selectedThreadId}
                onSelectThread={setSelectedThreadId}
                onRespondInvite={handleRespondInvite}
                onCancelInvite={handleCancelInvite}
                onSendMessage={handleSendMessage}
                onInspectListing={handleOpenProfile}
                onSafetyAction={handleSafetyAction}
                onRequireAuth={openAuthPrompt}
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
                onOpenRegionPicker={() => setRegionModalOpen(true)}
                userListings={ownedUserListings}
                blockedUsers={blocks}
                onPublishListing={async (listing) => {
                  if (!user) return;
                  const saved = await saveSharedProfile(listing, user, currentRegion);
                  setRemoteProfiles((prev) => [
                    saved,
                    ...prev.filter((item) => item.id !== saved.id),
                  ]);
                  showToast(`Published ${saved.title} to ${currentRegion.label}.`);
                }}
                onDeleteListing={async (listingId) => {
                  if (!user) return;
                  const target = remoteProfiles.find(
                    (l) => l.id === listingId && l.ownerUid === user.uid
                  );
                  if (!target) {
                    showToast('Only the creator can delete this profile.');
                    return;
                  }
                  await deleteSharedProfile(listingId);
                  setRemoteProfiles((prev) => prev.filter((l) => l.id !== listingId));
                  if (activeProfileId === listingId) {
                    setActiveProfileId(null);
                  }
                  showToast(`Deleted ${target.title} from Firestore.`);
                }}
                onPreviewListing={handleOpenProfile}
                onUnblockUser={handleUnblockUser}
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
              {incomingPendingCount + visibleThreads.length > 0 && (
                <span
                  className="absolute -right-2.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                  style={{
                    backgroundColor: 'var(--jam)',
                    color: 'var(--jam-ink)',
                  }}
                >
                  {incomingPendingCount + visibleThreads.length}
                </span>
              )}
            </span>
            <span>Invites</span>
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
          setPendingInviteTarget(null);
          setPendingSafetyTarget(null);
          setPendingWallNote(null);
        }}
        onAuthenticated={(signedUser) => {
          showToast(`Signed in as ${signedUser.displayName}`);
          if (pendingInviteTarget) {
            if (pendingInviteTarget.ownerUid === signedUser.uid) {
              handleOpenProfile(pendingInviteTarget);
            } else {
              setInviteTarget(pendingInviteTarget);
            }
            setPendingInviteTarget(null);
          }
          if (pendingSafetyTarget) {
            setSafetyTarget(pendingSafetyTarget);
            setPendingSafetyTarget(null);
          }
          if (pendingWallNote) {
            void deliverWallComment(pendingWallNote.listingId, pendingWallNote.text, signedUser);
            setPendingWallNote(null);
          }
        }}
      />

      <DetailDialog
        listing={detailListing}
        region={detailListing ? allRegions.find((r) => r.id === detailListing.regionId) : undefined}
        selectedRegion={currentRegion}
        currentUserUid={user?.uid}
        inviteByTargetUid={inviteByTargetUid}
        soundEnabled={soundEnabled}
        onToggleSound={() => setSoundEnabled((s) => !s)}
        onClose={() => setDetailListing(null)}
        onOpenProfile={handleOpenProfile}
        onSwipe={handleSwipe}
        onInvite={handleRequestInvite}
        onOpenInvites={handleOpenInvites}
      />

      <JamInviteDialog
        listing={inviteTarget}
        regionLabel={
          inviteTarget
            ? allRegions.find((r) => r.id === inviteTarget.regionId)?.label ??
              inviteTarget.regionLabel
            : undefined
        }
        onClose={() => setInviteTarget(null)}
        onSubmit={handleSubmitInvite}
      />

      <SafetyDialog
        target={safetyTarget}
        onClose={() => setSafetyTarget(null)}
        onConfirmBlock={handleConfirmBlock}
        onSubmitReport={handleSubmitReport}
      />
    </div>
  );
}

export default App;
