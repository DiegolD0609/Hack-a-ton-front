# Kernel Panic Logistics

Prototipo web para coordinar envíos, visualizar el estado de una operación logística y demostrar un flujo completo sin depender del backend.

## Inicio rápido

Requisitos: Node.js 22 y npm 10 o posteriores.

```bash
npm ci
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Rutas principales

- `/landing`: presentación del producto y hero multimedia.
- `/demo`: recorrido logístico con datos precargados.
- `/login` y `/register`: autenticación mock o conectada a API.
- `/dashboard`: centro de operaciones protegido.
- `/settings`: preferencias locales de la cuenta demo.

## Variables de entorno

Copia `.env.example` como `.env`:

```env
VITE_API_URL=http://127.0.0.1:8000
VITE_DEMO_TOKEN=replace-with-a-shared-demo-token
```

En desarrollo local, `VITE_API_URL` apunta directamente a FastAPI. El build de
Docker usa `http://localhost:8000/api`, que Nginx proxifica al backend configurado
en `BACKEND_URL`.

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
├── components/       UI compartida
├── config/           Marca, rutas y escenario demo
├── features/auth/    Servicios, persistencia y validación
├── hooks/            Contextos y hooks de React
├── layouts/          Estructuras de navegación
├── middleware/       Router y guards
├── pages/            Pantallas de la aplicación
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
