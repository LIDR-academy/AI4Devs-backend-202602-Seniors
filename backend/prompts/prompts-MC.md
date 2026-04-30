# Prompts - Mateo Costes (MC)

## Conversacion 1

**Prompt 1:**
> crea una carpeta prompts, junto con un archivo prompts-MC.md dentro de backend. En el mismo se deben almacenar todos los prompts de la conversacion

**Prompt 2:**
> Necesito que generes un agente especializado en enriquecer tickets de trabajo, junto con las skills necesarias para realizar dicha tarea, siguiendo los siguientes criterios:
>
> Actúa como un Product Owner senior con experiencia en metodologías ágiles.
>
> Debe cumplir los criterios INVEST.
> Título descriptivo
> Historia en formato "Como [rol], quiero [acción], para [beneficio]"
> 3 criterios de aceptación en formato BDD (Dado que/Cuando/Entonces)
> Estimación de complejidad (S/M/L)
> Evaluación breve contra INVEST
>
> La forma de invocar al agente es mencionandolo con /nombre-agente y la descripcion del ticket sin enriquecer

**Prompt 3:**
> /enrich-ticket GET /positions/:id/candidates
> Este endpoint recogerá todos los candidatos en proceso para una determinada posición, es decir, todas las aplicaciones para un determinado positionID. Debe proporcionar la siguiente información básica:
>
> Nombre completo del candidato (de la tabla candidate).
>
> current_interview_step: en qué fase del proceso está el candidato (de la tabla application).
>
> La puntuación media del candidato. Recuerda que cada entrevista (interview) realizada por el candidato tiene un score

**Prompt 4:**
> Crea una carpeta en backend donde almacenar los tickets.

**Prompt 5:**
> /enrich-ticket PUT /candidates/:id/stage
> Este endpoint actualizará la etapa del candidato movido. Permite modificar la fase actual del proceso de entrevista en la que se encuentra un candidato específico.

**Prompt 6:**
> Necesito que generes un agente junto con sus skills, especializado en el desarrollo de aplicaciones backend siguiendo los siguientes criterios y buenas practicas:
> Domain-Driven Design (DDD)
> Arquitectura Hexagonal (Ports & Adapters)
> Principios SOLID, DRY y CUPID
> Patrones de diseño (con criterio):
> Factory
> Strategy
> Observer
> Repository
> Decorator
> Result / Either type
> Unit of Work
> CQRS
> Saga / Process Manager
>
> Se invoca con /nombre-agente <ticket>.

**Prompt 7:**
> /backend-dev @backend/tickets/ticket-get-position-candidates.md

**Prompt 8:**
> agrega una carpeta en el backend con los cambios de cada ticket, con un archivo .md por cada uno. Incluir en cada archivo cómo testear el ticket con ejemplos de endpoint.

**Prompt 9:**
> Al correr el endpoint http://localhost:3010/positions/1/candidates aparece un error de tabla no existente en DB. Se proveen datos de prueba en @prisma\seed.ts. Una vez resuelto, el caso 1 devuelve 3 candidatos (no 2), el caso 2 da 404 en lugar de 200 vacío, el caso 3 da 404 correctamente y el caso 4 da 400 correctamente.

**Prompt 10:**
> perfecto. vamos con el siguiente ticket. /backend-dev @tickets\ticket-put-candidate-stage.md

**Prompt 11:**
> Al probar PUT /candidates/1/stage con currentInterviewStep 2, el endpoint devuelve la application de positionId 2 en lugar de positionId 1. Se pide explicación del endpoint y por qué funciona para Jane y Carlos pero no refleja el cambio para John al consultar /positions/1/candidates.
