# Kernel Panic · Agent UI Runtime

Frontend React/Vite del runtime seguro de Kernel Panic. Recibe una `UISpec`
declarativa, la valida y la convierte en una interfaz viva; una intervención
humana vuelve al agente como un `ActionEvent` tipado.

## Alcance

El repositorio contiene únicamente la superficie definida por el roadmap:

- renderer recursivo y fallback por nodo;
- registry v1.1 de diez componentes, incluido un mapa interactivo MapLibre GL;
- reducer, WebSocket, reconexión por snapshot y fallback de polling;
- inspector de `UISpec` con `generatedBy`, `reason` y `stateVersion`;
- editor de workflow que genera pasos, muestra el diff y ejecuta `v(n+1)`;
- historia persistente de runs por operación y controles M1–M3;
- panel de Ari con recomendaciones acotadas por policy y `proposedStep`;
- design tokens normal, warning y critical;
- landing de presentación con un único destino funcional: la demo;
- shell de demo para el walking skeleton y el golden path.

No incluye autenticación, dashboard logístico, preferencias ni pantallas de
producto fijas. La landing presenta el concepto; la interfaz operativa procede
del runtime.

## Inicio rápido

Requisitos: Node.js 22, npm 10 y el backend de Kernel Panic.

```bash
npm ci
cp .env.example .env
npm run dev
```

Abre `http://localhost:5173/landing` para la presentación,
`http://localhost:5173/demo` para entrar al runtime o
`http://localhost:5173/editor` para crear una versión ejecutable.

## Variables de entorno

```env
VITE_API_URL=/api
VITE_DEMO_TOKEN=replace-with-a-shared-demo-token
VITE_RUNTIME_POLLING=true
VITE_ASSISTANT_ENABLED=true
VITE_MAP_TILE_URL=https://tile.openstreetmap.org/{z}/{x}/{y}.png
BACKEND_URL=https://hack-a-ton-end-production.up.railway.app
```

El navegador usa siempre `/api/*`; Vite en desarrollo y Nginx en el contenedor
lo redirigen a `BACKEND_URL` y eliminan el prefijo `/api`. En Railway el
frontend es un servicio independiente y, por defecto, Nginx lo reenvía a
`https://hack-a-ton-end-production.up.railway.app`. Esto mantiene REST y
WebSocket como same-origin para el navegador sin desplegar backend ni PostgreSQL
en el servicio del frontend.

`VITE_DEMO_TOKEN` debe coincidir con `DEMO_TOKEN` del backend para el handshake
WebSocket. Es un control de demo visible en el bundle, no un secreto de
producción.

### Despliegue independiente en Railway

Despliega este repositorio como un único servicio Docker. No agregues servicios
de backend o PostgreSQL al proyecto del frontend. Configura `VITE_DEMO_TOKEN`
como variable de build y, solo si se usa otro ambiente, configura `BACKEND_URL`
en runtime. Sin override, el contenedor usa el backend público de producción.

## Runtime y contratos

`src/runtime/contracts.ts` refleja manualmente los contratos Pydantic del
backend y conserva `schemaVersion = "1"`. Los JSON Schema regenerados desde el
backend viven en `src/runtime/generated/` y AJV valida cada envelope antes de
pasarlo al reducer. El frontend compila esos artefactos directamente, sin una
extensión local ni edición manual de los schemas.

El registry admite `page`, `section`, `metric`, `alert`, `timeline`, `keyValue`,
`compare`, `decisionPanel`, `step` y `map`. Un tipo desconocido o props inválidas
se aíslan con `GenericStepCard`; nunca provocan una pantalla blanca. `map`
inicializa MapLibre GL con tiles raster de OpenStreetMap, conserva atribución
visible, permite zoom/pan y representa el marker actual. Sin WebGL, sin red o
si falla la carga inicial, cambia automáticamente a un esquema SVG local.

`VITE_MAP_TILE_URL` evita fijar el proveedor en el código. El servidor público
de OSM se usa solo para la demo interactiva normal: no existe precarga ni
descarga offline de tiles. Para tráfico sostenido debe configurarse un proveedor
OSM apropiado manteniendo la atribución correspondiente.

Los endpoints y payloads que backend debe implementar para M1–M4 están fijados
en [`docs/BACKEND_INTEGRATION_V2.md`](docs/BACKEND_INTEGRATION_V2.md).
La matriz completa de alcance y dependencias frontend está en
[`docs/FRONTEND_ROADMAP_V2.md`](docs/FRONTEND_ROADMAP_V2.md).

La demo inicia `POST /runs`, avanza con `POST /demo/advance` y mantiene el canal:

```text
GET ws(s)://<VITE_API_URL>/ws/runs/{runId}?token=<VITE_DEMO_TOKEN>
```

Al reconectar obtiene `GET /runs/{id}/snapshot`; con
`VITE_RUNTIME_POLLING=true` usa polling mientras recupera el WebSocket.

## Fase 5 · fallbacks y freeze

La `UISpec` recibida desde la API se anima durante 200 ms y conserva una vista
vacía explícita antes del primer payload. Cerrar y reabrir la demo reconstruye
la UI desde el snapshot persistido; si el WebSocket cae, el runtime cambia a
polling y vuelve al canal vivo cuando la conexión se recupera.

Nginx resuelve dinámicamente `BACKEND_URL` y reenvía también los upgrades de
WebSocket. El frontend puede desplegarse por sí solo; no necesita una red
privada, contenedor o volumen del backend/PostgreSQL.

Para probar el modo determinista y local, desactiva los dos upgrades LLM en el
backend. Después de construir las imágenes una vez, el flujo no requiere una
API externa:

```env
LLM_UPGRADE_ENABLED=false
GENERIC_STEP_LLM_ENABLED=false
VITE_RUNTIME_POLLING=true
```

## Editor de workflow

`/editor` genera un `StepDefinition` genérico desde `title`, `objective`, rutas
de `inputs` y `requiresHumanReview`. La vista JSON y el diff se actualizan en
vivo. Al confirmar, el frontend crea `v(n+1)` con el flow base más el paso
generado mediante
`POST /workflows/{id}/versions`; “Run with v(n+1)” inicia un run asociado a su
`workflowVersionId` y lo abre en `/demo`.

La demo identifica versiones posteriores a v1 como trial-by-fire y permite
exportar su event log JSON directamente desde el header del runtime.

Si se entra desde un run activo, `/editor?runId=...` reutiliza su proyección
como baseline. Sin `runId`, la primera confirmación crea un run base para
identificar el workflow vigente.

El mismo formulario aparece plegado dentro de `/demo` como fallback del trial.
Ari puede proponer el `StepDefinition`; el botón del panel crea la nueva versión
y abre su run por los mismos endpoints del editor manual.

## Estructura

```text
src/
├── assistant/          chat, chips policy-safe y proposedStep
├── components/         presentación y diez primitivas, incluido MapLibre
├── config/             identidad y rutas públicas mínimas
├── editor/             formulario, DTO HTTP, diff y creación de versiones
├── history/            historia local de runs por operationId
├── inspector/          inspector vivo de UISpec
├── pages/              landing y shell del walking skeleton/golden path
├── runtime/            contratos, schemas, renderer, reducer y socket
├── test/               configuración de Vitest
├── App.tsx             selección mínima entre landing, demo y editor
└── index.css           tokens y estilos compartidos
```

## Calidad y despliegue

```bash
npm run lint
npm test
npm run build
docker compose up --build
```

Docker publica el frontend en `http://localhost:3000`, escucha el `PORT`
inyectado por la plataforma y expone `/health`. Railway usa `railway.json`; el
contenedor solo contiene Nginx y los assets estáticos, y su proxy conecta con el
backend externo configurado en `BACKEND_URL`.
