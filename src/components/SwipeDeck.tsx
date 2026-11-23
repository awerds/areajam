import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Flame, Info, Instagram, MapPin, Maximize2, MessageCircle, RotateCcw, Ticket, Volume2, VolumeX, X } from 'lucide-react';
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
  showingSampleFallback?: boolean;
  showSampleCards: boolean;
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
  onToggleSampleCards: () => void;
  onResetPassed: () => void;
  onGoToPost: () => void;
}

function sideBadgeLabel(listing: Listing): string {
  if (listing.side === 'jam') return 'Jam session';
  return listing.gigSubtype === 'open-gig' ? 'Open gig slot' : 'Band for hire';
}

export function SwipeDeck({
  cards,
  mode,
  region,
  allRegions,
  canUndo,
  includeNearbyRegions,
  showingNearestFallback = false,
  showingSampleFallback = false,
  showSampleCards,
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
      <div className="glass-surface mx-auto flex w-full max-w-[25rem] flex-col items-center justify-center rounded-[2rem] px-7 py-12 text-center">
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
          Be one of the first players in {region.city}, turn on sample profiles with the Samples switch, or post your own card.
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
          <button
            type="button"
            onClick={onToggleSampleCards}
            className="rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
          >
            {showSampleCards ? 'Turn off sample profiles' : 'Turn on sample profiles'}
          </button>
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

  return (
    <div className="mx-auto flex w-full max-w-[25rem] flex-col items-center">
      {(showingNearestFallback || showingSampleFallback) && (
        <div className="mb-3 flex w-full items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-2.5 text-xs backdrop-blur-md">
          <span className="flex min-w-0 items-start gap-2 font-medium leading-snug text-[var(--ink)]">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
            <span>
              {showingNearestFallback && showingSampleFallback
                ? `No live players in ${region.city} yet — showing nearest sample demos`
                : showingNearestFallback
                  ? `No players in ${region.city} yet — showing nearest`
                  : `No live players in ${region.city} yet — showing sample demos`}
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
      <div className="deck-perspective relative h-auto w-full select-none md:h-[min(68dvh,37rem)]">
        {nextCard && (
          <article
            ref={nextCardRef}
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 hidden flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-solid)] shadow-[0_24px_60px_var(--glass-shadow)] md:flex"
            style={{
              transform: 'translate3d(0, 14px, 0) scale(0.94)',
              opacity: 0.65,
            }}
          >
            <div className="relative min-h-[12rem] flex-1 overflow-hidden">
              <ClipPlayer
                listing={nextCard}
                areaCode={getRegionAreaCode(nextCard.regionId)}
                isActive={false}
                soundEnabled={false}
                showMetadataOverlay={false}
              />
            </div>
            <div className="shrink-0 border-t border-[var(--border)] bg-[var(--surface-solid)] p-5">
              <h3 className="font-display text-2xl font-bold text-[var(--ink)]">{nextCard.title}</h3>
              <p className="mt-1 text-sm text-[var(--muted)]">{nextCard.subtitle}</p>
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
          className="relative flex touch-pan-y cursor-grab flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-solid)] shadow-[0_24px_60px_var(--glass-shadow)] active:cursor-grabbing md:absolute md:inset-0"
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Zone 1: Adaptive video / artwork media stage */}
          <div className="relative h-[11rem] shrink-0 overflow-hidden sm:h-[12.5rem] md:h-auto md:min-h-[13rem] md:flex-1">
            <ClipPlayer
              listing={topCard}
              areaCode={getRegionAreaCode(topCard.regionId)}
              isActive={!flyDir}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
            />

            <div ref={glareRef} className="card-glare absolute inset-0 opacity-0" aria-hidden="true" />

            {/* Floating swipe decision stamps */}
            <div
              aria-hidden="true"
              className="font-display pointer-events-none absolute left-5 top-16 -rotate-12 rounded-2xl border bg-[var(--surface-solid)]/90 px-4 py-1.5 text-2xl font-bold backdrop-blur-md"
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
              className="font-display pointer-events-none absolute right-5 top-16 rotate-12 rounded-2xl border border-[var(--err)] bg-[var(--surface-solid)]/90 px-4 py-1.5 text-2xl font-bold text-[var(--err)] backdrop-blur-md"
              style={{ opacity: passOpacity }}
            >
              Pass
            </div>

            {/* Mobile right-edge action rail inside media stage */}
            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="absolute bottom-3 right-3 z-20 flex flex-col items-center gap-2 md:hidden"
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--err)] backdrop-blur-md active:scale-90"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={() => onOpenProfile(topCard)}
                aria-label={`Open full profile page for ${topCard.title}`}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)] backdrop-blur-md active:scale-90"
              >
                <Maximize2 className="h-4 w-4" aria-hidden="true" />
              </button>

              <button
                type="button"
                onClick={onToggleSound}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? 'Mute sound' : 'Turn sound on'}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)] backdrop-blur-md active:scale-90"
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
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)] backdrop-blur-md disabled:opacity-35"
              >
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Zone 2: Solid high-contrast card info panel */}
          <div className="relative z-10 flex shrink-0 flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface-solid)] p-3.5 sm:gap-2.5 sm:p-5">
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex min-w-0 items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 font-semibold text-[var(--ink)]">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{
                      backgroundColor: topCard.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                    }}
                  />
                  <span>{sideBadgeLabel(topCard)}</span>
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                  {topCard.isSample ? 'Sample demo' : 'Live'}
                </span>
                {topCard.instagramHandle && (
                  <a
                    href={`https://www.instagram.com/${topCard.instagramHandle}/`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onPointerDown={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 truncate rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--jam-text)] hover:bg-[var(--surface-hover)]"
                  >
                    <Instagram className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">@{topCard.instagramHandle}</span>
                  </a>
                )}
              </div>
              <span className="flex min-w-0 items-center justify-end gap-1.5 truncate font-medium text-[var(--muted)]">
                <span className="truncate">
                  {topCard.regionId !== region.id && topCardRegion
                    ? `${topCardRegion.city}${topCardRegion.state ? `, ${topCardRegion.state}` : ''}`
                    : `${topCard.neighborhood}, ${getRegionAreaCode(topCard.regionId)}`}
                </span>
                {topRoughDistanceCompact && (
                  <span
                    title={topRoughDistanceVerbose ?? undefined}
                    aria-label={topRoughDistanceVerbose ?? topRoughDistanceCompact}
                    className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--surface-subtle)] px-2 py-0.5 text-[10px] font-bold text-[var(--accent-text)]"
                  >
                    {topRoughDistanceCompact}
                  </span>
                )}
              </span>
            </div>

            <InstrumentBadgeRow instruments={topCard.instruments} compact max={4} />

            <div>
              <button
                type="button"
                onClick={() => onOpenProfile(topCard)}
                className="text-left transition hover:opacity-80"
              >
                <h2 className="font-display text-xl font-bold leading-tight tracking-tight text-[var(--ink)] sm:text-[1.7rem]">
                  {topCard.title}
                </h2>
              </button>
              <p className="mt-0.5 text-xs font-medium text-[var(--muted)] sm:text-sm">
                {topCard.subtitle}, {topCard.neighborhood}
              </p>
            </div>

            <p className="line-clamp-2 text-xs font-medium leading-snug text-[var(--ink)]/90 sm:text-sm">
              {topCard.seekingOrOffer}
            </p>

            <div
              onPointerDown={(e) => e.stopPropagation()}
              className="flex flex-wrap items-center justify-between gap-2 pt-0.5"
            >
              <div className="flex flex-wrap gap-1.5">
                {topCard.genres.slice(0, 2).map((genre) => (
                  <span
                    key={genre}
                    className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--ink)] sm:py-1 sm:text-xs"
                  >
                    {genre}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
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
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-[var(--border-strong)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)] md:px-3.5"
                >
                  <Maximize2 className="h-3 w-3" aria-hidden="true" />
                  <span>Full page</span>
                </button>
              </div>
            </div>
          </div>
        </article>
      </div>

      {/* Tablet & Desktop floating action orbs */}
      <div className="mt-5 hidden items-center justify-center gap-4 md:flex">
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
          className="glass-surface inline-flex h-14 w-14 items-center justify-center rounded-full text-[var(--err)] transition hover:scale-105 active:scale-95"
        >
          <X className="h-7 w-7 stroke-[2.25]" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => onOpenDetails(topCard)}
          aria-label={`Quick gear & rig summary for ${topCard.title}`}
          className="glass-surface inline-flex h-12 w-12 items-center justify-center rounded-full text-[var(--ink)] transition hover:scale-105"
        >
          <Info className="h-5 w-5" aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => triggerSwipe('like')}
          aria-label={mode === 'jam' ? `Jam with ${topCard.title}` : `Book ${topCard.title}`}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full transition hover:scale-105 active:scale-95"
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
        Arrow keys to swipe, Up for full page, Space or M for sound, Z to undo
      </p>
    </div>
  );
}
