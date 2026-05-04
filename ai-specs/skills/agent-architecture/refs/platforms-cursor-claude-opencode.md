# Cursor, Claude Code, OpenCode — mapping

Authoritative product docs change; treat URLs as starting points and confirm in your installed version.

## Cursor

- **Skills:** Project `.cursor/skills/<skill-name>/SKILL.md`; user `~/.cursor/skills/`. Frontmatter `name` + `description` drive discovery.
- **Rules:** `.cursor/rules/*.mdc` for persistent guidance; `AGENTS.md` at repo root is widely honored for agent behavior.
- **MCP:** `.cursor/mcp.json` in project (or editor settings per team policy).
- **Goal:** Same architectural patterns expressed as skills + rules; subagent behavior depends on Cursor product features available in your build.

## Claude Code

- **Skills:** `.claude/skills/<skill-name>/SKILL.md` and user-level `~/.claude/skills/`; progressive disclosure loads body when relevant.
- **Agents / subagents:** `.claude/agents/*.md` with frontmatter (`description`, tools, optional `skills`, etc.). Subagents isolate context; some flows use `context: fork` in skills — see current Claude Code docs.
- **Project memory:** `CLAUDE.md` or `.claude/CLAUDE.md`.
- **MCP / plugins:** Per project and Anthropic docs for wiring servers.

## OpenCode

- **Config merge:** Multiple sources combine; later overrides earlier for conflicting keys. Typical order includes remote → `~/.config/opencode/opencode.json` → project `opencode.json` → `.opencode/` trees — see [OpenCode config](https://open-code.ai/docs/en/config).
- **Schema:** `https://opencode.ai/config.json` in editor for validation.
- **Skills:** `.opencode/skills/<skill-name>/SKILL.md` and `~/.config/opencode/skills/`. Some teams also keep skills under `.claude/skills/` for reuse; OpenCode may discover both depending on version — prefer one canonical project tree to avoid drift.
- **Agents:** Either `agent` entries inside `opencode.json` / `opencode.jsonc` or markdown under `.opencode/agents/` (or user config `~/.config/opencode/agents/`).
- **Instructions:** `instructions` array in config can reference repo files, including globs such as `.cursor/rules/*.md`, so OpenCode can consume Cursor rules without duplicating prose.
- **MCP:** `mcp` key in `opencode.json` (project-level for repo-specific servers).
- **Permissions:** `permission` map (e.g. `edit`, `bash` → `ask`) for tool-level gates aligned with HITL-style workflows.
- **CLI:** `opencode run` for non-interactive batches; this repo’s Ralph scripts support `-a opencode` alongside `claude` and `cursor`.

## Cross-surface packaging tip

Keep **one** narrative spec (patterns, handoffs, HITL list) in version control; generate or symlink surface-specific stubs if needed so Cursor, Claude Code, and OpenCode do not diverge on semantics.

## Repo-local note (skills project)

`AGENTS.md` documents MCP setup differences for OpenCode vs Cursor for this repository. Ralph drivers: `scripts/ralph-once.sh` / `afk-ralph.sh` with `--agent claude|cursor|opencode`.
