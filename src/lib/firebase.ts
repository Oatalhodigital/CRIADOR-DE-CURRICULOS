import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Validação defensiva para evitar o crash da aplicação (Client-side Exception)
const isFirebaseValid = firebaseConfig.apiKey && firebaseConfig.projectId;

if (!isFirebaseValid && typeof window !== 'undefined') {
  console.error('❌ ERRO CRÍTICO: Chaves do Firebase ausentes no ambiente de produção!');
}

// Só inicializa se houver chaves válidas, evitando travar a renderização global do App Router
const app =
  getApps().length === 0 && isFirebaseValid
    ? initializeApp(firebaseConfig)
    : getApps().length > 0
      ? getApp()
      : null;
const db = app ? getFirestore(app) : null;
const auth = app ? getAuth(app) : null;

export { app, db, auth };
