import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Flag,
  Flame,
  Globe,
  GraduationCap,
  Instagram,
  MapPin,
  MessageCircle,
  Mic2,
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
  const [offersSessionDraft, setOffersSessionDraft] = useState(Boolean(listing.offersSession));
  const [offersLessonsDraft, setOffersLessonsDraft] = useState(Boolean(listing.offersLessons));
  const [remoteFriendlyDraft, setRemoteFriendlyDraft] = useState(Boolean(listing.remoteFriendly));
  const [sessionRateDraft, setSessionRateDraft] = useState(listing.sessionRate ?? '');
  const [lessonRateDraft, setLessonRateDraft] = useState(listing.lessonRate ?? '');
  const [serviceNoteDraft, setServiceNoteDraft] = useState(listing.serviceNote ?? '');

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
      offersSession: offersSessionDraft || undefined,
      offersLessons: offersLessonsDraft || undefined,
      remoteFriendly: remoteFriendlyDraft || undefined,
      sessionRate: offersSessionDraft
        ? sessionRateDraft.trim().slice(0, 32) || undefined
        : undefined,
      lessonRate: offersLessonsDraft
        ? lessonRateDraft.trim().slice(0, 32) || undefined
        : undefined,
      serviceNote:
        offersSessionDraft || offersLessonsDraft
          ? serviceNoteDraft.trim().slice(0, 180) || undefined
          : undefined,
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

  const hasHeaderAction =
    actionState.kind === 'accepted' ||
    actionState.kind === 'incoming' ||
    actionState.kind === 'sent' ||
    actionState.kind === 'invite';

  return (
    <article
      className={`profile-theme-${theme.id} mx-auto w-full max-w-[1220px] space-y-5 pb-20 lg:pb-10`}
    >
      {/* Slim frameless utility bar */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3.5 py-1.5 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to {selectedRegion?.city ?? region?.city ?? 'scene'}</span>
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          {canCustomize && (
            <button
              type="button"
              aria-expanded={customizeOpen}
              aria-controls="profile-customizer-panel"
              onClick={() => setCustomizeOpen((prev) => !prev)}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--pt-border)] bg-[var(--pt-pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
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
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)] hover:text-[var(--ink)]"
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
                className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--err)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
              >
                <ShieldBan className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Block</span>
              </button>
            </>
          )}

          <button
            type="button"
            onClick={onShareUrl}
            className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] backdrop-blur-md transition hover:bg-[var(--pt-pill-hover)]"
          >
            <Share2 className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Share link</span>
          </button>
        </div>
      </div>

      {/* Owner live customizer */}
      {canCustomize && customizeOpen && (
        <section
          id="profile-customizer-panel"
          className="glass-surface space-y-4 rounded-2xl p-5"
          style={{ borderColor: 'var(--pt-border)' }}
        >
          <div>
            <h2 className="font-display text-lg font-bold text-[var(--ink)]">
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
                placeholder="e.g. Tracking bass demos in Silver Lake all week"
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
                placeholder="e.g. Khruangbin, Radiohead, Alvvays"
                className="field-control"
              />
            </div>

            <div className="space-y-3 rounded-2xl border border-[var(--pt-border-subtle)] bg-[var(--pt-surface-inner)] p-4 md:col-span-2">
              <div>
                <p className="text-xs font-bold text-[var(--ink)]">
                  Session work, lessons &amp; pricing (optional, free)
                </p>
                <p className="text-[11px] text-[var(--muted)]">
                  Enable badges and optional pricing to appear in Find a Session Player and Find a Teacher.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  aria-pressed={offersSessionDraft}
                  onClick={() => setOffersSessionDraft((v) => !v)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
                  style={
                    offersSessionDraft
                      ? {
                          backgroundColor: 'rgba(245, 158, 11, 0.16)',
                          borderColor: 'rgba(245, 158, 11, 0.55)',
                          color: 'light-dark(#b45309, #fcd34d)',
                        }
                      : {
                          backgroundColor: 'var(--pt-pill-bg)',
                          borderColor: 'var(--pt-border-subtle)',
                          color: 'var(--muted)',
                        }
                  }
                >
                  <Mic2 className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Session Player</span>
                </button>

                <button
                  type="button"
                  aria-pressed={offersLessonsDraft}
                  onClick={() => setOffersLessonsDraft((v) => !v)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
                  style={
                    offersLessonsDraft
                      ? {
                          backgroundColor: 'rgba(16, 185, 129, 0.16)',
                          borderColor: 'rgba(16, 185, 129, 0.55)',
                          color: 'light-dark(#047857, #6ee7b7)',
                        }
                      : {
                          backgroundColor: 'var(--pt-pill-bg)',
                          borderColor: 'var(--pt-border-subtle)',
                          color: 'var(--muted)',
                        }
                  }
                >
                  <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Teacher</span>
                </button>

                <button
                  type="button"
                  aria-pressed={remoteFriendlyDraft}
                  onClick={() => setRemoteFriendlyDraft((v) => !v)}
                  className="inline-flex min-h-8 items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
                  style={
                    remoteFriendlyDraft
                      ? {
                          backgroundColor: 'rgba(14, 165, 233, 0.16)',
                          borderColor: 'rgba(14, 165, 233, 0.55)',
                          color: 'light-dark(#0369a1, #7dd3fc)',
                        }
                      : {
                          backgroundColor: 'var(--pt-pill-bg)',
                          borderColor: 'var(--pt-border-subtle)',
                          color: 'var(--muted)',
                        }
                  }
                >
                  <Globe className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Remote-friendly</span>
                </button>
              </div>

              {(offersSessionDraft || offersLessonsDraft) && (
                <div className="grid grid-cols-1 gap-3 pt-1 sm:grid-cols-2">
                  {offersSessionDraft && (
                    <div>
                      <label htmlFor="page-session-rate" className="mb-1 block text-xs font-semibold">
                        Session pricing (optional)
                      </label>
                      <input
                        id="page-session-rate"
                        type="text"
                        maxLength={32}
                        value={sessionRateDraft}
                        onChange={(e) => setSessionRateDraft(e.target.value)}
                        placeholder="e.g. $85/track or $75/hr"
                        className="field-control"
                      />
                    </div>
                  )}

                  {offersLessonsDraft && (
                    <div>
                      <label htmlFor="page-lesson-rate" className="mb-1 block text-xs font-semibold">
                        Lesson pricing (optional)
                      </label>
                      <input
                        id="page-lesson-rate"
                        type="text"
                        maxLength={32}
                        value={lessonRateDraft}
                        onChange={(e) => setLessonRateDraft(e.target.value)}
                        placeholder="e.g. $65/hr"
                        className="field-control"
                      />
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label htmlFor="page-service-note" className="mb-1 block text-xs font-semibold">
                      Service details (optional)
                    </label>
                    <input
                      id="page-service-note"
                      type="text"
                      maxLength={180}
                      value={serviceNoteDraft}
                      onChange={(e) => setServiceNoteDraft(e.target.value)}
                      placeholder="e.g. Remote multi-mic drum stems in 48h, or 1-on-1 guitar lessons"
                      className="field-control"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                className="rounded-xl px-5 py-2.5 text-xs font-bold"
                style={{ backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
              >
                Save page updates
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Two-column editorial layout: sticky media stage + flowing profile details */}
      <div className="grid grid-cols-1 items-start gap-5 lg:grid-cols-[minmax(19rem,21.5rem)_minmax(0,1fr)] lg:gap-6">
        {/* Left column: Sticky featured video stage + optional multi-clip switcher */}
        <div className="space-y-4 lg:sticky lg:top-[4.75rem]">
          {(() => {
            const activeStageClip =
              orderedClips.find((c) => c.id === activeClipId) ?? orderedClips[0];
            const stageIsEmbed =
              activeStageClip?.kind === 'embed' && Boolean(activeStageClip.embedUrl);
            const stageIsPortraitOnly =
              orderedClips.length === 0 && Boolean(listing.portraitUrl);
            return (
              <div
                className={`relative overflow-hidden rounded-[1.75rem] border bg-[var(--surface-solid)] shadow-[0_18px_48px_var(--glass-shadow)] ${
                  stageIsEmbed
                    ? 'h-[28rem] w-full sm:h-[32rem]'
                    : stageIsPortraitOnly
                      ? 'mx-auto aspect-[4/5] w-full max-w-[21.5rem]'
                      : 'profile-video-stage mx-auto'
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

          {orderedClips.length > 1 && (
            <section
              className="rounded-2xl border p-4"
              style={{
                backgroundColor: 'var(--pt-surface)',
                borderColor: 'var(--pt-border)',
              }}
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <h2 className="font-display text-base font-bold text-[var(--ink)]">
                  Clips &amp; reels
                </h2>
                <span className="text-xs text-[var(--muted)]">{orderedClips.length} tracks</span>
              </div>

              <ul role="list" className="space-y-2">
                {orderedClips.map((clip, idx) => {
                  const isPlayingNow = clip.id === (activeClipId || orderedClips[0]?.id);
                  const isMain = clip.id === (listing.featuredClipId || orderedClips[0]?.id);
                  return (
                    <li
                      key={clip.id}
                      className="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 transition"
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
                        className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
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
        </div>

        {/* Right column: Compact Identity Header, Looking For + Bio + Availability, Gear Locker, Wall */}
        <div className="min-w-0 space-y-4 sm:space-y-5">
          {/* Compact Themed Artist Identity Header */}
          <header
            className="relative overflow-hidden rounded-3xl border p-5 shadow-[0_16px_44px_var(--glass-shadow)] md:p-6"
            style={{
              backgroundColor: 'var(--pt-bg-to)',
              backgroundImage:
                'radial-gradient(circle at 88% 15%, var(--pt-glow), transparent 55%), linear-gradient(135deg, var(--pt-bg-from), var(--pt-bg-to))',
              borderColor: 'var(--pt-border)',
            }}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1 space-y-2.5">
                <div className="balanced-wrap items-center gap-1.5">
                  <span
                    className="rounded-full px-2.5 py-0.5 text-xs font-bold"
                    style={{ backgroundColor: 'var(--pt-accent)', color: 'var(--pt-accent-ink)' }}
                  >
                    {isJam
                      ? 'Jam player'
                      : listing.gigSubtype === 'open-gig'
                        ? 'Open gig slot'
                        : 'Band for hire'}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-2.5 py-0.5 text-xs font-medium text-[var(--ink)]">
                    <MapPin
                      className="h-3.5 w-3.5 shrink-0"
                      style={{ color: 'var(--pt-accent)' }}
                      aria-hidden="true"
                    />
                    <span>
                      {listing.neighborhood},{' '}
                      {region?.label ?? listing.regionLabel ?? listing.regionId}
                    </span>
                  </span>
                  {selectedRegion &&
                    listing.regionId !== selectedRegion.id &&
                    (() => {
                      const distanceText = formatRoughDistance(
                        estimateRoughDistanceMiles(selectedRegion, region),
                        selectedRegion,
                        region,
                        'verbose'
                      );
                      return distanceText ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-2.5 py-0.5 text-xs font-bold"
                          style={{ color: 'var(--pt-accent)' }}
                        >
                          {distanceText}
                        </span>
                      ) : null;
                    })()}
                  {listing.instagramHandle && (
                    <a
                      href={`https://www.instagram.com/${listing.instagramHandle}/`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--pt-pill-hover)]"
                    >
                      <Instagram
                        className="h-3.5 w-3.5 shrink-0"
                        style={{ color: 'var(--pt-accent)' }}
                        aria-hidden="true"
                      />
                      <span>@{listing.instagramHandle}</span>
                    </a>
                  )}
                  {listing.offersSession && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-amber-500/35 bg-amber-500/15 px-2.5 py-0.5 text-xs font-semibold"
                      style={{ color: 'light-dark(#b45309, #fcd34d)' }}
                    >
                      <Mic2 className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>
                        {listing.sessionRate ? `Session · ${listing.sessionRate}` : 'Session Player'}
                      </span>
                    </span>
                  )}
                  {listing.offersLessons && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-semibold"
                      style={{ color: 'light-dark(#047857, #6ee7b7)' }}
                    >
                      <GraduationCap className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>
                        {listing.lessonRate ? `Teacher · ${listing.lessonRate}` : 'Teacher'}
                      </span>
                    </span>
                  )}
                  {listing.remoteFriendly && (
                    <span
                      className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold"
                      style={{ color: 'light-dark(#0369a1, #7dd3fc)' }}
                    >
                      <Globe className="h-3 w-3 shrink-0" aria-hidden="true" />
                      <span>Remote-friendly</span>
                    </span>
                  )}
                  {listing.payOrSplit && (
                    <span className="rounded-full border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-2.5 py-0.5 text-xs font-semibold text-[var(--ink)]">
                      {listing.payOrSplit}
                    </span>
                  )}
                </div>

                <div>
                  <h1 className="profile-title text-[var(--ink)]">{listing.title}</h1>
                  <p className="mt-1 text-sm font-medium text-[var(--muted)] sm:text-base">
                    {listing.subtitle}
                  </p>
                </div>
              </div>

              {hasHeaderAction && (
                <div className="shrink-0 sm:self-start">
                  {actionState.kind === 'accepted' ? (
                    <button
                      type="button"
                      onClick={() => onOpenInvites(actionState.invite.threadId, 'inbox')}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--pt-accent)',
                        color: 'var(--pt-accent-ink)',
                      }}
                    >
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      <span>Open messages</span>
                    </button>
                  ) : actionState.kind === 'incoming' ? (
                    <button
                      type="button"
                      onClick={() => onOpenInvites(undefined, 'requests')}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--pt-accent)',
                        color: 'var(--pt-accent-ink)',
                      }}
                    >
                      <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                      <span>Review request in Messages</span>
                    </button>
                  ) : actionState.kind === 'sent' ? (
                    <button
                      type="button"
                      onClick={() => onOpenInvites(undefined, 'sent')}
                      className="inline-flex items-center gap-2 rounded-xl border border-[var(--pt-border)] bg-[var(--pt-pill-bg)] px-4 py-2.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--pt-pill-hover)]"
                    >
                      <span>Request sent — view in Sent</span>
                    </button>
                  ) : actionState.kind === 'invite' ? (
                    <button
                      type="button"
                      onClick={() => onInvite(listing)}
                      className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold shadow-md transition hover:opacity-90"
                      style={{
                        backgroundColor: 'var(--pt-accent)',
                        color: 'var(--pt-accent-ink)',
                      }}
                    >
                      <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                      <span>Invite to jam</span>
                    </button>
                  ) : null}
                </div>
              )}
            </div>

            <div className="mt-3.5 space-y-3">
              <InstrumentBadgeRow instruments={listing.instruments} compact max={6} />

              {listing.profileStyle?.moodStatus && (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--pt-border-subtle)] bg-[var(--pt-pill-bg)] px-3 py-2 text-xs text-[var(--ink)] backdrop-blur-md sm:text-sm">
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
          </header>

          {/* What I'm looking for, Bio, Genres, Influences & Availability */}
          <section
            className="space-y-4 rounded-3xl border p-5 md:p-6"
            style={{
              backgroundColor: 'var(--pt-surface)',
              borderColor: 'var(--pt-border)',
            }}
          >
            <div>
              <h2 className="font-display text-sm font-bold tracking-tight text-[var(--muted)]">
                What I&apos;m looking for
              </h2>
              <p
                className="mt-1 text-base font-semibold leading-snug sm:text-lg"
                style={{ color: 'var(--pt-accent)' }}
              >
                {listing.seekingOrOffer}
              </p>
            </div>

            <p className="max-w-[68ch] text-sm leading-relaxed text-[var(--ink)]/90">
              {listing.bio}
            </p>

            <div className="balanced-wrap gap-1.5">
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
                className="border-t pt-3.5"
                style={{ borderColor: 'var(--pt-border-subtle)' }}
              >
                <h3 className="mb-2 text-xs font-semibold text-[var(--muted)]">
                  Sounds like / influences
                </h3>
                <div className="balanced-wrap gap-1.5">
                  {listing.profileStyle.soundsLike.map((artist) => (
                    <span
                      key={artist}
                      className="rounded-xl border px-2.5 py-1 text-xs font-medium text-[var(--ink)]"
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

            <div
              className="flex flex-wrap items-center justify-between gap-3 border-t pt-3.5 text-xs sm:text-sm"
              style={{ borderColor: 'var(--pt-border-subtle)' }}
            >
              <div className="flex items-center gap-2 text-[var(--ink)]/90">
                <Calendar
                  className="h-4 w-4 shrink-0"
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
                  className="inline-flex items-center gap-1.5 font-semibold underline decoration-[var(--pt-border)] underline-offset-4 hover:opacity-85"
                  style={{ color: 'var(--pt-accent)' }}
                >
                  <span>Open music / press kit</span>
                  <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                </a>
              )}
            </div>
          </section>

          {(listing.offersLessons || listing.offersSession) && (
            <section
              className="space-y-3 rounded-3xl border p-5 md:p-6"
              style={{
                backgroundColor: 'var(--pt-surface)',
                borderColor: 'var(--pt-border)',
              }}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                  Lessons &amp; session work
                </h2>
                {listing.remoteFriendly && (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-sky-500/35 bg-sky-500/15 px-2.5 py-0.5 text-xs font-semibold"
                    style={{ color: 'light-dark(#0369a1, #7dd3fc)' }}
                  >
                    <Globe className="h-3 w-3" aria-hidden="true" />
                    <span>Available remotely</span>
                  </span>
                )}
              </div>

              <div className="grid gap-2.5 sm:grid-cols-2">
                {listing.offersSession && (
                  <div
                    className="flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5"
                    style={{
                      backgroundColor: 'var(--pt-surface-inner)',
                      borderColor: 'var(--pt-border-subtle)',
                    }}
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                      <Mic2 className="h-4 w-4 text-amber-500" aria-hidden="true" />
                      <span>Session tracking</span>
                    </span>
                    <span className="text-xs font-bold text-[var(--muted)]">
                      {listing.sessionRate || 'Ask for rate'}
                    </span>
                  </div>
                )}

                {listing.offersLessons && (
                  <div
                    className="flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5"
                    style={{
                      backgroundColor: 'var(--pt-surface-inner)',
                      borderColor: 'var(--pt-border-subtle)',
                    }}
                  >
                    <span className="inline-flex items-center gap-2 text-xs font-semibold text-[var(--ink)]">
                      <GraduationCap className="h-4 w-4 text-emerald-500" aria-hidden="true" />
                      <span>Private lessons</span>
                    </span>
                    <span className="text-xs font-bold text-[var(--muted)]">
                      {listing.lessonRate || 'Ask for rate'}
                    </span>
                  </div>
                )}
              </div>

              {listing.serviceNote && (
                <p className="max-w-[68ch] text-xs leading-relaxed text-[var(--muted)] sm:text-sm">
                  {listing.serviceNote}
                </p>
              )}
            </section>
          )}

          {/* The Gear Locker */}
          <section
            className="space-y-3.5 rounded-3xl border p-5 md:p-6"
            style={{
              backgroundColor: 'var(--pt-surface)',
              borderColor: 'var(--pt-border)',
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Speaker
                  className="h-5 w-5"
                  style={{ color: 'var(--pt-accent)' }}
                  aria-hidden="true"
                />
                <h2 className="font-display text-lg font-bold text-[var(--ink)]">
                  Gear locker &amp; rig
                </h2>
              </div>
              {listing.gearLocker.length > 0 && (
                <span className="text-xs font-medium text-[var(--muted)]">
                  {listing.gearLocker.length}{' '}
                  {listing.gearLocker.length === 1 ? 'piece' : 'pieces'}
                </span>
              )}
            </div>

            {groupedGear.length > 0 ? (
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {groupedGear.map((group) => (
                  <div
                    key={group.category}
                    className="rounded-2xl border p-3.5"
                    style={{
                      backgroundColor: 'var(--pt-surface-inner)',
                      borderColor: 'var(--pt-border-subtle)',
                    }}
                  >
                    <h3 className="text-xs font-bold" style={{ color: 'var(--pt-accent)' }}>
                      {group.category}
                    </h3>
                    <ul role="list" className="mt-2 space-y-2">
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
            className="space-y-3.5 rounded-3xl border p-5 md:p-6"
            style={{
              backgroundColor: 'var(--pt-surface)',
              borderColor: 'var(--pt-border)',
            }}
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-[var(--ink)]">Scene wall</h2>
              <span className="text-xs text-[var(--muted)]">
                {wallComments.length > 0
                  ? `${wallComments.length} ${wallComments.length === 1 ? 'note' : 'notes'}`
                  : 'Public notes from local musicians'}
              </span>
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
              <ul role="list" className="space-y-2.5">
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
                    ? `Write a note for ${listing.title}...`
                    : 'Write a note (sign in to post)...'
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

      {/* Full-width Local Scene strip: Nearby in City */}
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
          <ul role="list" className="grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
            {localSceneNeighbors.map((neighbor) => {
              const nRegion = allRegions.find((r) => r.id === neighbor.regionId);
              return (
                <li key={neighbor.id}>
                  <button
                    type="button"
                    onClick={() => onOpenProfile(neighbor)}
                    className="flex w-full items-center gap-3 rounded-2xl border p-2.5 text-left transition hover:brightness-95"
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
                        className="h-11 w-11 shrink-0 rounded-xl object-cover object-[50%_20%]"
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
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </article>
  );
}
