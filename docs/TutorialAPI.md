# Tutorial — Configurar credenciales Firebase desde cero

> Para colaboradores que se unen al proyecto y necesitan generar su propio `.env` y `service-account.json`.

---

## ¿Qué necesitas obtener?

| Archivo | Para qué sirve | Cuándo se usa |
|---|---|---|
| `.env` | Conectar la app React Native a Firebase | Siempre, al correr la app |
| `service-account.json` | Inicializar datos en Firestore con el seed | Solo una vez al hacer el setup |

---

## Paso 1 — Crear o acceder al proyecto Firebase

1. Ve a **[https://console.firebase.google.com](https://console.firebase.google.com)**
2. Inicia sesión con tu cuenta de Google
3. Si el proyecto ya existe y te compartieron acceso: selecciónalo en la lista
4. Si vas a crear uno nuevo: clic en **"Agregar proyecto"** → escribe un nombre → continuar → crear

---

## Paso 2 — Obtener las credenciales para el `.env`

Estas son las credenciales de la **app web** de Firebase.

### 2.1 Registrar una app web (si no existe)

1. En el panel de Firebase, clic en el ícono de engranaje ⚙️ (arriba a la izquierda, junto al nombre del proyecto)
2. Selecciona **"Configuración del proyecto"**
3. Baja hasta la sección **"Tus apps"**
4. Si no hay ninguna app web registrada, clic en el ícono `</>` para agregar una
5. Dale un nombre (ej: `h_app-web`) y clic en **"Registrar app"**

### 2.2 Copiar los valores

Dentro de la app web registrada verás un bloque de código como este:

```js
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "tu-proyecto.firebaseapp.com",
  projectId: "tu-proyecto",
  storageBucket: "tu-proyecto.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### 2.3 Crear el archivo `.env`

En la **raíz del proyecto** crea un archivo llamado `.env` (sin extensión extra) y pega los valores así:

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIzaSy...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu-proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> ⚠️ El prefijo `EXPO_PUBLIC_` es obligatorio — sin él, Expo no expone las variables a la app.

---

## Paso 3 — Obtener el `service-account.json`

Este archivo es necesario solo para correr `seed.js` (inicialización de Firestore). **Solo se necesita una vez.**

> ⚠️ Para descargarlo necesitas ser **propietario o editor** del proyecto Firebase. Si no tienes ese acceso, pídele el archivo al administrador del proyecto directamente (por un canal seguro, nunca por chat público o email sin cifrar).

### 3.1 Ir a Cuentas de servicio

1. En Firebase Console → ⚙️ **Configuración del proyecto**
2. Clic en la pestaña **"Cuentas de servicio"**

### 3.2 Generar nueva clave privada

1. Asegúrate de que está seleccionada **"Firebase Admin SDK"**
2. Clic en **"Generar nueva clave privada"**
3. Aparece un Alert de confirmación → clic en **"Generar clave"**
4. Se descarga automáticamente un archivo `.json`

### 3.3 Colocar el archivo en el proyecto

1. Renombra el archivo descargado a `service-account.json`
2. Muévelo a la **raíz del proyecto** (al mismo nivel que `package.json`)

---

## Paso 4 — Verificar que `.gitignore` los excluye

Abre el archivo `.gitignore` y confirma que estas líneas existen. Si no están, agrégalas:

```
.env
.env.local
.env.production
service-account.json
```

> Si ya hiciste un commit con alguno de estos archivos por error, necesitas revocar las credenciales inmediatamente (ver sección al final).

---

## Paso 5 — Correr el seed (solo la primera vez)

Con `service-account.json` en la raíz:

```bash
# Instalar firebase-admin si no está
npm install firebase-admin

# Correr el seed
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js
```

En Windows (PowerShell):
```powershell
$env:GOOGLE_APPLICATION_CREDENTIALS=".\service-account.json"; node seed.js
```

Si el seed ya fue corrido antes por otro colaborador, **no es necesario correrlo de nuevo** — los datos ya están en Firestore.

---

## Paso 6 — Habilitar Firebase Auth

Si el proyecto es nuevo, hay que activar el método de autenticación:

1. En Firebase Console → menú lateral → **"Authentication"**
2. Clic en **"Comenzar"**
3. Pestaña **"Sign-in method"**
4. Clic en **"Correo electrónico/contraseña"** → activar el primer toggle → **"Guardar"**

---

## Paso 7 — Verificar que todo funciona

```bash
npm install
npx expo start
```

Si la app carga sin errores de Firebase en la consola, las credenciales están correctas.

---

## Resumen rápido

```
1. Firebase Console → Configuración → Tus apps → copiar firebaseConfig → .env
2. Firebase Console → Configuración → Cuentas de servicio → Generar clave → service-account.json
3. Verificar .gitignore
4. npm install && npx expo start
```

---

## ¿Qué hacer si subiste las credenciales a git por error?

**Actúa rápido — las credenciales expuestas deben revocarse inmediatamente.**

### Para el `service-account.json`:
1. Firebase Console → ⚙️ Configuración → **"Cuentas de servicio"**
2. Busca la clave comprometida en la lista → clic en los tres puntos → **"Eliminar clave"**
3. Genera una nueva clave siguiendo el Paso 3

### Para el `.env` (API Key):
1. Ve a **[https://console.cloud.google.com](https://console.cloud.google.com)**
2. Selecciona tu proyecto → **"APIs y servicios"** → **"Credenciales"**
3. Busca la API Key expuesta → clic en el ícono de editar → **"Eliminar"** o restringe su uso
4. Genera una nueva desde Firebase Console

### Limpiar el historial de git:
```bash
# Eliminar el archivo del historial completo (requiere force push)
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch service-account.json" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

> Después de hacer force push, todos los colaboradores deben hacer `git pull --rebase`.
