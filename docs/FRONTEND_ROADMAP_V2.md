# Auditoría y ejecución frontend · roadmap v2

Fuente de alcance: roadmap v2 “Muebles del Sur / Ari” y requisitos oficiales
del Challenge 03. El criterio rector sigue siendo que la UI nace de `UISpec` y
no de pantallas logísticas hardcodeadas.

## Estado de cada responsabilidad frontend

| Roadmap | Resultado frontend | Dependencia de backend | Estado |
|---|---|---|---|
| A.1 | Tipo `map`, registry, AJV e invariantes `fromId`/`toId` | Pydantic y schemas ya presentes en backend `dev` | Completo |
| A.2 | `AssistRequest/AssistResponse` con `schemaVersion` y `runId` | `POST /runs/{id}/assist` presente en backend `dev` | Completo en frontend |
| B.4 | MapLibre GL + OSM, antimeridiano, marker, zoom/pan y fallback SVG | Composer emite datos por forma | Completo |
| B.5 | Historia por `operationId`, reabrible y persistente tras refresh | M1–M3 comparten `operationId` | Completo |
| C.3 | Hilo de Ari + chips filtrados contra `availableActions` | Assist endpoint + policy | Completo |
| C.4 | `proposedStep` → crear v(n+1) → iniciar run | Structured output de Ari | Completo |
| C.5 | Editor existente, ahora plegado en `/demo` como plan B | Endpoints v(n+1) existentes | Completo |
| 5.2 | Query `runId`, snapshot y localStorage de historia | Snapshot conserva `operationId` | Completo |
| 5.3 | Transición UISpec 200 ms + marker animado y reduced motion | Ninguna | Completo |
| 5.5 | No existe Dashboard ni navegación hacia una pantalla fija | Ninguna | Ya resuelto |

## Decisiones de implementación

- El mapa es una primitiva genérica: recibe puntos, segmentos y marker. MapLibre
  dibuja la base OSM y el marker actual; el contrato no depende del dominio.
- Las rutas transpacíficas se dividen visualmente en el antimeridiano para no
  dibujar el trayecto largo por el centro del mapa.
- La historia no inventa un endpoint de listado: conserva los runs que el
  navegador observó y los reconstruye por snapshot. Esto cubre la demo y deja
  un listado server-side como mejora posterior.
- Ari no tiene una vía privilegiada. Sus chips llaman el mismo
  `runtime.submitAction` que `decisionPanel`; por tanto conservan policy,
  idempotencia y protección contra `stateVersion` stale.
- Los schemas generados actuales ya contienen `MapProps`, `operationId` y
  `fromId`/`toId`; AJV los consume directamente y se retiró el puente temporal.
- `VITE_ASSISTANT_ENABLED=false` oculta Ari y deja intactos renderer, editor,
  historia, WebSocket y polling.

## Límites de esta entrega frontend

El código backend se revisó únicamente para alinear contratos y no fue
modificado. Queda como verificación conjunta levantar ambos servicios y recorrer
M1→M4 con el event log real; el frontend ya valida los payloads y rechaza una
respuesta de Ari cuyo `schemaVersion` o `runId` no corresponda al run visible.

El contrato y los casos de aceptación para esos cinco puntos están en
`BACKEND_INTEGRATION_V2.md`.

## Fallbacks que quedan disponibles

- Sin asistente: panel oculto y editor manual en la misma demo.
- Sin mapa en la `UISpec`: `timeline` + `keyValue` siguen en el registry.
- Mapa inválido: error boundary por nodo; no hay pantalla blanca.
- Sin WebSocket: snapshot + polling ya existentes.
- Sin WebGL o red externa: mapa SVG local; no se descargan tiles para offline.

## Gate frontend listo para integración

La parte frontend de GR1/GR2 queda lista cuando lint, 27 pruebas y build pasan.
El gate completo solo se puede declarar cuando backend entregue los endpoints
y payloads del handoff y se observe M1→M4 en un smoke real.
