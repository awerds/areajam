import { Compass, Film, Flame, MapPin, ShieldCheck, Ticket } from 'lucide-react';
import { AreaJamLogo } from './BrandLogo';
import { NativeDialog } from './NativeDialog';

interface HowItWorksDialogProps {
  open: boolean;
  onClose: () => void;
  onPickRegion: () => void;
  onGoToStudio: () => void;
}

export function HowItWorksDialog({
  open,
  onClose,
  onPickRegion,
  onGoToStudio,
}: HowItWorksDialogProps) {
  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      titleId="how-it-works-title"
      title="How AreaJam works"
      subtitle="Nashville (615) Jam pilot — open to every US city & state"
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl bg-[#10131d] px-5 py-5 text-white">
          <svg
            viewBox="0 0 480 140"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <g fill="none" stroke="rgba(217, 27, 76, 0.28)" strokeWidth="1.6">
              {[80, 140, 200, 260].map((r) => (
                <circle key={r} cx="450" cy="120" r={r} />
              ))}
            </g>
          </svg>
          <div className="relative space-y-1.5">
            <AreaJamLogo wordmarkColor="#ffffff" className="h-9 w-[162px]" decorative />
            <p className="text-xs font-medium text-[#f6f4ef]/85">
              Your local sound. A fresh signature.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--jam-soft)] text-[var(--jam-text)]">
              <Flame className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-display text-base font-bold">Jam side</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Find drummers, guitarists, vocalists, or full rhythm sections nearby to jam, write songs, or start a band.
            </p>
          </div>

          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--gigs-soft)] text-[var(--gigs)]">
              <Ticket className="h-5 w-5" aria-hidden="true" />
            </div>
            <h3 className="font-display text-base font-bold">Gigs side (Coming soon)</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Launching once local venues join with verified dates and bills. Sample cards can still be toggled on to preview the format.
            </p>
          </div>
        </div>

        <ol className="space-y-2.5 text-sm">
          <li className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
            <Compass className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Browse free across all cities</p>
              <p className="text-xs text-[var(--muted)]">
                Explore Nashville (615) or search any US state and city board. Inspect instruments, gear lockers, and linked Instagram/YouTube clips.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
            <Film className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Publish with linked social clips</p>
              <p className="text-xs text-[var(--muted)]">
                Sign in with Google or Apple to publish a live shareable profile built from your existing Instagram Reels, YouTube, TikTok, or SoundCloud links.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent-text)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Invite to jam &amp; safety controls</p>
              <p className="text-xs text-[var(--muted)]">
                Accepting a Jam invite opens one private 1-on-1 thread backed by Firebase Auth and Firestore security rules, with instant Block and Report controls. Build{' '}
                <code className="rounded bg-[var(--pill-bg)] px-1 py-0.5 text-[11px] text-[var(--ink)]">
                  {import.meta.env.VITE_BUILD_SHA || 'local'}
                </code>
                .
              </p>
            </div>
          </li>
        </ol>

        <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
          <button
            type="button"
            onClick={() => {
              onClose();
              onPickRegion();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--surface-hover)]"
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
            <span>Choose city</span>
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onGoToStudio();
            }}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-semibold text-[var(--bg)] transition hover:opacity-90"
          >
            <Film className="h-4 w-4" aria-hidden="true" />
            <span>Create profile</span>
          </button>
        </div>
      </div>
    </NativeDialog>
  );
}
