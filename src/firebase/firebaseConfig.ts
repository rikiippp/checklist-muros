// Configuración de Firebase usando variables de entorno
// En desarrollo local: usar archivo .env
// En producción (EAS Build): usar EAS Secrets configurados con 'eas secret:create'

// Validar que las variables de entorno estén disponibles
const apiKey = process.env.EXPO_PUBLIC_FIREBASE_API_KEY;
const authDomain = process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN;
const projectId = process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID;
const storageBucket = process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET;
const messagingSenderId = process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
const appId = process.env.EXPO_PUBLIC_FIREBASE_APP_ID;

if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
  const missingVars = [];
  if (!apiKey) missingVars.push('EXPO_PUBLIC_FIREBASE_API_KEY');
  if (!authDomain) missingVars.push('EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN');
  if (!projectId) missingVars.push('EXPO_PUBLIC_FIREBASE_PROJECT_ID');
  if (!storageBucket) missingVars.push('EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET');
  if (!messagingSenderId) missingVars.push('EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID');
  if (!appId) missingVars.push('EXPO_PUBLIC_FIREBASE_APP_ID');
  
  throw new Error(
    `❌ Error de configuración de Firebase: Faltan las siguientes variables de entorno:\n` +
    `${missingVars.join(', ')}\n\n` +
    `Para desarrollo local, crea un archivo .env en la raíz del proyecto con estas variables.\n` +
    `Para producción, configura EAS Secrets con: eas secret:create`
  );
}

export const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId
};

// Identificador simple para agrupar tareas por empresa
export const COMPANY_ID = process.env.EXPO_PUBLIC_COMPANY_ID || 'muros';
