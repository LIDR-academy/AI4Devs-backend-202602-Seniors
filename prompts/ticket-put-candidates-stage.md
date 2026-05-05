Título
[API] Implementar endpoint PUT /candidates/:id/stage para actualizar fase de entrevista

Descripción
El endpoint PUT /candidates/:id/stage permite cambiar la fase actual del proceso de entrevista de un candidato específico. Un candidato está vinculado a una aplicación (Application) para una posición, y cada aplicación tiene un currentInterviewStep que define en qué etapa del proceso se encuentra.

Por qué: El reclutador necesita avanzar candidatos a través del pipeline de entrevistas (ej: "Initial Screening" → "Technical Round" → "HR Interview" → "Offer") y registrar el progreso de cada candidato.

Criterios de Aceptación

Dado un candidato con una aplicación existente
Y esa aplicación tiene currentInterviewStep = "Initial Screening"
Cuando se realiza PUT /candidates/uuid-123/stage con { "newStage": "Technical Round" }
Entonces retorna 200 con la aplicación actualizada
Y currentInterviewStep = "Technical Round"
Y updatedAt refleja la timestamp actual

Dado que un candidato tiene múltiples aplicaciones (varias posiciones)
Cuando se actualiza la etapa para una posición específica
Entonces solo se actualiza la Application de esa posición, no las otras

Dado un candidato con id inválido (no es UUID)
Cuando se realiza PUT /candidates/invalid/stage
Entonces retorna 400 con mensaje "Invalid candidate ID format"

Dado un candidato que no existe
Cuando se realiza PUT /candidates/00000000-0000-0000-0000-000000000000/stage
Entonces retorna 404 con mensaje "Candidate not found"

Dado un newStage que no existe en los pasos válidos
Cuando se realiza PUT /candidates/uuid/stage con { "newStage": "Unknown Stage" }
Entonces retorna 400 con mensaje "Invalid interview stage. Valid stages are: [lista]"

Dado un cambio de etapa válido
Cuando se actualiza la etapa
Entonces se registra un log de auditoría: "User {userId} moved candidate {candidateId} from {oldStage} to {newStage}"
Ejemplos de Request/Response
Request:

PUT /candidates/550e8400-e29b-41d4-a716-446655440000/stage
Content-Type: application/json

{
"newStage": "Technical Round"
}
Response (200 OK):

{
"id": "app-uuid-456",
"candidateId": "550e8400-e29b-41d4-a716-446655440000",
"positionId": "550e8400-e29b-41d4-a716-446655440001",
"currentInterviewStep": "Technical Round",
"previousInterviewStep": "Initial Screening",
"status": "in_progress",
"movedAt": "2026-05-06T14:32:00Z",
"movedBy": "user-uuid-789"
}
Response (400 Bad Request - Stage inválida):

{
"error": "Invalid interview stage",
"validStages": [
"Initial Screening",
"Technical Round",
"HR Interview",
"Final Round",
"Offer",
"Rejected",
"Withdrawn"
]
}
Response (404 Not Found):

{
"error": "Candidate not found"
}
Response (400 Bad Request - Formato inválido):

{
"error": "Invalid request body",
"details": "newStage is required and must be a string"
}
Contexto Técnico
Ubicación del código:

Crear método en candidateController.ts: updateCandidateStage()
Crear método en candidateService.ts: updateCandidateStage(candidateId, newStage, userId)
Nueva ruta en routes/candidates.ts: PUT /candidates/:id/stage
Tablas involucradas (según schema.prisma):

Candidate — para validar que existe
Application — currentInterviewStep (campo a actualizar), candidateId
AuditLog (si existe) o crear log en nueva tabla — registrar cambios
Etapas válidas de entrevista (stages):

Enum InterviewStage {
"Initial Screening" // Primeras entrevistas, evaluación inicial
"Technical Round" // Evaluación técnica
"HR Interview" // Entrevista con recursos humanos
"Final Round" // Ronda final con directivo
"Offer" // Oferta extendida
"Rejected" // Rechazado
"Withdrawn" // Retirado por candidato
}
Query pattern:

1. Validar que candidateId es UUID válido → sino 400
2. Validar que newStage está en enum válido → sino 400
3. Buscar Candidate por id → sino 404
4. Buscar Application más reciente para ese Candidate
   (o si hay queryParam ?positionId=, usar eso para filtrar)
5. Validar que Application existe → sino 404
6. Comparar: oldStage = Application.currentInterviewStep
7. Actualizar Application.currentInterviewStep = newStage
8. Registrar en AuditLog (o crear tabla):
   { userId, candidateId, oldStage, newStage, timestamp }
9. Retornar Application actualizada con previousInterviewStep
   Stack:

Prisma ORM (relaciones entre Candidate, Application)
TypeScript (strict mode, no any)
Express controller pattern
Enum para stages (validación en tipo)
Referencia de patrón existente:
Similar a cómo candidateService.updateCandidate() modifica datos — usar Prisma update().

Datos de Prueba (Seed)
Para testing, seed.ts debe incluir:

Al menos 1 candidato
Al menos 1 posición
Al menos 1 aplicación (Application) con currentInterviewStep = "Initial Screening"
Datos de usuarios para auditoría (requiere userId en token JWT)
Definición de Éxito Medible
✅ Funcional:

Endpoint actualiza currentInterviewStep correctamente
Endpoint retorna 400 para stage inválida
Endpoint retorna 404 para candidato inexistente
Endpoint retorna 400 para candidateId con formato inválido
Si candidato tiene múltiples aplicaciones, solo actualiza la del paso actual
Response incluye previousInterviewStep y movedAt
Response time <150ms
Auditoría registra todos los cambios
✅ Tests:

Test: PUT /candidates/uuid/stage con stage válida → 200
Test: PUT /candidates/uuid/stage con stage inválida → 400
Test: PUT /candidates/invalid-uuid/stage → 400
Test: PUT /candidates/nonexistent-uuid/stage → 404
Test: Candidato con múltiples aplicaciones, solo cambia una
Test: previousInterviewStep refleja el estado anterior
Test: AuditLog se crea correctamente
Cobertura mínima: 85% en candidateService.updateCandidateStage
✅ Código:

Sin any types
InterviewStage es enum/constant, no string hardcodeado
Validación de entrada (candidateId, newStage)
Manejo de errores explícito
Transacción atómica (update + audit log juntos)
Información de Seguridad y Autenticación
Autenticación requerida: Sí, JWT válido obligatorio (middleware auth.ts)
Autorización:
recruiter role: puede cambiar stage de candidatos en sus posiciones asignadas
admin role: puede cambiar stage de cualquier candidato
Validar que userId del token tiene permiso sobre esa posición
Validación:
candidateId debe ser UUID válido (400 Bad Request si no)
newStage debe estar en enum válido (400 Bad Request si no)
No permitir cambios imposibles (ej: Rejected → Technical Round es ilógico, pero no bloquear en lógica de negocio, dejar que reclutador decida)
Auditoría:
Registrar quién, qué, cuándo: { userId, candidateId, fromStage, toStage, timestamp }
Permitir historial de cambios (para investigación futura)
Rate limiting: Opcional, pero si existe middleware, aplica aquí
Campos de Response Requeridos
La respuesta debe incluir:

{
id: string (Application ID, no Candidate ID)
candidateId: string (UUID)
positionId: string (UUID)
currentInterviewStep: string (etapa actual)
previousInterviewStep: string (etapa anterior, para auditoría en frontend)
status: string (in_progress, completed, etc.)
movedAt: ISO 8601 timestamp
movedBy: string (userId que hizo el cambio)
}
Out of Scope
❌ Validar transiciones de estado (ej: solo Technical Round puede ir a HR Interview) — ese es negocio de reclutador
❌ Notificar candidato de cambio de etapa — será feature separada
❌ Historial completo de cambios (GET /candidates/:id/stage-history) — ticket separado
❌ Cambiar múltiples candidatos en batch — será PUT /positions/:id/candidates/:id/stage
❌ Sincronizar con calendario de entrevistas — integración futura
Estimado
Tamaño: Pequeño-Mediano (4-6 horas)
Complejidad: Baja-Media (validación, transacciones)
Desglose:

Crear servicio + controller + validación: ~2h
Tests (happy path + edge cases): ~1.5h
Auditoría + logging: ~1h
Debugging + ajustes: ~1h
Dependencias
✅ Candidate model existe
✅ Application model existe
✅ currentInterviewStep field existe en Application
✅ Autenticación (middleware/auth.ts) implementada
✅ User extraction from JWT (para auditoría)
❌ Bloqueante: Ninguna
Notas Adicionales
Consideraciones de diseño:

Si un candidato tiene aplicaciones a múltiples posiciones, ¿cuál se actualiza?

Decisión: Usar la aplicación más reciente (última creada)
Alternativa: Requiere ?positionId= en query para ser explícito
Recomendación: Usar positionId en query si existe, sino usar más reciente
¿Se puede cambiar de "Rejected" a otra etapa?

Decisión: Sí, permitir (reclutador puede cambiar de opinión)
Auditoría registra todo, así que hay trazabilidad
¿Qué pasa si no hay Application para ese Candidate?

Retornar 404 "Candidate has no application for any position"
