---
name: install-openspec
description: Installs OpenSpec for Claude Code if openspec/ is absent, then writes openspec/config.yaml adapted to the actual stack. Triggered by bootstrap command or Phase 1 orchestration.
---

# Skill: install-openspec

## Idempotency Check

```bash
if [ -d "openspec" ]; then
  echo "OpenSpec already installed — skipping directory creation."
  exit 0
fi
```

If `openspec/` already exists, skip to **Config Validation** step only.

## Installation Steps (Claude Code variant)

OpenSpec is a spec-driven development framework managed as a directory in the repo.

1. Create directory structure:
   ```
   openspec/
   ├── config.yaml
   ├── specs/          ← active specs (one subdirectory per feature)
   └── archive/        ← completed specs
   ```

2. The `/opsx:` slash commands are defined in `openspec/config.yaml` and invoked by the `openspec-analyst` agent. They are conventions, not CLI binaries — the agent interprets them as workflow steps.

## Config Writing

Detect the following values before writing (read from actual project files):
- Node.js version: check `.nvmrc`, `package.json#engines.node`, or note "LTS (unspecified)"
- TypeScript version: `backend/package.json#devDependencies.typescript`
- Express version: `backend/package.json#dependencies.express`
- Prisma version: `backend/package.json#dependencies.@prisma/client`
- Jest version: `backend/package.json#devDependencies.jest`
- React version: `frontend/package.json#dependencies.react`

Write `openspec/config.yaml` with all substitutions applied (see Phase 1 template in the orchestrator prompt). Do NOT copy the template literally — substitute the real values.

## Verification

After writing, confirm:
- `openspec/config.yaml` is valid YAML (no syntax errors)
- `schema: spec-driven` is present
- `testing.framework` is `Jest`
- `testing.coverage` is `">=80%"`
- The detected versions appear in the `context:` block
