const STORAGE_KEY = 'color-scheme';

export type ResolvedColorScheme = 'light' | 'dark';
export type StoredColorScheme = ResolvedColorScheme | null;

export function getStoredColorScheme(): StoredColorScheme {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw === 'light' || raw === 'dark' ? raw : null;
  } catch {
    return null;
  }
}

export function getSystemColorScheme(): ResolvedColorScheme {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyColorSchemeMeta(stored: StoredColorScheme): ResolvedColorScheme {
  const resolved: ResolvedColorScheme = stored ?? getSystemColorScheme();
  if (typeof document !== 'undefined') {
    const schemeMeta = document.querySelector<HTMLMetaElement>('meta[name="color-scheme"]');
    if (schemeMeta) {
      schemeMeta.content = stored ?? 'light dark';
    }
    const themeMeta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (themeMeta) {
      themeMeta.content = resolved === 'dark' ? '#07080d' : '#f6f4ef';
    }
  }
  return resolved;
}

export function toggleColorScheme(): {
  resolved: ResolvedColorScheme;
  followingSystem: boolean;
} {
  const system = getSystemColorScheme();
  const current = getStoredColorScheme() ?? system;
  const target: ResolvedColorScheme = current === 'dark' ? 'light' : 'dark';

  if (target === system) {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore storage access errors
    }
    applyColorSchemeMeta(null);
    return { resolved: target, followingSystem: true };
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, target);
  } catch {
    // Ignore storage access errors
  }
  applyColorSchemeMeta(target);
  return { resolved: target, followingSystem: false };
}

export function subscribeColorScheme(onChange: (resolved: ResolvedColorScheme) => void): () => void {
  if (typeof window === 'undefined') return () => {};

  const sync = () => {
    onChange(applyColorSchemeMeta(getStoredColorScheme()));
  };

  sync();

  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) {
      sync();
    }
  };

  window.addEventListener('storage', onStorage);

  const mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  if (mql) {
    if (mql.addEventListener) {
      mql.addEventListener('change', sync);
    } else if (mql.addListener) {
      mql.addListener(sync);
    }
  }

  return () => {
    window.removeEventListener('storage', onStorage);
    if (mql) {
      if (mql.removeEventListener) {
        mql.removeEventListener('change', sync);
      } else if (mql.removeListener) {
        mql.removeListener(sync);
      }
    }
  };
}
