import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  Flame,
  Globe,
  HelpCircle,
  LayoutGrid,
  MapPin,
  MessageCircle,
  Moon,
  Navigation,
  PlusSquare,
  Search,
  Sun,
  UserCheck,
  Video,
  X,
} from 'lucide-react';
import { AuthDialog } from './components/AuthDialog';
import { AreaJamLogo, AreaJamMark, BrandContourBackdrop } from './components/BrandLogo';
import { BrowseGrid } from './components/BrowseGrid';
import { DeleteAccountDialog } from './components/DeleteAccountDialog';
import { DetailDialog } from './components/DetailDialog';
import { HowItWorksDialog } from './components/HowItWorksDialog';
import { InstrumentIconSprite } from './components/InstrumentIcons';
import { JamInviteDialog } from './components/JamInviteDialog';
import { SafetyDialog, type SafetyTarget } from './components/SafetyDialog';
import { MatchesView } from './components/MatchesView';
import { PanoramicHero } from './components/PanoramicHero';
import { PostView } from './components/PostView';
import { ProfilePage } from './components/ProfilePage';
import { RegionDialog } from './components/RegionDialog';
import { SwipeDeck } from './components/SwipeDeck';
import { DEFAULT_ALL_REGIONS, JAM_PREFERENCES } from './data/regions';
import { LA_PROFILES } from './data/laProfiles';
import {
  addProfileWallNote,
  blockUser,
  buildThreadFromInvite,
  cancelJamInvite,
  deleteAccountFirestoreData,
  deleteProfileWallNote,
  deleteSharedProfile,
  ensureThreadForAcceptedInvite,
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
import { stopCardPreview } from './lib/audioPreview';
import {
  deleteCurrentAuthUser,
  ensureRecentAuthIfNeeded,
  signOutUser,
  subscribeAuth,
} from './lib/auth';
import { subscribeColorScheme, toggleColorScheme } from './lib/colorScheme';
import { detectLocationByIp, estimateRoughDistanceMiles } from './lib/location';
import { runFilterTransition } from './lib/viewTransition';
import {
  clearStoredUserState,
  loadState,
  parseUrlState,
  resetPassedSwipes,
  saveState,
  syncUrlState,
} from './lib/storage';
import type {
  AppState,
  AuthUser,
  BlockedUser,
  DiscoveryRole,
  InboxFolder,
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
    if (pref === 'Producers') {
      return listing.instruments.includes('producer');
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
  const [resolvedProfileId, setResolvedProfileId] = useState<string | null>(null);
  const [invites, setInvites] = useState<JamInvite[]>([]);
  const [threads, setThreads] = useState<PrivateThread[]>([]);
  const [blocks, setBlocks] = useState<BlockedUser[]>([]);
  const [liveWallNotes, setLiveWallNotes] = useState<WallComment[]>([]);

  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [discoveryRole, setDiscoveryRole] = useState<DiscoveryRole>('musician');
  const [activeProfileId, setActiveProfileId] = useState<string | null>(
    () => parseUrlState().profileId ?? null
  );
  const [chipFilter, setChipFilter] = useState<string>('All');
  const [discoverStage, setDiscoverStage] = useState<'carousel' | 'swipe'>('carousel');
  const [focusedDeckId, setFocusedDeckId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(false);
  const [ipDetecting, setIpDetecting] = useState<boolean>(false);

  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);
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
  const [inboxFolder, setInboxFolder] = useState<InboxFolder>('inbox');
  const [toast, setToast] = useState<string | null>(null);

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
        setInboxFolder('inbox');
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
    return subscribePublishedProfiles(setRemoteProfiles, (err) => {
      console.error('[AreaJam] profiles subscription error:', err);
    });
  }, []);

  useEffect(() => {
    if (!user) {
      setInvites([]);
      setThreads([]);
      setBlocks([]);
      return;
    }
    const unsubInvites = subscribeMyInvites(user.uid, setInvites, (err) => {
      console.error('[AreaJam] invites subscription error:', err);
    });
    const unsubThreads = subscribeMyThreads(user.uid, setThreads, (err) => {
      console.error('[AreaJam] threads subscription error:', err);
    });
    const unsubBlocks = subscribeMyBlocks(user.uid, setBlocks, (err) => {
      console.error('[AreaJam] blocks subscription error:', err);
    });
    return () => {
      unsubInvites();
      unsubThreads();
      unsubBlocks();
    };
  }, [user?.uid]);

  useEffect(() => {
    return subscribeColorScheme(() => { });
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

  const effectiveThreads = useMemo(() => {
    const byId = new Map<string, PrivateThread>();
    for (const thread of visibleThreads) {
      byId.set(thread.id, thread);
    }
    for (const inv of visibleInvites) {
      if (inv.status === 'accepted' && !byId.has(inv.threadId)) {
        byId.set(inv.threadId, buildThreadFromInvite(inv, user ?? undefined));
      }
    }
    return Array.from(byId.values()).sort(
      (a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0)
    );
  }, [visibleThreads, visibleInvites, user]);

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
    () => [...visibleRemoteProfiles, ...LA_PROFILES],
    [visibleRemoteProfiles]
  );

  const activeProfile = useMemo<Listing | null>(() => {
    if (!activeProfileId) return null;
    const fromVisible = visibleRemoteProfiles.find((l) => l.id === activeProfileId);
    if (fromVisible) return fromVisible;
    const fromLa = LA_PROFILES.find((l) => l.id === activeProfileId);
    if (fromLa) return fromLa;
    if (deepLinkProfile && deepLinkProfile.id === activeProfileId) {
      if (deepLinkProfile.ownerUid && blockedUidSet.has(deepLinkProfile.ownerUid)) return null;
      return deepLinkProfile;
    }
    return null;
  }, [activeProfileId, visibleRemoteProfiles, deepLinkProfile, blockedUidSet]);

  useEffect(() => {
    if (!activeProfileId) {
      setDeepLinkProfile(null);
      setDeepLinkLoading(false);
      setResolvedProfileId(null);
      return;
    }
    const alreadyLoaded =
      remoteProfiles.some((l) => l.id === activeProfileId) ||
      LA_PROFILES.some((l) => l.id === activeProfileId);
    if (alreadyLoaded) {
      setDeepLinkLoading(false);
      setResolvedProfileId(activeProfileId);
      return;
    }
    let cancelled = false;
    setDeepLinkLoading(true);
    fetchProfileById(activeProfileId)
      .then((profile) => {
        if (!cancelled) {
          setDeepLinkProfile(profile);
          setDeepLinkLoading(false);
          setResolvedProfileId(activeProfileId);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setDeepLinkProfile(null);
          setDeepLinkLoading(false);
          setResolvedProfileId(activeProfileId);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [activeProfileId, remoteProfiles]);

  useEffect(() => {
    if (!activeProfileId || activeProfile || deepLinkLoading || resolvedProfileId !== activeProfileId) {
      return;
    }
    setActiveProfileId(null);
    setActiveTab('discover');
    showToast('Page unavailable — showing musicians near your area.');
  }, [activeProfileId, activeProfile, deepLinkLoading, resolvedProfileId]);

  useEffect(() => {
    if (!activeProfile) {
      setLiveWallNotes([]);
      return;
    }
    return subscribeProfileWallNotes(activeProfile.id, setLiveWallNotes, () => { });
  }, [activeProfile?.id]);

  const activePrefs = state.lookingForJam;
  const prefChoices = JAM_PREFERENCES;

  const togglePreference = (pref: string) => {
    runFilterTransition(() => {
      setState((prev) => {
        const key = prev.mode === 'jam' ? 'lookingForJam' : 'lookingForGigs';
        const current = prev[key];
        const next = current.includes(pref)
          ? current.filter((item) => item !== pref)
          : [...current, pref];
        return { ...prev, [key]: next };
      });
    });
  };

  const handleSelectPlayerType = (nextValue: string) => {
    if (nextValue === '__multi__') return;
    runFilterTransition(() => {
      setState((prev) => ({
        ...prev,
        [prev.mode === 'jam' ? 'lookingForJam' : 'lookingForGigs']: nextValue
          ? [nextValue]
          : [],
      }));
    });
    if (activeProfileId || (activeTab !== 'discover' && activeTab !== 'browse')) {
      stopCardPreview();
      setActiveProfileId(null);
      setActiveTab('discover');
      setDiscoverStage('swipe');
    }
  };

  const mobilePlayerSelectValue =
    activePrefs.length === 0 ? '' : activePrefs.length === 1 ? activePrefs[0] : '__multi__';

  const handleSelectChipFilter = (filter: string) => {
    runFilterTransition(() => {
      setChipFilter(filter);
    });
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
    setRegionModalOpen(false);
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

  const rolePool = useMemo(() => {
    if (discoveryRole === 'session') {
      return sidePool.filter((l) => Boolean(l.offersSession));
    }
    if (discoveryRole === 'teacher') {
      return sidePool.filter((l) => Boolean(l.offersLessons));
    }
    return sidePool;
  }, [sidePool, discoveryRole]);

  const localUnfiltered = useMemo(
    () =>
      rolePool
        .filter((l) => l.regionId === state.regionId)
        .sort((a, b) => {
          const aHasVideo = a.clips.some((c) => c.kind === 'video' && Boolean(c.embedUrl));
          const bHasVideo = b.clips.some((c) => c.kind === 'video' && Boolean(c.embedUrl));
          if (aHasVideo !== bHasVideo) return aHasVideo ? -1 : 1;
          return b.createdAt - a.createdAt;
        }),
    [rolePool, state.regionId]
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

    return rolePool
      .filter((l) => l.regionId !== state.regionId)
      .sort((a, b) => {
        const distA = getDist(a.regionId);
        const distB = getDist(b.regionId);
        if (distA !== null && distB !== null && distA !== distB) return distA - distB;
        if (distA !== null && distB === null) return -1;
        if (distA === null && distB !== null) return 1;
        return b.createdAt - a.createdAt;
      });
  }, [rolePool, state.regionId, currentRegion, regionById]);

  const availableFilters = useMemo(() => {
    const modeListings =
      localUnfiltered.length === 0 || state.includeNearbyRegions || state.includeRemoteFriendly
        ? rolePool
        : localUnfiltered;
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
  }, [localUnfiltered, rolePool, state.includeNearbyRegions, state.includeRemoteFriendly]);

  useEffect(() => {
    if (!availableFilters.includes(chipFilter)) {
      setChipFilter('All');
    }
  }, [availableFilters, chipFilter]);

  const clearAllFilters = () => {
    setSearchQuery('');
    runFilterTransition(() => {
      setChipFilter('All');
      setState((prev) => ({
        ...prev,
        [prev.mode === 'jam' ? 'lookingForJam' : 'lookingForGigs']: [],
      }));
    });
  };

  const { localFiltered, otherFiltered, remoteOtherFiltered, showingNearestFallback } = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const matchesCurrentFilters = (item: Listing) => {
      if (!matchesPreferences(item, activePrefs)) return false;
      if (chipFilter !== 'All' && !item.genres.includes(chipFilter) && !item.tags.includes(chipFilter)) {
        return false;
      }
      if (!q) return true;
      const gearText = item.gearLocker.map((g) => `${g.name} ${g.notes ?? ''}`).join(' ');
      return `${item.title} ${item.subtitle} ${item.neighborhood} ${item.roleCategory} ${item.genres.join(' ')} ${item.tags.join(' ')} ${item.seekingOrOffer} ${item.serviceNote ?? ''} ${gearText}`
        .toLowerCase()
        .includes(q);
    };
    const nextLocal = localUnfiltered.filter(matchesCurrentFilters);
    const nextOther = otherUnfiltered.filter(matchesCurrentFilters);
    const nextRemoteOther = nextOther.filter((item) => Boolean(item.remoteFriendly));
    const useRemoteOnly = state.includeRemoteFriendly && nextLocal.length === 0 && nextRemoteOther.length > 0;
    return {
      localFiltered: nextLocal,
      otherFiltered: nextOther,
      remoteOtherFiltered: nextRemoteOther,
      showingNearestFallback: !useRemoteOnly && nextLocal.length === 0 && nextOther.length > 0,
    };
  }, [localUnfiltered, otherUnfiltered, activePrefs, chipFilter, searchQuery, state.includeRemoteFriendly]);

  const regionalPool = useMemo(() => {
    if (localFiltered.length > 0) {
      if (state.includeRemoteFriendly) {
        return [...localFiltered, ...remoteOtherFiltered];
      }
      return state.includeNearbyRegions ? [...localFiltered, ...otherFiltered] : localFiltered;
    }
    if (state.includeRemoteFriendly && remoteOtherFiltered.length > 0) {
      return remoteOtherFiltered;
    }
    if (showingNearestFallback) return otherFiltered;
    return localFiltered;
  }, [
    showingNearestFallback,
    state.includeNearbyRegions,
    state.includeRemoteFriendly,
    localFiltered,
    otherFiltered,
    remoteOtherFiltered,
  ]);

  const { deckCards, showingDeckNearestFallback } = useMemo(() => {
    const isSwipeable = (l: Listing) => (!user || l.ownerUid !== user.uid) && !state.swiped[l.id];
    const eligibleLocal = localFiltered.filter(isSwipeable);
    const eligibleOther = otherFiltered.filter(isSwipeable);
    const eligibleRemoteOther = remoteOtherFiltered.filter(isSwipeable);
    const localOnlySelf =
      !showingNearestFallback &&
      eligibleLocal.length === 0 &&
      eligibleOther.length > 0 &&
      localFiltered.every((l) => user && l.ownerUid === user.uid);
    const useRemoteOnly =
      state.includeRemoteFriendly && eligibleLocal.length === 0 && eligibleRemoteOther.length > 0;
    const useNearestDeck = !useRemoteOnly && (showingNearestFallback || localOnlySelf);

    return {
      deckCards: useRemoteOnly
        ? eligibleRemoteOther
        : useNearestDeck
          ? eligibleOther
          : state.includeRemoteFriendly
            ? [...eligibleLocal, ...eligibleRemoteOther]
            : state.includeNearbyRegions
              ? [...eligibleLocal, ...eligibleOther]
              : eligibleLocal,
      showingDeckNearestFallback: useNearestDeck,
    };
  }, [
    localFiltered,
    otherFiltered,
    remoteOtherFiltered,
    showingNearestFallback,
    state.includeNearbyRegions,
    state.includeRemoteFriendly,
    state.swiped,
    user,
  ]);

  const orderedDeckCards = useMemo(() => {
    if (!focusedDeckId) return deckCards;
    const idx = deckCards.findIndex((item) => item.id === focusedDeckId);
    if (idx <= 0) return deckCards;
    return [deckCards[idx], ...deckCards.slice(0, idx), ...deckCards.slice(idx + 1)];
  }, [deckCards, focusedDeckId]);

  const handleTabChange = (nextTab: NavTab) => {
    stopCardPreview();
    setActiveProfileId(null);
    setActiveTab(nextTab);
    if (nextTab === 'discover') {
      setDiscoverStage('carousel');
    }
    if (nextTab !== 'matches') {
      setSelectedThreadId(null);
    }
  };

  const handleSelectDiscoveryRole = (role: DiscoveryRole, openInBrowse = true) => {
    stopCardPreview();
    setActiveProfileId(null);
    setSelectedThreadId(null);
    runFilterTransition(() => {
      setDiscoveryRole(role);
      if (openInBrowse) {
        setActiveTab('browse');
      }
    });
  };

  const toggleRemoteFriendly = () => {
    runFilterTransition(() => {
      setState((prev) => ({
        ...prev,
        includeRemoteFriendly: !prev.includeRemoteFriendly,
      }));
    });
  };

  const handleSelectCarouselListing = (listing: Listing) => {
    stopCardPreview();
    if (state.swiped[listing.id]) {
      setState((prev) => {
        if (!prev.swiped[listing.id]) return prev;
        const nextSwiped = { ...prev.swiped };
        delete nextSwiped[listing.id];
        return { ...prev, swiped: nextSwiped };
      });
    }
    setFocusedDeckId(listing.id);
    setDiscoverStage('swipe');
  };

  const handleStartSwipe = () => {
    stopCardPreview();
    setFocusedDeckId(null);
    setDiscoverStage('swipe');
  };

  const handleOpenProfile = (listing: Listing) => {
    stopCardPreview();
    setDetailListing(null);
    setActiveProfileId(listing.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSwipe = (listing: Listing, decision: SwipeDecision) => {
    stopCardPreview();
    setFocusedDeckId(null);

    if (decision === 'like') {
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

      return {
        ...prev,
        swiped: nextSwiped,
        history: prev.history.filter((_, i) => i !== targetIndex),
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

  const handleOpenInvites = (threadId?: string, folder?: InboxFolder) => {
    stopCardPreview();
    setActiveProfileId(null);
    setDetailListing(null);
    setActiveTab('matches');
    if (threadId) {
      setInboxFolder('inbox');
      setSelectedThreadId(threadId);
      if (user && !visibleThreads.some((t) => t.id === threadId)) {
        const acceptedInvite = visibleInvites.find(
          (inv) => inv.threadId === threadId && inv.status === 'accepted'
        );
        if (acceptedInvite) {
          void ensureThreadForAcceptedInvite(acceptedInvite, user);
        }
      }
    } else if (folder) {
      setInboxFolder(folder);
      setSelectedThreadId(null);
    } else {
      setInboxFolder(incomingPendingCount > 0 && effectiveThreads.length === 0 ? 'requests' : 'inbox');
      setSelectedThreadId(null);
    }
  };

  const handleSelectInboxThread = (threadId: string | null) => {
    setSelectedThreadId(threadId);
    if (threadId && user && !visibleThreads.some((t) => t.id === threadId)) {
      const acceptedInvite = visibleInvites.find(
        (inv) => inv.threadId === threadId && inv.status === 'accepted'
      );
      if (acceptedInvite) {
        void ensureThreadForAcceptedInvite(acceptedInvite, user);
      }
    }
  };

  const handleRequestInvite = (listing: Listing) => {
    if (!listing.ownerUid) {
      showToast('This profile is not accepting Jam invites right now.');
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
      handleOpenInvites(existing.threadId, 'inbox');
      return;
    }
    if (existing?.status === 'pending') {
      handleOpenInvites(undefined, existing.toUid === user.uid ? 'requests' : 'sent');
      return;
    }
    setDetailListing(null);
    setInviteTarget(listing);
  };

  const handleSubmitInvite = async (listing: Listing, note: string) => {
    if (!user) return;
    const existingInvite = listing.ownerUid ? inviteByTargetUid[listing.ownerUid] : undefined;
    const outcome = await sendJamInvite({
      fromUser: user,
      targetListing: listing,
      note,
      existingInvite,
    });
    if (outcome === 'already-accepted') {
      showToast(`You are already matched with ${listing.title} — opening Messages.`);
      handleOpenInvites(existingInvite?.threadId, 'inbox');
    } else if (outcome === 'incoming-pending') {
      showToast(`${listing.title} already sent you a jam request — check Requests!`);
      handleOpenInvites(undefined, 'requests');
    } else if (outcome === 'already-pending') {
      showToast(`Jam invite already pending for ${listing.title}.`);
    } else {
      showToast(`Sent jam request to ${listing.title}. Track it in Messages.`);
    }
  };

  const handleRespondInvite = async (
    invite: JamInvite,
    decision: 'accepted' | 'declined'
  ) => {
    if (!user) return;
    const existingThread = visibleThreads.find((t) => t.id === invite.threadId);
    const openedThread = await respondToJamInvite({
      invite,
      responderUser: user,
      decision,
      existingThread,
    });
    if (decision === 'accepted' && openedThread) {
      setThreads((prev) => [openedThread, ...prev.filter((t) => t.id !== openedThread.id)]);
      setInboxFolder('inbox');
      setSelectedThreadId(openedThread.id);
      showToast(`Matched with ${invite.fromName}! You can now message directly.`);
    } else {
      showToast(`Declined request from ${invite.fromName}.`);
    }
  };

  const handleCancelInvite = async (inviteId: string) => {
    await cancelJamInvite(inviteId);
    showToast('Cancelled sent request.');
  };

  const handleSendMessage = async (threadId: string, text: string) => {
    if (!user) {
      setAuthReason('Sign in with Google or Apple to send messages.');
      setAuthModalOpen(true);
      return;
    }
    const acceptedInvite = visibleInvites.find(
      (inv) => inv.threadId === threadId && inv.status === 'accepted'
    );
    try {
      await sendThreadMessage({ threadId, user, text, acceptedInvite });
    } catch (err) {
      console.error('[AreaJam] sendThreadMessage failed:', err);
      showToast('Could not send message. Please try again.');
      throw err;
    }
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
    await addProfileWallNote(listingId, author, text);
    showToast('Posted public note to Firestore scene wall.');
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

  const handleExportUserData = () => {
    if (!user) return;
    const payload = {
      exportedAt: new Date().toISOString(),
      account: {
        uid: user.uid,
        displayName: user.displayName,
        email: user.email,
        provider: user.provider,
      },
      publishedProfiles: ownedUserListings,
      jamInvites: invites,
      threads,
      blockedUsers: blocks,
      localPreferences: {
        regionId: state.regionId,
        includeNearbyRegions: state.includeNearbyRegions,
        locationConsent: state.locationConsent,
        detectedCityLabel: state.detectedCityLabel,
        customRegions: state.customRegions,
      },
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'areajam-account-data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    showToast('Downloaded areajam-account-data.json.');
  };

  const handleConfirmDeleteAccount = async () => {
    if (!user) return;
    const targetUid = user.uid;
    const targetProvider = user.provider;
    const isDemo = Boolean(user.isDemoPreview);

    if (!isDemo) {
      await ensureRecentAuthIfNeeded(targetProvider);
      await deleteAccountFirestoreData(targetUid);
    }

    await deleteCurrentAuthUser(targetProvider);
    clearStoredUserState(targetUid);
    setRemoteProfiles((prev) => prev.filter((item) => item.ownerUid !== targetUid));
    setInvites([]);
    setThreads([]);
    setBlocks([]);
    setSelectedThreadId(null);
    setActiveProfileId(null);
    setDeleteAccountOpen(false);
    setScopedState({ scopeUid: null, data: { ...loadState(null), mode: 'jam' } });
    showToast('Your account and published profiles have been permanently deleted.');
  };

  const handleShareProfileUrl = () => {
    const copiedToast = 'Copied live profile share link.';
    if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(window.location.href).then(
        () => showToast(copiedToast),
        () => showToast('Share the URL in your browser bar.')
      );
    } else {
      showToast('Share the URL in your browser bar.');
    }
  };

  const isDiscoverViewportLock =
    !activeProfile &&
    !(activeProfileId && (deepLinkLoading || resolvedProfileId !== activeProfileId)) &&
    activeTab === 'discover';
  const isMobileSwipeLock = isDiscoverViewportLock && discoverStage === 'swipe';

  return (
    <div
      className={`relative flex flex-col overflow-x-clip ${
        isMobileSwipeLock
          ? 'h-dvh overflow-hidden md:h-auto md:min-h-dvh md:overflow-visible'
          : 'min-h-dvh'
      } ${
        isDiscoverViewportLock
          ? 'pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] md:pb-0'
          : 'pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] md:pb-12'
      }`}
    >
      <InstrumentIconSprite />

      {/* Architectural pink/gigs acoustic contour lines */}
      <BrandContourBackdrop mode={state.mode} />

      {/* Full-width edge-to-edge sticky header */}
      <header className="safe-top sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
        <div className="toolbar mx-auto flex w-full max-w-[1440px] flex-nowrap items-center justify-between gap-1.5 px-2.5 pb-2 md:gap-2 md:px-4 md:pb-2.5 lg:px-6 xl:px-10">
          <div className="flex shrink-0 items-center gap-2 md:gap-2.5 lg:gap-4">
            <button
              type="button"
              onClick={() => handleTabChange('discover')}
              aria-label="AreaJam home"
              className="flex shrink-0 items-center justify-center gap-2 text-left sm:gap-2.5"
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] p-1 shadow-sm lg:hidden">
                <AreaJamMark className="h-full w-full" />
              </span>

              <span className="hidden items-center lg:inline-flex">
                <AreaJamLogo className="h-9 w-[150px] shrink-0 text-[var(--ink)]" />
              </span>
            </button>

            <nav aria-label="Primary" className="hidden shrink-0 items-center gap-0.5 md:flex lg:gap-1">
              {(
                [
                  { kind: 'role', role: 'musician' as DiscoveryRole, compactLabel: 'Musicians', label: 'Find a Musician' },
                  { kind: 'role', role: 'session' as DiscoveryRole, compactLabel: 'Sessions', label: 'Find a Session Player' },
                  { kind: 'role', role: 'teacher' as DiscoveryRole, compactLabel: 'Teachers', label: 'Find a Teacher' },
                  { kind: 'tab', id: 'matches' as NavTab, compactLabel: 'Messages', label: 'Messages' },
                  { kind: 'tab', id: 'post' as NavTab, compactLabel: 'Studio', label: 'Profile & studio' },
                ] as const
              ).map((item) => {
                const isRoleActive =
                  item.kind === 'role' &&
                  !activeProfileId &&
                  (activeTab === 'browse' || (activeTab === 'discover' && discoverStage === 'swipe')) &&
                  discoveryRole === item.role;
                const isTabActive =
                  item.kind === 'tab' && !activeProfileId && activeTab === item.id;
                const isActive = isRoleActive || isTabActive;
                const msgCount =
                  item.kind === 'tab' && item.id === 'matches'
                    ? incomingPendingCount > 0
                      ? incomingPendingCount
                      : effectiveThreads.length
                    : 0;
                const msgHasRequests = item.kind === 'tab' && item.id === 'matches' && incomingPendingCount > 0;
                const key = item.kind === 'role' ? `role-${item.role}` : item.id;

                return (
                  <button
                    key={key}
                    type="button"
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() =>
                      item.kind === 'role'
                        ? handleSelectDiscoveryRole(item.role, true)
                        : handleTabChange(item.id)
                    }
                    className="nav-pill-btn inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)] lg:px-3 lg:py-2"
                  >
                    <span className="xl:hidden">{item.compactLabel}</span>
                    <span className="hidden xl:inline">{item.label}</span>
                    {msgCount > 0 && (
                      <span
                        className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none"
                        style={
                          msgHasRequests
                            ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                            : { backgroundColor: 'var(--surface-hover)', color: 'var(--ink)' }
                        }
                      >
                        {msgCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Mobile single integrated Location + Player Type selector */}
          <div className="flex min-w-0 flex-1 max-w-[21rem] items-center overflow-hidden rounded-full border border-[var(--border)] bg-[var(--pill-bg)] shadow-xs md:hidden">
            <button
              type="button"
              onClick={() => setRegionModalOpen(true)}
              aria-label={`Change local region, currently ${currentRegion.label}`}
              className="flex min-w-0 flex-[0.95_1_0%] items-center justify-center gap-1 rounded-l-full px-2 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)] sm:px-2.5"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
              <span className="min-w-0 truncate">{currentRegion.city}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            </button>

            <span aria-hidden="true" className="h-4 w-px shrink-0 bg-[var(--border-strong)]" />

            <div className="relative flex min-w-0 flex-[1.05_1_0%] items-center">
              <label htmlFor="mobile-player-type" className="visually-hidden">
                Filter by player type
              </label>
              <select
                id="mobile-player-type"
                name="player-type"
                value={mobilePlayerSelectValue}
                data-active={activePrefs.length > 0 ? 'true' : undefined}
                onChange={(e) => handleSelectPlayerType(e.target.value)}
                className="header-role-select"
              >
                <option value="">All players</option>
                {activePrefs.length > 1 && (
                  <option value="__multi__">{activePrefs.length} types</option>
                )}
                {prefChoices.map((pref) => (
                  <option key={pref} value={pref}>
                    {pref}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="header-role-fallback-icon pointer-events-none absolute right-2 h-3 w-3 text-[var(--muted)]"
                aria-hidden="true"
              />
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1.5 lg:gap-2">
            <button
              type="button"
              onClick={() => setRegionModalOpen(true)}
              aria-label={`Change local region, currently ${currentRegion.label}`}
              className="hidden shrink-0 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)] md:inline-flex lg:gap-1.5 lg:px-3"
            >
              <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
              <span className="max-w-[6.75rem] truncate lg:max-w-none">
                {currentRegion.city}
                <span className="hidden xl:inline">
                  {currentRegion.areaCode !== 'LOC' ? `, ${currentRegion.areaCode}` : ''}
                </span>
              </span>
              <ChevronDown className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            </button>

            <button
              type="button"
              onClick={handleToggleColorScheme}
              title="Switch light or dark theme"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--ink)] transition hover:bg-[var(--surface-hover)] lg:h-10 lg:w-10"
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
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)] lg:h-10 lg:w-10"
            >
              <HelpCircle className="h-4 w-4" aria-hidden="true" />
            </button>

            {user ? (
              <button
                type="button"
                onClick={() => handleTabChange('post')}
                aria-label="Open your profile and studio"
                className="hidden shrink-0 items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)] md:inline-flex lg:px-3"
              >
                <UserCheck className="h-3.5 w-3.5 text-[var(--ok)]" aria-hidden="true" />
                <span className="max-w-[5.5rem] truncate lg:max-w-[7rem]">{user.displayName}</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => openAuthPrompt()}
                className="hidden shrink-0 whitespace-nowrap rounded-full bg-[var(--ink)] px-3 py-1.5 text-xs font-bold text-[var(--bg)] transition hover:opacity-90 md:inline-flex lg:px-3.5"
              >
                Sign in
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Opt-in IP Geolocation consent bar (desktop/tablet only; mobile uses RegionDialog) */}
      {!activeProfileId && state.locationConsent === 'unknown' && (
        <div className="relative z-10 hidden border-b border-[var(--border)] bg-[var(--surface-subtle)] md:block">
          <div className="mx-auto flex w-full max-w-[1440px] flex-nowrap items-center justify-between gap-2 px-3 py-1 text-xs md:gap-3 md:px-6 md:py-1.5 xl:px-10">
            <div className="flex min-w-0 items-center gap-1.5 text-[var(--ink)] md:gap-2">
              <Navigation className="h-3.5 w-3.5 shrink-0 text-[var(--accent-text)] md:h-4 md:w-4" aria-hidden="true" />
              <span className="hidden sm:inline">
                Use your IP address to jump to musicians near your city automatically?
              </span>
              <span className="truncate sm:hidden">Detect city?</span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 md:gap-2">
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

      {/* Discover Carousel Landing vs Main Workspace */}
      {isDiscoverViewportLock && discoverStage === 'carousel' ? (
        <main className="relative z-10 flex w-full flex-1 flex-col">
          <PanoramicHero
            listings={regionalPool}
            region={currentRegion}
            detectedCityLabel={state.detectedCityLabel}
            totalCount={regionalPool.length}
            onPickRegion={() => setRegionModalOpen(true)}
            onSelectListing={handleSelectCarouselListing}
            onStartSwipe={handleStartSwipe}
            onBrowseAll={() => handleTabChange('browse')}
            onGoToPost={() => handleTabChange('post')}
          />
        </main>
      ) : (
        <main
          className={`relative z-10 mx-auto w-full max-w-[1440px] flex-1 px-2.5 pt-1.5 md:px-6 md:pt-4 xl:px-10 ${
            isMobileSwipeLock ? 'flex min-h-0 flex-col md:block' : ''
          }`}
        >
        {activeProfile ? (
          <ProfilePage
            key={activeProfile.id}
            listing={activeProfile}
            region={allRegions.find((r) => r.id === activeProfile.regionId)}
            selectedRegion={currentRegion}
            allListings={allListings}
            allRegions={allRegions}
            user={user}
            inviteByTargetUid={inviteByTargetUid}
            soundEnabled={soundEnabled}
            wallComments={liveWallNotes}
            onToggleSound={() => setSoundEnabled((s) => !s)}
            onBack={() => setActiveProfileId(null)}
            onInvite={handleRequestInvite}
            onOpenInvites={handleOpenInvites}
            onSafetyAction={handleSafetyAction}
            onOpenProfile={handleOpenProfile}
            onUpdateListing={handleUpdateUserListing}
            onAddWallComment={handleAddWallComment}
            onDeleteWallComment={handleDeleteWallComment}
            onShareUrl={handleShareProfileUrl}
          />
        ) : activeProfileId && (deepLinkLoading || resolvedProfileId !== activeProfileId) ? (
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
        ) : (
          <>
            {activeTab === 'discover' && (
              <div className="flex min-h-0 flex-1 flex-col md:grid md:grid-cols-12 md:items-start md:gap-6 lg:gap-10">
                {/* Mobile Discovery Role & Remote Strip */}
                <div className="mb-2 flex shrink-0 items-center justify-between gap-1.5 md:hidden">
                  <div
                    role="group"
                    aria-label="Discovery category"
                    className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] p-0.5"
                  >
                    {(
                      [
                        { role: 'musician' as DiscoveryRole, label: 'Musicians' },
                        { role: 'session' as DiscoveryRole, label: 'Session' },
                        { role: 'teacher' as DiscoveryRole, label: 'Teachers' },
                      ] as const
                    ).map((opt) => {
                      const active = discoveryRole === opt.role;
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleSelectDiscoveryRole(opt.role, false)}
                          className="flex-1 truncate rounded-full px-2 py-1 text-[11px] font-bold transition"
                          style={
                            active
                              ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                              : { color: 'var(--muted)' }
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    aria-pressed={state.includeRemoteFriendly}
                    onClick={toggleRemoteFriendly}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1.5 text-[11px] font-semibold transition"
                    style={
                      state.includeRemoteFriendly
                        ? {
                            backgroundColor: 'var(--jam-soft)',
                            borderColor: 'var(--jam)',
                            color: 'var(--jam-text)',
                          }
                        : {
                            backgroundColor: 'var(--pill-bg)',
                            borderColor: 'var(--border)',
                            color: 'var(--muted)',
                          }
                    }
                  >
                    <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                    <span>Remote</span>
                  </button>
                </div>

                {/* Desktop & Tablet Left Column: Original Hero + Unified Filter Grid + CTAs */}
                <div className="hidden space-y-5 md:col-span-6 md:block lg:col-span-7">
                  <div className="space-y-2.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                        {currentRegion.label}
                        {state.detectedCityLabel ? ` (near ${state.detectedCityLabel})` : ''}
                      </span>

                      <button
                        type="button"
                        onClick={() => setDiscoverStage('carousel')}
                        className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--accent-text)] transition hover:bg-[var(--surface-hover)]"
                      >
                        Back to carousel
                      </button>
                    </div>

                    <h1 className="hero-title font-bold text-[var(--ink)]">
                      Find your tribe. Match with musicians today.
                    </h1>

                    <p className="max-w-xl text-sm leading-relaxed text-[var(--muted)]">
                      Hear linked Instagram Reels, YouTube clips, and SoundCloud tracks right on the card. Spot instruments fast, send a jam invite, and message in your inbox once they accept.
                    </p>
                  </div>

                  <div className="glass-surface space-y-3 rounded-3xl p-4 lg:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h2 className="font-display text-sm font-bold">
                        Filter by instrument or search local players
                      </h2>
                      {(activePrefs.length > 0 || chipFilter !== 'All' || searchQuery.trim().length > 0) && (
                        <button
                          type="button"
                          onClick={clearAllFilters}
                          className="text-xs font-semibold text-[var(--accent-text)] hover:underline"
                        >
                          Clear filters
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-2 lg:grid-cols-[minmax(0,1fr)_12rem]">
                      <div className="relative min-w-0">
                        <label htmlFor="discover-search" className="visually-hidden">
                          Search players, gear, genres, or neighborhoods
                        </label>
                        <Search
                          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                          aria-hidden="true"
                        />
                        <input
                          id="discover-search"
                          type="search"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search name, gear, genre..."
                          className="field-control w-full py-2 pl-10 text-xs"
                        />
                      </div>

                      <div>
                        <label htmlFor="discover-genre" className="visually-hidden">
                          Filter by genre
                        </label>
                        <select
                          id="discover-genre"
                          aria-label="Filter by genre"
                          value={chipFilter}
                          onChange={(e) => handleSelectChipFilter(e.target.value)}
                          className="field-control w-full py-2 text-xs font-semibold"
                        >
                          <option value="All">All genres</option>
                          {availableFilters
                            .filter((f) => f !== 'All')
                            .map((genre) => (
                              <option key={genre} value={genre}>
                                {genre}
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
                      {prefChoices.map((pref) => {
                        const selected = activePrefs.includes(pref);
                        return (
                          <button
                            key={pref}
                            type="button"
                            aria-pressed={selected}
                            onClick={() => togglePreference(pref)}
                            className="filter-chip-btn inline-flex w-full items-center justify-center whitespace-nowrap rounded-xl border px-2 py-2 text-center text-xs font-semibold"
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
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <button
                        type="button"
                        aria-pressed={state.includeRemoteFriendly}
                        onClick={toggleRemoteFriendly}
                        className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
                        style={
                          state.includeRemoteFriendly
                            ? {
                                backgroundColor: 'var(--jam-soft)',
                                borderColor: 'var(--jam)',
                                color: 'var(--jam-text)',
                              }
                            : {
                                backgroundColor: 'var(--pill-bg)',
                                borderColor: 'var(--border)',
                                color: 'var(--muted)',
                              }
                        }
                      >
                        <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span>Include remote-friendly (after locals)</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleTabChange('browse')}
                      className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                    >
                      <LayoutGrid className="h-4 w-4" aria-hidden="true" />
                      <span>Browse all ({regionalPool.length})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTabChange('post')}
                      className="inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-bold transition hover:opacity-90"
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

                {/* Right Column: Live 9:16 SwipeDeck stage */}
                <div className="flex min-h-0 flex-1 flex-col md:col-span-6 md:block lg:col-span-5">
                  <SwipeDeck
                    cards={orderedDeckCards}
                    mode={state.mode}
                    discoveryRole={discoveryRole}
                    region={currentRegion}
                    allRegions={allRegions}
                    canUndo={canUndo}
                    includeNearbyRegions={state.includeNearbyRegions}
                    includeRemoteFriendly={state.includeRemoteFriendly}
                    showingNearestFallback={showingDeckNearestFallback}
                    filterKey={`${discoveryRole}::${state.includeRemoteFriendly ? 'remote' : 'local'}::${activePrefs.join('|')}::${chipFilter}`}
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
                    onToggleRemoteFriendly={toggleRemoteFriendly}
                    onResetPassed={handleResetPassed}
                    onGoToPost={() => handleTabChange('post')}
                  />
                </div>
              </div>
            )}

            {activeTab === 'browse' && (
              <div className="space-y-4">
                {/* Mobile Discovery Role & Remote Strip */}
                <div className="flex items-center justify-between gap-1.5 md:hidden">
                  <div
                    role="group"
                    aria-label="Discovery category"
                    className="flex min-w-0 flex-1 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] p-0.5"
                  >
                    {(
                      [
                        { role: 'musician' as DiscoveryRole, label: 'Musicians' },
                        { role: 'session' as DiscoveryRole, label: 'Session' },
                        { role: 'teacher' as DiscoveryRole, label: 'Teachers' },
                      ] as const
                    ).map((opt) => {
                      const active = discoveryRole === opt.role;
                      return (
                        <button
                          key={opt.role}
                          type="button"
                          aria-pressed={active}
                          onClick={() => handleSelectDiscoveryRole(opt.role, true)}
                          className="flex-1 truncate rounded-full px-2 py-1.5 text-xs font-bold transition"
                          style={
                            active
                              ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                              : { color: 'var(--muted)' }
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    aria-pressed={state.includeRemoteFriendly}
                    onClick={toggleRemoteFriendly}
                    className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-2 text-xs font-semibold transition"
                    style={
                      state.includeRemoteFriendly
                        ? {
                            backgroundColor: 'var(--jam-soft)',
                            borderColor: 'var(--jam)',
                            color: 'var(--jam-text)',
                          }
                        : {
                            backgroundColor: 'var(--pill-bg)',
                            borderColor: 'var(--border)',
                            color: 'var(--muted)',
                          }
                    }
                  >
                    <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span>Remote</span>
                  </button>
                </div>

                <div
                  role="region"
                  aria-label={
                    state.mode === 'jam'
                      ? 'Filter by players you want to match with'
                      : 'Filter by gig or band type'
                  }
                  className="glass-surface hidden rounded-2xl px-3 py-2 md:flex md:flex-wrap md:items-center md:justify-between md:gap-2"
                >
                  <div
                    role="group"
                    aria-label={state.mode === 'jam' ? 'Player type' : 'Gig or band type'}
                    className="flex flex-wrap items-center gap-1.5"
                  >
                    {prefChoices.map((pref) => {
                      const selected = activePrefs.includes(pref);
                      return (
                        <button
                          key={pref}
                          type="button"
                          aria-pressed={selected}
                          onClick={() => togglePreference(pref)}
                          className="filter-chip-btn inline-flex min-h-7 items-center justify-center whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-none [@media(pointer:coarse)]:min-h-11"
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

                  <div className="flex shrink-0 flex-wrap items-center gap-2">
                    <button
                      type="button"
                      aria-pressed={state.includeRemoteFriendly}
                      onClick={toggleRemoteFriendly}
                      title="Include remote-friendly players from other cities after local results"
                      className="inline-flex min-h-7 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-semibold leading-none transition [@media(pointer:coarse)]:min-h-11"
                      style={
                        state.includeRemoteFriendly
                          ? {
                              backgroundColor: 'var(--jam-soft)',
                              borderColor: 'var(--jam)',
                              color: 'var(--jam-text)',
                            }
                          : {
                              backgroundColor: 'var(--pill-bg)',
                              borderColor: 'var(--border)',
                              color: 'var(--muted)',
                            }
                      }
                    >
                      <Globe className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      <span>Include remote-friendly</span>
                    </button>

                    <div>
                      <label htmlFor="browse-genre" className="visually-hidden">
                        Filter by genre
                      </label>
                      <select
                        id="browse-genre"
                        aria-label="Filter by genre"
                        value={chipFilter}
                        onChange={(e) => handleSelectChipFilter(e.target.value)}
                        className="field-control min-h-7 w-36 rounded-full px-3 py-1 text-xs font-semibold leading-tight [@media(pointer:coarse)]:min-h-11"
                      >
                        <option value="All">All genres</option>
                        {availableFilters
                          .filter((f) => f !== 'All')
                          .map((genre) => (
                            <option key={genre} value={genre}>
                              {genre}
                            </option>
                          ))}
                      </select>
                    </div>
                    {(activePrefs.length > 0 || chipFilter !== 'All' || searchQuery.trim().length > 0) && (
                      <button
                        type="button"
                        aria-label="Clear all filters"
                        onClick={clearAllFilters}
                        className="inline-flex min-h-7 items-center whitespace-nowrap px-1.5 text-xs font-semibold text-[var(--accent-text)] hover:underline [@media(pointer:coarse)]:min-h-11"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                <BrowseGrid
                  listings={regionalPool}
                  mode={state.mode}
                  discoveryRole={discoveryRole}
                  includeRemoteFriendly={state.includeRemoteFriendly}
                  onToggleRemoteFriendly={toggleRemoteFriendly}
                  region={currentRegion}
                  allRegions={allRegions}
                  swiped={state.swiped}
                  showingNearestFallback={showingNearestFallback}
                  currentUserUid={user?.uid}
                  inviteByTargetUid={inviteByTargetUid}
                  searchQuery={searchQuery}
                  onSearchQueryChange={setSearchQuery}
                  onInspect={setDetailListing}
                  onOpenProfile={handleOpenProfile}
                  onSwipe={handleSwipe}
                  onInvite={handleRequestInvite}
                  onOpenInvites={handleOpenInvites}
                  onWatchInReels={() => {
                    stopCardPreview();
                    setActiveProfileId(null);
                    setActiveTab('discover');
                    setDiscoverStage('swipe');
                  }}
                  onGoToPost={() => handleTabChange('post')}
                />
              </div>
            )}

            {activeTab === 'matches' && (
              <MatchesView
                user={user}
                invites={visibleInvites}
                threads={effectiveThreads}
                listings={allListings}
                regions={allRegions}
                activeFolder={inboxFolder}
                onSelectFolder={setInboxFolder}
                selectedThreadId={selectedThreadId}
                onSelectThread={handleSelectInboxThread}
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
                onExportData={handleExportUserData}
                onOpenDeleteAccount={() => setDeleteAccountOpen(true)}
              />
            )}
          </>
        )}
      </main>
      )}

      {/* Custom Mobile Phone 4-Tab Bottom Glass Dock */}
      <nav
        aria-label="Mobile navigation"
        className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-3 md:hidden"
      >
        <div className="glass-dock pointer-events-auto grid w-full max-w-md grid-cols-4 gap-1 rounded-full p-1.5">
          <button
            type="button"
            aria-current={!activeProfileId && activeTab === 'discover' ? 'page' : undefined}
            onClick={() => {
              stopCardPreview();
              setActiveProfileId(null);
              setActiveTab('discover');
              setDiscoverStage('swipe');
            }}
            className="nav-pill-btn flex flex-col items-center justify-center gap-0.5 rounded-full py-1.5 text-[11px] font-semibold text-[var(--muted)]"
          >
            <Flame className="h-4 w-4" aria-hidden="true" />
            <span>Swipe</span>
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
              {(incomingPendingCount > 0 || effectiveThreads.length > 0) && (
                <span
                  className="absolute -right-2.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                  style={
                    incomingPendingCount > 0
                      ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                      : { backgroundColor: 'var(--ink)', color: 'var(--bg)' }
                  }
                >
                  {incomingPendingCount > 0 ? incomingPendingCount : effectiveThreads.length}
                </span>
              )}
            </span>
            <span>Messages</span>
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
        ipDetecting={ipDetecting}
        onDetectLocation={() => void handleAllowIpLocation()}
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

      <DeleteAccountDialog
        open={deleteAccountOpen}
        displayName={user?.displayName}
        profileCount={ownedUserListings.length}
        onClose={() => setDeleteAccountOpen(false)}
        onConfirmDelete={handleConfirmDeleteAccount}
      />
    </div>
  );
}

export default App;
