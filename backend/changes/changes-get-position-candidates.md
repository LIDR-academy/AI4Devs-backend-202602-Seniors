# Changes: GET /positions/:id/candidates

**Ticket:** `tickets/ticket-get-position-candidates.md`
**Estado:** Implementado

---

## Archivos creados

### `src/domain/types/Result.ts`
Tipo genérico `Result<T, E>` (patrón Either) para representar operaciones que pueden fallar de forma controlada, evitando el uso de excepciones como flujo de control.

### `src/application/services/positionService.ts`
Caso de uso `getCandidatesForPosition(positionId)`. Orquesta la consulta al repositorio y transforma los datos crudos al DTO `CandidateSummary` (`fullName`, `currentInterviewStep`, `averageScore`).

### `src/presentation/controllers/positionController.ts`
Controlador HTTP `getCandidates`. Parsea el parámetro `:id`, delega al servicio y traduce el `Result` a respuestas HTTP (200 / 400 / 404).

### `src/routes/positionRoutes.ts`
Registro de la ruta `GET /:id/candidates` sobre el router de posiciones.

### `src/__tests__/positionService.test.ts`
Suite de tests unitarios para `positionService` (5 casos): posición no encontrada, posición sin candidatos, cálculo correcto de `averageScore`, candidato sin entrevistas y scores nulos ignorados en el promedio.

---

## Archivos modificados

### `src/domain/models/Application.ts`
- Añadido método estático `findByPositionId(positionId)`: verifica si la posición existe y retorna las aplicaciones con sus relaciones (`candidate`, `interviewStep`, `interviews`).
- Añadida interfaz exportada `ApplicationWithDetails` para tipar el resultado de la query con includes.

### `src/index.ts`
- Importado `positionRoutes`.
- Registrada la ruta base `/positions`.

---

## Patrones aplicados

| Patrón | Motivo |
|---|---|
| **Repository** | `Application.findByPositionId` encapsula toda la query Prisma; servicios y controladores no acceden a Prisma directamente |
| **Result / Either** | Distingue sin excepciones entre posición inexistente (→ 404) y posición sin candidatos (→ 200 `[]`) |

## Patrones descartados

| Patrón | Motivo |
|---|---|
| Factory | Construcción de DTO trivial mediante `map` |
| Strategy | Un único algoritmo de cálculo de media |
| Observer | Sin eventos de dominio |
| Decorator | Sin necesidades transversales en este endpoint |
| Unit of Work | Operación de solo lectura |
| CQRS | Modelos de lectura y escritura idénticos a esta escala |
| Saga | Sin pasos compensables ni servicios externos |

---

## Cómo testear el endpoint

El servidor corre en `http://localhost:3010`. Asegurarse de tenerlo levantado con `npm run dev`.

### Caso 1 — Posición con candidatos (happy path)
`position 1` tiene 3 candidatos en el seed: John Doe, Jane Smith y Carlos García.
```bash
curl -X GET http://localhost:3010/positions/1/candidates
```
**Respuesta esperada (200):**
```json
[
  { "fullName": "John Doe",     "currentInterviewStep": "Technical Interview", "averageScore": 5 },
  { "fullName": "Jane Smith",   "currentInterviewStep": "Technical Interview", "averageScore": 4 },
  { "fullName": "Carlos García","currentInterviewStep": "Initial Screening",   "averageScore": null }
]
```

### Caso 2 — Posición sin candidatos
El seed no incluye ninguna posición vacía. Para probar este escenario, crear una posición sin aplicaciones desde Prisma Studio (`npx prisma studio`) y usar su ID:
```bash
curl -X GET http://localhost:3010/positions/<id-posicion-vacia>/candidates
```
**Respuesta esperada (200):**
```json
[]
```

### Caso 3 — Posición inexistente (404)
```bash
curl -X GET http://localhost:3010/positions/9999/candidates
```
**Respuesta esperada (404):**
```json
{ "message": "Position not found" }
```

### Caso 4 — ID inválido (400)
```bash
curl -X GET http://localhost:3010/positions/abc/candidates
```
**Respuesta esperada (400):**
```json
{ "message": "Invalid position ID" }
```

---

## Tests unitarios

```
npm test

PASS src/__tests__/positionService.test.ts
  getCandidatesForPosition
    √ returns POSITION_NOT_FOUND when the position does not exist
    √ returns an empty array when the position exists but has no candidates
    √ maps fullName, currentInterviewStep and averageScore correctly
    √ returns null averageScore when candidate has no interviews
    √ ignores null scores when calculating the average

Tests: 5 passed, 5 total
```
