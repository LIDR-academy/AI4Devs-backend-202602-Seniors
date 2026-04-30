Actúa como un ingeniero de software senior especializado en arquitecturas backend limpias y evolutivas. Tu tarea es implementar el siguiente ticket aplicando con criterio las mejores prácticas de la industria.

Ticket a implementar:
$ARGUMENTS

---

## Contexto del proyecto

Stack tecnológico: **TypeScript · Node.js · Express · Prisma ORM**

Estructura de carpetas existente en `backend/src/`:
```
presentation/controllers/   ← Adaptadores de entrada (HTTP): parsean request, llaman al servicio, formatean response
application/services/       ← Casos de uso / lógica de aplicación: orquestan dominio y repositorios
domain/models/              ← Entidades y reglas de negocio puras, sin dependencias externas
routes/                     ← Registro de rutas Express
```

Modelos de dominio disponibles: `Candidate`, `Application`, `Position`, `Interview`, `InterviewStep`, `InterviewFlow`, `InterviewType`, `Company`, `Employee`, `Education`, `WorkExperience`, `Resume`.

El ORM es Prisma. El cliente Prisma (`new PrismaClient()`) se instancia en los modelos de dominio o repositorios y **no** se usa directamente en controladores ni servicios.

---

## Principios de diseño que debes aplicar

### Arquitectura Hexagonal (Ports & Adapters)
- La capa `domain` no conoce Express ni Prisma.
- La capa `application` orquesta dominio y puertos (repositorios), sin lógica HTTP.
- La capa `presentation` solo convierte HTTP ↔ objetos de aplicación.
- Las dependencias apuntan siempre hacia dentro: `presentation → application → domain`.

### Domain-Driven Design (DDD)
- Las entidades encapsulan estado y comportamiento; no son simples DTOs.
- Los nombres reflejan el lenguaje ubicuo del dominio (ubiquitous language).
- Los repositorios son interfaces del dominio, implementados en infraestructura.

### SOLID
- **S**: cada clase/función tiene una única razón de cambio.
- **O**: abierto a extensión (estrategias, decoradores), cerrado a modificación.
- **L**: los subtipos son intercambiables por sus tipos base.
- **I**: interfaces pequeñas y cohesivas; no fuerces dependencias innecesarias.
- **D**: depende de abstracciones, no de implementaciones concretas.

### DRY y CUPID
- Extrae lógica repetida a helpers o servicios reutilizables.
- Escribe código composable, predecible y con responsabilidad única (CUPID).

---

## Patrones de diseño: úsalos solo si aportan valor real

| Patrón | Cuándo aplicarlo |
|--------|-----------------|
| **Repository** | Siempre: abstrae el acceso a datos (Prisma) del dominio |
| **Result / Either** | Cuando una operación puede fallar de forma controlada; evita excepciones como flujo de control |
| **Factory** | Cuando la construcción de una entidad es compleja o tiene variantes |
| **Strategy** | Cuando hay múltiples algoritmos intercambiables para una misma operación |
| **Observer** | Cuando un evento de dominio debe notificar a múltiples consumidores desacoplados |
| **Decorator** | Para añadir comportamiento transversal (logging, caché, validación) sin modificar la clase base |
| **Unit of Work** | Cuando varias operaciones deben confirmarse o revertirse juntas (transacciones) |
| **CQRS** | Cuando lecturas y escrituras tienen modelos o requisitos de escala distintos |
| **Saga / Process Manager** | Cuando una operación de negocio abarca múltiples servicios o pasos compensables |

No añadas un patrón solo para cumplir una lista. Si no simplifica o no resuelve un problema real, omítelo y justifícalo.

---

## Proceso de implementación

Sigue estos pasos en orden:

1. **Analiza el ticket**: identifica qué capa(s) hay que tocar, qué modelos intervienen y qué flujo de datos se necesita.

2. **Diseña antes de codificar**: describe en 2-3 líneas la solución y qué patrones aplicarás (y por qué). Señala si algún patrón de la lista **no** aplica aquí.

3. **Implementa capa por capa** (de dentro hacia afuera):
   - `domain/models/` → entidad o método de dominio si hace falta
   - `application/services/` → caso de uso
   - `presentation/controllers/` → controlador HTTP
   - `routes/` → registro de la nueva ruta

4. **Genera tests unitarios** para el servicio de aplicación: cubre el happy path y al menos un caso de error. Usa Jest (ya configurado).

5. **Valida** que el código compila (`tsc --noEmit`) antes de dar la tarea por terminada.

---

## Formato de salida

Para cada archivo que crees o modifiques, presenta:

```
### 📁 ruta/del/archivo.ts
\`\`\`typescript
// código completo
\`\`\`
**Por qué**: [una línea explicando la decisión de diseño clave]
```

Al finalizar, incluye un resumen con:
- Archivos creados / modificados
- Patrones aplicados y motivo
- Patrones descartados y motivo
- Comando para ejecutar los tests: `npm test`
