import type { Region } from '../types';

export const STARTER_REGIONS: Region[] = [
  { id: 'austin', city: 'Austin', state: 'TX', areaCode: '512', label: 'Austin (512)', lat: 30.2672, lng: -97.7431 },
  { id: 'nashville', city: 'Nashville', state: 'TN', areaCode: '615', label: 'Nashville (615)', lat: 36.1627, lng: -86.7816 },
  { id: 'nyc', city: 'New York', state: 'NY', areaCode: '718', label: 'NYC / BK (718)', lat: 40.7128, lng: -74.006 },
  { id: 'la', city: 'Los Angeles', state: 'CA', areaCode: '213', label: 'Los Angeles (213)', lat: 34.0522, lng: -118.2437 },
  { id: 'chicago', city: 'Chicago', state: 'IL', areaCode: '312', label: 'Chicago (312)', lat: 41.8781, lng: -87.6298 },
  { id: 'portland', city: 'Portland', state: 'OR', areaCode: '503', label: 'Portland (503)', lat: 45.5152, lng: -122.6784 },
  { id: 'seattle', city: 'Seattle', state: 'WA', areaCode: '206', label: 'Seattle (206)', lat: 47.6062, lng: -122.3321 },
  { id: 'atlanta', city: 'Atlanta', state: 'GA', areaCode: '404', label: 'Atlanta (404)', lat: 33.749, lng: -84.388 },
];

export const JAM_PREFERENCES = [
  'Drummers',
  'Guitarists',
  'Bassists',
  'Vocalists',
  'Keys & Synth',
  'Horns & Strings',
  'Songwriters',
] as const;

export const GIGS_PREFERENCES = [
  'Bands for hire',
  'Open venue slots',
  'Paid guarantee',
  'Acoustic & patio',
  'Club & loud bills',
] as const;
