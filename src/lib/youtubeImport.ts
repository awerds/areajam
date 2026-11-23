import { readFirebaseConfig } from './firebaseApp';

export interface YouTubeVideoCandidate {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
  embedUrl: string;
  watchUrl: string;
}

export interface YouTubeChannelImport {
  channelId: string;
  title: string;
  handle?: string;
  description: string;
  avatarUrl?: string;
  videos: YouTubeVideoCandidate[];
}

export type ParsedYouTubeChannelQuery =
  | { kind: 'handle'; value: string; fallbackUsername?: string }
  | { kind: 'id'; value: string }
  | { kind: 'username'; value: string };

function readYouTubeApiKey(): string {
  const fromEnv = (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined)?.trim();
  if (fromEnv) return fromEnv;
  return readFirebaseConfig()?.apiKey?.trim() || '';
}

export function isYouTubeImportConfigured(): boolean {
  return Boolean(readYouTubeApiKey());
}

export function parseYouTubeChannelInput(raw: string): ParsedYouTubeChannelQuery | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^UC[A-Za-z0-9_-]{20,28}$/.test(trimmed)) {
    return { kind: 'id', value: trimmed };
  }

  if (trimmed.startsWith('@')) {
    const clean = trimmed.replace(/^@+/, '').split(/[/?#\s]/)[0] ?? '';
    if (!/^[A-Za-z0-9._-]{2,50}$/.test(clean)) return null;
    return { kind: 'handle', value: `@${clean}` };
  }

  if (/^https?:\/\//i.test(trimmed) || /(^|\.)(youtube\.com|youtu\.be)\//i.test(trimmed)) {
    const normalized = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    try {
      const url = new URL(normalized);
      const host = url.hostname.toLowerCase().replace(/^www\./, '');
      if (host !== 'youtube.com' && host !== 'm.youtube.com') return null;

      const segments = url.pathname.split('/').filter(Boolean);
      if (segments.length === 0) return null;

      if (segments[0].startsWith('@')) {
        const clean = segments[0].slice(1);
        if (!clean) return null;
        return { kind: 'handle', value: `@${clean}` };
      }
      if (segments[0] === 'channel' && segments[1] && /^UC[A-Za-z0-9_-]{20,28}$/.test(segments[1])) {
        return { kind: 'id', value: segments[1] };
      }
      if (segments[0] === 'user' && segments[1]) {
        return { kind: 'username', value: segments[1] };
      }
      if (segments[0] === 'c' && segments[1]) {
        return { kind: 'handle', value: `@${segments[1]}`, fallbackUsername: segments[1] };
      }
      const fallbackSeg = segments[0].replace(/^@+/, '');
      if (/^[A-Za-z0-9._-]{2,50}$/.test(fallbackSeg)) {
        return { kind: 'handle', value: `@${fallbackSeg}`, fallbackUsername: fallbackSeg };
      }
      return null;
    } catch {
      return null;
    }
  }

  const compact = trimmed.replace(/^@+/, '');
  if (!/^[A-Za-z0-9._-]{2,50}$/.test(compact)) return null;
  return { kind: 'handle', value: `@${compact}`, fallbackUsername: compact };
}

interface YouTubeApiChannelItem {
  id?: string;
  snippet?: {
    title?: string;
    description?: string;
    customUrl?: string;
    thumbnails?: {
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
}

interface YouTubeApiPlaylistItem {
  snippet?: {
    title?: string;
    publishedAt?: string;
    resourceId?: {
      videoId?: string;
    };
    thumbnails?: {
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  contentDetails?: {
    videoId?: string;
  };
}

function formatYouTubeApiError(status: number, body: unknown): string {
  const errObj =
    body && typeof body === 'object' && 'error' in body
      ? (body as { error?: { message?: string; errors?: Array<{ reason?: string }> } }).error
      : undefined;
  const reason = errObj?.errors?.[0]?.reason ?? '';

  if (reason === 'quotaExceeded' || reason === 'dailyLimitExceeded') {
    return 'YouTube daily import quota reached — paste individual YouTube links below instead.';
  }
  if (reason === 'playlistNotFound' || status === 404) {
    return 'This YouTube channel has no public uploads yet — try the artist’s main @handle or paste a clip link below.';
  }
  if (
    status === 403 &&
    (reason === 'forbidden' || /referer|referrer/i.test(errObj?.message ?? ''))
  ) {
    return 'YouTube import key is not authorized on this origin — paste clip links directly below.';
  }
  if (errObj?.message) {
    return errObj.message.replace(/<[^>]+>/g, '').trim();
  }
  return `YouTube import failed (HTTP ${status}). Try pasting a clip link directly below.`;
}

async function fetchYouTubeJson(url: string): Promise<Record<string, unknown>> {
  const res = await fetch(url);
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  if (!res.ok) {
    throw new Error(formatYouTubeApiError(res.status, json));
  }
  if (!json || typeof json !== 'object') {
    throw new Error('Unexpected response from YouTube API.');
  }
  return json as Record<string, unknown>;
}

async function lookupChannelByParam(
  paramKey: 'forHandle' | 'forUsername' | 'id',
  paramValue: string,
  apiKey: string
): Promise<YouTubeApiChannelItem | null> {
  const url =
    `https://www.googleapis.com/youtube/v3/channels?part=snippet,contentDetails&` +
    `${paramKey}=${encodeURIComponent(paramValue)}&key=${encodeURIComponent(apiKey)}`;
  const data = await fetchYouTubeJson(url);
  const items = Array.isArray(data.items) ? (data.items as YouTubeApiChannelItem[]) : [];
  return items[0] ?? null;
}

export async function fetchYouTubeChannelClips(rawInput: string): Promise<YouTubeChannelImport> {
  const apiKey = readYouTubeApiKey();
  if (!apiKey) {
    throw new Error('YouTube visual picker is not configured yet.');
  }

  const parsed = parseYouTubeChannelInput(rawInput);
  if (!parsed) {
    throw new Error(
      'Enter a YouTube @handle or channel link (for example @corywong or youtube.com/@corywong).'
    );
  }

  let channel: YouTubeApiChannelItem | null = null;
  if (parsed.kind === 'handle') {
    channel = await lookupChannelByParam('forHandle', parsed.value, apiKey);
    if (!channel && parsed.fallbackUsername) {
      channel = await lookupChannelByParam('forUsername', parsed.fallbackUsername, apiKey);
    }
  } else if (parsed.kind === 'username') {
    channel = await lookupChannelByParam('forUsername', parsed.value, apiKey);
    if (!channel) {
      channel = await lookupChannelByParam('forHandle', `@${parsed.value}`, apiKey);
    }
  } else {
    channel = await lookupChannelByParam('id', parsed.value, apiKey);
  }

  if (!channel?.id) {
    throw new Error('Could not find a public YouTube channel for that handle or URL.');
  }

  const uploadsId = channel.contentDetails?.relatedPlaylists?.uploads;
  if (!uploadsId) {
    throw new Error('This YouTube channel does not expose a public uploads feed.');
  }

  const itemsUrl =
    `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&` +
    `playlistId=${encodeURIComponent(uploadsId)}&maxResults=24&key=${encodeURIComponent(apiKey)}`;
  const itemsData = await fetchYouTubeJson(itemsUrl);
  const rawItems = Array.isArray(itemsData.items)
    ? (itemsData.items as YouTubeApiPlaylistItem[])
    : [];

  const seenIds = new Set<string>();
  const videos: YouTubeVideoCandidate[] = [];

  for (const item of rawItems) {
    const videoId = item.contentDetails?.videoId || item.snippet?.resourceId?.videoId || '';
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId) || seenIds.has(videoId)) continue;

    const rawTitle = (item.snippet?.title ?? '').trim();
    if (!rawTitle || rawTitle === 'Private video' || rawTitle === 'Deleted video') continue;

    seenIds.add(videoId);
    const thumbs = item.snippet?.thumbnails;
    const thumbnailUrl =
      thumbs?.high?.url ||
      thumbs?.medium?.url ||
      thumbs?.default?.url ||
      `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

    videos.push({
      videoId,
      title: rawTitle,
      thumbnailUrl,
      publishedAt: item.snippet?.publishedAt ?? '',
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      watchUrl: `https://www.youtube.com/watch?v=${videoId}`,
    });
  }

  if (videos.length === 0) {
    throw new Error('This YouTube channel has no public videos or Shorts available to import.');
  }

  const handleCandidate = channel.snippet?.customUrl?.trim();
  const handle = handleCandidate
    ? handleCandidate.startsWith('@')
      ? handleCandidate
      : `@${handleCandidate}`
    : parsed.kind === 'handle'
      ? parsed.value
      : undefined;

  return {
    channelId: channel.id,
    title: channel.snippet?.title?.trim() || 'YouTube artist',
    handle,
    description: (channel.snippet?.description ?? '').replace(/\s+/g, ' ').trim(),
    avatarUrl: channel.snippet?.thumbnails?.medium?.url || channel.snippet?.thumbnails?.default?.url,
    videos,
  };
}
