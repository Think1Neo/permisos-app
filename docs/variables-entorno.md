# Variables de entorno

La app usa el prefijo `EXPO_PUBLIC_` para exponer variables a la aplicación React Native (Expo las incluye en el bundle del cliente).

---

## Archivo `.env`

Crea este archivo en la raíz del proyecto. **No subir a git.**

```env
EXPO_PUBLIC_FIREBASE_API_KEY=tu_api_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=tu_proyecto
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=tu_proyecto.firebasestorage.app
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
```

### Cómo obtener estos valores

1. Ir a [Firebase Console](https://console.firebase.google.com)
2. Seleccionar tu proyecto → ⚙️ Configuración del proyecto
3. Bajar a "Tus apps" → seleccionar la app web
4. Copiar los valores del objeto `firebaseConfig`

---

## Dónde se usan

Todas las variables se leen en `lib/firebase.ts`:

```ts
const firebaseConfig = {
  apiKey:            process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain:        process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId:         process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket:     process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId:             process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};
```

---

## `.gitignore` recomendado

Asegúrate de tener estas entradas:

```
.env
.env.local
.env.production
service-account.json
```

---

## Variables del servidor (seed.js)

El script `seed.js` usa Firebase Admin SDK y **no** usa las variables `EXPO_PUBLIC_*`. En su lugar, requiere el archivo `service-account.json`:

```bash
GOOGLE_APPLICATION_CREDENTIALS=./service-account.json node seed.js
```

`service-account.json` se descarga desde:
Firebase Console → ⚙️ Configuración del proyecto → Cuentas de servicio → Generar nueva clave privada

> ⚠️ Este archivo contiene una clave privada RSA con acceso de administrador total al proyecto Firebase. Trátalo como una contraseña. Nunca lo subas a un repositorio.
