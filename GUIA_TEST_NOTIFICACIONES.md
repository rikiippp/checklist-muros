# Guía Completa: Probar Notificaciones Push

## ⚠️ Importante

Las notificaciones push **NO funcionan en Expo Go** para Android SDK 53+. Necesitas crear un **Development Build** para probarlas.

---

## 📋 Preparación: Instalar EAS CLI (si no lo tienes)

```bash
npm install -g eas-cli
```

Luego inicia sesión:
```bash
eas login
```

---

## 🚀 Paso 1: Configurar EAS en el Proyecto

Ejecuta en la raíz del proyecto:
```bash
eas build:configure
```

Esto creará un archivo `eas.json` con la configuración de builds.

---

## 🔧 Paso 2: Configurar eas.json para Development Build

Abre `eas.json` y asegúrate de tener una configuración de desarrollo:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {}
  }
}
```

---

## 📱 Paso 3: Crear el Development Build (Android)

**Opción A: Build Local (Recomendado para pruebas rápidas)**

1. **Instalar dependencias necesarias:**
   ```bash
   npm install
   ```

2. **Prebuild (genera código nativo):**
   ```bash
   npx expo prebuild --platform android
   ```

3. **Compilar localmente (requiere Android Studio y SDK):**
   ```bash
   cd android
   ./gradlew assembleDebug
   ```
   
   El APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

**Opción B: Build en la Nube (EAS Build) - Más fácil pero más lento**

```bash
eas build --profile development --platform android
```

Esto te dará un enlace para descargar el APK cuando termine (15-20 minutos).

---

## 📲 Paso 4: Instalar el Development Build

1. Transfiere el APK a tu dispositivo Android
2. Instálalo (necesitarás permitir "Instalar desde fuentes desconocidas")
3. Abre la app (verás "Development Build" en lugar de "Expo Go")

---

## 🧪 Paso 5: Ejecutar la App en Modo Desarrollo

1. Inicia el servidor de desarrollo:
   ```bash
   npm start
   ```

2. Presiona `a` para abrir en Android, o escanea el QR con la app de Development Build (NO con Expo Go)

---

## ✅ Paso 6: Probar las Notificaciones

### Prueba 1: Verificar Registro de Token

1. Inicia sesión en la app con un usuario
2. Abre la consola de Metro (`npm start`) y busca:
   - Si ves el token en los logs, está funcionando ✅
   - Si no ves nada, verifica los permisos de notificaciones

3. **Verificar en Firestore:**
   - Ve a Firebase Console → Firestore
   - Busca el documento del usuario en la colección `users`
   - Debe tener el campo `expoPushToken` con un valor como: `ExponentPushToken[xxxxxxxxxxxxx]`

### Prueba 2: Crear una Tarea y Recibir Notificación

1. **Dispositivo 1 (Usuario A):**
   - Inicia sesión como "Usuario A"
   - Asegúrate de que tenga un `expoPushToken` en Firestore

2. **Dispositivo 2 (Usuario B):**
   - Inicia sesión como "Usuario B"
   - Debe tener un `expoPushToken` diferente

3. **En Dispositivo 1:**
   - Crea una nueva tarea
   - Asigna la tarea a "Usuario B" (o "Para todos")
   - Guarda la tarea

4. **En Dispositivo 2:**
   - Deberías recibir una notificación push con el título "Nueva tarea"
   - El cuerpo mostrará el título de la tarea

### Prueba 3: Verificar Logs de Envío

En la consola de Metro, cuando creas una tarea, deberías ver:
```
Notificaciones enviadas: { data: {...} }
```

Si ves un error, revísalo en la consola.

---

## 🔍 Troubleshooting (Solución de Problemas)

### ❌ No se recibe el token

**Verificar permisos:**
1. Ve a Configuración del dispositivo → Apps → Checklist MUROS → Permisos
2. Asegúrate de que "Notificaciones" esté habilitado

**Verificar en código:**
- Abre `src/notifications.ts` y verifica que no haya errores
- Revisa la consola de Metro para ver si hay errores

### ❌ No se envían notificaciones

**Verificar tokens en Firestore:**
- Ambos usuarios deben tener `expoPushToken` guardado
- Los tokens deben ser diferentes para cada dispositivo

**Verificar que el creador no recibe notificación:**
- Por diseño, el creador de la tarea NO recibe notificación (solo los participantes)

**Verificar logs:**
- Revisa la consola de Metro cuando creas la tarea
- Busca mensajes de "Error al enviar notificaciones"

### ❌ Error: "expo-notifications not available"

- Asegúrate de usar el Development Build, NO Expo Go
- Verifica que el `app.json` tenga el plugin de notificaciones configurado

### ❌ La app no se conecta al servidor de desarrollo

1. Asegúrate de que el dispositivo y la computadora estén en la misma red WiFi
2. Verifica que el servidor Metro esté corriendo (`npm start`)
3. En la app Development Build, agita el dispositivo y presiona "Reload"

---

## 📝 Checklist Final

- [ ] EAS CLI instalado y configurado
- [ ] Development Build creado e instalado en el dispositivo
- [ ] App corriendo en modo desarrollo
- [ ] Permisos de notificaciones otorgados
- [ ] Token guardado en Firestore para al menos 2 usuarios
- [ ] Notificación recibida al crear tarea para otro usuario
- [ ] Logs en consola mostrando éxito

---

## 🎯 Próximos Pasos para Producción

Una vez probado todo:

1. **Crear build de producción:**
   ```bash
   eas build --profile production --platform android
   ```

2. **Subir a Play Store** (si aplica)

3. **Configurar notificaciones en producción:**
   - Las notificaciones funcionarán automáticamente
   - Asegúrate de tener los tokens guardados en Firestore

---

## 💡 Notas Adicionales

- Los tokens de Expo Push Notifications funcionan tanto en desarrollo como en producción
- No necesitas configurar FCM (Firebase Cloud Messaging) para Expo Push Notifications
- Las notificaciones funcionan incluso cuando la app está cerrada (en background)
- Para iOS, el proceso es similar pero requiere cuenta de Apple Developer

