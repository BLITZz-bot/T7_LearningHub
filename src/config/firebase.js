// Firebase Configuration
// Replace with your Firebase project credentials from Firebase Console
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const getEnv = (key) => {
  const value = import.meta.env[key];
  return typeof value === 'string' ? value.trim() : '';
};

const firebaseConfig = {
  apiKey: getEnv('VITE_FIREBASE_API_KEY'),
  authDomain: getEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: getEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: getEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: getEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: getEnv('VITE_FIREBASE_APP_ID')
};

if (!firebaseConfig.apiKey) {
  throw new Error('Missing VITE_FIREBASE_API_KEY. Check your .env and restart the Vite dev server.');
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication
export const auth = getAuth(app);

// Initialize Cloud Firestore
export const db = getFirestore(app);

export default app;
