import type { EmbedProvider } from '../types';

export type ParsedClipResult =
  | {
      ok: true;
      embedUrl: string;
      provider: EmbedProvider;
      kind: 'embed' | 'video' | 'audio';
      defaultTitle: string;
    }
  | {
      ok: false;
      error: string;
    };

export function sanitizeInstagramHandle(raw?: string): string | undefined {
  if (!raw) return undefined;
  let cleaned = raw.trim();
  if (!cleaned) return undefined;
  cleaned = cleaned.replace(/^https?:\/\/(www\.)?instagram\.com\//i, '');
  cleaned = cleaned.split(/[/?#]/)[0]?.replace(/^@+/, '') ?? '';
  if (!/^[a-zA-Z0-9._]{1,30}$/.test(cleaned)) return undefined;
  if (cleaned === '.' || cleaned === '..' || cleaned.includes('..')) return undefined;
  return cleaned;
}

export function embedProviderLabel(provider?: EmbedProvider): string {
  switch (provider) {
    case 'instagram':
      return 'Instagram';
    case 'youtube':
      return 'YouTube';
    case 'tiktok':
      return 'TikTok';
    case 'vimeo':
      return 'Vimeo';
    case 'soundcloud':
      return 'SoundCloud';
    case 'direct':
      return 'Direct clip';
    default:
      return 'Linked clip';
  }
}

export function parseClipUrl(raw: string): ParsedClipResult {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, error: 'Paste a public clip link first.' };
  }

  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  let url: URL;
  try {
    url = new URL(withProtocol);
  } catch {
    return { ok: false, error: 'Enter a valid HTTPS clip link.' };
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    return { ok: false, error: 'Only clean HTTPS links are supported.' };
  }

  const host = url.hostname.toLowerCase().replace(/^www\./, '');
  const path = url.pathname;

  // Instagram Reels / Posts
  if (host === 'instagram.com' || host === 'instagr.am') {
    const match = path.match(/^\/(reel|reels|p|tv)\/([A-Za-z0-9_-]+)/);
    if (!match) {
      return {
        ok: false,
        error: 'Paste an Instagram Reel or Post link (for example instagram.com/reel/...).',
      };
    }
    const kindSeg = match[1] === 'p' ? 'p' : 'reel';
    return {
      ok: true,
      embedUrl: `https://www.instagram.com/${kindSeg}/${match[2]}/`,
      provider: 'instagram',
      kind: 'embed',
      defaultTitle: kindSeg === 'p' ? 'Instagram post' : 'Instagram Reel',
    };
  }

  // YouTube / Shorts
  if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'youtu.be') {
    let videoId = '';
    if (host === 'youtu.be') {
      videoId = path.slice(1).split('/')[0] ?? '';
    } else if (path.startsWith('/shorts/')) {
      videoId = path.slice('/shorts/'.length).split('/')[0] ?? '';
    } else if (path.startsWith('/embed/')) {
      videoId = path.slice('/embed/'.length).split('/')[0] ?? '';
    } else {
      videoId = url.searchParams.get('v') ?? '';
    }
    if (!/^[A-Za-z0-9_-]{11}$/.test(videoId)) {
      return {
        ok: false,
        error: 'Paste a YouTube watch, Shorts, or youtu.be link.',
      };
    }
    return {
      ok: true,
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1`,
      provider: 'youtube',
      kind: 'embed',
      defaultTitle: path.startsWith('/shorts/') ? 'YouTube Short' : 'YouTube clip',
    };
  }

  // Vimeo
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const match = path.match(/\/(?:video\/)?(\d{5,14})(?:$|\/)/);
    if (!match) {
      return { ok: false, error: 'Paste a public Vimeo video URL (vimeo.com/12345678).' };
    }
    return {
      ok: true,
      embedUrl: `https://player.vimeo.com/video/${match[1]}`,
      provider: 'vimeo',
      kind: 'embed',
      defaultTitle: 'Vimeo clip',
    };
  }

  // TikTok
  if (host === 'tiktok.com' || host === 'm.tiktok.com') {
    const match = path.match(/\/video\/(\d{8,24})/);
    if (!match) {
      return {
        ok: false,
        error: 'Paste a full TikTok video URL (tiktok.com/@name/video/...). Short vm.tiktok links are not embeddable.',
      };
    }
    return {
      ok: true,
      embedUrl: `https://www.tiktok.com/embed/v2/${match[1]}`,
      provider: 'tiktok',
      kind: 'embed',
      defaultTitle: 'TikTok clip',
    };
  }

  // SoundCloud
  if (host === 'soundcloud.com' || host === 'm.soundcloud.com') {
    const segments = path.split('/').filter(Boolean);
    const disallowed = new Set(['discover', 'stream', 'you', 'settings', 'upload', 'search']);
    if (segments.length < 2 || disallowed.has(segments[0].toLowerCase())) {
      return {
        ok: false,
        error: 'Paste a direct SoundCloud track or set URL (soundcloud.com/artist/track).',
      };
    }
    const cleanUrl = `https://soundcloud.com/${segments.slice(0, 3).join('/')}`;
    return {
      ok: true,
      embedUrl: `https://w.soundcloud.com/player/?url=${encodeURIComponent(cleanUrl)}&color=%23d91b4c&auto_play=false&hide_related=true&show_comments=false&show_user=true&show_reposts=false&show_teaser=false&visual=true`,
      provider: 'soundcloud',
      kind: 'embed',
      defaultTitle: 'SoundCloud track',
    };
  }

  // Direct HTTPS video/audio file URLs
  const lowerPath = path.toLowerCase();
  if (/\.(mp4|webm|mov|m4v)$/.test(lowerPath)) {
    return {
      ok: true,
      embedUrl: url.toString(),
      provider: 'direct',
      kind: 'video',
      defaultTitle: 'Video clip',
    };
  }
  if (/\.(mp3|wav|m4a|ogg)$/.test(lowerPath)) {
    return {
      ok: true,
      embedUrl: url.toString(),
      provider: 'direct',
      kind: 'audio',
      defaultTitle: 'Audio clip',
    };
  }

  return {
    ok: false,
    error:
      'Use an Instagram Reel/Post, YouTube/Shorts, TikTok, Vimeo, SoundCloud, or direct MP4/MP3 HTTPS link.',
  };
}

const ALLOWED_EMBED_HOSTS = new Set([
  'www.youtube-nocookie.com',
  'youtube-nocookie.com',
  'www.youtube.com',
  'player.vimeo.com',
  'www.tiktok.com',
  'w.soundcloud.com',
  'www.instagram.com',
]);

export function sanitizeRenderableEmbedUrl(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 1000) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    if (!ALLOWED_EMBED_HOSTS.has(url.hostname.toLowerCase())) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function sanitizeDirectMediaUrl(raw?: string): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 1000) return null;
  if (trimmed.startsWith('./profiles/') && !trimmed.includes('..')) {
    return trimmed;
  }
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'https:' || url.username || url.password) return null;
    return url.toString();
  } catch {
    return null;
  }
}
