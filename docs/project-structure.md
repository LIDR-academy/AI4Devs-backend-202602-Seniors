# Project Structure

## Root

```
AI4Devs-backend-202602-Seniors/
├── backend/            # Node.js / Express API
├── frontend/           # React SPA
├── docker-compose.yml  # Local PostgreSQL instance
├── package.json        # Root scripts + Prisma schema pointer
├── .env                # Environment variables (not committed)
└── VERSION             # Project version file
```

---

## Backend

```
backend/
├── prisma/
│   ├── schema.prisma           # All model definitions and DB config
│   └── migrations/             # Auto-generated migration history (do not edit manually)
│
├── src/
│   ├── index.ts                # App bootstrap: middleware, routes, server start
│   │
│   ├── routes/
│   │   └── candidateRoutes.ts  # Express Router for /candidates — registration only
│   │
│   ├── presentation/
│   │   └── controllers/
│   │       └── candidateController.ts  # HTTP handlers: parse input → call service → respond
│   │
│   ├── application/
│   │   ├── services/
│   │   │   ├── candidateService.ts     # Orchestrates candidate CRUD operations
│   │   │   └── fileUploadService.ts    # Multer configuration and upload handler
│   │   └── validator.ts               # Pure input validation rules (no side effects)
│   │
│   └── domain/
│       └── models/
│           ├── Candidate.ts
│           ├── Education.ts
│           ├── WorkExperience.ts
│           ├── Resume.ts
│           ├── Position.ts
│           ├── Company.ts
│           ├── Employee.ts
│           ├── Application.ts
│           ├── Interview.ts
│           ├── InterviewFlow.ts
│           ├── InterviewStep.ts
│           └── InterviewType.ts
│
├── package.json
└── tsconfig.json
```

---

## Frontend

```
frontend/
└── src/
    ├── index.tsx                    # React entry point — renders <App />
    ├── App.js                       # Root component: React Router configuration
    │
    ├── assets/
    │   └── lti-logo.png
    │
    ├── components/
    │   ├── RecruiterDashboard.js    # Landing page with navigation actions
    │   ├── AddCandidateForm.js      # Multi-section candidate creation form
    │   └── FileUploader.js          # Reusable CV upload widget
    │
    └── services/
        └── candidateService.js      # All backend API calls (axios-based)
```

---

## Naming Conventions

Observed in best-practice files (`validator.ts`, `candidateController.ts`, `candidateService.ts`):

| Artifact | Convention | Example |
|----------|------------|---------|
| Source files | camelCase | `candidateService.ts`, `candidateRoutes.ts` |
| Classes / models | PascalCase | `Candidate`, `WorkExperience`, `InterviewStep` |
| Functions | camelCase | `addCandidate`, `findCandidateById`, `validateEmail` |
| Constants (regex, config) | SCREAMING_SNAKE_CASE | `EMAIL_REGEX`, `NAME_REGEX`, `DATE_REGEX` |
| REST paths | kebab-case nouns | `/candidates`, `/candidates/:id` |
| React components | PascalCase file + function | `RecruiterDashboard.js` |

---

## Where to Place New Features

| Artifact | Location |
|----------|----------|
| New route file | `backend/src/routes/[resource]Routes.ts` |
| New controller | `backend/src/presentation/controllers/[resource]Controller.ts` |
| New service | `backend/src/application/services/[resource]Service.ts` |
| New validators | `backend/src/application/[resource]Validator.ts` |
| New domain entity | `backend/src/domain/models/[Entity].ts` |
| New Prisma model | `backend/prisma/schema.prisma` + run `prisma migrate dev` |
| New React page/component | `frontend/src/components/[FeatureName].js` |
| New API calls | `frontend/src/services/[resource]Service.js` |
