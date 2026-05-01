# Prompts iniciales — Ejercicio Backend LTI (módulo 9)

**Autor:** Gicu (GFS) — gicupc
**Fecha:** 1 de mayo de 2026
**Repo upstream:** LIDR-academy/AI4Devs-backend-202602-Seniors
**Rama:** backend-GFS
**Herramienta IA:** Windsurf (Cascade)

---

## Metodología

He aplicado un flujo en 4 fases con prompts estructurados (Role + Objective + Context + Constraints + Expected Output), siguiendo el patrón de las PRs destacadas en la sesión en directo del módulo 8 (Arnau, Alberto, Fran). Cada prompt incluye restricciones explícitas y formato de salida esperado para reducir alucinaciones y obtener respuestas accionables.

Las 4 fases:

1. **Onboarding** — mapa del codebase sin escribir código (modo Chat).
2. **Plan** — diseño de los dos endpoints sin implementar (modo Chat).
3. **Implementación endpoint A** — paso a paso con paradas obligatorias (modo Code).
4. **Implementación endpoint B** — paso a paso con paradas obligatorias (modo Code).

---

## Decisiones arquitectónicas

Antes de implementar, durante la fase de plan tomé tres decisiones explícitas que documenté como restricciones en los prompts posteriores:

### 1. Patrón de capas: aplicar `routes → controller → service → domain` limpio

El endpoint POST /candidates existente bypassa la capa de presentación: la ruta llama directamente al servicio con try/catch inline, mientras que la función `addCandidateController` del controller queda huérfana (no se invoca desde ninguna parte). Detecté este antipatrón durante el onboarding (ver Prompt 1, sección "Patrón de capas").

**Decisión:** no propagar el antipatrón en los endpoints nuevos. Implementar el flujo limpio donde:

- La ruta es un one-liner que delega al controller
- El controller maneja parseo de entrada HTTP, validación de formato y mapeo de errores semánticos a códigos HTTP
- El service maneja la lógica de negocio sin saber nada de HTTP
- El domain maneja la persistencia siguiendo el patrón Active Record existente

Esto se alinea con SOLID y las recomendaciones del módulo 9 (Buenas prácticas para el desarrollo backend). El archivo `candidateRoutes.ts` queda como un híbrido deliberado: el POST mantiene el patrón antiguo, las rutas nuevas siguen el patrón limpio.

### 2. Domain model nuevo: crear `Position.ts`

El proyecto usa Active Record en `Candidate`, `Application`, `Education`. La query del endpoint A (`findCandidatesInProcess`) es responsabilidad del dominio Position, no de Application ni de un service genérico. Crear `Position.ts` es coherente con el patrón establecido y deja base preparada para futuros endpoints de Position.

### 3. Tests sólidos con mocks manuales de Prisma

Jest configurado pero sin tests preexistentes. Decidí cobertura sólida (4-6 tests por endpoint) en lugar de un solo happy path, cubriendo: happy path, validaciones de entrada, recursos no encontrados, edge cases (avg con scores nulos, application vacía).

Setup de mocks: `jest.mock('@prisma/client')` con `mockReturnValue` (no `mockImplementation`) para garantizar que todas las instancias de `new PrismaClient()` —incluida la del dominio Active Record— devuelven el mismo objeto mockeado.

### 4. Decisiones de comportamiento confirmadas durante el plan

- **C1 — averageScore con scores nulos:** Excluir nulos del cálculo. Si todas las entrevistas tienen score `null` o no hay entrevistas, devolver `averageScore: null`. Razón: un score `null` significa "entrevista sin puntuar todavía", tratarlo como 0 distorsionaría el ranking.
- **C2 — PUT solo actualiza el puntero:** El enunciado dice literalmente "actualizará la etapa". No crear registros en `Interview`. Hacer más sería scope creep.
- **C3 — "Candidatos en proceso":** Todas las Applications de la Position, sin filtros. El propio enunciado se autoaclara con "es decir, todas las aplicaciones".

---

## Prompt 1 — Onboarding del proyecto

**Modo:** Chat (sin escritura)
**Objetivo:** mapa del codebase para planificar sin sorpresas.

```
# Role
Eres un ingeniero senior backend (Node.js + TypeScript + Prisma) haciendo
onboarding técnico a un codebase desconocido. Tu trabajo no es producir código,
es leer rápido y devolver un mapa accionable.

# Objective
Producir un mapa conciso del proyecto LTI que me permita, en la siguiente
iteración, planificar dos endpoints nuevos sin sorpresas arquitectónicas.

# Context
- Stack: Node.js + TypeScript + Express + Prisma + PostgreSQL
- Arquitectura por capas: presentation, application, domain, infrastructure, routes
- Repo: AI4Devs-backend-202602-Seniors (fork de LIDR-academy)
- Existen ya endpoints POST /candidates y GET /candidates/:id funcionando

# Tasks
1. Modelo de datos relevante para la siguiente fase (Candidate, Application,
   Interview, Position, InterviewStep, InterviewFlow): PK, FK, 2-3 atributos clave.
2. Relaciones entre esas seis entidades en formato `A —[1:N|N:1|N:M]— B`.
3. Patrón de capas: rastrear POST /candidates desde la ruta hasta la BD.
4. Tests existentes: dónde viven, framework, estrategia de mock de Prisma.
5. Convenciones: naming, validación, manejo de errores.

# Constraints
- No leas ni cites el schema.prisma completo.
- No propongas mejoras ni refactors. Onboarding, no review.
- No escribas código nuevo.
- Si una sección no la puedes responder con confianza, escribe "❓ no encontrado"
  y dime dónde miraste — no inventes.

# Expected Output
Markdown con 5 secciones (una por task), máximo 15 líneas por sección.
Cierra con un bloque `## TODOs para mí` con 3 puntos concretos.
```

**Hallazgos clave de Cascade:**

- POST /candidates bypassa el controller (antipatrón documentado).
- No existen tests preexistentes (jest configurado pero 0 archivos `.test.ts`).
- No existe `Position` domain model — habrá que crearlo.
- Validación manual con funciones tipo `validateName()`, `validateEmail()` en `application/validator.ts`.

---

## Prompt 2 — Plan de los dos endpoints

**Modo:** Chat (sin escritura)
**Objetivo:** plan ejecutable que un junior pueda implementar sin tomar decisiones.

```
# Role
Eres un tech lead diseñando un PR pequeño y limpio para el proyecto LTI.
Tu prioridad es producir un plan ejecutable que un junior pueda implementar
sin tomar decisiones arquitectónicas. No improvisas: si algo es ambiguo,
lo señalas y preguntas.

# Objective
Producir un plan de implementación detallado y revisable para dos endpoints:
GET /positions/:id/candidates y PUT /candidates/:id/stage.

# Context
Reutiliza el mapa del onboarding. Decisiones ya tomadas:
1. Patrón limpio routes → controller → service → domain (no replicar el POST).
2. Crear src/domain/models/Position.ts siguiendo Active Record.
3. Tests Jest con mocks manuales (4-6 por endpoint).

# Endpoints
A) GET /positions/:id/candidates — fullName + currentInterviewStep + avg score
B) PUT /candidates/:id/stage — body { applicationId, newInterviewStepId }
   Validar: el step pertenece al InterviewFlow de la Position de la Application.

# Tasks
1. Estructura de archivos (tabla con ruta + acción + propósito)
2. Pseudo-firmas TypeScript de cada función nueva + DTOs
3. Query Prisma del endpoint A (UNA sola operación, justificar N+1)
4. Validaciones del endpoint B en orden + códigos HTTP
5. Plan de tests describe/it por endpoint

# Constraints
- UNA sola query Prisma para A.
- Cero cambios en schema.prisma ni nuevas migraciones.
- Cero dependencias nuevas.
- Reutiliza validator.ts existente.
- No escribas código.
- Si encuentras algo ambiguo, escribe "❓ Necesito confirmación" con preguntas concretas.

# Expected Output
Markdown estructurado: tabla, pseudocódigo, listas, árbol de tests, riesgos.
```

**Output de Cascade — preguntas que respondió el plan tras mi confirmación:**

- C1: averageScore con scores nulos → excluir nulos, devolver null si no hay scores válidos.
- C2: PUT solo mueve el puntero, no crea Interview.
- C3: "candidatos en proceso" = todas las applications de la position.

---

## Prompt 3 — Implementación endpoint A (GET /positions/:id/candidates)

**Modo:** Code
**Objetivo:** ejecutar el plan paso a paso, con paradas obligatorias entre archivos.

```
# Role
Ingeniero implementando el plan acordado. Cero desviaciones. Si encuentras
algo no previsto, paras y preguntas.

# Objective
Implementar GET /positions/:id/candidates. Solo este endpoint. El PUT vendrá después.

# Decisiones confirmadas
- C1: excluir scores nulos del avg, devolver null si no quedan.
- C3: todas las Applications de la Position.
- Tests en backend/src/__tests__/.

# Tasks (orden estricto, NO mezclar)
1. Modificar src/domain/models/Position.ts (interfaz + método estático). PARA.
2. Crear src/application/services/positionService.ts. PARA.
3. Crear src/presentation/controllers/positionController.ts. PARA.
4. Crear src/routes/positionRoutes.ts y modificar src/index.ts. PARA.
5. Crear src/__tests__/getPositionCandidates.test.ts. Ejecutar npm test.

# Constraints
- Solo endpoint A.
- Después de cada paso, DETENTE y espera "ok, sigue".
- No improvises ante huecos del plan: pregunta.
- No modifiques schema.prisma ni seed.ts.
- Reutiliza patrón Active Record existente.

# Expected Output (por paso)
- Ruta del archivo
- Código completo
- Una línea de justificación por decisión no trivial
```

**Resultado:** 6/6 tests pasando. Verificación end-to-end con BD real:

- `GET /positions/1/candidates` → 200 con array de 3 candidatos.
- Carlos García devuelve `averageScore: null` (sin entrevistas con score) → confirma C1 en producción.

---

## Prompt 4 — Implementación endpoint B (PUT /candidates/:id/stage)

**Modo:** Code
**Objetivo:** mismo patrón disciplinado que el A, ahora para el PUT.

```
# Role
Mismo rol del turno anterior: ingeniero implementando con paradas entre pasos.

# Objective
Implementar PUT /candidates/:id/stage. Endpoint A ya en main, no tocar.

# Decisión C2 confirmada
El PUT solo actualiza Application.currentInterviewStep. NO crea Interview.

# Tasks (orden estricto)
1. Modificar src/application/validator.ts: añadir validateStageUpdateBody. PARA.
2. Modificar src/application/services/candidateService.ts: añadir
   updateCandidateStage con las 8 validaciones del plan en orden. PARA.
3. Modificar src/presentation/controllers/candidateController.ts: añadir
   updateStageController siguiendo el patrón del controller del A. PARA.
4. Modificar src/routes/candidateRoutes.ts: AÑADIR (no refactorizar) el PUT.
   El archivo quedará mixto deliberadamente (POST antiguo + GET y PUT limpios). PARA.
5. Crear src/__tests__/updateCandidateStage.test.ts (8 tests).
   Ejecutar npm test y mostrar todos los tests, no solo los nuevos.

# Constraints
- Solo endpoint B. No tocar archivos del A.
- DETENTE entre pasos.
- Si falta algún domain method (ej. InterviewStep.findOne), AVISA antes de inventar.
- No introduzcas dependencias nuevas.

# Expected Output (por paso)
- Ruta del archivo, código completo o sección añadida, justificación.
```

**Resultado:** 14/14 tests pasando (6 del A + 8 del B). Verificación end-to-end con BD real:

- `PUT /candidates/1/stage` con body `{applicationId: 1, newInterviewStepId: 3}` → 200 con `{"id":1,"currentInterviewStep":3}`.
- `PUT /candidates/1/stage` con `applicationId: 9999` → 404 con `{"error":"Application not found"}`.

---

## Resumen de archivos entregados

| Archivo                                           | Endpoint | Acción                                  |
| ------------------------------------------------- | -------- | --------------------------------------- |
| `domain/models/Position.ts`                       | A        | Modificado (interfaz + método estático) |
| `application/services/positionService.ts`         | A        | Nuevo                                   |
| `presentation/controllers/positionController.ts`  | A        | Nuevo                                   |
| `routes/positionRoutes.ts`                        | A        | Nuevo                                   |
| `index.ts`                                        | A        | Modificado (registro de ruta)           |
| `__tests__/getPositionCandidates.test.ts`         | A        | Nuevo (6 tests)                         |
| `application/validator.ts`                        | B        | Modificado (validateStageUpdateBody)    |
| `application/services/candidateService.ts`        | B        | Modificado (updateCandidateStage)       |
| `presentation/controllers/candidateController.ts` | B        | Modificado (updateStageController)      |
| `routes/candidateRoutes.ts`                       | B        | Modificado (PUT /:id/stage)             |
| `__tests__/updateCandidateStage.test.ts`          | B        | Nuevo (8 tests)                         |

11 archivos. 14 tests. Cero N+1. Cero dependencias nuevas. Cero cambios al schema.

## Nota sobre dependencias

Se añadió `tsx` como `devDependency` para ejecutar el script de seed
(`prisma/seed.ts`). El comando que el README sugiere (`ts-node seed.ts`)
falla con `Debug Failure. False expression: Non-string value passed to
ts.resolveTypeReferenceDirective` debido a una incompatibilidad entre
la versión de `ts-node` y la de TypeScript instalada. `tsx` es una
alternativa moderna que evita el problema sin tocar el resto del setup.

Esta es la única adición a `package.json`. No hay dependencias de runtime
nuevas — solo herramienta de desarrollo.
