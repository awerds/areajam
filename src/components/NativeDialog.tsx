import { useEffect, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

interface NativeDialogProps {
  open: boolean;
  onClose: () => void;
  titleId: string;
  title: string;
  eyebrow?: string;
  children: ReactNode;
}

export function NativeDialog({
  open,
  onClose,
  titleId,
  title,
  eyebrow,
  children,
}: NativeDialogProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      dialog.showModal();
    } else if (!open && dialog.open) {
      dialog.close();
    }
  }, [open]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    const handleClose = () => {
      dialog.returnValue = '';
      onClose();
    };

    dialog.addEventListener('close', handleClose);

    // Fallback for Safari / browsers without HTMLDialogElement closedby="any"
    if (!('closedBy' in HTMLDialogElement.prototype)) {
      let pressedOutside = false;
      const isOutside = (e: PointerEvent) => {
        const rect = dialog.getBoundingClientRect();
        return (
          e.clientX < rect.left ||
          e.clientX > rect.right ||
          e.clientY < rect.top ||
          e.clientY > rect.bottom
        );
      };
      const onPointerDown = (e: PointerEvent) => {
        pressedOutside = isOutside(e);
      };
      const onPointerUp = (e: PointerEvent) => {
        if (pressedOutside && isOutside(e)) {
          dialog.close();
        }
        pressedOutside = false;
      };
      dialog.addEventListener('pointerdown', onPointerDown);
      dialog.addEventListener('pointerup', onPointerUp);
      return () => {
        dialog.removeEventListener('close', handleClose);
        dialog.removeEventListener('pointerdown', onPointerDown);
        dialog.removeEventListener('pointerup', onPointerUp);
      };
    }

    return () => {
      dialog.removeEventListener('close', handleClose);
    };
  }, [onClose]);

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      className="areajam-dialog"
      {...({ closedby: 'any' } as Record<string, string>)}
    >
      <div className="flex max-h-[min(88dvh,46rem)] flex-col overflow-hidden">
        <header className="flex items-start justify-between gap-3 border-b border-[var(--border)] px-5 py-4">
          <div className="min-w-0">
            {eyebrow && (
              <p className="font-mono-code mb-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--muted)]">
                {eyebrow}
              </p>
            )}
            <h2 id={titleId} className="font-display text-lg font-extrabold leading-tight tracking-tight">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => dialogRef.current?.close()}
            aria-label="Close"
            className="icon-btn inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--surface-2)] text-[var(--ink)] transition hover:opacity-80"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>
        <div className="app-scroll overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </dialog>
  );
}
