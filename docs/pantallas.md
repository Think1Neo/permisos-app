# Pantallas — Documentación completa

Todas las pantallas de la app, organizadas por sección. El acceso a cada una se controla en tiempo real desde Firestore.

---

## Estructura de navegación

```
app/
├── _layout.tsx                  ← Root layout (Stack) + AuthProvider
│
├── bienvenida/
│   └── bienvenida.tsx           ← Pantalla de bienvenida (pública)
│
├── login/
│   ├── login.tsx                ← Inicio de sesión
│   ├── register.tsx             ← Registro de cuenta
│   └── forgot.tsx               ← Recuperar contraseña
│
├── (tabs)/
│   ├── _layout.tsx              ← Bottom tabs (nombres y visibilidad desde Firestore)
│   ├── index.tsx                ← Dashboard / Home
│   └── profile.tsx              ← Perfil del usuario
│
└── pantallas/
    ├── _layout.tsx              ← Stack con header para el panel admin
    ├── usuarios.tsx             ← Gestión de usuarios        [manage:users]
    ├── roles.tsx                ← Gestión de roles           [manage:roles]
    ├── gestionar-pantallas.tsx  ← Gestión de pantallas       [manage:screens]
    ├── logs.tsx                 ← Auditoría                  [read:logs]
    ├── system-master.tsx        ← Panel System Master        [system:master]
    └── pantalla1.tsx            ← Pantalla de ejemplo
```

---

## Flujo de navegación general

```
App inicia
    │
    ▼
_layout.tsx (RootLayout)
    │
    ├── isLoading → ActivityIndicator (spinner)
    │
    ├── No autenticado → /bienvenida/bienvenida
    │       └── → /login/login
    │               ├── → /login/register
    │               └── → /login/forgot
    │
    └── Autenticado → /(tabs)
            ├── index (Dashboard)
            └── profile (Perfil)
                    └── pantallas/ (Panel admin, según permisos)
```

---

## Layouts

### `app/_layout.tsx` — Root Layout

Layout raíz de toda la aplicación. Envuelve todo con `AuthProvider` y activa `useAuthRedirect` para manejar redirecciones automáticas.

**Patrón:** `AuthProvider` > `RootLayoutInner` (separa el provider del consumidor para poder usar `useAuth` dentro).

**Pantallas registradas en el Stack:**

| Screen name | Ruta |
|---|---|
| `(tabs)` | Pantallas principales con bottom tabs |
| `bienvenida/bienvenida` | Pantalla de bienvenida pública |
| `login/login` | Login |
| `login/register` | Registro |
| `login/forgot` | Recuperar contraseña |
| `pantallas` | Panel de administración RBAC |

Todas con `headerShown: false` — cada pantalla maneja su propio header.

---

### `app/(tabs)/_layout.tsx` — Tabs Layout

Configura los bottom tabs. Los **nombres y la visibilidad** de cada tab se leen en tiempo real desde Firestore (`screens`), lo que permite renombrar o desactivar tabs sin publicar una nueva versión.

**Lógica de visibilidad:**
- Si la pantalla no tiene configuración en Firestore → visible por defecto
- Si `isActive: false` → tab oculto (`href: null`)
- Si el usuario no tiene todos los `requiredPermissions` → tab oculto

**Tabs configurados:**

| Tab | `routePath` en Firestore | Fallback name |
|---|---|---|
| `index` | `(tabs)/index` | "Inicio" |
| `profile` | `(tabs)/profile` | "Perfil" |

---

### `app/pantallas/_layout.tsx` — Pantallas Layout

Stack simple para el panel de administración. Muestra el header nativo con el color de acento (`#6366f1`).

---

## Pantallas públicas (sin autenticación)

### `bienvenida/bienvenida.tsx`

Pantalla de entrada a la app para usuarios no autenticados.

**Contenido:**
- Título principal del sistema
- Tarjeta con botón "Entrar" → navega a `/login/login`
- Sección descriptiva con botón "Saber más" → abre un `ModalComponent` con texto Markdown

**Dependencias:** `@/components/modal` (componente de modal con soporte Markdown)

---

### `login/login.tsx`

Formulario de inicio de sesión.

**Campos:** email, contraseña

**Flujo:**
1. Llama a `loginUser(email, password)` de `authService`
2. Si exitoso: `useAuthRedirect` en el root layout redirige automáticamente a `/(tabs)`
3. Si error: muestra `Alert` con mensaje amigable

**Navegación adicional:**
- "¿No tienes una cuenta?" → `/login/register`
- "¿Olvidaste tu contraseña?" → `/login/forgot`

**Manejo de errores (`friendlyError`):**

| Código Firebase | Mensaje mostrado |
|---|---|
| `invalid-credential` / `wrong-password` | Correo o contraseña incorrectos |
| `user-not-found` | No existe cuenta con ese correo |
| `too-many-requests` | Demasiados intentos, espera |
| `network-request-failed` | Sin conexión a internet |

---

### `login/register.tsx`

Formulario de registro de nueva cuenta.

**Campos:** nombre completo, email, contraseña, selector de rol

**Flujo:**
1. Carga roles activos de Firestore para el selector (al montar)
2. Valida campos y contraseña mínima (6 caracteres)
3. Llama a `registerUser(email, password, name, actorUid, actorEmail, role)`
4. El rol se escribe desde el primer `setDoc` para evitar errores de permisos

**Nota importante:** El rol se incluye en la creación inicial del usuario. No se llama `updateUserRoles` después porque el nuevo usuario no tiene permisos para actualizarse a sí mismo.

---

### `login/forgot.tsx`

Formulario de recuperación de contraseña.

**Campo:** email

**Flujo:**
1. Llama a `resetPassword(email)` de `authService`
2. Firebase envía un correo con enlace de restablecimiento
3. Alert de confirmación → redirige a `/login/login`

---

## Pantallas principales `(tabs)`

### `(tabs)/index.tsx` — Dashboard / Home

Pantalla principal después de autenticarse. Muestra un saludo personalizado y las pantallas de administración a las que tiene acceso el usuario.

**Contenido dinámico:**
- Saludo con el primer nombre del usuario: `Hola, {nombre} 👋`
- **Sección "Administración":** tarjetas de las pantallas del panel que el usuario puede ver (filtradas por permisos en tiempo real con `onSnapshot`)
- **Sección "Herramientas":** accesos fijos (Navegar al sitemap, Intérprete)
- Si no tiene módulos admin: mensaje informativo

**Iconos por pantalla** (tabla de emojis local, extensible):

| `routePath` | Ícono |
|---|---|
| `pantallas/usuarios` | 👥 |
| `pantallas/roles` | 🛡️ |
| `pantallas/pantallas` | 🖥️ |
| `pantallas/logs` | 📋 |
| cualquier otro | 📄 |

**Suscripción Firestore:** `onSnapshot` sobre `screens` donde `isActive == true`, ordenadas por `order`. Filtra en el cliente para mostrar solo las del grupo `pantallas/` con permisos del usuario.

---

### `(tabs)/profile.tsx` — Perfil

Muestra toda la información del usuario autenticado y sus permisos efectivos.

**Secciones:**

1. **Avatar + nombre** — iniciales generadas del displayName o email, badge de estado (Activo/Inactivo/Bloqueado)
2. **Roles asignados** — lista de roles con nombre, descripción y cantidad de permisos
3. **Permisos efectivos** — chips con la `key` de cada permiso resuelto y su nombre
4. **Información de cuenta** — último acceso, fecha de registro, UID (con ellipsis para no romperse)
5. **Botón "Cerrar sesión"** — Alert de confirmación → `logout()` → redirige a `/login/login`

**Generación de iniciales:**
```ts
displayName.split(" ").map(n => n[0]).slice(0, 2).join("").toUpperCase()
// "Jorge Alejandro" → "JA"
// sin nombre → primera letra del email
```

---

## Panel de administración `pantallas/`

Todas estas pantallas usan `useScreenGuard(routePath)` al inicio y muestran un spinner mientras verifica permisos. Si el usuario no tiene acceso, redirige automáticamente a `/(tabs)`.

### `pantallas/usuarios.tsx` — Gestión de usuarios

**Permiso requerido:** `manage:users`

Permite ver, bloquear/desbloquear y asignar roles a todos los usuarios registrados.

**Datos cargados al montar:**
- Todos los usuarios: `getAllUsers()` de `userService`
- Todos los roles: query a Firestore `roles` ordenados por `order`

**Funcionalidades:**

| Acción | Método | Descripción |
|---|---|---|
| Ver usuarios | `getAllUsers()` | Lista completa con pull-to-refresh |
| Bloquear/desbloquear | `setUserBlocked(uid, bool, actorUid, actorEmail)` | Switch por usuario, con Alert de confirmación. No permite bloquearse a sí mismo |
| Asignar roles | `updateUserRoles(uid, roleIds[], actorUid, actorEmail)` | Modal bottom sheet con checkboxes por rol |

**Estados visuales:**
- Usuario bloqueado → borde rojo izquierdo en la tarjeta, avatar rojo, chip "Bloqueado"
- Roles → chips púrpura con el nombre del rol
- Sin rol → chip gris "Sin rol"

---

### `pantallas/roles.tsx` — Gestión de roles

**Permiso requerido:** `manage:roles`

Permite crear, editar y activar/desactivar roles y sus permisos asociados.

**Datos en tiempo real:** `subscribeRoles()` de `roleService` — lista se actualiza con `onSnapshot`.

**Permisos disponibles:** cargados al montar desde Firestore, agrupados por `category` para el selector del modal.

**Funcionalidades:**

| Acción | Método |
|---|---|
| Crear rol | `createRole(data, actorUid, actorEmail)` |
| Editar nombre, descripción y permisos | `updateRole(id, data, actorUid, actorEmail)` |
| Activar / desactivar | `updateRole(id, { isActive }, actorUid, actorEmail)` vía Switch |

**Modal de crear/editar:**
- Campo: nombre (requerido)
- Campo: descripción (opcional, multiline)
- Selector de permisos: checkboxes agrupados por categoría, resaltados en púrpura al seleccionar

---

### `pantallas/gestionar-pantallas.tsx` — Gestión de pantallas

**Permiso requerido:** `manage:screens` (verificado con `useScreenGuard("pantallas/gestionar-pantallas")`)

Permite activar/desactivar pantallas y editar su nombre visible y permisos requeridos, todo en tiempo real.

**Datos en tiempo real:** `subscribeScreens()` de `screenService`.

**Funcionalidades:**

| Acción | Método |
|---|---|
| Activar / desactivar pantalla | `setScreenActive(id, bool, actorUid, actorEmail)` vía Switch |
| Renombrar pantalla | `renameScreen(id, name, actorUid, actorEmail)` |
| Editar permisos requeridos | `updateScreenPermissions(id, permKeys[], actorUid, actorEmail)` |

**Modal de edición:**
- Campo: nombre visible
- Selector de permisos: checkboxes agrupados por categoría (lógica AND — el usuario debe tener todos)
- Texto de ayuda: "Deja vacío para que sea pública"

**Visual:**
- Pantalla inactiva → tarjeta con opacidad reducida
- Chips verdes (activa) / gris (inactiva)
- Chips púrpura con los permission keys requeridos

---

### `pantallas/logs.tsx` — Auditoría

**Permiso requerido:** `read:logs`

Muestra el historial de acciones del sistema. Los logs son inmutables — no se pueden editar ni borrar desde el cliente.

*(Ver código en `logs.tsx` para detalles de implementación)*

---

### `pantallas/system-master.tsx` — Panel System Master

**Permiso requerido:** `system:master`

Panel de configuración avanzada del sistema, exclusivo para el rol `role_system_master`. Permite gestionar las colecciones base del sistema.

*(Ver código en `system-master.tsx` para detalles de implementación)*

---

### `pantallas/pantalla1.tsx` — Pantalla de ejemplo

Pantalla placeholder de ejemplo. Muestra un mensaje indicando que está en construcción y que requiere el permiso `view_pantalla1`.

Útil como **plantilla base** para crear nuevas pantallas del sistema:

```tsx
import { useScreenGuard } from "@/hooks/useAuthHooks";

export default function MiPantalla() {
  const { checking } = useScreenGuard("pantallas/mi-pantalla");
  if (checking) return <ActivityIndicator />;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mi Pantalla</Text>
    </View>
  );
}
```

---

## Componente compartido: `Card`

Utilizado en `login.tsx`, `register.tsx` y `forgot.tsx`. Componente genérico de formulario ubicado en `@/components/ui/card`.

**Props:**

| Prop | Tipo | Descripción |
|---|---|---|
| `title` | `string` | Título del formulario |
| `subtitle` | `string` | Subtítulo descriptivo |
| `fields` | `Field[]` | Campos de texto (key, label, placeholder, keyboardType, secureTextEntry) |
| `selects` | `Select[]` | Selectores desplegables (key, label, placeholder, options[]) |
| `primaryButton` | `{ label, onPress }` | Botón principal de acción |
| `secondaryButton` | `{ label, onPress }` | Botón secundario (link) |
| `theme` | `{ primaryBackground, cardBorderRadius }` | Personalización visual |

---

## Cómo agregar una nueva pantalla al panel admin

1. Crear el archivo en `app/pantallas/nueva-pantalla.tsx`
2. Agregar `useScreenGuard("pantallas/nueva-pantalla")` al inicio
3. Registrar la pantalla en Firestore (vía `seed.js` o desde el panel de Gestión de Pantallas):
   ```json
   {
     "routePath": "pantallas/nueva-pantalla",
     "displayName": "Mi Nueva Pantalla",
     "isActive": true,
     "requiredPermissions": ["manage:users"],
     "order": 10
   }
   ```
4. Opcionalmente agregar su ícono emoji en `SCREEN_ICONS` de `index.tsx`

La pantalla aparecerá automáticamente en el Dashboard de los usuarios con los permisos necesarios.
