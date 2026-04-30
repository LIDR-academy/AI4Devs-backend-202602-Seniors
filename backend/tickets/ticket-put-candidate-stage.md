# Ticket: PUT /candidates/:id/stage

## Título
Actualizar etapa de entrevista de un candidato específico

## Historia de Usuario
Como reclutador de la plataforma,
quiero poder actualizar la fase del proceso de entrevista en la que se encuentra un candidato,
para reflejar su progresión real en el pipeline de selección y mantener el estado del proceso sincronizado.

## Criterios de Aceptación (BDD)

**Escenario 1:** Actualización exitosa de la etapa del candidato
- **Dado que** existe un candidato con `id` válido y la nueva etapa proporcionada es válida dentro del flujo de entrevistas definido
- **Cuando** se realiza una petición `PUT /candidates/:id/stage` con el cuerpo `{ "stage": "<nueva_etapa>" }`
- **Entonces** el sistema responde con HTTP 200, actualiza el campo `current_interview_step` en la tabla `application` y devuelve el objeto actualizado con la nueva etapa reflejada

**Escenario 2:** Candidato no encontrado
- **Dado que** el `id` proporcionado en la URL no corresponde a ningún candidato existente
- **Cuando** se realiza una petición `PUT /candidates/:id/stage`
- **Entonces** el sistema responde con HTTP 404 y un mensaje de error descriptivo indicando que el candidato no fue encontrado

**Escenario 3:** Etapa inválida o cuerpo de petición malformado
- **Dado que** el cuerpo de la petición no incluye el campo `stage`, o el valor proporcionado no corresponde a una etapa válida del proceso
- **Cuando** se realiza una petición `PUT /candidates/:id/stage`
- **Entonces** el sistema responde con HTTP 400 y un mensaje de error que indica qué campo es inválido o faltante

## Estimación de Complejidad
**Talla:** S

**Justificación:** La operación es un UPDATE acotado sobre un único campo en la tabla `application`, sin lógica de negocio compleja ni efectos secundarios conocidos. La única incertidumbre menor es si existe validación del catálogo de etapas válidas (enum o tabla auxiliar), lo cual añade un día de trabajo como máximo. No hay dependencias externas y el contrato de la API es claro.

| Talla | Criterio |
|-------|----------|
| S | Cambio acotado, bajo riesgo, sin dependencias externas, menos de 2 días |
| M | Complejidad moderada, alguna incertidumbre o dependencia, 2–5 días |
| L | Alta complejidad, múltiples dependencias o incertidumbre técnica, más de 5 días |

## Evaluación INVEST

| Criterio | Cumple | Observación |
|----------|--------|-------------|
| **I**ndependiente | ✅ | No bloquea ni es bloqueado por otros tickets activos |
| **N**egociable | ⚠️ | Debe acordarse si la validación de etapas válidas es por enum en BD, lista hardcodeada, o tabla de configuración |
| **V**aliosa | ✅ | Permite al reclutador gestionar el avance real del proceso sin intervención manual en base de datos |
| **E**stimable | ✅ | Alcance técnico claro; incertidumbre mínima y acotable |
| **S**mall (pequeña) | ✅ | Una sola operación de escritura sobre un campo concreto |
| **T**esteable | ✅ | Los tres escenarios BDD son verificables con peticiones HTTP y datos controlados |

**Resumen INVEST:** El ticket está listo para sprint una vez se aclare el mecanismo de validación de etapas válidas; ese punto puede resolverse en refinamiento en menos de 15 minutos con el equipo técnico.
