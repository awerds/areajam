import { useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';
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
  const contentRef = useRef<HTMLDivElement>(null);
  const isJam = listing?.side === 'jam';

  useLayoutEffect(() => {
    const el = contentRef.current;
    if (!listing || !el) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        el,
        { scale: 0.9, opacity: 0, y: 12 },
        { scale: 1, opacity: 1, y: 0, duration: 0.36, ease: 'back.out(1.5)' }
      );
    });
    return () => mm.revert();
  }, [listing?.id]);

  return (
    <NativeDialog
      open={Boolean(listing)}
      onClose={onClose}
      titleId="match-dialog-title"
      title={isJam ? "It's a jam" : "You're on the bill"}
      subtitle={
        listing
          ? `Mutual match in ${region ? region.label : listing.regionId}`
          : undefined
      }
    >
      {listing && (
        <div ref={contentRef} className="space-y-5 text-center">
          <div
            className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
              color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
              boxShadow: isJam
                ? '0 12px 32px rgba(255, 59, 107, 0.45)'
                : '0 12px 32px rgba(16, 232, 138, 0.35)',
            }}
          >
            <Sparkles className="h-8 w-8" aria-hidden="true" />
          </div>

          <div>
            <h3 className="font-display text-2xl font-bold">{listing.title}</h3>
            <p className="mt-1 text-sm text-[var(--muted)]">
              {listing.subtitle}, {listing.neighborhood}
            </p>
            <p className="mt-4 rounded-2xl border border-[var(--border)] bg-white/5 px-4 py-3.5 text-sm italic text-[var(--ink)]">
              &ldquo;{listing.autoReply}&rdquo;
            </p>
          </div>

          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[var(--border)] bg-white/5 px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-white/10"
            >
              Keep swiping
            </button>
            <button
              type="button"
              autoFocus
              onClick={() => onOpenChat(listing)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
              style={{
                backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
                color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
              }}
            >
              <MessageCircle className="h-4 w-4" aria-hidden="true" />
              <span>Send a message</span>
            </button>
          </div>
        </div>
      )}
    </NativeDialog>
  );
}
