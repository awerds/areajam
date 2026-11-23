import { useEffect, useRef, useState } from 'react';
import { Check, MapPin, Plus } from 'lucide-react';
import { attachFormValidation } from '../lib/formValidation';
import type { Listing, Region } from '../types';
import { NativeDialog } from './NativeDialog';

interface RegionDialogProps {
  open: boolean;
  regions: Region[];
  currentRegionId: string;
  includeNearbyRegions: boolean;
  listings: Listing[];
  onClose: () => void;
  onSelectRegion: (regionId: string) => void;
  onToggleNearby: (next: boolean) => void;
  onAddCustomRegion: (city: string, state: string, areaCode: string) => void;
}

export function RegionDialog({
  open,
  regions,
  currentRegionId,
  includeNearbyRegions,
  listings,
  onClose,
  onSelectRegion,
  onToggleNearby,
  onAddCustomRegion,
}: RegionDialogProps) {
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!formRef.current) return;
    return attachFormValidation(formRef.current);
  }, [open]);

  const countFor = (regionId: string, side: 'jam' | 'gigs') =>
    listings.filter((l) => l.regionId === regionId && l.side === side).length;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!e.currentTarget.checkValidity()) {
      e.currentTarget.reportValidity();
      return;
    }
    onAddCustomRegion(city.trim(), stateCode.trim().toUpperCase(), areaCode.trim());
    setCity('');
    setStateCode('');
    setAreaCode('');
    e.currentTarget.reset();
    onClose();
  };

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      titleId="region-dialog-title"
      title="Pick Your Local Scene"
      eyebrow="REGIONAL BOARDS"
    >
      <div className="space-y-5">
        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-3 text-sm">
          <div>
            <span className="block font-semibold text-[var(--ink)]">
              Show other cities after local cards
            </span>
            <span className="block text-xs text-[var(--muted)]">
              Expand beyond your metro when the local deck empties
            </span>
          </div>
          <input
            type="checkbox"
            checked={includeNearbyRegions}
            onChange={(e) => onToggleNearby(e.target.checked)}
            className="h-5 w-5 shrink-0"
          />
        </label>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {regions.map((region) => {
            const active = region.id === currentRegionId;
            const jams = countFor(region.id, 'jam');
            const gigs = countFor(region.id, 'gigs');
            return (
              <button
                key={region.id}
                type="button"
                onClick={() => {
                  onSelectRegion(region.id);
                  onClose();
                }}
                className="flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-3 text-left transition"
                style={{
                  borderColor: active ? 'var(--accent)' : 'var(--border)',
                  backgroundColor: active ? 'var(--surface-2)' : 'transparent',
                }}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
                    <span className="truncate font-semibold">{region.city}</span>
                    {region.state && (
                      <span className="text-xs text-[var(--muted)]">{region.state}</span>
                    )}
                  </div>
                  <p className="font-mono-code mt-1 text-[11px] text-[var(--muted)]">
                    ({region.areaCode || 'LOC'}) · {jams} Jam · {gigs} Gigs
                  </p>
                </div>
                {active && <Check className="h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />}
              </button>
            );
          })}
        </div>

        <form
          ref={formRef}
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-dashed border-[var(--border)] p-4"
        >
          <h3 className="font-display text-sm font-bold">Don&apos;t see your city? Start a board</h3>

          <div>
            <label htmlFor="custom-city" className="mb-1 block text-xs font-semibold">
              City name
            </label>
            <span id="custom-city-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
              Example: Denver, Asheville, New Orleans
            </span>
            <input
              id="custom-city"
              type="text"
              required
              minLength={2}
              value={city}
              onChange={(e) => setCity(e.target.value)}
              aria-describedby="custom-city-hint"
              data-error="custom-city-error"
              placeholder="City name"
              className="field-control"
            />
            <div id="custom-city-error" className="error-msg">
              <span role="img" aria-label="Error">
                ⚠
              </span>{' '}
              Enter a city name with at least 2 characters.
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="custom-state" className="mb-1 block text-xs font-semibold">
                State / Region
              </label>
              <span id="custom-state-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                2-letter code (e.g. CO)
              </span>
              <input
                id="custom-state"
                type="text"
                maxLength={8}
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                aria-describedby="custom-state-hint"
                placeholder="CO"
                className="field-control"
              />
            </div>

            <div>
              <label htmlFor="custom-area" className="mb-1 block text-xs font-semibold">
                Area code
              </label>
              <span id="custom-area-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
                3 digits (e.g. 303)
              </span>
              <input
                id="custom-area"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{3}"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                aria-describedby="custom-area-hint"
                data-error="custom-area-error"
                placeholder="303"
                className="field-control font-mono-code"
              />
              <div id="custom-area-error" className="error-msg">
                <span role="img" aria-label="Error">
                  ⚠
                </span>{' '}
                Enter a 3-digit area code or leave blank.
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface-2)] px-4 py-2.5 text-sm font-semibold transition hover:opacity-85"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Create &amp; Switch to City</span>
          </button>
        </form>
      </div>
    </NativeDialog>
  );
}
