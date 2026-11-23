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
      (l) => l.side === state.mode && !l.isUserCreated && (state.includeNearbyRegions || l.regionId === state.regionId)
    );
    const counts = new Map<string, number>();
    for (const item of modeListings) {
      if (state.mode === 'gigs' && item.gigSubtype) {
        const label = item.gigSubtype === 'open-gig' ? 'Open Slots' : 'Bands for Hire';
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
    if (chipFilter === 'Open Slots') return combined.filter((l) => l.gigSubtype === 'open-gig');
    if (chipFilter === 'Bands for Hire') return combined.filter((l) => l.gigSubtype === 'band-for-hire');
    return combined.filter((l) => l.genres.includes(chipFilter) || l.tags.includes(chipFilter));
  }, [allListings, chipFilter, state.includeNearbyRegions, state.mode, state.regionId, state.swiped]);

  const handleModeChange = (nextMode: AppMode) => {
    setState((prev) => ({ ...prev, mode: nextMode }));
    setActiveTab('discover');
    setChipFilter('All');
  };

  const handleSwipe = (listing: Listing, decision: SwipeDecision) => {
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

  return (
    <div className="min-h-dvh pb-[calc(5.25rem+env(safe-area-inset-bottom,0px))] lg:pb-10">
      {/* Top sticky bar */}
      <header className="safe-top sticky top-0 z-20 border-b border-[var(--border)] bg-[var(--bg)]/90 backdrop-blur-md">
        <div className="toolbar mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 pb-3">
          <div className="flex items-center gap-2.5">
            <img src="./icon.svg" alt="" className="h-9 w-9 rounded-xl shadow-sm" />
            <div>
              <h1 className="font-display text-lg font-extrabold leading-none tracking-tight">
                AreaJam
              </h1>
              <p className="font-mono-code mt-0.5 text-[10px] uppercase tracking-[0.14em] text-[var(--muted)]">
                areajam.com
              </p>
            </div>
          </div>

          {/* Regional board picker */}
          <button
            type="button"
            onClick={() => setRegionModalOpen(true)}
            aria-label={`Change local region, currently ${currentRegion.label}`}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-semibold transition hover:border-[var(--accent)]"
          >
            <MapPin className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            <span>{currentRegion.city}</span>
            <span className="font-mono-code text-[var(--muted)]">({currentRegion.areaCode})</span>
            <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
          </button>

          {/* Two-sided segmented toggle */}
          <div
            role="group"
            aria-label="Switch mode between Jam and Gigs"
            className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface)] p-1"
          >
            <button
              type="button"
              aria-pressed={state.mode === 'jam'}
              onClick={() => handleModeChange('jam')}
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition"
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
              className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider transition"
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

      {/* Main layout */}
      <div className="mx-auto max-w-5xl px-4 pt-4 lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)] lg:items-start lg:gap-8 lg:pt-7">
        {/* Desktop left rail */}
        <aside className="hidden space-y-5 lg:block">
          <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <p className="font-mono-code text-[11px] uppercase tracking-widest text-[var(--muted)]">
              Current Board
            </p>
            <h2 className="font-display mt-1 text-xl font-extrabold">{currentRegion.label}</h2>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              {state.mode === 'jam'
                ? 'Swipe right on local players to jam, write songs, or start a band.'
                : 'Swipe right to pitch open gig slots or book gig-ready local bands.'}
            </p>
            <button
              type="button"
              onClick={() => setRegionModalOpen(true)}
              className="mt-3 w-full rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-3 py-2 text-xs font-semibold transition hover:opacity-85"
            >
              Switch Region / Add City
            </button>
          </div>

          <nav aria-label="Workspace sections" className="flex flex-col gap-1.5">
            {(
              [
                { id: 'discover', label: 'Swipe Deck', icon: Compass },
                { id: 'matches', label: `Matches (${state.matches.length})`, icon: MessageCircle },
                { id: 'post', label: 'Post Flyer', icon: PlusSquare },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(item.id);
                    if (item.id !== 'matches') setSelectedMatchId(null);
                  }}
                  className="flex w-full items-center gap-3 rounded-2xl border px-4 py-3 text-sm font-semibold transition"
                  style={{
                    borderColor: active ? 'var(--accent)' : 'var(--border)',
                    backgroundColor: active ? 'var(--surface)' : 'transparent',
                    color: active ? 'var(--ink)' : 'var(--muted)',
                  }}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {activeTab === 'discover' && (
            <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-4 text-xs text-[var(--muted)]">
              <p className="font-mono-code mb-2 text-[11px] uppercase tracking-widest">Shortcuts</p>
              <ul className="space-y-1.5">
                <li>
                  <code className="font-mono-code font-semibold text-[var(--ink)]">← / →</code> Pass or{' '}
                  {state.mode === 'jam' ? 'Jam' : 'Book'}
                </li>
                <li>
                  <code className="font-mono-code font-semibold text-[var(--ink)]">↑</code> Gear &amp; Details
                </li>
                <li>
                  <code className="font-mono-code font-semibold text-[var(--ink)]">Z</code> Undo last swipe
                </li>
              </ul>
            </div>
          )}
        </aside>

        {/* Primary stage */}
        <main className="stage-shell min-w-0">
          {activeTab === 'discover' && (
            <div className="space-y-4">
              {/* Quick genre / slot chips */}
              <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
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
                              backgroundColor: 'var(--surface)',
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
                onGoToPost={() => setActiveTab('post')}
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
              onBackToDiscover={() => setActiveTab('discover')}
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
      </div>

      {/* Mobile safe-bottom navigation */}
      <nav
        aria-label="Mobile navigation"
        className="safe-bottom fixed inset-x-0 bottom-0 z-20 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-md lg:hidden"
      >
        <div className="mx-auto grid max-w-md grid-cols-3 gap-1 pt-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('discover')}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold"
            style={{ color: activeTab === 'discover' ? 'var(--accent)' : 'var(--muted)' }}
          >
            <Compass className="h-5 w-5" aria-hidden="true" />
            <span>Discover</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('matches')}
            className="relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold"
            style={{ color: activeTab === 'matches' ? 'var(--accent)' : 'var(--muted)' }}
          >
            <span className="relative">
              <MessageCircle className="h-5 w-5" aria-hidden="true" />
              {state.matches.length > 0 && (
                <span
                  className="font-mono-code absolute -right-2.5 -top-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
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
            onClick={() => setActiveTab('post')}
            className="flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold"
            style={{ color: activeTab === 'post' ? 'var(--accent)' : 'var(--muted)' }}
          >
            <PlusSquare className="h-5 w-5" aria-hidden="true" />
            <span>Post</span>
          </button>
        </div>
      </nav>

      {/* Non-blocking status toast */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-24 left-1/2 z-30 -translate-x-1/2 rounded-full border border-[var(--border)] bg-[var(--ink)] px-4 py-2 text-xs font-semibold text-[var(--bg)] shadow-lg lg:bottom-6"
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
          detailListing ? state.matches.some((m) => m.listingId === detailListing.id) || Boolean(detailListing.isUserCreated) : false
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
