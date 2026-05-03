---
name: pr-summary
description: Generates PR.md at the repo root with seven mandatory sections. Called from the finalize command after docs/report.md is written.
---

# Skill: pr-summary

## Output

Write `PR.md` at the repo root. Overwrite if it exists.

## Required Sections (in order)

### 1. Project Fact-Sheet

Short table: name, stack, runtime, DB, ports.

```markdown
## Project Fact-Sheet

| Item | Value |
|---|---|
| Name | LTI Talent Tracking System |
| Backend | Express 4 + TypeScript 4.9 + Prisma 5 |
| Frontend | React 18 + TypeScript |
| Runtime | Node.js LTS |
| Database | PostgreSQL (docker-compose) |
| Backend port | 3010 |
| Frontend port | 3000 |
| DB port | `$DB_PORT` (default 5432) |
```

### 2. Usage by Third Parties

Steps to clone, install, run, and test.

```markdown
## Usage

\`\`\`bash
git clone <repo-url>
cd <repo>
cp .env.example .env           # fill DB_USER, DB_PASSWORD, DB_NAME, DB_PORT
docker-compose up -d           # start PostgreSQL
cd backend && npm install && npx prisma migrate deploy && npm run dev
# in a separate terminal:
cd frontend && npm install && npm start
# run tests:
cd backend && npm test
\`\`\`
```

### 3. Folder Structure

Table: path → purpose. Include all top-level paths and key `backend/src/` subdirs.

### 4. Functionality & Changes

Two subsections:
- **Existing functionality** — candidate CRUD, file upload
- **Changes added** — `GET /api/v1/positions/:id/candidates` and `PUT /api/v1/candidates/:id/stage` with brief description of each

### 5. Actions Taken

Chronological bullet list of Phases 0–5. One bullet per phase/step. No code.

### 6. Results

- Artifacts produced (list paths)
- Test outcomes: X passed, Y failed (read from `docs/report.md`)
- TypeScript compilation: pass/fail

### 7. Conclusions

2–3 bullets: what was achieved, what to do next (e.g. add authentication, expand test coverage, add remaining domain endpoints).

## Language

All content in English.
