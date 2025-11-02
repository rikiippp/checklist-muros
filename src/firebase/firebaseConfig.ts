// Configuración de Firebase usando variables de entorno
// En desarrollo local: usar archivo .env
// En producción (EAS Build): usar EAS Secrets configurados con 'eas secret:create'

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};

// Identificador simple para agrupar tareas por empresa
export const COMPANY_ID = process.env.EXPO_PUBLIC_COMPANY_ID;
