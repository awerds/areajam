import { useEffect, useState } from 'react';
import { AlertCircle, Trash2 } from 'lucide-react';
import { NativeDialog } from './NativeDialog';

interface DeleteAccountDialogProps {
  open: boolean;
  displayName?: string;
  profileCount: number;
  onClose: () => void;
  onConfirmDelete: () => Promise<void>;
}

export function DeleteAccountDialog({
  open,
  displayName,
  profileCount,
  onClose,
  onConfirmDelete,
}: DeleteAccountDialogProps) {
  const [confirmText, setConfirmText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setConfirmText('');
      setSubmitting(false);
      setErrorMsg(null);
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (confirmText.trim() !== 'DELETE') return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onConfirmDelete();
      onClose();
    } catch (err) {
      setErrorMsg(
        err instanceof Error && err.message
          ? err.message
          : 'Could not delete your account right now. Please sign out and sign back in, then try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const canDelete = confirmText.trim() === 'DELETE' && !submitting;

  return (
    <NativeDialog
      open={open}
      onClose={onClose}
      titleId="delete-account-dialog-title"
      title="Delete account and data"
      subtitle={displayName ? `Signed in as ${displayName}` : 'Permanent account removal'}
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div className="space-y-2 rounded-2xl border border-[var(--err)]/40 bg-[var(--err-bg)] p-4 text-xs leading-relaxed text-[var(--ink)]">
          <p className="font-bold text-[var(--err)]">
            This permanently deletes your AreaJam account and cannot be undone.
          </p>
          <ul className="list-disc space-y-1 pl-4 text-[var(--muted)]">
            <li>
              Removes your{' '}
              <strong className="text-[var(--ink)]">{profileCount}</strong>{' '}
              published profile{profileCount === 1 ? '' : 's'} and associated scene wall notes.
            </li>
            <li>Clears your block list, cancels pending sent jam invites, and removes local browser preferences.</li>
            <li>Deletes your Firebase Authentication account (you may be asked to re-confirm sign-in first).</li>
          </ul>
        </div>

        <div>
          <label htmlFor="delete-account-confirm" className="mb-1.5 block text-xs font-semibold">
            Type DELETE to confirm
          </label>
          <input
            id="delete-account-confirm"
            type="text"
            autoComplete="off"
            spellCheck={false}
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="DELETE"
            className="field-control text-sm"
          />
        </div>

        {errorMsg && (
          <div
            role="alert"
            className="flex items-start gap-2 rounded-xl border border-[var(--err)] bg-[var(--err-bg)] px-3.5 py-2.5 text-xs text-[var(--err)]"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div className="flex flex-col-reverse gap-2.5 sm:flex-row">
          <button
            type="button"
            autoFocus
            onClick={onClose}
            className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canDelete}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-[var(--err)] bg-[var(--err-bg)] px-4 py-3 text-sm font-bold text-[var(--err)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            <span>{submitting ? 'Deleting account...' : 'Delete my account'}</span>
          </button>
        </div>
      </form>
    </NativeDialog>
  );
}
