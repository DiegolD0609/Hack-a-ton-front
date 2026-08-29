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
ARG VITE_API_URL
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

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Custom nginx config with SPA fallback and API proxy
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Entrypoint script: injects runtime env vars into the app
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["nginx", "-g", "daemon off;"]
