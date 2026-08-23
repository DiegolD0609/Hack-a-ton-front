# Kernel Panic Logistics

Prototipo web para coordinar envíos, visualizar el estado de una operación logística y demostrar un flujo completo sin depender del backend.

## Inicio rápido

Requisitos: Node.js 22 y npm 10 o posteriores.

```bash
npm ci
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

## Entorno integrado para el hackathon

Clona frontend y backend como carpetas hermanas:

```text
hackaton-kernel-panic/
├── Hack-a-ton-end/
└── Hack-a-ton-front/
```

Con Docker instalado, todo el stack se levanta desde `Hack-a-ton-front`:

```bash
cp .env.example .env
docker compose up --build
```

Esto inicia PostgreSQL, FastAPI y Vite, espera sus healthchecks y habilita
recarga automática en ambos proyectos. No necesitas instalar Python, Node.js
ni PostgreSQL en el host.

- Frontend: `http://localhost:5173`
- API y Swagger: `http://localhost:8000/docs`
- Estado del backend: `http://localhost:8000/health`

Para detener sin borrar datos:

```bash
docker compose down
```

Para borrar también la base de datos local:

```bash
docker compose down -v
```

## Rutas principales

- `/landing`: presentación del producto y hero multimedia.
- `/demo`: recorrido logístico con datos precargados.
- `/login` y `/register`: autenticación mock o conectada a API.
- `/dashboard`: centro de operaciones protegido.
- `/settings`: preferencias locales de la cuenta demo.

## Variables de entorno

Copia `.env.example` como `.env`:

```env
VITE_API_URL=http://localhost:8000/api
VITE_AUTH_MODE=mock
```

`VITE_AUTH_MODE=mock` permite presentar sin backend. Usa `api` para llamar a `/auth/login` y `/auth/register` bajo `VITE_API_URL`.

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
docker compose up --build
```

Antes de una presentación ejecuta:

```bash
npm run lint
npm test
npm run build
```
