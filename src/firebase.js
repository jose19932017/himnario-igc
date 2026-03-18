// ─────────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DE FIREBASE
//  Reemplaza los valores de abajo con los de tu proyecto en Firebase.
//
//  Pasos:
//  1. Ve a https://console.firebase.google.com
//  2. Crea un proyecto nuevo (ej. "himnario-igc")
//  3. Agrega una app Web (ícono </> en la pantalla principal)
//  4. Copia los valores del objeto firebaseConfig que te genera Firebase
//  5. Pégalos aquí reemplazando los que dicen "TU_VALOR_AQUI"
// ─────────────────────────────────────────────────────────────────

import { initializeApp } from "firebase/app";
import { getFirestore, enableIndexedDbPersistence } from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);

// ✅ Persistencia offline — guarda los cantos y anuncios en el
//    dispositivo para que funcionen aunque no haya internet.
//    La primera vez se requiere conexión para descargarlos.
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === "failed-precondition") {
    // Ocurre si hay múltiples pestañas abiertas al mismo tiempo.
    // Solo una pestaña puede usar persistencia offline a la vez.
    console.warn("Himnario: persistencia offline no disponible (múltiples pestañas).");
  } else if (err.code === "unimplemented") {
    // El navegador no soporta IndexedDB (muy poco común hoy en día).
    console.warn("Himnario: este navegador no soporta modo offline.");
  }
});
