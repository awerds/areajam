import type { Region } from '../types';

export const PILOT_REGION_ID = 'nashville';

export const STARTER_REGIONS: Region[] = [
  { id: 'nashville', city: 'Nashville', state: 'TN', areaCode: '615', label: 'Nashville (615)', lat: 36.1627, lng: -86.7816, isPilot: true },
  { id: 'austin', city: 'Austin', state: 'TX', areaCode: '512', label: 'Austin (512)', lat: 30.2672, lng: -97.7431 },
  { id: 'nyc', city: 'New York', state: 'NY', areaCode: '718', label: 'NYC / BK (718)', lat: 40.7128, lng: -74.006 },
  { id: 'la', city: 'Los Angeles', state: 'CA', areaCode: '213', label: 'Los Angeles (213)', lat: 34.0522, lng: -118.2437 },
  { id: 'chicago', city: 'Chicago', state: 'IL', areaCode: '312', label: 'Chicago (312)', lat: 41.8781, lng: -87.6298 },
  { id: 'portland', city: 'Portland', state: 'OR', areaCode: '503', label: 'Portland (503)', lat: 45.5152, lng: -122.6784 },
  { id: 'seattle', city: 'Seattle', state: 'WA', areaCode: '206', label: 'Seattle (206)', lat: 47.6062, lng: -122.3321 },
  { id: 'atlanta', city: 'Atlanta', state: 'GA', areaCode: '404', label: 'Atlanta (404)', lat: 33.749, lng: -84.388 },
];

/** Complete US state + DC directory so musicians anywhere can browse, post, or filter nationwide. */
export const ALL_US_STATE_REGIONS: Region[] = [
  { id: 'birmingham-al', city: 'Birmingham', state: 'AL', areaCode: '205', label: 'Birmingham, AL (205)' },
  { id: 'anchorage-ak', city: 'Anchorage', state: 'AK', areaCode: '907', label: 'Anchorage, AK (907)' },
  { id: 'phoenix-az', city: 'Phoenix', state: 'AZ', areaCode: '602', label: 'Phoenix, AZ (602)' },
  { id: 'little-rock-ar', city: 'Little Rock', state: 'AR', areaCode: '501', label: 'Little Rock, AR (501)' },
  { id: 'denver-co', city: 'Denver', state: 'CO', areaCode: '303', label: 'Denver, CO (303)' },
  { id: 'new-haven-ct', city: 'New Haven', state: 'CT', areaCode: '203', label: 'New Haven, CT (203)' },
  { id: 'wilmington-de', city: 'Wilmington', state: 'DE', areaCode: '302', label: 'Wilmington, DE (302)' },
  { id: 'washington-dc', city: 'Washington', state: 'DC', areaCode: '202', label: 'Washington, DC (202)' },
  { id: 'miami-fl', city: 'Miami', state: 'FL', areaCode: '305', label: 'Miami, FL (305)' },
  { id: 'honolulu-hi', city: 'Honolulu', state: 'HI', areaCode: '808', label: 'Honolulu, HI (808)' },
  { id: 'boise-id', city: 'Boise', state: 'ID', areaCode: '208', label: 'Boise, ID (208)' },
  { id: 'indianapolis-in', city: 'Indianapolis', state: 'IN', areaCode: '317', label: 'Indianapolis, IN (317)' },
  { id: 'des-moines-ia', city: 'Des Moines', state: 'IA', areaCode: '515', label: 'Des Moines, IA (515)' },
  { id: 'wichita-ks', city: 'Wichita', state: 'KS', areaCode: '316', label: 'Wichita, KS (316)' },
  { id: 'louisville-ky', city: 'Louisville', state: 'KY', areaCode: '502', label: 'Louisville, KY (502)' },
  { id: 'new-orleans-la', city: 'New Orleans', state: 'LA', areaCode: '504', label: 'New Orleans, LA (504)' },
  { id: 'portland-me', city: 'Portland', state: 'ME', areaCode: '207', label: 'Portland, ME (207)' },
  { id: 'baltimore-md', city: 'Baltimore', state: 'MD', areaCode: '410', label: 'Baltimore, MD (410)' },
  { id: 'boston-ma', city: 'Boston', state: 'MA', areaCode: '617', label: 'Boston, MA (617)' },
  { id: 'detroit-mi', city: 'Detroit', state: 'MI', areaCode: '313', label: 'Detroit, MI (313)' },
  { id: 'minneapolis-mn', city: 'Minneapolis', state: 'MN', areaCode: '612', label: 'Minneapolis, MN (612)' },
  { id: 'jackson-ms', city: 'Jackson', state: 'MS', areaCode: '601', label: 'Jackson, MS (601)' },
  { id: 'kansas-city-mo', city: 'Kansas City', state: 'MO', areaCode: '816', label: 'Kansas City, MO (816)' },
  { id: 'bozeman-mt', city: 'Bozeman', state: 'MT', areaCode: '406', label: 'Bozeman, MT (406)' },
  { id: 'omaha-ne', city: 'Omaha', state: 'NE', areaCode: '402', label: 'Omaha, NE (402)' },
  { id: 'las-vegas-nv', city: 'Las Vegas', state: 'NV', areaCode: '702', label: 'Las Vegas, NV (702)' },
  { id: 'manchester-nh', city: 'Manchester', state: 'NH', areaCode: '603', label: 'Manchester, NH (603)' },
  { id: 'asbury-park-nj', city: 'Asbury Park', state: 'NJ', areaCode: '732', label: 'Asbury Park, NJ (732)' },
  { id: 'albuquerque-nm', city: 'Albuquerque', state: 'NM', areaCode: '505', label: 'Albuquerque, NM (505)' },
  { id: 'asheville-nc', city: 'Asheville', state: 'NC', areaCode: '828', label: 'Asheville, NC (828)' },
  { id: 'fargo-nd', city: 'Fargo', state: 'ND', areaCode: '701', label: 'Fargo, ND (701)' },
  { id: 'columbus-oh', city: 'Columbus', state: 'OH', areaCode: '614', label: 'Columbus, OH (614)' },
  { id: 'oklahoma-city-ok', city: 'Oklahoma City', state: 'OK', areaCode: '405', label: 'Oklahoma City, OK (405)' },
  { id: 'philadelphia-pa', city: 'Philadelphia', state: 'PA', areaCode: '215', label: 'Philadelphia, PA (215)' },
  { id: 'providence-ri', city: 'Providence', state: 'RI', areaCode: '401', label: 'Providence, RI (401)' },
  { id: 'charleston-sc', city: 'Charleston', state: 'SC', areaCode: '843', label: 'Charleston, SC (843)' },
  { id: 'sioux-falls-sd', city: 'Sioux Falls', state: 'SD', areaCode: '605', label: 'Sioux Falls, SD (605)' },
  { id: 'salt-lake-city-ut', city: 'Salt Lake City', state: 'UT', areaCode: '801', label: 'Salt Lake City, UT (801)' },
  { id: 'burlington-vt', city: 'Burlington', state: 'VT', areaCode: '802', label: 'Burlington, VT (802)' },
  { id: 'richmond-va', city: 'Richmond', state: 'VA', areaCode: '804', label: 'Richmond, VA (804)' },
  { id: 'charleston-wv', city: 'Charleston', state: 'WV', areaCode: '304', label: 'Charleston, WV (304)' },
  { id: 'milwaukee-wi', city: 'Milwaukee', state: 'WI', areaCode: '414', label: 'Milwaukee, WI (414)' },
  { id: 'laramie-wy', city: 'Laramie', state: 'WY', areaCode: '307', label: 'Laramie, WY (307)' },
];

export const DEFAULT_ALL_REGIONS: Region[] = [...STARTER_REGIONS, ...ALL_US_STATE_REGIONS];

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
