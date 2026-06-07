# Índice de documentación — Permisos App

> Documentación técnica completa del proyecto **h_app** (Permisos App).
> React Native · Expo SDK 54 · Firebase · TypeScript · RBAC

---

## Documentos disponibles

### 📋 General

| Archivo | Descripción | Audiencia |
|---|---|---|
| [`OVERVIEW.md`](OVERVIEW.md) | Visión general, stack, recursos y videos tutoriales | Cualquiera |
| [`README.md`](README.md) | Setup rápido, scripts, estructura de carpetas | Desarrolladores |

---

### 🏗️ Arquitectura y diseño

| Archivo | Descripción | Audiencia |
|---|---|---|
| [`arquitectura.md`](arquitectura.md) | Diagramas Mermaid de arquitectura, flujo de autenticación y modelo ER. Decisiones técnicas explicadas | Desarrolladores |

---

### 🔥 Firebase

| Archivo | Descripción | Audiencia |
|---|---|---|
| [`firebase.md`](firebase.md) | Todas las colecciones Firestore con campos, tipos y reglas de acceso. Script de seed. Reglas de seguridad | Desarrolladores |
| [`variables-entorno.md`](variables-entorno.md) | Variables `.env` necesarias, cómo obtenerlas y advertencias de seguridad | Desarrolladores |

---

### 🛡️ Sistema RBAC

| Archivo | Descripción | Audiencia |
|---|---|---|
| [`rbac.md`](rbac.md) | Cómo usar `usePermission`, `useScreenGuard`, bloquear usuarios y gestionar pantallas en código | Desarrolladores |

---

### 🧩 Código

| Archivo | Descripción | Audiencia |
|---|---|---|
| [`componentes.md`](componentes.md) | JSDoc completo de `AuthContext`, los 3 hooks y todos los tipos de `types.ts` | Desarrolladores |
| [`pantallas.md`](pantallas.md) | Todas las pantallas de la app: flujo de navegación, props, acciones, permisos requeridos y cómo agregar nuevas | Desarrolladores |

---

## Mapa rápido — ¿qué busco?

| Pregunta | Ir a |
|---|---|
| ¿Cómo corro el proyecto por primera vez? | [`README.md`](README.md) |
| ¿Qué hace esta app en general? | [`OVERVIEW.md`](OVERVIEW.md) |
| ¿Cómo funciona el sistema de permisos? | [`rbac.md`](rbac.md) |
| ¿Qué colecciones tiene Firestore? | [`firebase.md`](firebase.md) |
| ¿Qué variables de entorno necesito? | [`variables-entorno.md`](variables-entorno.md) |
| ¿Cómo protejo una pantalla con permisos? | [`rbac.md`](rbac.md) → sección `useScreenGuard` |
| ¿Qué hace `AuthContext`? | [`componentes.md`](componentes.md) |
| ¿Qué pantallas tiene la app y qué hace cada una? | [`pantallas.md`](pantallas.md) |
| ¿Cómo agrego una nueva pantalla al panel admin? | [`pantallas.md`](pantallas.md) → sección final |
| ¿Qué es el rol System Master? | [`firebase.md`](firebase.md) → colección `roles` |
| ¿Dónde están los diagramas de arquitectura? | [`arquitectura.md`](arquitectura.md) |
| Videos y recursos para aprender el stack | [`OVERVIEW.md`](OVERVIEW.md) → sección Recursos |

---

## Resumen del sistema en una línea por archivo

```
OVERVIEW.md          → qué es la app, stack, videos
README.md            → cómo instalar y correr
arquitectura.md      → cómo están conectadas las piezas
firebase.md          → qué hay en la base de datos
variables-entorno.md → credenciales necesarias
rbac.md              → cómo funcionan los permisos en código
componentes.md       → referencia de AuthContext, hooks y tipos
pantallas.md         → qué hace cada pantalla y cómo navegarlas
```

---

*Generado para el proyecto **h_app** · Expo SDK 54 · Firebase v12 · TypeScript strict*
