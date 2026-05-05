# Backend Development Skill - Quick Index

## Document Location
📄 `prompts/backend-dev-skill.md`

## What's Included

This skill document is your comprehensive guide for backend development in the LTI ATS system. It captures:

### ✅ Architecture & Patterns
- **Layered Architecture**: Presentation → Routes → Application → Domain
- **Error Handling Strategy**: Services throw, controllers catch and map to HTTP
- **TypeScript Strict Mode**: All files with strict type checking
- **Service Layer Pattern**: Orchestration of domain logic and data persistence
- **Domain Models**: Business entity models with `.save()` and `.findOne()` methods

### ✅ Best Practices
- **Type Safety**: Proper error typing (`unknown` → narrowing with `instanceof`)
- **Database Management**: Prisma ORM with error code handling (P2002, P2025, etc.)
- **Validation**: Input validation before domain model creation
- **CORS Security**: Strict origin policy (localhost:3000 only in dev)
- **Middleware Order**: Critical ordering for Express middleware stack

### ✅ Creating New Endpoints: Step-by-Step
1. Define route handler in `routes/`
2. Create controller in `presentation/controllers/`
3. Create service in `application/services/`
4. Create/update domain model in `domain/models/`
5. Add validators
6. Register route in `index.ts`
7. Add Swagger/JSDoc documentation
8. Test and document

### ✅ Swagger/OpenAPI Setup
- **Current Status**: Dependencies installed but integration incomplete
- **Implementation**: Complete setup guide included
- **JSDoc Pattern**: Standard JSDoc with Swagger annotations
- **Documentation URL**: Will be at `http://localhost:3010/api-docs`

### ✅ Related MCPs & Tools
- **Prisma MCP**: Schema management and migrations
- **TypeScript/Node.js**: Type checking and building
- **Jest**: Testing framework
- **Docker**: PostgreSQL container management
- **REST Clients**: Manual endpoint testing

### ✅ Quick Reference
- File structure overview
- Common issues & solutions
- Development workflow checklist
- Testing strategy (service, controller, integration)
- Docker commands for database
- Code quality commands

## Quick Start for New Endpoints

1. **Look up the endpoint creation guide** in Section: "Creating New Endpoints: Step-by-Step Guide"
2. **Use the controller template** to ensure consistent error handling
3. **Reference validation patterns** from the existing `validator.ts`
4. **Follow the domain model pattern** for save() and findOne() methods
5. **Add Swagger JSDoc** before deploying

## Key Files Referenced

- Backend configuration: `backend/package.json`, `backend/tsconfig.json`
- Main app: `backend/src/index.ts`
- Example implementation: Candidate feature
  - Routes: `backend/src/routes/candidateRoutes.ts`
  - Controller: `backend/src/presentation/controllers/candidateController.ts`
  - Service: `backend/src/application/services/candidateService.ts`
  - Model: `backend/src/domain/models/Candidate.ts`
  - Validators: `backend/src/application/validator.ts`

## Technology Stack Summary

| Component | Technology | Version |
|-----------|-----------|---------|
| Runtime | Node.js | Latest LTS |
| Language | TypeScript | 4.9.5 |
| Framework | Express.js | 4.19.2 |
| Database | PostgreSQL | Latest (Docker) |
| ORM | Prisma | 5.13.0 |
| API Docs | Swagger/OpenAPI | swagger-jsdoc 6.2.8 |
| File Upload | Multer | 1.4.5-lts.1 |
| Testing | Jest | 29.7.0 |
| Dev Server | ts-node-dev | 1.1.6 |

## How to Use This Document

### For implementing a new feature:
→ Go to **Section: "Creating New Endpoints: Step-by-Step Guide"**

### For understanding the codebase structure:
→ Go to **Section: "Architecture Pattern: Layered Architecture"**

### For setting up API documentation:
→ Go to **Section: "Swagger/OpenAPI Documentation Setup"**

### For debugging issues:
→ Go to **Section: "Common Issues & Solutions"**

### For testing:
→ Go to **Section: "Testing Strategy"**

## Next Steps (Recommended)

1. ✅ Implement Swagger/OpenAPI setup (currently installed, not integrated)
2. ✅ Add unit tests for existing endpoints
3. ✅ Create integration tests for service layer
4. ✅ Document additional domain models (Position, Application, Interview)
5. ✅ Implement additional endpoints following the established patterns

---

**Document created**: 2026-05-05  
**Last updated**: 2026-05-05  
**Maintained by**: Senior Backend Architecture Review
