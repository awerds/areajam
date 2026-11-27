import { useState, type FormEvent, type ReactNode } from 'react';
import {
  ArrowRight,
  BookOpen,
  Eye,
  EyeOff,
  Film,
  Lock,
  Presentation,
  Sparkles,
} from 'lucide-react';
import { AreaJamStackedLogo, BrandContourBackdrop } from './BrandLogo';

const STORAGE_KEY = 'areajam.demo_unlocked';
const DEMO_PASS = 'areajamdemo';

function readUnlocked(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

export function DemoGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState<boolean>(() => readUnlocked());
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  if (unlocked) {
    return <>{children}</>;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleaned = password.trim().toLowerCase();
    if (cleaned === DEMO_PASS) {
      try {
        window.localStorage.setItem(STORAGE_KEY, '1');
      } catch {
        // Ignore storage quota / privacy mode errors
      }
      setError('');
      setUnlocked(true);
      return;
    }
    setError('Incorrect demo password. Try again or explore the public Promo Hub below.');
  }

  return (
    <div
      className="relative min-h-dvh w-full overflow-x-hidden bg-[#0b0e16] text-[#f6f4ef] flex flex-col items-center justify-center px-4 py-10 sm:px-6"
      style={{
        backgroundImage:
          'radial-gradient(circle at 18% 12%, rgba(217, 27, 76, 0.22), transparent 42%), radial-gradient(circle at 84% 86%, rgba(56, 189, 248, 0.12), transparent 44%)',
      }}
    >
      <BrandContourBackdrop mode="jam" />

      <main className="relative z-10 w-full max-w-[440px] flex flex-col gap-5">
        {/* Password Access Card */}
        <section
          aria-label="AreaJam Demo Login"
          className="rounded-[28px] border border-white/12 bg-[#141824]/88 p-6 sm:p-8 shadow-[0_28px_80px_rgba(0,0,0,0.55)] backdrop-blur-xl"
        >
          <div className="flex flex-col items-center text-center">
            <AreaJamStackedLogo
              className="w-40 sm:w-44 h-auto"
              markColor="#D91B4C"
              wordmarkColor="#F6F4EF"
            />
            <span className="mt-4 inline-flex items-center gap-1.5 rounded-full border border-[#d91b4c]/40 bg-[#d91b4c]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.08em] text-[#ff779a]">
              <Lock className="h-3 w-3" aria-hidden="true" />
              Private Demo Preview
            </span>
            <p className="mt-3 text-sm leading-relaxed text-[#a2abc0]">
              Enter the demo password to access the live AreaJam app.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-3.5" noValidate>
            <label htmlFor="demo-password" className="sr-only">
              Demo password
            </label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a2abc0]"
                aria-hidden="true"
              />
              <input
                id="demo-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (error) setError('');
                }}
                autoComplete="current-password"
                autoFocus
                placeholder="Enter demo password"
                aria-invalid={error ? 'true' : undefined}
                aria-describedby={error ? 'demo-password-error' : undefined}
                className="w-full rounded-2xl border border-white/14 bg-white/[0.05] py-3.5 pl-10 pr-11 text-[15px] text-[#f6f4ef] placeholder:text-[#7e879c] outline-none transition focus:border-[#d91b4c] focus:ring-2 focus:ring-[#d91b4c]/30"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-xl p-2 text-[#a2abc0] transition hover:bg-white/10 hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Eye className="h-4 w-4" aria-hidden="true" />
                )}
              </button>
            </div>

            {error ? (
              <p
                id="demo-password-error"
                role="alert"
                className="rounded-xl border border-red-500/30 bg-red-500/12 px-3.5 py-2 text-xs font-medium text-red-200"
              >
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              className="mt-1 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#d91b4c] px-5 py-3.5 text-sm font-bold text-white shadow-[0_12px_30px_rgba(217,27,76,0.4)] transition hover:bg-[#e12556] active:scale-[0.99] cursor-pointer"
            >
              Enter AreaJam
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </form>
        </section>

        {/* Prominent Public Promo Content Card (No Password Required) */}
        <section
          aria-label="Public Promo Content"
          className="rounded-[26px] border border-[#ff779a]/30 bg-gradient-to-br from-[#d91b4c]/18 via-[#141824]/92 to-[#141824]/92 p-5 sm:p-6 shadow-[0_20px_56px_rgba(0,0,0,0.45)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/35 bg-emerald-400/12 px-2.5 py-1 text-[11px] font-bold text-emerald-300">
              <Sparkles className="h-3 w-3" aria-hidden="true" />
              No password required
            </span>
            <span className="text-[11px] font-semibold text-[#a2abc0]">areajam.com/promo</span>
          </div>

          <h2 className="mt-3 font-['Bricolage_Grotesque',sans-serif] text-lg font-extrabold tracking-tight text-[#f6f4ef]">
            Explore the AreaJam Promo Hub
          </h2>
          <p className="mt-1 text-xs leading-relaxed text-[#b9c1d4]">
            Watch the platform walkthrough &amp; vertical Reels shorts, browse the interactive HTML
            Investor Guide, or read the full User Manual.
          </p>

          <a
            href="/promo/"
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/18 bg-white/10 px-4 py-3 text-sm font-bold text-white transition hover:bg-white/16 hover:border-white/30"
          >
            Open Promo Hub
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </a>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <a
              href="/promo/#shorts"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px] font-semibold text-[#d7dce8] transition hover:bg-white/10 hover:text-white"
            >
              <Film className="h-3.5 w-3.5 text-[#ff779a]" aria-hidden="true" />
              Videos
            </a>
            <a
              href="/promo/deck.html"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px] font-semibold text-[#d7dce8] transition hover:bg-white/10 hover:text-white"
            >
              <Presentation className="h-3.5 w-3.5 text-[#ff779a]" aria-hidden="true" />
              Investor Guide
            </a>
            <a
              href="/promo/manual.html"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-[11px] font-semibold text-[#d7dce8] transition hover:bg-white/10 hover:text-white"
            >
              <BookOpen className="h-3.5 w-3.5 text-[#ff779a]" aria-hidden="true" />
              Manual
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
