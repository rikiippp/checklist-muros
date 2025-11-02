// Configuración de Firebase usando variables de entorno
// En desarrollo local: usar archivo .env
// En producción (EAS Build): usar EAS Secrets configurados con 'eas secret:create'

export const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyAHClVD9a39OPemJulKF-kTP7pNNa37r18",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "muros-checklist.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "muros-checklist",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "muros-checklist.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "747167088223",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:747167088223:web:728ab217ea37bfe33225ea"
};

// Identificador simple para agrupar tareas por empresa
export const COMPANY_ID = process.env.EXPO_PUBLIC_COMPANY_ID || "muros";
