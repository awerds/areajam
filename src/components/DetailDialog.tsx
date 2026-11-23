import { Calendar, ExternalLink, Flame, Instagram, MapPin, Maximize2, MessageCircle, Speaker, X } from 'lucide-react';
import { safeHttpsUrl } from '../data/themes';
import { getProfileActionState } from '../lib/firestorePilot';
import { estimateRoughDistanceMiles, formatRoughDistance } from '../lib/location';
import type { JamInvite, Listing, Region, SwipeDecision } from '../types';
import { ClipPlayer } from './ClipPlayer';
import { InstrumentBadgeRow } from './InstrumentIcons';
import { NativeDialog } from './NativeDialog';

interface DetailDialogProps {
  listing: Listing | null;
  region?: Region;
  selectedRegion?: Region;
  currentUserUid?: string;
  inviteByTargetUid?: Record<string, JamInvite>;
  soundEnabled: boolean;
  onToggleSound: () => void;
  onClose: () => void;
  onOpenProfile?: (listing: Listing) => void;
  onSwipe?: (listing: Listing, decision: SwipeDecision) => void;
  onInvite?: (listing: Listing) => void;
  onOpenInvites?: (threadId?: string) => void;
}

export function DetailDialog({
  listing,
  region,
  selectedRegion,
  currentUserUid,
  inviteByTargetUid,
  soundEnabled,
  onToggleSound,
  onClose,
  onOpenProfile,
  onSwipe,
  onInvite,
  onOpenInvites,
}: DetailDialogProps) {
  const safeHref = safeHttpsUrl(listing?.sampleLink);
  const action = listing
    ? getProfileActionState(listing, currentUserUid, inviteByTargetUid)
    : null;
  const verboseDistance =
    listing && selectedRegion && listing.regionId !== selectedRegion.id
      ? formatRoughDistance(
          estimateRoughDistanceMiles(selectedRegion, region),
          selectedRegion,
          region,
          'verbose'
        )
      : null;

  return (
    <NativeDialog
      open={Boolean(listing)}
      onClose={onClose}
      titleId="detail-dialog-title"
      title={listing ? listing.title : 'Listing details'}
      subtitle={
        listing
          ? `${listing.isSample ? 'Sample preview card' : 'Live profile'} — ${listing.neighborhood}, ${region ? `${region.city} (${region.areaCode})` : listing.regionId}${verboseDistance ? ` (${verboseDistance})` : ''}`
          : undefined
      }
    >
      {listing && (
        <div className="space-y-4">
          <div className="h-64 w-full overflow-hidden rounded-2xl border border-[var(--border)]">
            <ClipPlayer
              listing={listing}
              areaCode={region?.areaCode}
              isActive={Boolean(listing)}
              soundEnabled={soundEnabled}
              onToggleSound={onToggleSound}
              compact
            />
          </div>

          <InstrumentBadgeRow instruments={listing.instruments} max={6} />

          <div>
            <p className="text-sm font-medium text-[var(--muted)]">{listing.subtitle}</p>
            <p className="mt-1.5 text-base font-semibold leading-snug text-[var(--ink)]">
              {listing.seekingOrOffer}
            </p>
          </div>

          <p className="text-sm leading-relaxed text-[var(--ink)]/90">{listing.bio}</p>

          <dl className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 text-sm">
            <div className="flex items-start gap-3">
              <Speaker className="mt-0.5 h-4 w-4 shrink-0 text-[var(--muted)]" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <dt className="text-xs font-semibold text-[var(--muted)]">
                  {listing.side === 'jam' ? 'Gear locker' : 'Backline and sound'}
                </dt>
                {listing.gearLocker.length > 0 ? (
                  <dd className="mt-1 space-y-1">
                    {listing.gearLocker.slice(0, 4).map((item) => (
                      <div key={item.id} className="text-xs text-[var(--ink)]">
                        <span className="font-semibold">{item.name}</span>
                        {item.notes ? <span className="text-[var(--muted)]"> — {item.notes}</span> : null}
                      </div>
                    ))}
                  </dd>
                ) : (
                  <dd className="mt-0.5 text-[var(--ink)]">{listing.gearOrBackline}</dd>
                )}
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
                <dd className="mt-0.5 flex flex-wrap items-center gap-2 text-[var(--ink)]">
                  <span>
                    {listing.neighborhood}
                    {region ? `, ${region.label}` : ''}
                  </span>
                  {verboseDistance && (
                    <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-xs font-semibold text-[var(--accent-text)]">
                      {verboseDistance}
                    </span>
                  )}
                </dd>
              </div>
            </div>
          </dl>

          {listing.instagramHandle && (
            <a
              href={`https://www.instagram.com/${listing.instagramHandle}/`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              <Instagram className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
              <span>@{listing.instagramHandle}</span>
              <ExternalLink className="h-3 w-3 text-[var(--muted)]" aria-hidden="true" />
            </a>
          )}

          {safeHref && (
            <a
              href={safeHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ink)] underline decoration-[var(--border-strong)] underline-offset-4 hover:opacity-80"
            >
              <span>Listen or view press kit ({listing.sampleLink})</span>
              <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}

          {onOpenProfile && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenProfile(listing);
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border-strong)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              <Maximize2 className="h-4 w-4" aria-hidden="true" />
              <span>Open full profile page</span>
            </button>
          )}

          {!listing.isSample && action && action.kind !== 'self' && (
            <div className="grid grid-cols-2 gap-3 pt-1">
              {onSwipe && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onSwipe(listing, 'pass');
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--err)] transition hover:bg-[var(--surface-hover)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>Pass</span>
                </button>
              )}

              {action.kind === 'invite' && onInvite ? (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onInvite(listing);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                  style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                >
                  <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                  <span>Invite to jam</span>
                </button>
              ) : (
                onOpenInvites && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenInvites(action.kind === 'accepted' ? action.invite.threadId : undefined);
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>{action.label}</span>
                  </button>
                )
              )}
            </div>
          )}

          {listing.isSample && onSwipe && (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--muted)]">
              Sample preview profile for demonstration only. Sign in and browse live musician cards to send a real Jam invite.
            </div>
          )}
        </div>
      )}
    </NativeDialog>
  );
}
