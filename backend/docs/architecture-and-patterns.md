# Architecture and Patterns
| Pattern / Concern | Evidence | Purpose | Current Impact |
|---|---|---|---|
| Layered structure (route -> service/domain) | candidateRoutes.ts, candidateService.ts, Candidate.ts | Separate transport, business, and persistence logic | Partially effective; only candidate flow wired end-to-end |
| Active Record style domain models (save/findOne in entity classes) | Candidate.ts, Position.ts | Encapsulate persistence behavior per entity | Works for CRUD primitives but duplicates PrismaClient creation and limits repository abstraction |
| Service layer validation before persistence | candidateService.ts, validator.ts | Centralize business validation | Present for candidate creation only |
| Manual request validation via regex/helpers | validator.ts | Input quality gate | Inconsistent with OpenAPI and seed data constraints |
| Error handling via try/catch per route | candidateRoutes.ts, candidateController.ts | Convert exceptions to HTTP responses | Mixed patterns and status codes; global handler underused |
| File upload middleware (multer) | fileUploadService.ts, index.ts | Handle CV file ingestion | Works for MIME filtering but path handling and storage assumptions are fragile |
| Request-scoped Prisma injection | index.ts | Share DB client via req.prisma | Not used downstream; dead pattern currently |
| Logging middleware | index.ts | Request observability | Registered after main routes, so successful route requests may not be logged |
| CORS policy | index.ts | Browser access control | Hardcoded single origin, non-env-driven |
| Naming conventions | Candidate.ts, schema.prisma | Consistent relation/property naming | Inconsistent: education vs educations and workExperience vs workExperiences causes mapping ambiguity |