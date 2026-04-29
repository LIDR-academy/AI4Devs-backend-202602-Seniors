# Repository Snapshot
| Item | Status | Evidence |
|---|---|---|
| Runtime stack | Node.js + Express + TypeScript + Prisma + PostgreSQL | package.json, index.ts, schema.prisma |
| Entry point | Express app initialized in index.ts on port 3010 | index.ts |
| Backend layers present | application, domain, presentation, routes | src |
| Infrastructure layer | Not found (despite README mention) | src, README.md |
| Tests folder/files | Not found | jest.config.js, src |
| Build status | Compiles successfully (tsc exit 0) | package.json |
| Prisma status | Schema valid, migrations up to date in configured DB | schema.prisma, migrations |
| API contract artifact | OpenAPI file exists but incomplete vs implementation | api-spec.yaml, candidateRoutes.ts, index.ts |