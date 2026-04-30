# Ticket: GET /positions/:id/candidates

## Título
Consultar candidatos en proceso con puntuación media por posición

## Historia de Usuario
Como reclutador de la plataforma,
quiero obtener la lista de candidatos activos para una posición específica junto con su fase de entrevista actual y puntuación media,
para tomar decisiones informadas sobre el avance de cada candidato en el proceso de selección.

## Criterios de Aceptación (BDD)

**Escenario 1:** Consulta exitosa de candidatos para una posición con aplicaciones activas
- **Dado que** existe una posición con `id` válido y tiene al menos una aplicación registrada
- **Cuando** se realiza una petición `GET /positions/:id/candidates`
- **Entonces** el sistema responde con HTTP 200 y un array de objetos, cada uno con `fullName` (nombre completo del candidato), `currentInterviewStep` (fase actual del proceso) y `averageScore` (media de los scores de todas las entrevistas realizadas por ese candidato para esa aplicación)

**Escenario 2:** Candidato sin entrevistas realizadas
- **Dado que** una aplicación existe para la posición pero el candidato no tiene ninguna entrevista registrada con score
- **Cuando** se realiza una petición `GET /positions/:id/candidates`
- **Entonces** el candidato aparece en la respuesta con `averageScore` igual a `null` (o `0`, según decisión de negocio acordada) y los demás campos correctamente informados

**Escenario 3:** Posición inexistente o sin candidatos
- **Dado que** el `id` proporcionado no corresponde a ninguna posición existente, o la posición existe pero no tiene aplicaciones
- **Cuando** se realiza una petición `GET /positions/:id/candidates`
- **Entonces** el sistema responde con HTTP 404 si la posición no existe, o HTTP 200 con un array vacío `[]` si la posición existe pero no tiene candidatos

## Estimación de Complejidad
**Talla:** S

**Justificación:** El endpoint requiere una consulta SQL con JOINs entre tres tablas (`candidate`, `application`, `interview`) y un agregado `AVG` sobre los scores, sin lógica de negocio compleja. No hay dependencias externas ni incertidumbre técnica relevante. El esquema de datos parece ya definido, por lo que el esfuerzo se concentra en la query y el mapeo de respuesta, estimable en menos de 2 días.

| Talla | Criterio |
|-------|----------|
| S | Cambio acotado, bajo riesgo, sin dependencias externas, menos de 2 días |
| M | Complejidad moderada, alguna incertidumbre o dependencia, 2–5 días |
| L | Alta complejidad, múltiples dependencias o incertidumbre técnica, más de 5 días |

## Evaluación INVEST

| Criterio | Cumple | Observación |
|----------|--------|-------------|
| **I**ndependiente | ✅ | No depende de otros tickets; las tablas involucradas ya existen |
| **N**egociable | ⚠️ | El valor de `averageScore` cuando no hay entrevistas (`null` vs `0`) debe acordarse con el equipo antes de implementar |
| **V**aliosa | ✅ | Habilita al reclutador a monitorizar el pipeline de candidatos desde una sola llamada |
| **E**stimable | ✅ | Alcance claro, tablas conocidas, sin ambigüedad técnica relevante |
| **S**mall (pequeña) | ✅ | Acotada a un único endpoint de lectura con lógica de agregación simple |
| **T**esteable | ✅ | Escenarios BDD bien definidos y verificables con datos de prueba en BD |

**Resumen INVEST:** El ticket está prácticamente listo para sprint; el único ajuste previo recomendado es resolver el comportamiento de `averageScore` cuando no existen entrevistas, para evitar ambigüedad durante la implementación.
