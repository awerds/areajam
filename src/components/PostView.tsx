import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Check,
  ExternalLink,
  Instagram,
  Link2,
  LogOut,
  MapPin,
  Plus,
  ShieldBan,
  Sparkles,
  Star,
  Trash2,
  Video,
} from 'lucide-react';
import { GEAR_CATEGORIES, PROFILE_THEME_LIST } from '../data/themes';
import {
  embedProviderLabel,
  parseClipUrl,
  sanitizeInstagramHandle,
} from '../lib/embedMedia';
import { attachFormValidation } from '../lib/formValidation';
import type {
  AuthUser,
  BlockedUser,
  GearCategory,
  GearItem,
  InstrumentId,
  Listing,
  MediaClip,
  ProfileThemeId,
  Region,
} from '../types';
import { ALL_INSTRUMENTS, INSTRUMENT_META, InstrumentIcon } from './InstrumentIcons';

interface PostViewProps {
  user: AuthUser | null;
  onRequireAuth: (reason?: string) => void;
  onSignOut: () => void;
  region: Region;
  onOpenRegionPicker: () => void;
  userListings: Listing[];
  blockedUsers: BlockedUser[];
  onPublishListing: (listing: Listing) => Promise<void>;
  onDeleteListing: (listingId: string) => Promise<void>;
  onPreviewListing: (listing: Listing) => void;
  onUnblockUser: (blockedUid: string) => Promise<void>;
}

const ROLE_OPTIONS = [
  'Rhythm section',
  'Songwriters',
  'Lead & keys',
  'Horns & strings',
  'Full band',
  'Producer / beatmaker',
];

const QUICK_GENRES = [
  'Indie Rock',
  'Americana',
  'Country',
  'Blues',
  'Funk',
  'Soul',
  'Jazz',
  'Alt-Rock',
  'Folk',
  'Metal',
  'Pop',
  'Electronic',
];

function createClipId(): string {
  return `clip-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function createProfileId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `jam-${crypto.randomUUID().slice(0, 8)}`;
  }
  return `jam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

export function PostView({
  user,
  onRequireAuth,
  onSignOut,
  region,
  onOpenRegionPicker,
  userListings,
  blockedUsers,
  onPublishListing,
  onDeleteListing,
  onPreviewListing,
  onUnblockUser,
}: PostViewProps) {
  const formRef = useRef<HTMLFormElement>(null);

  const [roleCategory, setRoleCategory] = useState(ROLE_OPTIONS[0]);
  const [instruments, setInstruments] = useState<InstrumentId[]>(['guitar']);
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [seekingOrOffer, setSeekingOrOffer] = useState('');
  const [genres, setGenres] = useState<string[]>(['Indie Rock']);
  const [customGenre, setCustomGenre] = useState('');
  const [availability, setAvailability] = useState('Weeknights & Sunday afternoons');
  const [bio, setBio] = useState('');
  const [gearOrBackline, setGearOrBackline] = useState('');
  const [gearLocker, setGearLocker] = useState<GearItem[]>([]);
  const [gearCat, setGearCat] = useState<GearCategory>(GEAR_CATEGORIES[0]);
  const [gearName, setGearName] = useState('');
  const [gearNotes, setGearNotes] = useState('');

  const [instagramInput, setInstagramInput] = useState('');
  const [clipUrlInput, setClipUrlInput] = useState('');
  const [clipTitleInput, setClipTitleInput] = useState('');
  const [clipError, setClipError] = useState<string | null>(null);
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [featuredClipId, setFeaturedClipId] = useState<string | undefined>(undefined);

  const [themeId, setThemeId] = useState<ProfileThemeId>('stage-coral');
  const [moodStatus, setMoodStatus] = useState('');
  const [soundsLikeInput, setSoundsLikeInput] = useState('');

  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unblockingUid, setUnblockingUid] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    return attachFormValidation(form);
  }, []);

  const normalizedHandle = sanitizeInstagramHandle(instagramInput);

  const toggleInstrument = (inst: InstrumentId) => {
    setInstruments((prev) => {
      if (prev.includes(inst)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== inst);
      }
      if (prev.length >= 6) return prev;
      return [...prev, inst];
    });
  };

  const toggleGenre = (genre: string) => {
    setGenres((prev) => {
      if (prev.includes(genre)) {
        if (prev.length === 1) return prev;
        return prev.filter((item) => item !== genre);
      }
      if (prev.length >= 4) return prev;
      return [...prev, genre];
    });
  };

  const handleAddCustomGenre = () => {
    const cleaned = customGenre.trim().slice(0, 48);
    if (!cleaned) return;
    if (genres.some((g) => g.toLowerCase() === cleaned.toLowerCase())) {
      setCustomGenre('');
      return;
    }
    if (genres.length >= 4) {
      setFormError('Pick up to 4 genres so your card stays quick to scan.');
      return;
    }
    setGenres((prev) => [...prev, cleaned]);
    setCustomGenre('');
    setFormError(null);
  };

  const handleAddClip = () => {
    setClipError(null);
    if (clips.length >= 4) {
      setClipError('Up to 4 clip links fit on one profile page.');
      return;
    }
    const parsed = parseClipUrl(clipUrlInput);
    if (!parsed.ok) {
      setClipError(parsed.error);
      return;
    }
    const newId = createClipId();
    const customTitle = clipTitleInput.trim().slice(0, 64);
    const clip: MediaClip = {
      id: newId,
      title: customTitle || parsed.defaultTitle,
      kind: parsed.kind,
      embedUrl: parsed.embedUrl,
      embedProvider: parsed.provider,
      durationSec: 30,
    };
    setClips((prev) => [...prev, clip]);
    setFeaturedClipId((prev) => prev ?? newId);
    setClipUrlInput('');
    setClipTitleInput('');
  };

  const handleRemoveClip = (clipId: string) => {
    setClips((prev) => {
      const next = prev.filter((c) => c.id !== clipId);
      if (featuredClipId === clipId) {
        setFeaturedClipId(next[0]?.id);
      }
      return next;
    });
  };

  const handleAddGear = () => {
    const cleaned = gearName.trim().slice(0, 60);
    if (!cleaned || gearLocker.length >= 20) return;
    setGearLocker((prev) => [
      ...prev,
      {
        id: `gear-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 5)}`,
        category: gearCat,
        name: cleaned,
        notes: gearNotes.trim().slice(0, 60) || undefined,
      },
    ]);
    setGearName('');
    setGearNotes('');
  };

  const handleCopyShareUrl = async (id: string) => {
    const url = `${window.location.origin}${window.location.pathname}?profile=${encodeURIComponent(id)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopiedId(id);
      window.setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 2200);
    } catch {
      setFormError(`Share link: ${url}`);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setPublishedId(null);

    if (!user) {
      onRequireAuth(
        'Sign in with Google or Apple to publish your live profile and receive Jam invites.'
      );
      return;
    }

    const cleanTitle = title.trim();
    const cleanSubtitle = subtitle.trim();
    const cleanNeighborhood = neighborhood.trim();
    const cleanSeeking = seekingOrOffer.trim();
    const cleanBio = bio.trim();

    if (cleanTitle.length < 2) {
      setFormError('Project or musician name must be at least 2 characters.');
      return;
    }
    if (cleanSubtitle.length < 2) {
      setFormError('Instrument or role headline must be at least 2 characters.');
      return;
    }
    if (cleanNeighborhood.length < 2) {
      setFormError('Neighborhood must be at least 2 characters.');
      return;
    }
    if (cleanSeeking.length < 6) {
      setFormError('Describe what you want to jam on (at least 6 characters).');
      return;
    }
    if (cleanBio.length < 12) {
      setFormError('Tell players a little about your sound (at least 12 characters).');
      return;
    }
    if (instruments.length === 0) {
      setFormError('Pick at least one instrument.');
      return;
    }
    if (genres.length === 0) {
      setFormError('Pick at least one genre.');
      return;
    }

    const id = createProfileId();
    const now = Math.floor(Date.now());
    const preparedClips: MediaClip[] =
      clips.length > 0
        ? clips
        : [
            {
              id: `${id}-intro`,
              title: `${cleanTitle} live room preview`,
              kind: 'synth-reel',
              durationSec: 12,
              clipVariation: Math.floor(Math.random() * 5),
            },
          ];

    const firstLinked = preparedClips.find((c) => c.embedUrl)?.embedUrl;
    const soundsLike = soundsLikeInput
      .split(',')
      .map((s) => s.trim().slice(0, 64))
      .filter(Boolean)
      .slice(0, 6);

    const listing: Listing = {
      id,
      side: 'jam',
      roleCategory,
      instruments,
      regionId: region.id,
      regionLabel: region.label,
      regionState: region.state,
      neighborhood: cleanNeighborhood,
      title: cleanTitle,
      subtitle: cleanSubtitle,
      seekingOrOffer: cleanSeeking,
      genres: genres.slice(0, 4),
      tags: genres.slice(0, 4),
      bio: cleanBio,
      gearOrBackline: gearOrBackline.trim() || 'Shared in jam thread',
      gearLocker,
      availability: availability.trim() || 'Weeknights & Sunday afternoons',
      instagramHandle: normalizedHandle,
      sampleLink:
        firstLinked ??
        (normalizedHandle ? `https://www.instagram.com/${normalizedHandle}/` : undefined),
      visualSeed: Math.floor(1 + Math.random() * 90),
      clips: preparedClips,
      featuredClipId: featuredClipId ?? preparedClips[0]?.id,
      profileStyle: {
        themeId,
        moodStatus: moodStatus.trim().slice(0, 100) || undefined,
        soundsLike,
        bannerPattern: 'waves',
      },
      autoMatch: false,
      autoReply: '',
      isSample: false,
      isPublished: true,
      isUserCreated: true,
      ownerUid: user.uid,
      ownerName: user.displayName,
      createdAt: now,
      updatedAt: now,
    };

    setSubmitting(true);
    try {
      await onPublishListing(listing);
      setPublishedId(listing.id);
      setTitle('');
      setSubtitle('');
      setNeighborhood('');
      setSeekingOrOffer('');
      setBio('');
      setGearOrBackline('');
      setGearLocker([]);
      setClips([]);
      setFeaturedClipId(undefined);
      setMoodStatus('');
      setSoundsLikeInput('');
    } catch (err) {
      setFormError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not publish to Firestore right now. Try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 pb-8">
      <section className="panel space-y-4 rounded-3xl p-5 sm:p-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold"
                style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
              >
                <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
                Live Jam studio
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-medium text-[var(--muted)]">
                <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                Posting to {region.label}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Publish your live musician profile
            </h1>
            <p className="text-sm text-[var(--muted)]">
              Profiles save directly to Firestore so musicians in Nashville and any US city can watch your linked clips, open your permalink, and send Jam invites.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenRegionPicker}
            className="inline-flex shrink-0 items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
          >
            <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            Change city board
          </button>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between">
          {user ? (
            <>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[var(--ink)]">
                  Signed in as {user.displayName}
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Profiles, invites, and blocks are scoped to your Firebase account. Account email stays private.
                </p>
              </div>
              <button
                type="button"
                onClick={onSignOut}
                className="inline-flex shrink-0 items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
                Sign out
              </button>
            </>
          ) : (
            <>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-[var(--ink)]">
                  Sign in to publish &amp; receive Jam invites
                </p>
                <p className="text-xs text-[var(--muted)]">
                  Browsing stays open for everyone. Sign in with Google or Apple so musicians know who is behind your profile.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  onRequireAuth('Sign in with Google or Apple to create your live AreaJam profile.')
                }
                className="inline-flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition hover:opacity-90"
                style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
              >
                Sign in with Google or Apple
              </button>
            </>
          )}
        </div>
      </section>

      <form
        ref={formRef}
        noValidate
        onSubmit={(e) => void handleSubmit(e)}
        className="panel space-y-6 rounded-3xl p-5 sm:p-7"
      >
        {/* Instagram handle + Inline Linked Clips */}
        <section className="space-y-4 border-b border-[var(--border)] pb-6">
          <div className="space-y-1">
            <h2 className="font-display flex items-center gap-2 text-lg font-bold">
              <Video className="h-5 w-5 text-[var(--jam-text)]" aria-hidden="true" />
              Linked performance clips &amp; Instagram handle
            </h2>
            <p className="text-xs leading-relaxed text-[var(--muted)]">
              Stay fast on our free pilot plan by linking clips directly from Instagram Reels, YouTube/Shorts, TikTok, Vimeo, SoundCloud, or direct HTTPS MP4/MP3 URLs. No video upload needed.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-ig-handle" className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold">
                <Instagram className="h-3.5 w-3.5 text-[var(--jam-text)]" aria-hidden="true" />
                Instagram handle (optional)
              </label>
              <input
                id="post-ig-handle"
                type="text"
                maxLength={80}
                value={instagramInput}
                onChange={(e) => setInstagramInput(e.target.value)}
                placeholder="@eastnashdrums or instagram.com/..."
                className="field-control"
              />
              {normalizedHandle && (
                <p className="mt-1 text-xs font-medium text-[var(--jam-text)]">
                  Linked handle badge: @{normalizedHandle}
                </p>
              )}
            </div>

            <div>
              <label htmlFor="post-clip-title" className="mb-1.5 block text-xs font-semibold">
                Clip title (optional)
              </label>
              <input
                id="post-clip-title"
                type="text"
                maxLength={64}
                value={clipTitleInput}
                onChange={(e) => setClipTitleInput(e.target.value)}
                placeholder="Pocket solo in 5/4 (optional)"
                className="field-control"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label htmlFor="post-clip-url" className="block text-xs font-semibold">
              Paste Reel, YouTube, TikTok, Vimeo, SoundCloud, or HTTPS clip URL (up to 4)
            </label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative flex-1">
                <Link2
                  className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                  aria-hidden="true"
                />
                <input
                  id="post-clip-url"
                  type="url"
                  value={clipUrlInput}
                  onChange={(e) => {
                    setClipUrlInput(e.target.value);
                    if (clipError) setClipError(null);
                  }}
                  placeholder="https://www.instagram.com/reel/... or https://youtu.be/..."
                  className="field-control pl-10"
                />
              </div>
              <button
                type="button"
                onClick={handleAddClip}
                className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-xs font-bold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add clip link
              </button>
            </div>
            {clipError && (
              <p role="alert" className="text-xs font-medium text-[var(--err)]">
                {clipError}
              </p>
            )}
          </div>

          {clips.length > 0 ? (
            <ul className="space-y-2">
              {clips.map((clip, idx) => {
                const isFeatured = featuredClipId ? featuredClipId === clip.id : idx === 0;
                return (
                  <li
                    key={clip.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-[11px] font-bold">
                          {embedProviderLabel(clip.embedProvider)}
                        </span>
                        <span className="truncate text-xs font-semibold text-[var(--ink)]">
                          {clip.title}
                        </span>
                      </div>
                      {clip.embedUrl && (
                        <p className="truncate text-[11px] text-[var(--muted)]">{clip.embedUrl}</p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setFeaturedClipId(clip.id)}
                        className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition"
                        style={
                          isFeatured
                            ? {
                                backgroundColor: 'var(--jam)',
                                color: 'var(--jam-ink)',
                                borderColor: 'var(--jam)',
                              }
                            : {
                                backgroundColor: 'var(--pill-bg)',
                                color: 'var(--muted)',
                                borderColor: 'var(--border)',
                              }
                        }
                      >
                        <Star className="h-3 w-3" aria-hidden="true" />
                        {isFeatured ? 'Main card clip' : 'Set main'}
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove ${clip.title}`}
                        onClick={() => handleRemoveClip(clip.id)}
                        className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] p-1.5 text-[var(--muted)] transition hover:text-[var(--err)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--muted)]">
              No external clip link added yet. Paste a public Instagram Reel or YouTube link above, or publish with our Stage Synth visual intro card and add links anytime later.
            </div>
          )}
        </section>

        {/* Core Identity & Instruments */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-bold">Musician details</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-title" className="mb-1.5 block text-xs font-semibold">
                Stage name or project title *
              </label>
              <input
                id="post-title"
                type="text"
                required
                minLength={2}
                maxLength={64}
                data-error="post-title-error"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Jordan Hayes Trio"
                className="field-control"
              />
              <p id="post-title-error" className="field-error" />
            </div>

            <div>
              <label htmlFor="post-subtitle" className="mb-1.5 block text-xs font-semibold">
                Primary instrument &amp; vibe *
              </label>
              <input
                id="post-subtitle"
                type="text"
                required
                minLength={2}
                maxLength={64}
                data-error="post-subtitle-error"
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g. Pocket drummer + SPDSX"
                className="field-control"
              />
              <p id="post-subtitle-error" className="field-error" />
            </div>

            <div>
              <label htmlFor="post-neighborhood" className="mb-1.5 block text-xs font-semibold">
                Neighborhood / part of town *
              </label>
              <input
                id="post-neighborhood"
                type="text"
                required
                minLength={2}
                maxLength={48}
                data-error="post-neighborhood-error"
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                placeholder={`e.g. ${region.id === 'nashville' ? 'East Nashville' : 'Downtown / Midtown'}`}
                className="field-control"
              />
              <p id="post-neighborhood-error" className="field-error" />
            </div>

            <div>
              <label htmlFor="post-role" className="mb-1.5 block text-xs font-semibold">
                Section / role
              </label>
              <select
                id="post-role"
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value)}
                className="field-control"
              >
                {ROLE_OPTIONS.map((role) => (
                  <option key={role} value={role}>
                    {role}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold">Instruments played (pick 1 to 6)</span>
            <div className="flex flex-wrap gap-2">
              {ALL_INSTRUMENTS.map((inst) => {
                const selected = instruments.includes(inst);
                const meta = INSTRUMENT_META[inst];
                return (
                  <button
                    key={inst}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInstrument(inst)}
                    className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                    style={
                      selected
                        ? {
                            backgroundColor: 'var(--accent)',
                            color: 'var(--accent-ink)',
                            borderColor: 'var(--accent)',
                          }
                        : {
                            backgroundColor: 'var(--pill-bg)',
                            color: 'var(--ink)',
                            borderColor: 'var(--border)',
                          }
                    }
                  >
                    <InstrumentIcon id={inst} className="h-3.5 w-3.5" />
                    <span>{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="post-seeking" className="mb-1.5 block text-xs font-semibold">
              What are you looking to jam on? *
            </label>
            <input
              id="post-seeking"
              type="text"
              required
              minLength={6}
              maxLength={140}
              data-error="post-seeking-error"
              value={seekingOrOffer}
              onChange={(e) => setSeekingOrOffer(e.target.value)}
              placeholder="e.g. Writing originals with a bassist & keys player once a week"
              className="field-control"
            />
            <p id="post-seeking-error" className="field-error" />
          </div>

          <div className="space-y-2">
            <span className="block text-xs font-semibold">Genres (pick 1 to 4)</span>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_GENRES.map((genre) => {
                const selected = genres.includes(genre);
                return (
                  <button
                    key={genre}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleGenre(genre)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition"
                    style={
                      selected
                        ? {
                            backgroundColor: 'var(--jam)',
                            color: 'var(--jam-ink)',
                            borderColor: 'var(--jam)',
                          }
                        : {
                            backgroundColor: 'var(--pill-bg)',
                            color: 'var(--muted)',
                            borderColor: 'var(--border)',
                          }
                    }
                  >
                    {genre}
                  </button>
                );
              })}
              {genres
                .filter((g) => !QUICK_GENRES.includes(g))
                .map((custom) => (
                  <button
                    key={custom}
                    type="button"
                    aria-pressed
                    onClick={() => toggleGenre(custom)}
                    className="rounded-full border px-3 py-1 text-xs font-semibold transition"
                    style={{
                      backgroundColor: 'var(--jam)',
                      color: 'var(--jam-ink)',
                      borderColor: 'var(--jam)',
                    }}
                  >
                    {custom}
                  </button>
                ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={48}
                aria-label="Add custom genre"
                value={customGenre}
                onChange={(e) => setCustomGenre(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomGenre();
                  }
                }}
                placeholder="Add another genre..."
                className="field-control flex-1"
              />
              <button
                type="button"
                onClick={handleAddCustomGenre}
                className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
              >
                Add genre
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-availability" className="mb-1.5 block text-xs font-semibold">
                Weekly availability
              </label>
              <input
                id="post-availability"
                type="text"
                maxLength={80}
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                placeholder="e.g. Mon/Wed after 6pm"
                className="field-control"
              />
            </div>

            <div>
              <label htmlFor="post-sounds-like" className="mb-1.5 block text-xs font-semibold">
                Influences / sounds like (comma-separated)
              </label>
              <input
                id="post-sounds-like"
                type="text"
                maxLength={140}
                value={soundsLikeInput}
                onChange={(e) => setSoundsLikeInput(e.target.value)}
                placeholder="e.g. Khruangbin, Pinegrove, Alvvays"
                className="field-control"
              />
            </div>
          </div>

          <div>
            <label htmlFor="post-bio" className="mb-1.5 block text-xs font-semibold">
              Bio &amp; session vibe (minimum 12 characters) *
            </label>
            <textarea
              id="post-bio"
              rows={3}
              required
              minLength={12}
              maxLength={600}
              data-error="post-bio-error"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Mention songwriting style, practice space access, or the bands/sessions you want to build."
              className="field-control resize-none"
            />
            <p id="post-bio-error" className="field-error" />
          </div>

          {/* Optional Rig & Page Theme */}
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <h3 className="font-display text-sm font-bold">Rig summary &amp; gear locker (optional)</h3>
            <input
              type="text"
              maxLength={400}
              aria-label="Rig or rehearsal space summary"
              value={gearOrBackline}
              onChange={(e) => setGearOrBackline(e.target.value)}
              placeholder="e.g. Fender Deluxe Reverb, Ludwig maple kit, small Berry Hill room"
              className="field-control"
            />
            <div className="grid gap-2 sm:grid-cols-4">
              <select
                aria-label="Gear category"
                value={gearCat}
                onChange={(e) => setGearCat(e.target.value as GearCategory)}
                className="field-control"
              >
                {GEAR_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <input
                type="text"
                maxLength={60}
                aria-label="Gear item name"
                value={gearName}
                onChange={(e) => setGearName(e.target.value)}
                placeholder="Gear piece (e.g. Telecaster)"
                className="field-control"
              />
              <input
                type="text"
                maxLength={60}
                aria-label="Gear notes"
                value={gearNotes}
                onChange={(e) => setGearNotes(e.target.value)}
                placeholder="Notes (optional)"
                className="field-control"
              />
              <button
                type="button"
                onClick={handleAddGear}
                className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
              >
                Add gear item
              </button>
            </div>
            {gearLocker.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {gearLocker.map((g) => (
                  <span
                    key={g.id}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1 text-xs"
                  >
                    <strong className="font-semibold">{g.name}</strong>
                    <button
                      type="button"
                      aria-label={`Remove ${g.name}`}
                      onClick={() =>
                        setGearLocker((prev) => prev.filter((item) => item.id !== g.id))
                      }
                      className="text-[var(--muted)] hover:text-[var(--err)]"
                    >
                      x
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <span className="mb-1.5 block text-xs font-semibold">Profile color theme</span>
              <div className="flex flex-wrap gap-2">
                {PROFILE_THEME_LIST.map((theme) => {
                  const active = themeId === theme.id;
                  return (
                    <button
                      key={theme.id}
                      type="button"
                      aria-pressed={active}
                      onClick={() => setThemeId(theme.id)}
                      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition"
                      style={
                        active
                          ? {
                              backgroundColor: theme.accent,
                              color: theme.accentInk,
                              borderColor: theme.accent,
                            }
                          : {
                              backgroundColor: 'var(--pill-bg)',
                              color: 'var(--ink)',
                              borderColor: 'var(--border)',
                            }
                      }
                    >
                      <span
                        className="h-2.5 w-2.5 rounded-full border border-white/40"
                        style={{ backgroundColor: theme.accent }}
                        aria-hidden="true"
                      />
                      {theme.name}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label htmlFor="post-mood" className="mb-1.5 block text-xs font-semibold">
                Now playing / mood banner (optional)
              </label>
              <input
                id="post-mood"
                type="text"
                maxLength={100}
                value={moodStatus}
                onChange={(e) => setMoodStatus(e.target.value)}
                placeholder="e.g. Tracking demos on tape this month"
                className="field-control"
              />
            </div>
          </div>
        </section>

        {formError && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-2xl border border-[var(--err)] bg-[var(--err-bg)] px-4 py-3 text-xs font-medium text-[var(--err)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{formError}</span>
          </div>
        )}

        {publishedId && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--jam)] bg-[var(--jam-soft)] px-4 py-3 text-xs">
            <div className="flex items-center gap-2 font-semibold text-[var(--jam-text)]">
              <Check className="h-4 w-4" aria-hidden="true" />
              <span>Your profile is live in {region.label} and ready to share!</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopyShareUrl(publishedId)}
                className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1.5 font-semibold text-[var(--ink)] hover:bg-[var(--surface-hover)]"
              >
                {copiedId === publishedId ? 'Link copied' : 'Copy share link'}
              </button>
              <button
                type="button"
                onClick={() => {
                  const found = userListings.find((l) => l.id === publishedId);
                  if (found) onPreviewListing(found);
                }}
                className="rounded-xl px-3 py-1.5 font-bold"
                style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
              >
                Open page
              </button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-[var(--muted)]">
            Publishing saves to shared Firestore in real time for {region.label}.
          </p>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
          >
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {submitting
              ? 'Publishing to Firestore...'
              : user
                ? 'Publish live profile'
                : 'Sign in & publish profile'}
          </button>
        </div>
      </form>

      {/* Studio list of user's own published Firestore profiles */}
      <section className="panel space-y-4 rounded-3xl p-5 sm:p-7">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-lg font-bold">Your live profiles</h2>
            <p className="text-xs text-[var(--muted)]">
              {user
                ? 'Only your signed-in account can edit or remove these Firestore listings.'
                : 'Sign in above to manage your published profiles across devices.'}
            </p>
          </div>
          <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold">
            {userListings.length}
          </span>
        </div>

        {userListings.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-6 text-center text-xs text-[var(--muted)]">
            {user
              ? 'You have not published a profile yet. Use the studio form above to go live.'
              : 'No profiles loaded for the current signed-out session.'}
          </p>
        ) : (
          <ul className="space-y-3">
            {userListings.map((item) => (
              <li
                key={item.id}
                className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-base font-bold text-[var(--ink)]">
                      {item.title}
                    </h3>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      {item.regionLabel ?? item.regionId}
                    </span>
                    {item.instagramHandle && (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-[var(--jam-text)]">
                        <Instagram className="h-3 w-3" aria-hidden="true" />@{item.instagramHandle}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--muted)]">
                    {item.subtitle} | {item.neighborhood} | {item.clips.length} clip
                    {item.clips.length === 1 ? '' : 's'}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void handleCopyShareUrl(item.id)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                  >
                    {copiedId === item.id ? 'Copied link' : 'Share URL'}
                  </button>
                  <button
                    type="button"
                    onClick={() => onPreviewListing(item)}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                    Open page
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === item.id}
                    onClick={async () => {
                      setDeletingId(item.id);
                      try {
                        await onDeleteListing(item.id);
                      } finally {
                        setDeletingId(null);
                      }
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--err)] bg-[var(--err-bg)] px-3 py-2 text-xs font-semibold text-[var(--err)] transition hover:opacity-90 disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    {deletingId === item.id ? 'Removing...' : 'Delete'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Blocked accounts management */}
      {user && blockedUsers.length > 0 && (
        <section className="panel space-y-3 rounded-3xl p-5 sm:p-7">
          <div className="flex items-center gap-2">
            <ShieldBan className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
            <h2 className="font-display text-base font-bold">Blocked accounts</h2>
          </div>
          <p className="text-xs text-[var(--muted)]">
            Blocked musicians cannot send you jam invites, wall notes, or thread messages.
          </p>
          <ul className="space-y-2">
            {blockedUsers.map((entry) => (
              <li
                key={entry.blockedUid}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-2.5"
              >
                <span className="text-xs font-semibold text-[var(--ink)]">
                  {entry.blockedName}
                </span>
                <button
                  type="button"
                  disabled={unblockingUid === entry.blockedUid}
                  onClick={async () => {
                    setUnblockingUid(entry.blockedUid);
                    try {
                      await onUnblockUser(entry.blockedUid);
                    } finally {
                      setUnblockingUid(null);
                    }
                  }}
                  className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)] disabled:opacity-50"
                >
                  {unblockingUid === entry.blockedUid ? 'Unblocking...' : 'Unblock'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
