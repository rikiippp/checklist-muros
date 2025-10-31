import { initializeApp } from 'firebase/app';
import { getAuth, initializeAuth, type Auth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './firebaseConfig';

// Carga perezosa de dependencias para evitar errores de tipos en RN
let getReactNativePersistence: any;
let ReactNativeAsyncStorage: any;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getReactNativePersistence = require('firebase/auth').getReactNativePersistence;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ReactNativeAsyncStorage = require('@react-native-async-storage/async-storage').default;
} catch {}

const app = initializeApp(firebaseConfig);

let auth: Auth;
try {
  if (getReactNativePersistence && ReactNativeAsyncStorage) {
    auth = initializeAuth(app, {
      persistence: getReactNativePersistence(ReactNativeAsyncStorage),
    });
  } else {
    auth = getAuth(app);
  }
} catch {
  auth = getAuth(app);
}

export { auth };
export const db = getFirestore(app);
