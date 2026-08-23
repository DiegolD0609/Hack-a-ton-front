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
- Estado del backend: `http://localhost:8000/ready`

Para detener sin borrar datos:

```bash
docker compose down
```

Para borrar también la base de datos local:

```bash
docker compose down -v
```

## Modos de autenticación

El frontend consume la misma API en ambos modos. El backend puede autenticar
contra la tabla principal o contra los usuarios de prueba cambiando `.env`:

```env
# Cuentas registradas normalmente
AUTH_USER_MODE=users

# Datos de prueba precargados
AUTH_USER_MODE=test_users
```

Después de cambiar el valor ejecuta `docker compose up -d`. En modo
`test_users`, los cinco correos de `/users_test/` usan la contraseña
`Hackathon123!`.

## Rutas principales

- `/landing`: presentación del producto y hero multimedia.
- `/demo`: recorrido logístico con datos precargados.
- `/login` y `/register`: autenticación por correo y contraseña conectada a la API.
- `/dashboard`: centro de operaciones protegido.
- `/settings`: preferencias locales de la cuenta demo.

## Variables de entorno

Copia `.env.example` como `.env`:

```env
VITE_API_URL=http://localhost:8000/api
```

El frontend llama a `/auth/login` y `/auth/register` bajo `VITE_API_URL`.
En el contenedor de producción el valor predeterminado es `/api`, que Nginx
envía al backend por la red privada.

## Despliegue en Railway

La topología recomendada usa tres servicios dentro del mismo proyecto:

```text
Internet -> frontend (Nginx) -> backend (FastAPI) -> Postgres
                    /api        red privada          red privada
```

1. Agrega una base administrada PostgreSQL y nómbrala `Postgres`.
2. Agrega el repositorio `Hack-a-ton-end` como servicio `backend`.
3. En `backend`, configura:

   ```env
   DATABASE_URL=${{Postgres.DATABASE_URL}}
   PORT=8000
   AUTH_USER_MODE=users
   SQL_ECHO=false
   DB_STARTUP_MAX_ATTEMPTS=15
   DB_STARTUP_RETRY_SECONDS=2
   ```

4. Agrega este repositorio como servicio `frontend` y configura:

   ```env
   VITE_API_URL=/api
   BACKEND_URL=http://${{backend.RAILWAY_PRIVATE_DOMAIN}}:${{backend.PORT}}
   ```

5. Genera un dominio público solamente para `frontend`. El backend puede
   mantenerse privado; si necesitas Swagger público, genera también un dominio
   para `backend` y abre `/docs`.

Railway detecta `railway.json`, construye ambos Dockerfiles y espera `/health`
en el frontend y `/ready` en el backend antes de activar cada despliegue. Tanto
Nginx como FastAPI escuchan el `PORT` inyectado por Railway.

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
