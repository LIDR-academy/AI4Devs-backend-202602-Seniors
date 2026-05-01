# Prompt1

Eres un senior backed developer experto en react, js, ts, prisma y docker.
Implementa el endpoint `GET /positions/:id/candidates` en backend.

## Objetivo
Obtener todos los candidatos en proceso para una posición (`positionId`) y devolver, por candidato:
- `full_name` (tabla `candidate`)
- `current_interview_step` (tabla `application`)
- `average_score` (media de `score` en `interview` para ese candidato en ese proceso)

## Reglas de trabajo
- Respeta las reglas del repositorio (`AGENTS.md`, `.cursor/rules`, skills).
- Enfoque forward-only: no refactorizar legacy fuera de lo necesario.
- Mantén separación por capas en código nuevo/tocado (presentation/application/infrastructure/domain).
- No introducir Prisma en dominio.
- Añadir/actualizar tests para el nuevo comportamiento.

## Contrato esperado
- Endpoint: `GET /positions/:id/candidates`
- `:id` corresponde a `positionId`.
- Respuesta `200` con lista de candidatos en proceso para esa posición.
- Definir y mantener comportamiento explícito para:
  - posición inexistente o sin candidaturas (p. ej. `404` o `200 []`, pero consistente),
  - candidatos sin entrevistas (`average_score`: `null` o `0`, pero consistente y documentado en la respuesta final).

## Tests mínimos requeridos
1. **Happy path**  
   - posición con candidaturas en proceso y entrevistas con score  
   - valida `200`, estructura de respuesta y cálculo correcto de `average_score`.

2. **Edge case**  
   - candidato en proceso sin entrevistas  
   - valida inclusión del candidato y valor esperado de `average_score` según contrato definido.

## Out of scope
- No cambios de frontend.
- No refactor masivo de módulos legacy.
- No cambios de infraestructura/CI/Docker.
- No rediseño global de modelos, solo ajustes mínimos necesarios para este endpoint.

## Entregables
1. Implementación completa del endpoint y capas implicadas.
2. Tests añadidos/actualizados para cubrir los casos mínimos.
3. Respuesta final en chat (no en archivos) con:
   - archivos modificados,
   - decisiones de contrato (especialmente sin entrevistas y posición inexistente/sin candidaturas),
   - comandos ejecutados para validar.

# Prompt 2:

Implementa el endpoint `PUT /candidates/:id/stage` en backend, donde `:id` debe interpretarse como `applicationId` (identificador único del proceso de candidatura).

## Objetivo
Actualizar la etapa actual de una candidatura concreta en el flujo de entrevistas (kanban move).

## Reglas de trabajo
- Respeta las reglas del repositorio (`AGENTS.md`, `.cursor/rules`, skills).
- Enfoque forward-only: no refactorizar legacy fuera de lo necesario.
- Mantén separación por capas en código nuevo/tocado (presentation/application/infrastructure/domain).
- No introducir Prisma en dominio.
- Añadir/actualizar tests para el nuevo comportamiento.

## Contrato de endpoint
- Método/ruta: `PUT /candidates/:id/stage`
- Semántica de `:id`: `applicationId`
- Payload:
  - `targetInterviewStepId` (number, requerido)

Ejemplo de payload:
`{"targetInterviewStepId": 7}`

## Requisitos funcionales
- Localizar la `application` por `applicationId`.
- Actualizar `application.currentInterviewStep` al valor de `targetInterviewStepId`.
- Validar que el step destino existe y es válido para el flujo de la posición asociada a la aplicación.
- Persistir el cambio y devolver respuesta coherente.

## Respuestas esperadas (definir e implementar de forma consistente)
- `200` (recomendado) con entidad/DTO actualizado, o `204` sin body.
- `404` si `applicationId` no existe.
- `400` o `422` si `targetInterviewStepId` es inválido o no pertenece al flujo de esa posición.
- Errores con formato consistente con el resto de endpoints nuevos.

## Tests mínimos requeridos
1. Happy path
   - application existente + step destino válido del flujo de su posición
   - valida actualización correcta de `currentInterviewStep` y código de respuesta esperado.

2. Edge case
   - step destino no válido para el flujo de la posición (o inexistente)
   - valida rechazo con `400/422` y que la application no se actualiza.

## Out of scope
- No cambios de frontend.
- No refactor masivo de módulos legacy.
- No cambios de infraestructura/CI/Docker.
- No rediseño global de modelos, solo ajustes mínimos para este endpoint.

## Entregables
1. Implementación completa del endpoint y capas implicadas.
2. Tests añadidos/actualizados para cubrir los casos mínimos.
3. Respuesta final en chat (no en archivos) con:
   - archivos modificados,
   - decisiones de contrato (especialmente códigos de error y validación de step por flujo),
   - comandos ejecutados para validar.