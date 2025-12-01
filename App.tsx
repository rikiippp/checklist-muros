import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import * as Updates from 'expo-updates';
import RootNavigator from './src/navigation/index.tsx';
import { theme } from './src/theme.ts';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './src/firebase/index.ts';
import { registerForPushNotificationsAsync } from './src/notifications.ts';
import { doc, setDoc, getFirestore, updateDoc } from 'firebase/firestore';
import { db } from './src/firebase/index.ts';
import UpdateModal from './src/components/UpdateModal.tsx';

export default function App() {
  const [ready, setReady] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('Actualizando app...');

  // Verificar y descargar actualizaciones al iniciar la app
  useEffect(() => {
    async function checkForUpdates() {
      // Solo verificar actualizaciones en builds de producción (no en Expo Go o desarrollo)
      if (__DEV__) {
        setReady(true);
        return;
      }

      // Verificar que Updates esté disponible (solo en builds compilados)
      try {
        if (!Updates.isEnabled) {
          setReady(true);
          return;
        }

        const update = await Updates.checkForUpdateAsync();
        
        if (update.isAvailable) {
          setIsUpdating(true);
          setUpdateMessage('Descargando actualización...');
          
          // Descargar la actualización
          await Updates.fetchUpdateAsync();
          
          setUpdateMessage('Actualización descargada. Reiniciando...');
          
          // Esperar un momento para que el usuario vea el mensaje
          setTimeout(() => {
            // Recargar la app con la nueva actualización
            Updates.reloadAsync();
          }, 1500);
        } else {
          // No hay actualizaciones disponibles, continuar normalmente
          setReady(true);
        }
      } catch (error) {
        // Si hay un error, simplemente continuar sin actualizar
        console.warn('Error al verificar actualizaciones:', error);
        setReady(true);
      }
    }

    checkForUpdates();
  }, []);

  // Manejar el estado de autenticación de Firebase y mantener sesión activa
  useEffect(() => {
    if (!ready) return;

    let tokenRefreshInterval: NodeJS.Timeout | null = null;

    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        // Registrar token de notificaciones
        const token = await registerForPushNotificationsAsync();
        if (token) {
          try {
            await updateDoc(doc(db, 'users', u.uid), { expoPushToken: token });
          } catch {}
        }

        // Renovar token de autenticación cada 50 minutos para mantener sesión activa
        // Firebase Auth tokens expiran después de 1 hora, pero se renuevan automáticamente
        // Esto asegura que la sesión no se cierre por inactividad
        const renewToken = async () => {
          try {
            // Obtener el token actual para forzar su renovación si es necesario
            await u.getIdToken(true); // true = forzar refresh
            if (__DEV__) {
              console.log('Token de autenticación renovado');
            }
          } catch (error) {
            console.warn('Error al renovar token:', error);
          }
        };

        // Renovar inmediatamente y luego cada 50 minutos
        renewToken();
        tokenRefreshInterval = setInterval(renewToken, 50 * 60 * 1000); // 50 minutos
      } else {
        // Si el usuario cierra sesión, limpiar el intervalo
        if (tokenRefreshInterval) {
          clearInterval(tokenRefreshInterval);
          tokenRefreshInterval = null;
        }
      }
    });

    return () => {
      unsub();
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, [ready]);

  // Mostrar loading inicial o modal de actualización
  if (!ready) {
    return (
      <PaperProvider theme={theme}>
        <UpdateModal visible={isUpdating} message={updateMessage} />
        <StatusBar style="dark" />
      </PaperProvider>
    );
  }

  return (
    <PaperProvider theme={theme}>
      <RootNavigator />
      <UpdateModal visible={isUpdating} message={updateMessage} />
      <StatusBar style="dark" />
    </PaperProvider>
  );
}
