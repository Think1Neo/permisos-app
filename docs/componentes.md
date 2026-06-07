# Componentes, Hooks y Tipos

---

## `AuthContext.tsx` — Proveedor de autenticación

Ubicación: `context/AuthContext.tsx`

Provee el estado global de autenticación a toda la app. Escucha cambios en Firebase Auth y en el documento del usuario en Firestore en tiempo real.

### Estado que expone (`AuthState`)

| Campo | Tipo | Descripción |
|---|---|---|
| `firebaseUser` | `User \| null` | Usuario de Firebase Auth |
| `appUser` | `AppUser \| null` | Documento del usuario en Firestore |
| `roles` | `Role[]` | Roles resueltos del usuario |
| `permissions` | `Permission[]` | Permisos completos resueltos |
| `resolvedPermissionKeys` | `Set<string>` | Set de keys de permisos — para verificación O(1) |
| `isLoading` | `boolean` | Verdadero mientras carga la sesión inicial |
| `isAuthenticated` | `boolean` | Verdadero si hay usuario autenticado y activo |

### Métodos expuestos

| Método | Firma | Descripción |
|---|---|---|
| `hasPermission` | `(key: string) => boolean` | Verifica si el usuario tiene un permiso |
| `logout` | `() => Promise<void>` | Cierra sesión y registra en logs |
| `refreshAuth` | `() => void` | Fuerza recarga del usuario en Firebase Auth |

### Uso

```tsx
// En app/_layout.tsx (raíz)
import { AuthProvider } from "../context/AuthContext";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack />
    </AuthProvider>
  );
}

// En cualquier componente hijo
import { useAuth } from "../context/AuthContext";

const { appUser, hasPermission, logout } = useAuth();
```

### Comportamiento en tiempo real

- Usa `onSnapshot` sobre `users/{uid}` — cualquier cambio en el documento del usuario (bloqueo, cambio de rol) se refleja **inmediatamente** sin recargar la app.
- Si el usuario es bloqueado (`isBlocked: true`) o desactivado (`isActive: false`), se ejecuta logout automático.
- Los permisos se resuelven en memoria; nunca se escriben permisos resueltos a Firestore.

### Helper interno: `chunkArray`

Divide arrays en chunks de tamaño `n`. Se usa para las consultas `where('__name__', 'in', [...])` de Firestore, que tienen límite de 10 elementos por consulta.

```ts
chunkArray(["a","b","c","d"], 2) // → [["a","b"], ["c","d"]]
```

---

## `useAuthHooks.ts` — Hooks de autenticación

Ubicación: `hooks/useAuthHooks.ts`

### `usePermission(permissionKey: string): boolean`

Verifica si el usuario tiene un permiso específico. Útil para mostrar u ocultar elementos de UI.

```tsx
const puedeEditar = usePermission("manage:users");
// → true | false
```

---

### `useScreenGuard(routePath: string)`

Protege una pantalla completa verificando en Firestore si la pantalla está activa y si el usuario tiene los permisos necesarios.

**Parámetros:**
- `routePath` — string que coincide con el campo `routePath` del documento en la colección `screens`

**Retorna:**
- `checking: boolean` — verdadero mientras verifica. Mostrar un spinner mientras sea true.
- `screenConfig: Screen | null` — configuración de la pantalla desde Firestore

**Comportamiento:**
- Si la pantalla no existe en Firestore → acceso libre (modo desarrollo)
- Si `isActive: false` → redirige a `/(tabs)`
- Si el usuario no tiene todos los `requiredPermissions` → redirige a `/(tabs)`

```tsx
export default function PantallaAdmin() {
  const { checking } = useScreenGuard("pantallas/usuarios");

  if (checking) return <ActivityIndicator />;
  return <View>{/* contenido */}</View>;
}
```

---

### `useAuthRedirect()`

Maneja las redirecciones globales basadas en el estado de autenticación. Colocar en `app/_layout.tsx`.

**Lógica:**
- Si no está autenticado y está en `(tabs)` → redirige a `/bienvenida/bienvenida`
- Si está autenticado y está en `bienvenida` o `login` → redirige a `/(tabs)`

```tsx
export default function RootLayout() {
  useAuthRedirect();
  return <Stack />;
}
```

---

## `lib/types.ts` — Tipos TypeScript

Todos los tipos del proyecto en un solo archivo.

### `Permission`

```ts
interface Permission {
  id: string;
  name: string;
  description: string;
  key: string;          // ej: "read:users", "manage:screens"
  isActive: boolean;
  category: string;     // ej: "users", "screens", "roles"
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}
```

### `Role`

```ts
interface Role {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  permissionIds: string[];
  order: number;        // -1 para System Master (aparece primero)
  createdAt: Timestamp;
  updatedAt: Timestamp;
  createdBy: string;
  updatedBy: string;
}
```

### `AppUser`

```ts
interface AppUser {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  isActive: boolean;
  isBlocked: boolean;
  roleIds: string[];
  permissionIds: string[];   // permisos adicionales directos (fuera de roles)
  lastLogin: Timestamp | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}
```

### `Screen`

```ts
interface Screen {
  id: string;
  routePath: string;           // ej: "(tabs)/index", "pantallas/detalle"
  displayName: string;         // nombre editable desde la BD
  isActive: boolean;
  requiredPermissions: string[]; // lógica AND — debe tener todos
  icon: string | null;
  order: number;
  parentScreenId: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  updatedBy: string;
}
```

### `Log`

```ts
interface Log {
  id: string;
  userId: string;
  userEmail: string;
  action: LogAction;
  targetCollection: string;
  targetId: string;
  oldValue: Record<string, unknown> | null;
  newValue: Record<string, unknown> | null;
  createdAt: Timestamp;
  ipAddress: string | null;
  platform: string;
}
```

### `Session`

```ts
interface Session {
  id: string;
  userId: string;
  loginAt: Timestamp;
  logoutAt: Timestamp | null;
  platform: string;
  appVersion: string;
  ipAddress: string | null;
  isActive: boolean;
  deviceInfo: string | null;
}
```

### `AppConfig`

```ts
interface AppConfig {
  id: string;         // ej: "app_name", "maintenance_mode"
  value: unknown;
  description: string;
  updatedAt: Timestamp;
  updatedBy: string;
  isPublic: boolean;
}
```

### `AuthState`

```ts
interface AuthState {
  firebaseUser: User | null;    // firebase/auth
  appUser: AppUser | null;
  roles: Role[];
  permissions: Permission[];
  resolvedPermissionKeys: Set<string>;  // union de todos los permisos
  isLoading: boolean;
  isAuthenticated: boolean;
}
```

### `LogAction` (union type)

```ts
type LogAction =
  | "login" | "logout"
  | "create" | "update" | "delete" | "read"
  | "block_user" | "unblock_user"
  | "assign_role" | "remove_role"
  | "assign_permission" | "remove_permission"
  | "enable_screen" | "disable_screen" | "change_screen_name";
```
