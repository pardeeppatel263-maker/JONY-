import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = !getApps().length
  ? initializeApp({
      apiKey: firebaseConfig.apiKey || import.meta.env?.VITE_FIREBASE_API_KEY || '',
      authDomain: firebaseConfig.authDomain || import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN || '',
      projectId: firebaseConfig.projectId || import.meta.env?.VITE_FIREBASE_PROJECT_ID || '',
      storageBucket: firebaseConfig.storageBucket || import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET || '',
      messagingSenderId: firebaseConfig.messagingSenderId || import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: firebaseConfig.appId || import.meta.env?.VITE_FIREBASE_APP_ID || '',
      measurementId: firebaseConfig.measurementId || import.meta.env?.VITE_FIREBASE_MEASUREMENT_ID || '',
    })
  : getApp();

const firestoreDbId =
  firebaseConfig.firestoreDatabaseId ||
  import.meta.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID ||
  undefined;

export const db =
  firestoreDbId && firestoreDbId !== '(default)'
    ? getFirestore(app, firestoreDbId)
    : getFirestore(app);

async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export { app };
