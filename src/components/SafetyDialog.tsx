import { useEffect, useState } from 'react';
import { AlertCircle, Flag, ShieldBan } from 'lucide-react';
import type { ReportReason } from '../types';
import { NativeDialog } from './NativeDialog';

export interface SafetyTarget {
  mode: 'report' | 'block';
  targetUid: string;
  targetName: string;
  targetType: 'profile' | 'thread' | 'wallNote';
  targetId: string;
}

interface SafetyDialogProps {
  target: SafetyTarget | null;
  onClose: () => void;
  onConfirmBlock: (targetUid: string, targetName: string) => Promise<void>;
  onSubmitReport: (params: {
    targetUid: string;
    targetType: 'profile' | 'thread' | 'wallNote';
    targetId: string;
    reason: ReportReason;
    details: string;
  }) => Promise<void>;
}

const REPORT_REASONS: Array<{ id: ReportReason; label: string }> = [
  { id: 'spam', label: 'Spam or promo links' },
  { id: 'harassment', label: 'Harassment or abusive messages' },
  { id: 'impersonation', label: 'Impersonation or fake musician profile' },
  { id: 'inappropriate', label: 'Inappropriate clip or wall content' },
  { id: 'other', label: 'Other safety concern' },
];

export function SafetyDialog({
  target,
  onClose,
  onConfirmBlock,
  onSubmitReport,
}: SafetyDialogProps) {
  const [reason, setReason] = useState<ReportReason>('spam');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setReason('spam');
    setDetails('');
    setSubmitting(false);
    setErrorMsg(null);
  }, [target?.targetUid, target?.mode, target?.targetId]);

  const handleConfirmBlock = async () => {
    if (!target) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onConfirmBlock(target.targetUid, target.targetName);
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not block user right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!target) return;
    setErrorMsg(null);
    setSubmitting(true);
    try {
      await onSubmitReport({
        targetUid: target.targetUid,
        targetType: target.targetType,
        targetId: target.targetId,
        reason,
        details: details.trim(),
      });
      onClose();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Could not submit report right now.');
    } finally {
      setSubmitting(false);
    }
  };

  const isBlock = target?.mode === 'block';

  return (
    <NativeDialog
      open={Boolean(target)}
      onClose={onClose}
      titleId="safety-dialog-title"
      title={
        target
          ? isBlock
            ? `Block ${target.targetName}?`
            : `Report ${target.targetName}`
          : 'Safety action'
      }
      subtitle={
        isBlock
          ? 'Manage who can see or message your account'
          : 'Submitted reports help keep the local scene clean'
      }
    >
      {target && isBlock && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <ShieldBan className="mt-0.5 h-5 w-5 shrink-0 text-[var(--err)]" aria-hidden="true" />
            <div className="space-y-1 text-xs leading-relaxed text-[var(--muted)]">
              <p className="font-semibold text-[var(--ink)]">
                Blocking hides {target.targetName} across AreaJam
              </p>
              <p>
                Their profiles, wall notes, pending jam invites, and private thread will be hidden from your views, and Firestore rules prevent new invites or messages between you. You can unblock them anytime from Profile &amp; studio.
              </p>
            </div>
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
              disabled={submitting}
              onClick={() => void handleConfirmBlock()}
              className="flex-1 rounded-2xl border border-[var(--err)] bg-[var(--err-bg)] px-4 py-3 text-sm font-bold text-[var(--err)] transition hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? 'Blocking...' : `Block ${target.targetName}`}
            </button>
            <button
              type="button"
              autoFocus
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {target && !isBlock && (
        <form onSubmit={(e) => void handleReportSubmit(e)} className="space-y-4">
          <div>
            <label htmlFor="safety-report-reason" className="mb-1.5 block text-xs font-semibold">
              Reason
            </label>
            <select
              id="safety-report-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value as ReportReason)}
              className="field-control text-sm"
            >
              {REPORT_REASONS.map((item) => (
                <option
                  key={item.id}
                  value={item.id}
                  className="bg-[var(--surface-solid)] text-[var(--ink)]"
                >
                  {item.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="safety-report-details" className="mb-1.5 block text-xs font-semibold">
              Details (optional)
            </label>
            <textarea
              id="safety-report-details"
              rows={3}
              autoFocus
              maxLength={500}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Briefly describe what happened..."
              className="field-control resize-none"
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
              onClick={onClose}
              className="flex-1 rounded-2xl border border-[var(--border)] bg-[var(--pill-bg)] px-4 py-3 text-sm font-semibold text-[var(--ink)] transition hover:bg-[var(--surface-hover)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--ink)] px-4 py-3 text-sm font-bold text-[var(--bg)] transition hover:opacity-90 disabled:opacity-50"
            >
              <Flag className="h-4 w-4" aria-hidden="true" />
              <span>{submitting ? 'Submitting...' : 'Submit report'}</span>
            </button>
          </div>
        </form>
      )}
    </NativeDialog>
  );
}
