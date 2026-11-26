export type AppMode = 'jam' | 'gigs';

export type NavTab = 'discover' | 'browse' | 'matches' | 'post';

export type DiscoveryRole = 'musician' | 'session' | 'teacher';

export type InboxFolder = 'inbox' | 'requests' | 'sent';

export type GigSubtype = 'band-for-hire' | 'open-gig';

export type SwipeDecision = 'like' | 'pass';

export type LocationConsent = 'unknown' | 'granted' | 'declined';

export type InstrumentId =
  | 'guitar'
  | 'bass'
  | 'drums'
  | 'vocals'
  | 'keys'
  | 'synth'
  | 'horns'
  | 'strings'
  | 'producer'
  | 'band';

export type GearCategory =
  | 'Instruments'
  | 'Amps & Cabs'
  | 'Pedals & Synth'
  | 'Drums & Percussion'
  | 'Mics & Studio'
  | 'PA & Backline';

export interface GearItem {
  id: string;
  category: GearCategory;
  name: string;
  notes?: string;
}

export type ProfileThemeId =
  | 'stage-coral'
  | 'midnight-vinyl'
  | 'tube-amber'
  | 'emerald-club'
  | 'synth-violet'
  | 'zine-mono';

export interface ProfileStyle {
  themeId: ProfileThemeId;
  moodStatus?: string;
  soundsLike?: string[];
  bannerPattern?: 'vinyl' | 'waves' | 'bars' | 'grid';
}

export interface WallComment {
  id: string;
  authorName: string;
  authorUid?: string;
  text: string;
  createdAt: number;
}

export type EmbedProvider =
  | 'instagram'
  | 'youtube'
  | 'tiktok'
  | 'vimeo'
  | 'soundcloud'
  | 'direct';

export interface MediaClip {
  id: string;
  title: string;
  kind: 'embed' | 'video' | 'audio' | 'synth-reel';
  mediaId?: string;
  embedUrl?: string;
  embedProvider?: EmbedProvider;
  posterUrl?: string;
  durationSec: number;
  clipVariation?: number;
}

export interface AuthUser {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  provider: 'google' | 'apple';
  isDemoPreview?: boolean;
}

export interface Region {
  id: string;
  city: string;
  state: string;
  areaCode: string;
  label: string;
  lat?: number;
  lng?: number;
  isCustom?: boolean;
  isPilot?: boolean;
}

export interface Listing {
  id: string;
  side: AppMode;
  gigSubtype?: GigSubtype;
  roleCategory: string;
  instruments: InstrumentId[];
  regionId: string;
  regionLabel?: string;
  regionState?: string;
  neighborhood: string;
  title: string;
  subtitle: string;
  seekingOrOffer: string;
  genres: string[];
  tags: string[];
  bio: string;
  gearOrBackline: string;
  gearLocker: GearItem[];
  availability: string;
  payOrSplit?: string;
  offersLessons?: boolean;
  offersSession?: boolean;
  remoteFriendly?: boolean;
  lessonRate?: string;
  sessionRate?: string;
  serviceNote?: string;
  instagramHandle?: string;
  sampleLink?: string;
  visualSeed: number;
  portraitUrl?: string;
  portraitAlt?: string;
  clips: MediaClip[];
  featuredClipId?: string;
  profileStyle: ProfileStyle;
  isPublished?: boolean;
  isUserCreated?: boolean;
  ownerUid?: string;
  ownerName?: string;
  createdAt: number;
  updatedAt?: number;
}

export type JamInviteStatus = 'pending' | 'accepted' | 'declined' | 'cancelled';

export interface JamInvite {
  id: string;
  participants: [string, string];
  fromUid: string;
  toUid: string;
  fromName: string;
  toName: string;
  targetProfileId: string;
  targetProfileTitle: string;
  regionId: string;
  note: string;
  status: JamInviteStatus;
  threadId: string;
  createdAt: number;
  updatedAt: number;
}

export interface PrivateThread {
  id: string;
  participants: [string, string];
  participantNames: Record<string, string>;
  profileId: string;
  profileTitle: string;
  regionId: string;
  lastMessageText: string;
  lastMessageAt: number;
  createdAt: number;
}

export interface ThreadMessage {
  id: string;
  senderUid: string;
  senderName: string;
  text: string;
  sentAt: number;
}

export interface BlockedUser {
  blockedUid: string;
  blockedName: string;
  createdAt: number;
}

export type ReportReason = 'spam' | 'harassment' | 'impersonation' | 'inappropriate' | 'other';

export interface SwipeHistoryItem {
  listingId: string;
  decision: SwipeDecision;
}

export interface AppState {
  regionId: string;
  mode: AppMode;
  includeNearbyRegions: boolean;
  includeRemoteFriendly: boolean;
  locationConsent: LocationConsent;
  detectedCityLabel?: string;
  lookingForJam: string[];
  lookingForGigs: string[];
  customRegions: Region[];
  userListings: Listing[];
  swiped: Record<string, SwipeDecision>;
  history: SwipeHistoryItem[];
}
