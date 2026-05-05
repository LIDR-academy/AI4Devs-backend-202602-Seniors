# Backend Development Skill Guide - LTI ATS System

> Senior backend architecture guide for Node.js/Express development in the AI4Devs LTI talent tracking system

## Overview

This skill document captures the established best practices, patterns, and conventions for backend development in the LTI ATS project. The backend follows a **layered architecture pattern** with strict separation of concerns and uses TypeScript with strict type checking enabled.

## Technology Stack

- **Runtime**: Node.js with TypeScript (strict mode)
- **Framework**: Express.js 4.19.2
- **Database**: PostgreSQL (via Docker) with Prisma ORM 5.13.0
- **API Documentation**: Swagger/OpenAPI (swagger-jsdoc, swagger-ui-express)
- **File Handling**: Multer 1.4.5
- **Testing**: Jest 29.7.0
- **Development**: ts-node-dev with hot reload
- **Code Quality**: ESLint + Prettier

---

## Architecture Pattern: Layered Architecture

The project follows a 4-layer architecture ensuring clean separation of concerns:

### 1. **Presentation Layer** (`presentation/controllers/`)
- Handles HTTP request/response handling
- Receives and validates HTTP input
- Delegates business logic to the application layer
- Returns HTTP responses with appropriate status codes
- Never contains business logic

**Key Responsibilities:**
- Parse request parameters and body
- Catch errors from service layer
- Map domain objects to HTTP responses
- Return appropriate HTTP status codes (201 for creation, 400 for validation errors, 404 for not found, 500 for server errors)

**Example Pattern:**
```typescript
export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};
```

### 2. **Routes Layer** (`routes/`)
- Maps HTTP methods and paths to controllers
- Handles async/await patterns for route handlers
- Implements basic error handling at route level
- Registers routes with the Express app

**Key Pattern:**
```typescript
router.post('/', async (req, res) => {
  try {
    const result = await addCandidate(req.body);
    res.status(201).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: "An unexpected error occurred" });
    }
  }
});

router.get('/:id', getCandidateById);
```

### 3. **Application Layer** (`application/services/`)
- Orchestrates business operations
- Coordinates between domain models and data access
- Performs data validation before persistence
- Throws descriptive Error objects for error handling
- Handles specific database error codes (e.g., P2002 for unique constraints)

**Key Responsibilities:**
- Validate input data using validator functions
- Create domain model instances
- Call save methods on domain models
- Handle Prisma-specific error codes
- Manage nested data creation (educations, work experiences, resumes)

**Error Handling Pattern:**
```typescript
catch (error: any) {
    if (error.code === 'P2002') {
        // Unique constraint failed
        throw new Error('The email already exists in the database');
    } else if (error instanceof Prisma.PrismaClientInitializationError) {
        throw new Error('Database connection error');
    } else {
        throw error;
    }
}
```

### 4. **Domain Layer** (`domain/models/`)
- Contains business entity models (Candidate, Position, Application, etc.)
- Implements `.save()` and `.findOne()` methods for persistence
- Manages relationships with related entities
- Handles data transformation before database operations
- Contains Prisma client instance (singleton)

**Key Pattern:**
```typescript
export class Candidate {
    id?: number;
    firstName: string;
    lastName: string;
    email: string;
    // ...relations
    
    constructor(data: any) { /* initialization */ }
    
    async save() {
        // Build candidateData object
        const candidateData: any = {};
        // Only add defined fields
        if (this.firstName !== undefined) candidateData.firstName = this.firstName;
        // Handle nested creates (educations, workExperiences, resumes)
        // Call prisma.candidate.create() or .update()
    }
    
    static async findOne(id: number): Promise<Candidate | null> {
        // Include relations using include: { educations, workExperiences, resumes }
    }
}
```

---

## Best Practices

### TypeScript & Type Safety

1. **Enable Strict Mode** (already configured in tsconfig.json)
   - All files must pass strict type checking
   - Use `unknown` for catch error parameters, then narrow with `instanceof`
   - Properly type Express Request/Response parameters

2. **Type Error Handling**
   ```typescript
   catch (error: unknown) {
       if (error instanceof Error) {
           // Safe to use error.message
       }
   }
   ```

3. **Extend Express Types When Needed**
   ```typescript
   declare global {
     namespace Express {
       interface Request {
         prisma: PrismaClient;
       }
     }
   }
   ```

### Database & Prisma

1. **Connection Management**
   - Single PrismaClient instance per module (singleton pattern)
   - Attach to Express Request object via middleware: `req.prisma = prisma`
   - Initialize with `dotenv.config()` to load `.env` variables

2. **Error Code Handling**
   - P2002: Unique constraint violation (duplicate email, etc.)
   - P2025: Record not found
   - Handle Prisma-specific initialization errors
   - Always provide user-friendly error messages

3. **Relationships & Nested Creates**
   ```typescript
   // In domain model's save() method
   if (this.educations.length > 0) {
       candidateData.educations = {
           create: this.educations.map(edu => ({
               institution: edu.institution,
               title: edu.title,
               startDate: edu.startDate,
               endDate: edu.endDate
           }))
       };
   }
   ```

4. **Include Strategy in Queries**
   ```typescript
   // Always include related data when fetching
   const candidate = await prisma.candidate.findUnique({
       where: { id },
       include: {
           educations: true,
           workExperiences: true,
           resumes: true,
           applications: {
               include: { position: true, interviews: true }
           }
       }
   });
   ```

### Validation

1. **Validator Module Location**: `application/validator.ts`
2. **Validation Patterns**
   - Use regex for format validation (email, phone, dates)
   - Use length checks for string fields
   - Validate before domain model creation
   - Optional fields should check existence first: `if (field && !PATTERN.test(field))`

3. **Regex Patterns (Established)**
   ```typescript
   const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/;
   const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
   const PHONE_REGEX = /^(6|7|9)\d{8}$/; // Spain format
   const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD
   ```

4. **Validator Function Pattern**
   ```typescript
   const validateEmail = (email: string) => {
       if (!email || !EMAIL_REGEX.test(email)) {
           throw new Error('Invalid email');
       }
   };
   ```

### File Upload

1. **Multer Configuration** (in `application/services/fileUploadService.ts`)
   - Disk storage with timestamp-based unique naming
   - File filter to restrict types (PDF, DOCX only)
   - Size limit: 10MB
   - Destination: `../uploads/` directory

2. **File Upload Endpoint**
   - Single endpoint: `POST /upload`
   - Accepts multipart/form-data with 'file' field
   - Returns `{ filePath, fileType }` on success
   - Handles MulterError and custom errors

3. **Integration with Domain Models**
   ```typescript
   // Resume model stores file metadata
   const resumeModel = new Resume(candidateData.cv);
   resumeModel.candidateId = candidateId;
   await resumeModel.save();
   ```

### CORS & Security

1. **CORS Configuration** (in index.ts)
   ```typescript
   app.use(cors({
     origin: 'http://localhost:3000', // Frontend URL only
     credentials: true
   }));
   ```
   - Strict origin policy: only localhost:3000 in development
   - Update for production URLs

2. **JSON Parser Middleware**
   ```typescript
   app.use(express.json()); // Must be before routes
   ```

3. **Error Handler Middleware** (Global)
   ```typescript
   app.use((err: any, req: Request, res: Response, next: NextFunction) => {
       console.error(err.stack);
       res.status(500).send('Something broke!');
   });
   ```

### Middleware Order (Critical)

In `index.ts`, middleware order matters:
1. Parse JSON: `app.use(express.json())`
2. Attach prisma: `app.use((req, res, next) => { req.prisma = prisma; next(); })`
3. CORS: `app.use(cors({...}))`
4. Logging: `app.use((req, res, next) => { console.log(...); next(); })`
5. Routes: `app.use('/candidates', candidateRoutes)`
6. Error handler: `app.use((err, req, res, next) => {...})`

---

## Creating New Endpoints: Step-by-Step Guide

### Step 1: Define the Route Handler in Routes Layer

**File**: `src/routes/<entityName>Routes.ts`

```typescript
import { Router } from 'express';
import { 
    getAll<Entity>, 
    create<Entity>, 
    update<Entity> 
} from '../presentation/controllers/<entity>Controller';

const router = Router();

// GET all entities
router.get('/', getAll<Entity>);

// POST create new entity
router.post('/', async (req, res) => {
  try {
    const result = await create<Entity>(req.body);
    res.status(201).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: "An unexpected error occurred" });
    }
  }
});

// PUT update entity
router.put('/:id', async (req, res) => {
  try {
    const result = await update<Entity>(req.params.id, req.body);
    res.status(200).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: "An unexpected error occurred" });
    }
  }
});

export default router;
```

### Step 2: Create the Controller in Presentation Layer

**File**: `src/presentation/controllers/<entity>Controller.ts`

```typescript
import { Request, Response } from 'express';
import { 
    create<Entity>, 
    find<Entity>ById, 
    getAll<Entity>s 
} from '../../application/services/<entity>Service';

export const create<Entity>Controller = async (req: Request, res: Response) => {
    try {
        const data = req.body;
        const entity = await create<Entity>(data);
        res.status(201).json({ 
            message: '<Entity> created successfully', 
            data: entity 
        });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ 
                message: 'Error creating <entity>', 
                error: error.message 
            });
        } else {
            res.status(400).json({ 
                message: 'Error creating <entity>', 
                error: 'Unknown error' 
            });
        }
    }
};

export const get<Entity>ById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const entity = await find<Entity>ById(id);
        if (!entity) {
            return res.status(404).json({ error: '<Entity> not found' });
        }
        res.json(entity);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

export const getAll<Entity>s = async (req: Request, res: Response) => {
    try {
        const entities = await getAll<Entity>s();
        res.json(entities);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
```

### Step 3: Create Service in Application Layer

**File**: `src/application/services/<entity>Service.ts`

```typescript
import { <Entity> } from '../../domain/models/<Entity>';
import { validate<Entity>Data } from '../validator';

export const create<Entity> = async (<entity>Data: any) => {
    try {
        validate<Entity>Data(<entity>Data);
    } catch (error: any) {
        throw new Error(error);
    }

    const entity = new <Entity>(<entity>Data);
    try {
        const saved = await entity.save();
        // Handle nested relationships if needed
        return saved;
    } catch (error: any) {
        if (error.code === 'P2002') {
            throw new Error('Unique constraint violation');
        } else {
            throw error;
        }
    }
};

export const find<Entity>ById = async (id: number): Promise<<Entity> | null> => {
    try {
        const entity = await <Entity>.findOne(id);
        return entity;
    } catch (error) {
        console.error('Error fetching entity:', error);
        throw new Error('Error retrieving entity');
    }
};

export const getAll<Entity>s = async (): Promise<<Entity>[]> => {
    try {
        const entities = await <Entity>.findAll();
        return entities;
    } catch (error) {
        console.error('Error fetching entities:', error);
        throw new Error('Error retrieving entities');
    }
};
```

### Step 4: Create/Update Domain Model

**File**: `src/domain/models/<Entity>.ts`

```typescript
import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class <Entity> {
    id?: number;
    field1: string;
    field2?: string;
    // ... other fields

    constructor(data: any) {
        this.id = data.id;
        this.field1 = data.field1;
        this.field2 = data.field2;
        // ...
    }

    async save() {
        const data: any = {};
        
        if (this.field1 !== undefined) data.field1 = this.field1;
        if (this.field2 !== undefined) data.field2 = this.field2;

        if (this.id) {
            try {
                return await prisma.<entityLower>.update({
                    where: { id: this.id },
                    data
                });
            } catch (error: any) {
                if (error.code === 'P2025') {
                    throw new Error('Record not found');
                }
                throw error;
            }
        } else {
            try {
                return await prisma.<entityLower>.create({ data });
            } catch (error: any) {
                throw error;
            }
        }
    }

    static async findOne(id: number): Promise<<Entity> | null> {
        const data = await prisma.<entityLower>.findUnique({
            where: { id },
            include: {
                // Include related models
            }
        });
        return data ? new <Entity>(data) : null;
    }

    static async findAll(): Promise<<Entity>[]> {
        const items = await prisma.<entityLower>.findMany({
            include: {
                // Include related models
            }
        });
        return items.map(item => new <Entity>(item));
    }
}
```

### Step 5: Add Validators

**File**: `src/application/validator.ts` (add to existing)

```typescript
const validate<Entity> = (<field>: any) => {
    if (!<field> || <field>.length < 2 || <field>.length > 100) {
        throw new Error('Invalid <field>');
    }
};

export const validate<Entity>Data = (data: any) => {
    if (data.id) {
        // If id exists, treat as update (fields optional)
        return;
    }

    validate<Entity>(data.field1);
    // ... other validations
};
```

### Step 6: Register the Route

**File**: `src/index.ts`

```typescript
import <entityName>Routes from './routes/<entityName>Routes';

// After other routes
app.use('/<entities>', <entityName>Routes);
```

### Step 7: Update Swagger Documentation (CRITICAL)

Even though Swagger is not yet fully implemented, prepare for it:

**Add JSDoc comments above controllers:**

```typescript
/**
 * @swagger
 * /candidates:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *       400:
 *         description: Validation error
 */
```

---

## Swagger/OpenAPI Documentation Setup

### Current Status
The project has Swagger dependencies installed (`swagger-jsdoc`, `swagger-ui-express`) but integration is **not yet complete**.

### Implementation Steps for Swagger Setup

#### Step 1: Create Swagger Config File

**File**: `src/swagger.ts`

```typescript
import swaggerJSDoc from 'swagger-jsdoc';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'LTI ATS API',
      version: '1.0.0',
      description: 'Talent Tracking System API Documentation',
    },
    servers: [
      {
        url: 'http://localhost:3010',
        description: 'Development server',
      },
    ],
    components: {
      schemas: {
        Candidate: {
          type: 'object',
          properties: {
            id: { type: 'integer' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            address: { type: 'string' },
            educations: { type: 'array', items: { $ref: '#/components/schemas/Education' } },
            workExperiences: { type: 'array', items: { $ref: '#/components/schemas/WorkExperience' } },
          },
        },
        Education: {
          type: 'object',
          properties: {
            institution: { type: 'string' },
            title: { type: 'string' },
            startDate: { type: 'string', format: 'date' },
            endDate: { type: 'string', format: 'date' },
          },
        },
        // ... other schemas
      },
    },
  },
  apis: ['./src/routes/*.ts', './src/presentation/controllers/*.ts'],
};

export const specs = swaggerJSDoc(options);
```

#### Step 2: Integrate Swagger UI in Express

**File**: `src/index.ts` (add to existing)

```typescript
import swaggerUi from 'swagger-ui-express';
import { specs } from './swagger';

// After middleware, before routes
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
```

#### Step 3: Add JSDoc Comments to Endpoints

Add above each endpoint handler:

```typescript
/**
 * @swagger
 * /candidates:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Candidate'
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Candidate'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
```

#### Step 4: View Documentation

Visit: `http://localhost:3010/api-docs`

### Swagger Best Practices

1. **Keep Schemas DRY**: Use `$ref` to reference common schemas
2. **Complete Descriptions**: Document all required and optional fields
3. **Example Responses**: Include real examples in documentation
4. **Error Responses**: Document all possible error codes
5. **Update with Changes**: Always update JSDoc when modifying endpoints

---

## Related MCPs for Backend Development

### MCP Tools Available in This Project

1. **Prisma MCP**
   - Manages database schema and migrations
   - Command: `npx prisma migrate dev` (creates and applies migrations)
   - Use when: Schema changes, database structure updates
   - Files: `backend/prisma/schema.prisma`

2. **TypeScript/Node.js Language Server**
   - Provides type checking and intellisense
   - Command: `npm run build` (validates TypeScript)
   - Use when: Type checking, refactoring
   - Config: `backend/tsconfig.json`

3. **Jest Testing Framework**
   - Unit and integration testing
   - Command: `npm test`
   - Use when: Writing tests for services, controllers, models
   - Config: `jest.config.js` (if exists)

### Recommended External MCPs for Enhancement

| MCP | Purpose | Use Case |
|-----|---------|----------|
| **Database Inspector** | Visual inspection of PostgreSQL | Debugging data, checking migrations |
| **API Client (REST)** | Test endpoints during development | Manual endpoint testing, integration verification |
| **Docker CLI** | Manage PostgreSQL container | Database management, container lifecycle |
| **Git** | Version control | Commit tracking, branch management |
| **ESLint/Prettier** | Code quality | Linting, formatting enforcement |
| **Postman/Insomnia** | API testing | Collection management, request testing |

### Docker Commands for Database

```bash
# Start PostgreSQL container
docker-compose up -d

# Stop container
docker-compose down

# View logs
docker-compose logs postgres

# Connect to database
docker exec -it <container_id> psql -U postgres -d mydatabase
```

---

## Testing Strategy

### Current Setup
- Testing framework: Jest 29.7.0
- TypeScript support: ts-jest
- Run tests: `npm test`

### Testing Patterns to Implement

#### Service Layer Tests
```typescript
describe('CandidateService', () => {
    it('should create a candidate with valid data', async () => {
        const data = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com'
        };
        const result = await addCandidate(data);
        expect(result.id).toBeDefined();
    });

    it('should throw on duplicate email', async () => {
        await expect(addCandidate(duplicateData)).rejects.toThrow('already exists');
    });
});
```

#### Controller Tests
```typescript
describe('CandidateController', () => {
    it('should return 201 on successful creation', async () => {
        const req = { body: validData };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
        
        await addCandidateController(req as any, res as any);
        expect(res.status).toHaveBeenCalledWith(201);
    });
});
```

### Test Execution
```bash
# Run all tests
npm test

# Run single test file
npm test -- src/application/services/candidateService.test.ts

# Watch mode
npm test -- --watch

# Coverage report
npm test -- --coverage
```

---

## Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| `PrismaClientInitializationError` | DB not running | `docker-compose up -d` |
| Port 3010 already in use | Another process using port | `lsof -i :3010` then kill process |
| Unique constraint errors | Duplicate email/unique field | Check existing data, clear if in dev |
| Middleware not working | Middleware order wrong | Ensure JSON parser before routes |
| TypeScript errors on build | Type mismatches | Run `npm run build` to identify issues |
| File upload fails | Wrong mimetype | Only PDF and DOCX allowed |
| CORS errors | Wrong origin | Update CORS config for frontend URL |

---

## Development Workflow

### 1. Start Development Environment
```bash
# Terminal 1: Database
docker-compose up -d

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend (separate project)
cd frontend && npm start
```

### 2. Create New Endpoint (Checklist)
- [ ] Create route handler in `routes/`
- [ ] Create controller in `presentation/controllers/`
- [ ] Create/update service in `application/services/`
- [ ] Create/update domain model in `domain/models/`
- [ ] Add validators to `application/validator.ts`
- [ ] Register route in `index.ts`
- [ ] Add JSDoc/Swagger comments
- [ ] Test endpoint with REST client
- [ ] Add unit tests
- [ ] Document in README

### 3. Database Changes
```bash
# Edit schema.prisma
# Create migration
npx prisma migrate dev --name <descriptive_name>

# Generate Prisma client
npx prisma generate

# Seed test data (if applicable)
npx prisma db seed
```

### 4. Code Quality
```bash
npm run build  # Type checking
npm test       # Unit tests
npm run lint   # Linting (if configured)
```

---

## Summary of Key Takeaways

1. **Layered Architecture**: Presentation → Routes → Application → Domain
2. **Error Handling**: Services throw, Controllers catch and map to HTTP responses
3. **Type Safety**: Strict TypeScript, proper error typing with `unknown`
4. **Validation**: Always validate in service layer before domain model creation
5. **Database**: Use Prisma error codes (P2002, P2025) for specific handling
6. **Relationships**: Use `include` strategy in queries; nested creates in domain saves
7. **Security**: Strict CORS, input validation, proper HTTP status codes
8. **Documentation**: JSDoc comments with Swagger format for all endpoints
9. **Middleware Order**: Critical for functionality - JSON → Prisma → CORS → Routes → Error Handler
10. **File Uploads**: Multer with timestamp naming, PDF/DOCX only, 10MB limit

---

## Quick Reference: File Structure
```
backend/src/
├── index.ts                          # Express app setup, middleware, route registration
├── swagger.ts                        # Swagger/OpenAPI configuration (to implement)
├── routes/
│   └── candidateRoutes.ts           # HTTP route definitions
├── presentation/
│   └── controllers/
│       └── candidateController.ts   # Request/response handling
├── application/
│   ├── services/
│   │   ├── candidateService.ts      # Business logic orchestration
│   │   └── fileUploadService.ts     # Multer file upload handler
│   └── validator.ts                 # Input validation functions
└── domain/
    └── models/
        ├── Candidate.ts             # Domain model with .save() and .findOne()
        ├── Education.ts
        ├── WorkExperience.ts
        ├── Resume.ts
        ├── Application.ts
        ├── Position.ts
        ├── Company.ts
        ├── Interview.ts
        ├── InterviewStep.ts
        ├── InterviewFlow.ts
        ├── InterviewType.ts
        └── Employee.ts
```

---

## Contact & Questions

For clarifications on these patterns and best practices, consult the CLAUDE.md file in the project root or the original backend implementation in the committed code.
