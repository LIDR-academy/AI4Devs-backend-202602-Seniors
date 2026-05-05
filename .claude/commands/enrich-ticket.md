Actúa como un Product Owner senior con amplia experiencia en metodologías ágiles (Scrum, Kanban, SAFe). Tu tarea es enriquecer el siguiente ticket de trabajo aplicando las mejores prácticas de escritura de historias de usuario.

Ticket a enriquecer:
$ARGUMENTS

---

Genera el ticket enriquecido con exactamente esta estructura:

## Título
Un título descriptivo, conciso y orientado al valor de negocio (máximo 10 palabras).

## Historia de Usuario
Como [rol específico del usuario],
quiero [acción concreta que desea realizar],
para [beneficio o valor de negocio que obtiene].

## Criterios de Aceptación (BDD)

**Escenario 1:** [nombre descriptivo]
- **Dado que** [contexto inicial / precondición]
- **Cuando** [acción que ejecuta el usuario]
- **Entonces** [resultado esperado / comportamiento del sistema]

**Escenario 2:** [nombre descriptivo]
- **Dado que** [contexto inicial / precondición]
- **Cuando** [acción que ejecuta el usuario]
- **Entonces** [resultado esperado / comportamiento del sistema]

**Escenario 3:** [nombre descriptivo]
- **Dado que** [contexto inicial / precondición]
- **Cuando** [acción que ejecuta el usuario]
- **Entonces** [resultado esperado / comportamiento del sistema]

## Estimación de Complejidad
**Talla:** [S / M / L]

**Justificación:** [2-3 oraciones explicando por qué se eligió esa talla, considerando esfuerzo técnico, incertidumbre y dependencias]

## Evaluación INVEST

| Criterio | Cumple | Observación |
|----------|--------|-------------|
| **I**ndependiente | ✅ / ⚠️ / ❌ | [breve nota] |
| **N**egociable | ✅ / ⚠️ / ❌ | [breve nota] |
| **V**aliosa | ✅ / ⚠️ / ❌ | [breve nota] |
| **E**stimable | ✅ / ⚠️ / ❌ | [breve nota] |
| **S**mall (pequeña) | ✅ / ⚠️ / ❌ | [breve nota] |
| **T**esteable | ✅ / ⚠️ / ❌ | [breve nota] |

**Resumen INVEST:** [1-2 oraciones indicando si el ticket está listo para sprint o necesita ajustes antes de comprometerse.]

---

> **Referencia interna — no incluir en el ticket:**
> Usa esta tabla únicamente para determinar la talla. No la escribas en la descripción del ticket.
>
> | Talla | Criterio |
> |-------|----------|
> | S | Cambio acotado, bajo riesgo, sin dependencias externas, menos de 2 días |
> | M | Complejidad moderada, alguna incertidumbre o dependencia, 2–5 días |
> | L | Alta complejidad, múltiples dependencias o incertidumbre técnica, más de 5 días |
