# 🛒 Gestor de Pickers

Aplicación web en tiempo real para gestionar **pickers** (personal de picking/logística) en un centro de distribución o bodega.

Permite al coordinador agregar pickers, asignar pedidos, reordenar la lista con drag & drop, y a los pickers recibir notificaciones push cuando se les asigna un pedido.

---

## ✨ Funcionalidades actuales

- **Login** del coordinador con Supabase Auth (email + contraseña)
- **CRUD de pickers** — agregar, asignar pedidos, finalizar (completado/cancelado), sacar/restaurar del turno, eliminar
- **Turno AM / PM** — al agregar un picker se selecciona su turno; fondo de color en los items (🟡 AM amarillo, 🟣 PM índigo)
- **Cola respeta orden** — los pickers fuera del turno mantienen su posición en la cola. Al restaurarlos vuelven a donde estaban, no al final
- **Contador de pedidos completados** — cada picker muestra sus pedidos completados; al finalizar se pregunta si se completó o se canceló
- **Buscador por nombre** en las columnas de Disponibles y En Pedido (filtro local case-insensitive)
- **Reordenar disponibles** con drag & drop (mouse y táctil) — siempre coloca el item ARRIBA del target con FLIP animation
- **Mover al inicio** con botón ⬆️
- **Sección Fuera del turno** colapsable con chips de color según turno (AM/PM)
- **Nuevo turno** con confirmación modal (borra todos los pickers y suscripciones push)
- **Notificaciones toast** animadas para cada acción
- **Dos vistas:** coordinador (ruta `/coordinacion`) y picker (ruta `/picker`)
- **Notificaciones push** vía Service Worker + Web Push + Supabase Edge Function
- **Botón de instalación PWA** flotante (📲) — solo en móviles con `beforeinstallprompt`
- **Sincronización en tiempo real** entre múltiples dispositivos vía Supabase Realtime
- **Persistencia offline** con `localStorage` como respaldo
- **FLIP animation** — los items se deslizan suavemente al reordenar

---

## 🧱 Stack tecnológico

| Tecnología | Propósito |
|---|---|
| **React 18** | UI components |
| **Vite 6** | Build tool / dev server |
| **React Router 7** | Rutas |
| **Supabase** | Backend como servicio |
| ├─ PostgreSQL | Base de datos |
| ├─ Realtime | WebSockets para sincronización en vivo |
| ├─ Auth | Login del coordinador |
| └─ Edge Functions | Envío de notificaciones push |
| **PWA** | vite-plugin-pwa + Workbox (injectManifest) |
| **CSS puro** | Estilos (sin frameworks) |

---

## 📁 Estructura del proyecto

```
gestor-pickers/
├── .env                         # Credenciales de Supabase + VAPID keys
├── index.html                   # Entry point HTML
├── package.json
├── vite.config.js               # Vite + React + PWA plugin config
├── README.md                    # Este archivo
├── supabase/
│   └── functions/
│       ├── send-push/
│       │   ├── index.ts         # Edge Function para enviar push
│       │   └── deno.json
│       └── invite-user/
│           ├── index.ts         # Edge Function para invitar coordinadores
│           └── deno.json
├── public/
│   ├── icon-192.svg             # Icono PWA 192x192
│   └── icon-512.svg             # Icono PWA 512x512
└── src/
    ├── main.jsx                 # Entry point React
    ├── App.jsx                  # Router (/, /login, /coordinacion, /picker)
    ├── App.css                  # Estilos globales
    ├── sw.js                    # Service Worker (push events + notificationclick)
    ├── lib/
    │   └── supabase.js          # Cliente Supabase
    ├── hooks/
    │   ├── useAuth.js           # Hook de autenticación
    │   ├── usePickers.js        # Hook principal: CRUD pickers + sync Supabase
    │   ├── usePushNotifications.js # Hook: Web Push subscription
    │   └── useToast.js          # Hook: notificaciones toast
    ├── utils/
    │   └── helpers.js           # generarId() y escapeHtml()
    ├── pages/
    │   ├── Login.jsx            # Login del coordinador
    │   ├── Dashboard.jsx        # Vista coordinador en /coordinacion
    │   └── PickerView.jsx       # Vista picker en /picker
    └── components/
        ├── Header.jsx           # Encabezado con user badge, logout, nuevo turno
        ├── Stats.jsx            # Tarjetas de estadísticas
        ├── AddPickerForm.jsx    # Input + select turno + Agregar + Asignar Pedido
        ├── DisponiblesColumn.jsx # Columna izquierda con drag & drop + buscador
        ├── PedidoColumn.jsx     # Columna derecha con buscador + Finalizar
        ├── FueraSection.jsx     # Sección colapsable fuera del turno
        ├── ProtectedRoute.jsx   # Ruta protegida para coordinador autenticado
        ├── ConfirmModal.jsx     # Modal de confirmación reutilizable
        ├── ToastContainer.jsx   # Contenedor de toasts
        └── InstallPrompt.jsx    # Botón flotante de instalación PWA
```

---

## 🚀 Cómo empezar

### Prerrequisitos

- Node.js 18+
- npm
- Una cuenta gratuita en [Supabase](https://supabase.com)

### Instalación

```bash
# 1. Instalar dependencias
npm install

# 2. Configurar variables de entorno
# Crea un archivo .env en la raíz con:
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
VITE_VAPID_PUBLIC_KEY=BD...  # Clave VAPID pública para Web Push

# 3. Iniciar servidor de desarrollo
npm run dev

# 4. Build para producción
npm run build
```

### Variables de entorno

| Variable | Obligatoria | Descripción |
|---|---|---|
| `VITE_SUPABASE_URL` | ✅ | URL de tu proyecto Supabase |
| `VITE_SUPABASE_ANON_KEY` | ✅ | Anon key de Supabase (pública) |
| `VITE_VAPID_PUBLIC_KEY` | ❌ (sin push) | Clave VAPID pública para Web Push |

---

## 🛣️ Rutas

| Ruta | Acceso | Componente | Descripción |
|---|---|---|---|
| `/` | Público | — | Redirige a `/coordinacion` |
| `/login` | Público | `Login` | Login del coordinador |
| `/coordinacion` | Protegido | `Dashboard` | Panel de control del coordinador |
| `/picker` | Público | `PickerView` | Vista del picker |
| `*` | Público | — | Redirige a `/coordinacion` |

---

## 🔌 API del hook `usePickers`

```js
const {
  pickers,          // Array completo de pickers
  disponibles,      // Array filtrado: estado='disponible' Y no fuera, ordenado
  enPedido,         // Array filtrado: estado='pedido'
  fuera,            // Array filtrado: fueraIds.has(id)

  loading,          // Boolean: cargando desde Supabase
  error,            // String | null: mensaje de error

  agregarPicker,        // (nombre: string, turno?: string) => boolean
  asignarPedido,        // () => void (toma el primer disponible)
  finalizarPedido,      // (id: string, completado?: boolean) => void
  sacarFuera,           // (id: string) => void (mantiene orden)
  restaurarPicker,      // (id: string) => void (vuelve a su posición original)
  restaurarTodos,       // () => void
  eliminarFuera,        // (id: string) => void
  toggleDisponiblePush, // (id: string) => void
  reordenarDisponibles, // (sourceId, targetId, pos='before') => void
  liberarPicker,        // (id: string) => void (desactiva notificaciones)
  nuevoTurno,           // () => void (borra todo)
} = usePickers(supabaseClient, addToast);
```

---

## 📱 Notificaciones push

### Arquitectura

1. **Picker** abre `/picker`, selecciona su nombre, pulsa **🟢 Disponible**
2. El navegador solicita permiso → se suscribe a Web Push → guarda en `push_subscriptions`
3. **Coordinador** asigna pedido → busca suscripción → invoca Edge Function `send-push`
4. La Edge Function envía la notificación al dispositivo del picker

### Despliegue de Edge Functions

```bash
npx web-push generate-vapid-keys

supabase login
supabase link --project-ref <tu-project-ref>

supabase secrets set VAPID_PUBLIC_KEY=<public-key>
supabase secrets set VAPID_PRIVATE_KEY=<private-key>

supabase functions deploy send-push
supabase functions deploy invite-user
```

---

## 🧠 Arquitectura de sincronización

### Mecanismo anti-loop (`isLocalMutation`)

1. Antes de llamar a Supabase, se marca `isLocalMutation = true`
2. Cuando el evento Realtime llega de vuelta, si `isLocalMutation === true` → se ignora
3. Timeout de seguridad de 3s

### Fallback offline

Si Supabase no está disponible, la app cae suavemente a `localStorage`.

---

## ✅ Checklist de implementación

- [x] **Login del coordinador** — Supabase Auth con email + contraseña
- [x] **Protección de rutas** — solo coordinador autenticado en `/coordinacion`
- [x] **CRUD de pickers** — agregar, asignar, finalizar, fuera, restaurar, eliminar
- [x] **Drag & drop** simplificado (siempre arriba del target)
- [x] **FLIP animation** — deslizamiento suave al reordenar
- [x] **Botón ⬆️** mover al inicio
- [x] **Confirmación modal** antes de Nuevo Turno y Eliminar
- [x] **Batch updates** en Supabase (Promise.all)
- [x] **Limpieza de push_subscriptions** al iniciar nuevo turno
- [x] **Toggle Disponible/No disponible** — vista picker sin login
- [x] **Manifest PWA** — instalable al home screen
- [x] **Service Worker** — manejo de eventos push y notificationclick
- [x] **Edge Function `send-push`** — envío de notificaciones
- [x] **Toast notifications** — feedback visual para cada acción
- [x] **localStorage fallback** — respaldo offline
- [x] **Realtime sync** — cambios visibles al instante
- [x] **Mecanismo anti-loop** — `isLocalMutation` con timeout
- [x] **Contador de pedidos completados** + modal completado/cancelado
- [x] **Turno AM/PM** — select al agregar, fondo de color, chips en fuera
- [x] **Fila respeta orden** — fuera mantiene posición, restauración sin mover al final
- [x] **Buscador por nombre** en Disponibles y En Pedido
- [x] **Botón de instalación PWA** — flotante solo en móviles
- [x] **PickerView ordenado** — disponibles → en pedido → fuera
- [x] **Cola de disponibles desplegable** en PickerView
- [ ] **Sonido de alerta** al recibir pedido (pendiente)
- [ ] **Historial de turnos** (pendiente)
- [ ] **Reportes de productividad** (pendiente)
- [ ] **Meta tags iOS** para PWA en iPhone (pendiente)
- [ ] **Fallback Safari iOS** (pendiente)
