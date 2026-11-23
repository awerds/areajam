import { useRef, useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  ExternalLink,
  Flame,
  MapPin,
  MessageCircle,
  Palette,
  Play,
  Plus,
  Send,
  Share2,
  Sparkles,
  Speaker,
  Star,
  Ticket,
  Trash2,
  Users,
} from 'lucide-react';
import {
  GEAR_CATEGORIES,
  PROFILE_THEMES,
  PROFILE_THEME_LIST,
  safeHttpsUrl,
} from '../data/themes';
import type {
  AuthUser,
  GearCategory,
  GearItem,
  Listing,
  ProfileThemeId,
  Region,
  SwipeDecision,
  WallComment,
} from '../types';
import { ClipPlayer } from './ClipPlayer';
import { InstrumentBadgeRow } from './InstrumentIcons';

interface ProfilePageProps {
  listing: Listing;
  region?: Region;
  allListings: Listing[];
  allRegions: Region[];
  user: AuthUser | null;
  isMatched: boolean;
  soundEnabled: boolean;
  wallComments: WallComment[];
  onToggleSound: () => void;
  onBack: () => void;
  onSwipe: (listing: Listing, decision: SwipeDecision) => void;
  onOpenChat: (listing: Listing) => void;
  onOpenProfile: (listing: Listing) => void;
  onUpdateListing: (updated: Listing) => void;
  onAddWallComment: (listingId: string, text: string) => void;
  onShareUrl: () => void;
}

export function ProfilePage({
  listing,
  region,
  allListings,
  allRegions,
  user,
  isMatched,
  soundEnabled,
  wallComments,
  onToggleSound,
  onBack,
  onSwipe,
  onOpenChat,
  onOpenProfile,
  onUpdateListing,
  onAddWallComment,
  onShareUrl,
}: ProfilePageProps) {
  const theme = PROFILE_THEMES[listing.profileStyle?.themeId || 'stage-coral'];
  const canCustomize = Boolean(
    listing.isUserCreated && (!listing.ownerUid || (user && user.uid === listing.ownerUid))
  );

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
      className="mx-auto w-full max-w-[1440px] space-y-6 pb-8"
      style={
        {
          '--page-accent': theme.accent,
          '--page-accent-ink': theme.accentInk,
        } as React.CSSProperties
      }
    >
      {/* MySpace-inspired custom-themed hero banner */}
      <header
        className="dark-stage relative overflow-hidden rounded-[2rem] border p-6 shadow-2xl md:p-8"
        style={{
          backgroundColor: theme.bgTo,
          backgroundImage: `radial-gradient(circle at 85% 18%, ${theme.glow}, transparent 50%), linear-gradient(135deg, ${theme.bgFrom}, ${theme.bgTo})`,
          borderColor: theme.borderTint,
        }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/60"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            <span>Back to {region?.city ?? 'scene'}</span>
          </button>

          <div className="flex flex-wrap items-center gap-2">
            {canCustomize && (
              <button
                type="button"
                onClick={() => setCustomizeOpen((prev) => !prev)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-white/20"
              >
                <Palette className="h-3.5 w-3.5" style={{ color: theme.accent }} aria-hidden="true" />
                <span>{customizeOpen ? 'Close editor' : 'Customize page'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={onShareUrl}
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-4 py-2 text-xs font-semibold text-white backdrop-blur-md transition hover:bg-black/60"
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
                style={{ backgroundColor: theme.accent, color: theme.accentInk }}
              >
                {isJam ? 'Jam player' : listing.gigSubtype === 'open-gig' ? 'Open gig slot' : 'Band for hire'}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-medium text-white/90">
                <MapPin className="h-3.5 w-3.5" style={{ color: theme.accent }} aria-hidden="true" />
                {listing.neighborhood}, {region?.label ?? listing.regionId}
              </span>
              {listing.payOrSplit && (
                <span className="rounded-full border border-white/15 bg-black/35 px-3 py-1 text-xs font-semibold text-white">
                  {listing.payOrSplit}
                </span>
              )}
            </div>

            <h1 className="hero-title font-bold text-white">{listing.title}</h1>
            <p className="text-base font-medium text-white/80">{listing.subtitle}</p>

            <InstrumentBadgeRow instruments={listing.instruments} max={6} />

            {listing.profileStyle?.moodStatus && (
              <div className="inline-flex max-w-2xl items-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-4 py-2 text-sm text-white/95 backdrop-blur-md">
                <Sparkles className="h-4 w-4 shrink-0" style={{ color: theme.accent }} aria-hidden="true" />
                <span>
                  <strong className="font-semibold text-white">Status:</strong>{' '}
                  {listing.profileStyle.moodStatus}
                </span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isMatched ? (
              <button
                type="button"
                onClick={() => onOpenChat(listing)}
                className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition hover:opacity-90"
                style={{ backgroundColor: theme.accent, color: theme.accentInk }}
              >
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
                <span>Open match chat</span>
              </button>
            ) : (
              !listing.isUserCreated && (
                <button
                  type="button"
                  onClick={() => onSwipe(listing, 'like')}
                  className="inline-flex items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold shadow-lg transition hover:opacity-90"
                  style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                >
                  {isJam ? (
                    <>
                      <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                      <span>Jam with {listing.title}</span>
                    </>
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" aria-hidden="true" />
                      <span>Book or pitch slot</span>
                    </>
                  )}
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Owner live customizer */}
      {canCustomize && customizeOpen && (
        <section
          aria-label="Customize your profile page"
          className="glass-surface space-y-5 rounded-3xl p-6"
          style={{ borderColor: theme.borderTint }}
        >
          <div>
            <h2 className="font-display text-xl font-bold">Customize your artist page</h2>
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
                  className="rounded-2xl border p-3 text-left transition"
                  style={{
                    background: `linear-gradient(135deg, ${t.bgFrom}, ${t.bgTo})`,
                    borderColor: selected ? t.accent : 'var(--border-strong)',
                    boxShadow: selected ? `0 0 0 1px ${t.accent}` : undefined,
                  }}
                >
                  <span
                    className="mb-2 block h-3 w-8 rounded-full"
                    style={{ backgroundColor: t.accent }}
                  />
                  <span className="block text-xs font-bold text-white">{t.name}</span>
                  <span className="block text-[11px] text-white/70">{t.tagline}</span>
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
                style={{ backgroundColor: theme.accent, color: theme.accentInk }}
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
          <div
            className="dark-stage relative h-[29rem] overflow-hidden rounded-[2rem] border bg-[#0b0d14] shadow-2xl sm:h-[33rem]"
            style={{ borderColor: theme.borderTint }}
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

          {/* MySpace Music Playlist */}
          <section
            aria-label="Clips and recordings playlist"
            className="dark-stage rounded-3xl border p-5"
            style={{
              backgroundColor: '#0c0e15',
              backgroundImage: `linear-gradient(${theme.surfaceTint}, ${theme.surfaceTint})`,
              borderColor: theme.borderTint,
            }}
          >
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-display text-lg font-bold text-white">Clips &amp; reels</h2>
              <span className="text-xs text-white/70">
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
                      borderColor: isPlayingNow ? theme.accent : 'rgba(255,255,255,0.1)',
                      backgroundColor: isPlayingNow ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.28)',
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
                            ? { backgroundColor: theme.accent, color: theme.accentInk }
                            : { backgroundColor: 'rgba(255,255,255,0.1)', color: '#ffffff' }
                        }
                      >
                        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-white">
                          {idx + 1}. {clip.title}
                        </p>
                        <p className="text-xs text-white/65">
                          {clip.kind === 'video' ? 'Video clip' : clip.kind === 'audio' ? 'Audio upload' : 'Studio groove'},{' '}
                          {clip.durationSec}s
                        </p>
                      </div>
                    </button>

                    <div className="flex shrink-0 items-center gap-2">
                      {isMain ? (
                        <span
                          className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                        >
                          <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                          <span>Main clip</span>
                        </span>
                      ) : (
                        canCustomize && (
                          <button
                            type="button"
                            onClick={() => handleSetMainClip(clip.id)}
                            className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-white/20"
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

          {/* Schedule & Press Link */}
          <section
            className="dark-stage space-y-3 rounded-3xl border p-5"
            style={{
              backgroundColor: '#0c0e15',
              backgroundImage: `linear-gradient(${theme.surfaceTint}, ${theme.surfaceTint})`,
              borderColor: theme.borderTint,
            }}
          >
            <h2 className="font-display text-lg font-bold text-white">Availability &amp; links</h2>
            <div className="flex items-start gap-3 text-sm text-white/90">
              <Calendar className="mt-0.5 h-4 w-4 shrink-0" style={{ color: theme.accent }} aria-hidden="true" />
              <span>{listing.availability}</span>
            </div>
            {safeHref && (
              <a
                href={safeHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-semibold underline decoration-white/30 underline-offset-4 hover:opacity-85"
                style={{ color: theme.accent }}
              >
                <span>Open music / press kit ({listing.sampleLink})</span>
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            )}
          </section>

          {/* Local Scene: "Top 4 in City" (MySpace Top Friends homage) */}
          {localSceneNeighbors.length > 0 && (
            <section
              className="dark-stage rounded-3xl border p-5"
              style={{
                backgroundColor: '#0c0e15',
                backgroundImage: `linear-gradient(${theme.surfaceTint}, ${theme.surfaceTint})`,
                borderColor: theme.borderTint,
              }}
            >
              <div className="mb-3 flex items-center gap-2">
                <Users className="h-4 w-4" style={{ color: theme.accent }} aria-hidden="true" />
                <h2 className="font-display text-lg font-bold text-white">
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
                      className="rounded-2xl border border-white/10 bg-black/35 p-3 text-left transition hover:border-white/30"
                    >
                      <p className="font-display truncate text-sm font-bold text-white">
                        {neighbor.title}
                      </p>
                      <p className="truncate text-xs text-white/70">{neighbor.subtitle}</p>
                      <p className="mt-1.5 text-[11px] font-medium" style={{ color: theme.accent }}>
                        {neighbor.neighborhood || nRegion?.city}
                      </p>
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
            className="dark-stage space-y-4 rounded-3xl border p-6"
            style={{
              backgroundColor: '#0c0e15',
              backgroundImage: `linear-gradient(${theme.surfaceTint}, ${theme.surfaceTint})`,
              borderColor: theme.borderTint,
            }}
          >
            <div>
              <h2 className="font-display text-xl font-bold text-white">What I&apos;m looking for</h2>
              <p className="mt-1.5 text-lg font-semibold leading-snug" style={{ color: theme.accent }}>
                {listing.seekingOrOffer}
              </p>
            </div>

            <p className="text-sm leading-relaxed text-white/90">{listing.bio}</p>

            <div className="flex flex-wrap gap-2 pt-1">
              {listing.genres.map((g) => (
                <span
                  key={g}
                  className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white"
                >
                  {g}
                </span>
              ))}
            </div>

            {listing.profileStyle?.soundsLike && listing.profileStyle.soundsLike.length > 0 && (
              <div className="border-t border-white/10 pt-4">
                <p className="mb-2 text-xs font-semibold text-white/70">Sounds like / influences</p>
                <div className="flex flex-wrap gap-2">
                  {listing.profileStyle.soundsLike.map((artist) => (
                    <span
                      key={artist}
                      className="rounded-xl border border-white/15 bg-black/35 px-3 py-1.5 text-xs font-medium text-white"
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
            className="dark-stage space-y-4 rounded-3xl border p-6"
            style={{
              backgroundColor: '#0c0e15',
              backgroundImage: `linear-gradient(${theme.surfaceTint}, ${theme.surfaceTint})`,
              borderColor: theme.borderTint,
            }}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Speaker className="h-5 w-5" style={{ color: theme.accent }} aria-hidden="true" />
                <div>
                  <h2 className="font-display text-xl font-bold text-white">Gear locker &amp; rig</h2>
                  <p className="text-xs text-white/70">
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
                    className="rounded-2xl border border-white/10 bg-black/30 p-4"
                  >
                    <h3 className="text-xs font-bold" style={{ color: theme.accent }}>
                      {group.category}
                    </h3>
                    <ul className="mt-2.5 space-y-2.5">
                      {group.items.map((item) => (
                        <li key={item.id} className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-white">{item.name}</p>
                            {item.notes && (
                              <p className="text-xs text-white/70">{item.notes}</p>
                            )}
                          </div>
                          {canCustomize && (
                            <button
                              type="button"
                              onClick={() => handleRemoveGearItem(item.id)}
                              aria-label={`Remove ${item.name}`}
                              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white/60 hover:bg-white/10 hover:text-[var(--err)]"
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
              <p className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm text-white/85">
                {listing.gearOrBackline}
              </p>
            )}

            {canCustomize && (
              <form
                onSubmit={handleAddGearItem}
                className="grid grid-cols-1 gap-2.5 rounded-2xl border border-dashed border-white/20 bg-black/25 p-4 sm:grid-cols-12"
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
                      <option key={cat} value={cat} className="bg-[var(--surface-solid)] text-[var(--ink)]">
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
                <div className="sm:col-span-4 flex gap-2">
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
                    style={{ backgroundColor: theme.accent, color: theme.accentInk }}
                  >
                    <Plus className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </form>
            )}
          </section>

          {/* MySpace-style Comment Wall */}
          <section
            className="dark-stage space-y-4 rounded-3xl border p-6"
            style={{
              backgroundColor: '#0c0e15',
              backgroundImage: `linear-gradient(${theme.surfaceTint}, ${theme.surfaceTint})`,
              borderColor: theme.borderTint,
            }}
          >
            <div>
              <h2 className="font-display text-xl font-bold text-white">Scene wall</h2>
              <p className="text-xs text-white/70">
                Leave a public note, shout-out, or jam inquiry for {listing.title}
              </p>
            </div>

            {wallComments.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-white/15 bg-black/25 p-4 text-sm text-white/70">
                No wall notes yet. Be the first local musician to say hey.
              </p>
            ) : (
              <ul className="space-y-2.5">
                {wallComments.map((comment) => (
                  <li
                    key={comment.id}
                    className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3"
                  >
                    <p className="text-xs font-bold" style={{ color: theme.accent }}>
                      {comment.authorName}
                    </p>
                    <p className="mt-1 text-sm text-white/95">{comment.text}</p>
                  </li>
                ))}
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
                style={{ backgroundColor: theme.accent, color: theme.accentInk }}
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
