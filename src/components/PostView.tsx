import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  ExternalLink,
  Instagram,
  Link2,
  Loader2,
  LogOut,
  MapPin,
  Plus,
  ShieldBan,
  Sparkles,
  Star,
  Trash2,
  Video,
  Youtube,
} from 'lucide-react';
import { GEAR_CATEGORIES, PROFILE_THEME_LIST } from '../data/themes';
import {
  embedProviderLabel,
  parseClipUrl,
  sanitizeInstagramHandle,
} from '../lib/embedMedia';
import { attachFormValidation } from '../lib/formValidation';
import {
  fetchYouTubeChannelClips,
  isYouTubeImportConfigured,
  type YouTubeChannelImport,
  type YouTubeVideoCandidate,
} from '../lib/youtubeImport';
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
import { ClipPlayer } from './ClipPlayer';
import {
  ALL_INSTRUMENTS,
  INSTRUMENT_META,
  InstrumentBadgeRow,
  InstrumentIcon,
} from './InstrumentIcons';

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

type WizardStep = 1 | 2 | 3;

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

  const [wizardStep, setWizardStep] = useState<WizardStep>(1);
  const [previewSound, setPreviewSound] = useState(false);

  // Step 1: YouTube Visual Import & Linked Clips
  const [ytQuery, setYtQuery] = useState('');
  const [ytLoading, setYtLoading] = useState(false);
  const [ytError, setYtError] = useState<string | null>(null);
  const [ytChannel, setYtChannel] = useState<YouTubeChannelImport | null>(null);
  const [ytAutofillNotice, setYtAutofillNotice] = useState<string | null>(null);

  const [instagramInput, setInstagramInput] = useState('');
  const [clipUrlInput, setClipUrlInput] = useState('');
  const [clipTitleInput, setClipTitleInput] = useState('');
  const [clipError, setClipError] = useState<string | null>(null);
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [featuredClipId, setFeaturedClipId] = useState<string | undefined>(undefined);

  // Step 2: Musician details, instruments, genres & optional rig/theme
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
  const [themeId, setThemeId] = useState<ProfileThemeId>('stage-coral');
  const [moodStatus, setMoodStatus] = useState('');
  const [soundsLikeInput, setSoundsLikeInput] = useState('');

  // Form / Publish / Studio status
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [publishedId, setPublishedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [unblockingUid, setUnblockingUid] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const form = formRef.current;
    if (!form || wizardStep !== 2) return;
    return attachFormValidation(form);
  }, [wizardStep]);

  const normalizedHandle = sanitizeInstagramHandle(instagramInput);
  const ytConfigured = isYouTubeImportConfigured();

  const missingDetails = useMemo(() => {
    const missing: string[] = [];
    if (title.trim().length < 2) missing.push('Stage or project title (min 2 chars)');
    if (subtitle.trim().length < 2) missing.push('Primary instrument & vibe (min 2 chars)');
    if (neighborhood.trim().length < 2) missing.push('Neighborhood (min 2 chars)');
    if (seekingOrOffer.trim().length < 6) missing.push('What you want to jam on (min 6 chars)');
    if (bio.trim().length < 12) missing.push('Bio & session vibe (min 12 chars)');
    if (instruments.length === 0) missing.push('Pick at least one instrument');
    if (genres.length === 0) missing.push('Pick at least one genre');
    return missing;
  }, [title, subtitle, neighborhood, seekingOrOffer, bio, instruments.length, genres.length]);

  const step2Ready = missingDetails.length === 0;

  const previewListing = useMemo<Listing>(() => {
    const cleanTitle = title.trim() || ytChannel?.title || 'Your stage name';
    const previewClips: MediaClip[] =
      clips.length > 0
        ? clips
        : [
            {
              id: 'preview-synth',
              title: `${cleanTitle} live room preview`,
              kind: 'synth-reel',
              durationSec: 12,
              clipVariation: 0,
            },
          ];
    const soundsLike = soundsLikeInput
      .split(',')
      .map((s) => s.trim().slice(0, 64))
      .filter(Boolean)
      .slice(0, 6);

    return {
      id: 'wizard-preview',
      side: 'jam',
      roleCategory,
      instruments: instruments.length > 0 ? instruments : ['guitar'],
      regionId: region.id,
      regionLabel: region.label,
      regionState: region.state,
      neighborhood: neighborhood.trim() || region.city,
      title: cleanTitle,
      subtitle: subtitle.trim() || 'Instrumentalist & collaborator',
      seekingOrOffer:
        seekingOrOffer.trim() || 'Looking to connect with local players for weekly sessions',
      genres: genres.length > 0 ? genres.slice(0, 4) : ['Indie Rock'],
      tags: genres.slice(0, 4),
      bio: bio.trim() || 'Tell players about your sound and rehearsal availability.',
      gearOrBackline: gearOrBackline.trim() || 'Shared in jam thread',
      gearLocker,
      availability: availability.trim() || 'Weeknights & Sunday afternoons',
      instagramHandle: normalizedHandle,
      sampleLink: previewClips.find((c) => c.embedUrl)?.embedUrl,
      visualSeed: 17,
      clips: previewClips,
      featuredClipId: featuredClipId ?? previewClips[0]?.id,
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
      ownerUid: user?.uid,
      ownerName: user?.displayName,
      createdAt: Date.now(),
    };
  }, [
    availability,
    bio,
    clips,
    featuredClipId,
    gearLocker,
    gearOrBackline,
    genres,
    instruments,
    moodStatus,
    neighborhood,
    normalizedHandle,
    region,
    roleCategory,
    seekingOrOffer,
    soundsLikeInput,
    subtitle,
    themeId,
    title,
    user?.displayName,
    user?.uid,
    ytChannel?.title,
  ]);

  const handleLoadYouTube = async () => {
    setYtError(null);
    setYtAutofillNotice(null);
    if (!ytQuery.trim()) {
      setYtError('Enter a YouTube @handle or channel link (e.g. @corywong).');
      return;
    }

    setYtLoading(true);
    try {
      const result = await fetchYouTubeChannelClips(ytQuery);
      setYtChannel(result);

      const filledParts: string[] = [];
      if (!title.trim() && result.title) {
        setTitle(result.title.slice(0, 64));
        filledParts.push('stage name');
      }
      if (!bio.trim() && result.description) {
        setBio(result.description.slice(0, 600));
        filledParts.push('bio');
      }
      if (filledParts.length > 0) {
        setYtAutofillNotice(
          `Loaded ${result.videos.length} videos and pre-filled ${filledParts.join(' & ')} from ${result.title}.`
        );
      } else {
        setYtAutofillNotice(
          `Loaded ${result.videos.length} public videos from ${result.title}. Tap up to 4 below.`
        );
      }
    } catch (err) {
      setYtError(
        err instanceof Error && err.message
          ? err.message
          : 'Could not load YouTube channel videos right now.'
      );
    } finally {
      setYtLoading(false);
    }
  };

  const toggleYouTubeCandidate = (video: YouTubeVideoCandidate) => {
    setClipError(null);
    const existingIndex = clips.findIndex((c) => c.embedUrl === video.embedUrl);
    if (existingIndex >= 0) {
      const removed = clips[existingIndex];
      const next = clips.filter((_, idx) => idx !== existingIndex);
      setClips(next);
      if (featuredClipId === removed.id) {
        setFeaturedClipId(next[0]?.id);
      }
      return;
    }

    if (clips.length >= 4) {
      setClipError('Up to 4 clip links fit on one profile page — remove one before adding another.');
      return;
    }

    const newId = createClipId();
    const newClip: MediaClip = {
      id: newId,
      title: video.title.slice(0, 64) || 'YouTube clip',
      kind: 'embed',
      embedUrl: video.embedUrl,
      embedProvider: 'youtube',
      durationSec: 30,
    };
    setClips((prev) => [...prev, newClip]);
    setFeaturedClipId((prev) => prev ?? newId);
  };

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
    if (clips.some((c) => c.embedUrl === parsed.embedUrl)) {
      setClipError('That clip link is already in your selected list.');
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

    if (missingDetails.length > 0) {
      setFormError(missingDetails[0]);
      setWizardStep(2);
      return;
    }

    const cleanTitle = title.trim();
    const cleanSubtitle = subtitle.trim();
    const cleanNeighborhood = neighborhood.trim();
    const cleanSeeking = seekingOrOffer.trim();
    const cleanBio = bio.trim();

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
      setYtChannel(null);
      setYtAutofillNotice(null);
      setYtQuery('');
      setWizardStep(1);
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

  const wizardSteps: Array<{ step: WizardStep; title: string; complete: boolean }> = [
    { step: 1, title: '1. Import clips', complete: clips.length > 0 },
    { step: 2, title: '2. Instruments & vibe', complete: step2Ready },
    { step: 3, title: '3. Preview & publish', complete: Boolean(publishedId) },
  ];

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
              Import performance videos straight from your YouTube channel or paste links in three quick steps so players can hear you and invite you to jam.
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
                  Build your draft first — sign in at the end to publish
                </p>
                <p className="text-xs text-[var(--muted)]">
                  You can import YouTube clips and customize your card before signing in with Google or Apple.
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
        {/* 3-Step Onboarding Stepper */}
        <nav aria-label="Profile creation steps" className="grid grid-cols-3 gap-2">
          {wizardSteps.map((item) => {
            const isCurrent = wizardStep === item.step;
            return (
              <button
                key={item.step}
                type="button"
                aria-current={isCurrent ? 'step' : undefined}
                onClick={() => {
                  setFormError(null);
                  setWizardStep(item.step);
                }}
                className="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2.5 text-left text-xs font-bold transition"
                style={
                  isCurrent
                    ? {
                        backgroundColor: 'var(--jam)',
                        color: 'var(--jam-ink)',
                        borderColor: 'var(--jam)',
                      }
                    : {
                        backgroundColor: 'var(--surface-subtle)',
                        color: 'var(--ink)',
                        borderColor: 'var(--border)',
                      }
                }
              >
                <span className="truncate">{item.title}</span>
                {item.complete && !isCurrent && (
                  <Check className="h-3.5 w-3.5 shrink-0 text-[var(--ok)]" aria-hidden="true" />
                )}
              </button>
            );
          })}
        </nav>

        {/* STEP 1: Import Clips & Social Handle */}
        {wizardStep === 1 && (
          <section className="space-y-6">
            {/* YouTube Channel Visual Clip Picker */}
            {ytConfigured && (
              <div className="space-y-4 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4 sm:p-5">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h2 className="font-display flex items-center gap-2 text-base font-bold">
                      <Youtube className="h-5 w-5 text-[var(--jam-text)]" aria-hidden="true" />
                      Import clips from your YouTube channel
                    </h2>
                    <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--muted)]">
                      Tap up to 4 thumbnails
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[var(--muted)]">
                    Enter your public YouTube @handle or channel link to browse your videos and Shorts and auto-fill your stage name and bio.
                  </p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <label htmlFor="post-yt-channel" className="visually-hidden">
                    YouTube handle or channel URL
                  </label>
                  <input
                    id="post-yt-channel"
                    type="text"
                    value={ytQuery}
                    onChange={(e) => {
                      setYtQuery(e.target.value);
                      if (ytError) setYtError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        void handleLoadYouTube();
                      }
                    }}
                    placeholder="@yourband or youtube.com/@yourchannel"
                    className="field-control flex-1"
                  />
                  <button
                    type="button"
                    disabled={ytLoading}
                    onClick={() => void handleLoadYouTube()}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold transition hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                  >
                    {ytLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Youtube className="h-4 w-4" aria-hidden="true" />
                    )}
                    <span>{ytLoading ? 'Loading videos...' : 'Load videos'}</span>
                  </button>
                </div>

                {ytError && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-xl border border-[var(--err)] bg-[var(--err-bg)] px-3.5 py-2.5 text-xs font-medium text-[var(--err)]"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{ytError}</span>
                  </div>
                )}

                {ytChannel && (
                  <div className="space-y-3 pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-2.5">
                      <div className="flex min-w-0 items-center gap-2.5">
                        {ytChannel.avatarUrl && (
                          <img
                            src={ytChannel.avatarUrl}
                            alt=""
                            className="h-8 w-8 shrink-0 rounded-full border border-[var(--border)] object-cover"
                          />
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[var(--ink)]">
                            {ytChannel.title}
                          </p>
                          {ytChannel.handle && (
                            <p className="truncate text-[11px] text-[var(--muted)]">
                              {ytChannel.handle}
                            </p>
                          )}
                        </div>
                      </div>
                      {ytAutofillNotice && (
                        <span className="text-[11px] font-medium text-[var(--jam-text)]">
                          {ytAutofillNotice}
                        </span>
                      )}
                    </div>

                    <div className="app-scroll grid max-h-[24rem] grid-cols-2 gap-2.5 overflow-y-auto pr-1 sm:grid-cols-3 lg:grid-cols-4">
                      {ytChannel.videos.map((video) => {
                        const selectedIdx = clips.findIndex((c) => c.embedUrl === video.embedUrl);
                        const isSelected = selectedIdx >= 0;
                        return (
                          <button
                            key={video.videoId}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() => toggleYouTubeCandidate(video)}
                            className="group relative flex flex-col overflow-hidden rounded-2xl border text-left transition hover:bg-[var(--surface-hover)]"
                            style={{
                              borderColor: isSelected ? 'var(--jam)' : 'var(--border)',
                              backgroundColor: isSelected
                                ? 'var(--jam-soft)'
                                : 'var(--surface-solid)',
                            }}
                          >
                            <div className="relative aspect-video w-full overflow-hidden bg-black/20">
                              <img
                                src={video.thumbnailUrl}
                                alt=""
                                loading="lazy"
                                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                              />
                              <span
                                className="absolute right-2 top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold shadow-md"
                                style={
                                  isSelected
                                    ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                                    : {
                                        backgroundColor: 'rgba(16, 19, 29, 0.78)',
                                        color: '#ffffff',
                                      }
                                }
                              >
                                {isSelected ? selectedIdx + 1 : '+'}
                              </span>
                            </div>
                            <div className="p-2.5">
                              <p className="line-clamp-2 min-h-[2rem] text-xs font-semibold leading-snug text-[var(--ink)]">
                                {video.title}
                              </p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Instagram Handle & Manual Clip Paster */}
            <div className="space-y-4 border-t border-[var(--border)] pt-5">
              <div className="space-y-1">
                <h2 className="font-display flex items-center gap-2 text-base font-bold">
                  <Video className="h-5 w-5 text-[var(--jam-text)]" aria-hidden="true" />
                  Add Instagram handle or paste individual links
                </h2>
                <p className="text-xs leading-relaxed text-[var(--muted)]">
                  Link your Instagram handle (direct Instagram Creator visual import comes in Phase 2) or paste any public Instagram Reel, YouTube, TikTok, Vimeo, SoundCloud, or HTTPS MP4/MP3 link.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="post-ig-handle"
                    className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold"
                  >
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
                    Custom clip title (optional)
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
                  Paste Reel, YouTube, TikTok, Vimeo, SoundCloud, or HTTPS clip URL
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
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddClip();
                        }
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
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--muted)]">
                    <span>Selected clips ({clips.length} of 4)</span>
                    <span>Star sets the first clip players hear</span>
                  </div>
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
                              <p className="truncate text-[11px] text-[var(--muted)]">
                                {clip.embedUrl}
                              </p>
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
                </div>
              ) : (
                <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-xs text-[var(--muted)]">
                  No clip selected yet. Pick videos from YouTube above, paste a Reel/track link, or continue with a playable Stage Synth visual reel.
                </div>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <span className="text-xs text-[var(--muted)]">
                {clips.length > 0
                  ? `${clips.length} clip${clips.length === 1 ? '' : 's'} attached`
                  : 'Optional: Stage Synth fallback used if skipped'}
              </span>
              <button
                type="button"
                onClick={() => setWizardStep(2)}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:opacity-90"
                style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
              >
                <span>Next: Instruments &amp; vibe</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 2: Instruments, Genres, City & Details */}
        {wizardStep === 2 && (
          <section className="space-y-5">
            {ytAutofillNotice && (
              <div className="rounded-2xl border border-[var(--jam)] bg-[var(--jam-soft)] px-4 py-2.5 text-xs font-medium text-[var(--jam-text)]">
                {ytAutofillNotice}
              </div>
            )}

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
                <div className="mb-1.5 flex items-center justify-between gap-2">
                  <label htmlFor="post-neighborhood" className="block text-xs font-semibold">
                    Neighborhood in {region.city} *
                  </label>
                  <button
                    type="button"
                    onClick={onOpenRegionPicker}
                    className="text-[11px] font-semibold text-[var(--jam-text)] hover:underline"
                  >
                    Switch city
                  </button>
                </div>
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
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <label htmlFor="post-bio" className="block text-xs font-semibold">
                  Bio &amp; session vibe (minimum 12 characters) *
                </label>
                <span className="text-[11px] text-[var(--muted)]">{bio.trim().length} / 600</span>
              </div>
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

            <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-[var(--ink)]">
                <span>Optional: Rig locker, mood status &amp; color theme</span>
                <ChevronDown className="h-4 w-4 text-[var(--muted)]" aria-hidden="true" />
              </summary>

              <div className="mt-4 space-y-4">
                <div className="space-y-3">
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
              </div>
            </details>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border)] pt-4">
              <button
                type="button"
                onClick={() => setWizardStep(1)}
                className="inline-flex items-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                <span>Back to clips</span>
              </button>

              <button
                type="button"
                onClick={() => setWizardStep(3)}
                className="inline-flex items-center gap-2 rounded-2xl px-5 py-3 text-sm font-bold transition hover:opacity-90"
                style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
              >
                <span>Next: Preview &amp; publish</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </section>
        )}

        {/* STEP 3: Live Card Preview & Publish */}
        {wizardStep === 3 && (
          <section className="space-y-6">
            <div className="grid items-start gap-6 lg:grid-cols-12">
              <div className="lg:col-span-5">
                <article className="mx-auto flex w-full max-w-[23rem] flex-col overflow-hidden rounded-[2rem] border border-[var(--border)] bg-[var(--surface-solid)] shadow-[0_24px_60px_var(--glass-shadow)]">
                  <div className="relative h-[18.5rem] w-full overflow-hidden">
                    <ClipPlayer
                      listing={previewListing}
                      areaCode={region.areaCode}
                      isActive={wizardStep === 3}
                      soundEnabled={previewSound}
                      onToggleSound={() => setPreviewSound((s) => !s)}
                    />
                  </div>
                  <div className="flex flex-col gap-2 border-t border-[var(--border)] bg-[var(--surface-solid)] p-4">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-[10px] font-bold text-[var(--ink)]">
                          Live preview
                        </span>
                        {normalizedHandle && (
                          <span className="inline-flex items-center gap-1 truncate text-[10px] font-semibold text-[var(--jam-text)]">
                            <Instagram className="h-2.5 w-2.5 shrink-0" aria-hidden="true" />@
                            {normalizedHandle}
                          </span>
                        )}
                      </div>
                      <span className="truncate font-medium text-[var(--muted)]">
                        {previewListing.neighborhood}, {region.areaCode}
                      </span>
                    </div>

                    <InstrumentBadgeRow instruments={previewListing.instruments} compact max={4} />

                    <div>
                      <h3 className="font-display text-lg font-bold leading-tight text-[var(--ink)]">
                        {previewListing.title}
                      </h3>
                      <p className="text-xs text-[var(--muted)]">
                        {previewListing.subtitle}, {previewListing.neighborhood}
                      </p>
                    </div>

                    <p className="line-clamp-2 text-xs font-medium text-[var(--ink)]/90">
                      {previewListing.seekingOrOffer}
                    </p>

                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {previewListing.genres.slice(0, 3).map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--ink)]"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  </div>
                </article>
              </div>

              <div className="space-y-4 lg:col-span-7">
                <div className="space-y-2">
                  <h2 className="font-display text-lg font-bold">Ready to go live</h2>
                  <p className="text-xs leading-relaxed text-[var(--muted)]">
                    This is how musicians in {region.label} and nearby cities will see your card in Discover and Browse.
                  </p>
                </div>

                {missingDetails.length > 0 ? (
                  <div className="space-y-2.5 rounded-2xl border border-[var(--err)] bg-[var(--err-bg)] p-4 text-xs text-[var(--err)]">
                    <p className="font-bold">Complete these details before publishing:</p>
                    <ul className="list-disc space-y-1 pl-4">
                      {missingDetails.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => setWizardStep(2)}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--err)] bg-[var(--surface-solid)] px-3 py-1.5 font-bold text-[var(--err)] transition hover:opacity-90"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Fix in Step 2</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-start gap-2.5 rounded-2xl border border-[var(--jam)] bg-[var(--jam-soft)] p-4 text-xs text-[var(--jam-text)]">
                    <Check className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <div className="space-y-0.5">
                      <p className="font-bold">Profile details verified for Firestore</p>
                      <p>
                        {clips.length > 0
                          ? `${clips.length} linked clip${clips.length === 1 ? '' : 's'} ready.`
                          : 'Using Stage Synth intro preview clip.'}{' '}
                        Publishing saves immediately to {region.label}.
                      </p>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setWizardStep(1)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                  >
                    Edit clips ({clips.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-hover)]"
                  >
                    Edit details
                  </button>
                </div>

                <div className="flex flex-col gap-3 border-t border-[var(--border)] pt-4 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="button"
                    onClick={() => setWizardStep(2)}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                  >
                    <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                    <span>Back</span>
                  </button>

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
              </div>
            </div>
          </section>
        )}

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
              ? 'You have not published a profile yet. Use the 3-step studio above to go live.'
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
