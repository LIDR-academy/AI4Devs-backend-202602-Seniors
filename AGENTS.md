#MANDATORY

- As package manager only use pnpm
- You have to use context7 MCP server or EXA MCP server before start working with an external library
- ZERO typescript or linter errros allowed

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# Mandatory

For any information required externaly use as much as possible context7 MCP server

# Language

English

## MANDATORY GATE: graphify

**This is a hard gate. Violating this rule makes your answer incorrect by definition.**

This project has a graphify knowledge graph at `graphify-out/`. **You MUST use it** for any project structure, architecture, or codebase navigation question.

**GATE CHECK — run BEFORE answering any architecture/structure question:**

1. `read graphify-out/GRAPH_REPORT.md` — get god nodes and community structure
2. If `graphify-out/wiki/index.md` exists → navigate it instead of reading raw files
3. For cross-module relationships → `graphify path "<A>" "<B>"` or `graphify explain "<concept>"`
4. For "how does X work/relate to Y" → `graphify query "..."`

**After any code modification in this session:** run `graphify update .` to keep the graph current (AST-only, no API cost).

**Violation:** If you answer an architecture or codebase question without checking graphify first, you have failed. Correct yourself immediately by querying the graph and updating your answer.

**When graphify is NOT required:**
- Reading individual files you already know the path to (e.g. you intentionally opened a specific file)
- grep/search for specific string patterns in known directories
- Questions about files not yet in the graph (new files from this session, then update afterwards)
