#!/bin/sh
set -e

# ──────────────────────────────────────────────
# Runtime environment variable injection
# ──────────────────────────────────────────────
# BACKEND_URL — the address of the independently deployed backend API.
# Default: the production Railway service. Override it for staging or local
# development, for example: docker run -e BACKEND_URL=http://host.docker.internal:8000 ...

BACKEND_URL="${BACKEND_URL:-https://hack-a-ton-end-production.up.railway.app}"
PORT="${PORT:-80}"

# Docker Desktop's local backend alias must become an address before Nginx
# resolves a variable-based upstream. This is a development override only;
# the Railway default above remains the independently deployed backend.
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

echo "======================================"
echo " Frontend ready"
echo " Listening on ${PORT}"
echo " External backend proxy -> ${BACKEND_URL}"
echo "======================================"

# Hand off to nginx
exec "$@"
