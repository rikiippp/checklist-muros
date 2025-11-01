import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Registra el dispositivo para recibir notificaciones push.
 * Retorna null si las notificaciones no están disponibles (ej: Expo Go en Android con SDK 53+).
 * La app funcionará normalmente sin notificaciones si no están disponibles.
 */
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  try {
    // Verificar permisos
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      return null;
    }

    // Intentar obtener el token (fallará silenciosamente en Expo Go para Android SDK 53+)
    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData?.data || null;

    // Configurar canal de notificaciones en Android
    if (Platform.OS === 'android' && token) {
      try {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default',
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
        });
      } catch (channelError) {
        // Ignorar errores de canal si no está disponible (ej: en Expo Go)
      }
    }
    
    return token;
  } catch (error) {
    // Si estamos en Expo Go (Android SDK 53+) o hay algún error,
    // simplemente retornar null. La app seguirá funcionando sin notificaciones.
    return null;
  }
}


