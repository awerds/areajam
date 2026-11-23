import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ArrowLeft, ChevronRight, Send } from 'lucide-react';
import type { AppMode, Listing, MatchRecord, Region } from '../types';
import { AreaJamMark } from './BrandLogo';

interface MatchesViewProps {
  matches: MatchRecord[];
  listings: Listing[];
  regions: Region[];
  selectedMatchId: string | null;
  onSelectMatch: (matchId: string | null) => void;
  onSendMessage: (matchId: string, text: string) => void;
  onInspectListing: (listing: Listing) => void;
  onBackToDiscover: () => void;
}

const ICEBREAKERS: Record<AppMode, string[]> = {
  jam: [
    'Free to book an hour room this week?',
    'What bands or records are you listening to lately?',
    'Want me to send a quick voice memo riff?',
  ],
  gigs: [
    'Here is our live clip — what dates are open?',
    'What is the backline and load-in time?',
    'Still looking to fill that slot on the bill?',
  ],
};

export function MatchesView({
  matches,
  listings,
  regions,
  selectedMatchId,
  onSelectMatch,
  onSendMessage,
  onInspectListing,
  onBackToDiscover,
}: MatchesViewProps) {
  const [filter, setFilter] = useState<'all' | AppMode>('all');
  const [draft, setDraft] = useState('');
  const formRef = useRef<HTMLFormElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLUListElement>(null);

  const selectedMatch = matches.find((m) => m.id === selectedMatchId) ?? null;
  const selectedListing = selectedMatch
    ? listings.find((l) => l.id === selectedMatch.listingId)
    : undefined;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedMatch?.messages.length]);

  const visibleMatches = matches.filter((m) => filter === 'all' || m.side === filter);

  useLayoutEffect(() => {
    if (selectedMatch || !listRef.current) return;
    const items = listRef.current.querySelectorAll('.match-item');
    if (items.length === 0) return;

    const mm = gsap.matchMedia();
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      gsap.fromTo(
        items,
        { opacity: 0, y: 8 },
        { opacity: 1, y: 0, duration: 0.26, stagger: 0.035, ease: 'power2.out' }
      );
    });
    return () => mm.revert();
  }, [selectedMatch, filter, visibleMatches.length]);

  const submitMessage = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedMatch) return;
    const trimmed = draft.trim();
    if (!trimmed) return;
    onSendMessage(selectedMatch.id, trimmed);
    setDraft('');
  };

  const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (e.nativeEvent.isComposing || e.keyCode === 229) {
        return;
      }
      formRef.current?.requestSubmit();
    }
  };

  if (selectedMatch && selectedListing) {
    const region = regions.find((r) => r.id === selectedListing.regionId);
    const isJam = selectedListing.side === 'jam';

    return (
      <section className="glass-surface mx-auto flex h-[min(72dvh,38rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem]">
        <header className="flex items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectMatch(null)}
              aria-label="Back to matches"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h2 className="font-display truncate text-lg font-bold">{selectedListing.title}</h2>
              <p className="truncate text-xs text-[var(--muted)]">
                Simulated {isJam ? 'jam' : 'gig'} preview — {region?.city ?? selectedListing.regionId},{' '}
                {selectedListing.neighborhood}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onInspectListing(selectedListing)}
            className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)]"
          >
            View card
          </button>
        </header>

        <div className="app-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {selectedMatch.messages.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-5 text-center">
              <p className="text-sm font-medium text-[var(--ink)]">
                Simulated demo thread with {selectedListing.title} in {selectedListing.neighborhood}.
              </p>
              <p className="mt-1 text-xs text-[var(--muted)]">
                Messages stay in this browser and sample profiles send a prewritten preview reply
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                {ICEBREAKERS[selectedListing.side].map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    onClick={() => onSendMessage(selectedMatch.id, prompt)}
                    className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3.5 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--accent)] hover:bg-[var(--surface-hover)]"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            selectedMatch.messages.map((msg) => {
              const isMe = msg.sender === 'me';
              const isSimulatedReply = !isMe && (msg.isSimulated || !selectedListing.isUserCreated);
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  {isSimulatedReply && (
                    <span className="mb-1 px-1 text-[10px] font-semibold text-[var(--muted)]">
                      Simulated sample reply
                    </span>
                  )}
                  <div
                    className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      isMe
                        ? {
                            backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
                            color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                          }
                        : {
                            backgroundColor: 'var(--surface-2)',
                            color: 'var(--ink)',
                            border: '1px solid var(--border)',
                          }
                    }
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>

        <form
          ref={formRef}
          onSubmit={submitMessage}
          className="flex items-end gap-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] p-3.5"
        >
          <label htmlFor="chat-input" className="visually-hidden">
            Message {selectedListing.title}
          </label>
          <textarea
            id="chat-input"
            rows={1}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleTextareaKeyDown}
            placeholder={`Message ${selectedListing.title}...`}
            className="field-control max-h-28 min-h-11 resize-none"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            aria-label="Send message"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl transition disabled:opacity-40"
            style={{
              backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
              color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
            }}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </section>
    );
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">Matches and threads</h2>
          <p className="text-sm text-[var(--muted)]">
            Two-sided inbox for jam sessions and gig bookings
          </p>
        </div>

        <div className="glass-surface inline-flex rounded-full p-1">
          {(['all', 'jam', 'gigs'] as const).map((tab) => {
            const active = filter === tab;
            const label = tab === 'all' ? 'All' : tab === 'jam' ? 'Jam' : 'Gigs';
            return (
              <button
                key={tab}
                type="button"
                onClick={() => setFilter(tab)}
                className="rounded-full px-3.5 py-1.5 text-xs font-semibold transition"
                style={
                  active
                    ? { backgroundColor: 'var(--accent)', color: 'var(--accent-ink)' }
                    : { color: 'var(--muted)' }
                }
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {visibleMatches.length === 0 ? (
        <div className="glass-surface rounded-[2rem] px-6 py-12 text-center">
          <AreaJamMark className="mx-auto h-10 w-10" />
          <h3 className="font-display mt-3 text-lg font-bold">No matches yet</h3>
          <p className="mx-auto mt-1.5 max-w-xs text-sm text-[var(--muted)]">
            Swipe right on a musician to jam or pitch on a local gig slot to start a thread.
          </p>
          <button
            type="button"
            onClick={onBackToDiscover}
            className="mt-5 rounded-2xl bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90"
          >
            Back to swipe deck
          </button>
        </div>
      ) : (
        <ul ref={listRef} className="space-y-2.5">
          {visibleMatches.map((match) => {
            const listing = listings.find((l) => l.id === match.listingId);
            if (!listing) return null;
            const region = regions.find((r) => r.id === listing.regionId);
            const lastMsg = match.messages[match.messages.length - 1];
            const isJam = listing.side === 'jam';
            const initial = listing.title.slice(0, 1).toUpperCase();

            return (
              <li key={match.id} className="match-item">
                <button
                  type="button"
                  onClick={() => onSelectMatch(match.id)}
                  className="glass-surface flex w-full items-center gap-3.5 rounded-2xl p-4 text-left transition hover:border-[var(--border-strong)]"
                >
                  <span
                    aria-hidden="true"
                    className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                    style={{
                      backgroundColor: isJam ? 'var(--jam)' : 'var(--gigs)',
                      color: isJam ? 'var(--jam-ink)' : 'var(--gigs-ink)',
                    }}
                  >
                    {initial}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                        style={{
                          backgroundColor: isJam ? 'var(--jam-soft)' : 'var(--gigs-soft)',
                          color: isJam ? 'var(--jam-text)' : 'var(--gigs)',
                        }}
                      >
                        {isJam ? 'Jam' : 'Gigs'}
                      </span>
                      <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                        Demo thread
                      </span>
                      <span className="truncate text-xs text-[var(--muted)]">
                        {region?.city ?? listing.regionId}, {listing.neighborhood}
                      </span>
                    </div>
                    <p className="font-display mt-1 truncate text-lg font-bold">{listing.title}</p>
                    <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                      {lastMsg ? lastMsg.text : listing.seekingOrOffer}
                    </p>
                  </div>

                  <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
