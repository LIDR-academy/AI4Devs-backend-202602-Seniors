---
name: refactor-patterns
description: Guide for applying Extract Method / Inline Method and other Fowler refactoring patterns in this TypeScript/Express project. Use when refactoring route handlers, services, or domain models — manual, AI-assisted, or agentic mode.
---

# Refactoring Patterns

## Core Patterns

**Extract Method** — group a block with one identifiable responsibility, name it. Fights long functions, adds intent.

**Inline Method** — eliminate an indirection that adds no clarity. Fights over-abstraction.

## Three Operating Modes

| Mode | When | How |
|------|------|-----|
| **Manual** | 1-file, diff fits in head | IDE rename/extract |
| **Assisted** | 5–50 lines, want review | Cmd+K, Composer |
| **Agentic** | Multi-file, repetitive, tests exist | Claude Code with structured prompt |

**Rule**: larger blast radius → more explicit prompt → more tests before starting.

## Agentic Prompt Template

```
Refactor <function> in <file> applying Extract Method.

Extract these responsibilities as private functions in the same module:
- <_validate_something>: validates <what>
- <_calculate_something>: computes <what>
- <_persist_something>: persists <what>

Constraints:
- Do NOT change the public signature or response contract
- All tests in <test-file> must stay green
- No new dependencies
- Type parameters/returns with existing interfaces; use TypeScript types if none exist
```

## Realistic Example (Express route)

```typescript
// BEFORE — three concerns in one handler
router.post('/candidates', async (req, res) => {
  if (!req.body.firstName || !req.body.email) {
    return res.status(400).json({ error: 'firstName and email required' });
  }
  const candidate = new Candidate(req.body);
  const saved = await candidate.save();
  res.status(201).json(saved);
});

// AFTER — Extract Method: validation + persistence separated
router.post('/candidates', async (req, res) => {
  _validateCandidatePayload(req.body);
  const candidate = await _persistCandidate(req.body);
  res.status(201).json(candidate);
});

function _validateCandidatePayload(body: unknown): void {
  if (!body || typeof body !== 'object') throw new Error('Invalid payload');
  const { firstName, email } = body as Record<string, unknown>;
  if (!firstName || !email) throw new Error('firstName and email required');
}

async function _persistCandidate(data: CandidateCreateInput): Promise<Candidate> {
  const candidate = new Candidate(data);
  return candidate.save();
}
```

## Delegate to Agent When

- Same pattern repeated across multiple handlers/services
- Tests exist that validate external behavior
- You can name the pattern and state the success criterion in one sentence

## Never Delegate When

- Touches public API boundary, DB schema, or inter-team contracts
- No tests — characterize behavior first (write tests, then refactor)
- You cannot articulate the success criterion

## PR Review Checklist (AI-generated diffs)

1. **External behavior unchanged?** — tests pass + manual happy path
2. **Clarity gained?** — extract with no clarity gain = noise with a name
3. **Generic names?** — `processData`, `handleRequest`, `helper1` → red flag, rename or reject
4. **Comments deleted?** — "why" comments are gold; agents drop them silently
5. **Dead code?** — orphaned private functions, unused imports, unused variables

## Project Paths

- Route handlers: `backend/src/routes/`
- Controllers: `backend/src/presentation/controllers/`
- Services: `backend/src/application/services/`
- Domain models: `backend/src/domain/models/`
- Tests: `backend/src/**/*.test.ts`
