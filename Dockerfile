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

# Vite exposes VITE_* env vars at BUILD time.
# Pass them with --build-arg or a .env file:
#   docker build --build-arg VITE_API_URL=https://api.example.com .
ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

RUN npm run build

# ──────────────────────────────────────────────
# Stage 2: Serve
# ──────────────────────────────────────────────
FROM nginx:stable-alpine AS production

# Remove the default virtual host and avoid spawning one worker per host CPU.
# Railway containers can see dozens of host CPUs even when the service has a
# small resource limit, so a single Nginx worker is more predictable here.
RUN rm /etc/nginx/conf.d/default.conf \
    && sed -i 's/worker_processes  auto;/worker_processes  1;/' /etc/nginx/nginx.conf

# Custom nginx config with SPA fallback and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Entrypoint script: injects runtime env vars into the app
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -q -O /dev/null "http://127.0.0.1:${PORT:-80}/health" || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
