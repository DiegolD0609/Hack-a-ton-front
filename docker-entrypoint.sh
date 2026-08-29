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

# Docker Desktop/Linux compose exposes this development-only hostname through
# /etc/hosts, while a variable-based nginx proxy resolves through DNS. Convert
# only that documented local alias to its literal gateway address; Railway's
# private DNS name remains dynamic and is refreshed by nginx.
case "${BACKEND_URL}" in
  *://host.docker.internal:*)
    DOCKER_HOST_IP="$(getent hosts host.docker.internal | awk 'NR == 1 { print $1 }')"
    if [ -n "${DOCKER_HOST_IP}" ]; then
      BACKEND_URL="$(printf '%s' "${BACKEND_URL}" | sed "s|://host.docker.internal:|://${DOCKER_HOST_IP}:|")"
    fi
    ;;
esac

DNS_RESOLVER="$(awk '/^nameserver / { print $2; exit }' /etc/resolv.conf)"
DNS_RESOLVER="${DNS_RESOLVER:-127.0.0.11}"
case "${DNS_RESOLVER}" in
  *:*) DNS_RESOLVER="[${DNS_RESOLVER}]" ;;
esac

# Inject runtime values into nginx config.
sed -i "s|__BACKEND_URL__|${BACKEND_URL}|g" /etc/nginx/conf.d/default.conf
sed -i "s|__DNS_RESOLVER__|${DNS_RESOLVER}|g" /etc/nginx/conf.d/default.conf
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
