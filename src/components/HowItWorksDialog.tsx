import { Compass, Film, Flame, MapPin, ShieldCheck, Ticket } from 'lucide-react';
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
      subtitle="Interactive local preview — sample profiles & browser storage"
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="mb-2 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--jam-soft)] text-[var(--jam)]">
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
            <h3 className="font-display text-base font-bold">Gigs side</h3>
            <p className="mt-1 text-xs leading-relaxed text-[var(--muted)]">
              Switch modes to discover open local venue bills or browse gig-ready bands with soundcheck clips and rates.
            </p>
          </div>
        </div>

        <ol className="space-y-2.5 text-sm">
          <li className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
            <Compass className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Browse free without an account</p>
              <p className="text-xs text-[var(--muted)]">
                Pick who you are looking for, watch auto-playing clips in the reel deck or directory grid, and swipe right to connect.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
            <Film className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Record a quick webcam intro or upload cuts</p>
              <p className="text-xs text-[var(--muted)]">
                When you are ready to post your own card, sign in with Apple or Google and record up to 30-second video intros straight in the browser.
              </p>
            </div>
          </li>
          <li className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
            <div>
              <p className="font-semibold">Simulated matches &amp; browser-local drafts</p>
              <p className="text-xs text-[var(--muted)]">
                Sample cards, match popups, and replies are simulated locally. Profile drafts, clips, and messages stay on this browser per signed-in account. Build{' '}
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
