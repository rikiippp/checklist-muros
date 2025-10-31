# Checklist MUROS

Aplicación móvil de tareas en tiempo real para equipos internos de MUROS.

## Características
- Autenticación por email y contraseña (Firebase Auth)
- Tareas en tiempo real (Cloud Firestore)
- Colores por prioridad (IMPORTANTE, URGENTE, PRIORIDAD, etc.)
- Asignación de tareas: a todo el equipo o a un miembro específico
- Historial de tareas completadas
- Permisos en la app: solo creador o admin pueden eliminar; tareas "para todos" solo las elimina el admin
- Pantalla "Mi equipo" con nombre y rol; el admin puede cambiar roles
- Persistencia de sesión en el dispositivo

## Tech stack
- Expo (React Native + TypeScript)
- Firebase: Auth + Firestore
- React Navigation, React Native Paper

## Configuración
1. Copia `src/firebase/firebaseConfig.example.ts` a `src/firebase/firebaseConfig.ts` y pega tus credenciales Web de Firebase. Ajusta `COMPANY_ID` (por defecto `muros`).
2. En Firebase Console, habilita Authentication (Email/Password) y crea Firestore.
3. Reglas de Firestore (modo prueba para desarrollo):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == uid;
      allow update, delete: if request.auth != null && request.auth.uid == uid;
    }
    match /tasks/{taskId} {
      allow read, write: if request.auth != null;
    }
  }
}
```
4. Índices sugeridos para `tasks`:
   - `companyId` Asc, `done` Asc, `createdAt` Desc
   - Si la consola sugiere otro índice, créalo con el enlace que provee.

## Ejecutar en desarrollo
```
npm install
npm start
```
- Android: presiona `a`
- Web: `w`
- Expo Go: escanea el QR

## Scripts
- `npm start`: iniciar Metro + Expo
- `npm run android|ios|web`

## Publicación
- Compartir por Expo Go / EAS Update (QR)
- Generar binarios con EAS Build (AAB/IPA) si se publicará en tiendas

## Licencia
Uso interno MUROS.
