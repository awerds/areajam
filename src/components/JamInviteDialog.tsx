import { useEffect, useState } from 'react';
import { AlertCircle, Flame, MapPin } from 'lucide-react';
import type { Listing } from '../types';
import { InstrumentBadgeRow } from './InstrumentIcons';
import { NativeDialog } from './NativeDialog';

interface JamInviteDialogProps {
  listing: Listing | null;
  regionLabel?: string;
  onClose: () => void;
  onSubmit: (listing: Listing, note: string) => Promise<void>;
}

const STARTER_NOTES = [
  'Watched your clip — down to grab a rehearsal hour this week?',
  'Your setup fits what I am building. Want to trade riffs soon?',
  'Free any evening this week for a casual jam?',
];

export function JamInviteDialog({
  listing,
  regionLabel,
  onClose,
  onSubmit,
}: JamInviteDialogProps) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setNote('');
    setErrorMsg(null);
    setSubmitting(false);
  }, [listing?.id]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listing) return;
    const trimmed = note.trim();
    if (!trimmed) {
      setErrorMsg('Write a quick note so they know what you want to play together.');
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onSubmit(listing, trimmed);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'Could not send invite right now. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <NativeDialog
      open={Boolean(listing)}
      onClose={onClose}
      titleId="jam-invite-dialog-title"
      title={listing ? `Invite ${listing.title} to jam` : 'Invite to jam'}
      subtitle={
        listing
          ? `${listing.neighborhood}${regionLabel ? `, ${regionLabel}` : ''}`
          : undefined
      }
    >
      {listing && (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="flex items-center justify-between gap-2 text-xs text-[var(--muted)]">
              <span className="font-semibold text-[var(--ink)]">{listing.subtitle}</span>
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {listing.neighborhood}
              </span>
            </div>
            <InstrumentBadgeRow instruments={listing.instruments} compact max={4} />
            <p className="text-xs leading-relaxed text-[var(--muted)]">{listing.seekingOrOffer}</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="jam-invite-note" className="block text-xs font-semibold">
              Add a short note (sent with your invite)
            </label>
            <textarea
              id="jam-invite-note"
              rows={3}
              required
              autoFocus
              maxLength={280}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`Introduce yourself and suggest when or what to play with ${listing.title}...`}
              className="field-control resize-none"
            />
            <div className="flex flex-wrap gap-1.5">
              {STARTER_NOTES.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => setNote(starter)}
                  className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1 text-[11px] font-medium text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                >
                  {starter}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-[var(--err)] bg-[var(--err-bg)] px-3.5 py-2.5 text-xs text-[var(--err)]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          <p className="text-xs text-[var(--muted)]">
            If {listing.title} accepts, they move to your Matches and you can message directly in your Inbox.
          </p>

          <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !note.trim()}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
            >
              <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
              <span>{submitting ? 'Sending invite...' : 'Send jam invite'}</span>
            </button>
          </div>
        </form>
      )}
    </NativeDialog>
  );
}
