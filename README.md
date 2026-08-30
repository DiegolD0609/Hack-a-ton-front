# Kernel Panic · Studio

Frontend React/Vite de Kernel Panic. **La app es Studio**: un cuadro de texto
donde describes una interfaz y el backend la genera, valida y renderiza en
vivo — sin escribir código. `App.tsx` renderiza únicamente `<Studio />`.

## Studio vs. runtime heredado

El repositorio también contiene el frontend de un sistema anterior (runtime de
agente con workflows, WebSocket, decisiones humanas y un editor) en
`src/pages/Landing.tsx`, `src/pages/Demo.tsx`, `src/editor/`, `src/runtime/`,
`src/assistant/`, `src/inspector/` y `src/history/`. Ese código sigue
compilando, tiene sus propios tests y el backend correspondiente sigue vivo
(`Hack-a-ton-end/README.md`, sección "Runtime de agente") — pero **no hay
router**: no hay ninguna forma de navegar a él desde la app actual, ni
siquiera visitando `/demo` o `/landing` en la URL (no existe manejo de rutas;
cualquier path sirve el mismo `App.tsx`, que solo monta Studio). Trátalo como
código dormido, no como una pantalla alcanzable.

Si vas a tocar algo del producto, es Studio (`src/pages/Studio.tsx`,
`src/studio/`, `src/components/studio/`).

## Arranque rápido

Requisitos: Node.js 22, npm 10, y el backend de Kernel Panic corriendo (ver
`Hack-a-ton-end/README.md`).

```bash
npm ci
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173` — esa es la app completa, no hay otras rutas que
visitar.

## Variables de entorno

```env
VITE_API_URL=/api
BACKEND_URL=http://127.0.0.1:8000
```

`VITE_API_URL=/api` es lo que casi siempre quieres: el navegador llama
siempre a `/api/*` (same-origin, sin CORS); Vite en desarrollo y Nginx en el
contenedor lo reenvían a `BACKEND_URL` y le quitan el prefijo `/api`. Si en
cambio pones `VITE_API_URL` apuntando directo al host del backend (p. ej.
`http://127.0.0.1:8000`), el navegador le pega directo — funciona solo si ese
backend tiene el origen del frontend en su `ALLOWED_ORIGINS`, y es la causa
más común de errores de CORS al correr todo en local.

`.env.test` (sí está en git, a diferencia de `.env`) fija
`VITE_API_URL=http://127.0.0.1:8000` para que `npm test` sea determinista sin
importar qué tengas en tu `.env` local — algunos tests (`WorkflowEditor.test.tsx`
del runtime heredado) esperan esa URL literal.

```env
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
```

Tiles raster para `RouteMap.tsx` (MapLibre GL) — lo usan tanto el nodo `map`
de Studio como el runtime heredado, porque Studio reutiliza ese mismo
componente. El resto de variables son solo del runtime heredado (Studio no
las usa):

```env
VITE_DEMO_TOKEN=replace-with-a-shared-demo-token
VITE_RUNTIME_POLLING=true
VITE_ASSISTANT_ENABLED=true
```

## Cómo funciona Studio

1. Escribes un prompt en `/` (por ejemplo: *"crea un panel con una tabla de
   pedidos, un buscador que la filtre, y una gráfica de barras de ventas por
   mes"*).
2. `src/studio/api.ts` llama `POST /studio/generate`. Sin `conversationId`
   crea un proyecto nuevo; con él, el backend trata el prompt como una
   edición del layout anterior (reutiliza ids, conserva lo que no cambió).
3. El backend devuelve un layout declarativo (JSON) — nunca código. `reason`
   explica qué interpretó; `suggestion` (opcional) es un tip de UX que no
   pediste pero podría interesarte.
4. `src/studio/StudioRenderer.tsx` lo pinta. Es deliberadamente
   **contract-free**: a diferencia de `src/runtime/` (que usa AJV + un
   registry estricto), este renderer no importa ni valida los contratos del
   runtime heredado — cualquier campo faltante o de tipo raro cae a un
   default razonable en vez de romper la pantalla.

### Qué puede generar

Contenedores: `page`, `section` (fila/columna, gap, alineación, color de
fondo).

Contenido: `text`, `button`, `metric`, `alert`, `timeline`, `keyValue`,
`compare`, `step`, `map` (MapLibre GL real con fallback SVG sin WebGL/red).

Datos e interactivos: `searchBar`, `dropdown`, `chart` (barras/línea/pastel),
`table` (hasta 250 filas, con scroll interno y encabezado fijo), `progress`,
`tags`.

- **Color:** casi cualquier elemento acepta un color hex explícito
  (`color`/`backgroundColor`) que el modelo fija cuando se lo pides — no es
  solo una descripción en texto, se aplica de verdad como estilo.
- **Filtrado real:** un `searchBar`/`dropdown` puede declarar `filterTarget`
  apuntando al id de una `table`/`tags` del mismo layout (y `dropdown`,
  además, `filterColumn` para fijarse a una columna). El filtrado corre en el
  navegador (`FilterContext` dentro de `StudioRenderer.tsx`) mientras
  escribes/seleccionas — no hay llamada al backend por cada tecla.
- **Responsive real:** el switcher desktop/tablet/mobile del canvas
  (`StudioCanvas.tsx`) solo cambia el ancho de un `<div>` — el viewport real
  del navegador sigue siendo de escritorio. Por eso el CSS generado usa
  *container queries* (`container-type: inline-size` en
  `.studio-browser-frame`), no `@media`, para reaccionar al ancho real del
  marco de preview.

Historial y feedback de cada proyecto (`GET/DELETE /studio/projects/{id}`,
`POST /studio/projects/{id}/feedback`) viven en
`src/components/studio/ProjectHistory.tsx` y `ProjectFeedback.tsx`; calificar
un proyecto (1–5 + comentario opcional) hace que el backend use esa
calificación para pedirle al modelo más esfuerzo de razonamiento en la
siguiente generación de ese mismo proyecto.

## Estructura

```text
src/
├── pages/Studio.tsx        página única de la app; orquesta prompt, historial y feedback
├── studio/                 api.ts (fetch a /studio/*), projects.ts, StudioRenderer.tsx
├── components/studio/      canvas, árbol de iteraciones, consola del orquestador, feedback
│
├── pages/Demo.tsx          ⚠ heredado, sin ruta que lo alcance
├── pages/Landing.tsx       ⚠ heredado, sin ruta que lo alcance
├── editor/                 ⚠ heredado (editor de workflow del runtime)
├── runtime/                ⚠ heredado (contratos, AJV, renderer, reducer, WebSocket)
├── assistant/              ⚠ heredado (chat de Ari)
├── inspector/              ⚠ heredado (inspector de UISpec)
├── history/                ⚠ heredado (historia de runs)
│
├── components/ui-kit/      primitivas visuales del runtime heredado (RouteMap sí se
│                            reutiliza en Studio para el nodo `map`)
├── config/                 identidad y rutas públicas mínimas
├── test/                   configuración de Vitest
├── App.tsx                 monta únicamente <Studio />
└── index.css               tokens, estilos de Studio (.generated-*) y del runtime heredado
```

## Calidad y despliegue

```bash
npm run lint
npm test
npm run build
docker compose up --build
```

Docker publica el frontend en `http://localhost:3000`, escucha el `PORT`
inyectado por la plataforma (8080 por defecto) y expone `/health`. Railway usa
`railway.json`; el contenedor solo contiene Nginx y los assets estáticos, y su
proxy conecta con el backend externo configurado en `BACKEND_URL`.

### Despliegue independiente en Railway

Despliega este repositorio como un único servicio Docker. No agregues
servicios de backend o PostgreSQL al proyecto del frontend. Configura
`VITE_DEMO_TOKEN` como variable de build (heredado, pero el build lo espera)
y, solo si usas otro ambiente, `BACKEND_URL` en runtime. Sin override, el
contenedor usa el backend público de producción.

## Problema conocido (backend, pero te va a doler aquí)

Si `/studio/projects/{id}` responde **500 con un error de CORS** en la
consola del navegador, no es un problema de CORS: es que la base de datos de
producción tiene una columna nueva desincronizada (el backend no tiene
migraciones, solo crea tablas que faltan, nunca las altera). El navegador
reporta como "CORS" cualquier 500 que salga de una excepción no manejada,
porque esa respuesta nunca pasa por el middleware que agrega el header. El
fix real (una sentencia `ALTER TABLE`) y la explicación completa están en
`Hack-a-ton-end/README.md`.
