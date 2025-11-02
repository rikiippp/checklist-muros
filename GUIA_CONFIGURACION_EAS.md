# Guía de Configuración para EAS Build

Esta guía te ayudará a configurar correctamente las variables de entorno para publicar la app con EAS Build.

## 📋 Requisitos Previos

1. Tener EAS CLI instalado:
```bash
npm install -g eas-cli
```

2. Estar autenticado en EAS:
```bash
eas login
```

## 🔐 Configurar EAS Secrets

Las variables de entorno deben configurarse como **EAS Secrets** para que estén disponibles durante el build.

### Configurar todas las variables:

**IMPORTANTE**: Cuando te pregunte el tipo de secret, selecciona **"string"** para todas las variables (son valores de texto, no archivos).

```bash
# Firebase API Key
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "AIzaSyAHClVD9a39OPemJulKF-kTP7pNNa37r18"
# Tipo: string

# Firebase Auth Domain
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "muros-checklist.firebaseapp.com"
# Tipo: string

# Firebase Project ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value "muros-checklist"
# Tipo: string

# Firebase Storage Bucket
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value "muros-checklist.firebasestorage.app"
# Tipo: string

# Firebase Messaging Sender ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value "747167088223"
# Tipo: string

# Firebase App ID
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_APP_ID --value "1:747167088223:web:728ab217ea37bfe33225ea"
# Tipo: string

# Company ID
eas secret:create --scope project --name EXPO_PUBLIC_COMPANY_ID --value "muros"
# Tipo: string
```

**Nota**: Si prefieres usar el modo interactivo, cuando ejecutes `eas secret:create`, te preguntará:
1. El nombre del secret
2. El tipo: selecciona **"string"** (no "file")
3. El valor: pega el valor correspondiente

### Verificar secrets configurados:

```bash
eas secret:list
```

### Eliminar un secret (si necesitas cambiarlo):

```bash
eas secret:delete --name EXPO_PUBLIC_FIREBASE_API_KEY
```

## 🏗️ Configuración para Build

### Para Android:

```bash
eas build --platform android
```

### Para iOS:

```bash
eas build --platform ios
```

### Para ambas plataformas:

```bash
eas build --platform all
```

## 📝 Desarrollo Local

Para desarrollo local, crea un archivo `.env` en la raíz del proyecto con:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAHClVD9a39OPemJulKF-kTP7pNNa37r18
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=muros-checklist.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=muros-checklist
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=muros-checklist.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=747167088223
EXPO_PUBLIC_FIREBASE_APP_ID=1:747167088223:web:728ab217ea37bfe33225ea
EXPO_PUBLIC_COMPANY_ID=muros
```

**Importante**: El archivo `.env` está en `.gitignore` y NO debe subirse a Git.

## ✅ Verificación

Después de configurar los secrets, verifica que todo esté correcto:

1. **Verificar secrets**:
   ```bash
   eas secret:list
   ```

2. **Probar build localmente** (opcional):
   ```bash
   eas build --platform android --local
   ```

3. **Hacer build en EAS**:
   ```bash
   eas build --platform android
   ```

## 🔍 Solución de Problemas

### Error: "Unable to resolve module ./firebaseConfig"

**Causa**: El archivo `firebaseConfig.ts` no está disponible durante el build.

**Solución**: 
- Verifica que `src/firebase/firebaseConfig.ts` esté en el repositorio (ya no debe estar en `.gitignore`)
- Verifica que los EAS Secrets estén configurados correctamente

### Error: Variables de entorno vacías

**Causa**: Los EAS Secrets no están configurados o tienen nombres incorrectos.

**Solución**:
- Verifica los nombres de las variables (deben comenzar con `EXPO_PUBLIC_`)
- Lista los secrets: `eas secret:list`
- Recrea los secrets si es necesario

### Error: Imagen no cuadrada

**Causa**: Las imágenes de icono deben ser cuadradas (1024x1024px mínimo).

**Solución**: 
- Se ha configurado `favIcon.png` para `icon` y `adaptiveIcon`
- Verifica que `assets/favIcon.png` sea una imagen cuadrada

## 📚 Recursos

- [Documentación de EAS Secrets](https://docs.expo.dev/build-reference/variables/)
- [Documentación de EAS Build](https://docs.expo.dev/build/introduction/)

