import type { Region } from '../types';

interface IpLookupResult {
  city: string;
  stateCode: string;
  lat: number;
  lng: number;
}

function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 3958.8;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

async function fetchJsonWithTimeout(url: string, timeoutMs = 4000): Promise<unknown> {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      referrerPolicy: 'no-referrer',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    window.clearTimeout(timer);
  }
}

async function lookupIpCoords(): Promise<IpLookupResult | null> {
  const primary = (await fetchJsonWithTimeout('https://ipwho.is/')) as Record<string, unknown> | null;
  if (
    primary &&
    primary.success === true &&
    typeof primary.city === 'string' &&
    typeof primary.latitude === 'number' &&
    typeof primary.longitude === 'number'
  ) {
    return {
      city: primary.city,
      stateCode:
        typeof primary.region_code === 'string'
          ? primary.region_code
          : typeof primary.region === 'string'
            ? primary.region
            : '',
      lat: primary.latitude,
      lng: primary.longitude,
    };
  }

  const fallback = (await fetchJsonWithTimeout('https://ipapi.co/json/')) as Record<string, unknown> | null;
  if (
    fallback &&
    typeof fallback.city === 'string' &&
    typeof fallback.latitude === 'number' &&
    typeof fallback.longitude === 'number'
  ) {
    return {
      city: fallback.city,
      stateCode:
        typeof fallback.region_code === 'string'
          ? fallback.region_code
          : typeof fallback.region === 'string'
            ? fallback.region
            : '',
      lat: fallback.latitude,
      lng: fallback.longitude,
    };
  }

  return null;
}

export async function detectLocationByIp(
  existingRegions: Region[]
): Promise<{ region: Region; created: boolean; detectedLabel: string } | null> {
  const ip = await lookupIpCoords();
  if (!ip) return null;

  const detectedLabel = ip.stateCode ? `${ip.city}, ${ip.stateCode}` : ip.city;

  let nearest: { region: Region; dist: number } | null = null;
  for (const r of existingRegions) {
    if (typeof r.lat !== 'number' || typeof r.lng !== 'number') continue;
    const dist = haversineMiles(ip.lat, ip.lng, r.lat, r.lng);
    if (!nearest || dist < nearest.dist) {
      nearest = { region: r, dist };
    }
  }

  if (nearest && nearest.dist <= 80) {
    return {
      region: nearest.region,
      created: false,
      detectedLabel,
    };
  }

  const slugBase = ip.city
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  const id = slugBase || `local-${Date.now()}`;

  const matchedById = existingRegions.find((r) => r.id === id);
  if (matchedById) {
    return {
      region: matchedById,
      created: false,
      detectedLabel,
    };
  }

  const customRegion: Region = {
    id,
    city: ip.city,
    state: ip.stateCode,
    areaCode: 'LOC',
    label: detectedLabel,
    lat: ip.lat,
    lng: ip.lng,
    isCustom: true,
  };

  return {
    region: customRegion,
    created: true,
    detectedLabel,
  };
}
