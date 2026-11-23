import { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Flag,
  Flame,
  Send,
  ShieldBan,
  ShieldCheck,
  X,
} from 'lucide-react';
import { subscribeThreadMessages } from '../lib/firestorePilot';
import type {
  AuthUser,
  JamInvite,
  Listing,
  PrivateThread,
  Region,
  ThreadMessage,
} from '../types';
import { AreaJamMark } from './BrandLogo';
import type { SafetyTarget } from './SafetyDialog';

interface MatchesViewProps {
  user: AuthUser | null;
  invites: JamInvite[];
  threads: PrivateThread[];
  listings: Listing[];
  regions: Region[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string | null) => void;
  onRespondInvite: (invite: JamInvite, decision: 'accepted' | 'declined') => Promise<void>;
  onCancelInvite: (inviteId: string) => Promise<void>;
  onSendMessage: (threadId: string, text: string) => Promise<void>;
  onInspectListing: (listing: Listing) => void;
  onSafetyAction: (target: SafetyTarget) => void;
  onRequireAuth: (reason?: string) => void;
  onBackToDiscover: () => void;
}

export function MatchesView({
  user,
  invites,
  threads,
  listings,
  regions,
  selectedThreadId,
  onSelectThread,
  onRespondInvite,
  onCancelInvite,
  onSendMessage,
  onInspectListing,
  onSafetyAction,
  onRequireAuth,
  onBackToDiscover,
}: MatchesViewProps) {
  const [messages, setMessages] = useState<ThreadMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [busyInviteId, setBusyInviteId] = useState<string | null>(null);

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  useEffect(() => {
    if (!user || !selectedThread) {
      setMessages([]);
      return;
    }
    return subscribeThreadMessages(selectedThread.id, setMessages);
  }, [user?.uid, selectedThread?.id]);

  if (!user) {
    return (
      <section className="mx-auto w-full max-w-2xl">
        <div className="glass-surface space-y-4 rounded-[2rem] p-8 text-center">
          <AreaJamMark className="mx-auto h-10 w-10" />
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Jam invites &amp; private threads
          </h2>
          <p className="mx-auto max-w-md text-sm leading-relaxed text-[var(--muted)]">
            Sign in with Google or Apple to send Jam invites, accept or decline incoming requests, and open private threads with local players.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() =>
                onRequireAuth('Sign in to send and receive real Jam invites and private messages.')
              }
              className="rounded-2xl px-5 py-3 text-sm font-bold transition hover:opacity-90"
              style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
            >
              Sign in with Google or Apple
            </button>
            <button
              type="button"
              onClick={onBackToDiscover}
              className="rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-5 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              Browse players
            </button>
          </div>
        </div>
      </section>
    );
  }

  const incomingPending = invites.filter(
    (inv) => inv.status === 'pending' && inv.toUid === user.uid
  );
  const outgoingPending = invites.filter(
    (inv) => inv.status === 'pending' && inv.fromUid === user.uid
  );

  if (selectedThread) {
    const otherUid =
      selectedThread.participants.find((id) => id !== user.uid) ?? selectedThread.participants[0];
    const otherName = selectedThread.participantNames?.[otherUid] || selectedThread.profileTitle;
    const region = regions.find((r) => r.id === selectedThread.regionId);
    const linkedListing = listings.find((l) => l.id === selectedThread.profileId);
    const matchingInvite = invites.find((i) => i.threadId === selectedThread.id);

    const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const text = draft.trim();
      if (!text || sending) return;
      setSending(true);
      try {
        await onSendMessage(selectedThread.id, text);
        setDraft('');
      } finally {
        setSending(false);
      }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (e.nativeEvent.isComposing || e.keyCode === 229) return;
        e.currentTarget.form?.requestSubmit();
      }
    };

    return (
      <section className="glass-surface mx-auto flex h-[min(76dvh,42rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[2rem]">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] px-5 py-3.5">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => onSelectThread(null)}
              aria-label="Back to invites and threads"
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            </button>
            <div className="min-w-0">
              <h2 className="font-display truncate text-lg font-bold">{otherName}</h2>
              <p className="truncate text-xs text-[var(--muted)]">
                Private thread — {selectedThread.profileTitle} ({region?.city ?? selectedThread.regionId})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            {linkedListing && (
              <button
                type="button"
                onClick={() => onInspectListing(linkedListing)}
                className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold transition hover:bg-[var(--surface-hover)]"
              >
                Profile
              </button>
            )}
            <button
              type="button"
              onClick={() =>
                onSafetyAction({
                  mode: 'report',
                  targetUid: otherUid,
                  targetName: otherName,
                  targetType: 'thread',
                  targetId: selectedThread.id,
                })
              }
              aria-label={`Report ${otherName}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--muted)] transition hover:text-[var(--ink)]"
            >
              <Flag className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() =>
                onSafetyAction({
                  mode: 'block',
                  targetUid: otherUid,
                  targetName: otherName,
                  targetType: 'thread',
                  targetId: selectedThread.id,
                })
              }
              aria-label={`Block ${otherName}`}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--err)] transition hover:bg-[var(--surface-hover)]"
            >
              <ShieldBan className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        </header>

        <div className="app-scroll flex-1 space-y-3 overflow-y-auto px-5 py-4">
          {matchingInvite && (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <p className="text-[11px] font-semibold text-[var(--accent-text)]">
                Accepted jam invite from {matchingInvite.fromName}
              </p>
              <p className="mt-1 text-sm text-[var(--ink)]">&ldquo;{matchingInvite.note}&rdquo;</p>
            </div>
          )}

          {messages.length === 0 ? (
            <p className="py-6 text-center text-xs text-[var(--muted)]">
              Private 1-on-1 thread open. Say hey and set a time to play.
            </p>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderUid === user.uid;
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <span className="mb-1 px-1 text-[10px] font-semibold text-[var(--muted)]">
                    {isMe ? 'You' : msg.senderName}
                  </span>
                  <div
                    className="max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      isMe
                        ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
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
        </div>

        <form
          onSubmit={(e) => void handleSend(e)}
          className="flex items-end gap-2 border-t border-[var(--border)] bg-[var(--surface-subtle)] p-3.5"
        >
          <label htmlFor="thread-msg-input" className="visually-hidden">
            Message {otherName}
          </label>
          <textarea
            id="thread-msg-input"
            rows={1}
            maxLength={1000}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${otherName}...`}
            className="field-control max-h-28 resize-none"
          />
          <button
            type="submit"
            disabled={sending || !draft.trim()}
            aria-label="Send message"
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition disabled:opacity-45"
            style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
          >
            <Send className="h-4 w-4" aria-hidden="true" />
          </button>
        </form>
      </section>
    );
  }

  const handleInviteDecision = async (invite: JamInvite, decision: 'accepted' | 'declined') => {
    setBusyInviteId(invite.id);
    try {
      await onRespondInvite(invite, decision);
    } finally {
      setBusyInviteId(null);
    }
  };

  const handleInviteCancel = async (inviteId: string) => {
    setBusyInviteId(inviteId);
    try {
      await onCancelInvite(inviteId);
    } finally {
      setBusyInviteId(null);
    }
  };

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight">
            Invites &amp; private threads
          </h2>
          <p className="text-sm text-[var(--muted)]">
            Accept or decline jam invites. Accepted invites open one private 1-on-1 thread.
          </p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
          <ShieldCheck className="h-3.5 w-3.5 text-[var(--ok)]" aria-hidden="true" />
          <span>Signed in as {user.displayName}</span>
        </span>
      </div>

      {incomingPending.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-display text-base font-bold">
            Incoming jam invites ({incomingPending.length})
          </h3>
          <ul className="space-y-2.5">
            {incomingPending.map((inv) => {
              const region = regions.find((r) => r.id === inv.regionId);
              const busy = busyInviteId === inv.id;
              return (
                <li
                  key={inv.id}
                  className="glass-surface space-y-3 rounded-2xl p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-display text-base font-bold">{inv.fromName}</p>
                      <p className="text-xs text-[var(--muted)]">
                        Invited {inv.targetProfileTitle} ({region?.city ?? inv.regionId})
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() =>
                        onSafetyAction({
                          mode: 'block',
                          targetUid: inv.fromUid,
                          targetName: inv.fromName,
                          targetType: 'profile',
                          targetId: inv.targetProfileId,
                        })
                      }
                      className="text-xs font-semibold text-[var(--muted)] hover:text-[var(--err)]"
                    >
                      Block
                    </button>
                  </div>
                  <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2.5 text-sm text-[var(--ink)]">
                    &ldquo;{inv.note}&rdquo;
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleInviteDecision(inv, 'accepted')}
                      className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                    >
                      <Check className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>{busy ? 'Opening...' : 'Accept & open thread'}</span>
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void handleInviteDecision(inv, 'declined')}
                      className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                    >
                      <X className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Decline</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {outgoingPending.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="font-display text-base font-bold">
            Sent invites awaiting reply ({outgoingPending.length})
          </h3>
          <ul className="space-y-2.5">
            {outgoingPending.map((inv) => {
              const region = regions.find((r) => r.id === inv.regionId);
              const busy = busyInviteId === inv.id;
              return (
                <li
                  key={inv.id}
                  className="glass-surface flex flex-wrap items-center justify-between gap-3 rounded-2xl p-4"
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-display truncate text-base font-bold">
                      {inv.targetProfileTitle}
                    </p>
                    <p className="text-xs text-[var(--muted)]">
                      Pending with {inv.toName} ({region?.city ?? inv.regionId})
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--ink)]/80">
                      &ldquo;{inv.note}&rdquo;
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleInviteCancel(inv.id)}
                    className="shrink-0 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                  >
                    {busy ? 'Cancelling...' : 'Cancel invite'}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="space-y-2.5">
        <h3 className="font-display text-base font-bold">
          Private threads ({threads.length})
        </h3>
        {threads.length === 0 ? (
          <div className="glass-surface rounded-[2rem] px-6 py-10 text-center">
            <AreaJamMark className="mx-auto h-10 w-10" />
            <p className="font-display mt-3 text-lg font-bold">No private threads yet</p>
            <p className="mx-auto mt-1.5 max-w-xs text-sm text-[var(--muted)]">
              Send a Jam invite to a musician or accept an incoming request above to start talking.
            </p>
            <button
              type="button"
              onClick={onBackToDiscover}
              className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-[var(--ink)] px-5 py-2.5 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90"
            >
              <Flame className="h-4 w-4" aria-hidden="true" />
              <span>Discover musicians</span>
            </button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {threads.map((thread) => {
              const otherUid =
                thread.participants.find((id) => id !== user.uid) ?? thread.participants[0];
              const otherName = thread.participantNames?.[otherUid] || thread.profileTitle;
              const region = regions.find((r) => r.id === thread.regionId);
              const initial = otherName.slice(0, 1).toUpperCase();

              return (
                <li key={thread.id}>
                  <button
                    type="button"
                    onClick={() => onSelectThread(thread.id)}
                    className="glass-surface flex w-full items-center gap-3.5 rounded-2xl p-4 text-left transition hover:border-[var(--border-strong)]"
                  >
                    <span
                      aria-hidden="true"
                      className="font-display flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-bold"
                      style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                    >
                      {initial}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: 'var(--jam-soft)', color: 'var(--jam-text)' }}
                        >
                          Jam thread
                        </span>
                        <span className="truncate text-xs text-[var(--muted)]">
                          {region?.city ?? thread.regionId}
                        </span>
                      </div>
                      <p className="font-display mt-1 truncate text-lg font-bold">{otherName}</p>
                      <p className="mt-0.5 truncate text-sm text-[var(--muted)]">
                        {thread.lastMessageText || `Connected via ${thread.profileTitle}`}
                      </p>
                    </div>
                    <ChevronRight className="h-5 w-5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
