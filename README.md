# 🛒 Gestor de Pickers

Aplicación web en tiempo real para gestionar **pickers** (personal de picking/logística) en un centro de distribución o bodega.

Permite al coordinador agregar pickers, asignar pedidos, reordenar la lista con drag & drop, y a los pickers recibir notificaciones push cuando se les asigna un pedido.

---

## ✨ Funcionalidades actuales

- **Login** del coordinador con Supabase Auth (email + contraseña)
- **CRUD de pickers** — agregar, asignar pedidos, finalizar (completado/cancelado), sacar/restaurar del turno, eliminar
- **Turno AM / PM** — al agregar un picker se selecciona su turno; fondo de color en los items (🟡 AM amarillo, 🟣 PM índigo) para identificar rápidamente a quién asignar pedidos según la hora. Una leyenda arriba de las columnas explica los colores
- **Contador de pedidos completados** — cada picker muestra sus pedidos completados en el turno; al finalizar se pregunta si se completó o se canceló
- **Reordenar disponibles** con drag & drop (mouse y táctil) — siempre coloca el item ARRIBA del target
- **Mover al inicio** con botón ⬆️
- **Nuevo turno** con confirmación modal (borra todos los pickers y suscripciones push)
- **Notificaciones toast** animadas para cada acción
- **Dos vistas:** coordinador (protegida con auth) y picker (sin login, selecciona su nombre)
- **Notificaciones push** via Service Worker + Web Push + Supabase Edge Function
- **PWA** instalable al home screen (manifest + service worker)
- **Sincronización en tiempo real** entre múltiples dispositivos vía Supabase Realtime
- **Persistencia offline** con `localStorage` como respaldo
- **FLIP animation** — los items se deslizan suavemente al reordenar

---

## 🧱 Stack tecnológico

| Tecnología | Propósito |
|---|---|
| **React 18** | UI components |
| **Vite 6** | Build tool / dev server |
| **React Router 7** | Rutas (/, /login, /picker) |
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
│       │   └── deno.json        # Import map para Deno
│       └── invite-user/
│           ├── index.ts         # Edge Function para invitar coordinadores (oculta en UI, codigo disponible)
│           └── deno.json        # Import map
├── public/
│   ├── icon-192.svg             # Icono PWA 192x192
│   └── icon-512.svg             # Icono PWA 512x512
└── src/
    ├── main.jsx                 # Entry point React
    ├── App.jsx                  # Router (/, /login, /picker)
    ├── App.css                  # Estilos globales (~700 lineas)
    ├── sw.js                    # Service Worker personalizado (push events + notificationclick)
    ├── lib/
    │   └── supabase.js          # Cliente Supabase (creado con VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY)
    ├── hooks/
    │   ├── useAuth.js           # Hook de autenticación (session, login, logout)
    │   ├── usePickers.js        # Hook principal: CRUD pickers + sync Supabase + estado local
    │   ├── usePushNotifications.js # Hook: Service Worker + suscripción/desuscripción push
    │   └── useToast.js          # Hook: notificaciones toast con auto-removal
    ├── utils/
    │   └── helpers.js           # generarId() y escapeHtml() (no usado)
    ├── pages/
    │   ├── Login.jsx            # Login del coordinador (email + password)
    │   ├── Dashboard.jsx        # Vista coordinador (app principal, requerida autenticación)
    │   └── PickerView.jsx       # Vista picker (selector de nombre + toggle disponible)
    └── components/
        ├── Header.jsx           # Encabezado con user badge, logout, nuevo turno
        ├── Stats.jsx            # Tarjetas de estadísticas (disponibles, en pedido, fuera)
        ├── AddPickerForm.jsx    # Input + botón Agregar + botón Asignar Pedido (Ctrl+Enter)
        ├── DisponiblesColumn.jsx # Columna izquierda con drag & drop + FLIP animation
        ├── PedidoColumn.jsx     # Columna derecha (en pedido) con botón Finalizar
        ├── FueraSection.jsx     # Sección colapsable fuera del turno (restaurar/eliminar)
        ├── ProtectedRoute.jsx   # Ruta protegida para coordinador autenticado
        ├── ConfirmModal.jsx     # Modal de confirmación reutilizable (overlay animado)
        └── ToastContainer.jsx   # Contenedor de toasts en esquina inferior derecha
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

## 🗄️ Base de datos (Supabase)

Ejecutar en el **SQL Editor** de Supabase:

```sql
-- Tabla principal de pickers
CREATE TABLE pickers (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  estado TEXT NOT NULL DEFAULT 'disponible' CHECK (estado IN ('disponible', 'pedido')),
  fuera BOOLEAN NOT NULL DEFAULT false,
  orden INTEGER NOT NULL DEFAULT 0,
  disponible_push BOOLEAN NOT NULL DEFAULT false,
  pedidos_completados INTEGER NOT NULL DEFAULT 0,
  turno TEXT NOT NULL DEFAULT 'am' CHECK (turno IN ('am', 'pm')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE pickers;

-- Migraciones para tablas existentes:
-- ALTER TABLE pickers ADD COLUMN pedidos_completados INTEGER NOT NULL DEFAULT 0;
-- ALTER TABLE pickers ADD COLUMN turno TEXT NOT NULL DEFAULT 'am' CHECK (turno IN ('am', 'pm'));

-- Tabla de suscripciones push (una por picker)
CREATE TABLE push_subscriptions (
  id SERIAL PRIMARY KEY,
  picker_id TEXT UNIQUE NOT NULL REFERENCES pickers(id) ON DELETE CASCADE,
  subscription JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER PUBLICATION supabase_realtime ADD TABLE push_subscriptions;

-- RLS: permitir anon key (necesario para la app pública)
ALTER TABLE push_subscriptions DISABLE ROW LEVEL SECURITY;
-- O crear policies específicas:
-- CREATE POLICY "anon_all" ON push_subscriptions FOR ALL TO anon USING (true) WITH CHECK (true);
```

---

## 📱 Notificaciones push

### Arquitectura

1. **Picker** abre `/picker`, selecciona su nombre, pulsa **🟢 Disponible**
2. El navegador solicita permiso → se suscribe a Web Push → guarda en `push_subscriptions`
3. **Coordinador** asigna pedido → `usePickers` busca suscripción en `push_subscriptions` → invoca Edge Function `send-push`
4. La Edge Function envía la notificación al dispositivo del picker (incluso con pantalla bloqueada o pestaña cerrada)

### Permiso denegado

Si el usuario bloqueó las notificaciones (`permission === 'denied'`), el navegador ya no muestra el diálogo de permiso al llamar `Notification.requestPermission()`. En ese caso la app muestra una guía visual con pasos para activarlo manualmente:

1. Tocar el candado 🔒 en la barra de direcciones
2. Ir a "Configuración del sitio"
3. Cambiar Notificaciones de "Bloquear" a "Permitir"
4. Recargar la página
5. Activar "Disponible" nuevamente

Si el permiso está en `'default'` (nunca se preguntó), un botón "🔔 Activar notificaciones" dispara el diálogo del navegador correctamente.

### Despliegue de Edge Functions

```bash
# 1. Generar claves VAPID (solo la primera vez)
npx web-push generate-vapid-keys

# 2. Agregar al .env
VITE_VAPID_PUBLIC_KEY=<public-key>

# 3. Instalar Supabase CLI
npm install -g supabase

# 4. Iniciar sesión y vincular proyecto
supabase login
supabase link --project-ref <tu-project-ref>

# 5. Configurar secrets
supabase secrets set VAPID_PUBLIC_KEY=<public-key>
supabase secrets set VAPID_PRIVATE_KEY=<private-key>

# 6. Desplegar funciones
supabase functions deploy send-push
supabase functions deploy invite-user
```

### CORS en Edge Functions

Las Edge Functions tienen headers CORS configurados para aceptar peticiones desde cualquier origen (`*`). Esto es necesario porque el cliente de Supabase envía headers como `x-client-info` y `apikey`. Ver `supabase/functions/*/index.ts`.

---

## 🧠 Arquitectura de sincronización

### Flujo de datos

```
[Usuario A: asigna pedido]
        │
        ▼
[React: actualiza estado local (setPickers)]
        │
        ▼
[syncToSupabase: UPDATE pickers SET estado='pedido']
        │
        ├──▶ [Supabase Realtime: emite evento a TODOS los clientes]
        │
        ▼
[Usuario A: isLocalMutation=true → ignora]   [Usuario B: recibe el cambio vía Realtime]
                                                   │
                                                   ▼
                                              [setPickers actualiza estado local]
                                                   │
                                                   ▼
                                              [Toast: "📋 X recibió un pedido"]
```

### Mecanismo anti-loop (`isLocalMutation`)

Para evitar que el cliente que hizo el cambio reciba una notificación duplicada:

1. Antes de llamar a Supabase, se marca `isLocalMutation = true` (ref, no estado)
2. Cuando el evento Realtime llega de vuelta, si `isLocalMutation === true` → se ignora y se resetea el flag
3. Si el evento no vuelve en 3 segundos (timeout de seguridad), se resetea automáticamente
4. El timeout se limpia si el evento llega antes

⚠️ **Nota:** Con `Promise.all` para updates en lote (reordenar, restaurar todos), solo el PRIMER evento Realtime de la ráfaga consume `isLocalMutation`. Los eventos del 2..N se procesan como cambios externos. Como solo actualizan el campo `orden` (mismos valores), no hay duplicación de toasts ni bugs visuales.

### Fallback offline

Si Supabase no está disponible, la app **cae suavemente a `localStorage`**. El hook `usePickers` guarda el estado completo en `localStorage` después de cada cambio. Si la carga desde Supabase falla, se restaura desde el caché local.

---

## 🎮 Drag & Drop

### Comportamiento

- Siempre coloca el item arrastrado **ANTES** del target (no usa before/after)
- Muestra una **línea azul** en el borde superior del target mientras se arrastra
- Soporta **mouse** (HTML5 Drag & Drop API) y **táctil** (touch events)
- Al soltar, los items se **deslizan suavemente** a su nueva posición (FLIP animation con `translateY`)

### Implementación

- `dragRef` — ref para el ID del item siendo arrastrado
- `handleDragEnter` — agrega clase `drop-before` al target (línea azul)
- `handleDragOver` — solo `e.preventDefault()` (no necesita más)
- `handleDrop` — llama `onReordenar(sourceId, targetId, 'before')`
- `handleTouchMove` — `elementFromPoint()` para detectar target en táctil
- `handleDragEnd` — limpia todas las clases visuales
- `limpiaIndicadores()` — función reutilizable para limpiar `.dragging` y `.drop-before`

### FLIP animation

- `capturePositions()` — guarda `getBoundingClientRect().top` de cada item ANTES del reorden
- `shouldAnimate` — flag ref para solo animar en reordenes (no en carga inicial)
- `useLayoutEffect` — calcula diff entre posición vieja y nueva, aplica `translateY` inversa sin transición, fuerza reflow, luego anima a `translateY(0)` con `transition: transform 0.35s ease`
- Se limpia con `transitionend` handler (`{ once: true }`)

---

## 🔌 API del hook `usePickers`

```js
const {
  pickers,          // Array completo de pickers (del estado local)
  disponibles,      // Array filtrado: estado='disponible' Y no fuera (useMemo)
  enPedido,         // Array filtrado: estado='pedido' (useMemo)
  fuera,            // Array filtrado: fueraIds.has(id) (useMemo)

  loading,          // Boolean: cargando desde Supabase por primera vez
  error,            // String | null: mensaje de error si falló conexión

  agregarPicker,        // (nombre: string, turno?: string) => boolean
  asignarPedido,        // () => void (toma el primer disponible)
  finalizarPedido,      // (id: string, completado?: boolean) => void
  sacarFuera,           // (id: string) => void
  restaurarPicker,      // (id: string) => void
  restaurarTodos,       // () => void
  eliminarFuera,        // (id: string) => void (confirma vía ConfirmModal desde Dashboard)
  toggleDisponiblePush, // (id: string) => void
  reordenarDisponibles, // (sourceId, targetId, pos='before') => void
  nuevoTurno,           // () => void (borra todo + push_subscriptions)
} = usePickers(supabaseClient, addToast);
```

### Detalle de `reordenarDisponibles`

```js
reordenarDisponibles(sourceId, targetId, pos = 'before')
```

- Toma el item `sourceId`, lo saca de la lista de disponibles
- Encuentra `targetId` en la lista (después de remover source)
- Si `pos === 'after'`, inserta después del target (índice + 1)
- Si no (default), inserta antes del target
- Actualiza estado local Y sincroniza a Supabase (updates en paralelo con `Promise.all`)
- Siempre se llama con `'before'` desde el drag & drop actual (simplificado)

### Sincronización batch

| Función | Antes | Ahora |
|---|---|---|
| `reordenarDisponibles` | Updates secuenciales (N queries) | `Promise.all` en paralelo |
| `restaurarTodos` | Updates secuenciales (N queries) | `Promise.all` en paralelo |
| `nuevoTurno` | Solo borra pickers | También limpia `push_subscriptions` |

---

## 🧩 Componentes

### DisponiblesColumn

- Columna izquierda del dashboard (✅ Disponibles)
- Fondo de color según turno: amarillo (AM) con borde naranja, índigo (PM) con borde violeta
- Drag & drop con FLIP animation
- Botón ⬆️ (mover al inicio) — solo visible si index > 0
- Botón ⏸️ Fuera — saca del turno

### PedidoColumn

- Columna derecha (📦 En Pedido)
- Badge de turno AM/PM sin color (solo texto)
- Sin drag — botón ✅ Finalizar abre modal de confirmación (completado/cancelado)
- Indicador azul pulsante

### FueraSection

- Sección colapsable abajo de las columnas
- Chips con botones ✅ (restaurar) y 🗑️ (eliminar)
- Botón 🔄 Restaurar todos

### ConfirmModal

- Modal reutilizable con overlay, animación, y botones
- Props: `open`, `title`, `message`, `confirmLabel`, `cancelLabel`, `variant`, `onConfirm`, `onCancel`
- Se cierra al hacer clic fuera del modal
- Auto-focus en botón de confirmar

### Header

- Título + badge "Turno"
- User badge con email
- Botón 🚪 Salir (logout)
- Botón 🗑️ Nuevo Turno (abre ConfirmModal)

### Stats

- 3 tarjetas: ✅ Disponibles, 📦 En Pedido, ⏸️ Fuera
- Con contadores numéricos

### AddPickerForm

- Input + select de turno (☀️ AM / 🌆 PM)
- Botón ➕ Agregar
- Botón 📋 Asignar Pedido (deshabilitado si no hay disponibles)
- Ctrl+Enter para asignar rápido

### ToastContainer

- Fijo en esquina inferior derecha
- Animación de entrada (`toastIn`) y salida (`toastOut`)
- Auto-removido después de 2.5s
- Tipos: `success` (verde), `error` (rojo), `info` (azul)

### PickerView

- Vista pública sin login (`/picker`)
- El picker selecciona su nombre de la lista (o ya está preseleccionado vía localStorage)
- Botón toggle 🟢 Disponible / 🔴 No disponible (activa/desactiva notificaciones push)
- Muestra estado actual: Disponible, En pedido, Fuera del turno
- Notificaciones flotantes (ToastContainer) integradas
- **Gestión de permisos de notificación:**
  - Si el permiso está en `'default'` (nunca preguntado) → botón "🔔 Activar notificaciones" que dispara el diálogo del navegador
  - Si el permiso está en `'denied'` (bloqueado) → guía visual paso a paso para activarlo manualmente
- Botón 🔄 Cambiar de picker

### ProtectedRoute

- Muestra "🔒 Verificando sesión..." mientras carga
- Redirige a `/login` si no autenticado
- Renderiza children si autenticado

---

## 🛣️ Rutas

| Ruta | Acceso | Componente | Descripción |
|---|---|---|---|
| `/login` | Público | `Login` | Login del coordinador |
| `/` | Protegido | `Dashboard` | Panel de control del coordinador |
| `/picker` | Público | `PickerView` | Vista del picker (seleccionar nombre + toggle) |
| `*` | Redirige a `/` | — | Cualquier otra ruta |

---

## 🐛 Bugs conocidos y resueltos

### Resuelto: Error `removeChild` en ToastContainer

**Problema:** Al agregar un picker, la pantalla se quedaba en blanco con `NotFoundError: Failed to execute 'removeChild'`.

**Causa:** El handler `animationend` global escuchaba TODOS los eventos. Cuando un toast terminaba su animación de salida, ejecutaba `e.target.remove()` eliminando el nodo del DOM. Simultáneamente, React intentaba eliminar el mismo nodo vía React reconciliation.

**Fix:** Guarda `if (!e.target.classList.contains('picker-item')) return;` en el handler `animationend`. Así solo procesa items picker y no interfiere con toasts.

### Resuelto: `window.confirm()` reemplazado por `ConfirmModal`

**Problema:** `eliminarFuera` en `usePickers` usaba `window.confirm()` — un modal nativo del navegador que rompía la experiencia de usuario.

**Fix:** Se eliminó `window.confirm()` del hook. Ahora `eliminarFuera` solo ejecuta la eliminación sin preguntar. El Dashboard muestra un componente `ConfirmModal` antes de llamar a `eliminarFuera`, manteniendo la UI consistente.

### Resuelto: Getters `disponibles`, `enPedido`, `fuera` eran funciones

**Problema:** Los tres getters estaban implementados como funciones retornadas por `useCallback`, obligando a invocarlos como `disponibles()`, `enPedido()`, `fuera()` en el Dashboard.

**Fix:** Se cambiaron a `useMemo`, devolviendo el array filtrado directamente. Ahora se usan como `disponibles`, `enPedido`, `fuera` (sin paréntesis).

### Resuelto: código duplicado en `reordenarDisponibles`

**Problema:** La lógica de reordenamiento estaba implementada dos veces: una para `setPickers` y otra casi idéntica para `syncToSupabase`.

**Fix:** Se extrajo una función compartida `reordenarLista` (vía `useCallback`) que recibe `sourceId`, `targetId`, `pos` y devuelve el array reordenado. Ambos `setPickers` y `syncToSupabase` usan el mismo resultado.

### Resuelto: Valor stale de `pickers.length` en operaciones de orden

**Problema:** `finalizarPedido`, `restaurarPicker` y `restaurarTodos` usaban `pickers.length` dentro de `syncToSupabase`, capturando el valor ANTES de la mutación del estado local.

**Fix:** Cada función calcula `targetOrden` (o `baseOrden` para restaurarTodos) al inicio, antes de llamar a `setPickers`, asegurando que el valor usado para la sincronización sea correcto y consistente.

### Resuelto: Faltaba `addToast` en PickerView

**Problema:** La vista `PickerView.jsx` llamaba a `usePickers(supabase)` sin pasar `addToast`, por lo que las notificaciones toast de eventos en tiempo real nunca se mostraban al picker.

**Fix:** Se importó `useToast` en `PickerView` y se pasa `addToast` a `usePickers(supabase, addToast)`.

### Resuelto: Drag & drop no posicionaba correctamente

**Problema:** Arrastrar un item a la mitad inferior de otro lo colocaba arriba en vez de abajo.

**Causa:** La posición (`before`/`after`) se calculaba en `handleDragEnter` (al ENTRAR al elemento). Si el cursor entraba por el borde superior, la posición era siempre `'before'` y `handleDragOver` no la actualizaba.

**Fix:** Se simplificó el drag & drop para siempre colocar el item ANTES del target. Sin cálculo de posición, sin `before`/`after`. La línea azul siempre aparece arriba del target.

---

## 📐 Estructura de la tabla `pickers`

| Columna | Tipo | Descripción |
|---|---|---|
| `id` | `TEXT PK` | ID único generado con `generarId()` |
| `nombre` | `TEXT NOT NULL` | Nombre del picker |
| `estado` | `TEXT CHECK` | `'disponible'` o `'pedido'` |
| `fuera` | `BOOLEAN` | `true` si está fuera del turno |
| `orden` | `INTEGER` | Posición en la lista (para drag & drop) |
| `disponible_push` | `BOOLEAN` | `true` si activó notificaciones push |
| `pedidos_completados` | `INTEGER` | Contador de pedidos completados en el turno |
| `turno` | `TEXT CHECK` | `'am'` o `'pm'` — turno del picker |
| `created_at` | `TIMESTAMPTZ` | Fecha de creación |

---

## ✅ Checklist de implementación

- [x] **Login del coordinador** — Supabase Auth con email + contraseña
- [x] **Protección de rutas** — solo coordinador autenticado
- [x] **CRUD de pickers** — agregar, asignar, finalizar, fuera, restaurar, eliminar
- [x] **Drag & drop** simplificado (siempre arriba del target)
- [x] **FLIP animation** — deslizamiento suave al reordenar
- [x] **Botón ⬆️** mover al inicio
- [x] **Confirmación modal** antes de Nuevo Turno
- [x] **Batch updates** en Supabase (Promise.all en vez de loop secuencial)
- [x] **Limpieza de push_subscriptions** al iniciar nuevo turno
- [x] **Toggle Disponible/No disponible** — vista picker sin login
- [x] **Manifest PWA** — instalable al home screen
- [x] **Service Worker** — manejo de eventos push y notificationclick
- [x] **Tabla `push_subscriptions`** — suscripciones por picker
- [x] **Filtro por `disponible_push`** — solo push a pickers disponibles
- [x] **Edge Function `send-push`** — envío de notificaciones
- [x] **Edge Function `invite-user`** — invitar coordinadores por email (oculta en UI)
- [x] **CORS headers** — configurados en ambas Edge Functions (`Access-Control-Allow-Origin: *`)
- [x] **Toast notifications** — feedback visual para cada acción
- [x] **localStorage fallback** — respaldo offline cuando Supabase falla
- [x] **Realtime sync** — cambios visibles en múltiples dispositivos al instante
- [x] **Mecanismo anti-loop** — `isLocalMutation` con timeout de 3s
- [x] **Contador de pedidos completados** — cada picker muestra su conteo; modal de confirmación al finalizar (completado/cancelado)
- [x] **Turno AM/PM** — select al agregar picker, fondo de color en Disponibles con leyenda explicativa arriba de las columnas
- [ ] **Sonido de alerta** — archivo de audio al recibir pedido (pendiente)
- [ ] **Historial de turnos** — guardar turnos anteriores (pendiente)
- [ ] **Reportes** — estadísticas de productividad por picker (pendiente)
- [ ] **Deploy** a Vercel o Netlify (pendiente)

---

## 📄 Notas para la próxima IA

### Cosas que NO hacer

- No intentar implementar `before`/`after` en drag & drop otra vez — el usuario prefiere que siempre quede arriba del target
- No cambiar el `upsert` por updates — el upsert falla porque faltan columnas requeridas
- No modificar `sw.js` sin verificar `vite-plugin-pwa` config — el SW es inyectado por Vite en build
- No volver a poner `window.confirm()` en `eliminarFuera` — ahora se maneja con `ConfirmModal` desde Dashboard

### Código muerto conocido

- `escapeHtml()` en `src/utils/helpers.js` — exportada pero no usada en ningún lado. Se puede eliminar.
- `dragOverId` state en `DisponiblesColumn.jsx` — se setea pero no se usa en el render. Se eliminó del className.
- `session` en `App.jsx` — se destructura de `useAuth()` pero no se usa directamente (solo se usan `user` e `isAuthenticated`).

### Posibles mejoras pendientes

- Centralizar strings de estado (`'disponible'`, `'pedido'`, `'fuera'`) en constantes
- Agregar sonido de notificación push
- Historial de turnos
- Reportes de productividad
- Deploy a producción (Vercel, Netlify, o Supabase hosting)
