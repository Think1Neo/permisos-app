# Firebase — Documentación técnica

Proyecto Firebase: **des-app-movil**

---

## Servicios utilizados

| Servicio | Uso |
|---|---|
| Firebase Auth | Autenticación de usuarios (email/password) |
| Firestore | Base de datos principal — usuarios, roles, permisos, logs |
| Firebase Admin SDK | Script de seed (`seed.js`) — solo en servidor |

---

## Inicialización (`lib/firebase.ts`)

```ts
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Lee credenciales desde variables de entorno (EXPO_PUBLIC_*)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);   // instancia de autenticación
export const db = getFirestore(app); // instancia de Firestore
```

El patrón `getApps().length === 0` evita inicializar Firebase múltiples veces en hot reload de Expo.

---

## Colecciones Firestore

### `users/{uid}`

Documento de usuario de la app. El UID coincide con el UID de Firebase Auth.

| Campo | Tipo | Descripción |
|---|---|---|
| `email` | `string` | Email del usuario |
| `displayName` | `string` | Nombre para mostrar |
| `photoURL` | `string \| null` | URL de foto de perfil |
| `isActive` | `boolean` | Si el usuario puede acceder a la app |
| `isBlocked` | `boolean` | Bloqueo manual por un administrador |
| `roleIds` | `string[]` | IDs de roles asignados |
| `permissionIds` | `string[]` | Permisos adicionales directos (fuera de roles) |
| `lastLogin` | `Timestamp \| null` | Último inicio de sesión |
| `createdAt` | `Timestamp` | Fecha de creación |
| `updatedAt` | `Timestamp` | Última modificación |
| `updatedBy` | `string` | UID del usuario que modificó |

**Reglas de acceso:**
- Lectura: el propio usuario, o quien tenga `manage:users` o `system:master`
- Creación: solo el propio usuario puede crear su documento
- Actualización: admin, system master, o `manage:users` — el propio usuario puede editar datos básicos pero NO puede cambiar `isBlocked`, `isActive`, `roleIds`, `permissionIds`
- Borrado: **deshabilitado**

---

### `roles/{roleId}`

Define un rol con un conjunto de permisos.

| Campo | Tipo | Descripción |
|---|---|---|
| `name` | `string` | Nombre del rol (ej: "Administrador") |
| `description` | `string` | Descripción del rol |
| `permissionIds` | `string[]` | IDs de permisos que otorga este rol |
| `order` | `number` | Orden de visualización (`-1` para System Master) |
| `isActive` | `boolean` | Si el rol está habilitado |
| `createdAt` | `Timestamp` | — |
| `updatedAt` | `Timestamp` | — |
| `createdBy` | `string` | UID o "seed" |
| `updatedBy` | `string` | — |

**Roles creados por el seed:**

| ID | Nombre | Descripción |
|---|---|---|
| `role_system_master` | System Master | Acceso total, gestiona colecciones base |
| `role_admin` | Administrador | Gestión completa de usuarios y pantallas |
| `role_gerente` | Gerente | Lectura de usuarios, roles y logs |
| `role_visualizador` | Visualizador | Solo lectura básica |

**Reglas de acceso:**
- Lectura: pública (cualquiera, incluso sin autenticar)
- Creación/Actualización: `manage:roles` o `system:master`
- Borrado: solo `system:master`

---

### `permissions/{permId}`

Permiso atómico identificado por una `key` única.

| Campo | Tipo | Descripción |
|---|---|---|
| `key` | `string` | Identificador único (ej: `"manage:users"`) |
| `name` | `string` | Nombre legible |
| `description` | `string` | Qué permite hacer |
| `category` | `string` | Categoría (ej: `"users"`, `"screens"`, `"system"`) |
| `isActive` | `boolean` | Si el permiso está habilitado |
| `createdAt` | `Timestamp` | — |
| `updatedAt` | `Timestamp` | — |
| `createdBy` | `string` | — |
| `updatedBy` | `string` | — |

**Permisos creados por el seed:**

| Key | Descripción |
|---|---|
| `read:users` | Ver lista de usuarios |
| `manage:users` | Crear, editar y bloquear usuarios |
| `read:roles` | Ver roles y permisos |
| `manage:roles` | Crear y editar roles |
| `manage:screens` | Activar/desactivar/renombrar pantallas |
| `read:logs` | Ver logs de auditoría |
| `manage:config` | Modificar configuración de la app |
| `system:master` | Acceso total (solo para `role_system_master`) |

**Reglas de acceso:**
- Lectura: cualquier usuario autenticado
- Creación/Actualización: solo `system:master`
- Borrado: **deshabilitado**

---

### `screens/{screenId}`

Configuración de pantallas de la app. Permite activar/desactivar pantallas y renombrarlas desde la BD en tiempo real.

| Campo | Tipo | Descripción |
|---|---|---|
| `routePath` | `string` | Ruta Expo Router (ej: `"(tabs)/index"`) |
| `displayName` | `string` | Nombre visible, editable desde admin |
| `isActive` | `boolean` | Si la pantalla está habilitada |
| `requiredPermissions` | `string[]` | Permission keys requeridas (lógica AND) |
| `icon` | `string \| null` | Nombre de ícono |
| `order` | `number` | Orden en navegación |
| `parentScreenId` | `string \| null` | Para pantallas anidadas |
| `createdAt` | `Timestamp` | — |
| `updatedAt` | `Timestamp` | — |
| `updatedBy` | `string` | — |

**Reglas de acceso:**
- Lectura: cualquier usuario autenticado
- Creación/Actualización: `manage:screens` o `system:master`
- Borrado: **deshabilitado**

---

### `logs/{logId}`

Auditoría inmutable de todas las acciones relevantes del sistema.

| Campo | Tipo | Descripción |
|---|---|---|
| `userId` | `string` | UID del actor |
| `userEmail` | `string` | Email del actor |
| `action` | `LogAction` | Tipo de acción (ver tipos) |
| `targetCollection` | `string` | Colección afectada |
| `targetId` | `string` | Documento afectado |
| `oldValue` | `object \| null` | Valor antes del cambio |
| `newValue` | `object \| null` | Valor después del cambio |
| `createdAt` | `Timestamp` | Momento de la acción |
| `ipAddress` | `string \| null` | IP del cliente |
| `platform` | `string` | Plataforma (ios/android/web) |

**Reglas de acceso:**
- Lectura: cualquier usuario autenticado
- Creación: usuario autenticado que sea el propio `userId`
- Actualización/Borrado: **deshabilitado** (inmutable)

**Acciones posibles (`LogAction`):**
`login` | `logout` | `create` | `update` | `delete` | `read` | `block_user` | `unblock_user` | `assign_role` | `remove_role` | `assign_permission` | `remove_permission` | `enable_screen` | `disable_screen` | `change_screen_name`

---

### `sessions/{sessionId}`

Registro de sesiones activas e históricas por usuario.

| Campo | Tipo | Descripción |
|---|---|---|
| `userId` | `string` | UID del usuario |
| `loginAt` | `Timestamp` | Inicio de sesión |
| `logoutAt` | `Timestamp \| null` | Cierre de sesión (null si activa) |
| `platform` | `string` | Plataforma |
| `appVersion` | `string` | Versión de la app |
| `ipAddress` | `string \| null` | IP |
| `isActive` | `boolean` | Si la sesión está activa |
| `deviceInfo` | `string \| null` | Info del dispositivo |

---

### `app_config/{key}`

Configuración global de la aplicación.

| Campo | Tipo | Descripción |
|---|---|---|
| `value` | `unknown` | Valor de la configuración |
| `description` | `string` | Qué controla esta config |
| `isPublic` | `boolean` | Si es accesible sin permisos especiales |
| `updatedAt` | `Timestamp` | — |
| `updatedBy` | `string` | — |

**Reglas de acceso:**
- Lectura: cualquier usuario autenticado
- Creación/Actualización: solo `system:master`
- Borrado: **deshabilitado**

---

## Script de seed (`seed.js`)

Inicializa todas las colecciones base en Firestore. Se ejecuta una sola vez.

```bash
# Requiere service-account.json descargado de Firebase Console
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js
```

Crea:
- 8 permissions
- 4 roles (incluyendo `role_system_master`)
- 6+ screens configuradas
- Configuración inicial de `app_config`

> ⚠️ `service-account.json` contiene credenciales de administrador. **Nunca lo subas a git.**

---

## Reglas de seguridad (`firestore.rules`)

Las reglas utilizan helpers internos para mantenerlas legibles:

| Helper | Qué verifica |
|---|---|
| `isSignedIn()` | Usuario autenticado en Firebase Auth |
| `isAdmin()` | Campo `isAdmin == true` en el documento del usuario |
| `hasPermission(key)` | La key existe en `resolvedPermissionKeys` del usuario |
| `isAdminOrHasPermission(key)` | `isAdmin()` OR `hasPermission(key)` |
| `isSystemMaster()` | `hasPermission('system:master')` |

> **Nota:** `resolvedPermissionKeys` en Firestore debe mantenerse sincronizado con los permisos reales del usuario. Los permisos se resuelven en memoria en `AuthContext.tsx` para la UI, pero las reglas de Firestore los verifican directamente en el documento del usuario para la seguridad a nivel de BD.
