import { useEffect, useMemo, useState } from 'react';
import {
  AlertCircle,
  Check,
  Flame,
  GraduationCap,
  MapPin,
  Mic2,
  UserCheck,
  UserPlus,
} from 'lucide-react';
import type { ConnectionContext, InviteIntent, Listing } from '../types';
import { InstrumentBadgeRow } from './InstrumentIcons';
import { NativeDialog } from './NativeDialog';

interface JamInviteDialogProps {
  listing: Listing | null;
  regionLabel?: string;
  defaultContext?: ConnectionContext;
  isFollowing?: boolean;
  isSignedIn?: boolean;
  onClose: () => void;
  onFollow: (listing: Listing) => void;
  onSubmit: (listing: Listing, note: string, intent: InviteIntent) => Promise<void>;
}

const STARTER_NOTES: Record<InviteIntent, string[]> = {
  jam: [
    'Watched your clip — down to grab a rehearsal hour this week?',
    'Your setup fits what I am building. Want to trade riffs soon?',
    'Free any evening this week for a casual jam?',
  ],
  session: [
    'Love your playing — are you open for remote stem tracking this week?',
    'Putting together a studio date soon. Can I send a rough mix & chart?',
    'Interested in booking you for a session track — what is your turnaround?',
  ],
  lesson: [
    'Loved your clip — are you taking new students for 1-on-1 lessons?',
    'Interested in a trial lesson this week (in-person or remote).',
    'Looking to level up my groove & technique — what times do you teach?',
  ],
};

function resolveInitialContext(
  listing: Listing | null,
  preferred?: ConnectionContext
): ConnectionContext {
  if (!listing) return 'follow';
  if (preferred === 'session' && listing.offersSession) return 'session';
  if (preferred === 'lesson' && listing.offersLessons) return 'lesson';
  if (preferred === 'follow') return 'follow';
  if (preferred === 'jam') return 'jam';
  return listing.ownerUid ? 'jam' : 'follow';
}

export function JamInviteDialog({
  listing,
  regionLabel,
  defaultContext,
  isFollowing = false,
  isSignedIn = false,
  onClose,
  onFollow,
  onSubmit,
}: JamInviteDialogProps) {
  const [context, setContext] = useState<ConnectionContext>(() =>
    resolveInitialContext(listing, defaultContext)
  );
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setContext(resolveInitialContext(listing, defaultContext));
    setNote('');
    setErrorMsg(null);
    setSubmitting(false);
  }, [listing?.id, defaultContext]);

  const contextOptions = useMemo(() => {
    if (!listing) return [];
    const opts: Array<{
      id: ConnectionContext;
      label: string;
      sublabel?: string;
    }> = [
      {
        id: 'follow',
        label: isFollowing ? 'Following' : 'Follow',
        sublabel: 'Save profile',
      },
      {
        id: 'jam',
        label: 'Jam',
        sublabel: 'Play together',
      },
    ];
    if (listing.offersSession) {
      opts.push({
        id: 'session',
        label: 'Session',
        sublabel: listing.sessionRate || 'Hire / stems',
      });
    }
    if (listing.offersLessons) {
      opts.push({
        id: 'lesson',
        label: 'Lesson',
        sublabel: listing.lessonRate || '1-on-1 coaching',
      });
    }
    return opts;
  }, [listing, isFollowing]);

  const canDirectInvite = Boolean(listing?.ownerUid);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!listing) return;

    if (context === 'follow') {
      onFollow(listing);
      onClose();
      return;
    }

    if (!canDirectInvite) {
      setErrorMsg(
        'Direct invites unlock once this musician claims their account. Tap Follow above to save them now.'
      );
      return;
    }

    const trimmed = note.trim();
    if (!trimmed) {
      setErrorMsg(
        context === 'session'
          ? 'Add a quick note about your track, timeline, or session.'
          : context === 'lesson'
            ? 'Add a quick note about your goals or preferred lesson times.'
            : 'Write a quick note so they know what you want to play together.'
      );
      return;
    }

    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onSubmit(listing, trimmed, context);
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'Could not send request right now. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const ctaLabel =
    context === 'follow'
      ? isFollowing
        ? 'Unfollow musician'
        : 'Follow musician'
      : submitting
        ? 'Sending request...'
        : context === 'session'
          ? isSignedIn
            ? 'Send session request'
            : 'Sign in & send session request'
          : context === 'lesson'
            ? isSignedIn
              ? 'Send lesson request'
              : 'Sign in & send lesson request'
            : isSignedIn
              ? 'Send jam invite'
              : 'Sign in & send jam invite';

  return (
    <NativeDialog
      open={Boolean(listing)}
      onClose={onClose}
      titleId="jam-invite-dialog-title"
      title={listing ? `Connect with ${listing.title}` : 'Connect'}
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
              <span className="inline-flex shrink-0 items-center gap-1">
                <MapPin className="h-3 w-3" aria-hidden="true" />
                {listing.neighborhood}
              </span>
            </div>
            <InstrumentBadgeRow instruments={listing.instruments} compact max={4} />
            <p className="text-xs leading-relaxed text-[var(--muted)]">{listing.seekingOrOffer}</p>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold text-[var(--ink)]">
              Choose how you want to connect
            </span>
            <div
              role="radiogroup"
              aria-label="Connection context"
              className={`grid gap-2 ${
                contextOptions.length >= 4
                  ? 'grid-cols-2 sm:grid-cols-4'
                  : contextOptions.length === 3
                    ? 'grid-cols-3'
                    : 'grid-cols-2'
              }`}
            >
              {contextOptions.map((opt) => {
                const selected = context === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => {
                      setContext(opt.id);
                      setErrorMsg(null);
                    }}
                    className="flex flex-col items-start gap-0.5 rounded-2xl border px-3 py-2.5 text-left transition"
                    style={
                      selected
                        ? {
                            backgroundColor: 'var(--jam-soft)',
                            borderColor: 'var(--jam)',
                            color: 'var(--ink)',
                          }
                        : {
                            backgroundColor: 'var(--pill-bg)',
                            borderColor: 'var(--border)',
                            color: 'var(--muted)',
                          }
                    }
                  >
                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[var(--ink)]">
                      {opt.id === 'follow' ? (
                        isFollowing ? (
                          <UserCheck className="h-3.5 w-3.5 text-[var(--ok)]" aria-hidden="true" />
                        ) : (
                          <UserPlus className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
                        )
                      ) : opt.id === 'session' ? (
                        <Mic2 className="h-3.5 w-3.5 text-amber-500" aria-hidden="true" />
                      ) : opt.id === 'lesson' ? (
                        <GraduationCap className="h-3.5 w-3.5 text-emerald-500" aria-hidden="true" />
                      ) : (
                        <Flame className="h-3.5 w-3.5 text-[var(--jam-text)]" aria-hidden="true" />
                      )}
                      <span>{opt.label}</span>
                    </span>
                    {opt.sublabel && (
                      <span className="w-full truncate text-[11px] font-medium text-[var(--muted)]">
                        {opt.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {context === 'follow' ? (
            <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--muted)]">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--ok)]" aria-hidden="true" />
              <p>
                {isFollowing
                  ? `You are following ${listing.title}. You can unfollow anytime or switch above to send a direct request.`
                  : `Saves ${listing.title} to your Following list right away — no note or approval needed.`}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {!canDirectInvite && (
                <div className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-xs text-[var(--muted)]">
                  This showcase profile isn&apos;t claimed yet for live inbox invites. Choose{' '}
                  <strong className="text-[var(--ink)]">Follow</strong> above to bookmark {listing.title} now.
                </div>
              )}

              <label htmlFor="jam-invite-note" className="block text-xs font-semibold">
                {context === 'session'
                  ? 'Add session details (sent with your request)'
                  : context === 'lesson'
                    ? 'Add lesson goals or schedule (sent with your request)'
                    : 'Add a short note (sent with your invite)'}
              </label>
              <textarea
                id="jam-invite-note"
                rows={3}
                required
                disabled={!canDirectInvite}
                maxLength={280}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={
                  context === 'session'
                    ? `Share your track vibe, timeline, or studio details for ${listing.title}...`
                    : context === 'lesson'
                      ? `Share your current level, instrument goals, or preferred days for ${listing.title}...`
                      : `Introduce yourself and suggest when or what to play with ${listing.title}...`
                }
                className="field-control resize-none disabled:opacity-60"
              />
              {canDirectInvite && (
                <div className="flex flex-wrap gap-1.5">
                  {STARTER_NOTES[context].map((starter) => (
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
              )}
            </div>
          )}

          {errorMsg && (
            <div
              role="alert"
              className="flex items-start gap-2 rounded-xl border border-[var(--err)] bg-[var(--err-bg)] px-3.5 py-2.5 text-xs text-[var(--err)]"
            >
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{errorMsg}</span>
            </div>
          )}

          {context !== 'follow' && canDirectInvite && (
            <p className="text-xs text-[var(--muted)]">
              If {listing.title} accepts, they move to your Matches and you can message directly in your Inbox.
            </p>
          )}

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
              disabled={
                context !== 'follow' && (!canDirectInvite || submitting || !note.trim())
              }
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
            >
              {context === 'follow' ? (
                isFollowing ? (
                  <UserCheck className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <UserPlus className="h-4 w-4" aria-hidden="true" />
                )
              ) : context === 'session' ? (
                <Mic2 className="h-4 w-4" aria-hidden="true" />
              ) : context === 'lesson' ? (
                <GraduationCap className="h-4 w-4" aria-hidden="true" />
              ) : (
                <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
              )}
              <span>{ctaLabel}</span>
            </button>
          </div>
        </form>
      )}
    </NativeDialog>
  );
}
