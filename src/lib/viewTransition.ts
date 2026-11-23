import { flushSync } from 'react-dom';

type DocumentWithViewTransition = Document & {
  startViewTransition?: (callback: () => void) => { finished?: Promise<void> };
};

/** Run a discrete UI filter update inside a View Transition when supported and motion is allowed. */
export function runFilterTransition(update: () => void): void {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    update();
    return;
  }

  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const doc = document as DocumentWithViewTransition;

  if (reducedMotion || typeof doc.startViewTransition !== 'function') {
    update();
    return;
  }

  try {
    const transition = doc.startViewTransition(() => {
      flushSync(update);
    });
    transition?.finished?.catch(() => {
      // Ignore AbortError if user clicks another filter before transition completes
    });
  } catch {
    update();
  }
}

/** Generate a deterministic, valid CSS view-transition-name identifier for a card. */
export function cardViewTransitionName(id: string): string {
  return `aj-card-${id.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
}
