# Prompt: Crear el slash command /enrich-ticket

Crea el archivo `.claude/commands/enrich-ticket.md` en la raíz del repositorio con exactamente el siguiente contenido:

---

```markdown
Actúa como un Product Owner senior con amplia experiencia en metodologías ágiles (Scrum principalmente) . Tu tarea es enriquecer el siguiente ticket de trabajo aplicando las mejores prácticas de escritura de historias de usuario.

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

| Talla | Criterio |
|-------|----------|
| S | Cambio acotado, bajo riesgo, sin dependencias externas, menos de 2 días |
| M | Complejidad moderada, alguna incertidumbre o dependencia, 2–5 días |
| L | Alta complejidad, múltiples dependencias o incertidumbre técnica, más de 5 días |

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
```

---

Una vez creado el archivo, confirma la ruta `.claude/commands/enrich-ticket.md` y muestra un ejemplo de uso:

```
/enrich-ticket Añadir endpoint GET /positions/:id/candidates que devuelva nombre completo, paso actual de entrevista y puntuación media de cada candidato asociado a esa posición.
```
