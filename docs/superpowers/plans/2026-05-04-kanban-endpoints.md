# Kanban Endpoints Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `GET /positions/:id/candidates` and `PUT /candidates/:id/stage` to the LTI backend to power a kanban-style recruitment pipeline view.

**Architecture:** Layered Express + Prisma architecture (routes → controller → service). A new `position` slice (routes/controller/service) handles the GET endpoint; the existing `candidate` slice is extended for the PUT. All logic is tested with Jest + mocked Prisma before implementation.

**Tech Stack:** TypeScript 4.9, Express 4, Prisma 5, Jest 29, ts-jest

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `backend/src/application/services/positionService.ts` | getCandidatesForPosition business logic |
| Create | `backend/src/application/services/__tests__/positionService.test.ts` | Unit tests for positionService |
| Create | `backend/src/presentation/controllers/positionController.ts` | HTTP handler for GET /positions/:id/candidates |
| Create | `backend/src/presentation/controllers/__tests__/positionController.test.ts` | Unit tests for positionController |
| Create | `backend/src/routes/positionRoutes.ts` | Route registration for /positions |
| Modify | `backend/src/application/services/candidateService.ts` | Add updateCandidateStage function |
| Create | `backend/src/application/services/__tests__/candidateService.test.ts` | Unit tests for updateCandidateStage |
| Modify | `backend/src/presentation/controllers/candidateController.ts` | Add updateCandidateStage handler |
| Create | `backend/src/presentation/controllers/__tests__/candidateController.test.ts` | Unit tests for updateCandidateStage handler |
| Modify | `backend/src/routes/candidateRoutes.ts` | Add PUT /:id/stage route |
| Modify | `backend/src/index.ts` | Register /positions route |

---

## Task 1: positionService — getCandidatesForPosition (TDD)

**Files:**
- Create: `backend/src/application/services/__tests__/positionService.test.ts`
- Create: `backend/src/application/services/positionService.ts`

- [ ] **Step 1.1: Write the failing tests**

Create `backend/src/application/services/__tests__/positionService.test.ts`:

```typescript
const mockPositionFindUnique = jest.fn();
const mockApplicationFindMany = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    position: { findUnique: mockPositionFindUnique },
    application: { findMany: mockApplicationFindMany },
  })),
}));

import { getCandidatesForPosition } from '../positionService';

describe('getCandidatesForPosition', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns mapped candidates when position has applications', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([
      {
        candidate: { id: 10, firstName: 'Jane', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [{ score: 8 }, { score: 7 }],
      },
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result).toEqual([
      {
        candidateId: 10,
        fullName: 'Jane Doe',
        currentInterviewStep: { id: 3, name: 'Technical Interview' },
        averageScore: 7.5,
      },
    ]);
  });

  it('returns empty array when position has no applications', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([]);

    const result = await getCandidatesForPosition(1);

    expect(result).toEqual([]);
  });

  it('throws POSITION_NOT_FOUND when position does not exist', async () => {
    mockPositionFindUnique.mockResolvedValue(null);

    await expect(getCandidatesForPosition(999)).rejects.toThrow('POSITION_NOT_FOUND');
  });

  it('returns null averageScore when candidate has no interviews', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([
      {
        candidate: { id: 10, firstName: 'Jane', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [],
      },
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result[0].averageScore).toBeNull();
  });

  it('excludes null scores when computing average', async () => {
    mockPositionFindUnique.mockResolvedValue({ id: 1 });
    mockApplicationFindMany.mockResolvedValue([
      {
        candidate: { id: 10, firstName: 'Jane', lastName: 'Doe' },
        interviewStep: { id: 3, name: 'Technical Interview' },
        interviews: [{ score: 8 }, { score: null }],
      },
    ]);

    const result = await getCandidatesForPosition(1);

    expect(result[0].averageScore).toBe(8);
  });
});
```

- [ ] **Step 1.2: Run tests — verify they fail**

```bash
cd backend && npx jest src/application/services/__tests__/positionService.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../positionService'`

- [ ] **Step 1.3: Create positionService.ts**

Create `backend/src/application/services/positionService.ts`:

```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type CandidateForPosition = {
  candidateId: number;
  fullName: string;
  currentInterviewStep: { id: number; name: string };
  averageScore: number | null;
};

function computeAverageScore(scores: (number | null)[]): number | null {
  const valid = scores.filter((s): s is number => s !== null);
  if (valid.length === 0) return null;
  return parseFloat((valid.reduce((a, b) => a + b, 0) / valid.length).toFixed(2));
}

export const getCandidatesForPosition = async (positionId: number): Promise<CandidateForPosition[]> => {
  const position = await prisma.position.findUnique({ where: { id: positionId } });
  if (!position) throw new Error('POSITION_NOT_FOUND');

  const applications = await prisma.application.findMany({
    where: { positionId },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true } },
      interviewStep: { select: { id: true, name: true } },
      interviews: { select: { score: true } },
    },
  });

  return applications.map((app) => ({
    candidateId: app.candidate.id,
    fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
    currentInterviewStep: { id: app.interviewStep.id, name: app.interviewStep.name },
    averageScore: computeAverageScore(app.interviews.map((i) => i.score)),
  }));
};
```

- [ ] **Step 1.4: Run tests — verify they pass**

```bash
cd backend && npx jest src/application/services/__tests__/positionService.test.ts --no-coverage
```

Expected: PASS — 5 tests passing

- [ ] **Step 1.5: Commit**

```bash
cd backend && git add src/application/services/positionService.ts src/application/services/__tests__/positionService.test.ts && git commit -m "feat: add getCandidatesForPosition service with tests"
```

---

## Task 2: positionController + positionRoutes + index.ts registration (TDD)

**Files:**
- Create: `backend/src/presentation/controllers/__tests__/positionController.test.ts`
- Create: `backend/src/presentation/controllers/positionController.ts`
- Create: `backend/src/routes/positionRoutes.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 2.1: Write the failing controller tests**

Create `backend/src/presentation/controllers/__tests__/positionController.test.ts`:

```typescript
import { Request, Response } from 'express';
import { getCandidates } from '../positionController';
import * as positionService from '../../../application/services/positionService';

jest.mock('../../../application/services/positionService');

const mockGetCandidatesForPosition = positionService.getCandidatesForPosition as jest.Mock;

function makeReq(params: Record<string, string>): Partial<Request> {
  return { params };
}

function makeRes() {
  const res = {} as any;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as { status: jest.Mock; json: jest.Mock };
}

describe('getCandidates controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with candidate list for a valid position', async () => {
    const candidates = [
      {
        candidateId: 1,
        fullName: 'Jane Doe',
        currentInterviewStep: { id: 3, name: 'Technical Interview' },
        averageScore: 7.5,
      },
    ];
    mockGetCandidatesForPosition.mockResolvedValue(candidates);

    const req = makeReq({ id: '1' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.json).toHaveBeenCalledWith(candidates);
  });

  it('returns 400 when :id is not a valid integer', async () => {
    const req = makeReq({ id: 'abc' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid position ID' });
  });

  it('returns 404 when position is not found', async () => {
    mockGetCandidatesForPosition.mockRejectedValue(new Error('POSITION_NOT_FOUND'));

    const req = makeReq({ id: '999' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Position not found' });
  });

  it('returns 500 on unexpected error', async () => {
    mockGetCandidatesForPosition.mockRejectedValue(new Error('DB connection failed'));

    const req = makeReq({ id: '1' });
    const res = makeRes();

    await getCandidates(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
```

- [ ] **Step 2.2: Run tests — verify they fail**

```bash
cd backend && npx jest src/presentation/controllers/__tests__/positionController.test.ts --no-coverage
```

Expected: FAIL — `Cannot find module '../positionController'`

- [ ] **Step 2.3: Create positionController.ts**

Create `backend/src/presentation/controllers/positionController.ts`:

```typescript
import { Request, Response } from 'express';
import { getCandidatesForPosition } from '../../application/services/positionService';

export const getCandidates = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid position ID' });
    return;
  }

  try {
    const candidates = await getCandidatesForPosition(id);
    res.json(candidates);
  } catch (error) {
    if (error instanceof Error && error.message === 'POSITION_NOT_FOUND') {
      res.status(404).json({ error: 'Position not found' });
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
```

- [ ] **Step 2.4: Run tests — verify they pass**

```bash
cd backend && npx jest src/presentation/controllers/__tests__/positionController.test.ts --no-coverage
```

Expected: PASS — 4 tests passing

- [ ] **Step 2.5: Create positionRoutes.ts**

Create `backend/src/routes/positionRoutes.ts`:

```typescript
import { Router } from 'express';
import { getCandidates } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidates);

export default router;
```

- [ ] **Step 2.6: Register /positions in index.ts**

Edit `backend/src/index.ts` — add two lines (import and route registration):

```typescript
// Add after the existing candidateRoutes import (line 5):
import positionRoutes from './routes/positionRoutes';

// Add after app.use('/candidates', candidateRoutes); (line 40):
app.use('/positions', positionRoutes);
```

The relevant section of index.ts after editing:

```typescript
import candidateRoutes from './routes/candidateRoutes';
import positionRoutes from './routes/positionRoutes';
// ...
app.use('/candidates', candidateRoutes);
app.use('/positions', positionRoutes);
```

- [ ] **Step 2.7: Run all tests**

```bash
cd backend && npx jest --no-coverage
```

Expected: PASS — all tests passing

- [ ] **Step 2.8: Commit**

```bash
cd backend && git add src/presentation/controllers/positionController.ts src/presentation/controllers/__tests__/positionController.test.ts src/routes/positionRoutes.ts src/index.ts && git commit -m "feat: add GET /positions/:id/candidates endpoint with tests"
```

---

## Task 3: candidateService — updateCandidateStage (TDD)

**Files:**
- Create: `backend/src/application/services/__tests__/candidateService.test.ts`
- Modify: `backend/src/application/services/candidateService.ts`

- [ ] **Step 3.1: Write the failing tests**

Create `backend/src/application/services/__tests__/candidateService.test.ts`:

```typescript
const mockInterviewStepFindUnique = jest.fn();
const mockApplicationUpdate = jest.fn();

jest.mock('@prisma/client', () => ({
  PrismaClient: jest.fn().mockImplementation(() => ({
    candidate: { findUnique: jest.fn(), update: jest.fn(), create: jest.fn() },
    education: { create: jest.fn() },
    workExperience: { create: jest.fn() },
    resume: { create: jest.fn() },
    application: { update: mockApplicationUpdate, findUnique: jest.fn() },
    interviewStep: { findUnique: mockInterviewStepFindUnique },
  })),
  Prisma: {
    PrismaClientInitializationError: class extends Error {},
  },
}));

import { updateCandidateStage } from '../candidateService';

describe('updateCandidateStage', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns updated application for valid application id and step id', async () => {
    mockInterviewStepFindUnique.mockResolvedValue({ id: 4 });
    mockApplicationUpdate.mockResolvedValue({
      id: 7,
      candidateId: 1,
      positionId: 2,
      currentInterviewStep: 4,
    });

    const result = await updateCandidateStage(7, 4);

    expect(result).toEqual({ id: 7, candidateId: 1, positionId: 2, currentInterviewStep: 4 });
    expect(mockApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { currentInterviewStep: 4 },
      select: { id: true, candidateId: true, positionId: true, currentInterviewStep: true },
    });
  });

  it('throws STEP_NOT_FOUND when the target interview step does not exist', async () => {
    mockInterviewStepFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(7, 999)).rejects.toThrow('STEP_NOT_FOUND');
    expect(mockApplicationUpdate).not.toHaveBeenCalled();
  });

  it('throws APPLICATION_NOT_FOUND when the application does not exist', async () => {
    mockInterviewStepFindUnique.mockResolvedValue({ id: 4 });
    mockApplicationUpdate.mockRejectedValue({ code: 'P2025' });

    await expect(updateCandidateStage(999, 4)).rejects.toThrow('APPLICATION_NOT_FOUND');
  });
});
```

- [ ] **Step 3.2: Run tests — verify they fail**

```bash
cd backend && npx jest src/application/services/__tests__/candidateService.test.ts --no-coverage
```

Expected: FAIL — `updateCandidateStage is not a function`

- [ ] **Step 3.3: Add updateCandidateStage to candidateService.ts**

Open `backend/src/application/services/candidateService.ts`. Add the PrismaClient import and the new function at the end of the file:

```typescript
import { PrismaClient } from '@prisma/client';

// Add after the existing imports at the top of the file:
const prisma = new PrismaClient();
```

Then append at the end of the file:

```typescript
export const updateCandidateStage = async (applicationId: number, currentInterviewStep: number) => {
  const step = await prisma.interviewStep.findUnique({ where: { id: currentInterviewStep } });
  if (!step) throw new Error('STEP_NOT_FOUND');

  try {
    return await prisma.application.update({
      where: { id: applicationId },
      data: { currentInterviewStep },
      select: { id: true, candidateId: true, positionId: true, currentInterviewStep: true },
    });
  } catch (error: any) {
    if (error.code === 'P2025') throw new Error('APPLICATION_NOT_FOUND');
    throw error;
  }
};
```

The full updated top of `candidateService.ts` (lines 1–6):

```typescript
import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
```

- [ ] **Step 3.4: Run tests — verify they pass**

```bash
cd backend && npx jest src/application/services/__tests__/candidateService.test.ts --no-coverage
```

Expected: PASS — 3 tests passing

- [ ] **Step 3.5: Commit**

```bash
cd backend && git add src/application/services/candidateService.ts src/application/services/__tests__/candidateService.test.ts && git commit -m "feat: add updateCandidateStage service with tests"
```

---

## Task 4: candidateController + candidateRoutes — PUT /candidates/:id/stage (TDD)

**Files:**
- Create: `backend/src/presentation/controllers/__tests__/candidateController.test.ts`
- Modify: `backend/src/presentation/controllers/candidateController.ts`
- Modify: `backend/src/routes/candidateRoutes.ts`

- [ ] **Step 4.1: Write the failing controller tests**

Create `backend/src/presentation/controllers/__tests__/candidateController.test.ts`:

```typescript
import { Request, Response } from 'express';
import { updateCandidateStage } from '../candidateController';
import * as candidateService from '../../../application/services/candidateService';

jest.mock('../../../application/services/candidateService');

const mockUpdateCandidateStage = candidateService.updateCandidateStage as jest.Mock;

function makeReq(params: Record<string, string>, body: Record<string, unknown>): Partial<Request> {
  return { params, body };
}

function makeRes() {
  const res = {} as any;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res as { status: jest.Mock; json: jest.Mock };
}

describe('updateCandidateStage controller', () => {
  beforeEach(() => jest.clearAllMocks());

  it('returns 200 with updated application for valid request', async () => {
    const updated = { id: 7, candidateId: 1, positionId: 2, currentInterviewStep: 4 };
    mockUpdateCandidateStage.mockResolvedValue(updated);

    const req = makeReq({ id: '7' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.json).toHaveBeenCalledWith(updated);
  });

  it('returns 400 when :id is not a valid integer', async () => {
    const req = makeReq({ id: 'abc' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'Invalid application ID' });
  });

  it('returns 400 when currentInterviewStep is missing', async () => {
    const req = makeReq({ id: '7' }, {});
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'currentInterviewStep must be a positive integer' });
  });

  it('returns 400 when currentInterviewStep is not a positive integer', async () => {
    const req = makeReq({ id: '7' }, { currentInterviewStep: -1 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ error: 'currentInterviewStep must be a positive integer' });
  });

  it('returns 404 when application is not found', async () => {
    mockUpdateCandidateStage.mockRejectedValue(new Error('APPLICATION_NOT_FOUND'));

    const req = makeReq({ id: '999' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Application not found' });
  });

  it('returns 404 when interview step is not found', async () => {
    mockUpdateCandidateStage.mockRejectedValue(new Error('STEP_NOT_FOUND'));

    const req = makeReq({ id: '7' }, { currentInterviewStep: 999 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ error: 'Interview step not found' });
  });

  it('returns 500 on unexpected error', async () => {
    mockUpdateCandidateStage.mockRejectedValue(new Error('DB connection failed'));

    const req = makeReq({ id: '7' }, { currentInterviewStep: 4 });
    const res = makeRes();

    await updateCandidateStage(req as Request, res as unknown as Response);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
```

- [ ] **Step 4.2: Run tests — verify they fail**

```bash
cd backend && npx jest src/presentation/controllers/__tests__/candidateController.test.ts --no-coverage
```

Expected: FAIL — `updateCandidateStage is not exported from candidateController`

- [ ] **Step 4.3: Add updateCandidateStage to candidateController.ts**

Open `backend/src/presentation/controllers/candidateController.ts`. Update the import and add the new handler:

Replace the first two lines:

```typescript
import { Request, Response } from 'express';
import { addCandidate, findCandidateById } from '../../application/services/candidateService';
```

with:

```typescript
import { Request, Response } from 'express';
import { addCandidate, findCandidateById, updateCandidateStage as updateCandidateStageService } from '../../application/services/candidateService';
```

Then append at the end of the file:

```typescript
export const updateCandidateStage = async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params.id);
  if (isNaN(id) || id <= 0) {
    res.status(400).json({ error: 'Invalid application ID' });
    return;
  }

  const { currentInterviewStep } = req.body;
  if (!Number.isInteger(currentInterviewStep) || currentInterviewStep <= 0) {
    res.status(400).json({ error: 'currentInterviewStep must be a positive integer' });
    return;
  }

  try {
    const updated = await updateCandidateStageService(id, currentInterviewStep);
    res.json(updated);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'APPLICATION_NOT_FOUND') {
        res.status(404).json({ error: 'Application not found' });
      } else if (error.message === 'STEP_NOT_FOUND') {
        res.status(404).json({ error: 'Interview step not found' });
      } else {
        res.status(500).json({ error: 'Internal Server Error' });
      }
    } else {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
};
```

- [ ] **Step 4.4: Run controller tests — verify they pass**

```bash
cd backend && npx jest src/presentation/controllers/__tests__/candidateController.test.ts --no-coverage
```

Expected: PASS — 7 tests passing

- [ ] **Step 4.5: Add PUT /:id/stage to candidateRoutes.ts**

Open `backend/src/routes/candidateRoutes.ts`. Update the import and add the new route:

Replace line 2:

```typescript
import { addCandidate, getCandidateById } from '../presentation/controllers/candidateController';
```

with:

```typescript
import { addCandidate, getCandidateById, updateCandidateStage } from '../presentation/controllers/candidateController';
```

Add the new route after `router.get('/:id', getCandidateById);`:

```typescript
router.put('/:id/stage', updateCandidateStage);
```

- [ ] **Step 4.6: Run all tests**

```bash
cd backend && npx jest --no-coverage
```

Expected: PASS — all tests passing (15 total across 4 test files)

- [ ] **Step 4.7: Commit**

```bash
cd backend && git add src/presentation/controllers/candidateController.ts src/presentation/controllers/__tests__/candidateController.test.ts src/routes/candidateRoutes.ts && git commit -m "feat: add PUT /candidates/:id/stage endpoint with tests"
```

---

## Done

All four tasks complete. Two endpoints are live and fully tested:

- `GET /positions/:id/candidates` — returns candidate pipeline for a position
- `PUT /candidates/:id/stage` — moves a candidate to a new interview step

Verify the full suite one final time:

```bash
cd backend && npx jest --no-coverage
```

Expected: 19 tests passing across 4 test files (5 + 4 + 3 + 7).
