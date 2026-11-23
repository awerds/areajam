import { MessageCircle, Sparkles } from 'lucide-react';
import type { Listing, Region } from '../types';
import { NativeDialog } from './NativeDialog';

interface MatchDialogProps {
  listing: Listing | null;
  region?: Region;
  onClose: () => void;
  onOpenChat: (listing: Listing) => void;
}

export function MatchDialog({ listing, region, onClose, onOpenChat }: MatchDialogProps) {
  const isJam = listing?.side === 'jam';

  return (
    <NativeDialog
      open={Boolean(listing)}
      onClose={onClose}
      titleId="match-dialog-title"
      title={isJam ? "IT'S A JAM" : 'ON THE BILL'}
      eyebrow={
        listing
          ? `${region ? region.label : listing.regionId.toUpperCase()} · MUTUAL MATCH`
          : undefined
      }
    >
      {listing && (
        <div className="space-y-5 text-center">
          <div
            className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg"
            style={{
              backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
              color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
            }}
          >
            <Sparkles className="h-8 w-8" aria-hidden="true" />
          </div>

          <div>
            <h3 className="font-display text-2xl font-extrabold">{listing.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {listing.subtitle} · {listing.neighborhood}
            </p>
            <p className="mt-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm italic text-[var(--ink)]">
              &ldquo;{listing.autoReply}&rdquo;
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:opacity-85"
            >
              Keep Swiping
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => onOpenChat(listing)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
                color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
              }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Message Now</span>
            </button>
          </div>
        </div>
      )}
    </NativeDialog>
  );
}
