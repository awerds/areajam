import { useEffect, useRef, useState } from 'react';
import { Flame, Info, MapPin, RotateCcw, Ticket, X } from 'lucide-react';
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
  const [drag, setDrag] = useState({ x: 0, y: 0, dragging: false });
  const [flyDir, setFlyDir] = useState<SwipeDecision | null>(null);
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const flyTimeoutRef = useRef<number | undefined>(undefined);

  const topCard = cards[0];
  const nextCard = cards[1];

  useEffect(() => {
    setDrag({ x: 0, y: 0, dragging: false });
    setFlyDir(null);
    startRef.current = null;
  }, [topCard?.id]);

  useEffect(() => {
    return () => window.clearTimeout(flyTimeoutRef.current);
  }, []);

  const triggerSwipe = (decision: SwipeDecision) => {
    if (!topCard || flyDir) return;
    setFlyDir(decision);
    window.clearTimeout(flyTimeoutRef.current);
    flyTimeoutRef.current = window.setTimeout(() => {
      onSwipe(topCard, decision);
    }, 180);
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
      } else if ((e.key === 'z' || e.key === 'Z') && !e.metaKey && !e.ctrlKey && canUndo) {
        e.preventDefault();
        onUndo();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!topCard || flyDir) return;
    if ((e.target as HTMLElement).closest('button, a')) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    startRef.current = { x: e.clientX, y: e.clientY, pointerId: e.pointerId };
    setDrag({ x: 0, y: 0, dragging: true });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current || startRef.current.pointerId !== e.pointerId) return;
    setDrag({
      x: e.clientX - startRef.current.x,
      y: e.clientY - startRef.current.y,
      dragging: true,
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!startRef.current || startRef.current.pointerId !== e.pointerId) return;
    const dx = e.clientX - startRef.current.x;
    startRef.current = null;

    if (dx > 92) {
      triggerSwipe('like');
    } else if (dx < -92) {
      triggerSwipe('pass');
    } else {
      setDrag({ x: 0, y: 0, dragging: false });
    }
  };

  const getRegionAreaCode = (regionId: string) =>
    allRegions.find((r) => r.id === regionId)?.areaCode ?? region.areaCode;

  if (!topCard) {
    return (
      <div className="deck-frame mx-auto flex w-full max-w-md flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-[var(--border)] bg-[var(--surface)] px-6 py-12 text-center">
        <span className="font-mono-code mb-3 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs uppercase tracking-widest text-[var(--muted)]">
          {region.label} · {mode === 'jam' ? 'Jam Deck' : 'Gigs Deck'}
        </span>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">
          You&apos;ve seen the local {mode === 'jam' ? 'players' : 'gigs'} here
        </h2>
        <p className="mt-2 max-w-xs text-sm text-[var(--muted)]">
          Pull in neighboring cities, review cards you passed on, or pin your own flyer to the {region.city} board.
        </p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
          {!includeNearbyRegions && (
            <button
              type="button"
              onClick={onEnableNearby}
              className="rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                color: mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
              }}
            >
              Include Other Cities
            </button>
          )}
          <button
            type="button"
            onClick={onResetPassed}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:opacity-85"
          >
            Review Passed Cards
          </button>
          <button
            type="button"
            onClick={onGoToPost}
            className="rounded-xl border border-[var(--border)] bg-transparent px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
          >
            Post Your Own Flyer
          </button>
        </div>
      </div>
    );
  }

  const effectiveX = flyDir === 'like' ? 460 : flyDir === 'pass' ? -460 : drag.x;
  const effectiveY = flyDir ? 32 : drag.y * 0.3;
  const rotation = flyDir === 'like' ? 16 : flyDir === 'pass' ? -16 : drag.x * 0.045;
  const likeOpacity = flyDir === 'like' ? 1 : Math.min(1, Math.max(0, (drag.x - 24) / 80));
  const passOpacity = flyDir === 'pass' ? 1 : Math.min(1, Math.max(0, (-drag.x - 24) / 80));
  const nextScale = 0.95 + Math.min(1, Math.abs(effectiveX) / 260) * 0.05;

  const positiveLabel = mode === 'jam' ? 'JAM' : 'BOOK';
  const topRegion = allRegions.find((r) => r.id === topCard.regionId);

  return (
    <div className="deck-frame mx-auto flex w-full max-w-md flex-col items-center">
      {/* Card stack viewport */}
      <div className="relative h-[30.5rem] w-full select-none">
        {nextCard && (
          <article
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] opacity-75 shadow-lg transition-transform duration-150"
            style={{ transform: `scale(${nextScale}) translateY(10px)` }}
          >
            <CardArtwork listing={nextCard} areaCode={getRegionAreaCode(nextCard.regionId)} />
            <div className="p-4">
              <h3 className="font-display text-xl font-extrabold">{nextCard.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{nextCard.subtitle}</p>
            </div>
          </article>
        )}

        <article
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className="absolute inset-0 flex touch-pan-y cursor-grab flex-col overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] shadow-[0_22px_55px_rgba(0,0,0,0.28)] active:cursor-grabbing"
          style={{
            transform: `translate3d(${effectiveX}px, ${effectiveY}px, 0) rotate(${rotation}deg)`,
            transition: drag.dragging
              ? 'none'
              : 'transform 220ms cubic-bezier(0.22, 1, 0.36, 1), opacity 220ms ease',
            opacity: flyDir ? 0.15 : 1,
          }}
        >
          <div className="relative">
            <CardArtwork listing={topCard} areaCode={getRegionAreaCode(topCard.regionId)} />

            {/* Rubber-stamp feedback */}
            <div
              aria-hidden="true"
              className="font-display pointer-events-none absolute left-4 top-12 -rotate-12 rounded-xl border-4 px-3 py-1 text-2xl font-extrabold tracking-widest"
              style={{
                opacity: likeOpacity,
                borderColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                color: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                backgroundColor: 'rgba(14, 13, 11, 0.72)',
              }}
            >
              {positiveLabel}
            </div>
            <div
              aria-hidden="true"
              className="font-display pointer-events-none absolute right-4 top-12 rotate-12 rounded-xl border-4 border-[var(--err)] bg-black/70 px-3 py-1 text-2xl font-extrabold tracking-widest text-[var(--err)]"
              style={{ opacity: passOpacity }}
            >
              PASS
            </div>
          </div>

          <div className="flex flex-1 flex-col justify-between p-4">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h2 className="font-display text-2xl font-extrabold leading-tight tracking-tight">
                    {topCard.title}
                  </h2>
                  <p className="mt-0.5 text-sm font-medium text-[var(--muted)]">{topCard.subtitle}</p>
                </div>
                {topRegion && topRegion.id !== region.id && (
                  <span className="font-mono-code inline-flex shrink-0 items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)]">
                    <MapPin className="h-3 w-3" aria-hidden="true" />
                    {topRegion.city}
                  </span>
                )}
              </div>

              <p className="mt-3 text-[15px] font-semibold leading-snug text-[var(--ink)]">
                {topCard.seekingOrOffer}
              </p>

              <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-[var(--muted)]">
                {topCard.bio}
              </p>
            </div>

            <div className="mt-3 flex flex-col gap-2.5">
              <div className="flex flex-wrap gap-1.5">
                {topCard.genres.slice(0, 3).map((g) => (
                  <span
                    key={g}
                    className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink)]"
                  >
                    {g}
                  </span>
                ))}
                {topCard.tags.slice(0, 2).map((t) => (
                  <span
                    key={t}
                    className="font-mono-code rounded-full border border-[var(--border)] px-2.5 py-0.5 text-[11px] text-[var(--muted)]"
                  >
                    {t}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between border-t border-[var(--border)] pt-2.5 text-xs text-[var(--muted)]">
                <span className="truncate">{topCard.availability}</span>
                <button
                  type="button"
                  onClick={() => onOpenDetails(topCard)}
                  className="shrink-0 font-semibold text-[var(--ink)] underline decoration-[var(--border)] underline-offset-4 hover:opacity-80"
                >
                  Gear &amp; Details →
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Thumb action bar */}
      <div className="mt-4 flex items-center justify-center gap-4">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last swipe"
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--muted)] shadow-sm transition hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <RotateCcw className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => triggerSwipe('pass')}
          aria-label={`Pass on ${topCard.title}`}
          className="inline-flex h-15 w-15 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--err)] shadow-md transition hover:scale-105 active:scale-95"
        >
          <X className="h-7 w-7 stroke-[2.5]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails(topCard)}
          aria-label={`Inspect details for ${topCard.title}`}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface)] text-[var(--ink)] shadow-sm transition hover:scale-105"
        >
          <Info className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => triggerSwipe('like')}
          aria-label={mode === 'jam' ? `Jam with ${topCard.title}` : `Book ${topCard.title}`}
          className="inline-flex h-15 w-15 items-center justify-center rounded-full shadow-lg transition hover:scale-105 active:scale-95"
          style={{
            backgroundColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
            color: mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
          }}
        >
          {mode === 'jam' ? (
            <Flame className="h-7 w-7 fill-current" aria-hidden="true" />
          ) : (
            <Ticket className="h-7 w-7" aria-hidden="true" />
          )}
        </button>
      </div>
    </div>
  );
}
