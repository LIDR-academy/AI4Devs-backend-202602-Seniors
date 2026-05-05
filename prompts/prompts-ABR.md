# Prompts ABR — AI4Devs-backend-202602-Seniors

Registro de trabajo solicitado para el módulo LTI (backend + documentación), abril.

## Contexto del proyecto

- Monorepo con `frontend/` (React, Create React App) y `backend/` (Express + TypeScript + Prisma + PostgreSQL).
- Dominio de reclutamiento: candidatos, posiciones, aplicaciones, pasos de entrevista e entrevistas con puntuación.

## Prompt 1: Documentación README (español)

Generar documentación en markdown para el README que incluya:

1. Estructura de carpetas del repositorio.
2. Tecnologías usadas (frontend y backend).
3. Arquitectura de backend (capas: presentación, aplicación, dominio, Prisma) y de frontend (componentes, servicios, CRA).
4. Pasos completos para levantar el entorno: variables `.env`, Docker Compose para PostgreSQL, `npm install`, `prisma generate`, migraciones y semilla de datos, arranque backend y frontend.

## Prompt 2: Endpoint `GET /positions/:id/candidates`

- Listar todas las **aplicaciones** asociadas a un `positionId`.
- Por cada aplicación devolver:
  - Nombre completo del candidato (tabla `Candidate`: `firstName` + `lastName`).
  - Fase actual: `current_interview_step` basado en `Application.currentInterviewStep` → relación `InterviewStep` (nombre e índice de orden).
  - **Puntuación media** del candidato en esa aplicación: media de `Interview.score` de las entrevistas ligadas a esa `Application`.

## Prompt 3: Endpoint `PUT /candidates/:id/stage`

- Actualizar la etapa del proceso para un candidato concreto.
- Implementación alineada con el modelo: actualizar `Application.currentInterviewStep` identificando la fila por `candidateId` (parámetro de ruta) y `positionId` (cuerpo JSON), validando que `interviewStepId` pertenezca al flujo de la posición.

## Prompt de testing (ABR)

Objetivo: cubrir con pruebas automatizadas (p. ej. Jest + supertest o tests de integración contra Prisma con BD de test) las **nuevas funcionalidades** y la **validación del flujo de entrevistas** asociado a cada posición.

### Alcance funcional a validar

1. **`GET /positions/:id/candidates`**
   - Respuesta **200** con `position_id` y lista `candidatos` cuando la posición existe (aunque la lista esté vacía).
   - **404** cuando `id` no corresponde a ninguna posición.
   - **400** cuando `:id` no es un entero válido.
   - Por cada aplicación devuelta: `nombre_completo` correcto; `current_interview_step` coherente con `Application.currentInterviewStep` y tabla `InterviewStep`; `average_score` igual a la media de `Interview.score` de esa aplicación (solo entrevistas con `score` numérico); `null` si no hay puntuaciones.

2. **`PUT /candidates/:id/stage`**
   - **200**: actualiza `Application.currentInterviewStep` cuando existen candidato, aplicación (`candidateId` + `positionId`) y `interviewStepId` válido para esa posición.
   - **Validación indirecta de `interviewFlowId`**: cada `Position` tiene `interviewFlowId`; solo deben aceptarse `interviewStepId` que pertenezcan a los `InterviewStep` del `InterviewFlow` de **esa** posición (misma regla que implementa `candidateStageService`: cargar posición con `interviewFlow.interviewSteps` y comprobar membresía del id).
   - **400** si `interviewStepId` pertenece a otro flujo (paso de otra vacante / otro `interviewFlowId`).
   - **400** si faltan o son inválidos `positionId` o `interviewStepId` en el cuerpo.
   - **404** si no hay aplicación para el par candidato–posición.
   - **400** si `:id` del candidato no es numérico válido.

### Casos de datos recomendados en tests

- Posición A con `interviewFlowId` = flujo 1 y pasos `{stepA1, stepA2}`.
- Posición B con `interviewFlowId` = flujo 2 y pasos `{stepB1}`.
- Aplicación del mismo candidato a la posición A: intentar actualizar con `interviewStepId = stepB1` debe responder **400** (el paso no está en el flujo de A).

### Entregables sugeridos

- Tests en `backend/src/tests/` o equivalente, usando cliente HTTP contra `app` exportado desde `index.ts` (sin escuchar puerto) o capa de servicios mockeando Prisma según convención del repo.
- Ejecutar con `npm test` en `backend/`.

## Restricciones de entrega

- Texto de usuario final en **español**.
- Cambios de código de API en la carpeta `backend/`.
- Resumen técnico de rutas/controladores/tecnologías adicional en `backend/DOCUMENTACION.md`.
- Este fichero en `prompts/prompts-ABR.md`.
