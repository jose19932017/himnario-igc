# 📖 Himnario IGC

Aplicación web progresiva (PWA) del himnario digital de la Iglesia IGC. Permite a los miembros acceder a más de 650 cantos desde cualquier dispositivo, guardar favoritos, ver anuncios y usarla sin conexión a internet.

[![Firebase Hosting](https://img.shields.io/badge/Firebase-Hosting-orange?logo=firebase)](https://himnarioigc.web.app)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite)](https://vitejs.dev)
[![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?logo=pwa)](https://web.dev/progressive-web-apps/)

---

## 🌐 Producción

**[himnarioigc.web.app](https://himnarioigc.web.app)**

---

## ✨ Características

- 📖 **Más de 650 cantos** ordenados por número
- 🔍 **Búsqueda** por número o título
- ❤️ **Favoritos personales** guardados por dispositivo
- 📢 **Anuncios** con fechas y notificaciones
- 🌙 Diseño elegante en tonos dorado y crema
- 📱 **Instalable** en iPhone y Android como app nativa
- ⚡ **Funciona sin internet** gracias a caché local
- ☁️ **Sincronización en tiempo real** con Firebase Firestore
- 🔒 **Panel de administración** protegido con PIN

---

## 🛠️ Tecnologías

| Tecnología | Uso |
|---|---|
| [React 18](https://react.dev) | Interfaz de usuario |
| [Vite 5](https://vitejs.dev) | Build tool |
| [Firebase Firestore](https://firebase.google.com/docs/firestore) | Base de datos en la nube |
| [Firebase Hosting](https://firebase.google.com/docs/hosting) | Despliegue web |
| [vite-plugin-pwa](https://vite-pwa-org.netlify.app) | Service Worker y manifiesto PWA |
| [Workbox](https://developers.google.com/web/tools/workbox) | Estrategias de caché offline |

---

## 📁 Estructura del proyecto

```
himnario-igc/
├── public/
│   ├── favicon.svg
│   └── icons/              # Íconos PWA (72px a 512px)
├── src/
│   ├── App.jsx             # Componente principal de la app
│   ├── firebase.js         # Configuración de Firebase ⚠️
│   └── main.jsx            # Entry point + registro del SW
├── firebase.json           # Configuración de Firebase Hosting
├── firestore.rules         # Reglas de seguridad de Firestore
├── index.html              # HTML principal con meta tags PWA
├── vite.config.js          # Config de Vite + PWA manifest
└── package.json
```

---

## 🚀 Instalación y configuración

### Requisitos previos

- [Node.js](https://nodejs.org) v18 o superior
- Cuenta de Google para Firebase

### 1. Clonar el repositorio

```bash
git clone https://github.com/jose19932017/himnario-igc.git
cd himnario-igc
```

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar Firebase

1. Ve a [console.firebase.google.com](https://console.firebase.google.com)
2. Crea un nuevo proyecto
3. Agrega una app Web y activa **Firestore** y **Hosting**
4. Copia tus credenciales en `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROJECT_ID.firebaseapp.com",
  projectId:         "TU_PROJECT_ID",
  storageBucket:     "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId:             "TU_APP_ID",
};
```

> ⚠️ **Nunca subas tus credenciales reales a GitHub.** Usa variables de entorno o agrega `src/firebase.js` al `.gitignore` si el repositorio es público.

### 4. Ejecutar en desarrollo

```bash
npm run dev
```

La app estará disponible en `http://localhost:5173`

---

## 📦 Despliegue en Firebase Hosting

### Primera vez

```bash
npm install -g firebase-tools
firebase login
firebase init    # Selecciona Firestore + Hosting
```

Cuando te pregunte:
- **Directorio público:** `dist`
- **Single Page App:** `Y`
- **GitHub Actions:** `N`

### Cada vez que hagas cambios

```bash
npm run build
firebase deploy
```

---

## 🗄️ Base de datos — Colecciones Firestore

### `songs`

| Campo | Tipo | Descripción |
|---|---|---|
| `number` | `number` | Número del himno |
| `title` | `string` | Título del canto |
| `author` | `string` | Autor / compositor |
| `lyrics` | `string` | Letra completa |

### `announcements`

| Campo | Tipo | Descripción |
|---|---|---|
| `title` | `string` | Título del anuncio |
| `body` | `string` | Descripción |
| `date` | `string` | Fecha `YYYY-MM-DD` (opcional) |
| `time` | `string` | Hora `HH:MM` (opcional) |
| `createdAt` | `timestamp` | Fecha de creación (automática) |

---

## 📱 Carga masiva de cantos

Desde el panel de administración puedes importar cantos en lote usando un archivo `.txt`:

```
1. "Nombre del Canto"
Primera línea de la letra
Segunda línea...

Otra estrofa aquí...
---
2. "Segundo Canto"
Letra del segundo canto...
```

**Reglas:**
- El título va entre comillas `"Título"`
- Opcionalmente con número al inicio: `5. "Título"`
- Separa cada canto con `---`
- Las líneas vacías se respetan como separadores de estrofa

---

## 🔒 Administración

El panel de administración está protegido con un PIN de 4 dígitos. Desde ahí puedes:

- ➕ Agregar, editar y eliminar cantos
- 📢 Publicar, editar y eliminar anuncios
- 📂 Hacer cargas masivas de cantos

Para cambiar el PIN, edita esta línea en `src/App.jsx`:

```js
const ADMIN_PASSWORD = "5555";
```

---

## 📲 Instalación como app en el celular

### Android (Chrome)
1. Abre la app en Chrome
2. Toca el menú `⋮` → **"Instalar app"**

### iPhone (Safari)
1. Abre la app en **Safari** (no Chrome)
2. Toca el botón compartir `⬆`
3. Selecciona **"Añadir a pantalla de inicio"**

---

## ⚙️ Variables de entorno (recomendado para repos públicos)

Crea un archivo `.env` en la raíz:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_project_id
VITE_FIREBASE_STORAGE_BUCKET=tu_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

Y en `src/firebase.js`:

```js
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};
```

> El archivo `.env` ya está en `.gitignore` y no se subirá a GitHub.

---

## 👤 Contacto

**Hno. José Luis Martínez Cisneros** — Administrador de la aplicación

🌐 [himnarioigc.web.app](https://himnarioigc.web.app)
