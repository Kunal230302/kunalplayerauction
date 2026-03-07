import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getDatabase, Database } from "firebase/database";
import { getStorage, FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY            || 'placeholder',
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN        || 'placeholder.firebaseapp.com',
  databaseURL:       process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL       || 'https://placeholder-default-rtdb.firebaseio.com',
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID         || 'placeholder',
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET     || 'placeholder.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID             || '1:000:web:000',
};

let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch {
  app = initializeApp(firebaseConfig, 'fallback');
}

export const auth: Auth          = getAuth(app);
export const db: Firestore       = getFirestore(app);
export const rtdb: Database      = getDatabase(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
