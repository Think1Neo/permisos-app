\# Permisos App — h_app

Aplicación móvil **React Native / Expo** con sistema **RBAC (Role-Based Access Control)** completo sobre Firebase. Permite controlar qué pantallas y funcionalidades puede ver cada usuario según sus roles y permisos, todo configurable en tiempo real desde Firestore.

Para la materia de Desarrollo de aplicacion moviles avanzada del tecnologico en que estoy.

## por: Jorge Alejandro Martinez Vazquez

## Índice de documentación

| Archivo                     | Contenido                                           |
| --------------------------- | --------------------------------------------------- |
| `README.md`                 | Este archivo — visión general y setup               |
| `docs/arquitectura.md`      | Diagrama de arquitectura y decisiones técnicas      |
| `docs/firebase.md`          | Colecciones Firestore, reglas de seguridad, Auth    |
| `docs/rbac.md`              | Sistema de roles, permisos y cómo usarlos en código |
| `docs/componentes.md`       | AuthContext, hooks y tipos TypeScript               |
| `docs/variables-entorno.md` | Variables `.env` necesarias                         |

---

## Stack tecnológico

| Capa       | Tecnología                       |
| ---------- | -------------------------------- |
| Framework  | Expo SDK 54 + Expo Router 6      |
| UI         | React Native 0.81 + React 19     |
| Backend    | Firebase (Auth + Firestore)      |
| Lenguaje   | TypeScript (strict mode)         |
| Navegación | Expo Router (file-based routing) |
| Linting    | ESLint con config Expo           |

---

## Requisitos

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- Cuenta Firebase con proyecto activo
- Archivo `.env` con variables de Firebase (ver `docs/variables-entorno.md`)

---

## Setup rápido

```bash
# 1. Instalar dependencias
npm install

# 2. Crear archivo .env con tus credenciales Firebase
cp .env.example .env
# editar .env con tus valores

# 3. Inicializar datos en Firestore (una sola vez)
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js

# 4. Correr la app
npx expo start
```

---

## Scripts disponibles

```bash
npm run start          # Inicia el servidor de desarrollo
npm run android        # Abre en emulador Android
npm run ios            # Abre en simulador iOS
npm run web            # Abre en navegador
npm run lint           # Corre ESLint
npm run reset-project  # Limpia el proyecto (mueve app/ a app-example/)
```

---

## Estructura de carpetas

```
h_app/
├── app/                          # Pantallas (file-based routing con Expo Router)
│   ├── _layout.tsx               # Layout raíz — envuelve con AuthProvider
│   ├── (tabs)/
│   │   └── _layout.tsx           # Tabs principales (nombres desde Firestore)
│   ├── bienvenida/               # Pantallas públicas (sin auth)
│   ├── login/                    # Pantallas de login
│   └── pantallas/                # Panel de administración RBAC
│       ├── usuarios.tsx          # Gestión de usuarios
│       ├── roles.tsx             # Gestión de roles y permisos
│       ├── pantallas.tsx         # Gestión de pantallas
│       ├── logs.tsx              # Auditoría
│       └── system-master.tsx     # Panel System Master
├── lib/
│   ├── firebase.ts               # Inicialización y exports de Firebase
│   └── types.ts                  # Todos los tipos TypeScript del proyecto
├── context/
│   └── AuthContext.tsx           # Proveedor de autenticación + permisos resueltos
├── hooks/
│   └── useAuthHooks.ts           # usePermission, useScreenGuard, useAuthRedirect
├── services/
│   ├── authService.ts            # login, register, logout
│   ├── userService.ts            # bloquear, asignar roles/permisos
│   ├── screenService.ts          # gestionar pantallas desde BD
│   └── logService.ts             # auditoría de acciones
├── assets/
│   ├── fonts/                    # Fuente LSM.ttf
│   └── images/                   # Iconos y splash screen
├── docs/                         # Documentación técnica
├── seed.js                       # Script de inicialización de Firestore
├── firestore.rules               # Reglas de seguridad de Firestore
├── app.json                      # Configuración de Expo
├── package.json
└── tsconfig.json
```

---

## Asignar primer administrador

Después de correr el seed, asigna el rol de administrador a tu usuario desde Firebase Console:

1. Ir a **Firestore → colección `users` → tu UID**
2. Editar el documento y agregar:

```json
{
  "roleIds": ["role_admin"],
  "isActive": true,
  "isBlocked": false
}
```

Para acceso total (System Master):

```json
{
  "roleIds": ["role_system_master"]
}
```

---

> [!WARNING]
>
> - **Nunca subas `service-account.json` a git** — agrégalo a `.gitignore`
> - **Nunca subas `.env`** con tus credenciales Firebase
> - Las reglas de Firestore (`firestore.rules`) son la última línea de defensa
> - Para operaciones críticas (modificar roles globales, permisos base), usar Cloud Functions con Admin SDK

# [Documentacion](/docs/OVERVIEW.md)

En la carpeta estan todas
