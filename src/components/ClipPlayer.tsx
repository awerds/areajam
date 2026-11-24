import { useEffect, useMemo, useRef, useState } from 'react';
import { ExternalLink, Star, Volume2, VolumeX } from 'lucide-react';
import { startListingLoop, stopCardPreview } from '../lib/audioPreview';
import { subscribeColorScheme } from '../lib/colorScheme';
import { embedProviderLabel } from '../lib/embedMedia';
import { getMediaObjectUrl } from '../lib/mediaStorage';
import type { Listing, MediaClip } from '../types';
import { CardArtwork } from './CardArtwork';

declare global {
  interface Window {
    instgrm?: {
      Embeds?: {
        process: (root?: HTMLElement) => void;
      };
    };
  }
}

function ensureInstagramEmbeds(root?: HTMLElement | null) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;
  if (window.instgrm?.Embeds) {
    window.instgrm.Embeds.process(root ?? undefined);
    return;
  }

  const existing = document.querySelector<HTMLScriptElement>(
    'script[data-areajam-ig-embed="true"]'
  );
  if (!existing) {
    const script = document.createElement('script');
    script.async = true;
    script.src = 'https://www.instagram.com/embed.js';
    script.dataset.areajamIgEmbed = 'true';
    script.onload = () => {
      window.instgrm?.Embeds?.process();
    };
    document.body.appendChild(script);
  }
}

function InstagramEmbedCard({ permalink, title }: { permalink: string; title: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ensureInstagramEmbeds(containerRef.current);
  }, [permalink]);

  return (
    <div
      ref={containerRef}
      className="app-scroll flex h-full w-full flex-col items-center justify-start overflow-y-auto bg-[var(--surface-solid)] px-3 pb-10 pt-3"
    >
      <blockquote
        key={permalink}
        className="instagram-media w-full max-w-[22rem]"
        data-instgrm-permalink={permalink}
        data-instgrm-version="14"
        style={{ margin: 0, width: '100%', minWidth: '220px' }}
      >
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-center text-xs text-[var(--muted)]">
          <p className="font-semibold text-[var(--ink)]">{title}</p>
          <a
            href={permalink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-1 font-semibold text-[var(--accent-text)] underline underline-offset-2"
          >
            <span>Open on Instagram</span>
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>
      </blockquote>
    </div>
  );
}

interface ClipPlayerProps {
  listing: Listing;
  areaCode?: string;
  isActive?: boolean;
  soundEnabled: boolean;
  onToggleSound?: () => void;
  compact?: boolean;
  showMetadataOverlay?: boolean;
  hideClipTitle?: boolean;
  hideMobileSoundButton?: boolean;
  activeClipId?: string;
  onActiveClipChange?: (clipId: string) => void;
}

export function ClipPlayer({
  listing,
  areaCode,
  isActive = true,
  soundEnabled,
  onToggleSound,
  compact: _compact = false,
  showMetadataOverlay = true,
  hideClipTitle = false,
  hideMobileSoundButton = false,
  activeClipId,
  onActiveClipChange,
}: ClipPlayerProps) {
  const hasPortraitOnly = listing.clips.length === 0 && Boolean(listing.portraitUrl);

  const clips = useMemo<MediaClip[]>(() => {
    if (hasPortraitOnly) return [];
    const raw: MediaClip[] =
      listing.clips && listing.clips.length > 0
        ? listing.clips
        : [{ id: `${listing.id}-default`, title: 'Intro reel', kind: 'synth-reel', durationSec: 8 }];

    if (!listing.featuredClipId) return raw;
    const featuredIdx = raw.findIndex((c) => c.id === listing.featuredClipId);
    if (featuredIdx <= 0) return raw;
    return [raw[featuredIdx], ...raw.slice(0, featuredIdx), ...raw.slice(featuredIdx + 1)];
  }, [hasPortraitOnly, listing.clips, listing.featuredClipId, listing.id]);

  const [clipIndex, setClipIndex] = useState(0);
  const [localMediaUrl, setLocalMediaUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [schemeTick, setSchemeTick] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const controlledIdx = activeClipId ? clips.findIndex((c) => c.id === activeClipId) : -1;
  const safeIndex = controlledIdx >= 0 ? controlledIdx : clipIndex < clips.length ? clipIndex : 0;
  const activeClip = clips[safeIndex];
  const featuredId = listing.featuredClipId || clips[0]?.id;
  const isMainClip = activeClip?.id === featuredId;
  const isEmbed = activeClip?.kind === 'embed' && Boolean(activeClip.embedUrl);
  const resolvedDirectUrl = activeClip?.embedUrl || localMediaUrl;
  const hasRealVideo = activeClip?.kind === 'video' && Boolean(resolvedDirectUrl);
  const hasRealAudio = activeClip?.kind === 'audio' && Boolean(resolvedDirectUrl);
  const hideSingleTitleHud = hideClipTitle && !isEmbed && clips.length <= 1;
  const paletteIdx = Math.abs(listing.visualSeed) % 6;

  useEffect(() => {
    return subscribeColorScheme(() => setSchemeTick((n) => n + 1));
  }, []);

  useEffect(() => {
    setClipIndex(0);
    setProgress(0);
  }, [listing.id, listing.featuredClipId]);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    if (activeClip?.embedUrl || !activeClip?.mediaId) {
      setLocalMediaUrl(null);
      return;
    }

    (async () => {
      const url = await getMediaObjectUrl(activeClip.mediaId!);
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      revokedUrl = url;
      setLocalMediaUrl(url);
    })();

    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [activeClip?.embedUrl, activeClip?.mediaId, activeClip?.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid && activeClip?.kind === 'video' && resolvedDirectUrl) {
      vid.muted = !soundEnabled || !isActive;
      if (isActive) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    }
  }, [activeClip?.kind, isActive, resolvedDirectUrl, soundEnabled]);

  useEffect(() => {
    const aud = audioRef.current;
    if (aud && activeClip?.kind === 'audio' && resolvedDirectUrl) {
      aud.muted = !soundEnabled || !isActive;
      if (isActive) {
        aud.play().catch(() => {});
      } else {
        aud.pause();
      }
    }
  }, [activeClip?.kind, isActive, resolvedDirectUrl, soundEnabled]);

  useEffect(() => {
    const usesSynthAudio =
      !hasPortraitOnly &&
      Boolean(activeClip) &&
      (activeClip?.kind === 'synth-reel' ||
        (activeClip?.kind === 'audio' && !activeClip.mediaId && !activeClip.embedUrl));

    if (!isActive || !soundEnabled || !usesSynthAudio || !activeClip) {
      return;
    }

    const variation = activeClip.clipVariation ?? safeIndex;
    void startListingLoop(listing, variation);
    return () => {
      stopCardPreview();
    };
  }, [
    activeClip,
    activeClip?.clipVariation,
    activeClip?.embedUrl,
    activeClip?.kind,
    activeClip?.mediaId,
    hasPortraitOnly,
    isActive,
    listing,
    safeIndex,
    soundEnabled,
  ]);

  useEffect(() => {
    if (hasRealVideo || isEmbed || hasPortraitOnly) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const cs = getComputedStyle(canvas);
    const accent =
      (
        listing.side === 'jam'
          ? cs.getPropertyValue('--art-primary')
          : cs.getPropertyValue('--art-secondary')
      ).trim() || (listing.side === 'jam' ? '#d91b4c' : '#10e88a');
    const secondary =
      cs.getPropertyValue('--art-rim').trim() ||
      (listing.side === 'jam' ? '#ff6b93' : '#38bdf8');

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const durationMs = Math.max(4000, (activeClip?.durationSec || 8) * 1000);
    const startTs = performance.now();
    let rafId = 0;

    const drawFrame = (now: number) => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      const elapsed = isActive && !reducedMotion ? (now - startTs) % durationMs : 0;
      const t = elapsed / 1000;
      if (isActive && !reducedMotion) {
        setProgress(elapsed / durationMs);
      }

      const barCount = 28;
      const barW = w / (barCount * 1.8);
      const centerY = h * 0.54;
      const seedOffset = listing.visualSeed * 0.45 + safeIndex * 1.9;

      for (let i = 0; i < barCount; i++) {
        const wave =
          Math.sin(t * 4.2 + i * 0.42 + seedOffset) * 0.45 +
          Math.cos(t * 2.5 - i * 0.28) * 0.35 +
          0.6;
        const amp = (soundEnabled && isActive ? 42 : 24) * Math.max(0.2, wave);
        const x = (w / barCount) * i + barW * 0.4;
        ctx.fillStyle = i % 3 === 0 ? accent : secondary;
        ctx.globalAlpha = soundEnabled && isActive ? 0.62 : 0.38;
        ctx.beginPath();
        ctx.roundRect(x, centerY - amp / 2, barW, amp, barW / 2);
        ctx.fill();
      }

      ctx.globalAlpha = soundEnabled && isActive ? 0.36 : 0.2;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      const pulseR = 54 + Math.sin(t * 3.1 + seedOffset) * 10;
      ctx.beginPath();
      ctx.arc(w * 0.5, centerY, pulseR, 0, Math.PI * 2);
      ctx.stroke();

      ctx.globalAlpha = 1;

      if (isActive && !reducedMotion) {
        rafId = window.requestAnimationFrame(drawFrame);
      }
    };

    drawFrame(performance.now());
    return () => {
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, [
    activeClip?.durationSec,
    hasPortraitOnly,
    hasRealVideo,
    isActive,
    isEmbed,
    listing.side,
    listing.visualSeed,
    safeIndex,
    schemeTick,
    soundEnabled,
  ]);

  const handleMediaTimeUpdate = (el: HTMLMediaElement) => {
    if (!el.duration || !Number.isFinite(el.duration)) return;
    setProgress(Math.min(1, el.currentTime / el.duration));
  };

  const progressStrip = (
    <div className="pointer-events-auto flex items-center gap-1.5">
      {clips.map((clip, idx) => {
        const fill =
          isEmbed && idx === safeIndex
            ? 100
            : idx < safeIndex
              ? 100
              : idx === safeIndex
                ? Math.round(progress * 100)
                : 0;
        const slimSingle = hideClipTitle && clips.length === 1;
        return (
          <button
            key={clip.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setClipIndex(idx);
              setProgress(0);
              onActiveClipChange?.(clip.id);
            }}
            aria-label={`Play clip ${idx + 1}: ${clip.title}`}
            className={`group relative flex-1 cursor-pointer ${slimSingle ? 'h-4 py-1.5' : 'h-6 py-2.5'}`}
          >
            <span
              className={`block ${slimSingle ? 'h-0.5' : 'h-1'} w-full overflow-hidden rounded-full ${
                hasRealVideo || isEmbed ? 'bg-white/30' : 'bg-[var(--card-track-bg)]'
              }`}
            >
              <span
                className="block h-full rounded-full transition-[width] duration-100"
                style={{
                  width: `${fill}%`,
                  backgroundColor:
                    idx === safeIndex
                      ? 'var(--accent)'
                      : hasRealVideo || isEmbed
                        ? '#ffffff'
                        : 'var(--ink)',
                }}
              />
            </span>
          </button>
        );
      })}
    </div>
  );

  if (isEmbed && activeClip?.embedUrl) {
    return (
      <div className={`card-art-${paletteIdx} flex h-full w-full flex-col overflow-hidden bg-[#10131d]`}>
        <div className="flex shrink-0 flex-col gap-1 border-b border-white/15 bg-[#10131d] px-3.5 pb-2 pt-1.5">
          {progressStrip}
          {showMetadataOverlay && (
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white">
                {isMainClip ? (
                  <Star className="h-3 w-3 shrink-0 fill-current text-[var(--accent)]" aria-hidden="true" />
                ) : (
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{
                      backgroundColor: listing.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                    }}
                  />
                )}
                <span className="truncate">{activeClip.title || 'Linked clip'}</span>
                {activeClip.embedProvider && activeClip.embedProvider !== 'direct' && (
                  <span className="shrink-0 text-[10px] text-white/75">
                    ({embedProviderLabel(activeClip.embedProvider)})
                  </span>
                )}
              </span>

              <a
                href={activeClip.embedUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white transition hover:bg-white/20"
              >
                <span>Open</span>
                <ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            </div>
          )}
        </div>

        <div className="relative min-h-0 flex-1 overflow-hidden">
          {activeClip.embedProvider === 'instagram' ? (
            <InstagramEmbedCard permalink={activeClip.embedUrl} title={activeClip.title} />
          ) : (
            <iframe
              key={activeClip.embedUrl}
              src={activeClip.embedUrl}
              title={activeClip.title}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="h-full w-full border-0 bg-[#10131d]"
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`card-art-${paletteIdx} relative h-full w-full overflow-hidden`}>
      <CardArtwork
        listing={listing}
        areaCode={areaCode}
        compact={false}
        showTopBadges={false}
      />

      {hasRealVideo && resolvedDirectUrl && isActive ? (
        <video
          ref={videoRef}
          src={resolvedDirectUrl}
          poster={activeClip?.posterUrl || listing.portraitUrl}
          preload="auto"
          autoPlay={isActive}
          loop
          playsInline
          muted={!soundEnabled || !isActive}
          onTimeUpdate={(e) => handleMediaTimeUpdate(e.currentTarget)}
          className="absolute inset-0 h-full w-full object-cover object-[50%_22%]"
        />
      ) : !hasRealVideo && !hasPortraitOnly ? (
        <canvas
          ref={canvasRef}
          width={360}
          height={420}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      ) : null}

      {hasRealAudio && resolvedDirectUrl && (
        <audio
          ref={audioRef}
          src={resolvedDirectUrl}
          autoPlay={isActive}
          loop
          muted={!soundEnabled || !isActive}
          onTimeUpdate={(e) => handleMediaTimeUpdate(e.currentTarget)}
        />
      )}

      {(hasRealVideo || hasPortraitOnly) && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(16,19,29,0.52) 0%, rgba(16,19,29,0) 38%)',
          }}
        />
      )}

      <div className="pointer-events-none absolute inset-x-3.5 top-3 z-10 flex flex-col gap-2">
        {clips.length > 0 && progressStrip}

        {showMetadataOverlay && !(hideSingleTitleHud && hasPortraitOnly) && (
          <div className={`flex items-center gap-2 ${hideSingleTitleHud ? 'justify-end' : 'justify-between'}`}>
            {!hideSingleTitleHud && (
              <span
                className={`pointer-events-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md ${
                  hasRealVideo || hasPortraitOnly
                    ? 'border-white/20 bg-black/65 text-white'
                    : 'border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)]'
                }`}
              >
                {!hasPortraitOnly && isMainClip ? (
                  <Star className="h-3 w-3 fill-current text-[var(--accent)]" aria-hidden="true" />
                ) : (
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{
                      backgroundColor: listing.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                    }}
                  />
                )}
                <span className="truncate">
                  {hasPortraitOnly ? 'Fictional sample portrait' : activeClip?.title || 'Intro reel'}
                </span>
                {!hasPortraitOnly && activeClip?.embedProvider && activeClip.embedProvider !== 'direct' && (
                  <span className="text-[10px] text-white/75">
                    ({embedProviderLabel(activeClip.embedProvider)})
                  </span>
                )}
              </span>
            )}

            {!hasPortraitOnly && onToggleSound && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSound();
                }}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? 'Mute reel audio' : 'Unmute reel audio'}
                className={`pointer-events-auto items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-md transition ${
                  hideMobileSoundButton ? 'hidden md:inline-flex' : 'inline-flex'
                } ${
                  hasRealVideo
                    ? 'border-white/20 bg-black/55 text-white hover:bg-black/75'
                    : 'border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)] hover:bg-[var(--surface-solid)]'
                }`}
              >
                {soundEnabled ? (
                  <>
                    <Volume2 className="h-3.5 w-3.5 text-[var(--accent)]" aria-hidden="true" />
                    <span>Sound on</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Tap for sound</span>
                  </>
                )}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
