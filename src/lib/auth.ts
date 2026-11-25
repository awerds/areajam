import type { AuthUser } from '../types';
import {
  getFirebaseAppInstance,
  isFirebaseAuthConfigured,
  readFirebaseConfig,
} from './firebaseApp';

export { isFirebaseAuthConfigured };

const LOCAL_AUTH_KEY = 'areajam_v1_user';
const authListeners = new Set<(user: AuthUser | null) => void>();

let currentUser: AuthUser | null = null;

function loadLocalPreviewUser(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function setCurrentUser(user: AuthUser | null): void {
  currentUser = user;
  authListeners.forEach((cb) => cb(user));
}

export function getCurrentUser(): AuthUser | null {
  return currentUser;
}

export function subscribeAuth(callback: (user: AuthUser | null) => void): () => void {
  authListeners.add(callback);

  const cfg = readFirebaseConfig();
  if (!cfg) {
    const localUser = loadLocalPreviewUser();
    currentUser = localUser;
    callback(localUser);
    return () => {
      authListeners.delete(callback);
    };
  }

  let unsubFirebase: (() => void) | undefined;
  let cancelled = false;

  (async () => {
    try {
      const app = await getFirebaseAppInstance();
      const { getAuth, onAuthStateChanged } = await import('firebase/auth');
      if (cancelled) return;
      const auth = getAuth(app);
      unsubFirebase = onAuthStateChanged(auth, (fbUser) => {
        if (!fbUser) {
          setCurrentUser(null);
          return;
        }
        const providerId = fbUser.providerData[0]?.providerId ?? '';
        const provider: 'google' | 'apple' = providerId.includes('apple') ? 'apple' : 'google';
        setCurrentUser({
          uid: fbUser.uid,
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'Musician',
          email: fbUser.email ?? undefined,
          photoURL: fbUser.photoURL ?? undefined,
          provider,
          isDemoPreview: false,
        });
      });
    } catch {
      if (!cancelled) {
        setCurrentUser(null);
      }
    }
  })();

  return () => {
    cancelled = true;
    unsubFirebase?.();
    authListeners.delete(callback);
  };
}

export async function signInWithProvider(
  provider: 'google' | 'apple',
  customDisplayName?: string
): Promise<AuthUser> {
  const cfg = readFirebaseConfig();

  if (cfg) {
    const app = await getFirebaseAppInstance();
    const { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup } = await import('firebase/auth');
    const auth = getAuth(app);

    const authProvider =
      provider === 'google'
        ? new GoogleAuthProvider()
        : (() => {
            const p = new OAuthProvider('apple.com');
            p.addScope('email');
            p.addScope('name');
            return p;
          })();

    const result = await signInWithPopup(auth, authProvider);
    const user: AuthUser = {
      uid: result.user.uid,
      displayName: result.user.displayName || result.user.email?.split('@')[0] || 'Musician',
      email: result.user.email ?? undefined,
      photoURL: result.user.photoURL ?? undefined,
      provider,
      isDemoPreview: false,
    };
    setCurrentUser(user);
    return user;
  }

  const cleanName =
    customDisplayName?.trim() || (provider === 'apple' ? 'Apple Musician' : 'Google Musician');
  const previewUser: AuthUser = {
    uid: `preview-${provider}-${Date.now()}`,
    displayName: cleanName,
    email: provider === 'apple' ? 'player@privaterelay.appleid.com' : 'player@gmail.com',
    provider,
    isDemoPreview: true,
  };

  try {
    window.localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(previewUser));
  } catch {
    // Ignore storage quota errors
  }

  setCurrentUser(previewUser);
  return previewUser;
}

export async function ensureRecentAuthIfNeeded(providerHint?: 'google' | 'apple'): Promise<void> {
  const cfg = readFirebaseConfig();
  if (!cfg) return;
  const app = await getFirebaseAppInstance();
  const { getAuth, GoogleAuthProvider, OAuthProvider, reauthenticateWithPopup } = await import(
    'firebase/auth'
  );
  const fbUser = getAuth(app).currentUser;
  if (!fbUser) return;

  const lastSignInMs = fbUser.metadata.lastSignInTime
    ? Date.parse(fbUser.metadata.lastSignInTime)
    : 0;
  if (lastSignInMs && Date.now() - lastSignInMs < 240_000) {
    return;
  }

  const resolvedProvider: 'google' | 'apple' =
    providerHint ??
    (fbUser.providerData[0]?.providerId?.includes('apple') ? 'apple' : 'google');
  const authProvider =
    resolvedProvider === 'google'
      ? new GoogleAuthProvider()
      : (() => {
          const p = new OAuthProvider('apple.com');
          p.addScope('email');
          p.addScope('name');
          return p;
        })();

  await reauthenticateWithPopup(fbUser, authProvider);
}

export async function deleteCurrentAuthUser(providerHint?: 'google' | 'apple'): Promise<void> {
  const cfg = readFirebaseConfig();
  if (cfg) {
    const app = await getFirebaseAppInstance();
    const {
      deleteUser,
      getAuth,
      GoogleAuthProvider,
      OAuthProvider,
      reauthenticateWithPopup,
    } = await import('firebase/auth');
    const fbUser = getAuth(app).currentUser;
    if (fbUser) {
      try {
        await deleteUser(fbUser);
      } catch (err) {
        const code =
          err && typeof err === 'object' && 'code' in err && typeof err.code === 'string'
            ? err.code
            : '';
        if (code !== 'auth/requires-recent-login') {
          throw err;
        }
        const resolvedProvider: 'google' | 'apple' =
          providerHint ??
          (fbUser.providerData[0]?.providerId?.includes('apple') ? 'apple' : 'google');
        const authProvider =
          resolvedProvider === 'google'
            ? new GoogleAuthProvider()
            : (() => {
                const p = new OAuthProvider('apple.com');
                p.addScope('email');
                p.addScope('name');
                return p;
              })();
        await reauthenticateWithPopup(fbUser, authProvider);
        await deleteUser(fbUser);
      }
    }
  }

  try {
    window.localStorage.removeItem(LOCAL_AUTH_KEY);
  } catch {
    // Ignore storage errors
  }
  setCurrentUser(null);
}

export async function signOutUser(): Promise<void> {
  const cfg = readFirebaseConfig();
  if (cfg) {
    try {
      const { getApps, getApp } = await import('firebase/app');
      const { getAuth, signOut } = await import('firebase/auth');
      if (getApps().length) {
        await signOut(getAuth(getApp()));
      }
    } catch {
      // Continue clearing local state
    }
  }

  try {
    window.localStorage.removeItem(LOCAL_AUTH_KEY);
  } catch {
    // Ignore storage errors
  }
  setCurrentUser(null);
}
