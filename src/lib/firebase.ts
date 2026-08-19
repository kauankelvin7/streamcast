import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getDatabase, Database } from 'firebase/database';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyArTBOGiIOFNJEU8yqxVhFCd0iUsSm9srM",
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "streamcast-99273.firebaseapp.com",
  databaseURL:       import.meta.env.VITE_FIREBASE_DATABASE_URL || "https://streamcast-99273-default-rtdb.firebaseio.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "streamcast-99273",
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "streamcast-99273.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "176335639629",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID || "1:176335639629:web:d7440de786c20a78ba7804",
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
  firebaseConfig.apiKey !== 'SUA_API_KEY_AQUI' &&
  firebaseConfig.databaseURL
);

export const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);
export const rtdb: Database = getDatabase(app);
export const storage: FirebaseStorage = getStorage(app);

export default {
  app,
  auth,
  db,
  rtdb,
  storage,
  isFirebaseConfigured,
};