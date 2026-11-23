export type AppMode = 'jam' | 'gigs';

export type NavTab = 'discover' | 'matches' | 'post';

export type GigSubtype = 'band-for-hire' | 'open-gig';

export type SwipeDecision = 'like' | 'pass';

export interface Region {
  id: string;
  city: string;
  state: string;
  areaCode: string;
  label: string;
  isCustom?: boolean;
}

export interface Listing {
  id: string;
  side: AppMode;
  gigSubtype?: GigSubtype;
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
  autoMatch: boolean;
  autoReply: string;
  isUserCreated?: boolean;
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
  customRegions: Region[];
  userListings: Listing[];
  swiped: Record<string, SwipeDecision>;
  history: SwipeHistoryItem[];
  matches: MatchRecord[];
}
