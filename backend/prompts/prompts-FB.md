# Prompts - Franco Borgato

Registro de todas las peticiones realizadas en la sesión actual.

---

## Sesión: 2026-04-30

### Prompt 1
**Petición:** Crea una carpeta dentro de `backend` que contenga un archivo tipo markdown llamado `prompts-FB` en el cual necesito que vayas guardando todas las peticiones que te realice en la actual sesion.

### Prompt 2
**Petición:** Genera un agente especializado en enriquecer tickets de trabajo con las siguientes características: actúa como Product Owner senior con experiencia en metodologías ágiles, debe cumplir criterios INVEST, generar título descriptivo, historia en formato "Como [rol], quiero [acción], para [beneficio]", 3 criterios de aceptación en BDD (Dado que/Cuando/Entonces), estimación de complejidad (S/M/L) y evaluación breve contra INVEST. Se invoca con `/enriquecer-ticket <descripción del ticket>`.

### Prompt 3
**Petición:** `/enriquecer-ticket` — GET /positions/:id/candidates: endpoint que retorna todos los candidatos en proceso para una posición dada, con nombre completo (tabla candidate), current_interview_step (tabla application) y puntuación media del candidato (tabla interview, campo score).

### Prompt 4
**Petición:** Guardar los tickets generados en `backend/tickets.md`.

### Prompt 5
**Petición:** `/enriquecer-ticket` — PUT /candidates/:id/stage: endpoint que actualiza la etapa del candidato, modificando la fase actual del proceso de entrevista en la que se encuentra un candidato específico.

### Prompt 6
**Petición:** Generar un agente con sus skills especializado en desarrollo backend con DDD, Arquitectura Hexagonal, principios SOLID/DRY/CUPID y patrones de diseño (Factory, Strategy, Observer, Repository, Decorator, Result/Either, Unit of Work, CQRS, Saga/Process Manager). Se invoca con `/implementar-ticket <ticket>`.

### Prompt 7
**Petición:** `/implementar-ticket @backend/tickets/ticket-001.md` — Implementar el endpoint `GET /positions/:id/candidates` que expone candidatos en proceso con fase actual y puntuación media.

### Prompt 8
**Petición:** Crear una carpeta en `backend/` con los cambios detallados en un archivo `.md` por cada ticket implementado (archivos generados, funcionalidades, tests, API, etc.).

### Prompt 9
**Petición:** `/implementar-ticket @backend/tickets/ticket-002.md` — Implementar el endpoint `PUT /candidates/:id/stage` que actualiza la fase actual del proceso de entrevista de un candidato.
