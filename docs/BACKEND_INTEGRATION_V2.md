# Contrato backend observado · frontend roadmap v2

Este documento registra la interfaz que el frontend consume para M1–M4. Se
contrastó de forma read-only con el backend en `dev`; esta entrega no modifica
ese repositorio.

## 1. Estado observado en backend `dev`

1. `map` ya forma parte de Pydantic y de ambos JSON Schema generados.
2. `RunProjection.operationId` y los tres momentos de demo ya están expuestos.
3. `POST /demo/moment/{n}` para `n = 1..3` ya existe.
4. `POST /runs/{id}/assist` y su contrato versionado ya existen.
5. El frontend retiró `schemaExtensions.ts`, espejó los nombres definitivos y
   conserva validación defensiva en el borde HTTP/WS.
6. El smoke conjunto M1→M4 sigue siendo una verificación de integración, no un
   cambio pendiente de frontend.

## 2. Adenda `UISpec` v1.1

`schemaVersion` permanece en `"1"`. Solo se amplía el registry con `map`; el
envelope WebSocket no cambia.

```json
{
  "id": "ui_route_map",
  "type": "map",
  "props": {
    "title": "Ruta operativa",
    "waypoints": [
      { "id": "origin", "label": "Cái Mép", "lat": 10.52, "lon": 107.0, "kind": "origin" },
      { "id": "stop", "label": "Busan", "lat": 35.1, "lon": 129.04, "kind": "stop" },
      { "id": "destination", "label": "Manzanillo", "lat": 19.05, "lon": -104.32, "kind": "destination" }
    ],
    "marker": { "lat": 18.0, "lon": 135.0, "label": "Posición actual" },
    "segments": [
      { "fromId": "origin", "toId": "stop", "status": "active" },
      { "fromId": "stop", "toId": "destination", "status": "diverted" }
    ],
    "emphasis": "warning"
  }
}
```

Reglas que el front ya valida:

- `waypoints`: al menos 2 elementos, IDs únicos, latitud `[-90, 90]`, longitud
  `[-180, 180]` y `kind = origin | stop | destination`;
- `segments`: al menos un elemento; `fromId` y `toId` deben apuntar a waypoints
  reales y ser distintos;
- `status = planned | active | diverted`;
- `title` y `marker` son opcionales/null; `marker.label` también puede omitirse;
- `emphasis = normal | warning | critical`;
- `map` no acepta `children`.

El composer debe emitirlo por forma de datos (waypoints/coordenadas), nunca por
strings de dominio. El LLM puede reordenarlo, pero no eliminarlo si la
determinista ya mostró una ruta.

## 3. Multi-run de M1–M3

### Proyección

Cada run nuevo debe incluir el mismo `operationId` y un `runId` distinto:

```json
{
  "runId": "run_...",
  "operationId": "op_muebles_del_sur_bk_4471",
  "workflowId": "wf_...",
  "workflowVersion": 1,
  "stateVersion": 4,
  "status": "running",
  "operation": {}
}
```

El front admite temporalmente `operation.operationId`, `operation.operation_id`
u `operation.id`, pero el contrato recomendado es el campo superior
`operationId`.

### Endpoint

```text
POST /demo/moment/1  -> 201 RunProjection de booking confirmado
POST /demo/moment/2  -> 201 RunProjection de salida, misma operationId
POST /demo/moment/3  -> 201 RunProjection pausada, misma operationId
```

Cada endpoint crea un run nuevo y lo auto-avanza al momento indicado. Después,
la ruta normal continúa por snapshot/WS. M3 debe publicar tres
`availableActions` y el `decisionPanel` debe usar exactamente esos IDs:

```text
act_accept_delay       label: Esperar
act_find_alternative   label: Buscar alternativa
act_notify_client      label: Notificar al cliente final
```

El historial del front persiste los runs observados en `localStorage` y los
reabre por snapshot. No necesita un endpoint de listado para la demo; un
`GET /operations/{operationId}/runs` posterior sería una mejora, no un bloqueo.

## 4. Contrato del asistente Ari

La key del proveedor nunca llega al navegador. El frontend solo llama:

```text
POST /runs/{runId}/assist
Content-Type: application/json
```

Request:

```json
{
  "schemaVersion": "1",
  "message": "¿Qué opción recomiendas?",
  "history": [
    { "role": "assistant", "content": "..." },
    { "role": "user", "content": "..." }
  ]
}
```

Response:

```json
{
  "schemaVersion": "1",
  "runId": "run_...",
  "reply": "Recomiendo notificar porque...",
  "recommendedActions": [
    { "actionId": "act_notify_client", "rationale": "Riesgo bajo y decisión reversible." }
  ],
  "proposedStep": {
    "id": "step_validate_runtime_input",
    "type": "generic.runtime",
    "title": "Validar documento contra operación",
    "objective": "Comparar los inputs declarados sin inventar datos.",
    "inputs": ["source.data.reference", "target.data.reference"],
    "requiresHumanReview": true
  }
}
```

`proposedStep` puede ser `null`. `recommendedActions` siempre existe aunque esté
vacío. El frontend exige que `runId` coincida con el run consultado y que
`schemaVersion` sea `"1"`. El backend construye su enum/lista permitida desde
`RunProjection.availableActions`; no basta con pedírselo al modelo en texto.

El front vuelve a filtrar recomendaciones contra la proyección visible. El chip
no invoca un endpoint alterno: llama `runtime.submitAction`, que emite el mismo
`ACTION_SUBMITTED` tipado y atraviesa policy/idempotencia/stateVersion. Para el
trial, “Crear v(n+1) y correr” reutiliza los endpoints ya existentes:

```text
POST /workflows/{workflowId}/versions
POST /runs  { "workflowVersionId": "wfv_..." }
```

Errores esperados:

- `404` o `503`: asistente deshabilitado; el front muestra el fallback y el
  runtime determinista continúa;
- timeout/5xx: mensaje recuperable dentro del panel, sin perder la UISpec;
- actionId o StepDefinition fuera de contrato: el front rechaza la respuesta.

## 5. Criterios de aceptación backend → frontend

| Caso | Evidencia visible |
|---|---|
| M1 | Run 1 en historia; `map` + card/containers nacen por `UI_UPDATED` |
| M2 | Run 2 con misma `operationId`; marker y estados cambian |
| M3 | Run 3; segmento `diverted`, alerta y tres acciones |
| Chip Ari | `ACTION_SUBMITTED` real; accepted/rejected visible |
| M4 por Ari | `proposedStep` → v(n+1) → run nuevo → nodo `step/compare` |
| Fallback | `VITE_ASSISTANT_ENABLED=false`; mapa/historia/runtime siguen |
| Reconexión | refresh con `?runId=...`; snapshot restaura UISpec e historia |

## 6. Checklist antes del merge conjunto

- Pydantic, TypeScript y JSON Schema contienen el mismo nodo `map`.
- JSON Schema se consume tal como fue regenerado desde backend; no se edita a mano.
- `grep -i "booking\|vessel\|bol\|muebles\|ari" app/synthesis/ src/runtime/`
  queda vacío.
- El asistente no puede recomendar un actionId ajeno a policy.
- Los tres momentos crean runs, no mutan uno solo.
- Backend tests + frontend `npm run lint && npm test && npm run build` pasan.
