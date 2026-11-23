import type { CSSProperties } from 'react';
import type { InstrumentId } from '../types';

export const INSTRUMENT_META: Record<
  InstrumentId,
  {
    label: string;
    shortLabel: string;
    color: string;
    bg: string;
    border: string;
  }
> = {
  guitar: {
    label: 'Guitar',
    shortLabel: 'Guitar',
    color: '#fb923c',
    bg: 'rgba(38, 22, 12, 0.86)',
    border: 'rgba(251, 146, 60, 0.45)',
  },
  bass: {
    label: 'Bass',
    shortLabel: 'Bass',
    color: '#38bdf8',
    bg: 'rgba(10, 28, 42, 0.86)',
    border: 'rgba(56, 189, 248, 0.45)',
  },
  drums: {
    label: 'Drums',
    shortLabel: 'Drums',
    color: '#ff4d79',
    bg: 'rgba(42, 12, 22, 0.86)',
    border: 'rgba(255, 77, 121, 0.45)',
  },
  vocals: {
    label: 'Vocals',
    shortLabel: 'Vocals',
    color: '#f472b6',
    bg: 'rgba(40, 14, 30, 0.86)',
    border: 'rgba(244, 114, 182, 0.45)',
  },
  keys: {
    label: 'Keys & Piano',
    shortLabel: 'Keys',
    color: '#facc15',
    bg: 'rgba(36, 30, 10, 0.86)',
    border: 'rgba(250, 204, 21, 0.45)',
  },
  synth: {
    label: 'Synth & Electronic',
    shortLabel: 'Synth',
    color: '#c084fc',
    bg: 'rgba(30, 16, 44, 0.86)',
    border: 'rgba(192, 132, 252, 0.45)',
  },
  horns: {
    label: 'Horns & Brass',
    shortLabel: 'Horns',
    color: '#fbbf24',
    bg: 'rgba(38, 28, 10, 0.86)',
    border: 'rgba(251, 191, 36, 0.45)',
  },
  strings: {
    label: 'Strings & Cello',
    shortLabel: 'Strings',
    color: '#fda4af',
    bg: 'rgba(42, 16, 24, 0.86)',
    border: 'rgba(253, 164, 175, 0.45)',
  },
  producer: {
    label: 'Studio & Production',
    shortLabel: 'Studio',
    color: '#2dd4bf',
    bg: 'rgba(10, 34, 32, 0.86)',
    border: 'rgba(45, 212, 191, 0.45)',
  },
  band: {
    label: 'Full Band / Stage',
    shortLabel: 'Band',
    color: '#34d399',
    bg: 'rgba(10, 34, 24, 0.86)',
    border: 'rgba(52, 211, 153, 0.45)',
  },
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
            d="M16.2 8.8l1.2 1.2a3.6 3.6 0 0 1-.4 5.4l-2.2 1.6a4.4 4.4 0 0 1-6-.4l-1.4-1.4a4.4 4.4 0 0 1-.4-6l1.6-2.2a3.6 3.6 0 0 1 5.4-.4l1.2 1.2Zm-5.5 3.9a1.5 1.5 0 1 0 2.1 2.1 1.5 1.5 0 0 0-2.1-2.1Z"
            fill="currentColor"
            fillOpacity="0.24"
            fillRule="evenodd"
          />
          <path
            d="m19.8 3.2 1 1-4.6 4.6 1.2 1.2a3.6 3.6 0 0 1-.4 5.4l-2.2 1.6a4.4 4.4 0 0 1-6-.4l-1.4-1.4a4.4 4.4 0 0 1-.4-6l1.6-2.2a3.6 3.6 0 0 1 5.4-.4l1.2 1.2 4.6-4.6Zm-9.1 9.5a1.5 1.5 0 1 0 2.1 2.1 1.5 1.5 0 0 0-2.1-2.1Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* 4-String Bass */}
        <symbol id="aj-inst-bass" viewBox="0 0 24 24">
          <path
            d="M7.5 11.2a4.6 4.6 0 0 0-3 6.9l1.4 1.4a4.6 4.6 0 0 0 6.9-3c.5-1.5 1.2-2.6 2-3.5l-3.8-3.8c-.9.8-2 1.5-3.5 2Z"
            fill="currentColor"
            fillOpacity="0.25"
          />
          <path
            d="M20 3.5 13 10.5m5.5-7 1.8.2-.2 1.8M7.5 11.2a4.6 4.6 0 0 0-3 6.9l1.4 1.4a4.6 4.6 0 0 0 6.9-3c.5-1.5 1.2-2.6 2-3.5l-3.8-3.8c-.9.8-2 1.5-3.5 2Zm.5 4.8 1.5 1.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Drum Kit & Sticks */}
        <symbol id="aj-inst-drums" viewBox="0 0 24 24">
          <path
            d="M4 11.5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z"
            fill="currentColor"
            fillOpacity="0.16"
          />
          <path
            d="M4 11.5c0 1.7 3.6 3 8 3s8-1.3 8-3v5.5c0 1.7-3.6 3-8 3s-8-1.3-8-3v-5.5Z"
            fill="currentColor"
            fillOpacity="0.3"
          />
          <path
            d="M4 11.5c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Zm0 0v5.5c0 1.7 3.6 3 8 3s8-1.3 8-3v-5.5M5 4.5l5.5 4M19 4.5l-5.5 4M8.5 14.2v4.8m7-4.8v4.8"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Stage / Studio Microphone */}
        <symbol id="aj-inst-vocals" viewBox="0 0 24 24">
          <path
            d="M12 3a3.2 3.2 0 0 0-3.2 3.2v5a3.2 3.2 0 0 0 6.4 0v-5A3.2 3.2 0 0 0 12 3Z"
            fill="currentColor"
            fillOpacity="0.28"
          />
          <path
            d="M12 3a3.2 3.2 0 0 0-3.2 3.2v5a3.2 3.2 0 0 0 6.4 0v-5A3.2 3.2 0 0 0 12 3Zm-6 8.2a6 6 0 0 0 12 0M12 17.2v3.8m-3.5 0h7"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Keys / Piano */}
        <symbol id="aj-inst-keys" viewBox="0 0 24 24">
          <rect
            x="3.5"
            y="5"
            width="17"
            height="14"
            rx="1.5"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <path
            d="M7.2 5h1.6v8H7.2Zm4 0h1.6v8h-1.6Zm4 0h1.6v8h-1.6Z"
            fill="currentColor"
            fillOpacity="0.42"
          />
          <path
            d="M3.5 6.5A1.5 1.5 0 0 1 5 5h14a1.5 1.5 0 0 1 1.5 1.5v11A1.5 1.5 0 0 1 19 19H5a1.5 1.5 0 0 1-1.5-1.5v-11ZM8 5v8.5M12 5v8.5M16 5v8.5M9.5 19v-5.5M14.5 19v-5.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Analog Synth / Waveform */}
        <symbol id="aj-inst-synth" viewBox="0 0 24 24">
          <rect
            x="3.5"
            y="4.5"
            width="17"
            height="15"
            rx="1.5"
            fill="currentColor"
            fillOpacity="0.22"
          />
          <path
            d="M3.5 6A1.5 1.5 0 0 1 5 4.5h14A1.5 1.5 0 0 1 20.5 6v12a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18V6Zm2.5 5h2l2-3.5 3 7 2-3.5h3M7 16.2h.01M10.5 16.2h.01M17 16.2h.01"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Horns / Saxophone */}
        <symbol id="aj-inst-horns" viewBox="0 0 24 24">
          <path
            d="M6.5 4.5h3l1 9.5a3 3 0 0 0 6 0l.5-2.5H20l-1 4.5a5.5 5.5 0 0 1-11 .2L6.5 4.5Z"
            fill="currentColor"
            fillOpacity="0.26"
          />
          <path
            d="M6.5 4.5h3l1 9.5a3 3 0 0 0 6 0l.5-2.5H20l-1 4.5a5.5 5.5 0 0 1-11 .2L6.5 4.5Zm0 0H4.5M10 9.5h2m-1.5 3h2"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Strings / Cello */}
        <symbol id="aj-inst-strings" viewBox="0 0 24 24">
          <path
            d="M9 9.5c0-1.6 1.3-2.5 3-2.5s3 .9 3 2.5c0 1.1-.8 1.7-.8 2.5s1.8 1.5 1.8 3.8A4 4 0 0 1 12 20a4 4 0 0 1-4-4.2c0-2.3 1.8-3 1.8-3.8s-.8-1.4-.8-2.5Z"
            fill="currentColor"
            fillOpacity="0.26"
          />
          <path
            d="M12 3v4m-1.5-3h3M9 9.5c0-1.6 1.3-2.5 3-2.5s3 .9 3 2.5c0 1.1-.8 1.7-.8 2.5s1.8 1.5 1.8 3.8A4 4 0 0 1 12 20a4 4 0 0 1-4-4.2c0-2.3 1.8-3 1.8-3.8s-.8-1.4-.8-2.5Zm3 1.5v5.5m-1.5 0h3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Studio / Mixer Faders */}
        <symbol id="aj-inst-producer" viewBox="0 0 24 24">
          <rect
            x="4.25"
            y="7.4"
            width="3.5"
            height="3.2"
            rx="0.9"
            fill="currentColor"
            fillOpacity="0.32"
          />
          <rect
            x="10.25"
            y="13.4"
            width="3.5"
            height="3.2"
            rx="0.9"
            fill="currentColor"
            fillOpacity="0.32"
          />
          <rect
            x="16.25"
            y="6.4"
            width="3.5"
            height="3.2"
            rx="0.9"
            fill="currentColor"
            fillOpacity="0.32"
          />
          <path
            d="M6 4v16m6-16v16m6-16v16M4 9h4m2 6h4m2-7h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </symbol>

        {/* Band / Stage PA */}
        <symbol id="aj-inst-band" viewBox="0 0 24 24">
          <rect
            x="4.5"
            y="4"
            width="15"
            height="16"
            rx="1.5"
            fill="currentColor"
            fillOpacity="0.18"
          />
          <circle cx="12" cy="13.3" r="3.2" fill="currentColor" fillOpacity="0.28" />
          <path
            d="M4.5 5.5A1.5 1.5 0 0 1 6 4h12a1.5 1.5 0 0 1 1.5 1.5v13A1.5 1.5 0 0 1 18 20H6a1.5 1.5 0 0 1-1.5-1.5v-13ZM12 8.5a1 1 0 1 0 0-2 1 1 0 0 0 0 2Zm0 8a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
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
  style?: CSSProperties;
  label?: string;
}

export function InstrumentIcon({
  id,
  size = 20,
  className = '',
  style,
  label,
}: InstrumentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      style={style}
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
    <div className="flex flex-wrap items-center gap-2">
      {visible.map((id) => {
        const meta = INSTRUMENT_META[id];
        return (
          <span
            key={id}
            style={{
              backgroundColor: 'var(--inst-bg)',
              borderColor: 'var(--inst-border)',
              color: 'var(--inst-ink)',
            }}
            className={
              compact
                ? `inst-${id} inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold backdrop-blur-xs shadow-xs`
                : `inst-${id} inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold backdrop-blur-xs shadow-xs`
            }
          >
            <InstrumentIcon
              id={id}
              size={compact ? 20 : 24}
              style={{ color: 'var(--inst-color)' }}
            />
            <span>{compact ? meta.shortLabel : meta.label}</span>
          </span>
        );
      })}
    </div>
  );
}
