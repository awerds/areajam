import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flame, Info, MapPin, Pause, Play, RotateCcw, Ticket, X } from 'lucide-react';
import {
  getPlayingListingId,
  stopCardPreview,
  subscribeAudioState,
  toggleCardPreview,
} from '../lib/audioPreview';
import type { AppMode, Listing, Region, SwipeDecision } from '../types';
import { CardArtwork } from './CardArtwork';

interface SwipeDeckProps {
  cards: Listing[];
  mode: AppMode;
  region: Region;
  allRegions: Region[];
  canUndo: boolean;
  includeNearbyRegions: boolean;
  onSwipe: (listing: Listing, decision: SwipeDecision) => void;
  onUndo: () => void;
  onOpenDetails: (listing: Listing) => void;
  onEnableNearby: () => void;
  onResetPassed: () => void;
  onGoToPost: () => void;
}

export function SwipeDeck({
  cards,
  mode,
  region,
  allRegions,
  canUndo,
  includeNearbyRegions,
  onSwipe,
  onUndo,
  onOpenDetails,
  onEnableNearby,
  onResetPassed,
  onGoToPost,
}: SwipeDeckProps) {
  const [dragState, setDragState] = useState({ x: 0, dragging: false });
  const [flyDir, setFlyDir] = useState<SwipeDecision | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(() => getPlayingListingId());

  const cardRef = useRef<HTMLElement>(null);
  const nextCardRef = useRef<HTMLElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const tiltQuickToRef = useRef<{
    rx: gsap.QuickToFunc;
    ry: gsap.QuickToFunc;
  } | null>(null);

  const topCard = cards[0];
  const nextCard = cards[1];

  useEffect(() => {
    return subscribeAudioState(() => {
      setPlayingId(getPlayingListingId());
    });
  }, []);

  useEffect(() => {
    setDragState({ x: 0, dragging: false });
    setFlyDir(null);
    startRef.current = null;
    stopCardPreview();
  }, [topCard?.id]);

  useLayoutEffect(() => {
    const el = cardRef.current;
    if (!el || !topCard) return;

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        finePointer: '(pointer: fine) and (prefers-reduced-motion: no-preference)',
      },
      (context) => {
        const { motion, finePointer } = context.conditions ?? {};
        if (motion) {
          gsap.fromTo(
            el,
            { scale: 0.95, y: 12, opacity: 0.85, x: 0, rotation: 0 },
            { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'power3.out', clearProps: 'transform' }
          );
        } else {
          gsap.set(el, { x: 0, y: 0, scale: 1, rotation: 0, opacity: 1 });
        }

        if (finePointer) {
          tiltQuickToRef.current = {
            rx: gsap.quickTo(el, 'rotationX', { duration: 0.28, ease: 'power2.out' }),
            ry: gsap.quickTo(el, 'rotationY', { duration: 0.28, ease: 'power2.out' }),
          };
        } else {
          tiltQuickToRef.current = null;
        }
      }
    );

    return () => {
      tiltQuickToRef.current = null;
      mm.revert();
    };
  }, [topCard?.id]);

  const triggerSwipe = (decision: SwipeDecision) => {
    if (!topCard || flyDir) return;
    stopCardPreview();
    setFlyDir(decision);

    const el = cardRef.current;
    const nextEl = nextCardRef.current;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!el || reduced) {
      onSwipe(topCard, decision);
      return;
    }

    if (nextEl) {
      gsap.to(nextEl, { scale: 1, y: 0, opacity: 1, duration: 0.22, ease: 'power2.out' });
    }

    gsap.to(el, {
      x: decision === 'like' ? 460 : -460,
      y: 28,
      rotation: decision === 'like' ? 16 : -16,
      opacity: 0,
      duration: 0.24,
      ease: 'power2.in',
      onComplete: () => {
        onSwipe(topCard, decision);
      },
    });
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (document.querySelector('dialog[open]')) return;
      const target = e.target as HTMLElement | null;
      if (target && target.closest('input, textarea, select, [contenteditable="true"]')) return;

      if (e.key === 'ArrowLeft' && topCard) {
        e.preventDefault();
        triggerSwipe('pass');
      } else if (e.key === 'ArrowRight' && topCard) {
        e.preventDefault();
        triggerSwipe('like');
      } else if (e.key === 'ArrowUp' && topCard) {
        e.preventDefault();
        onOpenDetails(topCard);
      } else if (e.key === ' ' && topCard && !(target && target.closest('button, a'))) {
        e.preventDefault();
        void toggleCardPreview(topCard);
      } else if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey && canUndo) {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if (!topCard || flyDir) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setDragState({ x: 0, dragging: true });
    if (tiltQuickToRef.current) {
      tiltQuickToRef.current.rx(0);
      tiltQuickToRef.current.ry(0);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    const el = cardRef.current;
    if (!el) return;

    if (startRef.current && startRef.current.pointerId === e.pointerId) {
      const dx = e.clientX - startRef.current.x;
      const dy = (e.clientY - startRef.current.y) * 0.28;
      gsap.set(el, { x: dx, y: dy, rotation: dx * 0.042 });
      if (nextCardRef.current) {
        const progress = Math.min(1, Math.abs(dx) / 220);
        gsap.set(nextCardRef.current, {
          scale: 0.94 + progress * 0.06,
          y: 14 - progress * 14,
          opacity: 0.65 + progress * 0.35,
        });
      }
      setDragState({ x: dx, dragging: true });
      return;
    }

    // Fine-pointer desktop 3D tilt & specular glare
    if (!dragState.dragging && tiltQuickToRef.current && e.pointerType === 'mouse') {
      const rect = el.getBoundingClientRect();
      const px = (e.clientX - rect.left) / rect.width;
      const py = (e.clientY - rect.top) / rect.height;
      tiltQuickToRef.current.ry((px - 0.5) * 10);
      tiltQuickToRef.current.rx((0.5 - py) * 10);
      if (glareRef.current) {
        glareRef.current.style.setProperty('--glare-x', `${Math.round(px * 100)}%`);
        glareRef.current.style.setProperty('--glare-y', `${Math.round(py * 100)}%`);
        glareRef.current.style.opacity = '1';
      }
    }
  };

  const handlePointerLeave = () => {
    if (tiltQuickToRef.current) {
      tiltQuickToRef.current.rx(0);
      tiltQuickToRef.current.ry(0);
    }
    if (glareRef.current) {
      glareRef.current.style.opacity = '0';
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!startRef.current || startRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - startRef.current.x;
    startRef.current = null;
    setDragState({ x: 0, dragging: false });

    if (dx > 92) {
      triggerSwipe('like');
    } else if (dx < -92) {
      triggerSwipe('pass');
    } else if (cardRef.current) {
      const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (reduced) {
        gsap.set(cardRef.current, { x: 0, y: 0, rotation: 0 });
      } else {
        gsap.to(cardRef.current, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.48,
          ease: 'back.out(1.5)',
        });
      }
      if (nextCardRef.current) {
        gsap.to(nextCardRef.current, {
          scale: 0.94,
          y: 14,
          opacity: 0.65,
          duration: 0.32,
          ease: 'power2.out',
        });
      }
    }
  };

  const getRegionAreaCode = (regionId: string) =>
    allRegions.find((r) => r.id === regionId)?.areaCode ?? region.areaCode;

  if (!topCard) {
    return (
      <div className="deck-frame glass-surface mx-auto flex w-full max-w-[25rem] flex-col items-center justify-center rounded-[2rem] px-7 py-14 text-center">
        <span className="mb-4 rounded-full border border-white/15 bg-white/5 px-3.5 py-1 text-xs font-medium text-[var(--muted)]">
          {region.city} {region.areaCode} — {mode === 'jam' ? 'Jam' : 'Gigs'}
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          You have seen every local {mode === 'jam' ? 'player' : 'gig'} here
        </h2>
        <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
          Expand to nearby cities, bring back cards you skipped, or pin your own flyer in {region.city}.
        </p>

        <div className="mt-7 flex w-full max-w-xs flex-col gap-2.5">
          {!includeNearbyRegions && (
            <button
              type="button"
              onClick={onEnableNearby}
              className="rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                color: mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
              }}
            >
              Show nearby cities
            </button>
          )}
          <button
            type="button"
            onClick={onResetPassed}
            className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white/10"
          >
            Review passed cards
          </button>
          <button
            type="button"
            onClick={onGoToPost}
            className="rounded-2xl border border-transparent px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            Pin your flyer
          </button>
        </div>
      </div>
    );
  }

  const likeOpacity = flyDir === 'like' ? 1 : Math.min(1, Math.max(0, (dragState.x - 24) / 80));
  const passOpacity = flyDir === 'pass' ? 1 : Math.min(1, Math.max(0, (-dragState.x - 24) / 80));
  const positiveLabel = mode === 'jam' ? 'Jam' : 'Book';
  const topRegion = allRegions.find((r) => r.id === topCard.regionId);
  const isPlaying = playingId === topCard.id;

  return (
    <div className="deck-frame mx-auto flex w-full max-w-[25rem] flex-col items-center">
      <div className="deck-perspective relative h-[min(64dvh,34rem)] w-full select-none">
        {nextCard && (
          <article
            ref={nextCardRef}
            aria-hidden="true"
            className="glass-surface pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
            style={{
              transform: 'translate3d(0, 14px, 0) scale(0.94)',
              opacity: 0.65,
            }}
          >
            <CardArtwork listing={nextCard} areaCode={getRegionAreaCode(nextCard.regionId)} />
            <div className="absolute inset-x-0 bottom-0 p-5">
              <h3 className="font-display text-2xl font-bold text-white">{nextCard.title}</h3>
              <p className="mt-1 text-sm text-white/75">{nextCard.subtitle}</p>
            </div>
          </article>
        )}

        <article
          ref={cardRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onPointerLeave={handlePointerLeave}
          className="glass-surface absolute inset-0 flex touch-pan-y cursor-grab flex-col justify-end overflow-hidden rounded-[2rem] active:cursor-grabbing"
          style={{ transformStyle: 'preserve-3d' }}
        >
          <CardArtwork listing={topCard} areaCode={getRegionAreaCode(topCard.regionId)} />

          {/* Interactive desktop specular glare */}
          <div ref={glareRef} className="card-glare absolute inset-0 opacity-0" aria-hidden="true" />

          {/* Floating glass swipe decision badges */}
          <div
            aria-hidden="true"
            className="font-display pointer-events-none absolute left-5 top-16 -rotate-12 rounded-2xl border px-4 py-1.5 text-2xl font-bold backdrop-blur-md"
            style={{
              opacity: likeOpacity,
              borderColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
              color: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
              backgroundColor: 'rgba(7, 8, 13, 0.72)',
              boxShadow:
                mode === 'jam'
                  ? '0 0 28px rgba(255, 59, 107, 0.35)'
                  : '0 0 28px rgba(16, 232, 138, 0.35)',
            }}
          >
            {positiveLabel}
          </div>
          <div
            aria-hidden="true"
            className="font-display pointer-events-none absolute right-5 top-16 rotate-12 rounded-2xl border border-[var(--err)] bg-[#07080d]/75 px-4 py-1.5 text-2xl font-bold text-[var(--err)] backdrop-blur-md"
            style={{ opacity: passOpacity }}
          >
            Pass
          </div>

          {/* Foreground card info anchored to lower glass stage */}
          <div className="relative z-10 flex flex-col gap-3 p-5">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => void toggleCardPreview(topCard)}
                aria-pressed={isPlaying}
                aria-label={isPlaying ? `Pause groove preview for ${topCard.title}` : `Listen to groove preview for ${topCard.title}`}
                className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                {isPlaying ? (
                  <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                ) : (
                  <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                )}
                <span>{isPlaying ? 'Playing groove' : 'Preview groove'}</span>
                {isPlaying && (
                  <span className="flex h-3 items-end gap-0.5" aria-hidden="true">
                    <span className="eq-bar w-0.5 rounded-full bg-current" style={{ height: '100%', animationDelay: '0ms' }} />
                    <span className="eq-bar w-0.5 rounded-full bg-current" style={{ height: '75%', animationDelay: '120ms' }} />
                    <span className="eq-bar w-0.5 rounded-full bg-current" style={{ height: '95%', animationDelay: '240ms' }} />
                    <span className="eq-bar w-0.5 rounded-full bg-current" style={{ height: '65%', animationDelay: '80ms' }} />
                  </span>
                )}
              </button>

              {topRegion && topRegion.id !== region.id && (
                <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-black/45 px-2.5 py-1 text-xs text-white/90 backdrop-blur-md">
                  <MapPin className="h-3 w-3" aria-hidden="true" />
                  {topRegion.city}
                </span>
              )}
            </div>

            <div>
              <h2 className="font-display text-3xl font-bold leading-tight tracking-tight text-white">
                {topCard.title}
              </h2>
              <p className="mt-0.5 text-sm font-medium text-white/75">
                {topCard.subtitle}, {topCard.neighborhood}
              </p>
            </div>

            <p className="line-clamp-2 text-sm font-medium leading-snug text-white/95">
              {topCard.seekingOrOffer}
            </p>

            <div className="flex items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-1.5">
                {topCard.genres.slice(0, 3).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onOpenDetails(topCard)}
                className="shrink-0 rounded-full border border-white/20 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                Details
              </button>
            </div>
          </div>
        </article>
      </div>

      {/* Floating glass thumb controls */}
      <div className="mt-5 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last swipe"
          className="glass-surface inline-flex h-12 w-12 items-center justify-center rounded-full text-[var(--muted)] transition hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => triggerSwipe('pass')}
          aria-label={`Pass on ${topCard.title}`}
          className="glass-surface inline-flex h-15 w-15 items-center justify-center rounded-full text-[var(--err)] transition hover:scale-105 active:scale-95"
        >
          <X className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails(topCard)}
          aria-label={`Inspect details for ${topCard.title}`}
          className="glass-surface inline-flex h-12 w-12 items-center justify-center rounded-full text-[var(--ink)] transition hover:scale-105"
        >
          <Info className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => triggerSwipe('like')}
          aria-label={mode === 'jam' ? `Jam with ${topCard.title}` : `Book ${topCard.title}`}
          className="inline-flex h-15 w-15 items-center justify-center rounded-full transition hover:scale-105 active:scale-95"
          style={{
            backgroundColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
            color: mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
            boxShadow:
              mode === 'jam'
                ? '0 10px 30px rgba(255, 59, 107, 0.42)'
                : '0 10px 30px rgba(16, 232, 138, 0.35)',
          }}
        >
          {mode === 'jam' ? (
            <Flame className="h-7 w-7 fill-current" aria-hidden="true" />
          ) : (
            <Ticket className="h-7 w-7" aria-hidden="true" />
          )}
        </button>
      </div>

      <p className="mt-3 hidden text-xs text-[var(--muted)] md:block">
        Arrow keys to swipe or inspect, Space to preview groove, Z to undo
      </p>
    </div>
  );
}
