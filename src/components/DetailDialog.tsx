import { useEffect, useState } from 'react';
import { Calendar, ExternalLink, Flame, MapPin, Pause, Play, Speaker, Ticket, X } from 'lucide-react';
import {
  getPlayingListingId,
  subscribeAudioState,
  toggleCardPreview,
} from '../lib/audioPreview';
import type { Listing, Region, SwipeDecision } from '../types';
import { CardArtwork } from './CardArtwork';
import { NativeDialog } from './NativeDialog';

interface DetailDialogProps {
  listing: Listing | null;
  region?: Region;
  alreadyMatched?: boolean;
  onClose: () => void;
  onSwipe?: (listing: Listing, decision: SwipeDecision) => void;
}

export function DetailDialog({
  listing,
  region,
  alreadyMatched = false,
  onClose,
  onSwipe,
}: DetailDialogProps) {
  const [playingId, setPlayingId] = useState<string | null>(() => getPlayingListingId());

  useEffect(() => {
    return subscribeAudioState(() => {
      setPlayingId(getPlayingListingId());
    });
  }, []);

  const safeHref =
    listing?.sampleLink && /^https?:\/\//i.test(listing.sampleLink)
      ? listing.sampleLink
      : listing?.sampleLink
        ? `https://${listing.sampleLink}`
        : undefined;

  const isPlaying = Boolean(listing && playingId === listing.id);

  return (
    <NativeDialog
      open={Boolean(listing)}
      onClose={onClose}
      titleId="detail-dialog-title"
      title={listing ? listing.title : 'Listing details'}
      subtitle={
        listing
          ? `${listing.neighborhood}, ${region ? `${region.city} (${region.areaCode})` : listing.regionId}`
          : undefined
      }
    >
      {listing && (
        <div className="space-y-4">
          <div className="relative">
            <CardArtwork listing={listing} areaCode={region?.areaCode} compact />
            <button
              type="button"
              onClick={() => void toggleCardPreview(listing)}
              aria-pressed={isPlaying}
              className="absolute bottom-3 left-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-black/60 px-3.5 py-1.5 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/80"
            >
              {isPlaying ? (
                <Pause className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              ) : (
                <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
              )}
              <span>{isPlaying ? 'Playing groove' : 'Preview groove'}</span>
            </button>
          </div>

          <div>
            <p className="text-sm font-medium text-[var(--muted)]">{listing.subtitle}</p>
            <p className="mt-1.5 text-base font-semibold leading-snug text-[var(--ink)]">
              {listing.seekingOrOffer}
            </p>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {listing.genres.map((genre) => (
              <span
                key={genre}
                className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-[var(--ink)]"
              >
                {genre}
              </span>
            ))}
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-[var(--border)] px-2.5 py-1 text-xs text-[var(--muted)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-[var(--ink)]/90">{listing.bio}</p>

          <dl className="space-y-3 rounded-2xl border border-[var(--border)] bg-white/5 p-4 text-sm">
            <div className="flex items-start gap-3">
              <Speaker className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">
                  {listing.side === 'jam' ? 'Rig and gear' : 'Backline and sound'}
                </dt>
                <dd className="mt-0.5 text-[var(--ink)]">{listing.gearOrBackline}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Schedule</dt>
                <dd className="mt-0.5 text-[var(--ink)]">{listing.availability}</dd>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <div>
                <dt className="text-xs font-semibold text-[var(--muted)]">Local area</dt>
                <dd className="mt-0.5 text-[var(--ink)]">
                  {listing.neighborhood}
                  {region ? `, ${region.label}` : ''}
                </dd>
              </div>
            </div>
          </dl>

          {safeHref && (
            <a
              href={safeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] underline decoration-white/25 underline-offset-4 hover:opacity-80"
            >
              <span>Listen or view press kit ({listing.sampleLink})</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}

          {onSwipe && !alreadyMatched && (
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwipe(listing, 'pass');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm font-semibold text-[var(--err)] transition hover:bg-white/10"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                <span>Pass</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onSwipe(listing, 'like');
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                style={{
                  backgroundColor: listing.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                  color: listing.side === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                }}
              >
                {listing.side === 'jam' ? (
                  <>
                    <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>Jam</span>
                  </>
                ) : (
                  <>
                    <Ticket className="h-4 w-4" aria-hidden="true" />
                    <span>Book slot</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </NativeDialog>
  );
}
