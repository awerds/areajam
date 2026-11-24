import { useEffect, useRef, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, Flame, LayoutGrid, MapPin, Volume2, VolumeX } from 'lucide-react';
import type { Listing, Region } from '../types';
import { CardArtwork } from './CardArtwork';

interface PanoramicHeroProps {
  listings: Listing[];
  region: Region;
  detectedCityLabel?: string;
  totalCount: number;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onPickRegion: () => void;
  onOpenProfile: (listing: Listing) => void;
  onBrowseAll: () => void;
  onOpenSwipeDeck: () => void;
  onGoToPost: () => void;
}

function getHeroVideoUrl(listing: Listing): string | null {
  const featured =
    (listing.featuredClipId
      ? listing.clips.find((c) => c.id === listing.featuredClipId)
      : undefined) ?? listing.clips[0];
  if (featured?.kind === 'video' && featured.embedUrl) {
    return featured.embedUrl;
  }
  const anyVideo = listing.clips.find((c) => c.kind === 'video' && Boolean(c.embedUrl));
  return anyVideo?.embedUrl ?? null;
}

function getHeroPosterUrl(listing: Listing): string | undefined {
  const featured =
    (listing.featuredClipId
      ? listing.clips.find((c) => c.id === listing.featuredClipId)
      : undefined) ?? listing.clips[0];
  return featured?.posterUrl || listing.portraitUrl;
}

export function PanoramicHero({
  listings,
  region,
  detectedCityLabel,
  totalCount,
  soundEnabled,
  onToggleSound,
  onPickRegion,
  onOpenProfile,
  onBrowseAll,
  onOpenSwipeDeck,
  onGoToPost,
}: PanoramicHeroProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    setActiveIndex(0);
  }, [listings.length, region.id]);

  const count = listings.length;
  const safeIndex = count > 0 ? ((activeIndex % count) + count) % count : 0;

  const handleStep = (delta: number) => {
    if (count === 0) return;
    setActiveIndex((prev) => (((prev + delta) % count) + count) % count);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length !== 1) return;
    touchStartRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start || e.changedTouches.length === 0) return;
    const dx = e.changedTouches[0].clientX - start.x;
    const dy = e.changedTouches[0].clientY - start.y;
    if (Math.abs(dx) > 36 && Math.abs(dx) > Math.abs(dy) * 1.2) {
      handleStep(dx < 0 ? 1 : -1);
    }
  };

  const resolveSlotItem = (offset: number): { listing: Listing; realIndex: number } | null => {
    if (count === 0) return null;
    const realIndex = (((safeIndex + offset) % count) + count) % count;
    return { listing: listings[realIndex], realIndex };
  };

  const renderCard = (offset: number, slotKey: string, extraClass = '') => {
    const entry = resolveSlotItem(offset);
    if (!entry) {
      return (
        <button
          key={slotKey}
          type="button"
          onClick={onGoToPost}
          className={`group relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-solid)] p-4 text-center ${extraClass}`}
        >
          <span className="font-display text-sm font-bold text-[var(--ink)]">
            Share your reel
          </span>
          <span className="mt-1 text-xs text-[var(--muted)]">Add clips in {region.city}</span>
        </button>
      );
    }

    const { listing, realIndex } = entry;
    const isCenter = offset === 0;
    const videoUrl = isCenter ? getHeroVideoUrl(listing) : null;
    const posterUrl = getHeroPosterUrl(listing);
    const primaryRole = listing.instruments[0] ?? listing.roleCategory;

    return (
      <div
        key={`${slotKey}-${listing.id}`}
        className={`group relative h-full w-full overflow-hidden rounded-2xl border transition-all duration-300 ${
          isCenter
            ? 'border-[var(--border-strong)] bg-[#10131d] shadow-[0_24px_60px_var(--glass-shadow)]'
            : 'border-[var(--border)] bg-[#10131d] opacity-85 hover:opacity-100'
        } ${extraClass}`}
      >
        {videoUrl ? (
          <video
            src={videoUrl}
            poster={posterUrl}
            preload="auto"
            autoPlay
            loop
            playsInline
            muted={!soundEnabled}
            className="pointer-events-none h-full w-full object-cover object-[50%_20%]"
          />
        ) : posterUrl ? (
          <img
            src={posterUrl}
            alt={listing.portraitAlt || listing.title}
            loading={Math.abs(offset) <= 1 ? 'eager' : 'lazy'}
            decoding="async"
            className="pointer-events-none h-full w-full object-cover object-[50%_20%] transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <CardArtwork listing={listing} compact={false} showTopBadges={false} />
        )}

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[56%]"
          style={{
            background: isCenter
              ? 'linear-gradient(180deg, transparent 0%, rgba(10,12,20,0.42) 38%, rgba(10,12,20,0.92) 92%)'
              : 'linear-gradient(180deg, transparent 0%, rgba(10,12,20,0.35) 45%, rgba(10,12,20,0.88) 95%)',
          }}
        />

        <button
          type="button"
          onClick={() => {
            if (isCenter) {
              onOpenProfile(listing);
            } else {
              setActiveIndex(realIndex);
            }
          }}
          aria-label={
            isCenter
              ? `Open profile for ${listing.title}`
              : `Spotlight ${listing.title} in center view`
          }
          className="absolute inset-0 z-10 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--accent)]"
        />

        {isCenter && videoUrl && (
          <button
            type="button"
            onClick={onToggleSound}
            aria-pressed={soundEnabled}
            aria-label={soundEnabled ? 'Mute spotlight sound' : 'Turn spotlight sound on'}
            className="absolute right-2.5 top-[11%] z-20 inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/25 bg-black/55 text-white backdrop-blur-md transition hover:bg-black/75 sm:h-9 sm:w-9"
          >
            {soundEnabled ? (
              <Volume2 className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
            ) : (
              <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
            )}
          </button>
        )}

        <div
          className={`pointer-events-none absolute inset-x-0 bottom-0 z-10 px-3 ${
            isCenter ? 'pb-7 sm:pb-9 md:pb-10' : 'pb-5 sm:pb-7 md:pb-8'
          }`}
        >
          <p className="font-display truncate text-xs font-bold leading-tight text-white sm:text-sm md:text-base">
            {listing.title}
          </p>
          <p className="mt-0.5 truncate text-[10px] font-medium text-white/80 sm:text-[11px]">
            {primaryRole}
          </p>
        </div>
      </div>
    );
  };

  return (
    <section
      aria-label="Featured local musicians panoramic showcase"
      className="hero-ambient-stage relative w-full overflow-x-clip border-b border-[var(--border)] py-3 sm:py-4 md:py-5"
    >
      {/* Inline SVG arc clip definitions (kept 0x0 in layout, not display:none) */}
      <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <defs>
          <clipPath id="areajam-hero-arc-desktop" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 Q 0.5,0.14 1,0 L 1,1 Q 0.5,0.86 0,1 Z" />
          </clipPath>
          <clipPath id="areajam-hero-arc-mobile" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 Q 0.5,0.10 1,0 L 1,1 Q 0.5,0.90 0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Centered editorial headline */}
      <div className="mx-auto max-w-3xl px-4 text-center">
        <button
          type="button"
          onClick={onPickRegion}
          aria-label={`Change local board, currently ${region.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--surface-hover)]"
        >
          <MapPin className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
          <span>
            {totalCount > 0
              ? `${totalCount} musicians near ${region.city}`
              : region.label}
            {detectedCityLabel ? ` (${detectedCityLabel})` : ''}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
        </button>

        <h1 className="hero-title mt-2.5 font-bold text-[var(--ink)] sm:mt-3">
          Find your people.
          <br />
          Make some noise.
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-[var(--muted)] sm:mt-2.5 sm:text-sm md:text-[15px]">
          Hear real performance clips from nearby musicians. Spot their instruments, send a Jam invite, and start playing.
        </p>
      </div>

      {/* Full-bleed concave panoramic card arc */}
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative mt-3 w-full select-none overflow-x-clip sm:mt-4 md:mt-5"
      >
        {count > 1 && (
          <>
            <button
              type="button"
              onClick={() => handleStep(-1)}
              aria-label="Previous featured musician"
              className="glass-surface absolute left-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink)] transition hover:scale-105 sm:inline-flex md:left-5"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => handleStep(1)}
              aria-label="Next featured musician"
              className="glass-surface absolute right-3 top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full text-[var(--ink)] transition hover:scale-105 sm:inline-flex md:right-5"
            >
              <ChevronRight className="h-5 w-5" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Mobile 3-card curved strip */}
        <div className="panoramic-ribbon-clip-mobile -ml-[16%] grid h-[clamp(15.5rem,34dvh,19.5rem)] w-[132%] grid-cols-3 gap-2 md:hidden">
          {([-1, 0, 1] as const).map((offset) => renderCard(offset, `mob-${offset}`))}
        </div>

        {/* Tablet 5-card curved strip */}
        <div className="panoramic-ribbon-clip-desktop -ml-[8%] hidden h-[clamp(18rem,36dvh,22rem)] w-[116%] grid-cols-5 gap-2.5 md:grid lg:hidden">
          {([-2, -1, 0, 1, 2] as const).map((offset) => renderCard(offset, `tab-${offset}`))}
        </div>

        {/* Desktop 7-card curved strip */}
        <div className="panoramic-ribbon-clip-desktop -ml-[7%] hidden h-[clamp(17.5rem,37dvh,22.5rem)] w-[114%] grid-cols-7 gap-3 lg:grid">
          {([-3, -2, -1, 0, 1, 2, 3] as const).map((offset) =>
            renderCard(offset, `desk-${offset}`)
          )}
        </div>
      </div>

      {/* Centered primary CTA row */}
      <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2.5 px-4 sm:mt-4 md:mt-5">
        <button
          type="button"
          onClick={onBrowseAll}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-sm transition hover:opacity-90"
          style={{
            backgroundColor: 'var(--jam)',
            color: 'var(--jam-ink)',
          }}
        >
          <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          <span>Browse musicians</span>
        </button>

        <button
          type="button"
          onClick={onOpenSwipeDeck}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--surface-hover)]"
        >
          <Flame className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
          <span>Swipe reels</span>
        </button>
      </div>
    </section>
  );
}
