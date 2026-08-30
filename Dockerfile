# ──────────────────────────────────────────────
# Stage 1: Build
# ──────────────────────────────────────────────
FROM node:22-alpine AS build

WORKDIR /app

# Install dependencies (cached layer)
COPY package.json package-lock.json ./
RUN npm ci

# Copy source and build
COPY . .

# Vite exposes VITE_* env vars at BUILD time. Keep the browser on /api:
# nginx proxies that path to the separately deployed backend, including WS
# upgrades. This avoids a CORS/cross-origin WebSocket dependency.
ARG VITE_API_URL=/api
ARG VITE_DEMO_TOKEN
ARG VITE_RUNTIME_POLLING=false
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_DEMO_TOKEN=$VITE_DEMO_TOKEN
ENV VITE_RUNTIME_POLLING=$VITE_RUNTIME_POLLING

RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Serve
# ──────────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Remove default nginx config and keep the small Railway container to one worker.
RUN rm /etc/nginx/conf.d/default.conf \
    && sed -i 's/worker_processes  auto;/worker_processes  1;/' /etc/nginx/nginx.conf

# Custom nginx config with SPA fallback and an external API proxy.
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Entrypoint script: injects runtime env vars into the app
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- "http://127.0.0.1:${PORT:-80}/health" >/dev/null || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
