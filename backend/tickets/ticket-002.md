## TICKET-002 · 2026-04-30

## Título
Actualizar la fase de entrevista de un candidato en proceso

## Historia de Usuario
Como **recruiter o hiring manager**, quiero modificar la fase actual del proceso de entrevista en la que se encuentra un candidato, para **reflejar con precisión su avance en el pipeline y mantener el estado del proceso sincronizado para todo el equipo**.

## Criterios de Aceptación

**CA-1:**
- **Dado que** existe un candidato válido (`candidateId`) con una aplicación activa en el sistema
- **Cuando** se realiza `PUT /candidates/:id/stage` con un body que contiene la nueva `stage` (fase válida del proceso)
- **Entonces** la respuesta es HTTP 200, el campo `currentInterviewStep` de la aplicación se actualiza en base de datos y la respuesta incluye el estado actualizado del candidato

**CA-2:**
- **Dado que** se envía una `stage` que no corresponde a ninguna fase válida definida en el proceso de entrevista
- **Cuando** se realiza `PUT /candidates/:id/stage`
- **Entonces** la respuesta es HTTP 400 con un mensaje de error descriptivo indicando que la fase no es válida, sin modificar el estado del candidato

**CA-3:**
- **Dado que** el `candidateId` proporcionado no existe en el sistema, o el candidato no tiene una aplicación activa
- **Cuando** se realiza `PUT /candidates/:id/stage`
- **Entonces** la respuesta es HTTP 404 con un mensaje descriptivo, sin realizar ninguna modificación en base de datos

## Estimación de Complejidad

| Campo | Detalle |
|-------|---------|
| **Tamaño** | S |
| **Justificación** | Es una operación de escritura acotada sobre un único registro en la tabla `application`; la validación de la fase es la única lógica de negocio relevante y el esquema está definido. |

## Evaluación INVEST

| Criterio | Estado | Observación |
|----------|--------|-------------|
| **I**ndependiente | ✅ | No bloquea ni depende de otras historias; puede desarrollarse en paralelo al TICKET-001. |
| **N**egociable | ⚠️ | La lista de fases válidas debe acordarse con el equipo antes del desarrollo; sin esa definición el criterio de validación queda abierto. |
| **V**aliosa | ✅ | Mantener el pipeline actualizado es crítico para la toma de decisiones del equipo de selección. |
| **E**stimable | ✅ | Alcance claro; el único punto de incertidumbre (fases válidas) es identificable y resoluble en refinamiento. |
| **S**mall | ✅ | Una sola operación PUT sobre un campo de un registro; cabe sin problema en un sprint. |
| **T**esteable | ✅ | Los tres criterios tienen precondiciones, acciones y resultados verificables mediante tests de integración. |

> **Leyenda:** ✅ Cumple plenamente · ⚠️ Cumple parcialmente (requiere atención) · ❌ No cumple (bloquea el refinamiento)