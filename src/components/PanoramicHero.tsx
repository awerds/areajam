import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import gsap from 'gsap';
import { ChevronDown, MapPin, Video } from 'lucide-react';
import type { Listing, Region } from '../types';
import { CardArtwork } from './CardArtwork';

interface PanoramicHeroProps {
  listings: Listing[];
  region: Region;
  detectedCityLabel?: string;
  totalCount: number;
  onPickRegion: () => void;
  onSelectListing: (listing: Listing) => void;
  onBrowseAll: () => void;
  onGoToPost: () => void;
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
  onPickRegion,
  onSelectListing,
  onBrowseAll,
  onGoToPost,
}: PanoramicHeroProps) {
  const [isFalling, setIsFalling] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    return () => {
      timelineRef.current?.kill();
    };
  }, []);

  // Repeat items so one half of the marquee always exceeds wide viewport widths cleanly.
  const halfTrack = useMemo(() => {
    if (listings.length === 0) return [];
    const out: Listing[] = [];
    while (out.length < 12) {
      out.push(...listings);
      if (listings.length >= 12) break;
    }
    return out;
  }, [listings]);

  const handleSelectCard = (listing: Listing) => {
    if (isFalling) return;
    setIsFalling(true);

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      onSelectListing(listing);
      return;
    }

    timelineRef.current?.kill();
    const tl = gsap.timeline({
      onComplete: () => {
        onSelectListing(listing);
      },
    });
    timelineRef.current = tl;

    if (headerRef.current) {
      tl.to(headerRef.current, { opacity: 0, y: -14, duration: 0.28, ease: 'power2.in' }, 0);
    }
    if (ctaRef.current) {
      tl.to(ctaRef.current, { opacity: 0, y: 14, duration: 0.26, ease: 'power2.in' }, 0);
    }
    if (stageRef.current) {
      tl.to(
        stageRef.current,
        { y: 120, rotateX: -14, scale: 0.92, opacity: 0, duration: 0.42, ease: 'power3.in' },
        0.04
      );
    }
  };

  return (
    <section
      aria-label="Featured local musicians carousel"
      className="hero-ambient-stage relative flex flex-1 flex-col justify-center overflow-x-clip py-4 md:py-6"
    >
      {/* Inline SVG arc clip definitions (kept 0x0 in layout, not display:none) */}
      <svg className="pointer-events-none absolute h-0 w-0 overflow-hidden" aria-hidden="true">
        <defs>
          <clipPath id="areajam-hero-arc-desktop" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 Q 0.5,0.11 1,0 L 1,1 Q 0.5,0.89 0,1 Z" />
          </clipPath>
          <clipPath id="areajam-hero-arc-mobile" clipPathUnits="objectBoundingBox">
            <path d="M 0,0 Q 0.5,0.08 1,0 L 1,1 Q 0.5,0.92 0,1 Z" />
          </clipPath>
        </defs>
      </svg>

      {/* Centered editorial headline */}
      <div ref={headerRef} className="mx-auto max-w-3xl px-4 text-center">
        <button
          type="button"
          onClick={onPickRegion}
          aria-label={`Change local board, currently ${region.label}`}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--surface)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--surface-hover)]"
        >
          <MapPin className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
          <span>
            {totalCount > 0 ? `${totalCount} musicians near ${region.city}` : region.label}
            {detectedCityLabel ? ` (${detectedCityLabel})` : ''}
          </span>
          <ChevronDown className="h-3.5 w-3.5 text-[var(--muted)]" aria-hidden="true" />
        </button>

        <h1 className="hero-title mt-2.5 font-bold text-[var(--ink)] sm:mt-3">
          Find your tribe.
          <br />
          Make a joyful noise.
        </h1>

        <p className="mx-auto mt-2 max-w-xl text-xs leading-relaxed text-[var(--muted)] sm:mt-2.5 sm:text-sm">
          Click any player to launch their live reel and start swiping nearby musicians.
        </p>
      </div>

      {/* Slowly spinning concave 9:16 phone carousel */}
      <div className="mt-4 w-full overflow-x-clip sm:mt-5 md:mt-6" style={{ perspective: '1100px' }}>
        <div
          ref={stageRef}
          className="panoramic-marquee-stage panoramic-ribbon-clip-mobile md:panoramic-ribbon-clip-desktop relative w-full overflow-x-clip"
        >
          {halfTrack.length === 0 ? (
            <div className="mx-auto flex justify-center px-4">
              <button
                type="button"
                onClick={onGoToPost}
                className="glass-surface reel-aspect flex w-[9.25rem] flex-col items-center justify-center rounded-2xl p-4 text-center transition hover:scale-[1.02]"
              >
                <span className="font-display text-sm font-bold text-[var(--ink)]">
                  Share your reel
                </span>
                <span className="mt-1 text-xs text-[var(--muted)]">
                  Add clips in {region.city}
                </span>
              </button>
            </div>
          ) : (
            <div
              className="panoramic-marquee-track flex w-max items-center"
              style={
                {
                  '--panoramic-duration': `${Math.max(halfTrack.length, 12) * 20}s`,
                  animationPlayState: isFalling ? 'paused' : undefined,
                } as CSSProperties
              }
            >
              {[0, 1].map((copyIdx) => (
                <div
                  key={copyIdx}
                  aria-hidden={copyIdx === 1 || undefined}
                  className="flex shrink-0 items-center gap-2.5 pr-2.5 sm:gap-3 sm:pr-3"
                >
                  {halfTrack.map((listing, idx) => {
                    const posterUrl = getHeroPosterUrl(listing);
                    const primaryRole = listing.instruments[0] ?? listing.roleCategory;
                    const isDuplicate = copyIdx === 1;
                    return (
                      <button
                        key={`${copyIdx}-${idx}-${listing.id}`}
                        type="button"
                        tabIndex={isDuplicate ? -1 : undefined}
                        onClick={() => handleSelectCard(listing)}
                        aria-label={isDuplicate ? undefined : `Open swipe reel for ${listing.title}`}
                        className="group reel-aspect relative w-[7rem] shrink-0 cursor-pointer overflow-hidden rounded-2xl border border-[var(--border)] bg-[#10131d] text-left shadow-[0_14px_34px_var(--glass-shadow)] transition duration-200 hover:-translate-y-1 hover:border-[var(--border-strong)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)] sm:w-[8rem] lg:w-[9.25rem] xl:w-[9.75rem]"
                      >
                        {posterUrl ? (
                          <img
                            src={posterUrl}
                            alt={isDuplicate ? '' : listing.portraitAlt || listing.title}
                            loading={idx < 8 && copyIdx === 0 ? 'eager' : 'lazy'}
                            decoding="async"
                            className="pointer-events-none h-full w-full object-cover object-[50%_20%] transition duration-500 group-hover:scale-[1.04]"
                          />
                        ) : (
                          <CardArtwork listing={listing} compact={false} showTopBadges={false} />
                        )}

                        <div
                          className="pointer-events-none absolute inset-x-0 bottom-0 h-[55%]"
                          style={{
                            background:
                              'linear-gradient(180deg, transparent 0%, rgba(10,12,20,0.45) 45%, rgba(10,12,20,0.92) 94%)',
                          }}
                        />

                        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 px-2.5 pb-4 sm:px-3 sm:pb-5">
                          <p className="font-display truncate text-xs font-bold leading-tight text-white sm:text-sm">
                            {listing.title}
                          </p>
                          <p className="mt-0.5 truncate text-[10px] font-medium text-white/80">
                            {primaryRole}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Centered primary CTA row */}
      <div ref={ctaRef} className="mt-4 flex flex-wrap items-center justify-center gap-2.5 px-4 sm:mt-5 md:mt-6">
        <button
          type="button"
          onClick={onBrowseAll}
          className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold shadow-sm transition hover:opacity-90"
          style={{
            backgroundColor: 'var(--jam)',
            color: 'var(--jam-ink)',
          }}
        >
          <span>Browse musicians</span>
        </button>

        <button
          type="button"
          onClick={onGoToPost}
          className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-5 py-2.5 text-sm font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--surface-hover)]"
        >
          <Video className="h-4 w-4 text-[var(--accent-text)]" aria-hidden="true" />
          <span>Build profile &amp; clips</span>
        </button>
      </div>
    </section>
  );
}
