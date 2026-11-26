import { useEffect, useState } from 'react';
import { AlertCircle, Check, ChevronDown, MapPin, Navigation, Plus, Search } from 'lucide-react';
import { ALL_US_STATE_REGIONS, STARTER_REGIONS } from '../data/regions';
import { attachFormValidation } from '../lib/formValidation';
import type { Listing, Region } from '../types';
import { NativeDialog } from './NativeDialog';

interface RegionDialogProps {
  open: boolean;
  regions: Region[];
  currentRegionId: string;
  includeNearbyRegions: boolean;
  listings: Listing[];
  ipDetecting?: boolean;
  onDetectLocation?: () => void;
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
  ipDetecting = false,
  onDetectLocation,
  onClose,
  onSelectRegion,
  onToggleNearby,
  onAddCustomRegion,
}: RegionDialogProps) {
  const [search, setSearch] = useState('');
  const [showAllStates, setShowAllStates] = useState(false);
  const [city, setCity] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [areaCode, setAreaCode] = useState('');
  const [formNode, setFormNode] = useState<HTMLFormElement | null>(null);

  useEffect(() => {
    if (!open || !formNode) return;
    return attachFormValidation(formNode);
  }, [open, formNode]);

  const countLiveFor = (regionId: string) =>
    listings.filter((l) => l.regionId === regionId && l.side === 'jam').length;

  const q = search.trim().toLowerCase();
  const matchesQuery = (r: Region) =>
    !q ||
    `${r.city} ${r.state} ${r.areaCode} ${r.label} ${r.id}`.toLowerCase().includes(q);

  const starterIds = new Set(STARTER_REGIONS.map((r) => r.id));
  const stateIds = new Set(ALL_US_STATE_REGIONS.map((r) => r.id));
  const customRegions = regions.filter((r) => !starterIds.has(r.id) && !stateIds.has(r.id));

  const featuredRegions = [...STARTER_REGIONS, ...customRegions].filter(matchesQuery);

  const filteredStateRegions = ALL_US_STATE_REGIONS.filter(matchesQuery);
  const statesExpanded = Boolean(q) || showAllStates;

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

  const renderTile = (region: Region) => {
    const active = region.id === currentRegionId;
    const liveCount = countLiveFor(region.id);
    return (
      <button
        key={region.id}
        type="button"
        onClick={() => {
          onSelectRegion(region.id);
          onClose();
        }}
        className="flex items-center justify-between gap-2 rounded-2xl border px-3.5 py-2.5 text-left transition hover:bg-[var(--surface-hover)]"
        style={{
          borderColor: active ? 'var(--accent)' : 'var(--border)',
          backgroundColor: active ? 'var(--surface-hover)' : 'var(--surface-subtle)',
        }}
      >
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-[var(--muted)]" aria-hidden="true" />
            <span className="truncate text-sm font-semibold">{region.city}</span>
            {region.state && (
              <span className="text-xs text-[var(--muted)]">{region.state}</span>
            )}
          </div>
          <p className="mt-0.5 text-xs text-[var(--muted)]">
            {`Area ${region.areaCode || 'local'}, ${liveCount} ${liveCount === 1 ? 'player' : 'players'}`}
          </p>
        </div>
        {active && <Check className="h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />}
      </button>
    );
  };

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      titleId="region-dialog-title"
      title="Pick your city or state"
      subtitle="Switch to another city, browse by state, or add your town below"
    >
      <div className="space-y-4">
        <div className="relative">
          <label htmlFor="region-search-input" className="visually-hidden">
            Search US cities, states, or area codes
          </label>
          <Search
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]"
            aria-hidden="true"
          />
          <input
            id="region-search-input"
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search any US city, state, or area code..."
            className="field-control pl-10 text-sm"
          />
        </div>

        {onDetectLocation && (
          <button
            type="button"
            disabled={ipDetecting}
            onClick={onDetectLocation}
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)] disabled:opacity-60"
          >
            <Navigation className="h-3.5 w-3.5 text-[var(--accent-text)]" aria-hidden="true" />
            <span>{ipDetecting ? 'Detecting your city...' : 'Use my current city'}</span>
          </button>
        )}

        <label className="flex cursor-pointer items-center justify-between gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-4 py-3 text-sm">
          <div>
            <span className="block font-semibold text-[var(--ink)]">
              Show other cities after local cards
            </span>
            <span className="block text-xs text-[var(--muted)]">
              Keep discovering players nationwide when your local city board is quiet
            </span>
          </div>
          <input
            type="checkbox"
            checked={includeNearbyRegions}
            onChange={(e) => onToggleNearby(e.target.checked)}
            className="h-5 w-5 shrink-0"
          />
        </label>

        {featuredRegions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-[var(--muted)]">
              Featured music cities
            </p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {featuredRegions.map(renderTile)}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <button
            type="button"
            aria-expanded={statesExpanded}
            onClick={() => setShowAllStates((prev) => !prev)}
            className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] px-3.5 py-2 text-xs font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
          >
            <span>All 50 US states &amp; DC ({filteredStateRegions.length})</span>
            <ChevronDown
              className={`h-4 w-4 text-[var(--muted)] transition ${statesExpanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            />
          </button>

          {statesExpanded && (
            filteredStateRegions.length > 0 ? (
              <div className="grid max-h-60 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2 app-scroll">
                {filteredStateRegions.map(renderTile)}
              </div>
            ) : (
              <p className="text-xs text-[var(--muted)]">
                No matching state board. Add your exact city below.
              </p>
            )
          )}
        </div>

        <form
          ref={setFormNode}
          onSubmit={handleSubmit}
          className="space-y-3 rounded-2xl border border-dashed border-[var(--border)] bg-[var(--surface-subtle)] p-4"
        >
          <h3 className="font-display text-base font-bold">Start a board in your town</h3>

          <div>
            <label htmlFor="custom-city" className="mb-1 block text-xs font-semibold">
              City name
            </label>
            <span id="custom-city-hint" className="mb-1.5 block text-xs text-[var(--muted)]">
              Example: Knoxville, Denton, Athens
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
              <span role="img" aria-label="Error" className="inline-flex shrink-0">
                <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>Enter a city name with at least 2 characters.</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label htmlFor="custom-state" className="mb-1 block text-xs font-semibold">
                State
              </label>
              <input
                id="custom-state"
                type="text"
                maxLength={8}
                value={stateCode}
                onChange={(e) => setStateCode(e.target.value)}
                placeholder="TN"
                className="field-control"
              />
            </div>

            <div>
              <label htmlFor="custom-area" className="mb-1 block text-xs font-semibold">
                Area code
              </label>
              <input
                id="custom-area"
                type="text"
                inputMode="numeric"
                pattern="[0-9]{3}"
                value={areaCode}
                onChange={(e) => setAreaCode(e.target.value)}
                data-error="custom-area-error"
                placeholder="615"
                className="field-control"
              />
              <div id="custom-area-error" className="error-msg">
                <span role="img" aria-label="Error" className="inline-flex shrink-0">
                  <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
                <span>3 digits or leave blank.</span>
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-2.5 text-sm font-semibold transition hover:bg-[var(--surface-hover)]"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            <span>Open board for this city</span>
          </button>
        </form>
      </div>
    </NativeDialog>
  );
}
