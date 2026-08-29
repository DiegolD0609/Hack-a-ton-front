# Kernel Panic · Agent UI Runtime

Frontend React/Vite del runtime seguro de Kernel Panic: recibe una `UISpec`
declarativa, la valida y la convierte en una interfaz viva. Una intervención
humana vuelve al agente como un `ActionEvent` tipado.

## Inicio rápido

Requisitos: Node.js 22 y npm 10 o posteriores.

```bash
npm ci
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Rutas principales

- `/landing`: presentación del producto y hero multimedia.
- `/demo`: walking skeleton conectado por WebSocket; acepta `?runId=run_...`.
- `/login` y `/register`: autenticación mock o conectada a API.
- `/dashboard`: centro de operaciones protegido.
- `/settings`: preferencias locales de la cuenta demo.

## Variables de entorno

Copia `.env.example` como `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_DEMO_TOKEN=replace-with-a-shared-demo-token
VITE_RUNTIME_POLLING=true
```

En desarrollo local, `VITE_API_URL` puede apuntar directamente a FastAPI. Para
usar el proxy HTTP/WS de Vite, define `VITE_API_URL=/api` y
`BACKEND_URL=http://127.0.0.1:8000`. El build de Docker usa
`http://localhost:8000/api`, que Nginx proxifica al backend configurado en
`BACKEND_URL`.

`VITE_DEMO_TOKEN` debe coincidir con `DEMO_TOKEN` del backend para el handshake
WebSocket. Es un control exclusivo de la demo y queda visible en el bundle Vite;
no debe reutilizarse como secreto de producción.

## Contratos congelados (Phase 0)

El espejo TypeScript de `RunProjection`, `UISpec`, `ActionEvent`, `RunEvent`,
los nueve nodos permitidos y el envelope WebSocket vive en
`src/runtime/contracts.ts`. La autoridad ejecutable es Pydantic en el backend;
ambos archivos se actualizan juntos y conservan `schemaVersion = "1"`.

Los tokens semánticos del runtime (spacing, jerarquía y emphasis
normal/warning/critical) están en `src/index.css`.

Los JSON Schema de `UISpec` y del envelope servidor se exportan desde los
modelos Pydantic congelados y se guardan en `src/runtime/generated/`. AJV los
ejecuta antes de que un mensaje WebSocket entre al reducer. No deben editarse a
mano ni regenerarse desde los tipos TypeScript.

## Fases 1–2 · skeleton y golden path

La ruta `/demo` permite crear un skeleton G1 o iniciar el golden path real. Una
vez que el backend devuelve el `runId`, abre:

```text
GET ws(s)://<VITE_API_URL>/ws/runs/{runId}?token=<VITE_DEMO_TOKEN>
```

“Skeleton H3” solicita al backend:

```http
POST /demo/skeleton
```

“Iniciar golden path” usa `POST /runs`; “Avanzar demo” llama
`POST /demo/advance` hasta recorrer los cinco pasos del fixture. El frontend
espera `UI_UPDATED`, guarda `projection` + `uiSpec` en un reducer y renderiza
recursivamente `page`, `section`, `metric`, `decisionPanel`, `step`, `alert`,
`timeline` y `keyValue` con tokens normal/warning/critical. `compare` se integra
en Fase 3, como establece el roadmap.

Un tipo no registrado o props inválidas quedan aislados como
`GenericStepCard`; nunca derriban la página completa. El reducer reconoce los
doce mensajes P0 del contrato congelado.

Al pulsar una acción permitida, el cliente envía `ACTION_SUBMITTED` por el mismo
socket. Su payload es un `ActionEvent` con `idempotencyKey` de cliente y sin
`eventId`; el panel muestra `submitting`, `accepted` o `rejected` según la
respuesta del backend.

El backend recompone y emite una nueva `UI_UPDATED` tras aceptar la acción. Los
tests del runtime mantienen además un socket falso para validar el loop sin
depender de infraestructura local.

## Fase 3 · resiliencia e inspector

El registry ya contiene las nueve primitivas congeladas, incluido `compare`.
En cada conexión y reconexión el cliente obtiene
`GET /runs/{id}/snapshot`; si el WebSocket cae y
`VITE_RUNTIME_POLLING=true`, mantiene la pantalla actualizada por polling
mientras reintenta el canal vivo.

“Inspeccionar UISpec” abre el JSON vivo y expone `generatedBy`, `reason`,
`stateVersion` y la versión del workflow. Así se puede observar el cambio de la
UI determinista al upgrade LLM sin ocultar el contrato que llegó al renderer.

## Comandos

| Comando | Uso |
|---|---|
| `npm run dev` | Servidor local con HMR |
| `npm run lint` | Análisis estático con oxlint |
| `npm test` | Pruebas de rutas, validación y sesión |
| `npm run build` | Type-check y bundle de producción |
| `npm run preview` | Vista previa del bundle |

## Estructura

```text
src/
├── components/ui-kit/ primitivas visuales del registry
├── config/           Marca, rutas y escenario demo
├── features/auth/    Servicios, persistencia y validación
├── hooks/            Contextos y hooks de React
├── layouts/          Estructuras de navegación
├── middleware/       Router y guards
├── pages/            Pantallas de la aplicación
├── runtime/          renderer, registry, reducer, socket, schemas y contratos
└── test/             Configuración de pruebas
```

Los estilos y tokens globales viven en `src/index.css`. Las fuentes se empaquetan localmente y los videos optimizados del hero viven en `public/videos`.

## Calidad y despliegue

GitHub Actions ejecuta lint, pruebas y build en cada pull request y push a `main`.

También se incluye una configuración Docker con Nginx:

```bash
cp .env.example .env
docker compose up --build
```

El compose levanta solo el frontend en `http://localhost:3000` y proxifica
`/api` al backend del host en `http://localhost:8000`; el backend se ejecuta
desde su propio repositorio.

Antes de una presentación ejecuta:

```bash
npm run lint
npm test
npm run build
```
