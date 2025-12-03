# 📱 TaskFlow - Gestión de Tareas para Equipos

<div align="center">

![TaskFlow](https://img.shields.io/badge/TaskFlow-v1.0.0-orange?style=for-the-badge)
![React Native](https://img.shields.io/badge/React%20Native-0.81.5-blue?style=for-the-badge&logo=react)
![Expo](https://img.shields.io/badge/Expo-~54.0.20-black?style=for-the-badge&logo=expo)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue?style=for-the-badge&logo=typescript)
![Firebase](https://img.shields.io/badge/Firebase-12.5.0-orange?style=for-the-badge&logo=firebase)

**Aplicación móvil moderna para gestión de tareas en tiempo real, diseñada para equipos que necesitan organizarse y colaborar eficientemente.**

[Características](#-características) • [Tecnologías](#-tecnologías) • [Instalación](#-instalación) • [Configuración](#-configuración) • [Uso](#-uso)

</div>

---

## ✨ Características

### 🎯 Gestión de Tareas
- ✅ **Creación y asignación** de tareas individuales o para todo el equipo
- 🎨 **Sistema de prioridades** con colores personalizables (IMPORTANTE, URGENTE, PRIORIDAD, INFO, NORMAL)
- 📅 **Fechas límite** con notificaciones automáticas
- 📎 **Adjuntos de archivos** (PDFs, imágenes, videos) con soporte para Cloudinary
- 🔍 **Filtros avanzados** por prioridad, persona asignada y tiempo (vencidas, hoy, próximas)

### 👥 Gestión de Equipos
- 👤 **Roles y permisos** (Administrador y Usuario)
- 📊 **Estadísticas por usuario** (tareas asignadas, completadas, vencidas)
- 🔄 **Gestión de roles** por parte de administradores
- 👀 **Vista de equipo** con información detallada de cada miembro

### 📈 Productividad
- ✅ **Historial completo** de tareas completadas con filtros por tiempo
- 🔔 **Notificaciones push** en tiempo real
- 📱 **Persistencia de sesión** automática
- 🌐 **Sincronización en tiempo real** con Firebase

### 🔐 Seguridad
- 🔑 **Autenticación segura** con Firebase Auth
- 🔒 **Restablecimiento de contraseña** con emails personalizados
- 👁️ **Mostrar/ocultar contraseña** en login
- 🛡️ **Reglas de seguridad** configuradas en Firestore

---

## 🛠️ Tecnologías

### Frontend
- **React Native** - Framework multiplataforma
- **Expo** - Herramientas y servicios para desarrollo
- **TypeScript** - Tipado estático
- **React Navigation** - Navegación entre pantallas
- **React Native Paper** - Componentes Material Design

### Backend
- **Firebase Authentication** - Autenticación de usuarios
- **Cloud Firestore** - Base de datos en tiempo real
- **Cloudinary** - Almacenamiento de archivos adjuntos
- **Expo Notifications** - Sistema de notificaciones push

---

## 🚀 Instalación

### Prerrequisitos
- Node.js 18+ y npm
- Expo CLI (`npm install -g expo-cli`)
- Cuenta de Firebase
- (Opcional) Cuenta de Cloudinary para adjuntos

### Pasos

1. **Clonar el repositorio**
```bash
git clone <repository-url>
cd checklist-muros
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env
# Editar .env con tus credenciales de Firebase y Cloudinary
```

Ver [SETUP_ENV.md](./SETUP_ENV.md) para más detalles sobre la configuración.

---

## ⚙️ Configuración

### 1. Firebase Setup

1. Crea un proyecto en [Firebase Console](https://console.firebase.google.com/)
2. Habilita **Authentication** con Email/Password
3. Crea una base de datos **Firestore**
4. Configura las reglas de seguridad (ver sección siguiente)
5. Obtén las credenciales de tu proyecto y agrégalas al archivo `.env`

### 2. Reglas de Firestore

Configura estas reglas en Firebase Console > Firestore > Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update, delete: if request.auth != null && request.auth.uid == uid;
      allow update: if request.auth != null 
        && uid != request.auth.uid
        && exists(/databases/$(database)/documents/users/$(request.auth.uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin'
        && exists(/databases/$(database)/documents/users/$(uid))
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == 
           get(/databases/$(database)/documents/users/$(uid)).data.companyId;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Índices de Firestore

Crea estos índices compuestos en Firestore:

- **Colección `tasks`:**
  - `companyId` (Ascending) + `done` (Ascending) + `createdAt` (Descending)

Si Firebase sugiere otros índices, créalos usando el enlace proporcionado.

### 4. Cloudinary (Opcional)

Para habilitar adjuntos de archivos:

1. Crea una cuenta en [Cloudinary](https://cloudinary.com/)
2. Crea un Upload Preset sin firmar
3. Agrega las credenciales a tu archivo `.env`

Ver [SETUP_ENV.md](./SETUP_ENV.md) para más detalles.

---

## 💻 Uso

### Desarrollo

```bash
# Iniciar servidor de desarrollo
npm start

# Ejecutar en Android
npm run android

# Ejecutar en iOS
npm run ios

# Ejecutar en Web
npm run web
```

### Builds de Producción

#### EAS Build (Recomendado)

```bash
# Instalar EAS CLI
npm install -g eas-cli

# Login
eas login

# Configurar proyecto
eas build:configure

# Build para Android
eas build --platform android

# Build para iOS
eas build --platform ios
```

Ver [GUIA_CONFIGURACION_EAS.md](./GUIA_CONFIGURACION_EAS.md) para más detalles.

#### Actualizaciones OTA

```bash
# Publicar actualización
eas update --branch production --message "Descripción de cambios"
```

Ver [GUIA_ACTUALIZACIONES_OTA.md](./GUIA_ACTUALIZACIONES_OTA.md) para más detalles.

---

## 📱 Funcionalidades Principales

### Para Usuarios
- ✅ Ver tareas asignadas
- ✅ Completar tareas
- ✅ Filtrar por prioridad, persona y tiempo
- ✅ Ver historial de tareas completadas
- ✅ Adjuntar archivos a tareas
- ✅ Ver estadísticas personales

### Para Administradores
- ✅ Todas las funcionalidades de usuario
- ✅ Crear y asignar tareas
- ✅ Eliminar tareas
- ✅ Gestionar roles de usuarios
- ✅ Ver estadísticas del equipo
- ✅ Configurar tareas con adjuntos obligatorios

---

## 📂 Estructura del Proyecto

```
checklist-muros/
├── assets/              # Imágenes y recursos
├── src/
│   ├── components/      # Componentes reutilizables
│   ├── firebase/        # Configuración de Firebase
│   ├── navigation/      # Configuración de navegación
│   ├── screens/         # Pantallas de la aplicación
│   ├── services/        # Servicios (notificaciones, etc.)
│   └── theme.ts         # Configuración de temas
├── app.json            # Configuración de Expo
├── eas.json            # Configuración de EAS Build
├── package.json        # Dependencias
└── README.md          # Este archivo
```

---

## 🔧 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm start` | Inicia el servidor de desarrollo Expo |
| `npm run android` | Ejecuta la app en Android |
| `npm run ios` | Ejecuta la app en iOS |
| `npm run web` | Ejecuta la app en navegador web |
| `npm run update` | Publica actualización OTA a producción |

---

## 📚 Documentación Adicional

- [SETUP_ENV.md](./SETUP_ENV.md) - Configuración de variables de entorno
- [GUIA_CONFIGURACION_EAS.md](./GUIA_CONFIGURACION_EAS.md) - Guía de configuración de EAS Build
- [GUIA_ACTUALIZACIONES_OTA.md](./GUIA_ACTUALIZACIONES_OTA.md) - Guía de actualizaciones OTA

---

## 🤝 Contribuir

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

---

## 📄 Licencia

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

---

## 🙏 Agradecimientos

- [Expo](https://expo.dev/) por las herramientas de desarrollo
- [Firebase](https://firebase.google.com/) por el backend
- [React Native Paper](https://callstack.github.io/react-native-paper/) por los componentes UI
- [Cloudinary](https://cloudinary.com/) por el almacenamiento de archivos

---

<div align="center">

**Hecho con ❤️ usando React Native y Expo**

⭐ Si te gusta este proyecto, dale una estrella en GitHub

</div>
