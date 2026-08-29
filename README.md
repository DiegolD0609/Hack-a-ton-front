# Kernel Panic · Agent UI Runtime

Frontend React/Vite del runtime seguro de Kernel Panic. Recibe una `UISpec`
declarativa, la valida y la convierte en una interfaz viva; una intervención
humana vuelve al agente como un `ActionEvent` tipado.

## Alcance

El repositorio contiene únicamente la superficie definida por el roadmap:

- renderer recursivo y fallback por nodo;
- registry congelado de nueve componentes;
- reducer, WebSocket, reconexión por snapshot y fallback de polling;
- inspector de `UISpec` con `generatedBy`, `reason` y `stateVersion`;
- editor de workflow que genera pasos, muestra el diff y ejecuta `v(n+1)`;
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
BACKEND_URL=http://localhost:8000
```

Vite y Nginx envían `/api/*` a `BACKEND_URL` y eliminan el prefijo `/api`.
`VITE_DEMO_TOKEN` debe coincidir con `DEMO_TOKEN` del backend para el handshake
WebSocket. Es un control de demo visible en el bundle, no un secreto de
producción.

## Runtime y contratos

`src/runtime/contracts.ts` refleja manualmente los contratos Pydantic del
backend y conserva `schemaVersion = "1"`. Los JSON Schema generados viven en
`src/runtime/generated/` y AJV valida cada envelope antes de pasarlo al reducer.
Estos artefactos no se editan de forma unilateral.

El registry admite exactamente `page`, `section`, `metric`, `alert`,
`timeline`, `keyValue`, `compare`, `decisionPanel` y `step`. Un tipo desconocido
o props inválidas se aíslan con `GenericStepCard`; nunca provocan una pantalla
blanca.

La demo inicia `POST /runs`, avanza con `POST /demo/advance` y mantiene el canal:

```text
GET ws(s)://<VITE_API_URL>/ws/runs/{runId}?token=<VITE_DEMO_TOKEN>
```

Al reconectar obtiene `GET /runs/{id}/snapshot`; con
`VITE_RUNTIME_POLLING=true` usa polling mientras recupera el WebSocket.

## Editor de workflow

`/editor` genera un `StepDefinition` genérico desde `title`, `objective`, rutas
de `inputs` y `requiresHumanReview`. La vista JSON y el diff se actualizan en
vivo. Al confirmar, el frontend crea `v(n+1)` con
`POST /workflows/{id}/versions`; “Run with v(n+1)” inicia un run asociado a su
`workflowVersionId` y lo abre en `/demo`.

Si se entra desde un run activo, `/editor?runId=...` reutiliza su proyección
como baseline. Sin `runId`, la primera confirmación crea un run base para
identificar el workflow vigente.

## Estructura

```text
src/
├── components/         presentación y nueve primitivas del registry
├── config/             identidad y rutas públicas mínimas
├── editor/             formulario, DTO HTTP, diff y creación de versiones
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
inyectado por la plataforma y expone `/health`. Railway usa `railway.json` y el
proxy Nginx para alcanzar el backend por su red privada.
