# improve-ticket.md

Requisitos para que un Ticket sea Completamente Desarrollable por IA

## Perspectiva de Jefe de Producto

Como jefe de producto, mi objetivo es maximizar la calidad y velocidad de desarrollo mientras minimizo la necesidad de iteraciones. Un ticket es **completamente desarrollable por IA** cuando contiene la información necesaria para que la máquina tome decisiones técnicas autonomas sin ambigüedades.

---

## 1. **Especificación Clara y No Ambigua**

### ✅ Requisitos:
- **Descripción del problema**: Explica el "por qué" del ticket, no solo el "qué"
- **Criterios de aceptación específicos**: Usa formato "Dado... Cuando... Entonces" (Gherkin)
- **Ejemplos concretos**: Casos de uso, ejemplos de entrada/salida
- **Límites explícitos**: Qué está dentro del scope y qué NO está

### ❌ Rojo:
- "Arreglar el login" ← demasiado vago
- "Hacer que sea más rápido" ← métrica undefined
- "Mejorar UX" ← subjetivo

### ✅ Verde:
- "Cuando el usuario introduce credenciales incorrectas, mostrar error en <200ms con mensaje: 'Email o contraseña inválidos'"
- "El endpoint /candidates debe retornar máximo 100 registros por página con paginación"

---

## 2. **Contexto Técnico Suficiente**

### ✅ Requisitos:
- **Stack confirmado**: Qué lenguajes, frameworks, librerías se deben usar
- **Patrones del proyecto**: Referencias a archivos/ejemplos similares existentes
- **Dependencias/Integraciones**: APIs externas, bases de datos, servicios
- **Restricciones técnicas**: Performance, compatibilidad, seguridad requerida

### Ejemplos de Referencias Útiles:
```
"Sigue el patrón de validación usado en candidateService.ts"
"Usa el mismo componente de modal que en AddPositionModal"
"La autenticación debe usar el middleware de JWT que existe en middleware/auth.ts"
```

---

## 3. **Definición de Éxito Medible**

### ✅ Requisitos:
- **Métricas cuantificables**: Respuesta <300ms, 95% de cobertura de tests
- **Casos de prueba**: Incluir happy path y edge cases
- **Comportamiento esperado**: Qué debe pasar en cada escenario
- **Casos de error**: Cómo manejar fallos, validaciones, límites

### ❌ Rojo:
- "Debe funcionar bien"
- "Tests adecuados"

### ✅ Verde:
- "POST /candidates debe retornar 201 con el objeto creado cuando todos los campos son válidos"
- "Retornar 400 con mensaje de error cuando email ya existe en BD"
- "Cobertura de tests mínima: 80%"

---

## 4. **Datos y Modelos Claros**

### ✅ Requisitos:
- **Esquema de datos**: Campos, tipos, validaciones, relaciones
- **Ejemplos de payload**: JSON de entrada/salida esperados
- **Migraciones necesarias**: Si el esquema BD cambia, especificar
- **Datos de prueba**: Sample data para testing

### Formato Recomendado:
```json
{
  "request": {
    "name": "string (max 255 chars)",
    "email": "string (valid email)",
    "phone": "string (optional, format +55...)"
  },
  "response": {
    "id": "uuid",
    "name": "string",
    "createdAt": "ISO 8601"
  }
}
```

---

## 5. **Scope Definido y Acotado**

### ✅ Requisitos:
- **Una tarea, una responsabilidad**: No mezclar autenticación con validación
- **Tiempo estimado**: Indicar si es pequeño (<4h), mediano (4-16h) o grande (>16h)
- **Dependencias explícitas**: Qué otros tickets bloquean este
- **Out of scope**: Qué NO se incluye (evita sorpresas)

### ❌ Rojo:
- "Implementar todo el sistema de candidatos"

### ✅ Verde:
- "Crear endpoint GET /candidates con paginación, búsqueda por nombre y ordenamiento por fecha. No incluye filtros avanzados (eso es ticket #XXX)"

---

## 6. **Información sobre Arquitectura y Diseño**

### ✅ Requisitos:
- **Ubicación en la estructura**: Qué archivos tocar, dónde crear nuevos
- **Componentes relacionados**: Qué otros módulos interactúan
- **Decisiones de diseño ya tomadas**: "Usaremos useContext para state, no Redux"
- **Links a documentación**: Links a CLAUDE.md, ADRs, docs internas

### ✅ Útil:
```
"Crear nuevo service en backend/application/services/emailService.ts
Similar a fileUploadService.ts pero para emails
Usar nodemailer (ya en package.json)
No tocar la capa de domain"
```

---

## 7. **Consideraciones de Seguridad y Compliance**

### ✅ Requisitos:
- **Autenticación/Autorización**: Quién puede acceder, qué roles
- **Validación de entrada**: Qué se debe sanitizar, límites
- **Secretos/Credenciales**: Dónde se guardan, cómo se manejan
- **Compliance**: GDPR, SOC2, reqs específicas del cliente

### ✅ Ejemplo:
```
"Endpoint requiere autenticación JWT (implementada en middleware/auth.ts)
Solo usuarios con rol 'recruiter' o superior pueden listar candidatos
Input: email debe ser validado con regex XYZ
Logs: registrar quién accedió y cuándo"
```

---

## 8. **Sin Decisiones de Producto Pendientes**

### ❌ Rojo:
- "¿Deberíamos permitir candidatos duplicados?"
- "¿Qué información mostrar en el perfil?"
- "¿Cuántos reintentos para login?"

Estas son decisiones de PO que **deben estar resueltas antes** de pasar el ticket a desarrollo.

### ✅ Verde:
- Decisiones documentadas y consensuadas
- Si hay alternativas, especificar cuál se eligió y por qué

---

## Checklist de Completitud

Antes de pasar un ticket a IA, verifica:

- [ ] **Descripción clara**: Entiendo por qué se hace, no solo qué se hace
- [ ] **Criterios de aceptación**: Cada uno es verificable y específico
- [ ] **Contexto técnico**: Sé qué archivos modificar, qué patrones seguir
- [ ] **Ejemplos concretos**: Tengo datos reales o muestras de entrada/salida
- [ ] **Scope limitado**: Una tarea, no cinco mezcladas
- [ ] **Éxito medible**: Tengo una forma de verificar que está terminado
- [ ] **Sin ambigüedades**: No hay "se vea bien", todo es objetivo
- [ ] **Decisiones resueltas**: No hay "decidir si..." en el ticket

---

## Ejemplo de Ticket ❌ (No listo para IA)

```
Título: Mejorar candidatos

Descripción: Los candidatos no se ven bien en la app.
Necesitamos arreglarlo antes del fin de semana.

Tareas:
- Hacerlo más rápido
- Mejor diseño
- Más funcionalidades
```

---

## Ejemplo de Ticket ✅ (Listo para IA)

```
Título: [API] Implementar paginación en GET /candidates

Descripción:
El endpoint GET /candidates retorna todos los candidatos en una sola llamada.
Para aplicaciones con miles de candidatos, esto causa timeout en el frontend.
Necesitamos paginación para mejorar performance.

Criterios de Aceptación:
1. GET /candidates?page=1&limit=50 retorna objeto con:
   - data: [] (máximo 50 items)
   - total: number (total de candidatos)
   - page: number
   - totalPages: number
2. page=1 por defecto, limit=50 por defecto, máximo 100
3. Si page > totalPages, retornar 400 con mensaje "Invalid page"
4. Response time <300ms con 10k candidatos en BD

Ejemplos:
Request: GET /candidates?page=2&limit=25
Response: {
  "data": [...],
  "total": 1500,
  "page": 2,
  "totalPages": 60
}

Técnica:
- Modificar candidateController.ts
- Usar limit/offset en prisma query (similar a cómo se hace en positions)
- Agregar tests en candidateController.test.ts
- Cobertura mínima: 85%

Out of scope:
- Filtros avanzados (es ticket #523)
- Búsqueda de texto (es ticket #524)
- Ordenamiento (es ticket #525)

Estimado: 4 horas

Dependencias: Ninguna
```

---

## Conclusión

Un ticket es **listo para IA** cuando:

1. Sé exactamente qué hacer (sin interpretar)
2. Tengo contexto técnico para hacerlo bien
3. Puedo verificar que está correcto
4. No hay decisiones de producto pendientes
5. El scope es manejable en una sesión

**El trabajo del Jefe de Producto es convertir ambigüedad en claridad.** Si un ticket requiere "reunión de aclaraciones", no está listo. La IA es una herramienta que acelera ejecución, no que resuelve ambigüedades.
