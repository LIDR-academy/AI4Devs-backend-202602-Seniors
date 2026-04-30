# Changes: PUT /candidates/:id/stage

**Ticket:** `tickets/ticket-put-candidate-stage.md`
**Estado:** Implementado

---

## Archivos creados

### `src/application/services/candidateStageService.ts`
Caso de uso `updateCandidateStage(candidateId, currentInterviewStep)`. Verifica que el candidato exista, localiza su aplicación más reciente y delega la actualización al repositorio. Devuelve un `Result` tipado para distinguir candidato no encontrado de step inválido.

### `src/__tests__/candidateStageService.test.ts`
Suite de 4 tests unitarios: candidato inexistente, candidato sin aplicaciones, happy path y FK constraint inválida.

---

## Archivos modificados

### `src/domain/models/Application.ts`
- Añadido `findLatestByCandidateId(candidateId)`: retorna el `id` de la aplicación más reciente del candidato.
- Añadido `updateInterviewStep(applicationId, currentInterviewStep)`: actualiza el campo `currentInterviewStep` vía Prisma.

### `src/presentation/controllers/candidateController.ts`
- Añadido `updateCandidateStageController`: parsea `:id` y `currentInterviewStep` del body, delega al service y traduce el `Result` a respuestas HTTP.

### `src/routes/candidateRoutes.ts`
- Añadida ruta `PUT /:id/stage`.

### `jest.config.js`
- Añadido `testPathIgnorePatterns: ['/dist/']` para evitar que Jest ejecute los archivos JS compilados.

---

## Patrones aplicados

| Patrón | Motivo |
|---|---|
| **Repository** | `Application.findLatestByCandidateId` y `updateInterviewStep` encapsulan las queries Prisma |
| **Result / Either** | Reutiliza el tipo ya definido para distinguir `CANDIDATE_NOT_FOUND` e `INVALID_INTERVIEW_STEP` sin excepciones |

## Patrones descartados

| Patrón | Motivo |
|---|---|
| Factory | Sin construcción compleja de entidades |
| Strategy | Un único flujo de actualización |
| Observer | Sin eventos de dominio |
| Decorator | Sin necesidades transversales |
| Unit of Work | Una sola operación de escritura, sin transacción |
| CQRS | Mismo modelo para lectura y escritura a esta escala |
| Saga | Sin pasos compensables |

---

## Tests

```
npm test

PASS src/__tests__/candidateStageService.test.ts
  updateCandidateStage
    √ returns CANDIDATE_NOT_FOUND when the candidate does not exist
    √ returns CANDIDATE_NOT_FOUND when the candidate has no applications
    √ returns the updated application on success
    √ returns INVALID_INTERVIEW_STEP when Prisma raises a FK constraint error

Tests: 4 passed, 4 total
```

---

## Cómo testear el endpoint

El servidor corre en `http://localhost:3010`. Asegurarse de tenerlo levantado con `npm run dev`.

### Caso 1 — Actualización exitosa (happy path)
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d '{ "currentInterviewStep": 2 }'
```
**Respuesta esperada (200):**
```json
{
  "id": 1,
  "candidateId": 1,
  "positionId": 1,
  "currentInterviewStep": 2,
  "applicationDate": "2024-01-15T00:00:00.000Z",
  "notes": null
}
```

### Caso 2 — Candidato no encontrado (404)
```bash
curl -X PUT http://localhost:3010/candidates/9999/stage \
  -H "Content-Type: application/json" \
  -d '{ "currentInterviewStep": 2 }'
```
**Respuesta esperada (404):**
```json
{ "message": "Candidate not found" }
```

### Caso 3 — Cuerpo de petición inválido (400)
```bash
curl -X PUT http://localhost:3010/candidates/1/stage \
  -H "Content-Type: application/json" \
  -d '{}'
```
**Respuesta esperada (400):**
```json
{ "message": "currentInterviewStep is required" }
```

### Caso 4 — ID inválido (400)
```bash
curl -X PUT http://localhost:3010/candidates/abc/stage \
  -H "Content-Type: application/json" \
  -d '{ "currentInterviewStep": 2 }'
```
**Respuesta esperada (400):**
```json
{ "message": "Invalid candidate ID" }
```
