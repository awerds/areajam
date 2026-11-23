import type { FirebaseApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import type { Firestore } from 'firebase/firestore';
import { DEFAULT_FIREBASE_CONFIG } from './firebaseConfig';

export function readFirebaseConfig() {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.trim();
  const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.trim();
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.trim();
  const appId = import.meta.env.VITE_FIREBASE_APP_ID?.trim();

  if (apiKey && authDomain && projectId) {
    return { apiKey, authDomain, projectId, appId };
  }
  return DEFAULT_FIREBASE_CONFIG;
}

export function isFirebaseAuthConfigured(): boolean {
  return Boolean(readFirebaseConfig());
}

export async function getFirebaseAppInstance(): Promise<FirebaseApp> {
  const cfg = readFirebaseConfig();
  const { initializeApp, getApps, getApp } = await import('firebase/app');
  return getApps().length ? getApp() : initializeApp(cfg);
}

export async function getFirebaseAuthInstance(): Promise<Auth> {
  const app = await getFirebaseAppInstance();
  const { getAuth } = await import('firebase/auth');
  return getAuth(app);
}

export async function getFirestoreDb(): Promise<Firestore> {
  const app = await getFirebaseAppInstance();
  const { getFirestore } = await import('firebase/firestore');
  return getFirestore(app);
}
