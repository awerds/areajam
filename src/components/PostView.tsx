import { useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  Film,
  LogOut,
  Palette,
  Plus,
  PlusCircle,
  ShieldCheck,
  Speaker,
  Trash2,
  Video,
} from 'lucide-react';
import { GIGS_PREFERENCES, JAM_PREFERENCES } from '../data/regions';
import { GEAR_CATEGORIES, PROFILE_THEME_LIST } from '../data/themes';
import { attachFormValidation } from '../lib/formValidation';
import type {
  AppMode,
  AuthUser,
  GearCategory,
  GearItem,
  GigSubtype,
  InstrumentId,
  Listing,
  MediaClip,
  ProfileThemeId,
  Region,
} from '../types';
import { ALL_INSTRUMENTS, INSTRUMENT_META, InstrumentIcon } from './InstrumentIcons';
import { VideoClipRecorder } from './VideoClipRecorder';

interface PostViewProps {
  user: AuthUser | null;
  onRequireAuth: (reason?: string) => void;
  onSignOut: () => void;
  defaultSide: AppMode;
  region: Region;
  userListings: Listing[];
  onCreateListing: (listing: Listing) => void;
  onDeleteListing: (listingId: string) => void;
  onPreviewListing: (listing: Listing) => void;
}

export function PostView({
  user,
  onRequireAuth,
  onSignOut,
  defaultSide,
  region,
  userListings,
  onCreateListing,
  onDeleteListing,
  onPreviewListing,
}: PostViewProps) {
  const [side, setSide] = useState<AppMode>(defaultSide);
  const [gigSubtype, setGigSubtype] = useState<GigSubtype>('open-gig');
  const [roleCategory, setRoleCategory] = useState<string>(
    defaultSide === 'jam' ? JAM_PREFERENCES[0] : GIGS_PREFERENCES[0]
  );
  const [instruments, setInstruments] = useState<InstrumentId[]>(
    defaultSide === 'jam' ? ['guitar'] : ['band']
  );
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [seekingOrOffer, setSeekingOrOffer] = useState('');
  const [genresInput, setGenresInput] = useState('');
  const [payOrSplit, setPayOrSplit] = useState('');
  const [availability, setAvailability] = useState('');
  const [sampleLink, setSampleLink] = useState('');
  const [bio, setBio] = useState('');

  // Clips & Main Clip
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [featuredClipId, setFeaturedClipId] = useState<string | undefined>(undefined);

  // MySpace-inspired Page Customizer
  const [themeId, setThemeId] = useState<ProfileThemeId>(
    defaultSide === 'jam' ? 'stage-coral' : 'emerald-club'
  );
  const [moodStatus, setMoodStatus] = useState('');
  const [soundsLikeInput, setSoundsLikeInput] = useState('');

  // Music Nerd Gear Locker
  const [gearLocker, setGearLocker] = useState<GearItem[]>([]);
  const [gearCat, setGearCat] = useState<GearCategory>('Instruments');
  const [gearName, setGearName] = useState('');
  const [gearNotes, setGearNotes] = useState('');

  const [justPostedListing, setJustPostedListing] = useState<Listing | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!user || !formRef.current) return;
    return attachFormValidation(formRef.current);
  }, [user]);

  useEffect(() => {
    setRoleCategory(side === 'jam' ? JAM_PREFERENCES[0] : GIGS_PREFERENCES[0]);
    setInstruments((prev) =>
      prev.length > 0 ? prev : side === 'jam' ? ['guitar'] : ['band']
    );
  }, [side]);

  useEffect(() => {
    if (user && !title.trim() && side === 'jam') {
      setTitle(user.displayName);
    }
  }, [user]);

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-4xl">
        <div className="glass-surface grid grid-cols-1 gap-6 rounded-[2rem] p-6 md:grid-cols-12 md:p-8">
          <div className="space-y-4 md:col-span-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Account required only when creating a profile
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Build your {region.city} artist page &amp; gear locker
            </h2>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Anyone can browse local players and watch clips without an account. Sign in with Google or Apple to customize your full-page profile, list your exact rig, and record video intro clips.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  onRequireAuth(
                    'Sign in with Google or Apple to create your custom profile page, gear locker, and video intro clips.'
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-bold text-[var(--bg)] transition hover:opacity-90"
              >
                <Video className="h-4 w-4" aria-hidden="true" />
                <span>Sign in with Google or Apple</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:col-span-5">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <Film className="h-5 w-5 text-[var(--jam)]" aria-hidden="true" />
              <h3 className="font-display mt-2 text-base font-bold">Main clip &amp; webcam reels</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Record 30s vertical intros or upload cuts, and star which clip auto-plays first on your card.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <Palette className="h-5 w-5 text-[var(--gigs)]" aria-hidden="true" />
              <h3 className="font-display mt-2 text-base font-bold">Custom MySpace-style page</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Pick a color theme, list every pedal, amp, and mic in your Gear Locker, and open a wall for local players.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  const toggleInstrument = (id: InstrumentId) => {
    setInstruments((prev) =>
      prev.includes(id)
        ? prev.length > 1
          ? prev.filter((item) => item !== id)
          : prev
        : [...prev, id].slice(0, 6)
    );
  };

  const addGearItem = () => {
    if (!gearName.trim()) return;
    setGearLocker((prev) => [
      ...prev,
      {
        id: `gear-${Date.now()}-${prev.length}`,
        category: gearCat,
        name: gearName.trim(),
        notes: gearNotes.trim() || undefined,
      },
    ]);
    setGearName('');
    setGearNotes('');
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }

    const parsedGenres = genresInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 4);

    const parsedSounds = soundsLikeInput
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 6);

    const id = `user-${Date.now()}`;
    const finalClips: MediaClip[] =
      clips.length > 0
        ? clips
        : [
            {
              id: `${id}-c1`,
              title: 'Intro reel',
              kind: 'synth-reel',
              durationSec: 8,
              clipVariation: 0,
            },
          ];

    const summaryGear =
      gearLocker.length > 0
        ? gearLocker.map((g) => g.name).join(', ')
        : 'Details available on match';

    const newListing: Listing = {
      id,
      side,
      gigSubtype: side === 'gigs' ? gigSubtype : undefined,
      roleCategory,
      instruments,
      regionId: region.id,
      neighborhood: neighborhood.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      seekingOrOffer: seekingOrOffer.trim(),
      genres: parsedGenres.length > 0 ? parsedGenres : ['Indie'],
      tags:
        side === 'jam'
          ? ['Local', 'Your post']
          : [gigSubtype === 'open-gig' ? 'Open slot' : 'Band for hire'],
      bio: bio.trim(),
      gearOrBackline: summaryGear,
      gearLocker,
      availability: availability.trim() || 'Flexible evenings',
      payOrSplit: side === 'gigs' && payOrSplit.trim() ? payOrSplit.trim() : undefined,
      sampleLink: sampleLink.trim() || undefined,
      visualSeed: Math.floor(Math.random() * 90) + 10,
      clips: finalClips,
      featuredClipId: featuredClipId || finalClips[0]?.id,
      profileStyle: {
        themeId,
        moodStatus: moodStatus.trim() || undefined,
        soundsLike: parsedSounds,
        bannerPattern: 'waves',
      },
      autoMatch: false,
      autoReply: 'Thanks for connecting on AreaJam!',
      isUserCreated: true,
      ownerUid: user.uid,
      ownerName: user.displayName,
      createdAt: Date.now(),
    };

    onCreateListing(newListing);
    setJustPostedListing(newListing);
    setTitle('');
    setSubtitle('');
    setNeighborhood('');
    setSeekingOrOffer('');
    setGenresInput('');
    setPayOrSplit('');
    setAvailability('');
    setSampleLink('');
    setBio('');
    setClips([]);
    setFeaturedClipId(undefined);
    setGearLocker([]);
    setMoodStatus('');
    setSoundsLikeInput('');
    e.currentTarget.reset();
  };

  const roleOptions = side === 'jam' ? JAM_PREFERENCES : GIGS_PREFERENCES;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="glass-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img
              src={user.photoURL}
              alt=""
              referrerPolicy="no-referrer"
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <span className="font-display inline-flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] text-sm font-bold text-white">
              {user.displayName.slice(0, 1).toUpperCase()}
            </span>
          )}
          <div>
            <p className="text-sm font-bold text-[var(--ink)]">{user.displayName}</p>
            <p className="text-xs text-[var(--muted)]">
              Signed in via {user.provider === 'apple' ? 'Apple' : 'Google'}
              {user.isDemoPreview ? ' (local preview)' : ''}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onSignOut}
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>

      <div className="glass-surface rounded-[2rem] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Create your profile page, gear locker &amp; clips
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Publishing to <span className="font-semibold text-[var(--ink)]">{region.label}</span>
            </p>
          </div>

          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--track-bg)] p-1">
            <button
              type="button"
              onClick={() => setSide('jam')}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
              style={
                side === 'jam'
                  ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                  : { color: 'var(--muted)' }
              }
            >
              Jam or bandmate
            </button>
            <button
              type="button"
              onClick={() => setSide('gigs')}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
              style={
                side === 'gigs'
                  ? { backgroundColor: 'var(--gigs)', color: 'var(--gigs-ink)' }
                  : { color: 'var(--muted)' }
              }
            >
              Band or gig
            </button>
          </div>
        </div>

        {justPostedListing && (
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--ok)] bg-[var(--surface-subtle)] px-4 py-3 text-sm text-[var(--ok)]">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Published <strong>{justPostedListing.title}</strong> to {region.city}.
              </span>
            </span>
            <button
              type="button"
              onClick={() => onPreviewListing(justPostedListing)}
              className="rounded-full bg-[var(--ok)] px-4 py-1.5 text-xs font-bold text-[var(--ok-ink)]"
            >
              Open my page
            </button>
          </div>
        )}

        <div className="mb-6">
          <VideoClipRecorder
            clips={clips}
            featuredClipId={featuredClipId}
            onAddClip={(clip) => setClips((prev) => [...prev, clip])}
            onRemoveClip={(clipId) => setClips((prev) => prev.filter((c) => c.id !== clipId))}
            onSetFeaturedClip={setFeaturedClipId}
          />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-5">
          {side === 'gigs' && (
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'open-gig', label: 'Open venue or bill slot' },
                  { id: 'band-for-hire', label: 'Band ready to book' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGigSubtype(opt.id)}
                  className="rounded-xl border px-3 py-2.5 text-xs font-semibold transition"
                  style={{
                    borderColor: gigSubtype === opt.id ? 'var(--gigs)' : 'var(--border)',
                    backgroundColor:
                      gigSubtype === opt.id ? 'var(--gigs-soft)' : 'var(--pill-bg)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Instruments picker with bespoke vector icons */}
          <div className="space-y-2">
            <span className="block text-xs font-semibold">
              What do you play or offer? (Shown as icons on your card)
            </span>
            <div className="flex flex-wrap gap-2">
              {ALL_INSTRUMENTS.map((id) => {
                const selected = instruments.includes(id);
                const meta = INSTRUMENT_META[id];
                return (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleInstrument(id)}
                    className="inline-flex items-center gap-2 rounded-full border py-1.5 pl-1.5 pr-3.5 text-xs font-semibold transition hover:brightness-110"
                    style={
                      selected
                        ? {
                            backgroundColor: meta.bg,
                            color: '#ffffff',
                            borderColor: meta.color,
                            boxShadow: `0 0 0 1px ${meta.color}`,
                          }
                        : {
                            backgroundColor: 'var(--pill-bg)',
                            color: 'var(--ink)',
                            borderColor: 'var(--border)',
                          }
                    }
                  >
                    <span
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: selected ? 'transparent' : meta.bg,
                        color: meta.color,
                      }}
                    >
                      <InstrumentIcon id={id} size={20} />
                    </span>
                    <span>{meta.shortLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="post-role" className="mb-1 block text-xs font-semibold">
                {side === 'jam' ? 'Primary category' : 'Gig category'}
              </label>
              <span id="post-role-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Matches player filters
              </span>
              <select
                id="post-role"
                value={roleCategory}
                onChange={(e) => setRoleCategory(e.target.value)}
                aria-describedby="post-role-hint"
                className="field-control"
              >
                {roleOptions.map((opt) => (
                  <option key={opt} value={opt} className="bg-[var(--surface-solid)] text-[var(--ink)]">
                    {opt}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="post-title" className="mb-1 block text-xs font-semibold">
                {side === 'jam'
                  ? 'Name or project'
                  : gigSubtype === 'open-gig'
                    ? 'Venue or showcase name'
                    : 'Band name'}
              </label>
              <span id="post-title-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Main headline on your card
              </span>
              <input
                id="post-title"
                type="text"
                required
                minLength={2}
                maxLength={64}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                aria-describedby="post-title-hint"
                data-error="post-title-error"
                placeholder={side === 'jam' ? 'e.g. Jordan Rivera' : 'e.g. Velvet Static'}
                className="field-control"
              />
              <div id="post-title-error" className="error-msg">
                <span role="img" aria-label="Error" className="inline-flex shrink-0">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>Enter a name (at least 2 characters).</span>
              </div>
            </div>

            <div>
              <label htmlFor="post-subtitle" className="mb-1 block text-xs font-semibold">
                {side === 'jam' ? 'Experience or setup' : 'Format or slot label'}
              </label>
              <span id="post-subtitle-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                {side === 'jam' ? 'e.g. Drummer, 6 yrs' : 'e.g. 4-Piece Band or Thu 9 PM'}
              </span>
              <input
                id="post-subtitle"
                type="text"
                required
                minLength={2}
                maxLength={64}
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                aria-describedby="post-subtitle-hint"
                data-error="post-subtitle-error"
                placeholder={side === 'jam' ? 'Drummer, 6 yrs' : 'Open Slot, Fri Night'}
                className="field-control"
              />
              <div id="post-subtitle-error" className="error-msg">
                <span role="img" aria-label="Error" className="inline-flex shrink-0">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>Enter your role or slot label.</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-neighborhood" className="mb-1 block text-xs font-semibold">
                Neighborhood or part of town
              </label>
              <span id="post-neighborhood-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Keeps meetups local to your side of {region.city}
              </span>
              <input
                id="post-neighborhood"
                type="text"
                required
                minLength={2}
                maxLength={48}
                value={neighborhood}
                onChange={(e) => setNeighborhood(e.target.value)}
                aria-describedby="post-neighborhood-hint"
                data-error="post-neighborhood-error"
                placeholder="e.g. East Side"
                className="field-control"
              />
              <div id="post-neighborhood-error" className="error-msg">
                <span role="img" aria-label="Error" className="inline-flex shrink-0">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>Enter a neighborhood or area.</span>
              </div>
            </div>

            <div>
              <label htmlFor="post-genres" className="mb-1 block text-xs font-semibold">
                Genres (comma-separated)
              </label>
              <span id="post-genres-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Up to 4 tags, e.g. Indie, Funk, Post-Punk
              </span>
              <input
                id="post-genres"
                type="text"
                required
                minLength={2}
                maxLength={80}
                value={genresInput}
                onChange={(e) => setGenresInput(e.target.value)}
                aria-describedby="post-genres-hint"
                data-error="post-genres-error"
                placeholder="Indie, Psych Rock, Soul"
                className="field-control"
              />
              <div id="post-genres-error" className="error-msg">
                <span role="img" aria-label="Error" className="inline-flex shrink-0">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>Add at least one genre.</span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="post-seeking" className="mb-1 block text-xs font-semibold">
              {side === 'jam' ? 'Who are you looking to play with?' : 'Gig or booking headline'}
            </label>
            <span id="post-seeking-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
              One punchy sentence shown right below your title
            </span>
            <input
              id="post-seeking"
              type="text"
              required
              minLength={6}
              maxLength={140}
              value={seekingOrOffer}
              onChange={(e) => setSeekingOrOffer(e.target.value)}
              aria-describedby="post-seeking-hint"
              data-error="post-seeking-error"
              placeholder={
                side === 'jam'
                  ? 'Looking for tight drummer and bass to write 6 songs'
                  : 'Need 1 energetic local band for 9 PM Friday slot'
              }
              className="field-control"
            />
            <div id="post-seeking-error" className="error-msg">
              <span role="img" aria-label="Error" className="inline-flex shrink-0">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>Describe who or what you are looking for (at least 6 characters).</span>
            </div>
          </div>

          {/* Music Nerd Gear Locker Builder */}
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="flex items-center gap-2">
              <Speaker className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              <div>
                <h3 className="font-display text-sm font-bold">Gear locker (for the music nerds)</h3>
                <p className="text-xs text-[var(--muted)]">
                  List your exact guitars, amps, pedals, synths, drum kit, or house backline
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
              <div className="sm:col-span-4">
                <label htmlFor="gear-cat-select" className="visually-hidden">
                  Gear category
                </label>
                <select
                  id="gear-cat-select"
                  value={gearCat}
                  onChange={(e) => setGearCat(e.target.value as GearCategory)}
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
                <label htmlFor="gear-name-input" className="visually-hidden">
                  Gear name
                </label>
                <input
                  id="gear-name-input"
                  type="text"
                  maxLength={60}
                  value={gearName}
                  onChange={(e) => setGearName(e.target.value)}
                  placeholder="e.g. Fender Jazzmaster"
                  className="field-control text-xs"
                />
              </div>
              <div className="flex gap-2 sm:col-span-4">
                <label htmlFor="gear-notes-input" className="visually-hidden">
                  Gear notes
                </label>
                <input
                  id="gear-notes-input"
                  type="text"
                  maxLength={60}
                  value={gearNotes}
                  onChange={(e) => setGearNotes(e.target.value)}
                  placeholder="Optional specs"
                  className="field-control text-xs"
                />
                <button
                  type="button"
                  onClick={addGearItem}
                  aria-label="Add gear item"
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[var(--border-strong)] bg-[var(--pill-bg)] hover:bg-[var(--surface-hover)]"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            </div>

            {gearLocker.length > 0 && (
              <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {gearLocker.map((g) => (
                  <li
                    key={g.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs"
                  >
                    <div className="min-w-0">
                      <span className="font-semibold text-[var(--accent)]">{g.category}: </span>
                      <span className="font-semibold text-[var(--ink)]">{g.name}</span>
                      {g.notes && <span className="text-[var(--muted)]"> — {g.notes}</span>}
                    </div>
                    <button
                      type="button"
                      onClick={() => setGearLocker((prev) => prev.filter((item) => item.id !== g.id))}
                      aria-label={`Remove ${g.name}`}
                      className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-[var(--err)] hover:bg-[var(--surface-hover)]"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* MySpace-Inspired Page Customizer */}
          <div className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-[var(--accent)]" aria-hidden="true" />
              <div>
                <h3 className="font-display text-sm font-bold">Customize your profile page vibe</h3>
                <p className="text-xs text-[var(--muted)]">
                  Choose a theme, status mood, and bands you sound like for your full page
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              {PROFILE_THEME_LIST.map((t) => {
                const selected = t.id === themeId;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setThemeId(t.id)}
                    className="rounded-xl border p-2.5 text-left transition"
                    style={{
                      background: `linear-gradient(135deg, ${t.bgFrom}, ${t.bgTo})`,
                      borderColor: selected ? t.accent : 'var(--border-strong)',
                      boxShadow: selected ? `0 0 0 1px ${t.accent}` : undefined,
                    }}
                  >
                    <span
                      className="mb-1.5 block h-2.5 w-7 rounded-full"
                      style={{ backgroundColor: t.accent }}
                    />
                    <span className="block text-[11px] font-bold text-white">{t.name}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="post-mood" className="mb-1 block text-xs font-semibold">
                  Mood or current session status
                </label>
                <input
                  id="post-mood"
                  type="text"
                  maxLength={90}
                  value={moodStatus}
                  onChange={(e) => setMoodStatus(e.target.value)}
                  placeholder="e.g. Shedding odd-time grooves in East Austin"
                  className="field-control text-xs"
                />
              </div>

              <div>
                <label htmlFor="post-sounds-like" className="mb-1 block text-xs font-semibold">
                  Sounds like / FFO (comma-separated)
                </label>
                <input
                  id="post-sounds-like"
                  type="text"
                  maxLength={100}
                  value={soundsLikeInput}
                  onChange={(e) => setSoundsLikeInput(e.target.value)}
                  placeholder="e.g. Khruangbin, Radiohead, Turnstile"
                  className="field-control text-xs"
                />
              </div>
            </div>
          </div>

          {side === 'gigs' && (
            <div>
              <label htmlFor="post-pay" className="mb-1 block text-xs font-semibold">
                Pay guarantee or door split
              </label>
              <span id="post-pay-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Optional — e.g. $250 guarantee or 80/20 door
              </span>
              <input
                id="post-pay"
                type="text"
                maxLength={60}
                value={payOrSplit}
                onChange={(e) => setPayOrSplit(e.target.value)}
                aria-describedby="post-pay-hint"
                placeholder="$300 guarantee + bar tab"
                className="field-control"
              />
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-availability" className="mb-1 block text-xs font-semibold">
                Availability
              </label>
              <span id="post-availability-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Nights or weekends you can play
              </span>
              <input
                id="post-availability"
                type="text"
                maxLength={70}
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                aria-describedby="post-availability-hint"
                placeholder="Tue/Thu nights & Sundays"
                className="field-control"
              />
            </div>

            <div>
              <label htmlFor="post-link" className="mb-1 block text-xs font-semibold">
                Demo or live link (optional)
              </label>
              <span id="post-link-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Bandcamp, SoundCloud, Spotify, or Instagram HTTPS URL
              </span>
              <input
                id="post-link"
                type="text"
                maxLength={120}
                value={sampleLink}
                onChange={(e) => setSampleLink(e.target.value)}
                aria-describedby="post-link-hint"
                placeholder="bandcamp.com/yourband"
                className="field-control"
              />
            </div>
          </div>

          <div>
            <label htmlFor="post-bio" className="mb-1 block text-xs font-semibold">
              Bio and musical goals
            </label>
            <span id="post-bio-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
              Short note on sound, goals, or set details (min 12 chars)
            </span>
            <textarea
              id="post-bio"
              rows={3}
              required
              minLength={12}
              maxLength={600}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              aria-describedby="post-bio-hint"
              data-error="post-bio-error"
              placeholder="Tell local musicians about your setup, rehearsal style, and gig goals..."
              className="field-control"
            />
            <div id="post-bio-error" className="error-msg">
              <span role="img" aria-label="Error" className="inline-flex shrink-0">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>Write at least 12 characters about your sound or event.</span>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-bold transition hover:opacity-90"
            style={{
              backgroundColor: side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
              color: side === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
            }}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>
              Publish profile page to {region.city} ({clips.length} {clips.length === 1 ? 'clip' : 'clips'})
            </span>
          </button>
        </form>
      </div>

      {userListings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold">
            Your published pages ({userListings.length})
          </h3>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {userListings.map((item) => (
              <li
                key={item.id}
                className="glass-surface flex items-center justify-between gap-3 rounded-2xl px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                      style={{
                        backgroundColor:
                          item.side === 'jam' ? 'var(--jam-soft)' : 'var(--gigs-soft)',
                        color: item.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                      }}
                    >
                      {item.side === 'jam' ? 'Jam' : 'Gigs'}
                    </span>
                    <span className="truncate text-xs text-[var(--muted)]">
                      {item.neighborhood}, {item.clips.length} clips
                    </span>
                  </div>
                  <p className="font-display mt-1 truncate font-bold">{item.title}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewListing(item)}
                    aria-label={`Open full page for ${item.title}`}
                    className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold transition hover:bg-[var(--surface-hover)]"
                  >
                    <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Open page</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteListing(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--err)] transition hover:bg-[var(--surface-hover)]"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
