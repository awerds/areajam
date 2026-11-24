import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Clock,
  Flag,
  Flame,
  Inbox,
  MessageCircle,
  Search,
  Send,
  ShieldBan,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from 'lucide-react';
import { subscribeThreadMessages } from '../lib/firestorePilot';
import type {
  AuthUser,
  InboxFolder,
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
  activeFolder: InboxFolder;
  onSelectFolder: (folder: InboxFolder) => void;
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

const CHAT_STARTERS = [
  'Hey! Down to jam this week?',
  'Loved your clip — when are you free?',
  'What rehearsal spot or studio works best?',
];

function formatRelativeTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const diffSec = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  if (diffSec < 60) return 'Just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(ms);
}

function formatMessageTime(ms: number): string {
  if (!Number.isFinite(ms) || ms <= 0) return '';
  const now = new Date();
  const target = new Date(ms);
  const sameDay =
    now.getFullYear() === target.getFullYear() &&
    now.getMonth() === target.getMonth() &&
    now.getDate() === target.getDate();

  if (sameDay) {
    return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(target);
  }
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(target);
}

function resolveParticipantMeta(listings: Listing[], profileId?: string, uid?: string) {
  const listing =
    listings.find((item) => item.id === profileId) ??
    (uid ? listings.find((item) => item.ownerUid === uid && !item.isSample) : undefined);

  if (!listing) {
    return {
      listing: undefined,
      avatarUrl: undefined,
      roleLabel: undefined,
    };
  }

  const featured =
    (listing.featuredClipId
      ? listing.clips.find((c) => c.id === listing.featuredClipId)
      : undefined) ?? listing.clips[0];

  return {
    listing,
    avatarUrl: featured?.posterUrl || listing.portraitUrl,
    roleLabel: listing.subtitle || listing.roleCategory,
  };
}

interface AvatarBadgeProps {
  name: string;
  avatarUrl?: string;
  sizeClass?: string;
  shapeClass?: string;
  highlighted?: boolean;
}

function AvatarBadge({
  name,
  avatarUrl,
  sizeClass = 'h-12 w-12',
  shapeClass = 'rounded-2xl',
  highlighted = false,
}: AvatarBadgeProps) {
  const initial = (name.trim().slice(0, 1) || 'M').toUpperCase();
  const ringClass = highlighted
    ? 'ring-2 ring-[var(--jam)] ring-offset-2 ring-offset-[var(--surface-solid)]'
    : 'border border-[var(--border)]';

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        loading="lazy"
        decoding="async"
        className={`${sizeClass} ${shapeClass} ${ringClass} shrink-0 object-cover object-[50%_20%] bg-[var(--surface-2)]`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`font-display ${sizeClass} ${shapeClass} ${ringClass} flex shrink-0 items-center justify-center text-base font-bold`}
      style={{ backgroundColor: 'var(--jam-soft)', color: 'var(--jam-text)' }}
    >
      {initial}
    </span>
  );
}

export function MatchesView({
  user,
  invites,
  threads,
  listings,
  regions,
  activeFolder,
  onSelectFolder,
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
  const [searchQuery, setSearchQuery] = useState('');

  const composerRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const tabButtonRefs = useRef<Record<InboxFolder, HTMLButtonElement | null>>({
    inbox: null,
    requests: null,
    sent: null,
  });
  const panelRefs = useRef<Record<InboxFolder, HTMLDivElement | null>>({
    inbox: null,
    requests: null,
    sent: null,
  });

  const selectedThread = threads.find((t) => t.id === selectedThreadId) ?? null;

  useEffect(() => {
    if (!user || !selectedThread) {
      setMessages([]);
      return;
    }
    return subscribeThreadMessages(selectedThread.id, setMessages);
  }, [user?.uid, selectedThread?.id]);

  useEffect(() => {
    setDraft('');
  }, [selectedThread?.id]);

  useEffect(() => {
    if (!selectedThread) return;
    messagesEndRef.current?.scrollIntoView({ behavior: 'auto', block: 'end' });
  }, [selectedThread?.id, messages.length]);

  useEffect(() => {
    const cleanups: Array<() => void> = [];
    (['inbox', 'requests', 'sent'] as InboxFolder[]).forEach((folder) => {
      const panel = panelRefs.current[folder];
      if (!panel) return;
      const handleBeforeMatch = () => {
        onSelectFolder(folder);
      };
      panel.addEventListener('beforematch', handleBeforeMatch);
      cleanups.push(() => panel.removeEventListener('beforematch', handleBeforeMatch));
    });
    return () => {
      cleanups.forEach((fn) => fn());
    };
  }, [onSelectFolder]);

  useEffect(() => {
    const activeTabBtn = tabButtonRefs.current[activeFolder];
    activeTabBtn?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeFolder]);

  const incomingPending = useMemo(
    () =>
      user
        ? invites.filter((inv) => inv.status === 'pending' && inv.toUid === user.uid)
        : [],
    [invites, user]
  );

  const outgoingPending = useMemo(
    () =>
      user
        ? invites.filter((inv) => inv.status === 'pending' && inv.fromUid === user.uid)
        : [],
    [invites, user]
  );

  const outgoingResolved = useMemo(
    () =>
      user
        ? invites
            .filter(
              (inv) =>
                (inv.status === 'declined' || inv.status === 'cancelled') &&
                inv.fromUid === user.uid
            )
            .slice(0, 5)
        : [],
    [invites, user]
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredThreads = useMemo(() => {
    if (!user || !normalizedQuery) return threads;
    return threads.filter((thread) => {
      const otherUid =
        thread.participants.find((id) => id !== user.uid) ?? thread.participants[0];
      const otherName = thread.participantNames?.[otherUid] || thread.profileTitle;
      const regionCity = regions.find((r) => r.id === thread.regionId)?.city ?? thread.regionId;
      return `${otherName} ${thread.profileTitle} ${thread.lastMessageText} ${regionCity}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [threads, user, normalizedQuery, regions]);

  const filteredIncoming = useMemo(() => {
    if (!normalizedQuery) return incomingPending;
    return incomingPending.filter((inv) => {
      const regionCity = regions.find((r) => r.id === inv.regionId)?.city ?? inv.regionId;
      return `${inv.fromName} ${inv.targetProfileTitle} ${inv.note} ${regionCity}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [incomingPending, normalizedQuery, regions]);

  const filteredOutgoingPending = useMemo(() => {
    if (!normalizedQuery) return outgoingPending;
    return outgoingPending.filter((inv) => {
      const regionCity = regions.find((r) => r.id === inv.regionId)?.city ?? inv.regionId;
      return `${inv.toName} ${inv.targetProfileTitle} ${inv.note} ${regionCity}`
        .toLowerCase()
        .includes(normalizedQuery);
    });
  }, [outgoingPending, normalizedQuery, regions]);

  if (!user) {
    return (
      <section aria-label="Messages and Matches" className="mx-auto w-full max-w-3xl">
        <div className="glass-surface space-y-6 rounded-[2rem] p-6 sm:p-8">
          <div className="space-y-3 text-center">
            <AreaJamMark className="mx-auto h-10 w-10" />
            <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
              Messages &amp; Matches
            </h2>
            <p className="mx-auto max-w-lg text-sm leading-relaxed text-[var(--muted)]">
              Manage every jam connection in one familiar workspace — new matches across the top, incoming requests to review, and 1-on-1 chats in your inbox.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--jam-soft)] text-[var(--jam-text)]">
                <MessageCircle className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="font-display text-sm font-bold text-[var(--ink)]">Inbox</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                Direct 1-on-1 chats with musicians who accepted your jam invite or matched with you.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--jam-soft)] text-[var(--jam-text)]">
                <Inbox className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="font-display text-sm font-bold text-[var(--ink)]">Requests</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                Review incoming jam invites, read their note, and accept or decline in one tap.
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
              <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--jam-soft)] text-[var(--jam-text)]">
                <Send className="h-4 w-4" aria-hidden="true" />
              </div>
              <h3 className="font-display text-sm font-bold text-[var(--ink)]">Sent</h3>
              <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
                Your outbox of invites waiting for a reply, with instant cancel if plans change.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-1">
            <button
              type="button"
              onClick={() =>
                onRequireAuth('Sign in to view your Messages inbox, requests, and jam matches.')
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
              Discover musicians
            </button>
          </div>
        </div>
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

  const folderOrder: InboxFolder[] = ['inbox', 'requests', 'sent'];

  const handleTabKeyDown = (
    e: React.KeyboardEvent<HTMLButtonElement>,
    currentFolder: InboxFolder
  ) => {
    const idx = folderOrder.indexOf(currentFolder);
    let nextIdx: number | null = null;
    if (e.key === 'ArrowRight') nextIdx = (idx + 1) % folderOrder.length;
    else if (e.key === 'ArrowLeft') nextIdx = (idx - 1 + folderOrder.length) % folderOrder.length;
    else if (e.key === 'Home') nextIdx = 0;
    else if (e.key === 'End') nextIdx = folderOrder.length - 1;

    if (nextIdx === null) return;
    e.preventDefault();
    const targetFolder = folderOrder[nextIdx];
    onSelectFolder(targetFolder);
    tabButtonRefs.current[targetFolder]?.focus();
  };

  const handleSend = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedThread) return;
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

  const showMatchesRail = threads.length > 0 || incomingPending.length > 0;
  const spotlightRequest = incomingPending[0] ?? null;

  const selectedMeta = selectedThread
    ? (() => {
        const otherUid =
          selectedThread.participants.find((id) => id !== user.uid) ??
          selectedThread.participants[0];
        const otherName =
          selectedThread.participantNames?.[otherUid] || selectedThread.profileTitle;
        const region = regions.find((r) => r.id === selectedThread.regionId);
        const participantMeta = resolveParticipantMeta(listings, selectedThread.profileId, otherUid);
        const matchingInvite = invites.find((i) => i.threadId === selectedThread.id);
        return {
          otherUid,
          otherName,
          regionCity: region?.city ?? selectedThread.regionId,
          matchingInvite,
          ...participantMeta,
        };
      })()
    : null;

  return (
    <section
      aria-label="Messages and Matches"
      className="glass-surface mx-auto grid h-[min(78dvh,46rem)] min-h-[32rem] w-full max-w-[1160px] grid-cols-1 overflow-hidden rounded-[2rem] lg:grid-cols-[23.5rem_minmax(0,1fr)] xl:grid-cols-[25rem_minmax(0,1fr)]"
    >
      {/* Left pane: Matches rail + Inbox/Requests/Sent folders */}
      <div
        className={`${
          selectedThread ? 'hidden lg:flex' : 'flex'
        } min-h-0 flex-col border-[var(--border)] lg:border-r`}
      >
        {/* Top bar */}
        <div className="space-y-3 px-4 pb-3 pt-4">
          <div className="flex items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold tracking-tight text-[var(--ink)]">
              Messages
            </h2>
            <span className="inline-flex max-w-[11rem] items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0 text-[var(--ok)]" aria-hidden="true" />
              <span className="truncate">{user.displayName}</span>
            </span>
          </div>

          {(threads.length > 0 || invites.length > 0) && (
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
                aria-hidden="true"
              />
              <label htmlFor="messages-filter" className="visually-hidden">
                Search messages or requests
              </label>
              <input
                id="messages-filter"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search messages or requests..."
                className="field-control !py-2 !pl-9 !pr-9 !text-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear filter"
                  className="absolute right-1.5 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-[var(--muted)] hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                >
                  <X className="h-3.5 w-3.5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Tinder-style horizontal Matches rail */}
        {showMatchesRail && (
          <div className="pb-1">
            <div className="flex items-center justify-between px-4 pb-1.5">
              <span className="text-[11px] font-semibold text-[var(--muted)]">Matches</span>
              {threads.length > 0 && (
                <span className="text-[11px] font-medium text-[var(--muted)]">
                  {threads.length} connected
                </span>
              )}
            </div>
            <div
              aria-label="Recent matches"
              className="matches-rail no-scrollbar gap-3 px-4 py-1"
            >
              {incomingPending.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onSelectThread(null);
                    onSelectFolder('requests');
                  }}
                  style={{ scrollSnapAlign: 'start' }}
                  className="group flex w-16 shrink-0 flex-col items-center gap-1.5 text-center"
                >
                  <span
                    className="relative flex h-14 w-14 items-center justify-center rounded-2xl border-2 border-dashed transition group-hover:scale-[1.03]"
                    style={{
                      borderColor: 'var(--jam)',
                      backgroundColor: 'var(--jam-soft)',
                      color: 'var(--jam-text)',
                    }}
                  >
                    <Flame className="h-5 w-5 fill-current" aria-hidden="true" />
                    <span
                      className="absolute -right-1.5 -top-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-bold shadow"
                      style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                    >
                      {incomingPending.length}
                    </span>
                  </span>
                  <span className="w-full truncate text-[11px] font-semibold text-[var(--jam-text)]">
                    Requests
                  </span>
                </button>
              )}

              {threads.map((thread) => {
                const otherUid =
                  thread.participants.find((id) => id !== user.uid) ?? thread.participants[0];
                const otherName =
                  thread.participantNames?.[otherUid] || thread.profileTitle;
                const firstName = otherName.split(' ')[0] || otherName;
                const { avatarUrl } = resolveParticipantMeta(
                  listings,
                  thread.profileId,
                  otherUid
                );
                const isSelected = selectedThread?.id === thread.id;
                const isFreshMatch = thread.lastMessageAt === thread.createdAt;

                return (
                  <button
                    key={thread.id}
                    type="button"
                    onClick={() => {
                      onSelectFolder('inbox');
                      onSelectThread(thread.id);
                    }}
                    style={{ scrollSnapAlign: 'start' }}
                    aria-label={`Open chat with ${otherName}`}
                    className="group flex w-16 shrink-0 flex-col items-center gap-1.5 text-center transition"
                  >
                    <AvatarBadge
                      name={otherName}
                      avatarUrl={avatarUrl}
                      sizeClass="h-14 w-14"
                      shapeClass="rounded-2xl"
                      highlighted={isSelected || isFreshMatch}
                    />
                    <span
                      className={`w-full truncate text-[11px] font-semibold ${
                        isSelected ? 'text-[var(--ink)]' : 'text-[var(--muted)] group-hover:text-[var(--ink)]'
                      }`}
                    >
                      {firstName}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Accessible 3-folder tablist */}
        <div
          role="tablist"
          aria-label="Message folders"
          className="no-scrollbar flex flex-nowrap overflow-x-auto border-y border-[var(--border)] px-3"
        >
          {(
            [
              { id: 'inbox', label: 'Inbox', count: threads.length, accentCount: false },
              {
                id: 'requests',
                label: 'Requests',
                count: incomingPending.length,
                accentCount: incomingPending.length > 0,
              },
              { id: 'sent', label: 'Sent', count: outgoingPending.length, accentCount: false },
            ] as const
          ).map((tab) => {
            const isActive = activeFolder === tab.id;
            return (
              <button
                key={tab.id}
                ref={(el) => {
                  tabButtonRefs.current[tab.id] = el;
                }}
                type="button"
                role="tab"
                id={`folder-tab-${tab.id}`}
                aria-selected={isActive}
                tabIndex={isActive ? 0 : -1}
                onClick={() => onSelectFolder(tab.id)}
                onKeyDown={(e) => handleTabKeyDown(e, tab.id)}
                className="inbox-tab inline-flex shrink-0 items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold"
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className="inline-flex h-4 min-w-4 items-center justify-center rounded-full px-1.5 text-[10px] font-bold"
                    style={
                      tab.accentCount
                        ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                        : {
                            backgroundColor: 'var(--pill-bg)',
                            color: isActive ? 'var(--ink)' : 'var(--muted)',
                          }
                    }
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Folder panels grid (no padding/border/margin on role="tabpanel" itself) */}
        <div className="grid min-h-0 flex-1">
          {/* Inbox tabpanel */}
          <div
            ref={(el) => {
              panelRefs.current.inbox = el;
            }}
            role="tabpanel"
            id="folder-panel-inbox"
            aria-labelledby="folder-tab-inbox"
            hidden={activeFolder === 'inbox' ? undefined : ('until-found' as unknown as boolean)}
            tabIndex={activeFolder === 'inbox' && filteredThreads.length === 0 ? 0 : undefined}
            className="col-start-1 row-start-1 min-h-0"
          >
            <div className="app-scroll h-full overflow-y-auto p-3">
              {incomingPending.length > 0 && (
                <button
                  type="button"
                  onClick={() => onSelectFolder('requests')}
                  className="mb-2.5 flex w-full items-center justify-between gap-2 rounded-2xl border border-[var(--border)] px-3.5 py-2.5 text-left transition hover:border-[var(--border-strong)]"
                  style={{ backgroundColor: 'var(--jam-soft)', color: 'var(--jam-text)' }}
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <Flame className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
                    <span className="truncate text-xs font-bold">
                      {incomingPending.length}{' '}
                      {incomingPending.length === 1 ? 'jam request' : 'jam requests'} waiting
                    </span>
                  </div>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-xs font-bold">
                    Review
                    <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </span>
                </button>
              )}

              {filteredThreads.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center">
                  <MessageCircle className="h-7 w-7 text-[var(--muted)]" aria-hidden="true" />
                  <p className="font-display mt-3 text-base font-bold text-[var(--ink)]">
                    {normalizedQuery ? 'No matching chats' : 'Your inbox is quiet'}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--muted)]">
                    {normalizedQuery
                      ? `Nothing matches "${searchQuery.trim()}". Try clearing your search.`
                      : 'Once someone accepts your jam invite — or you accept theirs — your direct chat appears here.'}
                  </p>
                  {!normalizedQuery && (
                    <button
                      type="button"
                      onClick={onBackToDiscover}
                      className="mt-4 inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition hover:opacity-90"
                      style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                    >
                      <Flame className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                      <span>Discover musicians</span>
                    </button>
                  )}
                </div>
              ) : (
                <ul className="space-y-1.5">
                  {filteredThreads.map((thread) => {
                    const otherUid =
                      thread.participants.find((id) => id !== user.uid) ?? thread.participants[0];
                    const otherName =
                      thread.participantNames?.[otherUid] || thread.profileTitle;
                    const region = regions.find((r) => r.id === thread.regionId);
                    const { avatarUrl } = resolveParticipantMeta(
                      listings,
                      thread.profileId,
                      otherUid
                    );
                    const isSelected = selectedThread?.id === thread.id;
                    const isFreshMatch = thread.lastMessageAt === thread.createdAt;
                    const timeLabel = formatRelativeTime(thread.lastMessageAt);

                    return (
                      <li key={thread.id}>
                        <button
                          type="button"
                          onClick={() => onSelectThread(thread.id)}
                          aria-current={isSelected ? 'true' : undefined}
                          className={`flex w-full items-center gap-3 rounded-2xl border p-3 text-left transition ${
                            isSelected
                              ? 'border-[var(--border-strong)] bg-[var(--surface-hover)] shadow-sm'
                              : 'border-transparent hover:border-[var(--border)] hover:bg-[var(--surface-subtle)]'
                          }`}
                        >
                          <AvatarBadge
                            name={otherName}
                            avatarUrl={avatarUrl}
                            sizeClass="h-12 w-12"
                            shapeClass="rounded-2xl"
                            highlighted={isFreshMatch}
                          />

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="font-display truncate text-sm font-bold text-[var(--ink)]">
                                {otherName}
                              </p>
                              <span className="shrink-0 text-[11px] font-medium text-[var(--muted)]">
                                {timeLabel}
                              </span>
                            </div>

                            <p className="mt-0.5 truncate text-xs text-[var(--muted)]">
                              {isFreshMatch
                                ? `New match: "${thread.lastMessageText}"`
                                : thread.lastMessageText || `Connected via ${thread.profileTitle}`}
                            </p>

                            <div className="mt-1 flex items-center gap-1.5">
                              {isFreshMatch && (
                                <span
                                  className="rounded-full px-1.5 py-0.5 text-[10px] font-bold"
                                  style={{
                                    backgroundColor: 'var(--jam-soft)',
                                    color: 'var(--jam-text)',
                                  }}
                                >
                                  New match
                                </span>
                              )}
                              <span className="truncate text-[11px] text-[var(--muted)]/85">
                                {region?.city ?? thread.regionId}
                              </span>
                            </div>
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Requests tabpanel (incoming invites) */}
          <div
            ref={(el) => {
              panelRefs.current.requests = el;
            }}
            role="tabpanel"
            id="folder-panel-requests"
            aria-labelledby="folder-tab-requests"
            hidden={activeFolder === 'requests' ? undefined : ('until-found' as unknown as boolean)}
            tabIndex={activeFolder === 'requests' && filteredIncoming.length === 0 ? 0 : undefined}
            className="col-start-1 row-start-1 min-h-0"
          >
            <div className="app-scroll h-full overflow-y-auto p-3">
              <p className="px-1 pb-2.5 text-xs text-[var(--muted)]">
                Incoming jam requests. Accept to move them into your Inbox.
              </p>

              {filteredIncoming.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center">
                  <Inbox className="h-7 w-7 text-[var(--muted)]" aria-hidden="true" />
                  <p className="font-display mt-3 text-base font-bold text-[var(--ink)]">
                    {normalizedQuery ? 'No matching requests' : 'No pending requests'}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--muted)]">
                    {normalizedQuery
                      ? `No incoming requests match "${searchQuery.trim()}".`
                      : 'When local players invite you to jam, you can review their note and accept or decline here.'}
                  </p>
                </div>
              ) : (
                <ul className="space-y-2.5">
                  {filteredIncoming.map((inv) => {
                    const region = regions.find((r) => r.id === inv.regionId);
                    const busy = busyInviteId === inv.id;
                    const { listing: senderListing, avatarUrl } = resolveParticipantMeta(
                      listings,
                      undefined,
                      inv.fromUid
                    );

                    return (
                      <li
                        key={inv.id}
                        className="space-y-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5"
                      >
                        <div className="flex items-start gap-3">
                          <AvatarBadge
                            name={inv.fromName}
                            avatarUrl={avatarUrl}
                            sizeClass="h-11 w-11"
                            shapeClass="rounded-2xl"
                            highlighted
                          />
                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <p className="font-display truncate text-sm font-bold text-[var(--ink)]">
                                {inv.fromName}
                              </p>
                              <span className="shrink-0 text-[11px] font-medium text-[var(--muted)]">
                                {formatRelativeTime(inv.updatedAt)}
                              </span>
                            </div>
                            <p className="truncate text-xs text-[var(--muted)]">
                              Invited {inv.targetProfileTitle} ({region?.city ?? inv.regionId})
                            </p>
                          </div>
                        </div>

                        <p className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2 text-xs leading-relaxed text-[var(--ink)]">
                          &ldquo;{inv.note}&rdquo;
                        </p>

                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleInviteDecision(inv, 'accepted')}
                            className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold transition hover:opacity-90 disabled:opacity-50"
                            style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                          >
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>{busy ? 'Opening...' : 'Accept & chat'}</span>
                          </button>
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => void handleInviteDecision(inv, 'declined')}
                            className="inline-flex items-center justify-center gap-1 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-2 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                          >
                            <X className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Decline</span>
                          </button>
                          {senderListing && (
                            <button
                              type="button"
                              onClick={() => onInspectListing(senderListing)}
                              aria-label={`View ${inv.fromName} profile`}
                              className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] p-2 text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                            >
                              <UserRound className="h-3.5 w-3.5" aria-hidden="true" />
                            </button>
                          )}
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
                            aria-label={`Block ${inv.fromName}`}
                            className="inline-flex items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] p-2 text-[var(--muted)] transition hover:text-[var(--err)]"
                          >
                            <ShieldBan className="h-3.5 w-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>

          {/* Sent tabpanel (outbox) */}
          <div
            ref={(el) => {
              panelRefs.current.sent = el;
            }}
            role="tabpanel"
            id="folder-panel-sent"
            aria-labelledby="folder-tab-sent"
            hidden={activeFolder === 'sent' ? undefined : ('until-found' as unknown as boolean)}
            tabIndex={
              activeFolder === 'sent' &&
              filteredOutgoingPending.length === 0 &&
              outgoingResolved.length === 0
                ? 0
                : undefined
            }
            className="col-start-1 row-start-1 min-h-0"
          >
            <div className="app-scroll h-full overflow-y-auto p-3">
              <p className="px-1 pb-2.5 text-xs text-[var(--muted)]">
                Outbox of jam requests waiting for a reply.
              </p>

              {filteredOutgoingPending.length === 0 && outgoingResolved.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[var(--border)] px-5 py-10 text-center">
                  <Send className="h-7 w-7 text-[var(--muted)]" aria-hidden="true" />
                  <p className="font-display mt-3 text-base font-bold text-[var(--ink)]">
                    {normalizedQuery ? 'No matching sent invites' : 'Nothing in your outbox'}
                  </p>
                  <p className="mt-1 max-w-xs text-xs leading-relaxed text-[var(--muted)]">
                    {normalizedQuery
                      ? `No sent requests match "${searchQuery.trim()}".`
                      : 'Invites you send appear here until the player accepts and moves into Inbox.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredOutgoingPending.length > 0 && (
                    <ul className="space-y-2.5">
                      {filteredOutgoingPending.map((inv) => {
                        const region = regions.find((r) => r.id === inv.regionId);
                        const busy = busyInviteId === inv.id;
                        const { listing: targetListing, avatarUrl } = resolveParticipantMeta(
                          listings,
                          inv.targetProfileId,
                          inv.toUid
                        );

                        return (
                          <li
                            key={inv.id}
                            className="space-y-2.5 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5"
                          >
                            <div className="flex items-start gap-3">
                              <AvatarBadge
                                name={inv.targetProfileTitle || inv.toName}
                                avatarUrl={avatarUrl}
                                sizeClass="h-11 w-11"
                                shapeClass="rounded-2xl"
                              />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-baseline justify-between gap-2">
                                  <p className="font-display truncate text-sm font-bold text-[var(--ink)]">
                                    {inv.targetProfileTitle}
                                  </p>
                                  <span className="shrink-0 text-[11px] font-medium text-[var(--muted)]">
                                    {formatRelativeTime(inv.updatedAt)}
                                  </span>
                                </div>
                                <p className="truncate text-xs text-[var(--muted)]">
                                  To {inv.toName} ({region?.city ?? inv.regionId})
                                </p>
                              </div>
                            </div>

                            <p className="line-clamp-2 text-xs leading-relaxed text-[var(--ink)]/85">
                              You: &ldquo;{inv.note}&rdquo;
                            </p>

                            <div className="flex items-center justify-between gap-2 pt-0.5">
                              <span className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1 text-[11px] font-semibold text-[var(--muted)]">
                                <Clock className="h-3 w-3" aria-hidden="true" />
                                <span>Pending reply</span>
                              </span>

                              <div className="flex items-center gap-1.5">
                                {targetListing && (
                                  <button
                                    type="button"
                                    onClick={() => onInspectListing(targetListing)}
                                    className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                                  >
                                    Profile
                                  </button>
                                )}
                                <button
                                  type="button"
                                  disabled={busy}
                                  onClick={() => void handleInviteCancel(inv.id)}
                                  className="rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-2.5 py-1.5 text-xs font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--err)] disabled:opacity-50"
                                >
                                  {busy ? 'Cancelling...' : 'Cancel'}
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}

                  {!normalizedQuery && outgoingResolved.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <p className="px-1 text-[11px] font-semibold text-[var(--muted)]">Earlier</p>
                      <ul className="space-y-1.5">
                        {outgoingResolved.map((inv) => (
                          <li
                            key={inv.id}
                            className="flex items-center justify-between gap-2 rounded-xl border border-[var(--border)] px-3 py-2 text-xs opacity-75"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[var(--ink)]">
                                {inv.targetProfileTitle}
                              </p>
                              <p className="truncate text-[11px] text-[var(--muted)]">
                                {inv.toName}
                              </p>
                            </div>
                            <span className="shrink-0 rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-2 py-0.5 text-[10px] font-semibold text-[var(--muted)]">
                              {inv.status === 'declined' ? 'Declined' : 'Cancelled'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Right pane: Active thread chat OR Desktop guidance stage */}
      {selectedThread && selectedMeta ? (
        <div className="flex min-h-0 flex-col bg-[var(--surface-subtle)]">
          {/* Conversation header */}
          <header className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border)] bg-[var(--surface-solid)] px-4 py-3 sm:px-5">
            <div className="flex min-w-0 items-center gap-3">
              <button
                type="button"
                onClick={() => onSelectThread(null)}
                aria-label="Back to Messages"
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--ink)] transition hover:bg-[var(--surface-hover)] lg:hidden"
              >
                <ArrowLeft className="h-4 w-4" aria-hidden="true" />
              </button>

              <AvatarBadge
                name={selectedMeta.otherName}
                avatarUrl={selectedMeta.avatarUrl}
                sizeClass="h-10 w-10"
                shapeClass="rounded-2xl"
              />

              <div className="min-w-0">
                <h2 className="font-display truncate text-base font-bold text-[var(--ink)] sm:text-lg">
                  {selectedMeta.otherName}
                </h2>
                <p className="truncate text-xs text-[var(--muted)]">
                  {selectedThread.profileTitle} ({selectedMeta.regionCity})
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {selectedMeta.listing && (
                <button
                  type="button"
                  onClick={() => onInspectListing(selectedMeta.listing!)}
                  className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
                >
                  Profile
                </button>
              )}
              <button
                type="button"
                onClick={() =>
                  onSafetyAction({
                    mode: 'report',
                    targetUid: selectedMeta.otherUid,
                    targetName: selectedMeta.otherName,
                    targetType: 'thread',
                    targetId: selectedThread.id,
                  })
                }
                aria-label={`Report ${selectedMeta.otherName}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--muted)] transition hover:text-[var(--ink)]"
              >
                <Flag className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() =>
                  onSafetyAction({
                    mode: 'block',
                    targetUid: selectedMeta.otherUid,
                    targetName: selectedMeta.otherName,
                    targetType: 'thread',
                    targetId: selectedThread.id,
                  })
                }
                aria-label={`Block ${selectedMeta.otherName}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--pill-bg)] text-[var(--err)] transition hover:bg-[var(--surface-hover)]"
              >
                <ShieldBan className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </header>

          {/* Messages timeline */}
          <div className="app-scroll flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-5">
            <div className="mx-auto max-w-md rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-center">
              <p className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--accent-text)]">
                <Sparkles className="h-3 w-3" aria-hidden="true" />
                <span>
                  {selectedMeta.matchingInvite
                    ? `You matched via ${selectedMeta.matchingInvite.fromName}'s jam invite`
                    : `Connected via ${selectedThread.profileTitle}`}
                </span>
              </p>
              {selectedMeta.matchingInvite?.note && (
                <p className="mt-1.5 text-xs leading-relaxed text-[var(--ink)]">
                  &ldquo;{selectedMeta.matchingInvite.note}&rdquo;
                </p>
              )}
              <p className="mt-1 text-[10px] text-[var(--muted)]">
                {formatMessageTime(selectedMeta.matchingInvite?.createdAt ?? selectedThread.createdAt)}
              </p>
            </div>

            {messages.length === 0 ? (
              <div className="space-y-3 pt-4 text-center">
                <p className="text-xs text-[var(--muted)]">
                  Break the ice and lock in a jam time.
                </p>
                <div className="flex flex-wrap justify-center gap-1.5">
                  {CHAT_STARTERS.map((starter) => (
                    <button
                      key={starter}
                      type="button"
                      onClick={() => {
                        setDraft(starter);
                        composerRef.current?.focus();
                      }}
                      className="rounded-full border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs font-medium text-[var(--ink)] transition hover:border-[var(--border-strong)] hover:bg-[var(--surface-hover)]"
                    >
                      {starter}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderUid === user.uid;
                const prev = idx > 0 ? messages[idx - 1] : null;
                const showSenderLabel =
                  !prev ||
                  prev.senderUid !== msg.senderUid ||
                  msg.sentAt - prev.sentAt > 5 * 60 * 1000;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    {showSenderLabel && (
                      <span className="mb-1 px-1 text-[10px] font-semibold text-[var(--muted)]">
                        {isMe ? 'You' : msg.senderName} ({formatMessageTime(msg.sentAt)})
                      </span>
                    )}
                    <div
                      className={`max-w-[82%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        isMe ? 'rounded-br-sm' : 'rounded-bl-sm'
                      }`}
                      style={
                        isMe
                          ? { backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }
                          : {
                              backgroundColor: 'var(--surface-solid)',
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
            <div ref={messagesEndRef} />
          </div>

          {/* IME-safe auto-growing composer */}
          <form
            onSubmit={(e) => void handleSend(e)}
            className="flex items-end gap-2 border-t border-[var(--border)] bg-[var(--surface-solid)] p-3.5"
          >
            <label htmlFor="thread-msg-input" className="visually-hidden">
              Message {selectedMeta.otherName}
            </label>
            <textarea
              ref={composerRef}
              id="thread-msg-input"
              rows={1}
              maxLength={1000}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Message ${selectedMeta.otherName}...`}
              className="field-control chat-composer-input"
            />
            <button
              type="submit"
              disabled={sending || !draft.trim()}
              aria-label="Send message"
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition hover:opacity-90 disabled:opacity-45"
              style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
            >
              <Send className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </div>
      ) : (
        <div className="hidden min-h-0 flex-col items-center justify-center bg-[var(--surface-subtle)] p-8 text-center lg:flex">
          {activeFolder === 'requests' && spotlightRequest ? (
            <div className="w-full max-w-md space-y-4 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 text-left shadow-sm">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold"
                  style={{ backgroundColor: 'var(--jam-soft)', color: 'var(--jam-text)' }}
                >
                  <Flame className="h-3 w-3 fill-current" aria-hidden="true" />
                  <span>Incoming jam request</span>
                </span>
                <span className="text-xs text-[var(--muted)]">
                  {formatRelativeTime(spotlightRequest.updatedAt)}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <AvatarBadge
                  name={spotlightRequest.fromName}
                  avatarUrl={
                    resolveParticipantMeta(listings, undefined, spotlightRequest.fromUid).avatarUrl
                  }
                  sizeClass="h-14 w-14"
                  shapeClass="rounded-2xl"
                  highlighted
                />
                <div className="min-w-0">
                  <h3 className="font-display truncate text-lg font-bold text-[var(--ink)]">
                    {spotlightRequest.fromName}
                  </h3>
                  <p className="truncate text-xs text-[var(--muted)]">
                    For {spotlightRequest.targetProfileTitle} (
                    {regions.find((r) => r.id === spotlightRequest.regionId)?.city ??
                      spotlightRequest.regionId}
                    )
                  </p>
                </div>
              </div>

              <p className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm leading-relaxed text-[var(--ink)]">
                &ldquo;{spotlightRequest.note}&rdquo;
              </p>

              <div className="flex gap-2.5">
                <button
                  type="button"
                  disabled={busyInviteId === spotlightRequest.id}
                  onClick={() => void handleInviteDecision(spotlightRequest, 'accepted')}
                  className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-2xl px-4 py-3 text-sm font-bold transition hover:opacity-90 disabled:opacity-50"
                  style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                >
                  <Check className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {busyInviteId === spotlightRequest.id ? 'Opening...' : 'Accept & start chat'}
                  </span>
                </button>
                <button
                  type="button"
                  disabled={busyInviteId === spotlightRequest.id}
                  onClick={() => void handleInviteDecision(spotlightRequest, 'declined')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--muted)] transition hover:bg-[var(--surface-hover)] hover:text-[var(--ink)]"
                >
                  <X className="h-4 w-4" aria-hidden="true" />
                  <span>Decline</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="max-w-sm space-y-4">
              <AreaJamMark className="mx-auto h-11 w-11" />
              <h3 className="font-display text-xl font-bold text-[var(--ink)]">
                {threads.length > 0 ? 'Select a conversation' : 'Welcome to your Messages inbox'}
              </h3>
              <p className="text-xs leading-relaxed text-[var(--muted)]">
                Pick a match from the rail or switch between Inbox, Requests, and Sent on the left.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-1">
                <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  {threads.length} Inbox
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  {incomingPending.length} Requests
                </span>
                <span className="rounded-full border border-[var(--border)] bg-[var(--pill-bg)] px-3 py-1 text-xs font-semibold text-[var(--muted)]">
                  {outgoingPending.length} Sent
                </span>
              </div>
              <div className="pt-2">
                {threads.length > 0 ? (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectFolder('inbox');
                      onSelectThread(threads[0].id);
                    }}
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                  >
                    <MessageCircle className="h-4 w-4" aria-hidden="true" />
                    <span>Open latest chat</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={onBackToDiscover}
                    className="inline-flex items-center gap-2 rounded-2xl px-5 py-2.5 text-sm font-bold transition hover:opacity-90"
                    style={{ backgroundColor: 'var(--jam)', color: 'var(--jam-ink)' }}
                  >
                    <Flame className="h-4 w-4 fill-current" aria-hidden="true" />
                    <span>Discover musicians</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
