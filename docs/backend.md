# Backend

## Entry Point

`backend/src/index.ts` — bootstraps Express, registers middleware and routes, starts the server.

```typescript
export const app = express();

app.use(express.json());
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use('/candidates', candidateRoutes);
app.post('/upload', uploadFile);

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    res.status(500).send('Something broke!');
});

app.listen(3010);
```

Port: **3010**. CORS allows `http://localhost:3000` only.

---

## Routes

| Method | Path | Handler |
|--------|------|---------|
| `POST` | `/candidates` | `addCandidateController` |
| `GET` | `/candidates/:id` | `getCandidateById` |
| `POST` | `/upload` | `uploadFile` |

Route files (`src/routes/`) register paths and map them to controller functions only — no business logic, no inline handlers.

---

## Controller Layer

`backend/src/presentation/controllers/candidateController.ts`

Controllers are thin. Each handler:
1. Parses input from `req`
2. Validates input *shape* (type checks, null guards)
3. Calls a single service function
4. Returns HTTP response with the correct status code

```typescript
export const getCandidateById = async (req: Request, res: Response) => {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }
    const candidate = await findCandidateById(id);
    if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' });
    }
    res.json(candidate);
};
```

**Error typing**: use `error instanceof Error` — never `catch (error: any)`:

```typescript
} catch (error: unknown) {
    if (error instanceof Error) {
        res.status(400).json({ message: 'Error adding candidate', error: error.message });
    } else {
        res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
    }
}
```

---

## Application / Service Layer

`backend/src/application/services/candidateService.ts`

Services orchestrate multi-step operations and handle infrastructure-level error codes:

```typescript
export const addCandidate = async (candidateData: any) => {
    validateCandidateData(candidateData);             // 1. validate first
    const candidate = new Candidate(candidateData);   // 2. build entity
    const saved = await candidate.save();             // 3. persist candidate

    // 4. persist related entities sequentially
    if (candidateData.educations) { /* ... */ }
    if (candidateData.workExperiences) { /* ... */ }
    if (candidateData.cv) { /* ... */ }

    return saved;
};
```

Prisma error code handling at the service boundary:

```typescript
} catch (error: any) {
    if (error.code === 'P2002') {
        throw new Error('The email already exists in the database');
    }
    throw error;
}
```

Typed return types on public functions:

```typescript
export const findCandidateById = async (id: number): Promise<Candidate | null> => {
```

---

## Validation

`backend/src/application/validator.ts`

Pure validation functions — no side effects, no I/O, no imports:

```typescript
const NAME_REGEX = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ ]+$/;
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const DATE_REGEX  = /^\d{4}-\d{2}-\d{2}$/;

const validateEmail = (email: string) => {
    if (!email || !EMAIL_REGEX.test(email)) {
        throw new Error('Invalid email');
    }
};

export const validateCandidateData = (data: any) => {
    validateName(data.firstName);
    validateName(data.lastName);
    validateEmail(data.email);
    validatePhone(data.phone);
    validateAddress(data.address);
    // nested: educations, workExperiences, cv
};
```

Pattern: each rule is a named private function; `validateCandidateData` composes them. Throws `Error` on failure — the service catches it, the controller maps it to HTTP 400.

---

## File Upload

`backend/src/application/services/fileUploadService.ts`

Multer is configured and encapsulated as a single exported handler:

```typescript
const upload = multer({
    storage: multer.diskStorage({ destination: '../uploads/', filename: ... }),
    limits: { fileSize: 10 * 1024 * 1024 },  // 10 MB
    fileFilter: (req, file, cb) => {
        const allowed = ['application/pdf', 'application/vnd.openxmlformats-...'];
        cb(null, allowed.includes(file.mimetype));
    }
});

export const uploadFile = (req: Request, res: Response) => {
    upload.single('file')(req, res, (err) => {
        if (err instanceof multer.MulterError) return res.status(500).json({ error: err.message });
        if (!req.file) return res.status(400).json({ error: 'Invalid file type' });
        res.status(200).json({ filePath: req.file.path, fileType: req.file.mimetype });
    });
};
```

Returns: `{ filePath: string, fileType: string }`. Accepted types: PDF, DOCX.

---

## Error Handling Strategy

| Scenario | HTTP Status | Where caught |
|----------|-------------|--------------|
| Invalid input format (bad ID, missing field) | 400 | Controller |
| Business rule violation (validation) | 400 | Controller catches Error thrown by validator/service |
| Duplicate email | 400 | Service catches Prisma `P2002`, rethrows as `Error` |
| Resource not found | 404 | Controller checks `null` return from service |
| Unhandled exception | 500 | Global error middleware in `index.ts` |

---

## HTTP Response Shape

Consistent conventions observed across controllers:

| Case | Shape |
|------|-------|
| Success (create) | `{ message: string, data: T }` with status 201 |
| Success (read) | raw object with status 200 |
| Error | `{ error: string }` or `{ message: string, error: string }` with 4xx/5xx |
