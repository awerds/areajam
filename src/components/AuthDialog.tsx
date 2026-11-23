import { useState } from 'react';
import { AlertCircle, ShieldCheck } from 'lucide-react';
import { isFirebaseAuthConfigured, signInWithProvider } from '../lib/auth';
import type { AuthUser } from '../types';
import { AreaJamLogo } from './BrandLogo';
import { NativeDialog } from './NativeDialog';

interface AuthDialogProps {
  open: boolean;
  reason?: string;
  onClose: () => void;
  onAuthenticated: (user: AuthUser) => void;
}

function formatAuthError(err: unknown, provider: 'google' | 'apple'): string {
  const code =
    err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
      ? err.code
      : '';

  if (code === 'auth/popup-closed-by-user') {
    return 'Sign-in popup closed before finishing.';
  }
  if (code === 'auth/popup-blocked') {
    return 'Browser blocked the sign-in popup. Allow popups for areajam.com and try again.';
  }
  if (code === 'auth/unauthorized-domain') {
    return 'This domain is not authorized in Firebase Auth settings.';
  }
  if (
    provider === 'apple' &&
    (code === 'auth/operation-not-allowed' ||
      code === 'auth/invalid-credential' ||
      code === 'auth/internal-error' ||
      code === 'auth/missing-or-invalid-nonce' ||
      code.startsWith('auth/'))
  ) {
    return 'Apple Sign-In requires adding your Apple Developer Services ID, Team ID, Key ID, and Private Key in Firebase Console first. Use Continue with Google right now.';
  }

  return err instanceof Error && err.message
    ? err.message
    : 'Sign-in could not complete. Allow popups for this site and try again.';
}

export function AuthDialog({ open, reason, onClose, onAuthenticated }: AuthDialogProps) {
  const [nameInput, setNameInput] = useState('');
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const firebaseLive = isFirebaseAuthConfigured();

  const handleSignIn = async (provider: 'google' | 'apple') => {
    setErrorMsg(null);
    setLoadingProvider(provider);
    try {
      const user = await signInWithProvider(provider, nameInput);
      onAuthenticated(user);
      onClose();
    } catch (err) {
      setErrorMsg(formatAuthError(err, provider));
    } finally {
      setLoadingProvider(null);
    }
  };

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      titleId="auth-dialog-title"
      title="Sign in to create your profile"
      subtitle={
        reason ||
        'Browsing players and watching clips is free with no account. Sign in to post your flyer, record intro clips, or message matches.'
      }
    >
      <div className="space-y-4">
        <div className="relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] px-5 py-4 text-center">
          <svg
            viewBox="0 0 400 120"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 h-full w-full"
          >
            <g fill="none" stroke="var(--brand-contour)" strokeWidth="1.5">
              {[70, 120, 170].map((r) => (
                <circle key={r} cx="380" cy="110" r={r} />
              ))}
            </g>
          </svg>
          <AreaJamLogo className="relative mx-auto h-10 w-[172px] text-[var(--ink)]" decorative />
        </div>

        {!firebaseLive && (
          <div className="space-y-2 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-3.5">
            <div className="flex items-start gap-2 text-xs text-[var(--muted)]">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]" aria-hidden="true" />
              <span>
                Instant preview sign-in is active while Firebase OAuth keys are blank in your environment. You can test profile creation and clip uploads immediately.
              </span>
            </div>
            <div>
              <label htmlFor="auth-preview-name" className="mb-1 block text-xs font-semibold">
                Your artist or band name
              </label>
              <input
                id="auth-preview-name"
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                placeholder="e.g. Alex Vega"
                className="field-control"
              />
            </div>
          </div>
        )}

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[var(--err)] bg-[var(--err-bg)] px-3.5 py-2.5 text-xs text-[var(--err)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="space-y-2.5">
          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => void handleSignIn('apple')}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl bg-[var(--ink)] px-4 py-3.5 text-sm font-bold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z" />
            </svg>
            <span>
              {loadingProvider === 'apple' ? 'Connecting Apple...' : 'Continue with Apple'}
            </span>
          </button>

          <button
            type="button"
            disabled={loadingProvider !== null}
            onClick={() => void handleSignIn('google')}
            className="flex w-full items-center justify-center gap-2.5 rounded-2xl border border-[var(--border-strong)] bg-[var(--surface-solid)] px-4 py-3.5 text-sm font-bold text-[var(--ink)] transition hover:bg-[var(--surface-hover)] disabled:opacity-60"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
              <path
                fill="#EA4335"
                d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12S6.8 21.5 12 21.5c6.9 0 9.1-4.8 9.1-7.3 0-.5-.1-.9-.1-1.3H12z"
              />
              <path
                fill="#34A853"
                d="M3.6 7.4l3.2 2.3C7.7 7.7 9.7 6.3 12 6.3c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.4 14.6 2.5 12 2.5c-3.7 0-6.9 2.1-8.4 4.9z"
              />
              <path
                fill="#FBBC05"
                d="M12 21.5c2.5 0 4.7-.8 6.3-2.3l-2.9-2.4c-.8.6-1.9 1-3.4 1-2.6 0-4.9-1.8-5.7-4.2l-3.2 2.4c1.5 3 4.6 5.5 8.9 5.5z"
              />
              <path
                fill="#4285F4"
                d="M21.1 14.2c.1-.4.2-.9.2-1.5 0-.6-.1-1.1-.2-1.6H12v3.1h5.4c-.3 1.2-1 2.2-2 2.8l2.9 2.4c1.7-1.6 2.8-3.9 2.8-5.2z"
              />
            </svg>
            <span>
              {loadingProvider === 'google' ? 'Connecting Google...' : 'Continue with Google'}
            </span>
          </button>
        </div>
      </div>
    </NativeDialog>
  );
}
