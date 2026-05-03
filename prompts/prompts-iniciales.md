# Prompts utilizados - Backend LTI (Endpoints Kanban)

## 🧩 Contexto general

Proyecto basado en un ATS (Applicant Tracking System) donde:

* `Application` es el aggregate root del proceso de selección
* `Candidate` y `Position` son entidades relacionadas
* El estado del proceso (stage) vive en `Application.currentInterviewStep`

Arquitectura aplicada:

* Node.js + Express
* Prisma ORM
* Clean Architecture (controller + service)
* Enfoque DDD

---

## 🔹 Prompt 1 — Generación del endpoint GET /positions/:id/candidates

Actúa como un Senior Backend Engineer experto en Node.js, Express, Prisma y DDD.

Necesito implementar el endpoint:

GET /positions/:id/candidates

Contexto:

* Application es el aggregate root
* Candidate y Position están relacionados a través de Application

Requisitos:

* Validar existencia de Position
* Obtener todas las Applications por positionId
* Incluir datos del candidate (id, firstName, lastName, email)
* Incluir entrevistas (score)
* Calcular averageScore ignorando nulls
* Devolver estructura clara y tipada

Buenas prácticas:

* Separar controller y service
* No lógica en controller
* Código limpio y mantenible

---

## 🔹 Prompt 2 — Mejora de calidad del endpoint GET

Actúa como un Senior Backend Engineer.

Quiero mejorar el endpoint GET /positions/:id/candidates sin cambiar su comportamiento funcional.

Aplica:

* Validación estricta de :id (entero positivo)
* Uso de errores tipados (NotFoundError)
* Simplificación del orderBy
* Mantener misma respuesta JSON

---

## 🔹 Prompt 3 — Generación del endpoint PUT /candidates/:id/stage

Actúa como un Senior Backend Engineer experto en DDD.

Necesito implementar:

PUT /candidates/:id/stage

Contexto clave:

* El stage NO está en Candidate
* El stage está en Application.currentInterviewStep
* Application es el aggregate root

Decisión funcional:

* :id = candidateId
* Body:

  * positionId
  * currentInterviewStep

Requisitos:

* Validar IDs
* Validar existencia de Candidate, Position, InterviewStep
* Buscar Application por candidateId + positionId

Casos:

* No existe → 404
* Más de una → 409
* Existe → actualizar stage

Respuesta:
{
"message": "Stage updated successfully",
"data": {
"applicationId": number,
"candidateId": number,
"positionId": number,
"previousInterviewStep": number,
"currentInterviewStep": number
}
}

---

## 🔹 Prompt 4 — Mejora de calidad del endpoint PUT

Actúa como un Senior Backend Engineer.

Aplica mejoras:

1. Validar que positionId y currentInterviewStep existen en el body
2. Validar que InterviewStep pertenece al InterviewFlow de la Position
3. Mejorar mensajes de error

Sin cambiar arquitectura ni lógica principal.

---

## 🧠 Reflexión IA-first

La IA se ha utilizado en este ejercicio para:

* Entender un código base desconocido rápidamente
* Diseñar endpoints alineados con DDD
* Generar estructura por capas (controller + service)
* Validar decisiones de dominio
* Detectar edge cases (ambigüedad de Application)
* Refinar la calidad del código

La supervisión humana ha sido clave para:

* Corregir decisiones incorrectas de la IA
* Validar el dominio (Application como aggregate root)
* Asegurar consistencia y robustez del sistema
