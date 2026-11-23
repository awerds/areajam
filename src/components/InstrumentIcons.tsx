import type { InstrumentId } from '../types';

export const INSTRUMENT_META: Record<
  InstrumentId,
  { label: string; shortLabel: string }
> = {
  guitar: { label: 'Guitar', shortLabel: 'Guitar' },
  bass: { label: 'Bass', shortLabel: 'Bass' },
  drums: { label: 'Drums', shortLabel: 'Drums' },
  vocals: { label: 'Vocals', shortLabel: 'Vocals' },
  keys: { label: 'Keys & Piano', shortLabel: 'Keys' },
  synth: { label: 'Synth & Electronic', shortLabel: 'Synth' },
  horns: { label: 'Horns & Brass', shortLabel: 'Horns' },
  strings: { label: 'Strings & Cello', shortLabel: 'Strings' },
  producer: { label: 'Studio & Production', shortLabel: 'Studio' },
  band: { label: 'Full Band / Stage', shortLabel: 'Band' },
};

export const ALL_INSTRUMENTS: InstrumentId[] = [
  'guitar',
  'bass',
  'drums',
  'vocals',
  'keys',
  'synth',
  'horns',
  'strings',
  'producer',
  'band',
];

export function InstrumentIconSprite() {
  return (
    <svg
      aria-hidden="true"
      width="0"
      height="0"
      style={{ position: 'absolute', overflow: 'hidden' }}
    >
      <defs>
        {/* Electric / Acoustic Guitar */}
        <symbol id="aj-inst-guitar" viewBox="0 0 24 24">
          <path
            d="m19.8 3.2 1 1-4.6 4.6 1.2 1.2a3.6 3.6 0 0 1-.4 5.4l-2.2 1.6a4.4 4.4 0 0 1-6-.4l-1.4-1.4a4.4 4.4 0 0 1-.4-6l1.6-2.2a3.6 3.6 0 0 1 5.4-.4l1.2 1.2 4.6-4.6Zm-9.1 9.5a1.5 1.5 0 1 0 2.1 2.1 1.5 1.5 0 0 0-2.1-2.1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* 4-String Bass */}
        <symbol id="aj-inst-bass" viewBox="0 0 24 24">
          <path
            d="M20 3.5 13 10.5m5.5-7 1.8.2-.2 1.8M7.5 11.2a4.6 4.6 0 0 0-3 6.9l1.4 1.4a4.6 4.6 0 0 0 6.9-3c.5-1.5 1.2-2.6 2-3.5l-3.8-3.8c-.9.8-2 1.5-3.5 2Zm.5 4.8 1.5 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Drum Kit & Sticks */}
        <symbol id="aj-inst-drums" viewBox="0 0 24 24">
          <path
            d="M4 11.5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v5.5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5.5M5 4.5l5.5 4M19 4.5l-5.5 4M8.5 14.2v4.8m7-4.8v4.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Stage / Studio Microphone */}
        <symbol id="aj-inst-vocals" viewBox="0 0 24 24">
          <path
            d="M12 3a3.2 3.2 0 0 0-3.2 3.2v5a3.2 3.2 0 0 0 6.4 0v-5A3.2 3.2 0 0 0 12 3Zm-6 8.2a6 6 0 0 0 12 0M12 17.2v3.8m-3.5 0h7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Keys / Piano */}
        <symbol id="aj-inst-keys" viewBox="0 0 24 24">
          <path
            d="M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-11ZM8 5v8.5M12 5v8.5M16 5v8.5M9.5 19v-5.5M14.5 19v-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Analog Synth / Waveform */}
        <symbol id="aj-inst-synth" viewBox="0 0 24 24">
          <path
            d="M3.5 6A1.5 1.5 0 0 1 5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6Zm2.5 5h2l2-3.5 3 7 2-3.5h3M7 16.2h.01M10.5 16.2h.01M17 16.2h.01"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Horns / Saxophone */}
        <symbol id="aj-inst-horns" viewBox="0 0 24 24">
          <path
            d="M6.5 4.5h3l1 9.5a3 3 0 0 0 6 0l.5-2.5H20l-1 4.5a5.5 5.5 0 0 1-11 .2L6.5 4.5Zm0 0H4.5M10 9.5h2m-1.5 3h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Strings / Cello */}
        <symbol id="aj-inst-strings" viewBox="0 0 24 24">
          <path
            d="M12 3v4m-1.5-3h3M9 9.5c0-1.6 1.3-2.5 3-2.5s3 .9 3 2.5c0 1.1-.8 1.7-.8 2.5s1.8 1.5 1.8 3.8A4 4 0 0 1 12 20a4 4 0 0 1-4-4.2c0-2.3 1.8-3 1.8-3.8s-.8-1.4-.8-2.5Zm3 1.5v5.5m-1.5 0h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Studio / Mixer Faders */}
        <symbol id="aj-inst-producer" viewBox="0 0 24 24">
          <path
            d="M6 4v16m6-16v16m6-16v16M4 9h4m2 6h4m2-7h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Band / Stage PA */}
        <symbol id="aj-inst-band" viewBox="0 0 24 24">
          <path
            d="M4.5 5.5A1.5 1.5 0 0 1 6 4h12a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-13ZM12 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 8a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>
      </defs>
    </svg>
  );
}

interface InstrumentIconProps {
  id: InstrumentId;
  size?: number;
  className?: string;
  label?: string;
}

export function InstrumentIcon({ id, size = 15, className = '', label }: InstrumentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      className={`shrink-0 ${className}`}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <use href={`#aj-inst-${id}`} />
    </svg>
  );
}

interface InstrumentBadgeRowProps {
  instruments: InstrumentId[];
  compact?: boolean;
  max?: number;
}

export function InstrumentBadgeRow({
  instruments,
  compact = false,
  max = 4,
}: InstrumentBadgeRowProps) {
  const visible = instruments.slice(0, max);
  if (visible.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {visible.map((id) => {
        const meta = INSTRUMENT_META[id];
        return (
          <span
            key={id}
            className={
              compact
                ? 'inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-xs'
                : 'inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-[var(--ink)]'
            }
          >
            <InstrumentIcon
              id={id}
              size={compact ? 14 : 16}
              className="text-[var(--accent)]"
            />
            <span>{compact ? meta.shortLabel : meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
