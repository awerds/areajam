import type { Listing } from '../types';

interface CardArtworkProps {
  listing: Listing;
  areaCode?: string;
  compact?: boolean;
}

const STAGE_PALETTES = [
  { base: '#120912', primary: '#ff3b6b', secondary: '#ff8a5b', rim: '#60a5fa' },
  { base: '#071412', primary: '#10e88a', secondary: '#2dd4bf', rim: '#818cf8' },
  { base: '#0b0d1f', primary: '#6366f1', secondary: '#ec4899', rim: '#38bdf8' },
  { base: '#160e08', primary: '#f59e0b', secondary: '#ff3b6b', rim: '#fde68a' },
  { base: '#091124', primary: '#3b82f6', secondary: '#10e88a', rim: '#c084fc' },
  { base: '#17090e', primary: '#fb7185', secondary: '#a855f7', rim: '#fda4af' },
];

export function CardArtwork({ listing, areaCode, compact = false }: CardArtworkProps) {
  const palette = STAGE_PALETTES[Math.abs(listing.visualSeed) % STAGE_PALETTES.length];
  const motif = Math.abs(listing.visualSeed) % 4;
  const sideLabel =
    listing.side === 'jam'
      ? 'Jam session'
      : listing.gigSubtype === 'open-gig'
        ? 'Open gig slot'
        : 'Band for hire';

  const glowColor = listing.side === 'jam' ? palette.primary : palette.secondary;

  return (
    <div
      className={
        compact
          ? 'relative h-44 w-full overflow-hidden rounded-2xl'
          : 'pointer-events-none absolute inset-0 overflow-hidden'
      }
      style={{ backgroundColor: palette.base }}
    >
      <svg
        viewBox="0 0 400 560"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`mesh-a-${listing.id}`} cx="78%" cy="18%" r="65%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.52" />
            <stop offset="100%" stopColor={palette.base} stopOpacity="0" />
          </radialGradient>
          <radialGradient id={`mesh-b-${listing.id}`} cx="18%" cy="56%" r="60%">
            <stop offset="0%" stopColor={palette.rim} stopOpacity="0.28" />
            <stop offset="100%" stopColor={palette.base} stopOpacity="0" />
          </radialGradient>
          <filter id={`grain-${listing.id}`}>
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
          </filter>
        </defs>

        <rect width="400" height="560" fill={palette.base} />
        <rect width="400" height="560" fill={`url(#mesh-a-${listing.id})`} />
        <rect width="400" height="560" fill={`url(#mesh-b-${listing.id})`} />

        {motif === 0 && (
          <g fill="none">
            {[74, 108, 142, 176, 210, 244].map((r, i) => (
              <circle
                key={r}
                cx="265"
                cy="185"
                r={r}
                stroke={i % 2 === 0 ? '#ffffff' : glowColor}
                strokeOpacity={0.09 + (i % 3) * 0.05}
                strokeWidth={i === 2 ? 2.5 : 1.2}
              />
            ))}
            <circle cx="265" cy="185" r="34" fill={glowColor} fillOpacity="0.88" />
            <circle cx="265" cy="185" r="9" fill={palette.base} />
          </g>
        )}

        {motif === 1 && (
          <g fill="none" strokeLinecap="round">
            <path
              d="M-20 190 Q 60 110, 140 195 T 300 175 T 430 140"
              stroke={glowColor}
              strokeWidth="4"
              strokeOpacity="0.72"
            />
            <path
              d="M-20 225 Q 75 155, 165 230 T 320 215 T 430 180"
              stroke={palette.rim}
              strokeWidth="2.5"
              strokeOpacity="0.52"
            />
            <path
              d="M-20 265 Q 90 215, 185 270 T 340 255 T 430 230"
              stroke="#ffffff"
              strokeWidth="1.4"
              strokeOpacity="0.22"
            />
          </g>
        )}

        {motif === 2 && (
          <g opacity="0.78">
            {Array.from({ length: 12 }).map((_, idx) => {
              const h = 42 + ((listing.visualSeed * (idx + 3) * 23) % 165);
              return (
                <rect
                  key={idx}
                  x={28 + idx * 30}
                  y={290 - h}
                  width="14"
                  height={h}
                  rx="7"
                  fill={idx % 3 === 0 ? glowColor : idx % 3 === 1 ? palette.rim : '#ffffff'}
                  fillOpacity={idx % 3 === 2 ? 0.16 : 0.62}
                />
              );
            })}
          </g>
        )}

        {motif === 3 && (
          <g>
            <polygon points="210,-10 70,380 350,380" fill={glowColor} fillOpacity="0.14" />
            <polygon points="310,-10 175,380 420,380" fill={palette.rim} fillOpacity="0.1" />
            {Array.from({ length: 6 }).map((_, row) =>
              Array.from({ length: 8 }).map((__, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={46 + col * 44}
                  cy={68 + row * 44}
                  r={(row + col + listing.visualSeed) % 5 === 0 ? 5.5 : 2.2}
                  fill={(row + col) % 3 === 0 ? glowColor : '#ffffff'}
                  fillOpacity={(row + col + listing.visualSeed) % 5 === 0 ? 0.72 : 0.16}
                />
              ))
            )}
          </g>
        )}

        {/* Fine studio grain */}
        <rect width="400" height="560" filter={`url(#grain-${listing.id})`} opacity="0.045" />
      </svg>

      {/* Smooth velvet scrim for effortless typography contrast */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: compact
            ? 'linear-gradient(180deg, rgba(7,8,13,0.18) 0%, rgba(7,8,13,0.72) 100%)'
            : 'linear-gradient(180deg, rgba(7,8,13,0.28) 0%, rgba(7,8,13,0.12) 32%, rgba(7,8,13,0.82) 64%, rgba(7,8,13,0.96) 100%)',
        }}
      />

      {/* Top floating glass metadata badges */}
      <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
          <span
            className="h-2 w-2 rounded-full"
            style={{
              backgroundColor: listing.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
              boxShadow:
                listing.side === 'jam'
                  ? '0 0 10px var(--jam)'
                  : '0 0 10px var(--gigs)',
            }}
          />
          {sideLabel}
        </span>

        {listing.payOrSplit ? (
          <span className="max-w-[52%] truncate rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            {listing.payOrSplit}
          </span>
        ) : (
          <span className="max-w-[52%] truncate rounded-full border border-white/15 bg-black/45 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md">
            {listing.neighborhood}
            {areaCode ? `, ${areaCode}` : ''}
          </span>
        )}
      </div>
    </div>
  );
}
