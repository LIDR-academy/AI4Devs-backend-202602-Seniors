# Regla: TDD Red → Green

Todo desarrollo en este proyecto sigue el ciclo TDD estricto. No se escribe código de producción sin un test en rojo previo.

---

## Fase RED — tests primero

1. Lee los criterios de aceptación del ticket.
2. Si hay un nuevo endpoint, actualiza `backend/api-spec.yaml` con el contrato completo (path, method, request body, responses 200/201/400/404/500) **antes de escribir código**.
3. Escribe los tests en `backend/src/__tests__/` cubriendo happy path y todos los edge cases de la tabla siguiente. Sin implementación todavía.
4. Ejecuta: `cd backend && npm test -- --no-coverage 2>&1`
5. Verifica que **todos fallan**. Si alguno pasa sin implementación, el test no está validando comportamiento real — corrígelo.
6. Comenta en el ticket de Jira con `mcp__claude_ai_Atlassian__addCommentToJiraIssue`:

```
contentFormat: markdown
## 🔴 RED — Tests escritos, implementación pendiente
**Archivo de test:** `<ruta>`
**Resultado:**
<salida completa de npm test>
Tests en rojo: X de X — correcto, aún no hay implementación.
```

## Fase GREEN — implementación mínima

7. Implementa el código mínimo para pasar los tests, capa por capa (de dentro hacia afuera):
   - `domain/models/` → entidad o método si hace falta
   - `application/services/` → caso de uso
   - `presentation/controllers/` → controlador HTTP
   - `routes/` → registro de la ruta
8. Ejecuta los tests hasta que todos pasen.
9. Verifica compilación sin errores: `cd backend && npx tsc --noEmit`
10. Comenta en el ticket:

```
## 🟢 GREEN — Todos los tests pasan
**Resultado:**
<salida completa de npm test>
Tests en verde: X de X.
**Archivos creados/modificados:** <lista>
```

11. Mueve el ticket a `In Review` (transitionId: `31`).

---

## Edge cases obligatorios por tipo de endpoint

| Tipo          | Edge cases mínimos a cubrir                                                           |
|---------------|---------------------------------------------------------------------------------------|
| `GET /:id`    | recurso no encontrado (404), ID con formato inválido (400), ID negativo (400)         |
| `GET /` lista | lista vacía `[]` (200), paginación fuera de rango                                    |
| `POST`        | body vacío (400), campos requeridos ausentes (400), duplicado si aplica (409)         |
| `PUT /:id`    | recurso no encontrado (404), body inválido (400), actualización parcial sin efecto    |
| `DELETE /:id` | recurso no encontrado (404), recurso con dependencias (409 o cascade)                 |
| Todos         | error interno simulado (500), tipos de dato incorrectos en campos numéricos/fecha (400) |

---

## Reglas invariantes

- El comentario 🔴 RED debe existir en Jira **antes** de empezar la implementación.
- Un ticket no avanza a `In Review` si `tsc --noEmit` reporta errores.
- Implementa solo lo necesario para pasar los tests — sin lógica extra no cubierta.
- Si los tests no pueden fallar en rojo (módulo ya existe), documéntalo en el comentario RED antes de continuar.
