import { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, MapPin } from 'lucide-react';
import { AreaJamLogo } from './BrandLogo';
import { INSTRUMENT_META, InstrumentBadgeRow, InstrumentIconSprite } from './InstrumentIcons';
import data from '../data/sideStage.json';
import type { InstrumentId } from '../types';

type Character = Omit<(typeof data)[number], 'instrument'> & {
  instrument: InstrumentId[];
  youtubeId?: string;
};

const characters = data as Character[];
const cities = [...new Map(characters.map(({ cityId, city }) => [cityId, city])).entries()]
  .sort(([, first], [, second]) => first.localeCompare(second));
const url = (id = 'all', city = '') =>
  `./?side-stage=${encodeURIComponent(id)}${city ? `&city=${encodeURIComponent(city)}` : ''}`;
const portrait = (character: Character) =>
  `${import.meta.env.BASE_URL}side-stage/${character.cityId}/${character.id}.webp`;

function CharacterProfile({ character, returnCity }: { character: Character; returnCity: string }) {
  const videoId = /^[\w-]{11}$/.test(character.youtubeId ?? '') ? character.youtubeId : undefined;

  return (
    <>
      <a href={url('all', returnCity)} className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
        <ArrowLeft size={16} aria-hidden="true" />
        All characters
      </a>
      <article className="mt-5 grid items-start gap-6 md:grid-cols-[minmax(0,3fr)_minmax(0,4fr)] md:gap-9">
        <img
          src={portrait(character)}
          alt={character.portraitAlt}
          className="mx-auto block h-auto w-full max-w-md rounded-3xl border border-[var(--border)]"
        />
        <div className="glass-surface rounded-3xl border-t-4 p-6 md:p-9" style={{ borderTopColor: character.cityColor }}>
          <p className="text-xs font-bold uppercase tracking-wider text-[var(--accent-text)]">Fictional sample profile</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--ink)] md:text-5xl">{character.name}</h1>
          <p className="mt-2 text-lg text-[var(--muted)]">{character.tagline}</p>
          <p className="my-4 flex items-center gap-2 text-sm text-[var(--muted)]">
            <MapPin size={16} aria-hidden="true" />
            {character.neighborhood}, {character.city}, {character.state}
          </p>
          <InstrumentBadgeRow instruments={character.instrument} max={6} />
          <p className="mt-3 text-sm font-semibold text-[var(--muted)]">{character.genres.join(' · ')}</p>
          <p className="my-5 leading-relaxed text-[var(--ink)]">{character.bio}</p>
          <dl className="space-y-4 border-t border-[var(--border)] pt-5 text-sm">
            <div>
              <dt className="mb-1 font-bold text-[var(--ink)]">Gear</dt>
              <dd className="text-[var(--muted)]">{character.gear.join(' · ')}</dd>
            </div>
            <div>
              <dt className="mb-1 font-bold text-[var(--ink)]">Dream jam</dt>
              <dd className="text-[var(--muted)]">{character.lookingFor}</dd>
            </div>
            <div>
              <dt className="mb-1 font-bold text-[var(--ink)]">Usual hours</dt>
              <dd className="text-[var(--muted)]">{character.availability}</dd>
            </div>
          </dl>
        </div>
        {videoId && (
          <section className="md:col-start-2">
            <h2 className="mb-4 font-display text-xl font-bold text-[var(--ink)]">Watch the jam</h2>
            <iframe
              className="aspect-[9/16] w-full max-w-xs rounded-3xl"
              src={`https://www.youtube-nocookie.com/embed/${videoId}`}
              title={`${character.name} on AreaJam Side Stage`}
              loading="lazy"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
            />
          </section>
        )}
      </article>
    </>
  );
}

function CharacterGallery({ defaultCity }: { defaultCity: string }) {
  const [city, setCity] = useState(defaultCity);
  const [search, setSearch] = useState('');
  const query = search.trim().toLowerCase();
  const visible = characters.filter((character) =>
    (!city || city === character.cityId) &&
    (!query || [
      character.name, character.neighborhood, ...character.gear, ...character.genres,
      ...character.instrument.map((instrument) => INSTRUMENT_META[instrument].label),
    ].some((value) => value.toLowerCase().includes(query)))
  );

  return (
    <>
      <div className="mb-7 max-w-2xl">
        <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink)] md:text-6xl">Side Stage</h1>
        <p className="mt-3 text-base leading-relaxed text-[var(--muted)]">
          Meet AreaJam’s fictional musicians from five cities, with AI-generated portraits and custom rigs.
        </p>
      </div>
      <div className="mb-5 flex flex-wrap items-end gap-3">
        <label className="grid w-full gap-1.5 text-sm font-semibold text-[var(--ink)] sm:w-72">
          Search characters
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Name, instrument, or genre"
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2.5"
          />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold text-[var(--ink)]">
          City
          <select
            value={city}
            onChange={(event) => setCity(event.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--surface-solid)] px-3 py-2.5"
          >
            <option value="">All cities</option>
            {cities.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </select>
        </label>
        <p className="py-2.5 text-sm text-[var(--muted)]" role="status">
          {visible.length} {visible.length === 1 ? 'character' : 'characters'}
        </p>
      </div>

      {visible.length ? (
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-5 lg:grid-cols-4 xl:grid-cols-5">
          {visible.map((character) => (
            <li key={character.id} className="h-full">
              <a
                href={url(character.id, city)}
                className="glass-surface group flex h-full flex-col overflow-hidden rounded-2xl border transition hover:border-[var(--accent-text)]"
              >
                <div className="overflow-hidden bg-[var(--surface-solid)]">
                  <img
                    src={portrait(character)}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    className="aspect-[4/5] w-full object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-1 px-3 py-3 md:px-4" style={{ borderTop: `3px solid ${character.cityColor}` }}>
                  <p className="text-xs text-[var(--muted)]">{character.city} · {INSTRUMENT_META[character.instrument[0]].shortLabel}</p>
                  <h2 className="font-display text-base font-bold leading-tight text-[var(--ink)] md:text-lg">{character.name}</h2>
                  <p className="text-xs leading-relaxed text-[var(--muted)]">{character.tagline}</p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      ) : <p className="glass-surface rounded-2xl p-5 text-[var(--muted)]">No characters match your search.</p>}
    </>
  );
}

export default function SideStage() {
  const params = new URLSearchParams(window.location.search);
  const selected = params.get('side-stage') || 'all';
  const city = params.get('city') || '';
  const filterCity = cities.some(([id]) => id === city) ? city : '';
  const character = characters.find(({ id }) => id === selected);
  useEffect(() => {
    document.title = character ? `${character.name} · AreaJam Side Stage` : 'AreaJam Side Stage';
  }, [character]);

  return (
    <>
      <InstrumentIconSprite />
      <header className="safe-top border-b border-[var(--border)] bg-[var(--header-bg)]">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-4 px-4 py-3 md:px-8">
          <a href="./" aria-label="AreaJam home"><AreaJamLogo className="h-9 w-36 text-[var(--ink)]" /></a>
          <a href="./" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--muted)] hover:text-[var(--ink)]">
            Find local musicians
            <ArrowUpRight size={15} aria-hidden="true" />
          </a>
        </div>
      </header>
      <main className="mx-auto max-w-[1440px] px-4 pb-12 pt-7 md:px-8 md:pt-12">
        {character ? <CharacterProfile character={character} returnCity={filterCity} /> :
          selected === 'all' ? <CharacterGallery defaultCity={filterCity} /> : (
            <>
              <h1 className="font-display text-3xl font-bold text-[var(--ink)]">Character unavailable</h1>
              <a href={url('all', filterCity)} className="mt-3 inline-block text-[var(--accent-text)] underline">Browse Side Stage</a>
            </>
          )}
      </main>
    </>
  );
}
