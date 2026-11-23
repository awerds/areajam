import type { Listing } from '../types';

type GrooveStyle = 'soul-jazz' | 'funk' | 'synth' | 'rock';

let activeCtx: AudioContext | null = null;
let activeListingId: string | null = null;
let stopTimerId: number | undefined;
let activeListeners = new Set<() => void>();

function notifyListeners(): void {
  activeListeners.forEach((cb) => cb());
}

export function subscribeAudioState(listener: () => void): () => void {
  activeListeners.add(listener);
  return () => {
    activeListeners.delete(listener);
  };
}

export function getPlayingListingId(): string | null {
  return activeListingId;
}

export function stopCardPreview(): void {
  window.clearTimeout(stopTimerId);
  stopTimerId = undefined;

  if (activeCtx) {
    const ctx = activeCtx;
    activeCtx = null;
    ctx.close().catch(() => {
      // Ignore already-closed audio context errors
    });
  }

  if (activeListingId !== null) {
    activeListingId = null;
    notifyListeners();
  }
}

function classifyGroove(listing: Listing): GrooveStyle {
  const haystack = `${listing.genres.join(' ')} ${listing.tags.join(' ')}`.toLowerCase();
  if (/funk|brass|dub|reggae|afrobeat/.test(haystack)) return 'funk';
  if (/synth|darkwave|electronic|dream pop|shoegaze/.test(haystack)) return 'synth';
  if (/jazz|soul|r&b|americana|folk|blues|acoustic/.test(haystack)) return 'soul-jazz';
  return 'rock';
}

function scheduleTone(
  ctx: AudioContext,
  master: GainNode,
  freq: number,
  startOffset: number,
  duration: number,
  type: OscillatorType,
  peakGain: number,
  filterCutoff = 1800
): void {
  const start = ctx.currentTime + startOffset;
  const osc = ctx.createOscillator();
  const filter = ctx.createBiquadFilter();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);

  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(filterCutoff, start);
  filter.Q.setValueAtTime(1.2, start);

  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.exponentialRampToValueAtTime(peakGain, start + Math.min(0.035, duration * 0.25));
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.connect(filter);
  filter.connect(gain);
  gain.connect(master);

  osc.start(start);
  osc.stop(start + duration + 0.03);
}

function scheduleNoiseTick(
  ctx: AudioContext,
  master: GainNode,
  startOffset: number,
  peakGain: number
): void {
  const length = Math.floor(ctx.sampleRate * 0.045);
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (length * 0.28));
  }

  const start = ctx.currentTime + startOffset;
  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.setValueAtTime(5200, start);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(peakGain, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.045);

  source.connect(hp);
  hp.connect(gain);
  gain.connect(master);
  source.start(start);
}

export async function toggleCardPreview(listing: Listing): Promise<boolean> {
  if (activeListingId === listing.id) {
    stopCardPreview();
    return false;
  }

  stopCardPreview();

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

  if (!AudioCtx) return false;

  try {
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const master = ctx.createGain();
    master.gain.setValueAtTime(0.7, ctx.currentTime);
    master.connect(ctx.destination);

    activeCtx = ctx;
    activeListingId = listing.id;
    notifyListeners();

    const style = classifyGroove(listing);
    const transpose = ((listing.visualSeed % 5) - 2) * 0.5;
    const shift = (hz: number) => hz * Math.pow(2, transpose / 12);

    const loopDurationSec = 5.6;

    if (style === 'soul-jazz') {
      const chords = [
        [174.61, 220.0, 261.63, 329.63],
        [164.81, 196.0, 246.94, 293.66],
        [146.83, 174.61, 220.0, 261.63],
        [130.81, 164.81, 196.0, 246.94],
      ];
      chords.forEach((chord, idx) => {
        const t = idx * 1.35;
        scheduleTone(ctx, master, shift(chord[0] * 0.5), t, 1.25, 'triangle', 0.14, 480);
        chord.forEach((f) => {
          scheduleTone(ctx, master, shift(f), t, 1.25, 'sine', 0.065, 1600);
        });
      });
    } else if (style === 'funk') {
      const bass = [98.0, 98.0, 116.54, 130.81, 146.83, 130.81, 116.54, 98.0];
      for (let step = 0; step < 16; step++) {
        const t = step * 0.34;
        if (step % 2 === 0 || step % 7 === 0) {
          scheduleTone(ctx, master, shift(bass[step % bass.length]), t, 0.24, 'sawtooth', 0.13, 620);
        }
        if (step % 4 === 2) {
          [293.66, 349.23, 440.0].forEach((f) =>
            scheduleTone(ctx, master, shift(f), t, 0.18, 'triangle', 0.055, 2200)
          );
        }
        scheduleNoiseTick(ctx, master, t, step % 2 === 1 ? 0.06 : 0.03);
      }
    } else if (style === 'synth') {
      const notes = [130.81, 196.0, 246.94, 261.63, 196.0, 164.81];
      scheduleTone(ctx, master, shift(65.41), 0, 5.4, 'sawtooth', 0.09, 540);
      scheduleTone(ctx, master, shift(130.81), 0, 5.4, 'triangle', 0.08, 920);
      for (let i = 0; i < 18; i++) {
        const t = i * 0.3;
        scheduleTone(ctx, master, shift(notes[i % notes.length]), t, 0.28, 'triangle', 0.075, 1900);
      }
    } else {
      const roots = [110.0, 110.0, 130.81, 146.83, 110.0, 164.81, 146.83, 130.81];
      for (let step = 0; step < 16; step++) {
        const t = step * 0.34;
        const root = shift(roots[step % roots.length]);
        scheduleTone(ctx, master, root, t, 0.28, 'sawtooth', 0.12, 680);
        if (step % 4 === 0) {
          scheduleTone(ctx, master, root * 2, t, 0.55, 'triangle', 0.07, 1700);
          scheduleTone(ctx, master, root * 3, t, 0.55, 'triangle', 0.045, 1900);
        }
        scheduleNoiseTick(ctx, master, t, step % 2 === 1 ? 0.065 : 0.03);
      }
    }

    stopTimerId = window.setTimeout(() => {
      stopCardPreview();
    }, loopDurationSec * 1000);

    return true;
  } catch {
    stopCardPreview();
    return false;
  }
}
