# Prompts utilizados — AI4Devs Backend Exercise

## 1. Análisis de estructura del proyecto

**Momento:** Inicio del ejercicio, antes de escribir ningún código.

**Objetivo:** Obtener un mapa completo de la arquitectura existente para poder contribuir de forma consistente sin romper convenciones.

**Prompt:**
> Analiza la estructura del proyecto backend.
>
> Explícame:
> - Cómo están organizadas las capas (routes, controllers, services, repositories, etc.)
> - Dónde debería vivir la lógica de negocio para nuevos endpoints
> - Qué convenciones de naming y estructura sigue el proyecto
>
> No propongas cambios, solo describe lo que ya existe.

---

## 2. Análisis del dominio

**Momento:** Tras entender la arquitectura, antes de diseñar nada.

**Objetivo:** Comprender las entidades relevantes, sus relaciones y qué datos serían necesarios para el endpoint objetivo, sin asumir nada del modelo de datos.

**Prompt:**
> Analiza el dominio relacionado con candidates, applications e interviews.
>
> Explícame:
> - Qué representa cada entidad
> - Cómo se relacionan entre sí
> - Qué datos necesito para construir el endpoint GET /positions/:id/candidates
>
> No generes código todavía.

---

## 3. Diseño del endpoint GET /positions/:id/candidates

**Momento:** Con el dominio claro, antes de implementar. Fase de diseño explícito.

**Objetivo:** Acordar la estructura de capas, responsabilidades y queries antes de escribir código, para validar el enfoque y evitar retrabajo.

**Prompt:**
> Diseña la implementación del endpoint GET /positions/:id/candidates.
>
> Incluye:
> - Qué capas intervienen (controller, service, repository)
> - Qué responsabilidades tiene cada una
> - Qué queries o accesos a datos serán necesarios
> - Cómo se calcula la media de score de interviews
>
> No escribas código completo, solo estructura y flujo.

---

## 4. Implementación del endpoint GET /positions/:id/candidates

**Momento:** Tras validar el diseño. Primera implementación real.

**Objetivo:** Generar el código siguiendo la arquitectura existente, con funciones pequeñas y responsabilidades claras. Las restricciones explícitas evitan over-engineering y guían el nivel de abstracción correcto.

**Prompt:**
> Implementa el endpoint GET /positions/:id/candidates siguiendo la arquitectura existente del proyecto.
>
> Requisitos:
> - Mantener la separación de responsabilidades existente
> - No introducir nuevas capas ni patrones innecesarios
> - Usar funciones pequeñas con intención clara (Extract Method)
>
> Separa al menos:
> - calculateAverageScore
> - mapApplicationToCandidateResponse
>
> No cambies el contrato de respuesta esperado.

---

## 5. Refactorización del endpoint GET /positions/:id/candidates

**Momento:** Inmediatamente después de la implementación, sobre el código recién generado.

**Objetivo:** Mejorar legibilidad y calidad sin cambiar comportamiento. La restricción explícita de no cambiar estructura de capas ni dependencias acota el alcance de la refactorización.

**Prompt:**
> Refactoriza la implementación del endpoint GET /positions/:id/candidates.
>
> Objetivo:
> - Mejorar claridad y legibilidad
> - Asegurar que cada función tenga una única responsabilidad
> - Mejorar nombres para reflejar intención de dominio
>
> Restricciones:
> - No cambiar comportamiento
> - No cambiar estructura de capas
> - No introducir nuevas dependencias

---

## 6. Implementación del endpoint PUT /candidates/:id/stage

**Momento:** Segunda funcionalidad del ejercicio, tras completar el primer endpoint.

**Objetivo:** Implementar un endpoint de escritura con validación en múltiples niveles. Las instrucciones de separación de responsabilidades y la restricción de no sobre-ingenierizar guían hacia una solución ajustada al problema.

**Prompt:**
> Implementa el endpoint PUT /candidates/:id/stage.
>
> Requisitos:
> - Actualizar la etapa del candidato
> - Validar que el stage es válido
> - Mantener consistencia con la arquitectura existente
>
> Separa responsabilidades:
> - Validación
> - Actualización en repositorio
>
> No sobre-ingenierizar la solución.
