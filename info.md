# Sistema RBAC con Firebase + Expo

## Estructura de archivos a integrar

```
Tu proyecto/
├── lib/
│   ├── firebase.ts          ← config Firebase
│   └── types.ts             ← todos los tipos TypeScript
├── context/
│   └── AuthContext.tsx      ← proveedor de auth + permisos resueltos
├── hooks/
│   └── useAuthHooks.ts      ← usePermission, useScreenGuard, useAuthRedirect
├── services/
│   ├── authService.ts       ← login, register, logout
│   ├── userService.ts       ← bloquear, asignar roles/permisos
│   ├── screenService.ts     ← gestionar pantallas desde BD
│   └── logService.ts        ← auditoría
├── app/
│   ├── _layout.tsx          ← layout raíz con AuthProvider
│   ├── (tabs)/_layout.tsx   ← tabs con nombres desde Firestore
│   └── login/login.tsx      ← pantalla de login
├── seed.js                  ← script de inicialización (Node.js)
└── firestore.rules          ← reglas de seguridad Firestore
```

## Variables de entorno (.env)

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## Dependencias necesarias

```bash
npx expo install firebase
npm install expo-constants
```

## Inicialización (una sola vez)

1. Descarga tu `service-account.json` desde Firebase Console → Configuración del proyecto → Cuentas de servicio
2. Ejecuta el seed:

```bash
npm install firebase-admin
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js
```

Esto crea en Firestore:

- 7 permissions (read:users, manage:users, read:roles, manage:roles, manage:screens, read:logs, manage:config)
- 3 roles (Administrador, Gerente, Visualizador)
- 6 screens configuradas
- app_config inicial

## Asignar primer administrador

Desde Firebase Console → Firestore → colección `users` → tu UID:

```json
{
  "roleIds": ["role_admin"],
  "isActive": true,
  "isBlocked": false
}
```

## Cómo usar en pantallas

### Verificar permiso en un componente

```tsx
import { usePermission } from "../hooks/useAuthHooks";

function MiComponente() {
  const puedeGestionarUsuarios = usePermission("manage:users");

  return puedeGestionarUsuarios ? <BotonEditar /> : null;
}
```

### Proteger una pantalla completa

```tsx
import { useScreenGuard } from "../hooks/useAuthHooks";

export default function PantallaUsuarios() {
  const { checking } = useScreenGuard("pantallas/usuarios");

  if (checking) return <ActivityIndicator />;

  return <View>...</View>;
}
```

### Acceder al usuario actual y sus permisos

```tsx
import { useAuth } from "../context/AuthContext";

function MiPantalla() {
  const { appUser, roles, hasPermission, logout } = useAuth();

  return <Text>Hola, {appUser?.displayName}</Text>;
}
```

## Modelo de datos

### Jerarquía de acceso

```
Permission  →  tiene un "key" único (ej: "manage:users")
Role        →  tiene un array de permissionIds
AppUser     →  tiene roleIds[] + permissionIds[] directos
              los permisos resueltos = union(permisos de roles + directos)
```

### Bloquear un usuario (desde admin)

```tsx
import { setUserBlocked } from "../services/userService";

await setUserBlocked(uid, true, actorUid, actorEmail);
// El usuario bloqueado será desconectado en la próxima verificación del onSnapshot
```

### Renombrar una pantalla

```tsx
import { renameScreen } from "../services/screenService";

await renameScreen("screen_home", "Dashboard", actorUid, actorEmail);
// Los tabs se actualizan en tiempo real para todos los usuarios conectados
```

## Pantallas adicionales en /pantallas

Crea estos archivos para el panel de administración:

- `app/pantallas/usuarios.tsx` → lista de usuarios, bloquear, asignar roles
- `app/pantallas/roles.tsx` → gestión de roles y permisos
- `app/pantallas/pantallas.tsx`→ activar/desactivar pantallas, renombrar
- `app/pantallas/logs.tsx` → auditoría con filtros

Cada una debe llamar `useScreenGuard` con su routePath al inicio.

## Notas de seguridad

- Las reglas de Firestore (`firestore.rules`) son la última línea de defensa
- Para gestión avanzada (modificar roles, permisos globales), usa **Cloud Functions** con Admin SDK en lugar de escritura directa desde el cliente
- Considera agregar **Custom Claims** en Firebase Auth para verificación sin lectura de BD en cada petición
- El log de auditoría (`logs`) es inmutable desde el cliente (sin update/delete)
