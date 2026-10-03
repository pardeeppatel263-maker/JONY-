import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length
  ? initializeApp({
      apiKey: firebaseConfig.apiKey || import.meta.env.VITE_FIREBASE_API_KEY || '',
      authDomain: firebaseConfig.authDomain || import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: firebaseConfig.projectId || import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: firebaseConfig.storageBucket || import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: firebaseConfig.messagingSenderId || import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: firebaseConfig.appId || import.meta.env.VITE_FIREBASE_APP_ID || '',
      measurementId: firebaseConfig.measurementId || import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || '',
    })
  : getApp();

const firestoreDbId =
  firebaseConfig.firestoreDatabaseId ||
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  undefined;

export const db =
  firestoreDbId && firestoreDbId !== '(default)'
    ? getFirestore(app, firestoreDbId)
    : getFirestore(app);

export { app };
