# TICKET-001 — Exponer candidatos en proceso con fase actual y puntuación media

**Fecha de implementación:** 2026-04-30  
**Endpoint:** `GET /positions/:id/candidates`  
**Estado:** Implementado ✅

---

## Resumen

Endpoint de lectura que, dado un `positionId`, devuelve todos los candidatos en proceso para esa posición con su nombre completo, la fase de entrevista actual y la puntuación media acumulada.

---

## Archivos generados

### Nuevos

| Archivo | Descripción |
|---|---|
| `src/application/services/positionService.ts` | Use case: consulta candidatos con fase y score medio |
| `src/presentation/controllers/positionController.ts` | Controller HTTP que mapea errores a códigos de estado |
| `src/routes/positionRoutes.ts` | Definición de la ruta `GET /:id/candidates` |
| `src/application/services/positionService.test.ts` | Suite de tests unitarios con Jest |

### Modificados

| Archivo | Cambio |
|---|---|
| `src/index.ts` | Importa y registra `positionRoutes` bajo el prefijo `/positions` |

---

## Arquitectura y decisiones de diseño

El código sigue el mismo patrón de 3 capas presente en el resto del proyecto:

```
Request
  └─► positionRoutes           (src/routes/)
        └─► positionController  (src/presentation/controllers/)
              └─► positionService (src/application/services/)
                    ├─► Position.findOne()   (domain model → Prisma)
                    └─► prisma.application.findMany() (Prisma con includes)
```

**Decisiones relevantes:**

- `Position.findOne()` se reutiliza del modelo de dominio existente para verificar si la posición existe, evitando duplicar lógica de acceso a datos.
- La query principal usa un único `findMany` con `include: { candidate, interviewStep, interviews }`, minimizando round-trips a la base de datos.
- La lógica de `averageScore` vive en la capa de servicio (no en el controlador ni en el modelo), ya que es lógica de negocio.
- El cálculo excluye scores `null` antes de promediar, siguiendo el criterio CA-2 del ticket.

---

## API

### Request

```
GET /positions/:id/candidates
```

| Parámetro | Tipo | Descripción |
|---|---|---|
| `id` | `number` (path) | ID de la posición |

### Response 200 — posición con aplicaciones

```json
[
  {
    "fullName": "John Doe",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 4.50
  },
  {
    "fullName": "Jane Smith",
    "currentInterviewStep": "HR Interview",
    "averageScore": null
  }
]
```

### Response 200 — posición sin aplicaciones

```json
[]
```

### Response 400 — ID inválido

```json
{ "error": "Invalid ID format" }
```

### Response 404 — posición inexistente

```json
{ "error": "Position not found" }
```

### Response 500 — error inesperado

```json
{ "error": "Internal Server Error" }
```

---

## Lógica de negocio

### `averageScore`

```
scores con valor != null → media aritmética redondeada a 2 decimales
scores todos null o sin entrevistas → null
```

**Ejemplo:** entrevistas con scores `[4, null, 6]` → `(4 + 6) / 2 = 5.00`  
**Ejemplo:** entrevistas con scores `[1, 1, 2]` → `4 / 3 = 1.33`

### Relaciones Prisma usadas

```
application
  ├── candidate         → firstName, lastName
  ├── interviewStep     → name (fase actual)
  └── interviews[]      → score (nullable)
```

---

## Tests

**Archivo:** `src/application/services/positionService.test.ts`  
**Framework:** Jest + ts-jest  
**Estrategia:** Unitarios — mocks de `PrismaClient` y `Position.findOne`

### Cobertura por criterio de aceptación

| Test | Criterio |
|---|---|
| Devuelve `fullName`, `currentInterviewStep` y `averageScore` correctos | CA-1 |
| Devuelve múltiples candidatos cuando hay varias aplicaciones | CA-1 |
| Calcula media aritmética redondeada a 2 decimales | CA-2 |
| Devuelve `null` cuando ninguna entrevista tiene score | CA-2 |
| Devuelve `null` cuando el candidato no tiene entrevistas | CA-2 |
| Ignora scores `null` al calcular la media | CA-2 |
| Devuelve `[]` cuando la posición no tiene aplicaciones | CA-3 |
| Lanza `"Position not found"` para positionId inexistente | CA-3 |
| No llama a la DB si la posición no existe | CA-3 |

### Cómo correr los tests

```bash
# Todos los tests del proyecto
npm test

# Solo este ticket
npm test -- positionService.test.ts
```

---

## Tablas de BD involucradas

| Tabla | Uso |
|---|---|
| `Position` | Verificar existencia de la posición |
| `Application` | Listar candidatos en proceso para la posición |
| `Candidate` | Obtener `firstName` y `lastName` |
| `InterviewStep` | Obtener nombre de la fase actual (`currentInterviewStep`) |
| `Interview` | Calcular `averageScore` a partir del campo `score` |
