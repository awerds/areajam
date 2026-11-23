import { useEffect, useState } from 'react';
import { Flame, MapPin, Maximize2, Pause, Play, Search, Ticket } from 'lucide-react';
import { getPlayingListingId, subscribeAudioState, toggleCardPreview } from '../lib/audioPreview';
import type { AppMode, Listing, Region, SwipeDecision } from '../types';
import { CardArtwork } from './CardArtwork';
import { InstrumentBadgeRow } from './InstrumentIcons';

interface BrowseGridProps {
  listings: Listing[];
  mode: AppMode;
  region: Region;
  allRegions: Region[];
  swiped: Record<string, SwipeDecision>;
  onInspect: (listing: Listing) => void;
  onOpenProfile: (listing: Listing) => void;
  onSwipe: (listing: Listing, decision: SwipeDecision) => void;
  onWatchInReels?: () => void;
}

export function BrowseGrid({
  listings,
  mode,
  region,
  allRegions,
  swiped,
  onOpenProfile,
  onSwipe,
  onWatchInReels,
}: BrowseGridProps) {
  const [query, setQuery] = useState('');
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
            {mode === 'jam' ? `Browse players around ${region.city}` : `Browse gigs and bands in ${region.city}`}
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Open directory — inspect instruments, gear lockers, and full pages before signing in
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative min-w-[15rem] flex-1 sm:flex-initial">
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
              placeholder="Instrument, gear, genre, neighborhood..."
              className="field-control pl-10"
            />
          </div>

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
      </div>

      {filtered.length === 0 ? (
        <div className="glass-surface rounded-3xl px-6 py-12 text-center">
          <p className="font-display text-lg font-bold">No local cards match those filters</p>
          <p className="mt-1 text-sm text-[var(--muted)]">
            Clear your search or broaden your player preferences above.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => {
            const itemRegion = allRegions.find((r) => r.id === item.regionId);
            const isPlaying = playingId === item.id;
            const decision = swiped[item.id];
            const isJam = item.side === 'jam';

            return (
              <article
                key={item.id}
                className="glass-surface flex flex-col overflow-hidden rounded-[1.5rem] transition hover:border-[var(--border-strong)]"
              >
                <div className="relative">
                  <CardArtwork listing={item} areaCode={itemRegion?.areaCode} compact />
                  <button
                    type="button"
                    onClick={() => void toggleCardPreview(item, 0)}
                    aria-pressed={isPlaying}
                    aria-label={isPlaying ? `Pause clip for ${item.title}` : `Play clip for ${item.title}`}
                    className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/65 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/80"
                  >
                    {isPlaying ? (
                      <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    ) : (
                      <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                    )}
                    <span>{isPlaying ? 'Playing' : `${item.clips.length} clips`}</span>
                  </button>
                </div>

                <div className="flex flex-1 flex-col justify-between gap-3 p-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
                      <span className="truncate font-medium">{item.roleCategory}</span>
                      <span className="inline-flex shrink-0 items-center gap-1">
                        <MapPin className="h-3 w-3" aria-hidden="true" />
                        {itemRegion?.city ?? item.regionId}
                      </span>
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => onOpenProfile(item)}
                        className="w-full text-left transition hover:opacity-80"
                      >
                        <h3 className="font-display truncate text-xl font-bold text-[var(--ink)]">
                          {item.title}
                        </h3>
                      </button>
                      <p className="text-xs font-medium text-[var(--muted)]">
                        {item.subtitle}, {item.neighborhood}
                      </p>
                    </div>

                    <InstrumentBadgeRow instruments={item.instruments} compact max={3} />

                    <p className="line-clamp-2 text-sm text-[var(--ink)]/90">
                      {item.seekingOrOffer}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 border-t border-[var(--border)] pt-3">
                    <button
                      type="button"
                      onClick={() => onOpenProfile(item)}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--surface-hover)]"
                    >
                      <Maximize2 className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>View page</span>
                    </button>

                    {!item.isUserCreated && (
                      <button
                        type="button"
                        disabled={decision === 'like'}
                        onClick={() => onSwipe(item, 'like')}
                        className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-xs font-bold transition disabled:opacity-60"
                        style={{
                          backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
                          color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                        }}
                      >
                        {isJam ? (
                          <Flame className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        ) : (
                          <Ticket className="h-3.5 w-3.5" aria-hidden="true" />
                        )}
                        <span>{decision === 'like' ? 'Liked' : isJam ? 'Jam' : 'Book'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
