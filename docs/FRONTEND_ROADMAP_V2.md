# Auditoría y ejecución frontend · roadmap v2

Fuente de alcance: roadmap v2 “Muebles del Sur / Ari” y requisitos oficiales
del Challenge 03. El criterio rector sigue siendo que la UI nace de `UISpec` y
no de pantallas logísticas hardcodeadas.

## Estado de cada responsabilidad frontend

| Roadmap | Resultado frontend | Dependencia de backend | Estado |
|---|---|---|---|
| A.1 | Tipo `map`, registry, validación AJV e invariantes por referencia | Pydantic equivalente + schemas regenerados | Preparado |
| A.2 | DTO `AssistRequest/AssistResponse` fuera del WS | `POST /runs/{id}/assist` | Preparado |
| B.4 | `RouteMap` SVG offline, antimeridiano, marker y énfasis | Composer emite datos por forma | Completo |
| B.5 | Historia por `operationId`, reabrible y persistente tras refresh | M1–M3 comparten `operationId` | Completo |
| C.3 | Hilo de Ari + chips filtrados contra `availableActions` | Assist endpoint + policy | Completo |
| C.4 | `proposedStep` → crear v(n+1) → iniciar run | Structured output de Ari | Completo |
| C.5 | Editor existente, ahora plegado en `/demo` como plan B | Endpoints v(n+1) existentes | Completo |
| 5.2 | Query `runId`, snapshot y localStorage de historia | Snapshot conserva `operationId` | Completo |
| 5.3 | Transición UISpec 200 ms + marker animado y reduced motion | Ninguna | Completo |
| 5.5 | No existe Dashboard ni navegación hacia una pantalla fija | Ninguna | Ya resuelto |

## Decisiones de implementación

- El mapa es una primitiva genérica: recibe puntos, segmentos y marker; no sabe
  de buques, bookings ni documentos.
- Las rutas transpacíficas se dividen visualmente en el antimeridiano para no
  dibujar el trayecto largo por el centro del mapa.
- La historia no inventa un endpoint de listado: conserva los runs que el
  navegador observó y los reconstruye por snapshot. Esto cubre la demo y deja
  un listado server-side como mejora posterior.
- Ari no tiene una vía privilegiada. Sus chips llaman el mismo
  `runtime.submitAction` que `decisionPanel`; por tanto conservan policy,
  idempotencia y protección contra `stateVersion` stale.
- Los schemas generados no se tocaron. `schemaExtensions.ts` es un puente
  explícito mientras backend implementa la adenda; debe retirarse cuando los
  JSON Schema v1.1 lleguen desde Pydantic.
- `VITE_ASSISTANT_ENABLED=false` oculta Ari y deja intactos renderer, editor,
  historia, WebSocket y polling.

## Lo que no puede cerrarse solo desde frontend

1. Datos M1–M3 con coordenadas y `operationId` compartido.
2. `act_notify_client` y su outcome dentro del policy engine.
3. Composición determinista/LLM que incluya `map` sin strings de dominio.
4. Respuestas reales y acotadas de `/assist`.
5. Prueba end-to-end de los cuatro momentos con event log backend.

El contrato y los casos de aceptación para esos cinco puntos están en
`BACKEND_INTEGRATION_V2.md`.

## Fallbacks que quedan disponibles

- Sin asistente: panel oculto y editor manual en la misma demo.
- Sin mapa en la `UISpec`: `timeline` + `keyValue` siguen en el registry.
- Mapa inválido: error boundary por nodo; no hay pantalla blanca.
- Sin WebSocket: snapshot + polling ya existentes.
- Sin red externa: fuentes empaquetadas y mapa SVG local.

## Gate frontend listo para integración

La parte frontend de GR1/GR2 queda lista cuando lint, 26 pruebas y build pasan.
El gate completo solo se puede declarar cuando backend entregue los endpoints
y payloads del handoff y se observe M1→M4 en un smoke real.
