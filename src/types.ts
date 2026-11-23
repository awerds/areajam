export type AppMode = 'jam' | 'gigs';

export type NavTab = 'discover' | 'browse' | 'matches' | 'post';

export type GigSubtype = 'band-for-hire' | 'open-gig';

export type SwipeDecision = 'like' | 'pass';

export type LocationConsent = 'unknown' | 'granted' | 'declined';

export interface MediaClip {
  id: string;
  title: string;
  kind: 'video' | 'audio' | 'synth-reel';
  mediaId?: string;
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
}

export interface Listing {
  id: string;
  side: AppMode;
  gigSubtype?: GigSubtype;
  roleCategory: string;
  regionId: string;
  neighborhood: string;
  title: string;
  subtitle: string;
  seekingOrOffer: string;
  genres: string[];
  tags: string[];
  bio: string;
  gearOrBackline: string;
  availability: string;
  payOrSplit?: string;
  sampleLink?: string;
  visualSeed: number;
  clips: MediaClip[];
  autoMatch: boolean;
  autoReply: string;
  isUserCreated?: boolean;
  ownerUid?: string;
  ownerName?: string;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  sender: 'me' | 'them';
  text: string;
  sentAt: number;
}

export interface MatchRecord {
  id: string;
  listingId: string;
  side: AppMode;
  matchedAt: number;
  messages: ChatMessage[];
}

export interface SwipeHistoryItem {
  listingId: string;
  decision: SwipeDecision;
  createdMatchId?: string;
}

export interface AppState {
  regionId: string;
  mode: AppMode;
  includeNearbyRegions: boolean;
  locationConsent: LocationConsent;
  detectedCityLabel?: string;
  lookingForJam: string[];
  lookingForGigs: string[];
  customRegions: Region[];
  userListings: Listing[];
  swiped: Record<string, SwipeDecision>;
  history: SwipeHistoryItem[];
  matches: MatchRecord[];
}
