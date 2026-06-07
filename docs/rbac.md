# Sistema RBAC — Roles, Permisos y Control de Acceso

## Concepto general

El sistema implementa **RBAC (Role-Based Access Control)** en dos capas:

```
Permission  →  tiene un "key" único (ej: "manage:users")
     ↑
Role        →  tiene un array de permissionIds
     ↑
AppUser     →  tiene roleIds[] + permissionIds[] directos
               permisos resueltos = union(permisos de roles + directos)
```

Los permisos se resuelven **en memoria** cuando el usuario inicia sesión, y se actualizan en tiempo real con `onSnapshot` cuando cambian sus datos en Firestore.

---

## Flujo de autenticación y resolución de permisos

```
Firebase Auth onAuthStateChanged
        │
        ▼
  onSnapshot(users/{uid})
        │
        ├── isBlocked o !isActive? → logout automático
        │
        ▼
  resolvePermissions(appUser)
        │
        ├── getDocs(roles donde id in roleIds)
        ├── recolecta permissionIds de cada rol
        ├── agrega permissionIds directos del usuario
        ├── getDocs(permissions donde id in uniquePermIds)
        │
        ▼
  setState({ roles, permissions, resolvedPermissionKeys: Set<string> })
```

---

## Cómo usar permisos en componentes

### Verificar un permiso (mostrar/ocultar UI)

```tsx
import { usePermission } from "../hooks/useAuthHooks";

function MiComponente() {
  const puedeGestionarUsuarios = usePermission("manage:users");

  return puedeGestionarUsuarios ? <BotonEditar /> : null;
}
```

### Proteger una pantalla completa

El hook verifica si la pantalla está activa en BD y si el usuario tiene todos los permisos requeridos. Redirige a `/(tabs)` si no tiene acceso.

```tsx
import { useScreenGuard } from "../hooks/useAuthHooks";

export default function PantallaUsuarios() {
  const { checking } = useScreenGuard("pantallas/usuarios");

  if (checking) return <ActivityIndicator />;

  return <View>...</View>;
}
```

### Acceder al usuario y sus datos completos

```tsx
import { useAuth } from "../context/AuthContext";

function MiPantalla() {
  const { appUser, roles, permissions, hasPermission, logout } = useAuth();

  return (
    <View>
      <Text>Hola, {appUser?.displayName}</Text>
      {hasPermission("read:logs") && <BotonVerLogs />}
    </View>
  );
}
```

### Redirección global según autenticación

Usar en `app/_layout.tsx` para manejar todas las redirecciones automáticas:

```tsx
import { useAuthRedirect } from "../hooks/useAuthHooks";

export default function RootLayout() {
  useAuthRedirect(); // redirige a login si no autenticado, a tabs si sí lo está
  return <Stack />;
}
```

---

## Bloquear un usuario

```tsx
import { setUserBlocked } from "../services/userService";

// Bloquear
await setUserBlocked(uid, true, actorUid, actorEmail);

// Desbloquear
await setUserBlocked(uid, false, actorUid, actorEmail);
```

El usuario bloqueado es desconectado automáticamente en el siguiente ciclo de `onSnapshot`, sin necesidad de acción manual.

---

## Gestionar pantallas en tiempo real

```tsx
import { renameScreen } from "../services/screenService";
import { setScreenActive } from "../services/screenService";

// Renombrar una pantalla (se actualiza en tiempo real para todos los usuarios)
await renameScreen("screen_home", "Dashboard", actorUid, actorEmail);

// Activar/desactivar
await setScreenActive("screen_reportes", false, actorUid, actorEmail);
```

---

## Pantallas del panel de administración

Cada pantalla del panel debe llamar `useScreenGuard` al inicio con su `routePath`:

| Archivo | routePath | Permiso requerido |
|---|---|---|
| `pantallas/usuarios.tsx` | `pantallas/usuarios` | `manage:users` |
| `pantallas/roles.tsx` | `pantallas/roles` | `manage:roles` |
| `pantallas/pantallas.tsx` | `pantallas/pantallas` | `manage:screens` |
| `pantallas/logs.tsx` | `pantallas/logs` | `read:logs` |
| `pantallas/system-master.tsx` | `pantallas/system-master` | `system:master` |

---

## Lógica de permisos en pantallas (AND)

El campo `requiredPermissions` en Firestore usa lógica **AND**: el usuario debe tener **todos** los permisos listados para acceder.

```ts
// En useScreenGuard:
const hasAll = screen.requiredPermissions.every((key) =>
  resolvedPermissionKeys.has(key),
);
```

Para lógica OR en la UI, usa `hasPermission` múltiples veces.

---

## Notas de seguridad

- Las reglas de Firestore son la **última línea de defensa** — siempre están activas independientemente de la lógica del cliente
- Para operaciones críticas (crear permisos base, modificar roles globales), usar **Cloud Functions** con Admin SDK en lugar de escritura directa desde el cliente
- Considerar agregar **Firebase Custom Claims** para verificación sin lectura de BD en cada request
- El log de auditoría (`logs`) es **inmutable** desde el cliente — no se puede editar ni borrar
