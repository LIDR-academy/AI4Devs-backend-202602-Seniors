# Documentación de sesión — Endpoints Kanban en LTI Backend

**Proyecto**: LTI — sistema de seguimiento de candidatos (ATS)  
**Autor**: Fran Sales  
**Fecha**: 2026-05-03  
**Rama**: `main`

---

## 1. Introducción

El objetivo de esta sesión fue extender el backend Express + TypeScript del proyecto LTI con dos nuevos endpoints orientados a la vista Kanban del ATS. Estos endpoints permiten al frontend:

1. Consultar todos los candidatos en proceso para una posición concreta, con su fase actual y puntuación media.
2. Mover un candidato de una fase a otra actualizando su `currentInterviewStep` en la aplicación correspondiente.

La implementación siguió la arquitectura existente de 4 capas (Routes → Controllers → Services → Domain Models) y añadió una jerarquía de errores tipados reutilizable.

---

## 2. Especificación de endpoints

### 2.1. GET `/positions/:id/candidates`

Devuelve la lista de candidatos en proceso para una posición dada.

**Request**

```
GET /positions/42/candidates
```

No requiere body ni headers especiales.

**Response 200 — OK**

```json
[
  {
    "fullName": "John Doe",
    "currentInterviewStep": "Technical Interview",
    "averageScore": 7.5
  },
  {
    "fullName": "Jane Smith",
    "currentInterviewStep": "Initial Screening",
    "averageScore": null
  }
]
```

`averageScore` es `null` cuando el candidato no tiene entrevistas registradas o todas sus puntuaciones son `null`.

**Respuestas de error**

| Código | Descripción |
|--------|-------------|
| 400 | El parámetro `:id` no es un número entero válido |
| 404 | No existe ninguna `Position` con ese ID |
| 500 | Error interno del servidor |

---

### 2.2. PUT `/candidates/:id/stage`

Actualiza la fase de entrevista de una aplicación concreta de un candidato.

**Request**

```
PUT /candidates/7/stage
Content-Type: application/json

{
  "applicationId": 15,
  "currentInterviewStep": 3
}
```

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `applicationId` | `number` | ID de la `Application` a actualizar |
| `currentInterviewStep` | `number` | ID del `InterviewStep` destino |

**Response 200 — OK**

```json
{
  "message": "Candidate stage updated successfully",
  "data": {
    "applicationId": 15,
    "currentInterviewStep": 3
  }
}
```

**Respuestas de error**

| Código | Descripción |
|--------|-------------|
| 400 | El parámetro `:id` no es válido, faltan campos en el body, o el `InterviewStep` no pertenece al `InterviewFlow` de la posición |
| 404 | La `Application` no existe para ese candidato, o el `InterviewStep` no existe |
| 500 | Error interno del servidor |

---

## 3. Pipeline de agentes

| # | Agente | Tipo | Skill usada | Tarea asignada | Output principal |
|---|--------|------|-------------|----------------|-----------------|
| 1 | Explorador | Explore | — | Mapear patrones del codebase: estructura de carpetas, convenciones de nombrado, modelos Prisma, rutas existentes | Informe de arquitectura y patrones |
| 2 | Planificador | Plan | — | Diseñar la arquitectura de los dos endpoints: queries Prisma, contratos JSON request/response, ficheros a crear/modificar | Plan técnico detallado |
| 3 | Implementador | General-purpose (worktree) | — | Escribir el código de rutas, controladores, servicios y el módulo de errores tipados | Todos los ficheros de producción |
| 4 | Tester | General-purpose | — | Escribir los tests Jest con mocks de Prisma para los dos servicios | `positionCandidates.test.ts`, `candidateStage.test.ts` |
| 5 | Revisor de calidad | General-purpose | `simplify` | Identificar y corregir: query N+1, ejecución secuencial de queries, errores stringly-typed, condicionales anidados | Código refactorizado |
| 6 | Documentador | General-purpose | — | Generar este fichero de documentación | `prompts-FSF.md` |

---

## 4. Prompts utilizados

### Agente 1 — Explorador

```
Explora el codebase del backend en `backend/src` y mapea:
- Estructura de carpetas y convención de nombrado de ficheros
- Cómo se registran las rutas en `index.ts`
- Cómo están estructurados los controladores y servicios existentes
- Los modelos Prisma disponibles (schema.prisma)
- Patrones de manejo de errores actualmente en uso
No escribas código; devuelve un informe de arquitectura.
```

### Agente 2 — Planificador

```
Dado el informe de arquitectura del codebase LTI, diseña el plan de implementación
para dos endpoints Kanban:

1. GET /positions/:id/candidates — devuelve candidatos con fullName,
   currentInterviewStep (nombre) y averageScore (media de interviews.score).
2. PUT /candidates/:id/stage — actualiza currentInterviewStep de una Application,
   validando que el InterviewStep pertenece al InterviewFlow de la Position.

Para cada endpoint especifica:
- Ficheros a crear y a modificar
- Query Prisma completa (con includes necesarios)
- Contrato JSON de request y response
- Casos de error y código HTTP correspondiente
No escribas código; devuelve el plan técnico.
```

### Agente 3 — Implementador

```
Implementa los dos endpoints Kanban siguiendo este plan técnico [adjuntar plan]
y los patrones del codebase existente [adjuntar informe de arquitectura].

Crea los ficheros:
- backend/src/routes/positionRoutes.ts
- backend/src/presentation/controllers/positionController.ts
- backend/src/application/services/positionService.ts
- backend/src/application/errors.ts

Modifica:
- backend/src/routes/candidateRoutes.ts (añadir PUT /:id/stage)
- backend/src/presentation/controllers/candidateController.ts
- backend/src/application/services/candidateService.ts
- backend/src/index.ts (registrar /positions)

Usa TypeScript estricto, errores tipados (NotFoundError, ValidationError) y
la instancia de PrismaClient local en cada servicio.
```

### Agente 4 — Tester

```
Escribe tests Jest para los servicios:
- getCandidatesForPosition (positionService.ts): cubre posición no encontrada,
  array vacío, fullName correcto, currentInterviewStep correcto, cálculo de
  averageScore, averageScore null sin entrevistas, averageScore null con scores null.
- updateCandidateStage (candidateService.ts): cubre application no encontrada,
  interviewStep no encontrado, step de otro flow, llamada correcta a update,
  resultado devuelto correctamente.

Usa jest.mock('@prisma/client') para aislar la base de datos.
Coloca los ficheros en backend/src/tests/.
```

### Agente 5 — Revisor de calidad

```
Revisa el código implementado usando la skill `simplify`. Busca y corrige:
1. Queries N+1 en positionService — deben resolverse con un único findUnique + include anidado.
2. Queries secuenciales en updateCandidateStage — usa Promise.all para ejecutarlas en paralelo.
3. Errores stringly-typed — sustituye por la jerarquía NotFoundError / ValidationError.
4. Condicionales anidados innecesarios — aplana la lógica de guardas.
Devuelve el código corregido con explicación de cada cambio.
```

### Agente 6 — Documentador

```
Genera el fichero prompts/prompts-FSF.md documentando la sesión completa.
El fichero debe incluir: introducción, especificación de endpoints con ejemplos JSON,
tabla del pipeline de agentes, prompts utilizados, decisiones de diseño, árbol de
ficheros y comando para ejecutar los tests. Escribe en español y en markdown técnico.
```

---

## 5. Decisiones de diseño

### 5.1. Query única con `include` anidado en `getCandidatesForPosition`

Una solución ingenua haría una query para obtener la `Position`, otra para cada `Application`, y otra para cada `Candidate` — el clásico problema N+1. En su lugar, `positionService.ts` realiza una única llamada `prisma.position.findUnique` con `include` en cadena:

```ts
include: {
  applications: {
    include: {
      candidate: { select: { firstName: true, lastName: true } },
      interviewStep: { select: { name: true } },
      interviews: { select: { score: true } },
    },
  },
},
```

Prisma traduce esto a un número fijo de JOINs independientemente del número de candidatos, manteniendo la complejidad en O(1) queries.

### 5.2. `Promise.all` en `updateCandidateStage`

La validación necesita dos datos independientes: la `Application` (para obtener el `interviewFlowId` de su `Position`) y el `InterviewStep` (para comprobar su `interviewFlowId`). Estas dos queries no tienen dependencia entre sí, por lo que se lanzan en paralelo:

```ts
const [application, step] = await Promise.all([
  prisma.application.findFirst({ ... }),
  prisma.interviewStep.findUnique({ ... }),
]);
```

Esto reduce la latencia de la operación de `T_app + T_step` a `max(T_app, T_step)`.

### 5.3. Jerarquía de errores tipados en `errors.ts`

El código preexistente mezclaba `throw new Error('...')` con comprobaciones de strings en los controladores. Este patrón es frágil: un typo en el mensaje rompe la comprobación sin error de compilación. Se introdujo `NotFoundError` y `ValidationError`, ambas extendiendo `Error`, en `backend/src/application/errors.ts`. Los controladores usan `instanceof` para discriminar el tipo:

```ts
if (error instanceof NotFoundError) {
  res.status(404).json({ error: error.message });
} else if (error instanceof ValidationError) {
  res.status(400).json({ error: error.message });
}
```

TypeScript puede verificar en tiempo de compilación que los tipos son correctos, y añadir nuevos tipos de error no requiere tocar los controladores ya existentes.

### 5.4. Registro de la ruta en `index.ts`

La nueva ruta `/positions` se registra en `backend/src/index.ts` junto a `/candidates`, que es donde se centralizan todos los montajes de router. Esto mantiene un único punto de entrada donde es fácil ver qué rutas están activas, coherente con el patrón ya establecido en el proyecto:

```ts
app.use('/candidates', candidateRoutes);
app.use('/positions', positionRoutes);   // añadido
```

---

## 6. Estructura de ficheros

```
backend/
└── src/
    ├── index.ts                                          [MODIFICADO]  registra /positions
    ├── application/
    │   ├── errors.ts                                     [NUEVO]       NotFoundError, ValidationError
    │   └── services/
    │       ├── candidateService.ts                       [MODIFICADO]  añade updateCandidateStage
    │       └── positionService.ts                        [NUEVO]       getCandidatesForPosition
    ├── presentation/
    │   └── controllers/
    │       ├── candidateController.ts                    [MODIFICADO]  añade updateCandidateStage handler
    │       └── positionController.ts                     [NUEVO]       getCandidatesForPosition handler
    ├── routes/
    │   ├── candidateRoutes.ts                            [MODIFICADO]  añade PUT /:id/stage
    │   └── positionRoutes.ts                             [NUEVO]       GET /:id/candidates
    └── tests/
        ├── candidateStage.test.ts                        [NUEVO]       5 tests servicio PUT
        └── positionCandidates.test.ts                    [NUEVO]       7 tests servicio GET

prompts/
└── prompts-FSF.md                                        [NUEVO]       este fichero
```

---

## 7. Cómo ejecutar los tests

Desde la carpeta `backend/`:

```bash
npm test
```

O para ejecutar solo los tests de los nuevos endpoints:

```bash
npx jest positionCandidates candidateStage
```

**Resultado esperado**: 12 tests passing, 0 failing.

```
 PASS  src/tests/positionCandidates.test.ts (7 tests)
 PASS  src/tests/candidateStage.test.ts     (5 tests)

Test Suites: 2 passed, 2 total
Tests:       12 passed, 12 total
```
