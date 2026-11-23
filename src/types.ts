export type AppMode = 'jam' | 'gigs';

export type NavTab = 'discover' | 'browse' | 'matches' | 'post';

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
  instruments: InstrumentId[];
  regionId: string;
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
  sampleLink?: string;
  visualSeed: number;
  clips: MediaClip[];
  featuredClipId?: string;
  profileStyle: ProfileStyle;
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
  wallComments: Record<string, WallComment[]>;
}
