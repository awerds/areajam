const dirtyState = new WeakMap<Element, { hasInteracted: boolean; hasBlurred: boolean }>();
const flagged = new WeakSet<Element>();
const announced = new WeakSet<Element>();

let announcerEl: HTMLDivElement | null = null;
let announceTimer: number | undefined;
let announcedField: Element | null = null;

function getAnnouncer(): HTMLDivElement {
  if (announcerEl && document.body.contains(announcerEl)) {
    return announcerEl;
  }
  const el = document.createElement('div');
  el.setAttribute('aria-live', 'polite');
  el.className = 'visually-hidden';
  document.body.append(el);
  announcerEl = el;
  return el;
}

function linkError(el: HTMLElement, shown: boolean): void {
  const errorId = el.dataset.error;
  if (!errorId) return;
  const ids = (el.getAttribute('aria-describedby') || '')
    .split(/\s+/)
    .filter((id) => id && id !== errorId);
  if (shown) ids.push(errorId);
  if (ids.length) el.setAttribute('aria-describedby', ids.join(' '));
  else el.removeAttribute('aria-describedby');
}

function spokenText(node: Node): string {
  const copy = node.cloneNode(true) as HTMLElement;
  copy.querySelectorAll?.('[aria-hidden="true"]').forEach((n) => n.remove());
  copy.querySelectorAll?.('[role="img"][aria-label]').forEach((n) => {
    const label = n.getAttribute('aria-label') || 'Error';
    n.replaceWith(`${label}: `);
  });
  return (copy.textContent || '').replace(/\s+/g, ' ').trim();
}

function announceError(el: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement): void {
  const errorId = el.dataset.error;
  if (!errorId) return;
  const error = document.getElementById(errorId);
  if (!error) return;
  const announcer = getAnnouncer();
  const labelNode = el.labels?.[0];
  const label = labelNode ? `${spokenText(labelNode)}: ` : '';
  window.clearTimeout(announceTimer);
  announcer.textContent = '';
  announcedField = el;
  announceTimer = window.setTimeout(() => {
    announcer.textContent = label + spokenText(error);
  }, 500);
}

type FormControl = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

function isFormControl(target: EventTarget | null): target is FormControl {
  return target instanceof HTMLElement && target.matches('input, select, textarea');
}

function supportsUserInvalid(): boolean {
  try {
    return typeof CSS !== 'undefined' && CSS.supports('selector(:user-invalid)');
  } catch {
    return false;
  }
}

export function attachFormValidation(form: HTMLFormElement): () => void {
  const nativeSupported = supportsUserInvalid();

  const syncNativeAria = (el: FormControl, announce = false): void => {
    const invalid = el.matches(':user-invalid');
    if (invalid) {
      if (announce && !announced.has(el)) {
        announceError(el);
        announced.add(el);
      }
      el.setAttribute('aria-invalid', 'true');
      linkError(el, true);
      flagged.add(el);
    } else if (flagged.has(el) || el.getAttribute('aria-invalid') !== 'true') {
      el.setAttribute('aria-invalid', 'false');
      linkError(el, false);
      flagged.delete(el);
      announced.delete(el);
      if (announcedField === el && announcerEl) {
        window.clearTimeout(announceTimer);
        announcerEl.textContent = '';
      }
    }
  };

  const updateFallbackState = (el: FormControl, announce = false): void => {
    const isValid = el.validity.valid;
    el.classList.toggle('user-invalid-fallback', !isValid);
    el.classList.toggle('user-valid-fallback', isValid);
    el.setAttribute('aria-invalid', isValid ? 'false' : 'true');
    linkError(el, !isValid);
    if (!isValid && announce && !announced.has(el)) {
      announceError(el);
      announced.add(el);
    }
    if (isValid) {
      announced.delete(el);
      if (announcedField === el && announcerEl) {
        window.clearTimeout(announceTimer);
        announcerEl.textContent = '';
      }
    }
  };

  // Initialize aria-invalid="false" on all fields so Safari/Firefox don't announce empty required fields on load
  form.querySelectorAll('input, select, textarea').forEach((node) => {
    if (isFormControl(node)) {
      if (nativeSupported) syncNativeAria(node);
      else if (!node.hasAttribute('aria-invalid')) node.setAttribute('aria-invalid', 'false');
    }
  });

  const onBlur = (e: Event): void => {
    if (!isFormControl(e.target)) return;
    if (nativeSupported) {
      syncNativeAria(e.target, true);
      return;
    }
    const state = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
    state.hasBlurred = true;
    dirtyState.set(e.target, state);
    if (state.hasInteracted) {
      updateFallbackState(e.target, true);
    }
  };

  const onInput = (e: Event): void => {
    if (!isFormControl(e.target)) return;
    if (nativeSupported) {
      if (e.target.hasAttribute('aria-invalid')) syncNativeAria(e.target, false);
      return;
    }
    const state = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
    state.hasInteracted = true;
    dirtyState.set(e.target, state);
    if (state.hasBlurred) {
      updateFallbackState(e.target, false);
    }
  };

  const onChange = (e: Event): void => {
    if (!isFormControl(e.target)) return;
    if (nativeSupported) {
      syncNativeAria(e.target, true);
      return;
    }
    const state = dirtyState.get(e.target) || { hasInteracted: false, hasBlurred: false };
    state.hasInteracted = true;
    dirtyState.set(e.target, state);
    if (state.hasBlurred) {
      updateFallbackState(e.target, true);
    }
  };

  const onInvalid = (e: Event): void => {
    if (!isFormControl(e.target)) return;
    announced.add(e.target);
    if (nativeSupported) {
      syncNativeAria(e.target, false);
      return;
    }
    dirtyState.set(e.target, { hasInteracted: true, hasBlurred: true });
    updateFallbackState(e.target, false);
  };

  const onReset = (): void => {
    window.setTimeout(() => {
      for (const node of Array.from(form.elements)) {
        if (!isFormControl(node)) continue;
        dirtyState.delete(node);
        announced.delete(node);
        flagged.delete(node);
        node.classList.remove('user-invalid-fallback', 'user-valid-fallback');
        node.setAttribute('aria-invalid', 'false');
        linkError(node, false);
      }
    });
  };

  form.addEventListener('blur', onBlur, true);
  form.addEventListener('input', onInput);
  form.addEventListener('change', onChange, true);
  form.addEventListener('invalid', onInvalid, true);
  form.addEventListener('reset', onReset, true);

  return () => {
    form.removeEventListener('blur', onBlur, true);
    form.removeEventListener('input', onInput);
    form.removeEventListener('change', onChange, true);
    form.removeEventListener('invalid', onInvalid, true);
    form.removeEventListener('reset', onReset, true);
  };
}
