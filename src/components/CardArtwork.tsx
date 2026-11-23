import type { Listing } from '../types';

interface CardArtworkProps {
  listing: Listing;
  areaCode?: string;
  compact?: boolean;
}

const PALETTES = [
  { bg: '#161311', a: '#ff5c2b', b: '#f2ece1', c: '#5b94ff' },
  { bg: '#121622', a: '#5b94ff', b: '#f2ece1', c: '#ff7b54' },
  { bg: '#1b1418', a: '#f97316', b: '#fde68a', c: '#38bdf8' },
  { bg: '#111a17', a: '#3dd68c', b: '#f2ece1', c: '#ff5c2b' },
  { bg: '#1d1812', a: '#eab308', b: '#faf3e3', c: '#f97316' },
];

export function CardArtwork({ listing, areaCode, compact = false }: CardArtworkProps) {
  const palette = PALETTES[Math.abs(listing.visualSeed) % PALETTES.length];
  const motif = Math.abs(listing.visualSeed) % 4;
  const sideBadge =
    listing.side === 'jam'
      ? 'JAM / PLAYER'
      : listing.gigSubtype === 'open-gig'
        ? 'OPEN GIG SLOT'
        : 'BAND FOR HIRE';

  return (
    <div
      className={`relative w-full overflow-hidden ${compact ? 'h-40 rounded-2xl' : 'h-56 rounded-t-[1.35rem]'}`}
      style={{ backgroundColor: palette.bg }}
    >
      <svg
        viewBox="0 0 400 240"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden="true"
      >
        <defs>
          <radialGradient id={`glow-${listing.id}`} cx="78%" cy="24%" r="65%">
            <stop offset="0%" stopColor={listing.side === 'jam' ? palette.a : palette.c} stopOpacity="0.34" />
            <stop offset="100%" stopColor={palette.bg} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="400" height="240" fill={palette.bg} />
        <rect width="400" height="240" fill={`url(#glow-${listing.id})`} />

        {motif === 0 && (
          <g fill="none" opacity="0.72">
            {[42, 68, 94, 120, 146, 172].map((r, i) => (
              <circle
                key={r}
                cx="305"
                cy="120"
                r={r}
                stroke={i % 2 === 0 ? palette.b : palette.a}
                strokeOpacity={0.18 + (i % 3) * 0.08}
                strokeWidth={i === 1 ? 3 : 1.5}
              />
            ))}
            <circle cx="305" cy="120" r="24" fill={palette.a} fillOpacity="0.88" />
            <circle cx="305" cy="120" r="6" fill={palette.bg} />
          </g>
        )}

        {motif === 1 && (
          <g fill="none" strokeLinecap="round">
            <path
              d="M-10 140 Q 45 75, 100 135 T 210 120 T 320 138 T 420 105"
              stroke={palette.a}
              strokeWidth="4"
              strokeOpacity="0.8"
            />
            <path
              d="M-10 165 Q 55 110, 115 155 T 230 145 T 340 165 T 420 130"
              stroke={palette.c}
              strokeWidth="2.5"
              strokeOpacity="0.65"
            />
            <path
              d="M-10 190 Q 70 150, 130 185 T 250 175 T 360 192 T 420 160"
              stroke={palette.b}
              strokeWidth="1.5"
              strokeOpacity="0.3"
            />
          </g>
        )}

        {motif === 2 && (
          <g opacity="0.75">
            {Array.from({ length: 14 }).map((_, idx) => {
              const h = 28 + ((listing.visualSeed * (idx + 3) * 19) % 110);
              return (
                <rect
                  key={idx}
                  x={26 + idx * 25}
                  y={200 - h}
                  width="12"
                  height={h}
                  rx="6"
                  fill={idx % 3 === 0 ? palette.a : idx % 3 === 1 ? palette.c : palette.b}
                  fillOpacity={idx % 3 === 2 ? 0.25 : 0.72}
                />
              );
            })}
          </g>
        )}

        {motif === 3 && (
          <g>
            {Array.from({ length: 5 }).map((_, row) =>
              Array.from({ length: 9 }).map((__, col) => (
                <circle
                  key={`${row}-${col}`}
                  cx={36 + col * 42}
                  cy={38 + row * 42}
                  r={(row + col + listing.visualSeed) % 4 === 0 ? 7 : 3}
                  fill={(row + col) % 3 === 0 ? palette.a : palette.b}
                  fillOpacity={(row + col + listing.visualSeed) % 4 === 0 ? 0.85 : 0.18}
                />
              ))
            )}
          </g>
        )}

        <rect
          x="0"
          y="135"
          width="400"
          height="105"
          fill="url(#fade-bottom)"
          opacity="0"
        />
      </svg>

      {/* Top corner flyer stamps */}
      <div className="pointer-events-none absolute inset-x-3 top-3 flex items-center justify-between gap-2">
        <span
          className="font-mono-code rounded-full px-2.5 py-1 text-[11px] font-semibold tracking-wider"
          style={{
            backgroundColor: listing.side === 'jam' ? 'var(--jam)' : 'var(--gigs)',
            color: listing.side === 'jam' ? 'var(--jam-ink)' : 'var(--gigs-ink)',
          }}
        >
          {sideBadge}
        </span>

        {listing.payOrSplit ? (
          <span className="font-mono-code rounded-full border border-white/20 bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
            {listing.payOrSplit}
          </span>
        ) : (
          areaCode && (
            <span className="font-mono-code rounded-full border border-white/20 bg-black/65 px-2.5 py-1 text-[11px] font-medium text-white backdrop-blur-xs">
              AREA {areaCode}
            </span>
          )
        )}
      </div>

      {/* Bottom location strip */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-4 pb-3 pt-8">
        <div className="flex items-center justify-between gap-2 text-xs text-white/90">
          <span className="font-mono-code truncate uppercase tracking-wider">
            {listing.neighborhood}
          </span>
          {listing.isUserCreated && (
            <span className="font-mono-code rounded bg-white/15 px-1.5 py-0.5 text-[10px] uppercase tracking-wider">
              Your Post
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
