import { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Compass, Flame, MapPin, MessageCircle, PlusSquare, Ticket } from 'lucide-react';
import { DetailDialog } from './components/DetailDialog';
import { MatchDialog } from './components/MatchDialog';
import { MatchesView } from './components/MatchesView';
import { PostView } from './components/PostView';
import { RegionDialog } from './components/RegionDialog';
import { SwipeDeck } from './components/SwipeDeck';
import { STARTER_REGIONS } from './data/regions';
import { SEED_LISTINGS } from './data/seedListings';
import { stopCardPreview } from './lib/audioPreview';
import { loadState, resetPassedSwipes, saveState, syncUrlRegionAndMode } from './lib/storage';
import type { AppMode, AppState, Listing, NavTab, Region, SwipeDecision } from './types';

export function App() {
  const [state, setState] = useState<AppState>(() => loadState());
  const [activeTab, setActiveTab] = useState<NavTab>('discover');
  const [chipFilter, setChipFilter] = useState<string>('All');
  const [regionModalOpen, setRegionModalOpen] = useState(false);
  const [detailListing, setDetailListing] = useState<Listing | null>(null);
  const [matchPopupListing, setMatchPopupListing] = useState<Listing | null>(null);
  const [selectedMatchId, setSelectedMatchId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const replyTimersRef = useRef<number[]>([]);
  const toastTimerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    saveState(state);
    syncUrlRegionAndMode(state.regionId, state.mode);
    document.documentElement.style.setProperty(
      '--accent',
      state.mode === 'jam' ? 'var(--jam)' : 'var(--gigs)'
    );
  }, [state]);

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
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2600);
  };

  const allRegions = useMemo<Region[]>(
    () => [...STARTER_REGIONS, ...state.customRegions],
    [state.customRegions]
  );

  const currentRegion = useMemo<Region>(
    () => allRegions.find((r) => r.id === state.regionId) ?? allRegions[0],
    [allRegions, state.regionId]
  );

  const allListings = useMemo<Listing[]>(
    () => [...state.userListings, ...SEED_LISTINGS],
    [state.userListings]
  );

  const availableFilters = useMemo(() => {
    const modeListings = allListings.filter(
      (l) =>
        l.side === state.mode &&
        !l.isUserCreated &&
        (state.includeNearbyRegions || l.regionId === state.regionId)
    );
    const counts = new Map<string, number>();
    for (const item of modeListings) {
      if (state.mode === 'gigs' && item.gigSubtype) {
        const label = item.gigSubtype === 'open-gig' ? 'Open slots' : 'Bands for hire';
        counts.set(label, (counts.get(label) ?? 0) + 1);
      }
      for (const genre of item.genres) {
        counts.set(genre, (counts.get(genre) ?? 0) + 1);
      }
    }
    const sorted = Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([name]) => name)
      .slice(0, 7);
    return ['All', ...sorted];
  }, [allListings, state.includeNearbyRegions, state.mode, state.regionId]);

  useEffect(() => {
    if (!availableFilters.includes(chipFilter)) {
      setChipFilter('All');
    }
  }, [availableFilters, chipFilter]);

  const deckCards = useMemo(() => {
    const unswiped = allListings.filter(
      (l) => !l.isUserCreated && l.side === state.mode && !state.swiped[l.id]
    );

    const local = unswiped.filter((l) => l.regionId === state.regionId);
    const nearby = state.includeNearbyRegions
      ? unswiped.filter((l) => l.regionId !== state.regionId)
      : [];

    const combined = [...local, ...nearby];
    if (chipFilter === 'All') return combined;
    if (chipFilter === 'Open slots') return combined.filter((l) => l.gigSubtype === 'open-gig');
    if (chipFilter === 'Bands for hire') {
      return combined.filter((l) => l.gigSubtype === 'band-for-hire');
    }
    return combined.filter((l) => l.genres.includes(chipFilter) || l.tags.includes(chipFilter));
  }, [allListings, chipFilter, state.includeNearbyRegions, state.mode, state.regionId, state.swiped]);

  const handleModeChange = (nextMode: AppMode) => {
    stopCardPreview();
    setState((prev) => ({ ...prev, mode: nextMode }));
    setActiveTab('discover');
    setChipFilter('All');
  };

  const handleTabChange = (nextTab: NavTab) => {
    stopCardPreview();
    setActiveTab(nextTab);
    if (nextTab !== 'matches') {
      setSelectedMatchId(null);
    }
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
      showToast(`Sent interest to ${listing.title} — saved to your likes.`);
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

  const handleSendMessage = (matchId: string, text: string) => {
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
      const timerId = window.setTimeout(() => {
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

  const handleOpenChatFromMatchPopup = (listing: Listing) => {
    const found = state.matches.find((m) => m.listingId === listing.id);
    setMatchPopupListing(null);
    if (found) {
      setSelectedMatchId(found.id);
      setActiveTab('matches');
    }
  };

  const activeSeed = deckCards[0]?.visualSeed ?? 1;
  const secondaryOrbColor =
    activeSeed % 2 === 0 ? 'rgba(99, 102, 241, 0.36)' : 'rgba(56, 189, 248, 0.28)';

  return (
    <div className="relative min-h-dvh pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))]">
      {/* Fixed spatial ambient soundstage lighting */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden="true">
        <div
          className="ambient-orb -top-28 right-[-8rem] h-[24rem] w-[24rem]"
          style={{
            backgroundColor:
              state.mode === 'jam' ? 'rgba(255, 59, 107, 0.36)' : 'rgba(16, 232, 138, 0.3)',
          }}
        />
        <div
          className="ambient-orb bottom-[-6rem] left-[-8rem] h-[22rem] w-[22rem]"
          style={{ backgroundColor: secondaryOrbColor }}
        />
      </div>

      {/* Floating glass header bar */}
      <header className="safe-top sticky top-0 z-20 px-4 pb-2">
        <div className="toolbar glass-dock mx-auto flex max-w-2xl items-center justify-between gap-2 rounded-full px-3 py-2">
          <div className="flex items-center gap-2.5 pl-1">
            <img src="./icon.svg" alt="" className="h-8 w-8 rounded-full shadow-sm" />
            <h1 className="font-display text-base font-bold tracking-tight sm:text-lg">AreaJam</h1>
          </div>

          <button
            type="button"
            onClick={() => setRegionModalOpen(true)}
            aria-label={`Change local region, currently ${currentRegion.label}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-semibold transition hover:bg-white/10"
          >
            <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>
              {currentRegion.city}, {currentRegion.areaCode}
            </span>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
          </button>

          <div
            role="group"
            aria-label="Switch mode between Jam and Gigs"
            className="inline-flex rounded-full border border-white/10 bg-black/35 p-0.5"
          >
            <button
              type="button"
              aria-pressed={state.mode === 'jam'}
              onClick={() => handleModeChange('jam')}
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
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
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition"
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
        </div>
      </header>

      {/* Unified spatial stage */}
      <main className="stage-shell relative z-10 mx-auto max-w-2xl px-4 pt-3">
        {activeTab === 'discover' && (
          <div className="space-y-4">
            <div className="no-scrollbar flex items-center justify-start gap-2 overflow-x-auto pb-1 sm:justify-center">
              {availableFilters.map((filter) => {
                const active = chipFilter === filter;
                return (
                  <button
                    key={filter}
                    type="button"
                    onClick={() => setChipFilter(filter)}
                    className="shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition"
                    style={
                      active
                        ? {
                            backgroundColor: 'var(--ink)',
                            color: 'var(--bg)',
                            borderColor: 'var(--ink)',
                          }
                        : {
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
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
              onSwipe={handleSwipe}
              onUndo={handleUndo}
              onOpenDetails={setDetailListing}
              onEnableNearby={() =>
                setState((prev) => ({ ...prev, includeNearbyRegions: true }))
              }
              onResetPassed={handleResetPassed}
              onGoToPost={() => handleTabChange('post')}
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
            onInspectListing={setDetailListing}
            onBackToDiscover={() => handleTabChange('discover')}
          />
        )}

        {activeTab === 'post' && (
          <PostView
            defaultSide={state.mode}
            region={currentRegion}
            userListings={state.userListings}
            onCreateListing={(listing) => {
              setState((prev) => ({
                ...prev,
                userListings: [listing, ...prev.userListings],
              }));
            }}
            onDeleteListing={(listingId) => {
              setState((prev) => ({
                ...prev,
                userListings: prev.userListings.filter((l) => l.id !== listingId),
              }));
            }}
            onPreviewListing={setDetailListing}
          />
        )}
      </main>

      {/* Floating visionOS/iOS glass bottom navigation dock */}
      <nav
        aria-label="Primary navigation"
        className="safe-bottom pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4"
      >
        <div className="glass-dock pointer-events-auto grid w-full max-w-sm grid-cols-3 gap-1 rounded-full p-1.5">
          <button
            type="button"
            onClick={() => handleTabChange('discover')}
            className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition"
            style={
              activeTab === 'discover'
                ? { backgroundColor: 'rgba(255, 255, 255, 0.14)', color: 'var(--ink)' }
                : { color: 'var(--muted)' }
            }
          >
            <Compass className="h-4 w-4" aria-hidden="true" />
            <span>Discover</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('matches')}
            className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition"
            style={
              activeTab === 'matches'
                ? { backgroundColor: 'rgba(255, 255, 255, 0.14)', color: 'var(--ink)' }
                : { color: 'var(--muted)' }
            }
          >
            <MessageCircle className="h-4 w-4" aria-hidden="true" />
            <span>Matches</span>
            {state.matches.length > 0 && (
              <span
                className="inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                style={{
                  backgroundColor: state.mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                  color: state.mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                }}
              >
                {state.matches.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('post')}
            className="flex items-center justify-center gap-1.5 rounded-full py-2.5 text-xs font-semibold transition"
            style={
              activeTab === 'post'
                ? { backgroundColor: 'rgba(255, 255, 255, 0.14)', color: 'var(--ink)' }
                : { color: 'var(--muted)' }
            }
          >
            <PlusSquare className="h-4 w-4" aria-hidden="true" />
            <span>Post</span>
          </button>
        </div>
      </nav>

      {/* Non-blocking status toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="glass-dock fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full px-4 py-2 text-xs font-semibold text-[var(--ink)]"
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

      <DetailDialog
        listing={detailListing}
        region={detailListing ? allRegions.find((r) => r.id === detailListing.regionId) : undefined}
        alreadyMatched={
          detailListing
            ? state.matches.some((m) => m.listingId === detailListing.id) ||
              Boolean(detailListing.isUserCreated)
            : false
        }
        onClose={() => setDetailListing(null)}
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
