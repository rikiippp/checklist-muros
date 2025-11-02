# Guía de Actualizaciones OTA (Over-The-Air)

Esta aplicación está configurada para recibir actualizaciones automáticamente sin necesidad de reinstalar o recompilar.

## 🚀 Cómo Publicar Actualizaciones

### Método Recomendado: EAS Update

Para publicar una actualización OTA, utiliza EAS Update:

```bash
# Publicar actualización para ambas plataformas (Android e iOS)
npx eas update --branch production --message "Descripción de los cambios"

# O con mensaje personalizado
npx eas update --branch production --message "Corrección de bugs en pantalla de tareas"
```

También puedes usar los scripts de npm:

```bash
# Actualización general
npm run update "Descripción de los cambios"

# Solo Android
npm run update:android "Descripción para Android"

# Solo iOS
npm run update:ios "Descripción para iOS"
```

### Requisitos Previos

1. **Tener EAS CLI instalado**:
   ```bash
   npm install -g eas-cli
   ```

2. **Estar autenticado en EAS**:
   ```bash
   eas login
   ```

3. **Configurar el proyecto** (si es la primera vez):
   ```bash
   eas build:configure
   ```

## 📱 Cómo Reciben las Actualizaciones los Usuarios

1. **Automático al abrir la app**: Cuando un usuario abre la aplicación, automáticamente verifica si hay actualizaciones disponibles.

2. **Proceso transparente**: 
   - Si hay una actualización, se descarga en segundo plano
   - Mientras descarga, aparece un modal con "Descargando actualización..."
   - Una vez descargada, la app se reinicia automáticamente con la nueva versión

3. **Sin interrupciones**: Los usuarios no necesitan hacer nada, solo usar la app normalmente.

## ⚙️ Configuración Actual

El proyecto está configurado con:

```json
"updates": {
  "enabled": true,
  "checkAutomatically": "ON_LOAD",
  "fallbackToCacheTimeout": 0
},
"runtimeVersion": {
  "policy": "appVersion"
}
```

- **`checkAutomatically: "ON_LOAD"`**: Verifica actualizaciones cada vez que se abre la app
- **`fallbackToCacheTimeout: 0`**: No espera, usa la versión más reciente disponible
- **`runtimeVersion: "appVersion"`**: Usa la versión de la app como runtime version

## 📝 Flujo de Actualización

### Para el Desarrollador (Tú):

1. Haces cambios en el código (pantallas, lógica, estilos, etc.)
2. Ejecutas: `npx eas update --branch production --message "Descripción"`
3. EAS publica la actualización
4. **¡Listo!** Los usuarios recibirán la actualización automáticamente

### Para los Usuarios:

1. Abren la app normalmente
2. La app verifica si hay actualizaciones (automático)
3. Si hay actualización:
   - Aparece modal "Descargando actualización..."
   - Se descarga la nueva versión
   - La app se reinicia con los cambios
4. Continúan usando la app con los nuevos cambios

## ⚠️ Limitaciones Importantes

### ✅ Lo que SÍ se actualiza automáticamente:

- **Pantallas y componentes React Native**
- **Lógica de JavaScript/TypeScript**
- **Estilos y CSS**
- **Assets estáticos** (imágenes, fuentes, etc.)
- **Configuración de Firebase** (si solo cambia en el código JS)
- **Cambios en `app.json`** que no requieren rebuild nativo

### ❌ Lo que NO se actualiza automáticamente (requiere rebuild):

- **Cambios en código nativo** (Java/Kotlin para Android, Swift/Objective-C para iOS)
- **Nuevos plugins nativos** que requieren configuración nativa
- **Cambios en `package.json`** que agregan dependencias nativas
- **Cambios en versiones de SDK de Expo** (requiere actualizar `expo` en package.json y rebuild)
- **Cambios en permisos nativos** (cámara, ubicación, etc.)
- **Cambios en configuración de Firebase** que requieren cambios en archivos nativos
- **Cambios en `android/build.gradle` o `ios/Podfile`**

### Ejemplo Práctico:

✅ **Actualización OTA (sin rebuild)**:
- Cambiar el color de un botón
- Agregar una nueva pantalla
- Modificar la lógica de validación
- Cambiar textos o mensajes
- Agregar nuevos campos en formularios

❌ **Requiere rebuild**:
- Agregar un nuevo plugin de cámara
- Cambiar la versión de Expo SDK
- Modificar permisos de Android/iOS
- Cambiar el package name o bundle identifier

## 🔄 Compatibilidad con EAS Build

Las actualizaciones OTA funcionan perfectamente con EAS Build:

1. **Primer build**: Creas un build con `eas build`
2. **Actualizaciones**: Publicas actualizaciones OTA con `eas update`
3. **Nuevos builds**: Si necesitas cambios nativos, haces un nuevo build

**Importante**: Cada build debe tener la misma `runtimeVersion` para recibir las mismas actualizaciones OTA.

## 🔥 Compatibilidad con Firebase

Las actualizaciones OTA son 100% compatibles con Firebase:

- ✅ **Firebase Auth**: Funciona normalmente
- ✅ **Cloud Firestore**: Funciona normalmente
- ✅ **Firebase Config**: Si solo cambia en JS, funciona
- ✅ **Firebase Storage**: Funciona normalmente

**Nota**: Si cambias la configuración de Firebase (API keys, etc.) en archivos nativos, necesitarás un rebuild.

## 🐛 Solución de Problemas

### La actualización no se descarga

1. Verifica que estés usando un build de producción (no Expo Go)
2. Verifica que el build tenga `runtimeVersion` configurado
3. Revisa los logs: `expo-updates` muestra errores en consola

### Error "No update available"

- Asegúrate de haber publicado la actualización: `eas update --branch production`
- Verifica que el `runtimeVersion` del build coincida con la actualización publicada

### La app se queda en "Descargando..."

- Esto puede pasar si hay problemas de red
- La app reintentará automáticamente en el próximo inicio

### Actualizaciones en desarrollo

Las actualizaciones OTA **NO funcionan en desarrollo** (Expo Go). Solo funcionan en builds de producción compilados con EAS Build o `expo build`.

## 📚 Recursos Adicionales

- [Documentación oficial de Expo Updates](https://docs.expo.dev/versions/latest/sdk/updates/)
- [Documentación de EAS Update](https://docs.expo.dev/eas-update/introduction/)
- [Guía de runtimeVersion](https://docs.expo.dev/eas-update/runtime-versions/)

## ✅ Checklist Antes de Publicar

- [ ] Cambios probados en desarrollo
- [ ] Sin cambios nativos (o ya se hizo rebuild)
- [ ] `app.json` tiene `runtimeVersion` configurado
- [ ] Build de producción está actualizado (si hubo cambios nativos)
- [ ] Mensaje descriptivo para la actualización
- [ ] Ejecutado: `eas update --branch production --message "..."`

---

**Nota**: La primera vez que uses EAS Update, es posible que necesites configurar las branches. Por defecto, usa `production`.

