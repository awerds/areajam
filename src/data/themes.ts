import type { GearCategory, ProfileThemeId } from '../types';

export interface ProfileTheme {
  id: ProfileThemeId;
  name: string;
  tagline: string;
  bgFrom: string;
  bgTo: string;
  accent: string;
  accentInk: string;
  glow: string;
  surfaceTint: string;
  borderTint: string;
}

export const PROFILE_THEMES: Record<ProfileThemeId, ProfileTheme> = {
  'stage-coral': {
    id: 'stage-coral',
    name: 'Pink Signature',
    tagline: 'Signature pink on ink navy',
    bgFrom: '#1f0b17',
    bgTo: '#10131d',
    accent: '#d91b4c',
    accentInk: '#ffffff',
    glow: 'rgba(217, 27, 76, 0.34)',
    surfaceTint: 'rgba(22, 26, 40, 0.86)',
    borderTint: 'rgba(217, 27, 76, 0.32)',
  },
  'midnight-vinyl': {
    id: 'midnight-vinyl',
    name: 'Midnight Vinyl',
    tagline: 'Deep cobalt crate-digger room',
    bgFrom: '#0a1228',
    bgTo: '#06070d',
    accent: '#60a5fa',
    accentInk: '#061124',
    glow: 'rgba(96, 165, 250, 0.32)',
    surfaceTint: 'rgba(13, 21, 42, 0.74)',
    borderTint: 'rgba(147, 197, 253, 0.25)',
  },
  'tube-amber': {
    id: 'tube-amber',
    name: 'Tube Amber',
    tagline: 'Warm 6L6 vacuum glow',
    bgFrom: '#211408',
    bgTo: '#090807',
    accent: '#f59e0b',
    accentInk: '#1c1002',
    glow: 'rgba(245, 158, 11, 0.32)',
    surfaceTint: 'rgba(31, 21, 11, 0.74)',
    borderTint: 'rgba(251, 191, 36, 0.25)',
  },
  'emerald-club': {
    id: 'emerald-club',
    name: 'Emerald Club',
    tagline: 'Backstage green-room glass',
    bgFrom: '#071f17',
    bgTo: '#060a09',
    accent: '#10e88a',
    accentInk: '#041d12',
    glow: 'rgba(16, 232, 138, 0.28)',
    surfaceTint: 'rgba(10, 29, 22, 0.74)',
    borderTint: 'rgba(52, 211, 153, 0.26)',
  },
  'synth-violet': {
    id: 'synth-violet',
    name: 'Synth Violet',
    tagline: 'Late-night tape chorus',
    bgFrom: '#180d29',
    bgTo: '#07070f',
    accent: '#c084fc',
    accentInk: '#19082b',
    glow: 'rgba(192, 132, 252, 0.32)',
    surfaceTint: 'rgba(25, 16, 44, 0.74)',
    borderTint: 'rgba(216, 180, 254, 0.26)',
  },
  'zine-mono': {
    id: 'zine-mono',
    name: 'Zine Chrome',
    tagline: 'Silver-halide flyer print',
    bgFrom: '#171920',
    bgTo: '#08090c',
    accent: '#f8fafc',
    accentInk: '#090a0d',
    glow: 'rgba(226, 232, 240, 0.2)',
    surfaceTint: 'rgba(22, 25, 33, 0.78)',
    borderTint: 'rgba(255, 255, 255, 0.24)',
  },
};

export const PROFILE_THEME_LIST: ProfileTheme[] = Object.values(PROFILE_THEMES);

export const GEAR_CATEGORIES: GearCategory[] = [
  'Instruments',
  'Amps & Cabs',
  'Pedals & Synth',
  'Drums & Percussion',
  'Mics & Studio',
  'PA & Backline',
];

export function safeHttpsUrl(raw?: string): string | undefined {
  if (!raw) return undefined;
  const trimmed = raw.trim();
  if (!trimmed) return undefined;
  const candidate = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const parsed = new URL(candidate);
    if (parsed.protocol !== 'https:') return undefined;
    if (parsed.username || parsed.password) return undefined;
    if (!parsed.hostname.includes('.')) return undefined;
    return parsed.toString();
  } catch {
    return undefined;
  }
}
