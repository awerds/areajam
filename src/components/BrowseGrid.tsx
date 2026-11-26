import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Flame, MessageCircle, Pause, Play, Search } from 'lucide-react';
import { getPlayingListingId, subscribeAudioState, toggleCardPreview } from '../lib/audioPreview';
import { getProfileActionState } from '../lib/firestorePilot';
import { estimateRoughDistanceMiles, formatRoughDistance } from '../lib/location';
import { cardViewTransitionName } from '../lib/viewTransition';
import type { AppMode, InboxFolder, JamInvite, Listing, Region, SwipeDecision } from '../types';
import { CardArtwork } from './CardArtwork';
import { InstrumentBadgeRow } from './InstrumentIcons';

interface BrowseGridProps {
  listings: Listing[];
  mode: AppMode;
  region: Region;
  allRegions: Region[];
  swiped: Record<string, SwipeDecision>;
  showingNearestFallback?: boolean;
  currentUserUid?: string;
  inviteByTargetUid?: Record<string, JamInvite>;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  hideSearch?: boolean;
  onInspect: (listing: Listing) => void;
  onOpenProfile: (listing: Listing) => void;
  onSwipe: (listing: Listing, decision: SwipeDecision) => void;
  onInvite: (listing: Listing) => void;
  onOpenInvites: (threadId?: string, folder?: InboxFolder) => void;
  onWatchInReels?: () => void;
  onGoToPost?: () => void;
}

export function BrowseGrid({
  listings,
  mode,
  region,
  allRegions,
  showingNearestFallback = false,
  currentUserUid,
  inviteByTargetUid,
  searchQuery,
  onSearchQueryChange,
  hideSearch = false,
  onOpenProfile,
  onInvite,
  onOpenInvites,
  onWatchInReels,
  onGoToPost,
}: BrowseGridProps) {
  const [localQuery, setLocalQuery] = useState('');
  const query = searchQuery ?? localQuery;
  const setQuery = onSearchQueryChange ?? setLocalQuery;
  const [playingId, setPlayingId] = useState<string | null>(() => getPlayingListingId());

  useEffect(() => {
    return subscribeAudioState(() => {
      setPlayingId(getPlayingListingId());
    });
  }, []);

  const filtered = listings.filter((item) => {
    if (!query.trim()) return true;
    const q = query.trim().toLowerCase();
    const gearText = item.gearLocker.map((g) => `${g.name} ${g.notes ?? ''}`).join(' ');
    return `${item.title} ${item.subtitle} ${item.neighborhood} ${item.roleCategory} ${item.genres.join(' ')} ${item.seekingOrOffer} ${gearText}`
      .toLowerCase()
      .includes(q);
  });

  return (
    <section aria-label="Browse local players and bands" className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {showingNearestFallback
              ? `Nearest players to ${region.city}`
              : mode === 'jam'
                ? `Browse players around ${region.city}`
                : `Browse gigs and bands in ${region.city}`}
            <span className="ml-2 inline-flex align-middle rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-0.5 font-sans text-xs font-semibold text-[var(--muted)]">
              {filtered.length}
            </span>
          </h2>
          <p
            className={
              showingNearestFallback
                ? 'hidden text-sm text-[var(--muted)] md:block'
                : 'text-sm text-[var(--muted)]'
            }
          >
            {showingNearestFallback ? (
              <>
                No players in {region.city} yet. Listings are sorted by estimated distance.{' '}
                {onGoToPost && (
                  <button
                    type="button"
                    onClick={onGoToPost}
                    className="font-semibold text-[var(--accent-text)] underline underline-offset-2"
                  >
                    Be first to post in {region.city}
                  </button>
                )}
              </>
            ) : (
              'Open directory — inspect instruments, gear lockers, and full pages before signing in'
            )}
          </p>
        </div>

        {(!hideSearch || onWatchInReels) && (
          <div className="flex flex-wrap items-center gap-2.5">
            {!hideSearch && (
              <div className="relative min-w-[17.5rem] flex-1 sm:w-[21rem] sm:flex-initial">
                <label htmlFor="browse-search" className="visually-hidden">
                  Search players, instruments, gear, or neighborhoods
                </label>
                <Search
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  aria-hidden="true"
                />
                <input
                  id="browse-search"
                  type="search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search instruments, gear, genre..."
                  className="field-control pl-10"
                />
              </div>
            )}

            {onWatchInReels && (
              <button
                type="button"
                onClick={onWatchInReels}
                className="shrink-0 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)]"
              >
                Open clip reels
              </button>
            )}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="glass-surface filter-empty-state rounded-3xl px-6 py-12 text-center">
          <p className="font-display text-lg font-bold">No local cards match those filters</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Clear your search or broaden your player preferences above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3.5 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map((item, idx) => {
            const itemRegion = allRegions.find((r) => r.id === item.regionId);
            const isPlaying = playingId === item.id;
            const action = getProfileActionState(item, currentUserUid, inviteByTargetUid);
            const hasEmbed = item.clips.some((c) => c.kind === 'embed');
            const hasDirectVideo = item.clips.some((c) => c.kind === 'video' && Boolean(c.embedUrl));
            const hasPortraitOnly = item.clips.length === 0 && Boolean(item.portraitUrl);
            const distMiles =
              item.regionId !== region.id ? estimateRoughDistanceMiles(region, itemRegion) : null;
            const roughDistance =
              item.regionId !== region.id
                ? formatRoughDistance(distMiles, region, itemRegion, 'compact')
                : null;
            const roughDistanceTitle =
              item.regionId !== region.id
                ? formatRoughDistance(distMiles, region, itemRegion, 'verbose')
                : null;
            const locationLabel =
              item.regionId !== region.id && itemRegion
                ? `${itemRegion.city}${itemRegion.state ? `, ${itemRegion.state}` : ''}`
                : item.neighborhood || itemRegion?.city || item.regionId;
            const profileHref = `?area=${encodeURIComponent(item.regionId)}&mode=${item.side}&profile=${encodeURIComponent(item.id)}`;

            return (
              <article
                key={item.id}
                className={`browse-card glass-surface ${idx < 24 ? 'filter-grid-card ' : ''}flex flex-col overflow-hidden rounded-[1.5rem] transition`}
                style={
                  idx < 24
                    ? ({ viewTransitionName: cardViewTransitionName(item.id) } as CSSProperties)
                    : undefined
                }
              >
                <div className="relative">
                  <CardArtwork listing={item} areaCode={itemRegion?.areaCode} compact showTopBadges={false} />

                  {roughDistance && (
                    <span
                      title={roughDistanceTitle ?? undefined}
                      aria-label={roughDistanceTitle ?? roughDistance}
                      className="pointer-events-none absolute right-2.5 top-2.5 rounded-full border border-white/25 bg-black/65 px-2 py-0.5 text-[10px] font-bold text-[#ff85a6] backdrop-blur-md"
                    >
                      {roughDistance}
                    </span>
                  )}

                  {hasDirectVideo || hasEmbed ? (
                    <span className="pointer-events-none absolute bottom-2.5 left-2.5 inline-flex items-center gap-1 rounded-full border border-white/20 bg-black/65 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
                      <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                      <span>Clip</span>
                    </span>
                  ) : !hasPortraitOnly ? (
                    <button
                      type="button"
                      onClick={() => void toggleCardPreview(item, 0)}
                      aria-pressed={isPlaying}
                      aria-label={isPlaying ? `Pause clip for ${item.title}` : `Play clip for ${item.title}`}
                      className="absolute bottom-2.5 left-2.5 inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--card-hud-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--surface-solid)]"
                    >
                      {isPlaying ? (
                        <Pause className="h-3 w-3 fill-current" aria-hidden="true" />
                      ) : (
                        <Play className="h-3 w-3 fill-current" aria-hidden="true" />
                      )}
                      <span>{isPlaying ? 'Playing' : `${item.clips.length} clips`}</span>
                    </button>
                  ) : null}
                </div>

                <div className="flex flex-1 flex-col justify-between gap-2.5 p-3 sm:p-3.5">
                  <div className="space-y-1.5">
                    <h3 className="font-display truncate text-base font-bold leading-snug text-[var(--ink)] sm:text-lg">
                      <a
                        href={profileHref}
                        className="card-link"
                        onClick={(e) => {
                          if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey) {
                            e.preventDefault();
                            onOpenProfile(item);
                          }
                        }}
                      >
                        {item.title}
                      </a>
                    </h3>

                    <p className="truncate text-xs font-medium text-[var(--muted)]">{locationLabel}</p>

                    <InstrumentBadgeRow instruments={item.instruments} compact max={2} />
                  </div>

                  {action.kind !== 'unavailable' && action.kind !== 'self' && (
                    <div className="flex items-center gap-2 border-t border-[var(--border)] pt-2.5">
                      {action.kind === 'invite' ? (
                        <button
                          type="button"
                          onClick={() => onInvite(item)}
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition hover:opacity-90"
                          style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                        >
                          <Flame className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                          <span>Invite to jam</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() =>
                            onOpenInvites(
                              action.kind === 'accepted' ? action.invite.threadId : undefined,
                              action.kind === 'accepted'
                                ? 'inbox'
                                : action.kind === 'incoming'
                                  ? 'requests'
                                  : 'sent'
                            )
                          }
                          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3 py-2 text-xs font-bold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                        >
                          <MessageCircle className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{action.label}</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
