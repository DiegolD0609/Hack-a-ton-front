# Hack-a-ton Front

A modern front-end application built with React, Vite, TypeScript, and Tailwind CSS.

## Prerequisites

- [Node.js](https://nodejs.org/) v18 or later
- npm v9 or later (comes with Node.js)

## Getting Started

Clone the repository and install dependencies:

```bash
git clone <your-repo-url>
cd hack-a-ton-front
npm install
```

Start the development server:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the development server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview the production build locally |
| `npm run lint` | Run the linter (oxlint) |

## Project Structure

```
src/
  components/   Reusable UI components
  pages/        Page-level components
  layouts/      Layout wrappers
  hooks/        Custom React hooks
  utils/        Helper functions
  services/     API calls and external services
  types/        Shared TypeScript types
```

The `@/` path alias is configured, so you can import from any folder like:

```ts
import Button from '@/components/Button'
```

## Building for Production

```bash
npm run build
```

This runs the TypeScript compiler and Vite's production bundler. Output goes to the `dist/` folder as static files (HTML, CSS, JS) ready to be served by any static hosting provider.

## Deployment

### Vercel

1. Push your code to GitHub/GitLab/Bitbucket.
2. Import the repository at [vercel.com/new](https://vercel.com/new).
3. Vercel auto-detects Vite — no extra configuration needed.
4. Click **Deploy**.

Every push to `main` will trigger a new deployment automatically.

### Netlify

1. Push your code to GitHub/GitLab/Bitbucket.
2. Go to [app.netlify.com](https://app.netlify.com/) and click **Add new site > Import an existing project**.
3. Select your repository and set:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
4. Click **Deploy site**.

### GitHub Pages

Add the base path to `vite.config.ts` if deploying to a subpath:

```ts
export default defineConfig({
  base: '/your-repo-name/',
  // ...existing config
})
```

Then use the [GitHub Pages action](https://github.com/actions/deploy-pages) or deploy manually:

```bash
npm run build
npx gh-pages -d dist
```

### Docker

```dockerfile
# Build stage
FROM node:22-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Serve stage
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Build and run:

```bash
docker build -t hack-a-ton-front .
docker run -p 8080:80 hack-a-ton-front
```

### Any Static Host

Run `npm run build` and upload the contents of `dist/` to any static file server (S3 + CloudFront, Firebase Hosting, Cloudflare Pages, etc.). For single-page app routing, configure the host to serve `index.html` for all paths.

## Environment Variables

Vite exposes environment variables prefixed with `VITE_` to client code. Create a `.env` file at the project root:

```env
VITE_API_URL=https://api.example.com
VITE_AUTH_MODE=mock
```

Access them in code via `import.meta.env.VITE_API_URL`. See the [Vite docs on env variables](https://vite.dev/guide/env-and-mode) for more details.

Set `VITE_AUTH_MODE=mock` for a backend-free presentation or `VITE_AUTH_MODE=api` to use the endpoints configured under `VITE_API_URL`.

## Demo and quality checks

- `/demo` provides a guided, preloaded flow that does not require authentication or a backend.
- `npm test` runs the route, validation, and session-storage test suite.
- `npm run lint` checks source quality.
- `npm run build` type-checks and creates the production bundle.

Every pull request and push to `main` runs these checks through GitHub Actions.

## Tech Stack

- **React 19** — UI library
- **Vite 8** — Build tool with instant HMR
- **TypeScript 6** — Static type checking
- **Tailwind CSS 4** — Utility-first styling
- **oxlint** — Fast linter

## License

MIT
