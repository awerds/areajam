import type {
  AuthUser,
  BlockedUser,
  GearItem,
  JamInvite,
  Listing,
  MediaClip,
  PrivateThread,
  Region,
  ReportReason,
  ThreadMessage,
  WallComment,
} from '../types';
import { getFirestoreDb } from './firebaseApp';
import { sanitizeInstagramHandle } from './embedMedia';

export function pairIdFor(uidA: string, uidB: string): string {
  return uidA < uidB ? `${uidA}__${uidB}` : `${uidB}__${uidA}`;
}

export type ProfileActionState =
  | { kind: 'unavailable'; label: string }
  | { kind: 'self'; label: string }
  | { kind: 'accepted'; label: string; invite: JamInvite }
  | { kind: 'incoming'; label: string; invite: JamInvite }
  | { kind: 'sent'; label: string; invite: JamInvite }
  | { kind: 'invite'; label: string; invite?: JamInvite };

export function getProfileActionState(
  listing: Listing,
  currentUserUid?: string,
  inviteByTargetUid?: Record<string, JamInvite>
): ProfileActionState {
  if (!listing.ownerUid) {
    return { kind: 'unavailable', label: 'Unavailable' };
  }
  if (currentUserUid && listing.ownerUid === currentUserUid) {
    return { kind: 'self', label: 'Your profile' };
  }
  const invite = inviteByTargetUid?.[listing.ownerUid];
  if (invite?.status === 'accepted') {
    return { kind: 'accepted', label: 'Message', invite };
  }
  if (invite?.status === 'pending') {
    if (invite.toUid === currentUserUid) {
      return { kind: 'incoming', label: 'Review request', invite };
    }
    return { kind: 'sent', label: 'Request sent', invite };
  }
  return { kind: 'invite', label: 'Invite to jam', invite };
}

export function sortedParticipants(uidA: string, uidB: string): [string, string] {
  return uidA < uidB ? [uidA, uidB] : [uidB, uidA];
}

function cleanClip(clip: MediaClip): MediaClip {
  const base: MediaClip = {
    id: clip.id,
    title: clip.title.trim().slice(0, 64) || 'Linked clip',
    kind: clip.kind,
    durationSec: Number.isFinite(clip.durationSec) ? Math.max(1, Math.round(clip.durationSec)) : 15,
  };
  if (clip.embedUrl) base.embedUrl = clip.embedUrl;
  if (clip.embedProvider) base.embedProvider = clip.embedProvider;
  if (clip.mediaId) base.mediaId = clip.mediaId;
  if (typeof clip.clipVariation === 'number') base.clipVariation = clip.clipVariation;
  return base;
}

function cleanGearItem(item: GearItem): GearItem {
  const cleaned: GearItem = {
    id: item.id,
    category: item.category,
    name: item.name.trim().slice(0, 60),
  };
  const notes = item.notes?.trim().slice(0, 60);
  if (notes) cleaned.notes = notes;
  return cleaned;
}

function normalizeRemoteProfile(id: string, data: Record<string, unknown>): Listing {
  const rawClips = Array.isArray(data.clips) ? (data.clips as MediaClip[]) : [];
  const rawGear = Array.isArray(data.gearLocker) ? (data.gearLocker as GearItem[]) : [];
  const rawStyle = (data.profileStyle as Record<string, unknown> | undefined) ?? {};

  return {
    id,
    side: data.side === 'gigs' ? 'gigs' : 'jam',
    roleCategory: typeof data.roleCategory === 'string' ? data.roleCategory : 'Songwriters',
    instruments: Array.isArray(data.instruments)
      ? (data.instruments as Listing['instruments'])
      : ['guitar'],
    regionId: typeof data.regionId === 'string' ? data.regionId : 'nashville',
    regionLabel: typeof data.regionLabel === 'string' ? data.regionLabel : undefined,
    regionState: typeof data.regionState === 'string' ? data.regionState : undefined,
    neighborhood: typeof data.neighborhood === 'string' ? data.neighborhood : '',
    title: typeof data.title === 'string' ? data.title : 'Musician',
    subtitle: typeof data.subtitle === 'string' ? data.subtitle : '',
    seekingOrOffer: typeof data.seekingOrOffer === 'string' ? data.seekingOrOffer : '',
    genres: Array.isArray(data.genres) ? (data.genres as string[]) : ['Indie'],
    tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
    bio: typeof data.bio === 'string' ? data.bio : '',
    gearOrBackline: typeof data.gearOrBackline === 'string' ? data.gearOrBackline : '',
    gearLocker: rawGear,
    availability: typeof data.availability === 'string' ? data.availability : 'Flexible',
    instagramHandle:
      typeof data.instagramHandle === 'string' ? data.instagramHandle : undefined,
    sampleLink: typeof data.sampleLink === 'string' ? data.sampleLink : undefined,
    visualSeed: typeof data.visualSeed === 'number' ? Math.trunc(data.visualSeed) : 17,
    clips:
      rawClips.length > 0
        ? rawClips
        : [{ id: `${id}-c1`, title: 'Intro reel', kind: 'synth-reel', durationSec: 8 }],
    featuredClipId: typeof data.featuredClipId === 'string' ? data.featuredClipId : undefined,
    profileStyle: {
      themeId:
        typeof rawStyle.themeId === 'string'
          ? (rawStyle.themeId as Listing['profileStyle']['themeId'])
          : 'stage-coral',
      moodStatus: typeof rawStyle.moodStatus === 'string' ? rawStyle.moodStatus : undefined,
      soundsLike: Array.isArray(rawStyle.soundsLike) ? (rawStyle.soundsLike as string[]) : [],
      bannerPattern:
        typeof rawStyle.bannerPattern === 'string'
          ? (rawStyle.bannerPattern as Listing['profileStyle']['bannerPattern'])
          : 'waves',
    },
    isPublished: data.isPublished !== false,
    isUserCreated: true,
    ownerUid: typeof data.ownerUid === 'string' ? data.ownerUid : undefined,
    ownerName: typeof data.ownerName === 'string' ? data.ownerName : undefined,
    createdAt: typeof data.createdAt === 'number' ? Math.trunc(data.createdAt) : Date.now(),
    updatedAt: typeof data.updatedAt === 'number' ? Math.trunc(data.updatedAt) : undefined,
  };
}

function serializeProfileDoc(listing: Listing, user: AuthUser, region?: Region): Record<string, unknown> {
  const now = Math.floor(Date.now());
  const createdAt = Math.floor(listing.createdAt || now);
  const updatedAt = Math.max(createdAt, now);

  const profileStyle: Record<string, unknown> = {
    themeId: listing.profileStyle?.themeId || 'stage-coral',
    soundsLike: (listing.profileStyle?.soundsLike ?? []).slice(0, 6),
    bannerPattern: listing.profileStyle?.bannerPattern || 'waves',
  };
  const moodStatus = listing.profileStyle?.moodStatus?.trim().slice(0, 100);
  if (moodStatus) profileStyle.moodStatus = moodStatus;

  const docData: Record<string, unknown> = {
    id: listing.id,
    ownerUid: user.uid,
    ownerName: user.displayName.trim().slice(0, 64) || 'Musician',
    side: listing.side,
    roleCategory: listing.roleCategory.slice(0, 48),
    instruments: listing.instruments.slice(0, 6),
    regionId: listing.regionId.slice(0, 64),
    neighborhood: listing.neighborhood.trim().slice(0, 48),
    title: listing.title.trim().slice(0, 64),
    subtitle: listing.subtitle.trim().slice(0, 64),
    seekingOrOffer: listing.seekingOrOffer.trim().slice(0, 140),
    genres: listing.genres.slice(0, 4),
    tags: listing.tags.slice(0, 6),
    bio: listing.bio.trim().slice(0, 600),
    gearOrBackline: (listing.gearOrBackline || 'Details on match').trim().slice(0, 400),
    gearLocker: listing.gearLocker.slice(0, 20).map(cleanGearItem),
    availability: (listing.availability || 'Flexible evenings').trim().slice(0, 80),
    clips: listing.clips.slice(0, 4).map(cleanClip),
    profileStyle,
    visualSeed: Math.trunc(listing.visualSeed || 17),
    isPublished: true,
    createdAt,
    updatedAt,
  };

  const regionLabel = (listing.regionLabel || region?.label || '').trim().slice(0, 80);
  if (regionLabel) docData.regionLabel = regionLabel;

  const regionState = (listing.regionState || region?.state || '').trim().slice(0, 16);
  if (regionState) docData.regionState = regionState;

  const ig = sanitizeInstagramHandle(listing.instagramHandle);
  if (ig) docData.instagramHandle = ig;

  const sampleLink = listing.sampleLink?.trim().slice(0, 200);
  if (sampleLink) docData.sampleLink = sampleLink;

  const featuredClipId = listing.featuredClipId?.trim().slice(0, 80);
  if (featuredClipId) docData.featuredClipId = featuredClipId;

  return docData;
}

export function subscribePublishedProfiles(
  onData: (profiles: Listing[]) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false;
  let unsub: (() => void) | undefined;

  (async () => {
    try {
      const db = await getFirestoreDb();
      const { collection, limit, onSnapshot, query, where } = await import(
        'firebase/firestore'
      );
      if (cancelled) return;
      const q = query(
        collection(db, 'profiles'),
        where('isPublished', '==', true),
        limit(200)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs
            .map((d) => normalizeRemoteProfile(d.id, d.data()))
            .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
          onData(list);
        },
        (err) => {
          onError?.(err);
        }
      );
    } catch (err) {
      if (!cancelled) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function fetchProfileById(profileId: string): Promise<Listing | null> {
  try {
    const db = await getFirestoreDb();
    const { doc, getDoc } = await import('firebase/firestore');
    const snap = await getDoc(doc(db, 'profiles', profileId));
    if (!snap.exists()) return null;
    return normalizeRemoteProfile(snap.id, snap.data());
  } catch {
    return null;
  }
}

export async function saveSharedProfile(
  listing: Listing,
  user: AuthUser,
  region?: Region
): Promise<Listing> {
  const db = await getFirestoreDb();
  const { doc, setDoc } = await import('firebase/firestore');
  const payload = serializeProfileDoc(listing, user, region);
  await setDoc(doc(db, 'profiles', listing.id), payload);
  return normalizeRemoteProfile(listing.id, payload);
}

export async function deleteSharedProfile(profileId: string): Promise<void> {
  const db = await getFirestoreDb();
  const { deleteDoc, doc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'profiles', profileId));
}

export function subscribeProfileWallNotes(
  profileId: string,
  onData: (notes: WallComment[]) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false;
  let unsub: (() => void) | undefined;

  (async () => {
    try {
      const db = await getFirestoreDb();
      const { collection, limit, onSnapshot, orderBy, query } = await import(
        'firebase/firestore'
      );
      if (cancelled) return;
      const q = query(
        collection(db, 'profiles', profileId, 'wallNotes'),
        orderBy('createdAt', 'asc'),
        limit(100)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const notes: WallComment[] = snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              authorName: typeof data.authorName === 'string' ? data.authorName : 'Musician',
              authorUid: typeof data.authorUid === 'string' ? data.authorUid : undefined,
              text: typeof data.text === 'string' ? data.text : '',
              createdAt: typeof data.createdAt === 'number' ? data.createdAt : Date.now(),
            };
          });
          onData(notes);
        },
        (err) => onError?.(err)
      );
    } catch (err) {
      if (!cancelled) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function addProfileWallNote(
  profileId: string,
  user: AuthUser,
  text: string
): Promise<void> {
  const db = await getFirestoreDb();
  const { addDoc, collection } = await import('firebase/firestore');
  await addDoc(collection(db, 'profiles', profileId, 'wallNotes'), {
    authorUid: user.uid,
    authorName: user.displayName.trim().slice(0, 64) || 'Musician',
    text: text.trim().slice(0, 280),
    createdAt: Math.floor(Date.now()),
  });
}

export async function deleteProfileWallNote(profileId: string, noteId: string): Promise<void> {
  const db = await getFirestoreDb();
  const { deleteDoc, doc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'profiles', profileId, 'wallNotes', noteId));
}

export function buildThreadFromInvite(
  invite: JamInvite,
  currentUser?: AuthUser,
  overrideTimeMs?: number
): PrivateThread {
  const fromName =
    currentUser && currentUser.uid === invite.fromUid
      ? currentUser.displayName.trim().slice(0, 64) || invite.fromName
      : invite.fromName.trim().slice(0, 64) || 'Musician';
  const toName =
    currentUser && currentUser.uid === invite.toUid
      ? currentUser.displayName.trim().slice(0, 64) || invite.toName
      : invite.toName.trim().slice(0, 64) || 'Musician';
  const timestamp = Math.floor(overrideTimeMs ?? invite.updatedAt ?? invite.createdAt ?? Date.now());
  const createdAt = Math.floor(overrideTimeMs ?? invite.createdAt ?? timestamp);

  return {
    id: invite.threadId,
    participants: sortedParticipants(invite.participants[0], invite.participants[1]),
    participantNames: {
      [invite.fromUid]: fromName,
      [invite.toUid]: toName,
    },
    profileId: invite.targetProfileId.slice(0, 128),
    profileTitle: invite.targetProfileTitle.slice(0, 128),
    regionId: invite.regionId.slice(0, 64),
    lastMessageText: invite.note.slice(0, 500),
    lastMessageAt: timestamp,
    createdAt,
  };
}

function serializeThreadDoc(thread: PrivateThread): Omit<PrivateThread, 'id'> {
  return {
    participants: thread.participants,
    participantNames: thread.participantNames,
    profileId: thread.profileId,
    profileTitle: thread.profileTitle,
    regionId: thread.regionId,
    lastMessageText: thread.lastMessageText,
    lastMessageAt: Math.floor(thread.lastMessageAt),
    createdAt: Math.floor(thread.createdAt),
  };
}

export async function ensureThreadForAcceptedInvite(
  invite: JamInvite,
  currentUser: AuthUser
): Promise<PrivateThread> {
  const db = await getFirestoreDb();
  const { doc, getDoc, setDoc } = await import('firebase/firestore');
  const threadRef = doc(db, 'threads', invite.threadId);
  const built = buildThreadFromInvite(invite, currentUser);

  try {
    await setDoc(threadRef, serializeThreadDoc(built));
    return built;
  } catch (err) {
    const snap = await getDoc(threadRef);
    if (snap.exists()) {
      return {
        id: snap.id,
        ...(snap.data() as Omit<PrivateThread, 'id'>),
      };
    }
    throw err;
  }
}

export function subscribeMyInvites(
  uid: string,
  onData: (invites: JamInvite[]) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false;
  let unsub: (() => void) | undefined;

  (async () => {
    try {
      const db = await getFirestoreDb();
      const { collection, onSnapshot, query, where } = await import(
        'firebase/firestore'
      );
      if (cancelled) return;
      const q = query(
        collection(db, 'jamInvites'),
        where('participants', 'array-contains', uid)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<JamInvite, 'id'>),
            }))
            .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0));
          onData(items);
        },
        (err) => onError?.(err)
      );
    } catch (err) {
      if (!cancelled) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function sendJamInvite(params: {
  fromUser: AuthUser;
  targetListing: Listing;
  note: string;
  existingInvite?: JamInvite;
}): Promise<'sent' | 'already-accepted' | 'already-pending' | 'incoming-pending'> {
  const { fromUser, targetListing, note, existingInvite } = params;
  const toUid = targetListing.ownerUid;
  if (!toUid || toUid === fromUser.uid) {
    throw new Error('Cannot send a jam invite without a recipient account.');
  }

  if (existingInvite?.status === 'accepted') {
    return 'already-accepted';
  }
  if (existingInvite?.status === 'pending') {
    return existingInvite.fromUid === toUid ? 'incoming-pending' : 'already-pending';
  }

  const db = await getFirestoreDb();
  const { doc, getDoc, setDoc, updateDoc } = await import('firebase/firestore');
  const inviteId = pairIdFor(fromUser.uid, toUid);
  const participants = sortedParticipants(fromUser.uid, toUid);
  const inviteRef = doc(db, 'jamInvites', inviteId);
  const now = Math.floor(Date.now());
  const trimmedNote = note.trim().slice(0, 280);
  const fromName = fromUser.displayName.trim().slice(0, 64) || 'Musician';
  const toName = (targetListing.ownerName || targetListing.title).trim().slice(0, 64) || 'Musician';

  const reinviteFields = {
    fromUid: fromUser.uid,
    toUid,
    fromName,
    toName,
    targetProfileId: targetListing.id,
    targetProfileTitle: targetListing.title.trim().slice(0, 64),
    regionId: targetListing.regionId,
    note: trimmedNote,
    status: 'pending' as const,
    updatedAt: now,
  };

  if (existingInvite) {
    await updateDoc(inviteRef, reinviteFields);
    return 'sent';
  }

  try {
    await setDoc(inviteRef, {
      participants,
      ...reinviteFields,
      threadId: inviteId,
      createdAt: now,
    });
    return 'sent';
  } catch (err) {
    const snap = await getDoc(inviteRef);
    if (snap.exists()) {
      const prev = snap.data() as Omit<JamInvite, 'id'>;
      if (prev.status === 'accepted') {
        return 'already-accepted';
      }
      if (prev.status === 'pending') {
        return prev.fromUid === toUid ? 'incoming-pending' : 'already-pending';
      }
      await updateDoc(inviteRef, reinviteFields);
      return 'sent';
    }
    throw err;
  }
}

export async function respondToJamInvite(params: {
  invite: JamInvite;
  responderUser: AuthUser;
  decision: 'accepted' | 'declined';
  existingThread?: PrivateThread;
}): Promise<PrivateThread | null> {
  const { invite, responderUser, decision, existingThread } = params;
  const db = await getFirestoreDb();
  const { doc, getDoc, updateDoc, writeBatch } = await import('firebase/firestore');
  const inviteRef = doc(db, 'jamInvites', invite.id);
  const now = Math.floor(Date.now());

  if (decision === 'declined') {
    await updateDoc(inviteRef, {
      status: 'declined',
      updatedAt: now,
    });
    return null;
  }

  if (invite.status === 'accepted') {
    return existingThread ?? (await ensureThreadForAcceptedInvite(invite, responderUser));
  }

  if (existingThread) {
    await updateDoc(inviteRef, {
      status: 'accepted',
      updatedAt: now,
    });
    return existingThread;
  }

  const threadRef = doc(db, 'threads', invite.threadId);
  const builtThread = buildThreadFromInvite(invite, responderUser, now);

  try {
    const batch = writeBatch(db);
    batch.update(inviteRef, {
      status: 'accepted',
      updatedAt: now,
    });
    batch.set(threadRef, serializeThreadDoc(builtThread));
    await batch.commit();
    return builtThread;
  } catch (err) {
    await updateDoc(inviteRef, {
      status: 'accepted',
      updatedAt: now,
    });
    try {
      const snap = await getDoc(threadRef);
      if (snap.exists()) {
        return {
          id: snap.id,
          ...(snap.data() as Omit<PrivateThread, 'id'>),
        };
      }
    } catch {
      // Fallback to deterministic thread object since invite is now accepted.
    }
    return builtThread;
  }
}

export async function cancelJamInvite(inviteId: string): Promise<void> {
  const db = await getFirestoreDb();
  const { doc, updateDoc } = await import('firebase/firestore');
  await updateDoc(doc(db, 'jamInvites', inviteId), {
    status: 'cancelled',
    updatedAt: Math.floor(Date.now()),
  });
}

export function subscribeMyThreads(
  uid: string,
  onData: (threads: PrivateThread[]) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false;
  let unsub: (() => void) | undefined;

  (async () => {
    try {
      const db = await getFirestoreDb();
      const { collection, onSnapshot, query, where } = await import(
        'firebase/firestore'
      );
      if (cancelled) return;
      const q = query(
        collection(db, 'threads'),
        where('participants', 'array-contains', uid)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs
            .map((d) => ({
              id: d.id,
              ...(d.data() as Omit<PrivateThread, 'id'>),
            }))
            .sort((a, b) => (b.lastMessageAt ?? 0) - (a.lastMessageAt ?? 0));
          onData(list);
        },
        (err) => onError?.(err)
      );
    } catch (err) {
      if (!cancelled) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export function subscribeThreadMessages(
  threadId: string,
  onData: (messages: ThreadMessage[]) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false;
  let unsub: (() => void) | undefined;

  (async () => {
    try {
      const db = await getFirestoreDb();
      const { collection, limit, onSnapshot, orderBy, query } = await import(
        'firebase/firestore'
      );
      if (cancelled) return;
      const q = query(
        collection(db, 'threads', threadId, 'messages'),
        orderBy('sentAt', 'asc'),
        limit(200)
      );
      unsub = onSnapshot(
        q,
        (snap) => {
          const list = snap.docs.map((d) => ({
            id: d.id,
            ...(d.data() as Omit<ThreadMessage, 'id'>),
          }));
          onData(list);
        },
        (err) => onError?.(err)
      );
    } catch (err) {
      if (!cancelled) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function sendThreadMessage(params: {
  threadId: string;
  user: AuthUser;
  text: string;
  acceptedInvite?: JamInvite;
}): Promise<void> {
  const { threadId, user, text, acceptedInvite } = params;
  const trimmed = text.trim().slice(0, 1000);
  if (!trimmed) return;

  const db = await getFirestoreDb();
  const { collection, doc, writeBatch } = await import('firebase/firestore');

  const commitMessage = async () => {
    const now = Math.floor(Date.now());
    const msgRef = doc(collection(db, 'threads', threadId, 'messages'));
    const threadRef = doc(db, 'threads', threadId);

    const batch = writeBatch(db);
    batch.set(msgRef, {
      senderUid: user.uid,
      senderName: user.displayName.trim().slice(0, 64) || 'Musician',
      text: trimmed,
      sentAt: now,
    });
    batch.update(threadRef, {
      lastMessageText: trimmed.slice(0, 500),
      lastMessageAt: now,
    });
    await batch.commit();
  };

  try {
    await commitMessage();
  } catch (err) {
    if (acceptedInvite?.status === 'accepted') {
      await ensureThreadForAcceptedInvite(acceptedInvite, user);
      await commitMessage();
      return;
    }
    throw err;
  }
}

export function subscribeMyBlocks(
  uid: string,
  onData: (blocks: BlockedUser[]) => void,
  onError?: (err: Error) => void
): () => void {
  let cancelled = false;
  let unsub: (() => void) | undefined;

  (async () => {
    try {
      const db = await getFirestoreDb();
      const { collection, onSnapshot, orderBy, query } = await import('firebase/firestore');
      if (cancelled) return;
      const q = query(collection(db, 'users', uid, 'blocks'), orderBy('createdAt', 'desc'));
      unsub = onSnapshot(
        q,
        (snap) => {
          const items = snap.docs.map((d) => d.data() as BlockedUser);
          onData(items);
        },
        (err) => onError?.(err)
      );
    } catch (err) {
      if (!cancelled) onError?.(err instanceof Error ? err : new Error(String(err)));
    }
  })();

  return () => {
    cancelled = true;
    unsub?.();
  };
}

export async function blockUser(
  myUid: string,
  blockedUid: string,
  blockedName: string
): Promise<void> {
  const db = await getFirestoreDb();
  const { doc, setDoc } = await import('firebase/firestore');
  await setDoc(doc(db, 'users', myUid, 'blocks', blockedUid), {
    blockedUid,
    blockedName: blockedName.trim().slice(0, 64) || 'Musician',
    createdAt: Math.floor(Date.now()),
  });
}

export async function unblockUser(myUid: string, blockedUid: string): Promise<void> {
  const db = await getFirestoreDb();
  const { deleteDoc, doc } = await import('firebase/firestore');
  await deleteDoc(doc(db, 'users', myUid, 'blocks', blockedUid));
}

export async function submitSafetyReport(params: {
  reporterUid: string;
  targetUid: string;
  targetType: 'profile' | 'thread' | 'wallNote';
  targetId: string;
  reason: ReportReason;
  details: string;
}): Promise<void> {
  const db = await getFirestoreDb();
  const { addDoc, collection } = await import('firebase/firestore');
  await addDoc(collection(db, 'reports'), {
    reporterUid: params.reporterUid,
    targetUid: params.targetUid,
    targetType: params.targetType,
    targetId: params.targetId.slice(0, 128),
    reason: params.reason,
    details: params.details.trim().slice(0, 500),
    createdAt: Math.floor(Date.now()),
  });
}

export async function deleteAccountFirestoreData(uid: string): Promise<void> {
  const db = await getFirestoreDb();
  const {
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    updateDoc,
    where,
  } = await import('firebase/firestore');

  // 1. Delete all owned profiles and their wallNotes subcollections.
  const profilesSnap = await getDocs(query(collection(db, 'profiles'), where('ownerUid', '==', uid)));
  for (const profileDoc of profilesSnap.docs) {
    try {
      const notesSnap = await getDocs(collection(db, 'profiles', profileDoc.id, 'wallNotes'));
      await Promise.allSettled(
        notesSnap.docs.map((noteDoc) =>
          deleteDoc(doc(db, 'profiles', profileDoc.id, 'wallNotes', noteDoc.id))
        )
      );
    } catch {
      // Proceed to deleting the parent profile even if subcollection read hits a transient error.
    }
    await deleteDoc(doc(db, 'profiles', profileDoc.id));
  }

  // 2. Delete all user block list entries under users/{uid}/blocks.
  try {
    const blocksSnap = await getDocs(collection(db, 'users', uid, 'blocks'));
    await Promise.allSettled(
      blocksSnap.docs.map((blockDoc) => deleteDoc(doc(db, 'users', uid, 'blocks', blockDoc.id)))
    );
  } catch {
    // Ignore if none exist.
  }

  // 3. Cancel/decline any still-pending jamInvites involving this account cleanly per rules.
  try {
    const invitesSnap = await getDocs(
      query(collection(db, 'jamInvites'), where('participants', 'array-contains', uid))
    );
    const now = Math.floor(Date.now());
    await Promise.allSettled(
      invitesSnap.docs.map((invDoc) => {
        const data = invDoc.data();
        if (data.status !== 'pending') return Promise.resolve();
        if (data.fromUid === uid) {
          return updateDoc(doc(db, 'jamInvites', invDoc.id), {
            status: 'cancelled',
            updatedAt: now,
          });
        }
        if (data.toUid === uid) {
          return updateDoc(doc(db, 'jamInvites', invDoc.id), {
            status: 'declined',
            updatedAt: now,
          });
        }
        return Promise.resolve();
      })
    );
  } catch {
    // Continue account deletion even if no invites exist or partial update fails.
  }
}
