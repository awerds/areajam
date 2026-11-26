import { useEffect, useState } from 'react';
import type { CSSProperties } from 'react';
import { Flame, Globe, GraduationCap, MessageCircle, Mic2, Pause, Play, Search } from 'lucide-react';
import { getPlayingListingId, subscribeAudioState, toggleCardPreview } from '../lib/audioPreview';
import { getProfileActionState } from '../lib/firestorePilot';
import { estimateRoughDistanceMiles, formatRoughDistance } from '../lib/location';
import { cardViewTransitionName } from '../lib/viewTransition';
import type {
  AppMode,
  DiscoveryRole,
  InboxFolder,
  JamInvite,
  Listing,
  Region,
  SwipeDecision,
} from '../types';
import { CardArtwork } from './CardArtwork';
import { InstrumentBadgeRow } from './InstrumentIcons';

interface BrowseGridProps {
  listings: Listing[];
  mode: AppMode;
  discoveryRole?: DiscoveryRole;
  includeRemoteFriendly?: boolean;
  onToggleRemoteFriendly?: () => void;
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
  discoveryRole = 'musician',
  includeRemoteFriendly = false,
  onToggleRemoteFriendly,
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
    return `${item.title} ${item.subtitle} ${item.neighborhood} ${item.roleCategory} ${item.genres.join(' ')} ${item.seekingOrOffer} ${item.serviceNote ?? ''} ${gearText}`
      .toLowerCase()
      .includes(q);
  });

  const hasLocalResults = filtered.some((item) => item.regionId === region.id);
  const showingRemoteOnly = !hasLocalResults && includeRemoteFriendly && filtered.length > 0;
  const roleNoun =
    discoveryRole === 'session'
      ? 'session players'
      : discoveryRole === 'teacher'
        ? 'music teachers'
        : mode === 'jam'
          ? 'musicians'
          : 'gigs and bands';

  return (
    <section aria-label={`Browse ${roleNoun}`} className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            {showingRemoteOnly
              ? `Remote-friendly ${roleNoun}`
              : showingNearestFallback
                ? `Nearest ${roleNoun} to ${region.city}`
                : discoveryRole === 'session'
                  ? `Session players around ${region.city}`
                  : discoveryRole === 'teacher'
                    ? `Music teachers around ${region.city}`
                    : mode === 'jam'
                      ? `Find a musician around ${region.city}`
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
            {showingRemoteOnly ? (
              <>
                No local {roleNoun} in {region.city} yet — showing remote-friendly matches from other cities.
              </>
            ) : showingNearestFallback ? (
              <>
                No {roleNoun} in {region.city} yet. Listings are sorted by estimated distance.{' '}
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
            ) : includeRemoteFriendly ? (
              `Local ${roleNoun} in ${region.city} first, followed by remote-friendly players from other cities`
            ) : discoveryRole === 'session' ? (
              'Musicians available for studio tracking, overdubs, and live session work'
            ) : discoveryRole === 'teacher' ? (
              'Local musicians offering private lessons and coaching — free to connect directly'
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
        <div className="glass-surface filter-empty-state space-y-3 rounded-3xl px-6 py-12 text-center">
          <p className="font-display text-lg font-bold">No local {roleNoun} match those filters</p>
          <p className="text-sm text-[var(--muted)]">
            Clear your search, broaden instrument filters, or include remote-friendly players from other cities.
          </p>
          {!includeRemoteFriendly && onToggleRemoteFriendly && (
            <button
              type="button"
              onClick={onToggleRemoteFriendly}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--jam)] bg-[var(--jam-soft)] px-4 py-2 text-xs font-bold text-[var(--jam-text)] transition hover:opacity-90"
            >
              <Globe className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Include remote-friendly {roleNoun}</span>
            </button>
          )}
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
            const isRemoteNonLocal = item.regionId !== region.id && Boolean(item.remoteFriendly);
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

                  {(item.offersSession || item.offersLessons) && (
                    <div className="pointer-events-none absolute left-2.5 right-2.5 top-2.5 flex flex-wrap gap-1 pr-14">
                      {item.offersSession && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-amber-300/35 bg-black/75 px-2 py-0.5 text-[10px] font-bold text-amber-300 backdrop-blur-md">
                          <Mic2 className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {item.sessionRate ? `Session · ${item.sessionRate}` : 'Session'}
                          </span>
                        </span>
                      )}
                      {item.offersLessons && (
                        <span className="inline-flex max-w-full items-center gap-1 rounded-full border border-emerald-300/35 bg-black/75 px-2 py-0.5 text-[10px] font-bold text-emerald-300 backdrop-blur-md">
                          <GraduationCap className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                          <span className="truncate">
                            {item.lessonRate ? `Teacher · ${item.lessonRate}` : 'Teacher'}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  {isRemoteNonLocal && includeRemoteFriendly ? (
                    <span
                      title={`Remote-friendly from ${locationLabel}`}
                      className="pointer-events-none absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border border-sky-300/35 bg-black/70 px-2 py-0.5 text-[10px] font-bold text-sky-300 backdrop-blur-md"
                    >
                      <Globe className="h-2.5 w-2.5" aria-hidden="true" />
                      <span>Remote</span>
                    </span>
                  ) : roughDistance ? (
                    <span
                      title={roughDistanceTitle ?? undefined}
                      aria-label={roughDistanceTitle ?? roughDistance}
                      className="pointer-events-none absolute right-2.5 top-2.5 rounded-full border border-white/25 bg-black/65 px-2 py-0.5 text-[10px] font-bold text-[#ff85a6] backdrop-blur-md"
                    >
                      {roughDistance}
                    </span>
                  ) : null}

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

                    <p className="truncate text-xs font-medium text-[var(--muted)]">
                      {locationLabel}
                    </p>

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
