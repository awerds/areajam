import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Flag,
  Flame,
  Instagram,
  MapPin,
  MessageCircle,
  Palette,
  Play,
  Plus,
  Send,
  Share2,
  ShieldBan,
  Sparkles,
  Speaker,
  Star,
  Trash2,
  Users,
} from 'lucide-react';
import {
  GEAR_CATEGORIES,
  PROFILE_THEMES,
  PROFILE_THEME_LIST,
  safeHttpsUrl,
} from '../data/themes';
import { embedProviderLabel } from '../lib/embedMedia';
import { getProfileActionState } from '../lib/firestorePilot';
import { estimateRoughDistanceMiles, formatRoughDistance } from '../lib/location';
import type {
  AuthUser,
  GearCategory,
  GearItem,
  InboxFolder,
  JamInvite,
  Listing,
  ProfileThemeId,
  Region,
  WallComment,
} from '../types';
import { ClipPlayer } from './ClipPlayer';
import { InstrumentBadgeRow } from './InstrumentIcons';
import type { SafetyTarget } from './SafetyDialog';

interface ProfilePageProps {
  listing: Listing;
  region?: Region;
  selectedRegion?: Region;
  allListings: Listing[];
  allRegions: Region[];
  user: AuthUser | null;
  inviteByTargetUid?: Record<string, JamInvite>;
  soundEnabled: boolean;
  wallComments: WallComment[];
  onToggleSound: () => void;
  onBack: () => void;
  onInvite: (listing: Listing) => void;
  onOpenInvites: (threadId?: string, folder?: InboxFolder) => void;
  onSafetyAction: (target: SafetyTarget) => void;
  onOpenProfile: (listing: Listing) => void;
  onUpdateListing: (updated: Listing) => void;
  onAddWallComment: (listingId: string, text: string) => void;
  onDeleteWallComment?: (listingId: string, noteId: string) => void;
  onShareUrl: () => void;
}

export function ProfilePage({
  listing,
  region,
  selectedRegion,
  allListings,
  allRegions,
  user,
  inviteByTargetUid,
  soundEnabled,
  wallComments,
  onToggleSound,
  onBack,
  onInvite,
  onOpenInvites,
  onSafetyAction,
  onOpenProfile,
  onUpdateListing,
  onAddWallComment,
  onDeleteWallComment,
  onShareUrl,
}: ProfilePageProps) {
  const theme = PROFILE_THEMES[listing.profileStyle?.themeId || 'stage-coral'];
  const canCustomize = Boolean(user && listing.ownerUid === user.uid);
  const actionState = getProfileActionState(listing, user?.uid, inviteByTargetUid);

  const orderedClips = (() => {
    const raw = listing.clips || [];
    if (!listing.featuredClipId) return raw;
    const idx = raw.findIndex((c) => c.id === listing.featuredClipId);
    if (idx <= 0) return raw;
    return [raw[idx], ...raw.slice(0, idx), ...raw.slice(idx + 1)];
  })();

  const [activeClipId, setActiveClipId] = useState<string | undefined>(orderedClips[0]?.id);
  const [customizeOpen, setCustomizeOpen] = useState(false);
  const [moodDraft, setMoodDraft] = useState(listing.profileStyle?.moodStatus ?? '');
  const [soundsLikeDraft, setSoundsLikeDraft] = useState(
    (listing.profileStyle?.soundsLike ?? []).join(', ')
  );

  const [newGearCategory, setNewGearCategory] = useState<GearCategory>('Instruments');
  const [newGearName, setNewGearName] = useState('');
  const [newGearNotes, setNewGearNotes] = useState('');

  const [wallText, setWallText] = useState('');
  const wallFormRef = useRef<HTMLFormElement>(null);

  const localSceneNeighbors = allListings
    .filter((item) => item.id !== listing.id && item.regionId === listing.regionId)
    .slice(0, 4);

  const safeHref = safeHttpsUrl(listing.sampleLink);
  const isJam = listing.side === 'jam';

  const groupedGear = GEAR_CATEGORIES.map((category) => ({
    category,
    items: listing.gearLocker.filter((g) => g.category === category),
  })).filter((group) => group.items.length > 0);

  const handleThemeChange = (themeId: ProfileThemeId) => {
    onUpdateListing({
      ...listing,
      profileStyle: {
        ...listing.profileStyle,
        themeId,
      },
    });
  };

  const handleSaveCustomStyle = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedSounds = soundsLikeDraft
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    onUpdateListing({
      ...listing,
      profileStyle: {
        ...listing.profileStyle,
        moodStatus: moodDraft.trim() || undefined,
        soundsLike: parsedSounds,
      },
    });
    setCustomizeOpen(false);
  };

  const handleSetMainClip = (clipId: string) => {
    onUpdateListing({
      ...listing,
      featuredClipId: clipId,
    });
    setActiveClipId(clipId);
  };

  const handleAddGearItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGearName.trim()) return;
    const item: GearItem = {
      id: `gear-${Date.now()}`,
      category: newGearCategory,
      name: newGearName.trim(),
      notes: newGearNotes.trim() || undefined,
    };
    onUpdateListing({
      ...listing,
      gearLocker: [...listing.gearLocker, item],
    });
    setNewGearName('');
    setNewGearNotes('');
  };

  const handleRemoveGearItem = (gearId: string) => {
    onUpdateListing({
      ...listing,
      gearLocker: listing.gearLocker.filter((g) => g.id !== gearId),
    });
  };

  const submitWallNote = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = wallText.trim();
    if (!trimmed) return;
    onAddWallComment(listing.id, trimmed);
    setWallText('');
  };

  const handleWallKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.keyCode === 229) return;
      wallFormRef.current?.requestSubmit();
    }
  };

  return (
    <article
      className={`profile-theme-${theme.id} mx-auto w-full max-w-[1440px] space-y-6 pb-8`}
    >
      {/* MySpace-inspired custom-themed hero banner */}
      <header
        className="relative overflow-hidden rounded-[2rem] border p-6 shadow-[0_24px_60px_var(--glass-shadow)] md:p-8"
        style={{
          backgroundColor: 'var(--pt-bg-to)',
          backgroundImage:
            'radial-gradient(circle at 85% 18%, var(--pt-glow), transparent 50%), linear-gradient(135deg, var(--pt-bg-from), var(--pt-bg-to))',
          borderColor: 'var(--pt-border)',
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-4 py-2 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to {selectedRegion?.city ?? region?.city ?? 'scene'}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {canCustomize && (
              <button
                type="button"
                onClick={() => setCustomizeOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border)] bg-[var(--pt-pill-bg)] px-4 py-2 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
              >
                <Palette
                  className="h-3.5 w-3.5"
                  style={{ color: 'var(--pt-accent)' }}
                  aria-hidden="true"
                />
                <span>{customizeOpen ? 'Close editor' : 'Customize page'}</span>
              </button>
            )}

            {listing.ownerUid && user?.uid !== listing.ownerUid && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    onSafetyAction({
                      mode: 'report',
                      targetUid: listing.ownerUid!,
                      targetName: listing.ownerName || listing.title,
                      targetType: 'profile',
                      targetId: listing.id,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--muted)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)] hover:text-[var(--ink)]"
                >
                  <Flag className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Report</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    onSafetyAction({
                      mode: 'block',
                      targetUid: listing.ownerUid!,
                      targetName: listing.ownerName || listing.title,
                      targetType: 'profile',
                      targetId: listing.id,
                    })
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--err)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
                >
                  <ShieldBan className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Block</span>
                </button>
              </>
            )}

            <button
              type="button"
              onClick={onShareUrl}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-4 py-2 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
            >
              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Share link</span>
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div className="space-y-3.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
              >
                {isJam
                  ? 'Jam player'
                  : listing.gigSubtype === 'open-gig'
                    ? 'Open gig slot'
                    : 'Band for hire'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1 text-xs font-medium text-[var(--ink)]">
                <MapPin
                  className="h-3.5 w-3.5"
                  style={{ color: 'var(--pt-accent)' }}
                  aria-hidden="true"
                />
                {listing.neighborhood}, {region?.label ?? listing.regionLabel ?? listing.regionId}
              </span>
              {selectedRegion && listing.regionId !== selectedRegion.id && (() => {
                const distanceText = formatRoughDistance(
                  estimateRoughDistanceMiles(selectedRegion, region),
                  selectedRegion,
                  region,
                  'verbose'
                );
                return distanceText ? (
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1 text-xs font-bold"
                    style={{ color: 'var(--pt-accent)' }}
                  >
                    {distanceText}
                  </span>
                ) : null;
              })()}
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                Live profile (Firestore)
              </span>
              {listing.instagramHandle && (
                <a
                  href={`https://www.instagram.com/${listing.instagramHandle}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--pt-pill-hover)]"
                >
                  <Instagram className="h-3.5 w-3.5" style={{ color: 'var(--pt-accent)' }} aria-hidden="true" />
                  <span>@{listing.instagramHandle}</span>
                </a>
              )}
              {listing.payOrSplit && (
                <span className="rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--ink)]">
                  {listing.payOrSplit}
                </span>
              )}
            </div>

            <div className="flex items-center gap-4">
              {listing.portraitUrl && (
                <img
                  src={listing.portraitUrl}
                  alt={listing.portraitAlt || listing.title}
                  className="h-16 w-16 shrink-0 rounded-2xl border object-cover object-[50%_20%]"
                  style={{ borderColor: 'var(--pt-border)' }}
                />
              )}
              <div className="min-w-0">
                <h1 className="hero-title font-bold text-[var(--ink)]">{listing.title}</h1>
                <p className="text-base font-medium text-[var(--muted)]">{listing.subtitle}</p>
              </div>
            </div>

            <InstrumentBadgeRow instruments={listing.instruments} max={6} />

            {listing.profileStyle?.moodStatus && (
              <div className="inline-flex max-w-2xl items-center gap-2 rounded-2xl border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-4 py-2 text-sm text-[var(--ink)] backdrop-blur-md">
                <Sparkles
                  className="h-4 w-4 shrink-0"
                  style={{ color: 'var(--pt-accent)' }}
                  aria-hidden="true"
                />
                <span>
                  <strong className="font-semibold text-[var(--ink)]">Status:</strong>{' '}
                  {listing.profileStyle.moodStatus}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {actionState.kind === 'accepted' ? (
              <button
                type="button"
                onClick={() => onOpenInvites(actionState.invite.threadId, 'inbox')}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition hover:opacity-90"
                style={{ backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Open messages</span>
              </button>
            ) : actionState.kind === 'incoming' ? (
              <button
                type="button"
                onClick={() => onOpenInvites(undefined, 'requests')}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition hover:opacity-90"
                style={{ backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
              >
                <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Review request in Messages</span>
              </button>
            ) : actionState.kind === 'sent' ? (
              <button
                type="button"
                onClick={() => onOpenInvites(undefined, 'sent')}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--pt-border)] bg-[var(--pt-pill-bg)] px-6 py-3.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--pt-pill-hover)]"
              >
                <span>Request sent — view in Sent</span>
              </button>
            ) : actionState.kind === 'invite' ? (
              <button
                type="button"
                onClick={() => onInvite(listing)}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition hover:opacity-90"
                style={{ backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
              >
                <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                <span>Invite to jam</span>
              </button>
            ) : null}
          </div>
        </div>
      </header>

      {/* Owner live customizer */}
      {canCustomize && customizeOpen && (
        <section
          aria-label="Customize your profile page"
          className="glass-surface space-y-5 rounded-3xl p-6"
          style={{ borderColor: 'var(--pt-border)' }}
        >
          <div>
            <h2 className="font-display text-xl font-bold text-[var(--ink)]">
              Customize your artist page
            </h2>
            <p className="text-xs text-[var(--muted)]">
              Pick a room aesthetic, set your status line, and update your influence tags
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
            {PROFILE_THEME_LIST.map((t) => {
              const selected = t.id === theme.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleThemeChange(t.id)}
                  className={`profile-theme-${t.id} rounded-2xl border p-3 text-left transition`}
                  style={{
                    background: 'linear-gradient(135deg, var(--pt-bg-from), var(--pt-bg-to))',
                    borderColor: selected ? 'var(--pt-accent)' : 'var(--pt-border)',
                    boxShadow: selected ? '0 0 0 1px var(--pt-accent)' : undefined,
                  }}
                >
                  <span
                    className="mb-2 block h-3 w-8 rounded-full"
                    style={{ backgroundColor: 'var(--pt-accent)' }}
                  />
                  <span className="block text-xs font-bold text-[var(--ink)]">{t.name}</span>
                  <span className="block text-[11px] text-[var(--muted)]">{t.tagline}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSaveCustomStyle} className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label htmlFor="page-mood-input" className="mb-1 block text-xs font-semibold">
                Current mood or session status
              </label>
              <input
                id="page-mood-input"
                type="text"
                maxLength={100}
                value={moodDraft}
                onChange={(e) => setMoodDraft(e.target.value)}
                placeholder="e.g. Tracking bass demos in East Austin all week"
                className="field-control"
              />
            </div>

            <div>
              <label htmlFor="page-sounds-input" className="mb-1 block text-xs font-semibold">
                Sounds like / influences (comma-separated)
              </label>
              <input
                id="page-sounds-input"
                type="text"
                maxLength={120}
                value={soundsLikeDraft}
                onChange={(e) => setSoundsLikeDraft(e.target.value)}
                placeholder="e.g. Khruangbin, Radiohead, Thee Oh Sees"
                className="field-control"
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-2xl px-5 py-2.5 text-xs font-bold"
                style={{ backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
              >
                Save page style
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Two-column MySpace-inspired layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left column: Featured video stage, playlist, details, and Top 4 local scene */}
        <div className="space-y-6 lg:col-span-5">
          {/* Featured Video / Audio Reel Player */}
          {(() => {
            const activeStageClip =
              orderedClips.find((c) => c.id === activeClipId) ?? orderedClips[0];
            const stageIsEmbed =
              activeStageClip?.kind === 'embed' && Boolean(activeStageClip.embedUrl);
            const stageIsPortraitOnly =
              orderedClips.length === 0 && Boolean(listing.portraitUrl);
            return (
              <div
                className={`relative overflow-hidden rounded-[2rem] border bg-[var(--surface-solid)] shadow-[0_24px_60px_var(--glass-shadow)] ${
                  stageIsEmbed
                    ? 'h-[28rem] sm:h-[32rem]'
                    : stageIsPortraitOnly
                      ? 'mx-auto aspect-[4/5] w-full max-w-[23rem]'
                      : 'mx-auto aspect-[9/16] max-h-[38rem] w-full max-w-[21.5rem]'
                }`}
                style={{ borderColor: 'var(--pt-border)' }}
              >
                <ClipPlayer
                  listing={listing}
                  areaCode={region?.areaCode}
                  isActive
                  soundEnabled={soundEnabled}
                  onToggleSound={onToggleSound}
                  activeClipId={activeClipId}
                  onActiveClipChange={setActiveClipId}
                />
              </div>
            );
          })()}

          {/* MySpace Music Playlist */}
          {orderedClips.length > 0 && (
            <section
              aria-label="Clips and recordings playlist"
              className="rounded-3xl border p-5"
              style={{
                backgroundColor: 'var(--pt-surface)',
                borderColor: 'var(--pt-border)',
              }}
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-[var(--ink)]">Clips &amp; reels</h2>
                <span className="text-xs text-[var(--muted)]">
                  {orderedClips.length} {orderedClips.length === 1 ? 'track' : 'tracks'}
                </span>
              </div>

              <ul className="space-y-2">
                {orderedClips.map((clip, idx) => {
                  const isPlayingNow = clip.id === (activeClipId || orderedClips[0]?.id);
                  const isMain = clip.id === (listing.featuredClipId || orderedClips[0]?.id);
                  return (
                    <li
                      key={clip.id}
                      className="flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 transition"
                      style={{
                        borderColor: isPlayingNow ? 'var(--pt-accent)' : 'var(--pt-border-subtle)',
                        backgroundColor: isPlayingNow
                          ? 'var(--pt-surface-active)'
                          : 'var(--pt-surface-inner)',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setActiveClipId(clip.id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span
                          className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full"
                          style={
                            isPlayingNow
                              ? { backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }
                              : { backgroundColor: 'var(--pt-pill-bg)', color: 'var(--ink)' }
                          }
                        >
                          <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--ink)]">
                            {idx + 1}. {clip.title}
                          </p>
                          <p className="text-xs text-[var(--muted)]">
                            {clip.kind === 'embed'
                              ? `${embedProviderLabel(clip.embedProvider)} link`
                              : clip.kind === 'video'
                                ? 'Video clip'
                                : clip.kind === 'audio'
                                  ? 'Audio clip'
                                  : 'Stage synth visual'}
                            , {clip.durationSec}s
                          </p>
                        </div>
                      </button>

                      <div className="flex shrink-0 items-center gap-2">
                        {isMain ? (
                          <span
                            className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                            style={{
                              backgroundColor: 'var(--pt-accent)',
                              color: 'var(--pt-accent-ink)',
                            }}
                          >
                            <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                            <span>Main clip</span>
                          </span>
                        ) : (
                          canCustomize && (
                            <button
                              type="button"
                              onClick={() => handleSetMainClip(clip.id)}
                              className="rounded-full border border-[var(--pt-border)] bg-[var(--pt-pill-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--ink)] transition hover:bg-[var(--pt-pill-hover)]"
                            >
                              Set main
                            </button>
                          )
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}

          {/* Schedule & Press Link */}
          <section
            className="space-y-3 rounded-3xl border p-5"
            style={{
              backgroundColor: 'var(--pt-surface)',
              borderColor: 'var(--pt-border)',
            }}
          >
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
              Availability &amp; links
            </h2>
            <div className="flex items-start gap-3 text-sm text-[var(--ink)]/90">
              <Calendar
                className="mt-0.5 h-4 w-4 shrink-0"
                style={{ color: 'var(--pt-accent)' }}
                aria-hidden="true"
              />
              <span>{listing.availability}</span>
            </div>
            {safeHref && (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-[var(--pt-border)] underline-offset-4 hover:opacity-85"
                style={{ color: 'var(--pt-accent)' }}
              >
                <span>Open music / press kit ({listing.sampleLink})</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </section>

          {/* Local Scene: "Top 4 in City" (MySpace Top Friends homage) */}
          {localSceneNeighbors.length > 0 && (
            <section
              className="rounded-3xl border p-5"
              style={{
                backgroundColor: 'var(--pt-surface)',
                borderColor: 'var(--pt-border)',
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Users
                  className="h-4 w-4"
                  style={{ color: 'var(--pt-accent)' }}
                  aria-hidden="true"
                />
                <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                  Nearby in {region?.city ?? listing.regionId}
                </h2>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {localSceneNeighbors.map((neighbor) => {
                  const nRegion = allRegions.find((r) => r.id === neighbor.regionId);
                  return (
                    <button
                      key={neighbor.id}
                      type="button"
                      onClick={() => onOpenProfile(neighbor)}
                      className="flex items-center gap-2.5 rounded-2xl border p-2.5 text-left transition hover:brightness-95"
                      style={{
                        backgroundColor: 'var(--pt-surface-inner)',
                        borderColor: 'var(--pt-border-subtle)',
                      }}
                    >
                      {neighbor.portraitUrl && (
                        <img
                          src={neighbor.portraitUrl}
                          alt={neighbor.portraitAlt || neighbor.title}
                          loading="lazy"
                          decoding="async"
                          className="h-10 w-10 shrink-0 rounded-xl object-cover object-[50%_20%]"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-display truncate text-sm font-bold text-[var(--ink)]">
                          {neighbor.title}
                        </p>
                        <p className="truncate text-xs text-[var(--muted)]">{neighbor.subtitle}</p>
                        <p
                          className="mt-1 text-[11px] font-medium"
                          style={{ color: 'var(--pt-accent)' }}
                        >
                          {neighbor.neighborhood || nRegion?.city}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>

        {/* Right column: Bio, Influences, Music Nerd Gear Locker, and MySpace Comment Wall */}
        <div className="space-y-6 lg:col-span-7">
          {/* About & Sounds Like */}
          <section
            className="space-y-4 rounded-3xl border p-6"
            style={{
              backgroundColor: 'var(--pt-surface)',
              borderColor: 'var(--pt-border)',
            }}
          >
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--ink)]">
                What I&apos;m looking for
              </h2>
              <p
                className="mt-1.5 text-lg font-semibold leading-snug"
                style={{ color: 'var(--pt-accent)' }}
              >
                {listing.seekingOrOffer}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-[var(--ink)]/90">{listing.bio}</p>

            <div className="flex flex-wrap gap-2 pt-1">
              {listing.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border px-3 py-1 text-xs font-semibold text-[var(--ink)]"
                  style={{
                    backgroundColor: 'var(--pt-pill-bg)',
                    borderColor: 'var(--pt-border-subtle)',
                  }}
                >
                  {g}
                </span>
              ))}
            </div>

            {listing.profileStyle?.soundsLike && listing.profileStyle.soundsLike.length > 0 && (
              <div
                className="border-t pt-4"
                style={{ borderColor: 'var(--pt-border-subtle)' }}
              >
                <p className="mb-2 text-xs font-semibold text-[var(--muted)]">
                  Sounds like / influences
                </p>
                <div className="flex flex-wrap gap-2">
                  {listing.profileStyle.soundsLike.map((artist) => (
                    <span
                      key={artist}
                      className="rounded-xl border px-3 py-1.5 text-xs font-medium text-[var(--ink)]"
                      style={{
                        backgroundColor: 'var(--pt-surface-inner)',
                        borderColor: 'var(--pt-border-subtle)',
                      }}
                    >
                      {artist}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* The Gear Locker */}
          <section
            className="space-y-4 rounded-3xl border p-6"
            style={{
              backgroundColor: 'var(--pt-surface)',
              borderColor: 'var(--pt-border)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Speaker
                  className="h-5 w-5"
                  style={{ color: 'var(--pt-accent)' }}
                  aria-hidden="true"
                />
                <div>
                  <h2 className="font-display text-xl font-bold text-[var(--ink)]">
                    Gear locker &amp; rig
                  </h2>
                  <p className="text-xs text-[var(--muted)]">
                    Exact instruments, amps, pedals, mics, or stage backline
                  </p>
                </div>
              </div>
            </div>

            {groupedGear.length > 0 ? (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {groupedGear.map((group) => (
                  <div
                    key={group.category}
                    className="rounded-2xl border p-4"
                    style={{
                      backgroundColor: 'var(--pt-surface-inner)',
                      borderColor: 'var(--pt-border-subtle)',
                    }}
                  >
                    <h3 className="text-xs font-bold" style={{ color: 'var(--pt-accent)' }}>
                      {group.category}
                    </h3>
                    <ul className="mt-2.5 space-y-2.5">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-[var(--ink)]">{item.name}</p>
                            {item.notes && (
                              <p className="text-xs text-[var(--muted)]">{item.notes}</p>
                            )}
                          </div>
                          {canCustomize && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGearItem(item.id)}
                              aria-label={`Remove ${item.name}`}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--muted)] hover:bg-[var(--pt-pill-hover)] hover:text-[var(--err)]"
                            >
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <p
                className="rounded-2xl border p-4 text-sm text-[var(--ink)]/90"
                style={{
                  backgroundColor: 'var(--pt-surface-inner)',
                  borderColor: 'var(--pt-border-subtle)',
                }}
              >
                {listing.gearOrBackline}
              </p>
            )}

            {canCustomize && (
              <form
                onSubmit={handleAddGearItem}
                className="grid grid-cols-1 gap-2.5 rounded-2xl border border-dashed p-4 sm:grid-cols-12"
                style={{
                  backgroundColor: 'var(--pt-surface-inner)',
                  borderColor: 'var(--pt-border)',
                }}
              >
                <div className="sm:col-span-4">
                  <label htmlFor="page-gear-cat" className="visually-hidden">
                    Gear category
                  </label>
                  <select
                    id="page-gear-cat"
                    value={newGearCategory}
                    onChange={(e) => setNewGearCategory(e.target.value as GearCategory)}
                    className="field-control text-xs"
                  >
                    {GEAR_CATEGORIES.map((cat) => (
                      <option
                        key={cat}
                        value={cat}
                        className="bg-[var(--surface-solid)] text-[var(--ink)]"
                      >
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="page-gear-name" className="visually-hidden">
                    Gear piece name
                  </label>
                  <input
                    id="page-gear-name"
                    type="text"
                    required
                    value={newGearName}
                    onChange={(e) => setNewGearName(e.target.value)}
                    placeholder="e.g. Fender Twin Reverb"
                    className="field-control text-xs"
                  />
                </div>
                <div className="flex gap-2 sm:col-span-4">
                  <label htmlFor="page-gear-notes" className="visually-hidden">
                    Gear notes
                  </label>
                  <input
                    id="page-gear-notes"
                    type="text"
                    value={newGearNotes}
                    onChange={(e) => setNewGearNotes(e.target.value)}
                    placeholder="Tone / notes"
                    className="field-control text-xs"
                  />
                  <button
                    type="submit"
                    aria-label="Add gear piece"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: 'var(--pt-accent)',
                      color: 'var(--pt-accent-ink)',
                    }}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* MySpace-style Comment Wall */}
          <section
            className="space-y-4 rounded-3xl border p-6"
            style={{
              backgroundColor: 'var(--pt-surface)',
              borderColor: 'var(--pt-border)',
            }}
          >
            <div>
              <h2 className="font-display text-xl font-bold text-[var(--ink)]">Scene wall</h2>
              <p className="text-xs text-[var(--muted)]">
                {`Public scene wall for ${listing.title} backed by Cloud Firestore.`}
              </p>
            </div>

            {wallComments.length === 0 ? (
              <p
                className="rounded-2xl border border-dashed p-4 text-sm text-[var(--muted)]"
                style={{
                  backgroundColor: 'var(--pt-surface-inner)',
                  borderColor: 'var(--pt-border)',
                }}
              >
                No wall notes yet. Be the first local musician to say hey.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {wallComments.map((comment) => {
                  const canDelete = Boolean(
                    user &&
                      ((comment.authorUid && comment.authorUid === user.uid) ||
                        (listing.ownerUid && listing.ownerUid === user.uid))
                  );
                  const canReport = Boolean(
                    user &&
                      comment.authorUid &&
                      comment.authorUid !== user.uid
                  );
                  return (
                    <li
                      key={comment.id}
                      className="rounded-2xl border px-4 py-3"
                      style={{
                        backgroundColor: 'var(--pt-surface-inner)',
                        borderColor: 'var(--pt-border-subtle)',
                      }}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-bold" style={{ color: 'var(--pt-accent)' }}>
                          {comment.authorName}
                        </p>
                        {(canDelete || canReport) && (
                          <div className="flex items-center gap-2 text-[11px]">
                            {canReport && (
                              <button
                                type="button"
                                onClick={() =>
                                  onSafetyAction({
                                    mode: 'report',
                                    targetUid: comment.authorUid!,
                                    targetName: comment.authorName,
                                    targetType: 'wallNote',
                                    targetId: comment.id,
                                  })
                                }
                                className="font-medium text-[var(--muted)] hover:text-[var(--ink)]"
                              >
                                Report
                              </button>
                            )}
                            {canDelete && onDeleteWallComment && (
                              <button
                                type="button"
                                onClick={() => onDeleteWallComment(listing.id, comment.id)}
                                className="font-medium text-[var(--err)] hover:opacity-80"
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-[var(--ink)]">{comment.text}</p>
                    </li>
                  );
                })}
              </ul>
            )}

            <form ref={wallFormRef} onSubmit={submitWallNote} className="flex items-end gap-2.5">
              <label htmlFor="wall-note-input" className="visually-hidden">
                Write a wall note for {listing.title}
              </label>
              <textarea
                id="wall-note-input"
                rows={2}
                maxLength={280}
                value={wallText}
                onChange={(e) => setWallText(e.target.value)}
                onKeyDown={handleWallKeyDown}
                placeholder={
                  user
                    ? `Leave a public note on ${listing.title}'s wall...`
                    : `Write a note (prompts Apple/Google sign-in on post)...`
                }
                className="field-control resize-none"
              />
              <button
                type="submit"
                disabled={!wallText.trim()}
                aria-label="Post wall note"
                className="inline-flex h-12 shrink-0 items-center gap-1.5 rounded-2xl px-4 text-xs font-bold transition disabled:opacity-40"
                style={{
                  backgroundColor: 'var(--pt-accent)',
                  color: 'var(--pt-accent-ink)',
                }}
              >
                <Send className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Post</span>
              </button>
            </form>
          </section>
        </div>
      </div>
    </article>
  );
}
