import { useEffect, useMemo, useRef, useState } from 'react';
import { Star, Volume2, VolumeX } from 'lucide-react';
import { startListingLoop, stopCardPreview } from '../lib/audioPreview';
import { getMediaObjectUrl } from '../lib/mediaStorage';
import type { Listing, MediaClip } from '../types';
import { CardArtwork } from './CardArtwork';

interface ClipPlayerProps {
  listing: Listing;
  areaCode?: string;
  isActive?: boolean;
  soundEnabled: boolean;
  onToggleSound?: () => void;
  compact?: boolean;
  showMetadataOverlay?: boolean;
  activeClipId?: string;
  onActiveClipChange?: (clipId: string) => void;
}

export function ClipPlayer({
  listing,
  areaCode,
  isActive = true,
  soundEnabled,
  onToggleSound,
  compact = false,
  showMetadataOverlay = true,
  activeClipId,
  onActiveClipChange,
}: ClipPlayerProps) {
  const clips = useMemo<MediaClip[]>(() => {
    const raw: MediaClip[] =
      listing.clips && listing.clips.length > 0
        ? listing.clips
        : [{ id: `${listing.id}-default`, title: 'Intro reel', kind: 'synth-reel', durationSec: 8 }];

    if (!listing.featuredClipId) return raw;
    const featuredIdx = raw.findIndex((c) => c.id === listing.featuredClipId);
    if (featuredIdx <= 0) return raw;
    return [raw[featuredIdx], ...raw.slice(0, featuredIdx), ...raw.slice(featuredIdx + 1)];
  }, [listing.clips, listing.featuredClipId, listing.id]);

  const [clipIndex, setClipIndex] = useState(0);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const controlledIdx = activeClipId ? clips.findIndex((c) => c.id === activeClipId) : -1;
  const safeIndex = controlledIdx >= 0 ? controlledIdx : clipIndex < clips.length ? clipIndex : 0;
  const activeClip = clips[safeIndex];
  const featuredId = listing.featuredClipId || clips[0]?.id;
  const isMainClip = activeClip?.id === featuredId;

  useEffect(() => {
    setClipIndex(0);
    setProgress(0);
  }, [listing.id, listing.featuredClipId]);

  useEffect(() => {
    let revokedUrl: string | null = null;
    let cancelled = false;

    if (!activeClip?.mediaId) {
      setMediaUrl(null);
      return;
    }

    (async () => {
      const url = await getMediaObjectUrl(activeClip.mediaId!);
      if (cancelled) {
        if (url) URL.revokeObjectURL(url);
        return;
      }
      revokedUrl = url;
      setMediaUrl(url);
    })();

    return () => {
      cancelled = true;
      if (revokedUrl) URL.revokeObjectURL(revokedUrl);
    };
  }, [activeClip?.mediaId, activeClip?.id]);

  useEffect(() => {
    const vid = videoRef.current;
    if (vid && activeClip?.kind === 'video' && mediaUrl) {
      vid.muted = !soundEnabled || !isActive;
      if (isActive) {
        vid.play().catch(() => {});
      } else {
        vid.pause();
      }
    }
  }, [activeClip?.kind, isActive, mediaUrl, soundEnabled]);

  useEffect(() => {
    const aud = audioRef.current;
    if (aud && activeClip?.kind === 'audio' && mediaUrl) {
      aud.muted = !soundEnabled || !isActive;
      if (isActive) {
        aud.play().catch(() => {});
      } else {
        aud.pause();
      }
    }
  }, [activeClip?.kind, isActive, mediaUrl, soundEnabled]);

  useEffect(() => {
    const usesSynthAudio =
      activeClip?.kind === 'synth-reel' || (activeClip?.kind === 'audio' && !activeClip.mediaId);

    if (!isActive || !soundEnabled || !usesSynthAudio) {
      return;
    }

    const variation = activeClip.clipVariation ?? safeIndex;
    void startListingLoop(listing, variation);
    return () => {
      stopCardPreview();
    };
  }, [activeClip?.clipVariation, activeClip?.kind, activeClip?.mediaId, isActive, listing, safeIndex, soundEnabled]);

  useEffect(() => {
    if (activeClip?.kind === 'video' && mediaUrl) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const accent = listing.side === 'jam' ? '#ff3b6b' : '#10e88a';
    const secondary = listing.side === 'jam' ? '#ff8a5b' : '#38bdf8';
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
      const centerY = h * 0.44;
      const seedOffset = listing.visualSeed * 0.45 + safeIndex * 1.9;

      for (let i = 0; i < barCount; i++) {
        const wave =
          Math.sin(t * 4.2 + i * 0.42 + seedOffset) * 0.45 +
          Math.cos(t * 2.5 - i * 0.28) * 0.35 +
          0.6;
        const amp = (soundEnabled && isActive ? 42 : 24) * Math.max(0.2, wave);
        const x = (w / barCount) * i + barW * 0.4;
        ctx.fillStyle = i % 3 === 0 ? accent : secondary;
        ctx.globalAlpha = soundEnabled && isActive ? 0.56 : 0.34;
        ctx.beginPath();
        ctx.roundRect(x, centerY - amp / 2, barW, amp, barW / 2);
        ctx.fill();
      }

      ctx.globalAlpha = soundEnabled && isActive ? 0.32 : 0.16;
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
  }, [activeClip?.durationSec, activeClip?.kind, isActive, listing.side, listing.visualSeed, mediaUrl, safeIndex, soundEnabled]);

  const handleMediaTimeUpdate = (el: HTMLMediaElement) => {
    if (!el.duration || !Number.isFinite(el.duration)) return;
    setProgress(Math.min(1, el.currentTime / el.duration));
  };

  return (
    <div className="relative h-full w-full overflow-hidden">
      <CardArtwork listing={listing} areaCode={areaCode} compact={compact} />

      {activeClip?.kind === 'video' && mediaUrl ? (
        <video
          ref={videoRef}
          src={mediaUrl}
          autoPlay={isActive}
          loop
          playsInline
          muted={!soundEnabled || !isActive}
          onTimeUpdate={(e) => handleMediaTimeUpdate(e.currentTarget)}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <canvas
          ref={canvasRef}
          width={360}
          height={640}
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full"
        />
      )}

      {activeClip?.kind === 'audio' && mediaUrl && (
        <audio
          ref={audioRef}
          src={mediaUrl}
          autoPlay={isActive}
          loop
          muted={!soundEnabled || !isActive}
          onTimeUpdate={(e) => handleMediaTimeUpdate(e.currentTarget)}
        />
      )}

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: compact
            ? 'linear-gradient(180deg, rgba(7,8,13,0.34) 0%, rgba(7,8,13,0.08) 45%, rgba(7,8,13,0.75) 100%)'
            : 'linear-gradient(180deg, rgba(7,8,13,0.48) 0%, rgba(7,8,13,0.06) 28%, rgba(7,8,13,0.78) 65%, rgba(7,8,13,0.96) 100%)',
        }}
      />

      <div className="absolute inset-x-3.5 top-3 z-10 flex flex-col gap-2.5">
        <div className="flex items-center gap-1.5">
          {clips.map((clip, idx) => {
            const fill = idx < safeIndex ? 100 : idx === safeIndex ? Math.round(progress * 100) : 0;
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
                className="group relative h-6 flex-1 cursor-pointer py-2.5"
              >
                <span className="block h-1 w-full overflow-hidden rounded-full bg-white/25">
                  <span
                    className="block h-full rounded-full transition-[width] duration-100"
                    style={{
                      width: `${fill}%`,
                      backgroundColor: idx === safeIndex ? 'var(--accent)' : '#ffffff',
                    }}
                  />
                </span>
              </button>
            );
          })}
        </div>

        {showMetadataOverlay && (
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md">
              {isMainClip ? (
                <Star className="h-3 w-3 fill-current text-[var(--accent)]" aria-hidden="true" />
              ) : (
                <span
                  className="h-1.5 w-1.5 rounded-full"
                  style={{
                    backgroundColor: listing.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                  }}
                />
              )}
              <span>{activeClip?.title || 'Intro reel'}</span>
              {isMainClip && clips.length > 1 && (
                <span className="text-[10px] text-white/70">(Main)</span>
              )}
            </span>

            {onToggleSound && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleSound();
                }}
                aria-pressed={soundEnabled}
                aria-label={soundEnabled ? 'Mute reel audio' : 'Unmute reel audio'}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-md transition hover:bg-black/75"
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
