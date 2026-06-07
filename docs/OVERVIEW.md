# Permisos App — Guía General y Recursos

> App móvil React Native / Expo con sistema de roles y permisos (RBAC) en tiempo real sobre Firebase.

---

## ¿Qué hace esta app?

**Permisos App** es una aplicación móvil que permite controlar **quién puede ver qué** dentro de la app, sin necesidad de publicar una nueva versión. Todo se administra en tiempo real desde un panel de control:

- Un administrador puede **bloquear un usuario** y ese usuario es desconectado en segundos
- Puedes **activar o desactivar pantallas** completas para grupos de usuarios
- Puedes **renombrar pantallas** y el cambio se refleja al instante para todos
- Los **permisos se definen una vez** y se reutilizan en cualquier pantalla o componente

### Ejemplo práctico

```
Administrador entra al panel → asigna el rol "Gerente" a un usuario
→ ese usuario ahora puede ver la pantalla de Reportes
→ sin reiniciar la app, sin nueva versión, en tiempo real
```

---

## Stack tecnológico

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| **Expo** | SDK 54 | Framework base — builds, assets, plugins nativos |
| **React Native** | 0.81 | UI multiplataforma (iOS, Android, Web) |
| **Expo Router** | v6 | Navegación basada en archivos (file-based routing) |
| **TypeScript** | 5.9 | Tipado estático en todo el proyecto |
| **Firebase Auth** | v12 | Autenticación de usuarios |
| **Firestore** | v12 | Base de datos en tiempo real — roles, permisos, logs |
| **Firebase Admin SDK** | v13 | Script de inicialización (solo servidor/Node.js) |
| **React** | 19 | Librería de UI |

---

## Arquitectura en 30 segundos

```
┌─────────────────────────────────────────────┐
│              App (React Native)              │
│                                             │
│  AuthContext ──▶ Firebase Auth              │
│       │               │                     │
│       ▼               ▼                     │
│  Firestore ◀──── users / roles / perms      │
│       │                                     │
│  resolvedPermissionKeys (Set en memoria)    │
│       │                                     │
│  usePermission() / useScreenGuard()         │
│       │                                     │
│  Pantallas visibles según rol del usuario   │
└─────────────────────────────────────────────┘
```

El modelo RBAC funciona así:

```
Permission  →  key única (ej: "manage:users")
    ↑
Role        →  array de permissionIds
    ↑
AppUser     →  roleIds[] + permissionIds[] directos
               Permisos finales = union de ambos
```

---

## Colecciones en Firestore

| Colección | Descripción |
|---|---|
| `users` | Usuarios con sus roles y permisos asignados |
| `roles` | Roles disponibles (Administrador, Gerente, etc.) |
| `permissions` | Permisos atómicos con una key única |
| `screens` | Configuración de pantallas — activas/inactivas, permisos requeridos |
| `logs` | Auditoría inmutable de todas las acciones |
| `sessions` | Registro de sesiones activas e históricas |
| `app_config` | Configuración global de la app |

---

## Roles creados por defecto

| Rol | Acceso |
|---|---|
| `System Master` | Acceso total — gestiona colecciones base |
| `Administrador` | Gestión completa de usuarios y pantallas |
| `Gerente` | Lectura de usuarios, roles y logs |
| `Visualizador` | Solo lectura básica |

---

## Pantallas principales

| Pantalla | Ruta | Permiso requerido |
|---|---|---|
| Home / Tabs | `(tabs)/` | Solo estar autenticado |
| Gestión de usuarios | `pantallas/usuarios` | `manage:users` |
| Gestión de roles | `pantallas/roles` | `manage:roles` |
| Gestión de pantallas | `pantallas/pantallas` | `manage:screens` |
| Logs de auditoría | `pantallas/logs` | `read:logs` |
| Panel System Master | `pantallas/system-master` | `system:master` |

---

## Seguridad

Las reglas de Firestore (`firestore.rules`) son la última línea de defensa. Ningún cliente puede saltarlas aunque modifique el código de la app.

**Reglas clave:**
- Los usuarios solo pueden editar su propio documento, pero **nunca** pueden cambiar sus propios roles, permisos, o estado de bloqueo
- Los logs son **inmutables** — no se pueden editar ni borrar desde el cliente
- Solo `system:master` puede crear nuevos permisos o modificar `app_config`

---

## Archivos clave del proyecto

| Archivo | Propósito |
|---|---|
| `lib/firebase.ts` | Inicialización de Firebase con variables de entorno |
| `lib/types.ts` | Todos los tipos TypeScript del proyecto |
| `context/AuthContext.tsx` | Estado global de autenticación + resolución de permisos en tiempo real |
| `hooks/useAuthHooks.ts` | `usePermission`, `useScreenGuard`, `useAuthRedirect` |
| `seed.js` | Script de inicialización de Firestore (se corre una sola vez) |
| `firestore.rules` | Reglas de seguridad de Firestore |

---

## Setup inicial (resumen)

```bash
# 1. Instalar dependencias
npm install

# 2. Crear .env con credenciales de Firebase
# (ver docs/variables-entorno.md)

# 3. Inicializar datos en Firestore (una sola vez)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js

# 4. Correr la app
npx expo start
```

---

## Documentación técnica completa

| Documento | Contenido |
|---|---|
| [`docs/arquitectura.md`](docs/arquitectura.md) | Diagramas Mermaid de arquitectura, flujo de auth y modelo de datos |
| [`docs/firebase.md`](docs/firebase.md) | Todas las colecciones con campos, tipos y reglas de acceso |
| [`docs/rbac.md`](docs/rbac.md) | Cómo usar permisos en componentes y proteger pantallas |
| [`docs/componentes.md`](docs/componentes.md) | JSDoc de AuthContext, hooks y tipos TypeScript |
| [`docs/variables-entorno.md`](docs/variables-entorno.md) | Variables `.env` y cómo obtenerlas |

---

## Recursos y referencias

### 📖 Documentación oficial

- **[Expo Docs](https://docs.expo.dev/)** — documentación completa del SDK, plugins, EAS Build
- **[Expo Router — Introducción](https://docs.expo.dev/router/introduction/)** — enrutamiento basado en archivos, layouts, deep linking
- **[Expo Router — Conceptos clave](https://docs.expo.dev/router/basics/core-concepts/)** — cómo funciona el directorio `app/`, rutas dinámicas, grupos
- **[React Native Docs](https://reactnative.dev/docs/getting-started)** — componentes, APIs nativas, interacción con la plataforma
- **[Firebase Docs — Firestore](https://firebase.google.com/docs/firestore)** — colecciones, queries, `onSnapshot`, reglas de seguridad
- **[Firebase Docs — Auth](https://firebase.google.com/docs/auth)** — métodos de autenticación, manejo de sesiones
- **[Firebase Docs — Security Rules](https://firebase.google.com/docs/rules)** — sintaxis de reglas, funciones, testing con el emulador
- **[TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)** — referencia del lenguaje, interfaces, tipos avanzados

### 🎬 Videos tutoriales

#### React Native + Expo
- **[Firebase React Native Expo Authentication Setup (File Based Routing)](https://www.youtube.com/watch?v=0_mRcoypaKk)** *(2024)*
  Cómo conectar Firebase Auth con Expo Router — muy relevante para entender cómo funciona `AuthContext` en este proyecto
  
- **[React Native Firebase Authentication with Expo Router — Galaxies.dev](https://www.youtube.com/watch?v=BsOik6ycGqk)** *(2024)*
  Tutorial paso a paso de autenticación con Firebase y Expo Router, incluyendo redirecciones protegidas

- **[File Based Routing | Expo Router Tutorial](https://www.youtube.com/watch?v=4qVLgaRHPaw)** *(2025)*
  Explicación clara de cómo funciona el enrutamiento basado en archivos en Expo Router

- **[Complete Expo Router Bottom Tabs Tutorial](https://www.youtube.com/watch?v=dCsdWVs1iv0)** *(2025)*
  Cómo configurar bottom tabs con Expo Router — útil para entender el `(tabs)/_layout.tsx` de este proyecto

#### Firebase y Firestore
- **[React Native Tutorial: Firebase Firestore CRUD](https://www.youtube.com/watch?v=wTgUxYOehZ4)** *(2024)*
  Operaciones básicas de Firestore en React Native: crear, leer, actualizar documentos

- **[React Native Firebase — Playlist completa](https://www.youtube.com/playlist?list=PLOWOHgzsvIju21ZHBdSvIPHzPpMsw6nQi)**
  Serie de videos cubriendo Firebase Auth, Firestore, Storage y más en React Native

#### Artículos técnicos
- **[How to Build a React Native App and Integrate It with Firebase — freeCodeCamp](https://www.freecodecamp.org/news/react-native-firebase-tutorial/)**
  Tutorial completo: Auth, Firestore CRUD, registro de usuarios — cubre exactamente lo que hace `authService.ts` y `userService.ts`

- **[Build a Todo App with React Native and Firebase — Galaxies.dev](https://galaxies.dev/react-native-firebase)**
  Ejemplo práctico de `onSnapshot` para datos en tiempo real — el mismo patrón que usa `AuthContext.tsx`

---

## Notas importantes

> ⚠️ **`service-account.json`** contiene credenciales de administrador de Firebase. Asegúrate de que esté en `.gitignore` y nunca lo subas a ningún repositorio.

> ⚠️ **`.env`** con tus credenciales Firebase tampoco debe subirse a git.

> ℹ️ La API key que aparece en `data.md` ya fue revocada y no tiene valor. Sin embargo, es buena práctica eliminar ese archivo o limpiar las credenciales antes de compartir el repositorio.
