# Arquitectura del sistema

## Visión general

**Permisos App** es una aplicación Expo/React Native con autenticación y control de acceso por roles (RBAC) gestionado enteramente desde Firebase. No tiene backend propio — toda la lógica de negocio corre en el cliente con Firestore como fuente de verdad.

---

## Diagrama de arquitectura

```mermaid
graph TD
  subgraph App["App (React Native / Expo)"]
    Layout["app/_layout.tsx\nLayout raíz"]
    AuthProv["AuthProvider\ncontext/AuthContext.tsx"]
    Tabs["(tabs)/ Layout\nNombres desde Firestore"]
    Pantallas["pantallas/\nPanel Admin RBAC"]
    Hooks["hooks/useAuthHooks.ts\nusePermission · useScreenGuard · useAuthRedirect"]
  end

  subgraph Firebase
    FAuth["Firebase Auth\nEmail/Password"]
    Firestore["Firestore DB"]
    subgraph Colecciones
      Users["users/"]
      Roles["roles/"]
      Perms["permissions/"]
      Screens["screens/"]
      Logs["logs/"]
      Sessions["sessions/"]
      AppConf["app_config/"]
    end
  end

  Layout --> AuthProv
  AuthProv --> FAuth
  AuthProv --> Users
  AuthProv --> Roles
  AuthProv --> Perms
  Tabs --> Screens
  Pantallas --> Hooks
  Hooks --> AuthProv
  Pantallas --> Users
  Pantallas --> Roles
  Pantallas --> Perms
  Pantallas --> Screens
  Pantallas --> Logs
```

---

## Diagrama de flujo de autenticación

```mermaid
sequenceDiagram
  participant U as Usuario
  participant App
  participant Auth as Firebase Auth
  participant FS as Firestore

  U->>App: Abre la app
  App->>Auth: onAuthStateChanged()
  Auth-->>App: firebaseUser (o null)

  alt No autenticado
    App->>U: Redirige a /bienvenida
  else Autenticado
    App->>FS: onSnapshot(users/{uid})
    FS-->>App: AppUser document

    alt isBlocked o !isActive
      App->>Auth: signOut()
      App->>U: Redirige a /bienvenida
    else Usuario válido
      App->>FS: getDocs(roles donde id in roleIds)
      FS-->>App: Roles del usuario
      App->>FS: getDocs(permissions donde id in permIds)
      FS-->>App: Permisos resueltos
      App->>App: setState({ resolvedPermissionKeys: Set })
      App->>U: Redirige a /(tabs)
    end
  end
```

---

## Diagrama del modelo de datos RBAC

```mermaid
erDiagram
  AppUser {
    string uid PK
    string email
    string displayName
    boolean isActive
    boolean isBlocked
    string[] roleIds FK
    string[] permissionIds FK
  }

  Role {
    string id PK
    string name
    boolean isActive
    string[] permissionIds FK
    number order
  }

  Permission {
    string id PK
    string key
    string name
    string category
    boolean isActive
  }

  Screen {
    string id PK
    string routePath
    string displayName
    boolean isActive
    string[] requiredPermissions FK
  }

  Log {
    string id PK
    string userId FK
    string action
    string targetCollection
    Timestamp createdAt
  }

  AppUser }o--o{ Role : "roleIds"
  AppUser }o--o{ Permission : "permissionIds directos"
  Role }o--o{ Permission : "permissionIds"
  Screen }o--o{ Permission : "requiredPermissions"
  AppUser ||--o{ Log : "userId"
```

---

## Estructura de navegación (Expo Router)

```
app/
├── _layout.tsx              ← Stack raíz + AuthProvider + useAuthRedirect
│
├── bienvenida/
│   └── bienvenida.tsx       ← Pantalla de bienvenida (pública)
│
├── login/
│   └── login.tsx            ← Formulario de login (pública)
│
├── (tabs)/
│   ├── _layout.tsx          ← Bottom tabs — nombres y orden desde Firestore
│   └── index.tsx            ← Tab principal (home)
│
└── pantallas/               ← Panel de administración (requiere permisos)
    ├── usuarios.tsx         ← manage:users
    ├── roles.tsx            ← manage:roles
    ├── pantallas.tsx        ← manage:screens
    ├── logs.tsx             ← read:logs
    └── system-master.tsx    ← system:master
```

---

## Decisiones técnicas

### Por qué Firestore con `onSnapshot` en vez de REST polling

Los permisos y el estado de bloqueo de usuarios cambian en tiempo real desde el panel de administración. Con `onSnapshot`, el cliente recibe los cambios inmediatamente sin necesidad de reiniciar sesión ni hacer polling. Si un admin bloquea a un usuario, ese usuario es desconectado en segundos.

### Por qué los permisos se resuelven en memoria (no se persisten en Firestore)

Persistir `resolvedPermissionKeys` en el documento del usuario crearía un problema de consistencia: si se agrega un permiso a un rol, habría que actualizar todos los usuarios con ese rol. En cambio, resolverlos en memoria al cargar la sesión garantiza que siempre estén actualizados con el estado real de roles y permisos.

### Por qué TypeScript strict mode

El proyecto usa `"strict": true` en `tsconfig.json`. Esto evita errores comunes con `null`/`undefined` en los datos de Firestore, que pueden ser `null` si los documentos no existen o tienen campos opcionales.

### Por qué `chunkArray` en lugar de una sola query

Firestore limita las consultas `where('__name__', 'in', [...])` a **10 elementos** por query. La función `chunkArray` divide los arrays de IDs en grupos de 10 y hace múltiples queries en paralelo, permitiendo usuarios con muchos roles y permisos sin errores de Firestore.

### Sobre `service-account.json`

El archivo `service-account.json` en el repo es para uso local del script `seed.js` durante el setup inicial. **Debe estar en `.gitignore`** y nunca subirse a ningún repositorio o entorno de CI/CD. En producción, usar las variables de entorno de Firebase Admin SDK o un secret manager.
