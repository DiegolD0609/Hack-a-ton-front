#!/bin/sh
set -e

# ──────────────────────────────────────────────
# Runtime environment variable injection
# ──────────────────────────────────────────────
# 1) BACKEND_URL — the address of your backend API.
#    Default: http://localhost:8000
#    Usage:  docker run -e BACKEND_URL=http://backend:8000 ...
#
# 2) VITE_* vars baked at build time are already in the JS bundle.
#    For runtime overrides, this script generates a small config
#    file the app can read from window.__ENV__.

BACKEND_URL="${BACKEND_URL:-http://localhost:8000}"
PORT="${PORT:-80}"

# Inject runtime values into nginx config.
sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf
sed -i "s|__PORT__|${PORT}|g" /etc/nginx/conf.d/default.conf

# Generate runtime env config (accessible via /env-config.js)
cat <<EOF > /usr/share/nginx/html/env-config.js
window.__ENV__ = {
  BACKEND_URL: "${BACKEND_URL}",
};
EOF

echo "======================================"
echo " Frontend ready"
echo " Listening on ${PORT}"
echo " Backend proxy -> ${BACKEND_URL}"
echo "======================================"

# Hand off to nginx
exec "$@"
