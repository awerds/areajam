export interface WordTiming {
  word: string;
  startMs: number;
  endMs: number;
}

export type SceneMediaType =
  | 'phone'
  | 'phone-swipe'
  | 'phone-scroll'
  | 'desktop'
  | 'desktop-scroll'
  | 'endcard';
export type SceneMotion = 'zoom-in' | 'zoom-out' | 'tilt-left' | 'tilt-right' | 'pulse';

export interface SceneSpec {
  id: string;
  badge: string;
  headline: string;
  subline: string;
  media: string;
  chromeMedia?: string;
  secondaryMedia?: string;
  midMedia?: string;
  primaryVideo?: string;
  midVideo?: string;
  secondaryVideo?: string;
  primaryAudio?: string;
  midAudio?: string;
  secondaryAudio?: string;
  clipAudio?: string;
  scrollEndPct?: number;
  mediaType: SceneMediaType;
  motion: SceneMotion;
  narration: string;
  audioFile: string;
  startFrame: number;
  durationFrames: number;
  durationSec: number;
  words: WordTiming[];
}

export interface TimelineManifest {
  title: string;
  width: number;
  height: number;
  fps: number;
  totalFrames: number;
  musicFile: string;
  ctaUrl: string;
  ctaTagline: string;
  scenes: SceneSpec[];
}
