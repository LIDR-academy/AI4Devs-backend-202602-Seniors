# LTI — AI4Devs Backend · Sprint Agent

## Project context

**LTI (Talent Tracking System)** is a recruitment management app.
Stack: **Node.js + Express + TypeScript + Prisma + PostgreSQL**.

```
backend/src/
├── application/
│   ├── services/         # Business logic (candidateService.ts, positionService.ts…)
│   └── validator.ts      # Input validation helpers
├── domain/
│   └── models/           # Prisma-backed domain entities (Candidate.ts, Position.ts…)
├── presentation/
│   └── controllers/      # HTTP controllers — parse req, call service, return res
├── routes/               # Express route definitions
└── index.ts              # App entry point — Swagger UI served at /api-docs
```

API contract: `backend/api-spec.yaml` (OpenAPI 3.0). **Always update the spec before implementing.**

## Architecture rules

- Layer order: `route → controller → service → domain model`
- No Prisma calls from controllers. Never bypass layers.
- Custom error types: `NotFoundError`, `ValidationError`, `ConflictError`
- TypeScript strict mode — no `any`, no unused vars
- Tests live in `backend/src/**/__tests__/` or `backend/src/**/tests/`

## Git & PR conventions

- Branch naming: `feature/<TICKET_ID>-<slug>`
- Commit format: `feat(backend): <TICKET_ID> <description>`
- PR title: `feat(backend): <TICKET_ID> <description>`
- Never commit `.env` or `settings.local.json`

## Testing

- Framework: Jest + ts-jest
- Run: `cd backend && npm test`
- Unit tests mock Prisma — no real DB needed
- Coverage target: all acceptance criteria covered

## Sprint Agent

This repo is configured with a sprint agent (`sprint-agent/`) that:
1. Reads To Do tickets from the L1DR Jira sprint via MCP
2. For each ticket: generates tests (RED) → implements code (GREEN) → opens PR
3. Comments on the Jira ticket with implementation summary
4. Moves ticket to "In Review"

The human only approves the PR.

Jira project: `L1DR` — https://kuuli.atlassian.net/jira/software/projects/L1DR/boards/182
GitHub repo: `LIDR-academy/AI4Devs-backend-202602-Seniors`
