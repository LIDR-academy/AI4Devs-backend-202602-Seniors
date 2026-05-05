# Sprint Agent

Agente que implementa tickets de Jira en modo casi-automático usando la API de Claude y MCP.

```
Sprint arranca
      ↓
Agente lee CLAUDE.md + tickets del sprint (Jira MCP)
      ↓
¿Quedan tickets? ──no──→ Fin
      ↓ sí
Lee ticket completo (título, AC, contexto)
      ↓
🔴 Genera tests (RED) → ejecuta → confirma rojo
      ↓
🟢 Implementa código (GREEN) → ejecuta → confirma verde
      ↓
📬 Abre PR + comenta en Jira + mueve ticket a "In Review"
      ↓
(siguiente ticket)
```

**El humano solo aprueba el PR.**

---

## Setup

### 1. Variables de entorno

```bash
cp .env.example .env
# Edita .env con tus credenciales
```

| Variable | Descripción |
|---|---|
| `ANTHROPIC_API_KEY` | API key de Anthropic |
| `JIRA_MCP_URL` | `https://mcp.atlassian.com/v1/mcp` |
| `JIRA_TOKEN` | Atlassian API token (Settings → API tokens) |
| `JIRA_PROJECT_KEY` | `L1DR` |
| `GITHUB_REPO` | `LIDR-academy/AI4Devs-backend-202602-Seniors` |

### 2. Instalar dependencias

```bash
cd sprint-agent
npm install
```

### 3. Ejecutar

```bash
# Procesa todos los tickets "To Do" del sprint activo
npm start

# Procesa un solo ticket (ideal para demo en clase)
TICKET_ID=L1DR-13 npm start

# Con output detallado del agente
VERBOSE=true TICKET_ID=L1DR-13 npm start
```

---

## GitHub Actions

El agente también se puede ejecutar desde la pestaña **Actions** de GitHub sin instalar nada:

1. Ve a `Actions` → `Sprint Agent — TDD Auto-implementation`
2. Click `Run workflow`
3. (Opcional) Introduce un `ticket_id` para procesar solo uno
4. Activa `verbose` para ver el output completo del agente

**Secrets necesarios en el repo** (Settings → Secrets → Actions):
- `ANTHROPIC_API_KEY`
- `JIRA_MCP_URL`
- `JIRA_TOKEN`

---

## Lo que hace el agente por cada ticket

| Fase | Acción | Verificación |
|---|---|---|
| 🔴 RED | Escribe tests unitarios | Tests deben **fallar** |
| 🟢 GREEN | Implementa código mínimo | Tests deben **pasar** |
| 📬 PR | Abre PR con descripción completa | Link en consola |
| 💬 Jira | Comenta con resumen + tests | Ticket en "In Review" |

---

## Estructura de archivos

```
sprint-agent/
├── src/
│   ├── index.ts      ← Entry point y loop principal
│   ├── agent.ts      ← Llamadas a Claude API + MCP
│   ├── prompts.ts    ← Prompts por fase (RED, GREEN, PR)
│   └── types.ts      ← Interfaces TypeScript
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```
