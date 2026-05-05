# Prompt: Red-Green TDD con comentario en Jira

Aplica el ciclo Red-Green TDD para implementar el ticket indicado. El ticket es:
$ARGUMENTS

---

## Fase RED — escribe los tests primero

1. Lee el ticket en Jira con `mcp__claude_ai_Atlassian__getJiraIssue` (cloudId: `1e981a3a-0527-44b4-a26f-0441bbdea145`) para entender los criterios de aceptación.
2. Mueve el ticket a **In Progress** (transitionId: `21`).
3. Crea el archivo de test en `backend/src/__tests__/` cubriendo:
   - El happy path descrito en los criterios de aceptación.
   - Al menos un caso de error (recurso no encontrado, input inválido, etc.).
   - **No implementes nada de lógica de negocio todavía.** Los tests deben importar los módulos que aún no existen o están vacíos.
4. Ejecuta los tests:
   ```bash
   cd backend && npm test -- --no-coverage 2>&1
   ```
5. Verifica que **todos los tests fallan** (rojo). Si alguno pasa por casualidad, revisa que el test realmente valida comportamiento real y no un stub vacío.
6. Añade un comentario en el ticket de Jira con `mcp__claude_ai_Atlassian__addCommentToJiraIssue`:

   - **cloudId:** `1e981a3a-0527-44b4-a26f-0441bbdea145`
   - **issueIdOrKey:** clave del ticket (p.ej. `L1DR-XX`)
   - **contentFormat:** `markdown`
   - **commentBody** con esta estructura:

     ```
     ## 🔴 RED — Tests escritos, implementación pendiente

     **Tests creados:** `<ruta del archivo de test>`

     **Resultado de la ejecución:**
     ```
     <pegar salida completa de npm test>
     ```

     **Tests en rojo:** X de X fallando — correcto, aún no hay implementación.
     ```

---

## Fase GREEN — implementa hasta pasar los tests

7. Implementa el código mínimo necesario para que los tests pasen, capa por capa:
   - `domain/models/` → si hace falta una entidad o método nuevo.
   - `application/services/` → caso de uso.
   - `presentation/controllers/` → controlador HTTP.
   - `routes/` → registro de la ruta.
8. Ejecuta los tests de nuevo:
   ```bash
   cd backend && npm test -- --no-coverage 2>&1
   ```
9. Verifica que **todos los tests pasan** (verde). No continúes si alguno sigue fallando.
10. Verifica que TypeScript compila sin errores:
    ```bash
    cd backend && npx tsc --noEmit 2>&1
    ```
11. Añade un segundo comentario en el ticket de Jira:

    - **contentFormat:** `markdown`
    - **commentBody** con esta estructura:

      ```
      ## 🟢 GREEN — Implementación completa, todos los tests pasan

      **Resultado de la ejecución:**
      ```
      <pegar salida completa de npm test>
      ```

      **Tests en verde:** X de X pasando.

      **Archivos creados / modificados:**
      - `ruta/archivo1.ts`
      - `ruta/archivo2.ts`
      ```

12. Mueve el ticket a **In Review** (transitionId: `31`).

---

## Reglas del ciclo

- **No escribas código de producción antes de tener un test en rojo.** Si te saltas la fase RED, el ciclo no es válido.
- **Implementa solo lo necesario para pasar los tests.** No añadas lógica extra no cubierta por tests.
- **El comentario RED debe existir en Jira antes de empezar la implementación.** Es el registro de que los tests se escribieron primero.
- Si los tests no pueden fallar en rojo (por ejemplo, el módulo ya existe), documéntalo explícitamente en el comentario RED antes de continuar.
