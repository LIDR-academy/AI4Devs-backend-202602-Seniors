# Prompts — JCT

---

## 1. Generate Full Project Documentation

**Role**: Senior Technical Writer + Full-Stack Engineer

**Objective**: Analyze the current codebase and produce comprehensive, accurate project documentation. Use only code that follows best practices as the reference source. Skip or explicitly exclude files/patterns that violate architecture or quality standards.

**Context**:
- Stack: TypeScript, Node.js, Express, Prisma ORM, PostgreSQL, React (frontend)
- Architecture target: Hexagonal Architecture (Ports & Adapters) with DDD-aligned domain layer
- The codebase is mixed quality — some files follow best practices, others do not
- Documentation must reflect the intended/correct architecture, not accidental inconsistencies
- Output directory: `docs/` (create if not exists)

**Pre-Analysis Step** (do this before writing any doc):
1. Read the entire project structure (`backend/src/`, `frontend/src/`, `prisma/schema.prisma`)
2. Identify which files follow best practices (proper layer separation, no Prisma in domain, thin controllers, typed interfaces, etc.)
3. Use ONLY those files as reference for documenting patterns and architecture
4. Note any files that deviate — do NOT document their patterns as "how the project works"

**Required Documents** (one file per section inside `docs/`):

### `docs/architecture.md`
- Overall architectural pattern (Hexagonal / Ports & Adapters)
- Layer diagram (text-based): Presentation → Application → Domain ← Infrastructure
- Dependency rules: what each layer can and cannot import
- How Express, Prisma, and domain entities relate to each layer
- Real file path examples from the codebase for each layer

### `docs/project-structure.md`
- Full directory hierarchy (backend + frontend + root config)
- Purpose of each top-level folder and key subdirectories
- Naming conventions observed in best-practice files
- Where to place new features (endpoint, service, repository, domain entity)

### `docs/backend.md`
- Express app entry point and middleware chain
- Route registration pattern
- Controller/handler responsibilities (what belongs here, what does not)
- Service layer: purpose, injection pattern
- Repository pattern: interface definition location, Prisma implementation location
- Error handling strategy
- Input validation approach
- Representative code snippets from best-practice files only

### `docs/frontend.md`
- React app structure (pages, components, services/api layer)
- How frontend calls backend API (fetch/axios, base URL config)
- State management approach (if any)
- Folder conventions
- Representative code snippets from best-practice files only

### `docs/database.md`
- Prisma schema overview: all models, fields, relations
- Entity-Relationship diagram (text/Mermaid format)
- Naming conventions in schema
- How Prisma models map to domain entities (and where that mapping lives)
- Migration strategy (how to run, where migrations live)
- Seed data (if exists)

**Constraints**:
- Do NOT document anti-patterns as if they are the project standard
- Do NOT invent architecture not present in the best-practice files
- Do NOT copy-paste large code blocks — use short, illustrative snippets (max 20 lines)
- Do NOT create a single monolithic doc — one file per section above
- Mermaid diagrams preferred for ERM and layer diagrams where supported
- All docs in English, Markdown format

**Quality Bar for "Best Practice" files** (use as filter):
- Domain layer files: zero imports from `@prisma/client`, Express, or `multer`
- Service files: depend on repository interfaces, not Prisma directly
- Route handlers: ≤15 lines, delegate to service, no business logic
- TypeScript: no untyped `any`, explicit return types on public functions

**Expected Output**:
```
docs/
  architecture.md
  project-structure.md
  backend.md
  frontend.md
  database.md
```

**Acceptance Criteria**:
- [ ] Each doc exists and is non-empty
- [ ] ERM in `database.md` covers all Prisma models and their relations
- [ ] Architecture doc includes actual file paths as examples
- [ ] No anti-pattern code appears as a "this is how we do it" example
- [ ] All Mermaid diagrams render without syntax errors
