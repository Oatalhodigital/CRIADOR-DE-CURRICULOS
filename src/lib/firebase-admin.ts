import { initializeApp, cert, getApps, getApp, App } from 'firebase-admin/app';
import { getFirestore, Firestore } from 'firebase-admin/firestore';

interface ServiceAccountLike {
  projectId: string;
  clientEmail: string;
  privateKey: string;
}

function normalizePrivateKey(key: string): string {
  // Variáveis de ambiente frequentemente armazenam \n como literal (dois caracteres).
  return key.replace(/\\n/g, '\n');
}

function getServiceAccount(): ServiceAccountLike | null {
  // Opção 1: chave JSON completa em uma única variável de ambiente.
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (serviceAccountJson) {
    try {
      const parsed = JSON.parse(serviceAccountJson);
      if (parsed.private_key || parsed.privateKey) {
        return {
          projectId: parsed.project_id || parsed.projectId,
          clientEmail: parsed.client_email || parsed.clientEmail,
          privateKey: normalizePrivateKey(parsed.private_key || parsed.privateKey),
        };
      }
    } catch (err) {
      console.error('firebase-admin: FIREBASE_SERVICE_ACCOUNT_KEY não é um JSON válido', err);
    }
  }

  // Opção 2: variáveis separadas (recomendado na Vercel para evitar problemas de escaping).
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return {
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      privateKey: normalizePrivateKey(FIREBASE_PRIVATE_KEY),
    };
  }

  return null;
}

const serviceAccount = getServiceAccount();

let adminApp: App | null = null;
let adminDb: Firestore | null = null;

if (serviceAccount) {
  try {
    adminApp = getApps().length === 0 ? initializeApp({ credential: cert(serviceAccount) }) : getApp();
    adminDb = getFirestore(adminApp);
  } catch (err) {
    console.error('firebase-admin: falha ao inicializar app', err);
    adminApp = null;
    adminDb = null;
  }
} else {
  console.warn('firebase-admin: conta de serviço não configurada. Verifique FIREBASE_SERVICE_ACCOUNT_KEY ou FIREBASE_PROJECT_ID + FIREBASE_CLIENT_EMAIL + FIREBASE_PRIVATE_KEY.');
}

export { adminApp, adminDb };
