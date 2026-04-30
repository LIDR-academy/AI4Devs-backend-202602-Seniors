# TICKET-002 — Implementación

## Endpoint

```
PUT /candidates/:id/stage
```

Actualiza la fase actual del proceso de entrevista (`currentInterviewStep`) de la aplicación activa de un candidato.

---

## Archivos modificados

| Archivo | Cambio |
|---------|--------|
| `src/application/services/candidateService.ts` | Nueva función `updateCandidateStage` |
| `src/presentation/controllers/candidateController.ts` | Nuevo controller `updateCandidateStageController` |
| `src/routes/candidateRoutes.ts` | Nueva ruta `PUT /:id/stage` |

---

## API

### Request

```
PUT /candidates/:id/stage
Content-Type: application/json

{ "stage": <interviewStepId> }
```

| Parámetro | Tipo | Descripción |
|-----------|------|-------------|
| `:id` | number (path) | ID del candidato |
| `stage` | number (body) | ID del `InterviewStep` al que avanzar |

### Responses

| Código | Condición |
|--------|-----------|
| 200 | Actualización exitosa — devuelve la aplicación con `candidate` e `interviewStep` incluidos |
| 400 | `stage` ausente, no numérico, o no pertenece al flujo de entrevista de la posición del candidato |
| 404 | El candidato no existe o no tiene aplicación activa |
| 500 | Error interno |

### Ejemplo — 200 OK

```json
{
  "id": 3,
  "positionId": 1,
  "candidateId": 7,
  "applicationDate": "2024-01-15T00:00:00.000Z",
  "currentInterviewStep": 2,
  "notes": null,
  "candidate": { "id": 7, "firstName": "Ana", "lastName": "García", ... },
  "interviewStep": { "id": 2, "name": "Technical Interview", ... }
}
```

---

## Lógica de negocio

1. Se busca la aplicación activa del candidato (`findFirst` por `candidateId`) incluyendo la cadena `Position → InterviewFlow → InterviewSteps`.
2. Si no existe aplicación → `404`.
3. Se verifica que el `stage` enviado sea el ID de uno de los `InterviewStep` del flujo de la posición → si no → `400`.
4. Se actualiza `currentInterviewStep` y se retorna la aplicación con relaciones `candidate` e `interviewStep`.

---

## Criterios de Aceptación cubiertos

| CA | Estado |
|----|--------|
| CA-1: PUT válido → 200 + campo actualizado | ✅ |
| CA-2: stage inválido → 400 descriptivo | ✅ |
| CA-3: candidato inexistente o sin aplicación → 404 | ✅ |
