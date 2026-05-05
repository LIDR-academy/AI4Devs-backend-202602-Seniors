Título
[API] Implementar endpoint GET /positions/:id/candidates con información de candidatos en proceso

Descripción
El endpoint GET /positions/:id/candidates debe retornar todos los candidatos con aplicaciones activas para una posición específica. Actualmente no existe este endpoint, lo que obliga al frontend a hacer múltiples llamadas individuales para obtener candidatos con sus datos de entrevista.

Por qué: El frontend necesita listar candidatos de una posición con su fase actual y puntuación media para mostrar un tablero de seguimiento de proceso de selección.

Criterios de Aceptación

Dado un positionID válido
Cuando se realiza GET /positions/:id/candidates
Entonces retorna 200 con array de objetos candidato

Dado que existen 3 candidatos en proceso para una posición
Y el candidato 1 tiene 2 entrevistas con scores [80, 90]
Y el candidato 2 tiene 1 entrevista con score [70]
Cuando se realiza GET /positions/123/candidates
Entonces retorna 3 candidatos con:

- fullName: "Juan García"
- currentInterviewStep: "Technical Round" (nombre del paso)
- averageScore: 85.0 (promedio de todas sus entrevistas)

Dado que no existen candidatos para una posición
Cuando se realiza GET /positions/999/candidates
Entonces retorna 200 con array vacío []

Dado un positionID que no existe
Cuando se realiza GET /positions/invalid/candidates
Entonces retorna 404 con mensaje "Position not found"
Ejemplos de Request/Response
Request:

GET /positions/1/candidates
Response (200 OK):

{
"data": [
{
"id": "uuid-1",
"fullName": "María López García",
"currentInterviewStep": "Technical Round",
"averageScore": 87.5,
"totalInterviews": 2
},
{
"id": "uuid-2",
"fullName": "Carlos Rodríguez",
"currentInterviewStep": "HR Interview",
"averageScore": 75.0,
"totalInterviews": 1
}
],
"count": 2
}
Response (404 Not Found):

{
"error": "Position not found"
}
Contexto Técnico
Ubicación del código:

Crear método en candidateController.ts: getPositionCandidates()
Crear método en candidateService.ts: getPositionCandidates(positionId)
Nueva ruta en routes/candidates.ts (o routes/positions.ts): GET /positions/:id/candidates
Tablas involucradas (según schema.prisma):

Candidate — fullName
Application — positionId, currentInterviewStep
Interview — score, applicationId
Query pattern a seguir:
Similar al usado en candidateService.ts para relaciones, usa Prisma findMany() con include para traer relaciones (Application y sus Interviews).

Pseudocode:

1. Validar que positionId exista (buscar en Position table)
2. Si no existe → retornar 404
3. Buscar todas las Applications con ese positionId y status "en proceso"
4. Para cada Application, incluir:
   - Candidate.fullName
   - Application.currentInterviewStep
   - Calcular promedio de Interview.score para esa Application
5. Ordenar por Application.createdAt descendente (más recientes primero)
6. Retornar array con estructura definida
   Stack:

Prisma ORM (ya existe en el proyecto)
TypeScript (strict mode)
Express controller pattern (ver candidateController.ts como referencia)
Datos de Prueba (Seed)
Para testing, asegurar que seed.ts incluya:

Al menos 1 posición
Al menos 3 candidatos
Al menos 3 aplicaciones (Candidate → Position)
Al menos 4 entrevistas distribuidas entre las aplicaciones con scores variados
Definición de Éxito Medible
✅ Funcional:

Endpoint retorna datos correctos para posición con candidatos
Endpoint retorna array vacío para posición sin candidatos
Endpoint retorna 404 para positionId inexistente
averageScore se calcula correctamente (suma/cantidad de interviews)
Response time <200ms con 100 candidatos y 500 entrevistas
✅ Tests:

Test: GET /positions/1/candidates retorna 200 con array
Test: GET /positions/invalid retorna 404
Test: averageScore se calcula correctamente
Test: currentInterviewStep viene del Application correcto
Cobertura mínima: 85% en candidateService.getPositionCandidates
✅ Código:

Sin any types en TypeScript
Validación de entrada (positionId es UUID válido)
Manejo de errores con try/catch
Respuesta sigue estructura definida
Información de Seguridad y Autenticación
Autenticación requerida: Sí, requiere JWT válido (usar middleware existente en middleware/auth.ts)
Autorización: Solo usuarios con rol recruiter o superior pueden listar candidatos de una posición
Validación: positionId debe ser UUID válido, rechazar si no lo es (400 Bad Request)
Logging: Registrar acceso: "User {userId} accessed position {positionId} candidates"
Out of Scope
❌ Filtros avanzados (por stage, score mínimo, etc.) — será ticket separado
❌ Ordenamiento personalizado — será configuración separada
❌ Búsqueda de candidatos por nombre — será endpoint /positions/:id/candidates?search=
❌ Paginación — si hay muchos candidatos, será mejora posterior
❌ Historial de cambios de etapa — solo estado actual
Estimado
Tamaño: Pequeño (<4 horas)
Complejidad: Baja (queries simples, lógica straightforward)
Desglose:

Implementar servicio + controller: ~1.5h
Crear tests: ~1h
Debugging + ajustes: ~1h
Dependencias
✅ Position model existe
✅ Candidate model existe
✅ Application model existe
✅ Interview model con score existe
✅ Autenticación (middleware/auth.ts) implementada
❌ Bloqueante: Ninguna
