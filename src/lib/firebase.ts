import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, GoogleAuthProvider, signInWithPopup, signOut as fbSignOut } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';
import firebaseAppletConfig from '../../firebase-applet-config.json';

export interface FirebaseConfigStatus {
  isConfigured: boolean;
  missingKeys: string[];
  projectId?: string;
  databaseId?: string;
}

const firebaseConfig = {
  apiKey: firebaseAppletConfig?.apiKey || import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: firebaseAppletConfig?.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: firebaseAppletConfig?.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: firebaseAppletConfig?.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: firebaseAppletConfig?.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: firebaseAppletConfig?.appId || import.meta.env.VITE_FIREBASE_APP_ID,
};

export const firestoreDatabaseId: string =
  firebaseAppletConfig?.firestoreDatabaseId ||
  import.meta.env.VITE_FIRESTORE_DATABASE_ID ||
  '(default)';

export function checkFirebaseConfig(): FirebaseConfigStatus {
  const missingKeys: string[] = [];
  if (!firebaseConfig.apiKey) missingKeys.push('apiKey');
  if (!firebaseConfig.projectId) missingKeys.push('projectId');
  if (!firebaseConfig.authDomain) missingKeys.push('authDomain');

  const isConfigured = missingKeys.length === 0;
  return {
    isConfigured,
    missingKeys,
    projectId: firebaseConfig.projectId,
    databaseId: firestoreDatabaseId,
  };
}

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let db: Firestore | null = null;
let storage: FirebaseStorage | null = null;

export const firebaseStatus = checkFirebaseConfig();
export const isFirebaseConfigured = firebaseStatus.isConfigured;

if (firebaseStatus.isConfigured) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    // CRITICAL: Connect Firestore with the provisioned database ID
    db = getFirestore(app, firestoreDatabaseId);
    storage = getStorage(app);
    console.log('[TREND DZ] Firebase initialized successfully with project:', firebaseConfig.projectId, 'database:', firestoreDatabaseId);
  } catch (error) {
    console.warn('[TREND DZ] Firebase initialization warning:', error);
  }
} else {
  console.info(
    '[TREND DZ] Firebase keys not fully provided. Running in fallback mode. Missing keys:',
    firebaseStatus.missingKeys
  );
}

// ---------------------------------------------------------------------------
// Standard Firestore Error Handling conforming to Firebase Integration Skill
// ---------------------------------------------------------------------------
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid || null,
      email: auth?.currentUser?.email || null,
      emailVerified: auth?.currentUser?.emailVerified || null,
      isAnonymous: auth?.currentUser?.isAnonymous || null,
      tenantId: auth?.currentUser?.tenantId || null,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Google Sign In Helper
export async function signInWithGoogle() {
  if (!auth) {
    throw new Error('Firebase Auth is not initialized');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return signInWithPopup(auth, provider);
}

export { app, auth, db, storage };
