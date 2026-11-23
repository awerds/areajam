import { useEffect, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Eye, Film, LogOut, PlusCircle, ShieldCheck, Trash2, Video } from 'lucide-react';
import { GIGS_PREFERENCES, JAM_PREFERENCES } from '../data/regions';
import { attachFormValidation } from '../lib/formValidation';
import type { AppMode, AuthUser, GigSubtype, Listing, MediaClip, Region } from '../types';
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
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [neighborhood, setNeighborhood] = useState('');
  const [seekingOrOffer, setSeekingOrOffer] = useState('');
  const [genresInput, setGenresInput] = useState('');
  const [payOrSplit, setPayOrSplit] = useState('');
  const [gearOrBackline, setGearOrBackline] = useState('');
  const [availability, setAvailability] = useState('');
  const [sampleLink, setSampleLink] = useState('');
  const [bio, setBio] = useState('');
  const [clips, setClips] = useState<MediaClip[]>([]);
  const [justPostedListing, setJustPostedListing] = useState<Listing | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!user || !formRef.current) return;
    return attachFormValidation(formRef.current);
  }, [user]);

  useEffect(() => {
    setRoleCategory(side === 'jam' ? JAM_PREFERENCES[0] : GIGS_PREFERENCES[0]);
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
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-semibold text-[var(--accent)]">
              <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
              Account required only when creating a profile
            </span>
            <h2 className="font-display text-3xl font-bold tracking-tight">
              Record an intro video and join {region.city}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--muted)]">
              Anyone can browse local players and watch clips without an account. Sign in with Apple or Google to build your card, record a 30-second webcam intro or upload cuts, and message matches.
            </p>

            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() =>
                  onRequireAuth(
                    'Sign in with Apple or Google to create your profile, record video intros, and post to your local board.'
                  )
                }
                className="inline-flex items-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-3 text-sm font-bold text-[var(--bg)] transition hover:opacity-90"
              >
                <Video className="h-4 w-4" aria-hidden="true" />
                <span>Sign in with Apple or Google</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 md:col-span-5">
            <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
              <Film className="h-5 w-5 text-[var(--jam)]" aria-hidden="true" />
              <h3 className="font-display mt-2 text-base font-bold">In-browser clip studio</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Record 30s vertical intro clips from your webcam or upload live rehearsal cuts straight from your phone or laptop.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border)] bg-white/5 p-4">
              <PlusCircle className="h-5 w-5 text-[var(--gigs)]" aria-hidden="true" />
              <h3 className="font-display mt-2 text-base font-bold">Auto-playing reel cards</h3>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Your first clip loops automatically when musicians browse or swipe through {region.city}.
              </p>
            </div>
          </div>
        </div>
      </section>
    );
  }

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

    const newListing: Listing = {
      id,
      side,
      gigSubtype: side === 'gigs' ? gigSubtype : undefined,
      roleCategory,
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
      gearOrBackline: gearOrBackline.trim() || 'Details available on match',
      availability: availability.trim() || 'Flexible evenings',
      payOrSplit: side === 'gigs' && payOrSplit.trim() ? payOrSplit.trim() : undefined,
      sampleLink: sampleLink.trim() || undefined,
      visualSeed: Math.floor(Math.random() * 90) + 10,
      clips: finalClips,
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
    setGearOrBackline('');
    setAvailability('');
    setSampleLink('');
    setBio('');
    setClips([]);
    e.currentTarget.reset();
  };

  const roleOptions = side === 'jam' ? JAM_PREFERENCES : GIGS_PREFERENCES;

  return (
    <section className="mx-auto w-full max-w-4xl space-y-6">
      <div className="glass-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl px-5 py-3.5">
        <div className="flex items-center gap-3">
          {user.photoURL ? (
            <img src={user.photoURL} alt="" className="h-9 w-9 rounded-full object-cover" />
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
          className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-white/5 px-3.5 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:text-[var(--ink)]"
        >
          <LogOut className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Sign out</span>
        </button>
      </div>

      <div className="glass-surface rounded-[2rem] p-6">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-2xl font-bold tracking-tight">
              Create your profile card and clips
            </h2>
            <p className="text-sm text-[var(--muted)]">
              Publishing to <span className="font-semibold text-[var(--ink)]">{region.label}</span>
            </p>
          </div>

          <div className="inline-flex rounded-full border border-[var(--border)] bg-white/5 p-1">
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
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--ok)] bg-white/5 px-4 py-3 text-sm text-[var(--ok)]">
            <span className="inline-flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                Published <strong>{justPostedListing.title}</strong> to {region.city}.
              </span>
            </span>
            <button
              type="button"
              onClick={() => onPreviewListing(justPostedListing)}
              className="rounded-full bg-[var(--ok)] px-3.5 py-1 text-xs font-bold text-[#041d12]"
            >
              Watch my card
            </button>
          </div>
        )}

        <div className="mb-6">
          <VideoClipRecorder
            clips={clips}
            onAddClip={(clip) => setClips((prev) => [...prev, clip])}
            onRemoveClip={(clipId) => setClips((prev) => prev.filter((c) => c.id !== clipId))}
          />
        </div>

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
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
                      gigSubtype === opt.id ? 'rgba(16, 232, 138, 0.12)' : 'rgba(255, 255, 255, 0.03)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="post-role" className="mb-1 block text-xs font-semibold">
                {side === 'jam' ? 'Main instrument or role' : 'Gig category'}
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
                  <option key={opt} value={opt} className="bg-[#10131d] text-white">
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
              <label htmlFor="post-gear" className="mb-1 block text-xs font-semibold">
                {side === 'jam' ? 'Gear or practice space' : 'Backline and PA info'}
              </label>
              <span id="post-gear-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Amps, kit, mics, or lock-out room details
              </span>
              <input
                id="post-gear"
                type="text"
                value={gearOrBackline}
                onChange={(e) => setGearOrBackline(e.target.value)}
                aria-describedby="post-gear-hint"
                placeholder="Fender Twin, own mics, shared studio"
                className="field-control"
              />
            </div>

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
                value={availability}
                onChange={(e) => setAvailability(e.target.value)}
                aria-describedby="post-availability-hint"
                placeholder="Tue/Thu nights & Sundays"
                className="field-control"
              />
            </div>
          </div>

          <div>
            <label htmlFor="post-link" className="mb-1 block text-xs font-semibold">
              Demo or live link (optional)
            </label>
            <span id="post-link-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
              Bandcamp, SoundCloud, Spotify, or Instagram URL
            </span>
            <input
              id="post-link"
              type="text"
              value={sampleLink}
              onChange={(e) => setSampleLink(e.target.value)}
              aria-describedby="post-link-hint"
              placeholder="bandcamp.com/yourband"
              className="field-control"
            />
          </div>

          <div>
            <label htmlFor="post-bio" className="mb-1 block text-xs font-semibold">
              Vibe and influences
            </label>
            <span id="post-bio-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
              Short note on sound, goals, or set details (min 12 chars)
            </span>
            <textarea
              id="post-bio"
              rows={3}
              required
              minLength={12}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              aria-describedby="post-bio-hint"
              data-error="post-bio-error"
              placeholder="Influenced by Khruangbin, Pavement, and Alabama Shakes..."
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
              Publish profile to {region.city} ({clips.length} {clips.length === 1 ? 'clip' : 'clips'})
            </span>
          </button>
        </form>
      </div>

      {userListings.length > 0 && (
        <div className="space-y-3">
          <h3 className="font-display text-lg font-bold">
            Your published cards ({userListings.length})
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
                          item.side === 'jam'
                            ? 'rgba(255, 59, 107, 0.16)'
                            : 'rgba(16, 232, 138, 0.16)',
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
                    aria-label={`Preview ${item.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white/5 transition hover:bg-white/10"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteListing(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-white/5 text-[var(--err)] transition hover:bg-white/10"
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
