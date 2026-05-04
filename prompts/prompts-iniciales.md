# Prompts iniciales - JCO

## Prompt 1

Analiza el backend de `AI4Devs-backend-202602-Seniors` y el schema de Prisma existente. Identifica cómo están modeladas `Position`, `Application`, `Candidate`, `InterviewStep` e `Interview`, y propón cómo implementar los endpoints `GET /positions/:id/candidates` y `PUT /candidates/:id/stage` sin romper el estilo actual de rutas, controladores y servicios.

## Prompt 2

Implementa un servicio de aplicación que permita listar los candidatos de una posición con su nombre completo, etapa actual de entrevista y puntuación media calculada desde las entrevistas realizadas. Usa Prisma con `include`/`select` explícitos y devuelve errores claros si la posición no existe.

## Prompt 3

Implementa el movimiento de etapa de un candidato. Ten en cuenta que un candidato puede tener aplicaciones a varias posiciones: el endpoint debe aceptar `positionId` para actualizar la aplicación correcta y debe fallar de forma segura si hay ambigüedad.

## Prompt 4

Añade tests unitarios con mocks de Prisma para cubrir el listado de candidatos por posición, el cálculo de puntuación media y la actualización de etapa. Revisa que `npm test` y `npm run build` pasen antes de preparar el PR.
