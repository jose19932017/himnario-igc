import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { registerSW } from 'virtual:pwa-register'

// Registra el Service Worker y muestra un aviso cuando hay actualización
const updateSW = registerSW({
  onNeedRefresh() {
    // Cuando hay una nueva versión disponible
    const ok = confirm('Hay una nueva versión del Himnario disponible. ¿Actualizar ahora?')
    if (ok) updateSW(true)
  },
  onOfflineReady() {
    console.log('Himnario IGC listo para usar sin conexión ✓')
  },
})

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
