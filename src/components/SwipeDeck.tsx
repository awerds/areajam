import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flame, Info, MapPin, Maximize2, MessageCircle, RotateCcw, Ticket, Volume2, VolumeX, X } from 'lucide-react';
import type { AppMode, JamInvite, Listing, Region, SwipeDecision } from '../types';
import { getProfileActionState } from '../lib/firestorePilot';
import { estimateRoughDistanceMiles, formatRoughDistance } from '../lib/location';
import { AreaJamMark } from './BrandLogo';
import { ClipPlayer } from './ClipPlayer';
import { InstrumentBadgeRow } from './InstrumentIcons';

interface SwipeDeckProps {
  cards: Listing[];
  mode: AppMode;
  region: Region;
  allRegions: Region[];
  canUndo: boolean;
  includeNearbyRegions: boolean;
  showingNearestFallback?: boolean;
  showSampleCards?: boolean;
  filterKey?: string;
  soundEnabled: boolean;
  currentUserUid?: string;
  inviteByTargetUid?: Record<string, JamInvite>;
  onToggleSound: () => void;
  onSwipe: (listing: Listing, decision: SwipeDecision) => void;
  onUndo: () => void;
  onOpenDetails: (listing: Listing) => void;
  onOpenProfile: (listing: Listing) => void;
  onInvite: (listing: Listing) => void;
  onOpenInvites: (threadId?: string) => void;
  onEnableNearby: () => void;
  onToggleSampleCards?: () => void;
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
  showingNearestFallback = false,
  showSampleCards = true,
  filterKey = '',
  soundEnabled,
  currentUserUid,
  inviteByTargetUid,
  onToggleSound,
  onSwipe,
  onUndo,
  onOpenDetails,
  onOpenProfile,
  onInvite,
  onOpenInvites,
  onEnableNearby,
  onToggleSampleCards,
  onResetPassed,
  onGoToPost,
}: SwipeDeckProps) {
  const [dragState, setDragState] = useState({ x: 0, dragging: false });
  const [flyDir, setFlyDir] = useState<SwipeDecision | null>(null);

  const cardRef = useRef<HTMLElement>(null);
  const nextCardRef = useRef<HTMLElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);
  const emptyRef = useRef<HTMLDivElement>(null);
  const prevFilterKeyRef = useRef(filterKey);
  const startRef = useRef<{ x: number; y: number; pointerId: number } | null>(null);
  const tiltQuickToRef = useRef<{
    rx: gsap.QuickToFunc;
    ry: gsap.QuickToFunc;
  } | null>(null);

  const topCard = cards[0];
  const nextCard = cards[1];

  useEffect(() => {
    setDragState({ x: 0, dragging: false });
    setFlyDir(null);
    startRef.current = null;
  }, [topCard?.id]);

  useLayoutEffect(() => {
    const isFilterChange = prevFilterKeyRef.current !== filterKey;
    prevFilterKeyRef.current = filterKey;

    const el = cardRef.current;
    const emptyEl = emptyRef.current;

    if (!topCard || !el) {
      if (!topCard && emptyEl && isFilterChange) {
        const mmEmpty = gsap.matchMedia();
        mmEmpty.add('(prefers-reduced-motion: no-preference)', () => {
          gsap.fromTo(
            emptyEl,
            { y: 14, opacity: 0, scale: 0.97 },
            { y: 0, opacity: 1, scale: 1, duration: 0.28, ease: 'power2.out', clearProps: 'transform,opacity' }
          );
        });
        return () => mmEmpty.revert();
      }
      return;
    }

    const mm = gsap.matchMedia();
    mm.add(
      {
        motion: '(prefers-reduced-motion: no-preference)',
        finePointer: '(pointer: fine) and (prefers-reduced-motion: no-preference)',
      },
      (context) => {
        const { motion, finePointer } = context.conditions ?? {};
        if (motion) {
          if (isFilterChange) {
            gsap.fromTo(
              el,
              { scale: 0.91, y: 26, opacity: 0, rotationZ: -2.5, rotationX: 7, x: 0 },
              {
                scale: 1,
                y: 0,
                opacity: 1,
                rotationZ: 0,
                rotationX: 0,
                duration: 0.42,
                ease: 'back.out(1.25)',
                clearProps: 'transform,opacity',
              }
            );
            if (nextCardRef.current) {
              gsap.fromTo(
                nextCardRef.current,
                { scale: 0.88, y: 34, opacity: 0 },
                { scale: 0.94, y: 14, opacity: 0.65, duration: 0.36, delay: 0.05, ease: 'power3.out' }
              );
            }
          } else {
            gsap.fromTo(
              el,
              { scale: 0.95, y: 12, opacity: 0.85, x: 0, rotation: 0 },
              { scale: 1, y: 0, opacity: 1, duration: 0.34, ease: 'power3.out', clearProps: 'transform' }
            );
          }
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
  }, [topCard?.id, filterKey]);

  const triggerSwipe = (decision: SwipeDecision) => {
    if (!topCard || flyDir) return;
    const el = cardRef.current;

    if (decision === 'like' && !topCard.isSample) {
      if (el) {
        gsap.to(el, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 0.2,
          ease: 'power2.out',
        });
      }
      const action = getProfileActionState(topCard, currentUserUid, inviteByTargetUid);
      if (action.kind === 'accepted') {
        onOpenInvites(action.invite.threadId);
      } else if (action.kind === 'incoming' || action.kind === 'sent') {
        onOpenInvites();
      } else if (action.kind === 'self') {
        onOpenProfile(topCard);
      } else {
        onInvite(topCard);
      }
      return;
    }

    setFlyDir(decision);
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
        onOpenProfile(topCard);
      } else if ((e.key === 'm' || e.key === 'M') && topCard) {
        e.preventDefault();
        onToggleSound();
      } else if (e.key === ' ' && topCard && !(target && target.closest('button, a'))) {
        e.preventDefault();
        onToggleSound();
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
      <div
        ref={emptyRef}
        className="glass-surface mx-auto flex w-full max-w-[25rem] flex-col items-center justify-center rounded-[2rem] px-7 py-12 text-center"
      >
        <AreaJamMark className="mb-3 h-10 w-10" />
        <span className="mb-4 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-1 text-xs font-medium text-[var(--muted)]">
          {region.label} — Jam board
        </span>
        <h2 className="font-display text-2xl font-bold tracking-tight">
          {canUndo
            ? 'You have checked every musician here'
            : `No live musicians posted in ${region.city} yet`}
        </h2>
        <p className="mt-2.5 max-w-xs text-sm leading-relaxed text-[var(--muted)]">
          Create a profile to help other musicians in {region.city} find you, or explore another city.
        </p>

        <div className="mt-6 flex w-full max-w-xs flex-col gap-2.5">
          <button
            type="button"
            onClick={onGoToPost}
            className="rounded-2xl px-4 py-3 text-sm font-bold transition hover:opacity-90"
            style={{
              backgroundColor: 'var(--jam)',
              color: 'var(--jam-ink)',
            }}
          >
            Create live profile in {region.city}
          </button>
          {!includeNearbyRegions && (
            <button
              type="button"
              onClick={onEnableNearby}
              className="rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              Show players across US cities
            </button>
          )}
          {showSampleCards === false && onToggleSampleCards && (
            <button
              type="button"
              onClick={onToggleSampleCards}
              className="rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              Show sample profiles
            </button>
          )}
          {canUndo && (
            <button
              type="button"
              onClick={onResetPassed}
              className="rounded-2xl border border-transparent px-4 py-2 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              Review passed cards
            </button>
          )}
        </div>
      </div>
    );
  }

  const topAction = getProfileActionState(topCard, currentUserUid, inviteByTargetUid);
  const topCardRegion = allRegions.find((r) => r.id === topCard.regionId);
  const topDistanceMiles =
    topCard.regionId !== region.id
      ? estimateRoughDistanceMiles(region, topCardRegion)
      : null;
  const topRoughDistanceCompact =
    topCard.regionId !== region.id
      ? formatRoughDistance(topDistanceMiles, region, topCardRegion, 'compact')
      : null;
  const topRoughDistanceVerbose =
    topCard.regionId !== region.id
      ? formatRoughDistance(topDistanceMiles, region, topCardRegion, 'verbose')
      : null;

  const likeOpacity = flyDir === 'like' ? 1 : Math.min(1, Math.max(0, (dragState.x - 24) / 80));
  const passOpacity = flyDir === 'pass' ? 1 : Math.min(1, Math.max(0, (-dragState.x - 24) / 80));
  const positiveLabel = mode === 'jam' ? 'Jam' : 'Book';

  const topFeaturedClip =
    (topCard.featuredClipId
      ? topCard.clips.find((c) => c.id === topCard.featuredClipId)
      : undefined) ?? topCard.clips[0];
  const topIsEmbed = topFeaturedClip?.kind === 'embed' && Boolean(topFeaturedClip.embedUrl);
  const topLocationLabel =
    topCard.regionId !== region.id && topCardRegion
      ? `${topCardRegion.city}${topCardRegion.state ? `, ${topCardRegion.state}` : ''}`
      : `${topCard.neighborhood}, ${getRegionAreaCode(topCard.regionId)}`;

  const nextCardRegion = nextCard ? allRegions.find((r) => r.id === nextCard.regionId) : undefined;
  const nextLocationLabel = nextCard
    ? nextCard.regionId !== region.id && nextCardRegion
      ? `${nextCardRegion.city}${nextCardRegion.state ? `, ${nextCardRegion.state}` : ''}`
      : `${nextCard.neighborhood}, ${getRegionAreaCode(nextCard.regionId)}`
    : '';

  return (
    <div className="mx-auto flex w-full flex-col items-center md:max-w-[24rem]">
      {showingNearestFallback && (
        <div className="mb-2.5 flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-2 text-xs backdrop-blur-md">
          <span className="flex min-w-0 items-start gap-2 font-medium leading-snug text-[var(--ink)]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
            <span>
              No players in {region.city} yet. Showing the nearest listed players.
            </span>
          </span>
          <button
            type="button"
            onClick={onGoToPost}
            className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-solid)] px-2.5 py-1 font-bold text-[var(--accent-text)] transition hover:bg-[var(--surface-hover)]"
          >
            Be first
          </button>
        </div>
      )}
      <div className="deck-perspective reel-aspect relative mx-auto w-[min(100%,calc((100dvh-var(--mobile-deck-offset,13.25rem))*0.5625))] select-none md:w-[min(100%,21rem,calc(68dvh*0.5625))] lg:w-[min(100%,23.5rem,calc(71dvh*0.5625))]">
        {nextCard && (
          <article
            ref={nextCardRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border)] bg-[#10131d] shadow-[0_24px_60px_var(--glass-shadow)] md:flex md:rounded-[2rem]"
            style={{
              transform: 'translate3d(0, 14px, 0) scale(0.94)',
              opacity: 0.65,
            }}
          >
            <ClipPlayer
              listing={nextCard}
              areaCode={getRegionAreaCode(nextCard.regionId)}
              isActive={false}
              soundEnabled={false}
              showMetadataOverlay={false}
              hideClipTitle
            />
            <div
              className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, rgba(10,12,20,0.45) 42%, rgba(10,12,20,0.92) 86%)',
              }}
            />
            <div className="dark-stage pointer-events-none absolute inset-x-0 bottom-0 p-5">
              <p className="truncate text-xs font-medium text-white/75">{nextLocationLabel}</p>
              <h3 className="font-display truncate text-2xl font-bold text-white">{nextCard.title}</h3>
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
          className={`isolate absolute inset-0 flex touch-pan-y cursor-grab flex-col overflow-hidden rounded-[1.75rem] border border-[var(--border)] shadow-[0_24px_60px_var(--glass-shadow)] active:cursor-grabbing md:rounded-[2rem] ${
            topIsEmbed ? 'bg-[var(--surface-solid)]' : 'bg-[#10131d]'
          }`}
        >
          {/* Media stage (full-bleed vertical for video/portrait, 2-zone split for iframe embeds) */}
          <div className={`relative overflow-hidden ${topIsEmbed ? 'min-h-0 flex-1' : 'h-full w-full'}`}>
            <ClipPlayer
              listing={topCard}
              areaCode={getRegionAreaCode(topCard.regionId)}
              isActive={!flyDir}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              hideClipTitle={!topIsEmbed}
            />

            <div ref={glareRef} className="card-glare absolute inset-0 opacity-0" aria-hidden="true" />

            {/* Floating swipe decision stamps */}
            <div
              aria-hidden="true"
              className="font-display pointer-events-none absolute left-5 top-16 z-20 -rotate-12 rounded-2xl border bg-[var(--surface-solid)]/90 px-4 py-1.5 text-2xl font-bold backdrop-blur-md"
              style={{
                opacity: likeOpacity,
                borderColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                color: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
              }}
            >
              {positiveLabel}
            </div>
            <div
              aria-hidden="true"
              className="font-display pointer-events-none absolute right-5 top-16 z-20 rotate-12 rounded-2xl border border-[var(--err)] bg-[var(--surface-solid)]/90 px-4 py-1.5 text-2xl font-bold text-[var(--err)] backdrop-blur-md"
              style={{ opacity: passOpacity }}
            >
              Pass
            </div>

            {/* Mobile right-edge action rail inside media stage */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-3 right-2.5 z-20 flex flex-col items-center gap-1.5 md:hidden"
            >
              <button
                type="button"
                onClick={() => triggerSwipe('like')}
                aria-label={mode === 'jam' ? `Jam with ${topCard.title}` : `Book ${topCard.title}`}
                className="inline-flex h-11 w-11 items-center justify-center rounded-full shadow-lg transition active:scale-90"
                style={{
                  backgroundColor: mode === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                  color: mode === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                }}
              >
                {mode === 'jam' ? (
                  <Flame className="h-5 w-5 fill-current" aria-hidden="true" />
                ) : (
                  <Ticket className="h-5 w-5" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={() => triggerSwipe('pass')}
                aria-label={`Pass on ${topCard.title}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-[var(--err)] backdrop-blur-md active:scale-90"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onOpenProfile(topCard)}
                aria-label={`Open full profile page for ${topCard.title}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white backdrop-blur-md active:scale-90"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? 'Mute sound' : 'Turn sound on'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white backdrop-blur-md active:scale-90"
              >
                {soundEnabled ? (
                  <Volume2 className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
                ) : (
                  <VolumeX className="h-4 w-4" aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                onClick={onUndo}
                disabled={!canUndo}
                aria-label="Undo last swipe"
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/25 bg-black/65 text-white backdrop-blur-md disabled:opacity-35"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            {!topIsEmbed && (
              <>
                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%]"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 0%, rgba(10,12,20,0.42) 38%, rgba(10,12,20,0.92) 82%, rgba(10,12,20,0.98) 100%)',
                  }}
                />

                <div className="dark-stage absolute inset-x-0 bottom-0 z-10 p-4 pr-16 md:p-5 md:pr-5">
                  <div className="flex flex-wrap items-center gap-1.5 text-xs font-medium text-white/85">
                    <span className="truncate">{topLocationLabel}</span>
                    {topRoughDistanceCompact && (
                      <span
                        title={topRoughDistanceVerbose ?? undefined}
                        aria-label={topRoughDistanceVerbose ?? topRoughDistanceCompact}
                        className="shrink-0 rounded-full border border-white/25 bg-black/50 px-2 py-0.5 text-[10px] font-bold text-[#ff85a6]"
                      >
                        {topRoughDistanceCompact}
                      </span>
                    )}
                    {topCard.isSample && (
                      <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white/90">
                        Fictional sample
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenProfile(topCard)}
                    className="mt-1 block w-full text-left transition hover:opacity-85"
                  >
                    <h2 className="font-display truncate text-2xl font-bold leading-tight tracking-tight text-white">
                      {topCard.title}
                    </h2>
                  </button>
                  <p className="mt-0.5 truncate text-xs font-medium text-white/80 sm:text-sm">
                    {topCard.subtitle}
                  </p>

                  <div
                    onPointerDown={(e) => e.stopPropagation()}
                    className="mt-2.5 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0 flex-1 overflow-hidden">
                      <InstrumentBadgeRow instruments={topCard.instruments} compact max={2} />
                    </div>

                    <div className="flex shrink-0 items-center gap-1.5">
                      {!topCard.isSample && topAction.kind !== 'self' && (
                        <button
                          type="button"
                          onClick={() => {
                            if (topAction.kind === 'accepted') {
                              onOpenInvites(topAction.invite.threadId);
                            } else if (topAction.kind === 'incoming' || topAction.kind === 'sent') {
                              onOpenInvites();
                            } else {
                              onInvite(topCard);
                            }
                          }}
                          className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-90"
                          style={
                            topAction.kind === 'sent'
                              ? {
                                  backgroundColor: 'rgba(255,255,255,0.14)',
                                  color: '#ffffff',
                                  border: '1px solid rgba(255,255,255,0.28)',
                                }
                              : {
                                  backgroundColor: 'var(--jam)',
                                  color: 'var(--jam-ink)',
                                }
                          }
                        >
                          {topAction.kind === 'accepted' ? (
                            <MessageCircle className="h-3 w-3" aria-hidden="true" />
                          ) : (
                            <Flame className="h-3 w-3 fill-current" aria-hidden="true" />
                          )}
                          <span>{topAction.label}</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => onOpenProfile(topCard)}
                        className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-white/25 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/65"
                      >
                        <Maximize2 className="h-3 w-3" aria-hidden="true" />
                        <span>Profile</span>
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          {topIsEmbed && (
            <div className="relative z-10 shrink-0 border-t border-[var(--border)] bg-[var(--surface-solid)] p-3.5 pr-16 sm:p-4 md:pr-4">
              <div className="flex items-start justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onOpenProfile(topCard)}
                  className="min-w-0 text-left transition hover:opacity-80"
                >
                  <h2 className="font-display truncate text-lg font-bold leading-tight text-[var(--ink)] sm:text-xl">
                    {topCard.title}
                  </h2>
                </button>
                <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-[var(--muted)]">
                  <span className="truncate">{topLocationLabel}</span>
                  {topRoughDistanceCompact && (
                    <span
                      title={topRoughDistanceVerbose ?? undefined}
                      aria-label={topRoughDistanceVerbose ?? topRoughDistanceCompact}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent-text)]"
                    >
                      {topRoughDistanceCompact}
                    </span>
                  )}
                </span>
              </div>

              <div
                onPointerDown={(e) => e.stopPropagation()}
                className="mt-2 flex items-center justify-between gap-2"
              >
                <div className="min-w-0">
                  <InstrumentBadgeRow instruments={topCard.instruments} compact max={2} />
                </div>

                <div className="flex shrink-0 items-center gap-1.5">
                  {!topCard.isSample && topAction.kind !== 'self' && (
                    <button
                      type="button"
                      onClick={() => {
                        if (topAction.kind === 'accepted') {
                          onOpenInvites(topAction.invite.threadId);
                        } else if (topAction.kind === 'incoming' || topAction.kind === 'sent') {
                          onOpenInvites();
                        } else {
                          onInvite(topCard);
                        }
                      }}
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition hover:opacity-90"
                      style={
                        topAction.kind === 'sent'
                          ? {
                              backgroundColor: 'var(--pill-bg)',
                              color: 'var(--ink)',
                              border: '1px solid var(--border-strong)',
                            }
                          : {
                              backgroundColor: 'var(--jam)',
                              color: 'var(--jam-ink)',
                            }
                      }
                    >
                      {topAction.kind === 'accepted' ? (
                        <MessageCircle className="h-3 w-3" aria-hidden="true" />
                      ) : (
                        <Flame className="h-3 w-3 fill-current" aria-hidden="true" />
                      )}
                      <span>{topAction.label}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onOpenProfile(topCard)}
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                  >
                    <Maximize2 className="h-3 w-3" aria-hidden="true" />
                    <span>Profile</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </article>
      </div>

      {/* Tablet & Desktop floating action orbs */}
      <div className="mt-2.5 hidden items-center justify-center gap-3 md:flex">
        <button
          type="button"
          onClick={onUndo}
          disabled={!canUndo}
          aria-label="Undo last swipe"
          className="glass-surface inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--muted)] transition hover:text-[var(--ink)] disabled:cursor-not-allowed disabled:opacity-35"
        >
          <RotateCcw className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => triggerSwipe('pass')}
          aria-label={`Pass on ${topCard.title}`}
          className="glass-surface inline-flex h-12 w-12 items-center justify-center rounded-full text-[var(--err)] transition hover:scale-105 active:scale-95"
        >
          <X className="h-6 w-6 stroke-[2.25]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails(topCard)}
          aria-label={`Quick gear & rig summary for ${topCard.title}`}
          className="glass-surface inline-flex h-10 w-10 items-center justify-center rounded-full text-[var(--ink)] transition hover:scale-105"
        >
          <Info className="h-4 w-4" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => triggerSwipe('like')}
          aria-label={mode === 'jam' ? `Jam with ${topCard.title}` : `Book ${topCard.title}`}
          className="inline-flex h-12 w-12 items-center justify-center rounded-full transition hover:scale-105 active:scale-95"
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
            <Flame className="h-6 w-6 fill-current" aria-hidden="true" />
          ) : (
            <Ticket className="h-6 w-6" aria-hidden="true" />
          )}
        </button>
      </div>

      <p className="mt-1.5 hidden whitespace-nowrap text-center text-xs text-[var(--muted)] md:block">
        Arrows to swipe, Up for page, Space/M sound, Z undo
      </p>
    </div>
  );
}
