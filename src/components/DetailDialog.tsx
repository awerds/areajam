import { Calendar, ExternalLink, Flame, MapPin, Speaker, Ticket, X } from 'lucide-react';
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
  const safeHref =
    listing?.sampleLink && /^https?:\/\//i.test(listing.sampleLink)
      ? listing.sampleLink
      : listing?.sampleLink
        ? `https://${listing.sampleLink}`
        : undefined;

  return (
    <NativeDialog
      open={Boolean(listing)}
      onClose={onClose}
      titleId="detail-dialog-title"
      title={listing ? listing.title : 'Listing details'}
      eyebrow={
        listing
          ? `${region ? region.label : listing.regionId.toUpperCase()} · ${listing.neighborhood}`
          : undefined
      }
    >
      {listing && (
        <div className="space-y-4">
          <CardArtwork listing={listing} areaCode={region?.areaCode} compact />

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
                className="rounded-full border border-[var(--border)] bg-[var(--surface-2)] px-3 py-1 text-xs font-medium"
              >
                {genre}
              </span>
            ))}
            {listing.tags.map((tag) => (
              <span
                key={tag}
                className="font-mono-code rounded-full border border-[var(--border)] px-2.5 py-1 text-[11px] text-[var(--muted)]"
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="text-sm leading-relaxed text-[var(--ink)]">{listing.bio}</p>

          <dl className="space-y-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] p-3.5 text-sm">
            <div className="flex items-start gap-2.5">
              <Speaker className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <div>
                <dt className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  {listing.side === 'jam' ? 'Rig & Gear' : 'Backline & Sound'}
                </dt>
                <dd className="mt-0.5 text-[var(--ink)]">{listing.gearOrBackline}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <div>
                <dt className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Schedule
                </dt>
                <dd className="mt-0.5 text-[var(--ink)]">{listing.availability}</dd>
              </div>
            </div>

            <div className="flex items-start gap-2.5">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <div>
                <dt className="font-mono-code text-[11px] uppercase tracking-wider text-[var(--muted)]">
                  Area
                </dt>
                <dd className="mt-0.5 text-[var(--ink)]">
                  {listing.neighborhood}
                  {region ? ` · ${region.label}` : ''}
                </dd>
              </div>
            </div>
          </dl>

          {safeHref && (
            <a
              href={safeHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold underline decoration-[var(--border)] underline-offset-4 hover:opacity-80"
            >
              <span>Listen / Press Kit ({listing.sampleLink})</span>
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
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--err)] transition hover:opacity-85"
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
                className="inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
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
                    <span>Book / Pitch</span>
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
