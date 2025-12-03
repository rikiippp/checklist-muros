# 📋 Guía de Configuración de Variables de Entorno

Este archivo contiene las instrucciones para configurar las variables de entorno necesarias para que la app funcione.

## 🚀 Configuración Rápida

### Paso 1: Crear archivo `.env`

Crea un archivo llamado `.env` en la raíz del proyecto (mismo nivel que `package.json`).

### Paso 2: Copiar y pegar el siguiente contenido

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSyAHClVD9a39OPemJulKF-kTP7pNNa37r18
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=muros-checklist.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=muros-checklist
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=muros-checklist.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=747167088223
EXPO_PUBLIC_FIREBASE_APP_ID=1:747167088223:web:728ab217ea37bfe33225ea
EXPO_PUBLIC_COMPANY_ID=muros

# Cloudinary (adjuntos)
EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=dthp8pdsa
EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=checklist_muros_attachments
```

### Paso 3: Guardar y reiniciar

Después de crear el archivo `.env`, reinicia Expo:
```bash
npm start
```

## 📝 Descripción de Variables

| Variable | Descripción | Dónde obtenerla |
|----------|-------------|-----------------|
| `EXPO_PUBLIC_FIREBASE_API_KEY` | API Key de Firebase | Firebase Console > Configuración del proyecto > General > Configuración de SDK |
| `EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN` | Dominio de autenticación | Firebase Console > Configuración del proyecto > General |
| `EXPO_PUBLIC_FIREBASE_PROJECT_ID` | ID del proyecto Firebase | Firebase Console > Configuración del proyecto > General |
| `EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET` | Bucket de almacenamiento | Firebase Console > Configuración del proyecto > General |
| `EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | ID del remitente de mensajería | Firebase Console > Configuración del proyecto > Cloud Messaging |
| `EXPO_PUBLIC_FIREBASE_APP_ID` | ID de la aplicación | Firebase Console > Configuración del proyecto > General > Tus apps |
| `EXPO_PUBLIC_COMPANY_ID` | Identificador de la empresa/equipo | Valor personalizado (ej: "muros") |
| `EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME` | Nombre de tu cuenta de Cloudinary | Dashboard de Cloudinary |
| `EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET` | Upload preset unsigned para adjuntos | Settings → Upload → Upload presets |

## 🔐 Seguridad

- ✅ El archivo `.env` está en `.gitignore` y **NO se sube al repositorio**
- ✅ **NUNCA** compartas el archivo `.env` públicamente
- ✅ Cada desarrollador debe crear su propio archivo `.env` local

## 🏗️ Para Builds de Producción (APK)

Para builds de producción, las variables deben estar configuradas como **EAS Secrets**:

```bash
# Verificar secrets existentes
eas secret:list

# Si faltan, crearlos con:
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_API_KEY --value "TU_VALOR"
eas secret:create --scope project --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value "TU_VALOR"
# ... etc para cada variable
```

Ver `GUIA_CONFIGURACION_EAS.md` para más detalles.

## ✅ Verificación

Después de crear el `.env`, verifica que la app funcione:

1. Ejecuta `npm start`
2. Abre la app en Expo Go
3. Si ves un error sobre variables faltantes, verifica que el archivo `.env` esté en la raíz del proyecto
4. Si todo está bien, deberías poder iniciar sesión normalmente

## 🐛 Solución de Problemas

### Error: "Faltan variables de entorno"
- Verifica que el archivo se llame exactamente `.env` (con el punto al inicio)
- Verifica que esté en la raíz del proyecto (mismo nivel que `package.json`)
- Reinicia Expo después de crear el archivo

### Error: "invalid-api-key"
- Verifica que los valores en `.env` sean correctos
- Verifica que no haya espacios extra antes o después de los valores
- Verifica que cada variable esté en una línea separada

