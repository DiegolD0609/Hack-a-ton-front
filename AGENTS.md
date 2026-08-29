# Kernel Panic frontend · instrucciones para agentes

Este archivo aplica a todo `Hack-a-ton-front`. La fuente compartida del
roadmap, contratos y decisiones es `KernelPanic04/Hack-a-ton-documentation`.
Ante contradicciones: instrucción explícita más reciente del usuario →
`Hack-a-ton-documentation/AGENTS.md` y `DECISION_LOG.md` → este archivo → estado
verificado del repositorio.

## Política de ramas obligatoria

`dev` es la única rama base para trabajo ordinario del frontend. Antes de
modificar archivos:

1. Ejecuta `git fetch origin --prune`.
2. Haz checkout de `dev` con `git switch dev`.
3. Actualiza solo mediante fast-forward: `git pull --ff-only origin dev`.
4. Comprueba el estado y preserva cualquier trabajo local o ajeno.
5. Crea una rama nueva y enfocada desde `dev` antes del primer cambio, por
   ejemplo `git switch -c feat/renderer-fallback`.

Nunca implementes ni crees commits de producto directamente en `dev` o `main`.
Publica la rama de trabajo y, después de los checks, intégrala mediante PR o
merge hacia `dev`. Haz otro `fetch` justo antes de integrar o publicar. Nunca
uses push forzado para resolver divergencias.

La promoción de `dev` a `main` ocurre únicamente en los gates del roadmap o por
instrucción explícita de Lane D. La documentación es la excepción y se modifica
directamente en `Hack-a-ton-documentation/main`.

## Alcance frontend

- Lane B es responsable del renderer, registry, reducer/socket, los nueve
  componentes, design tokens, inspector y editor.
- `src/runtime/contracts.ts` es el espejo manual del contrato Pydantic del
  backend. No lo cambies unilateralmente: actualiza backend, frontend,
  documentación y pruebas en el mismo cambio aprobado.
- Una `UISpec` inválida nunca debe producir pantalla blanca; aísla errores por
  nodo y conserva `GenericStepCard` como fallback.
- No commitees `.env`, secretos, `node_modules`, `dist`, caches ni artefactos
  generados.

## Verificación y handoff

Antes del handoff ejecuta checks proporcionales; para cambios normales:

```bash
npm run lint
npm test
npm run build
```

El handoff indica rama base, rama de trabajo, commit, archivos cambiados,
resultado de checks, merge objetivo (`dev`), pasos manuales y limitaciones.
