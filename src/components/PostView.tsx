import { useEffect, useRef, useState } from 'react';
import { CheckCircle2, Eye, PlusCircle, Trash2 } from 'lucide-react';
import { attachFormValidation } from '../lib/formValidation';
import type { AppMode, GigSubtype, Listing, Region } from '../types';

interface PostViewProps {
  defaultSide: AppMode;
  region: Region;
  userListings: Listing[];
  onCreateListing: (listing: Listing) => void;
  onDeleteListing: (listingId: string) => void;
  onPreviewListing: (listing: Listing) => void;
}

export function PostView({
  defaultSide,
  region,
  userListings,
  onCreateListing,
  onDeleteListing,
  onPreviewListing,
}: PostViewProps) {
  const [side, setSide] = useState<AppMode>(defaultSide);
  const [gigSubtype, setGigSubtype] = useState<GigSubtype>('open-gig');
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
  const [justPostedTitle, setJustPostedTitle] = useState<string | null>(null);

  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!formRef.current) return;
    return attachFormValidation(formRef.current);
  }, []);

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

    const newListing: Listing = {
      id: `user-${Date.now()}`,
      side,
      gigSubtype: side === 'gigs' ? gigSubtype : undefined,
      regionId: region.id,
      neighborhood: neighborhood.trim(),
      title: title.trim(),
      subtitle: subtitle.trim(),
      seekingOrOffer: seekingOrOffer.trim(),
      genres: parsedGenres.length > 0 ? parsedGenres : ['Indie'],
      tags: side === 'jam' ? ['Local', 'Your Post'] : [gigSubtype === 'open-gig' ? 'Open Slot' : 'Band for Hire'],
      bio: bio.trim(),
      gearOrBackline: gearOrBackline.trim() || 'Details available on match',
      availability: availability.trim() || 'Flexible evenings',
      payOrSplit: side === 'gigs' && payOrSplit.trim() ? payOrSplit.trim() : undefined,
      sampleLink: sampleLink.trim() || undefined,
      visualSeed: Math.floor(Math.random() * 90) + 10,
      autoMatch: false,
      autoReply: 'Thanks for connecting on AreaJam!',
      isUserCreated: true,
      createdAt: Date.now(),
    };

    onCreateListing(newListing);
    setJustPostedTitle(newListing.title);
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
    e.currentTarget.reset();
  };

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-md">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-display text-2xl font-extrabold tracking-tight">Pin a Local Card</h2>
            <p className="text-sm text-[var(--muted)]">
              Posting to <span className="font-semibold text-[var(--ink)]">{region.label}</span>
            </p>
          </div>

          <div className="inline-flex rounded-full border border-[var(--border)] bg-[var(--surface-2)] p-1">
            <button
              type="button"
              onClick={() => setSide('jam')}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition"
              style={
                side === 'jam'
                  ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                  : { color: 'var(--muted)' }
              }
            >
              Jam / Bandmate
            </button>
            <button
              type="button"
              onClick={() => setSide('gigs')}
              className="rounded-full px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider transition"
              style={
                side === 'gigs'
                  ? { backgroundColor: 'var(--gigs)', color: 'var(--gigs-ink)' }
                  : { color: 'var(--muted)' }
              }
            >
              Band / Gig
            </button>
          </div>
        </div>

        {justPostedTitle && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[var(--ok)] bg-[var(--surface-2)] px-3.5 py-2.5 text-sm text-[var(--ok)]">
            <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
            <span>
              Pinned <strong>{justPostedTitle}</strong> to your {region.city} board!
            </span>
          </div>
        )}

        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          {side === 'gigs' && (
            <div className="grid grid-cols-2 gap-2.5">
              {(
                [
                  { id: 'open-gig', label: 'Open Venue / Bill Slot' },
                  { id: 'band-for-hire', label: 'Band Ready to Book' },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setGigSubtype(opt.id)}
                  className="rounded-xl border px-3 py-2.5 text-xs font-semibold transition"
                  style={{
                    borderColor: gigSubtype === opt.id ? 'var(--gigs)' : 'var(--border)',
                    backgroundColor: gigSubtype === opt.id ? 'var(--surface-2)' : 'transparent',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-title" className="mb-1 block text-xs font-semibold">
                {side === 'jam' ? 'Name or Project' : gigSubtype === 'open-gig' ? 'Venue / Showcase Name' : 'Band Name'}
              </label>
              <span id="post-title-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                Shown as the bold headline on your card
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
                <span role="img" aria-label="Error">
                  ⚠
                </span>{' '}
                Enter a name (at least 2 characters).
              </div>
            </div>

            <div>
              <label htmlFor="post-subtitle" className="mb-1 block text-xs font-semibold">
                {side === 'jam' ? 'Primary Instrument / Role' : 'Format / Slot Label'}
              </label>
              <span id="post-subtitle-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                {side === 'jam' ? 'e.g. Drummer · 6 yrs' : 'e.g. 4-Piece Band or Thu 9 PM Slot'}
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
                placeholder={side === 'jam' ? 'Drummer · 6 yrs' : 'Open Slot · Fri Night'}
                className="field-control"
              />
              <div id="post-subtitle-error" className="error-msg">
                <span role="img" aria-label="Error">
                  ⚠
                </span>{' '}
                Enter your instrument, role, or slot label.
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="post-neighborhood" className="mb-1 block text-xs font-semibold">
                Neighborhood / Part of Town
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
                <span role="img" aria-label="Error">
                  ⚠
                </span>{' '}
                Enter a neighborhood or area.
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
                <span role="img" aria-label="Error">
                  ⚠
                </span>{' '}
                Add at least one genre.
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="post-seeking" className="mb-1 block text-xs font-semibold">
              {side === 'jam' ? 'What are you looking for?' : 'Gig / Booking Headline'}
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
                  ? 'Looking for tight drummer + bass to write 6 songs'
                  : 'Need 1 energetic local band for 9 PM Friday slot'
              }
              className="field-control"
            />
            <div id="post-seeking-error" className="error-msg">
              <span role="img" aria-label="Error">
                ⚠
              </span>{' '}
              Describe who or what you are looking for (at least 6 characters).
            </div>
          </div>

          {side === 'gigs' && (
            <div>
              <label htmlFor="post-pay" className="mb-1 block text-xs font-semibold">
                Pay Guarantee or Door Split
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
                {side === 'jam' ? 'Gear / Practice Space' : 'Backline / PA Info'}
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
              Demo / Live Link (optional)
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
              Vibe &amp; Influences
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
              <span role="img" aria-label="Error">
                ⚠
              </span>{' '}
              Write at least 12 characters about your sound or event.
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition hover:opacity-90"
            style={{
              backgroundColor: side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
              color: side === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
            }}
          >
            <PlusCircle className="h-4 w-4" aria-hidden="true" />
            <span>Pin Flyer to {region.city}</span>
          </button>
        </form>
      </div>

      {userListings.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-display text-lg font-bold">Your Posted Cards ({userListings.length})</h3>
          <ul className="space-y-2">
            {userListings.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="font-mono-code rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase"
                      style={{
                        backgroundColor: item.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
                        color: item.side === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                      }}
                    >
                      {item.side}
                    </span>
                    <span className="font-mono-code text-xs text-[var(--muted)]">
                      {item.neighborhood}
                    </span>
                  </div>
                  <p className="font-display mt-1 truncate font-bold">{item.title}</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onPreviewListing(item)}
                    aria-label={`Preview ${item.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)]"
                  >
                    <Eye className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteListing(item.id)}
                    aria-label={`Delete ${item.title}`}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--surface-2)] text-[var(--err)]"
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
