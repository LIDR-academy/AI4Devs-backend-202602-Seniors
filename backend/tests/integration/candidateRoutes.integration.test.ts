/**
 * Integration tests for `PUT /candidates/:id/stage`.
 *
 * Exercises the real Express `app` from `src/index.ts` via supertest. Prisma
 * is mocked at the `@prisma/client` module level so no database is required.
 * `app.listen` is skipped when `NODE_ENV === 'test'`, so importing `app` does
 * not bind to port 3010 during the suite.
 */
jest.mock('@prisma/client', () => {
  const findUniqueCandidate = jest.fn();
  const findUniqueApplication = jest.fn();
  const updateApplication = jest.fn();
  const findUniqueInterviewStep = jest.fn();
  // Position-related Prisma calls are also stubbed because the real `app`
  // imports `positionRoutes` which instantiates a `PrismaClient` for the
  // shared mocked singleton; not stubbing them would not break this suite,
  // but exposing them keeps the mock surface explicit.
  const findUniquePosition = jest.fn();
  const findManyApplication = jest.fn();
  const mockPrismaInstance = {
    candidate: { findUnique: findUniqueCandidate },
    application: {
      findUnique: findUniqueApplication,
      update: updateApplication,
      findMany: findManyApplication,
    },
    interviewStep: { findUnique: findUniqueInterviewStep },
    position: { findUnique: findUniquePosition },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
    __mocks__: {
      findUniqueCandidate,
      findUniqueApplication,
      updateApplication,
      findUniqueInterviewStep,
    },
  };
});

import request from 'supertest';
import { app } from '../../src/index';
import {
  makeApplicationWithPosition,
  makeCandidateRow,
  makeInterviewStep,
  makeStageUpdateBody,
} from '../helpers/factories';

/**
 * Prisma method mocks surfaced from the hoisted `jest.mock('@prisma/client')` factory — typed accessors
 * avoid scattering `jest.requireMock` casts in every testcase.
 */
const {
  findUniqueCandidate: mockFindUniqueCandidate,
  findUniqueApplication: mockFindUniqueApplication,
  updateApplication: mockUpdateApplication,
  findUniqueInterviewStep: mockFindUniqueInterviewStep,
} = (
  jest.requireMock('@prisma/client') as {
    __mocks__: {
      findUniqueCandidate: jest.Mock;
      findUniqueApplication: jest.Mock;
      updateApplication: jest.Mock;
      findUniqueInterviewStep: jest.Mock;
    };
  }
).__mocks__;

/** End-to-end HTTP behavior for the stage-update route mounted on the real app. */
describe('PUT /candidates/:id/stage (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Confirms `/candidates` router wiring picks up the new PUT verb. */
  describe('route mounting', () => {
    it('is reachable under the /candidates prefix as PUT (router mount works)', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 10, candidateId: 5 }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(
        makeInterviewStep({ id: 3, interviewFlowId: 1 }),
      );
      mockUpdateApplication.mockResolvedValue({
        id: 10,
        positionId: 1,
        candidateId: 5,
        applicationDate: new Date('2024-01-01'),
        currentInterviewStep: 3,
        notes: null,
      });

      const response = await request(app)
        .put('/candidates/5/stage')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(200);
    });
  });

  /** Status codes and JSON bodies for validation, success, and error paths. */
  describe('HTTP contract', () => {
    /** Row 1 — happy path: response matches the Prisma row from update(). */
    it('responds 200 application/json with the updated Application row', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 10, candidateId: 5 }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(
        makeInterviewStep({ id: 3, interviewFlowId: 1 }),
      );
      const updatedRow = {
        id: 10,
        positionId: 1,
        candidateId: 5,
        applicationDate: new Date('2024-01-01'),
        currentInterviewStep: 3,
        notes: null,
      };
      mockUpdateApplication.mockResolvedValue(updatedRow);

      const response = await request(app)
        .put('/candidates/5/stage')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({
        id: 10,
        positionId: 1,
        candidateId: 5,
        applicationDate: new Date('2024-01-01').toISOString(),
        currentInterviewStep: 3,
        notes: null,
      });
    });

    /** Row 3 — non-numeric `:id` → 400. */
    it('responds 400 application/json when the id is not numeric', async () => {
      const response = await request(app)
        .put('/candidates/abc/stage')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({ error: 'Invalid ID format' });
    });

    /** Row 6 — unknown candidate → 404. */
    it('responds 404 application/json when the candidate does not exist', async () => {
      mockFindUniqueCandidate.mockResolvedValue(null);

      const response = await request(app)
        .put('/candidates/999/stage')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({ error: 'Candidate not found' });
    });

    /** Row 12 — unknown application → 404. */
    it('responds 404 application/json when the application does not exist', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(null);

      const response = await request(app)
        .put('/candidates/5/stage')
        .send(makeStageUpdateBody({ applicationId: 999 }));

      expect(response.status).toBe(404);
      expect(response.body).toEqual({ error: 'Application not found' });
    });

    /** Row 14 — application belongs to another candidate → 409. */
    it('responds 409 when the application belongs to a different candidate', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 11, candidateId: 7 }),
      );

      const response = await request(app)
        .put('/candidates/5/stage')
        .send(makeStageUpdateBody({ applicationId: 11 }));

      expect(response.status).toBe(409);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({
        error: 'Application does not belong to candidate',
      });
    });

    /** Row 15 — step belongs to wrong flow → 400. */
    it('responds 400 when the step belongs to a different InterviewFlow', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({
          id: 10,
          candidateId: 5,
          position: { interviewFlowId: 1 },
        }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(
        makeInterviewStep({ id: 3, interviewFlowId: 2 }),
      );

      const response = await request(app)
        .put('/candidates/5/stage')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        error: "Stage does not belong to the candidate's interview flow",
      });
    });

    /** Row 17 — unexpected DB failure surfaces as JSON 500. */
    it('responds 500 application/json when Prisma throws unexpectedly', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockRejectedValue(
        new Error('DB connection lost'),
      );

      const response = await request(app)
        .put('/candidates/5/stage')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(500);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  /** Rows 18 & 19 — non-PUT verbs on this path must not hit the handler. */
  describe('HTTP method gating', () => {
    it('returns 404 for GET on /candidates/:id/stage and never hits Prisma mocks', async () => {
      const response = await request(app).get('/candidates/5/stage');

      expect(response.status).toBe(404);
      expect(mockFindUniqueCandidate).not.toHaveBeenCalled();
      expect(mockFindUniqueApplication).not.toHaveBeenCalled();
    });

    it('returns 404 for DELETE on /candidates/:id/stage and never hits Prisma mocks', async () => {
      const response = await request(app).delete('/candidates/5/stage');

      expect(response.status).toBe(404);
      expect(mockFindUniqueCandidate).not.toHaveBeenCalled();
      expect(mockFindUniqueApplication).not.toHaveBeenCalled();
    });
  });

  /**
   * Validator runs on the parsed body — malformed JSON is rejected by express.json before the route handler.
   * This documents the project's global behavior (syntax errors hit the Express error middleware).
   */
  describe('malformed JSON body', () => {
    it('responds 500 text/plain when the body is not valid JSON', async () => {
      const response = await request(app)
        .put('/candidates/5/stage')
        .set('Content-Type', 'application/json')
        .send('{');

      expect(response.status).toBe(500);
      expect(response.text).toContain('Something broke');
      expect(mockFindUniqueCandidate).not.toHaveBeenCalled();
    });
  });

  /** End-to-end `step_not_found` through routing + controller (Prisma mocked). */
  describe('interview step not found', () => {
    it('responds 404 application/json when interviewStep.findUnique returns null', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 10, candidateId: 5 }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(null);

      const response = await request(app)
        .put('/candidates/5/stage')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({
        error: 'Interview step not found',
      });
      expect(mockUpdateApplication).not.toHaveBeenCalled();
    });
  });

  /** Row 20 — no auth in the project; unauthenticated requests reach the handler. */
  describe('no auth required (smoke)', () => {
    it('processes the PUT without any auth headers and returns the same 200 happy path', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 10, candidateId: 5 }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(
        makeInterviewStep({ id: 3, interviewFlowId: 1 }),
      );
      mockUpdateApplication.mockResolvedValue({
        id: 10,
        positionId: 1,
        candidateId: 5,
        applicationDate: new Date('2024-01-01'),
        currentInterviewStep: 3,
        notes: null,
      });

      const response = await request(app)
        .put('/candidates/5/stage')
        .set('Content-Type', 'application/json')
        .send(makeStageUpdateBody());

      expect(response.status).toBe(200);
    });
  });
});
