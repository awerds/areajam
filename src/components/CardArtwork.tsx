import type { Listing } from '../types';

interface CardArtworkProps {
  listing: Listing;
  areaCode?: string;
  compact?: boolean;
  showTopBadges?: boolean;
}

export function CardArtwork({
  listing,
  areaCode,
  compact = false,
  showTopBadges = true,
}: CardArtworkProps) {
  const paletteIdx = Math.abs(listing.visualSeed) % 6;
  const motif = Math.abs(listing.visualSeed) % 4;
  const sideLabel =
    listing.side === 'jam'
      ? 'Jam session'
      : listing.gigSubtype === 'open-gig'
        ? 'Open gig slot'
        : 'Band for hire';

  const glowVar = listing.side === 'jam' ? 'var(--art-primary)' : 'var(--art-secondary)';
  const hasPortrait = Boolean(listing.portraitUrl);

  return (
    <div
      className={
        compact
          ? `card-art-${paletteIdx} reel-aspect relative w-full overflow-hidden`
          : `card-art-${paletteIdx} pointer-events-none absolute inset-0 overflow-hidden`
      }
      style={{ backgroundColor: 'var(--art-base)' }}
    >
      {listing.portraitUrl ? (
        <img
          src={listing.portraitUrl}
          alt={listing.portraitAlt || listing.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover object-[50%_20%]"
        />
      ) : (
        <svg
          viewBox="0 0 400 560"
          preserveAspectRatio="xMidYMid slice"
          className="h-full w-full"
          aria-hidden="true"
        >
          <defs>
            <radialGradient id={`mesh-a-${listing.id}`} cx="78%" cy="18%" r="65%">
              <stop offset="0%" style={{ stopColor: glowVar }} stopOpacity="0.46" />
              <stop offset="100%" style={{ stopColor: 'var(--art-base)' }} stopOpacity="0" />
            </radialGradient>
            <radialGradient id={`mesh-b-${listing.id}`} cx="18%" cy="56%" r="60%">
              <stop offset="0%" style={{ stopColor: 'var(--art-rim)' }} stopOpacity="0.26" />
              <stop offset="100%" style={{ stopColor: 'var(--art-base)' }} stopOpacity="0" />
            </radialGradient>
            <filter id={`grain-${listing.id}`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="2" stitchTiles="stitch" />
            </filter>
          </defs>

          <rect width="400" height="560" style={{ fill: 'var(--art-base)' }} />
          <rect width="400" height="560" fill={`url(#mesh-a-${listing.id})`} />
          <rect width="400" height="560" fill={`url(#mesh-b-${listing.id})`} />

          {motif === 0 && (
            <g fill="none">
              {[120, 185, 250, 315, 380, 445].map((r, i) => (
                <circle
                  key={r}
                  cx="325"
                  cy="390"
                  r={r}
                  style={{ stroke: i % 2 === 0 ? glowVar : 'var(--art-ring)' }}
                  strokeOpacity={i % 2 === 0 ? 0.24 : 0.14}
                  strokeWidth={i === 2 ? 2.2 : 1.4}
                />
              ))}
              <circle cx="215" cy="185" r="54" style={{ stroke: glowVar }} strokeOpacity="0.28" strokeWidth="1.6" />
              <circle cx="215" cy="185" r="32" style={{ fill: glowVar }} fillOpacity="0.88" />
              <circle cx="215" cy="185" r="9" style={{ fill: 'var(--art-base)' }} />
            </g>
          )}

          {motif === 1 && (
            <g fill="none" strokeLinecap="round">
              <path
                d="M-20 190 Q 60 110, 140 195 T 300 175 T 430 140"
                style={{ stroke: glowVar }}
                strokeWidth="4"
                strokeOpacity="0.72"
              />
              <path
                d="M-20 225 Q 75 155, 165 230 T 320 215 T 430 180"
                style={{ stroke: 'var(--art-rim)' }}
                strokeWidth="2.5"
                strokeOpacity="0.52"
              />
              <path
                d="M-20 265 Q 90 215, 185 270 T 340 255 T 430 230"
                style={{ stroke: 'var(--art-ring)' }}
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
                    style={{
                      fill:
                        idx % 3 === 0
                          ? glowVar
                          : idx % 3 === 1
                            ? 'var(--art-rim)'
                            : 'var(--art-ring)',
                    }}
                    fillOpacity={idx % 3 === 2 ? 0.16 : 0.62}
                  />
                );
              })}
            </g>
          )}

          {motif === 3 && (
            <g>
              <polygon points="210,-10 70,380 350,380" style={{ fill: glowVar }} fillOpacity="0.16" />
              <polygon
                points="310,-10 175,380 420,380"
                style={{ fill: 'var(--art-rim)' }}
                fillOpacity="0.12"
              />
              {Array.from({ length: 6 }).map((_, row) =>
                Array.from({ length: 8 }).map((__, col) => (
                  <circle
                    key={`${row}-${col}`}
                    cx={46 + col * 44}
                    cy={68 + row * 44}
                    r={(row + col + listing.visualSeed) % 5 === 0 ? 5.5 : 2.2}
                    style={{ fill: (row + col) % 3 === 0 ? glowVar : 'var(--art-ring)' }}
                    fillOpacity={(row + col + listing.visualSeed) % 5 === 0 ? 0.72 : 0.16}
                  />
                ))
              )}
            </g>
          )}

          {/* Fine studio grain */}
          <rect width="400" height="560" filter={`url(#grain-${listing.id})`} opacity="0.045" />
        </svg>
      )}

      {/* Theme-aware gentle edge scrim */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: hasPortrait
            ? 'linear-gradient(180deg, rgba(16,19,29,0.52) 0%, rgba(16,19,29,0) 42%, rgba(16,19,29,0.45) 100%)'
            : 'linear-gradient(180deg, var(--art-scrim-top) 0%, transparent 48%, var(--art-scrim-bottom) 100%)',
        }}
      />

      {/* Top floating glass metadata badges */}
      {showTopBadges && (
        <div className="pointer-events-none absolute inset-x-4 top-4 flex items-center justify-between gap-2">
          <span
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-md ${
              hasPortrait
                ? 'border-white/20 bg-black/60 text-white'
                : 'border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)]'
            }`}
          >
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
            <span
              className={`max-w-[52%] truncate rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md ${
                hasPortrait
                  ? 'border-white/20 bg-black/60 text-white'
                  : 'border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)]'
              }`}
            >
              {listing.payOrSplit}
            </span>
          ) : (
            <span
              className={`max-w-[52%] truncate rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md ${
                hasPortrait
                  ? 'border-white/20 bg-black/60 text-white'
                  : 'border-[var(--border)] bg-[var(--card-hud-bg)] text-[var(--ink)]'
              }`}
            >
              {listing.neighborhood}
              {areaCode ? `, ${areaCode}` : ''}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
