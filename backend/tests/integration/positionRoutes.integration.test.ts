/**
 * Integration tests for `GET /positions/:id/candidates`.
 *
 * Exercises the real Express `app` from `src/index.ts` via supertest. Prisma is
 * mocked at the `@prisma/client` module level so no database is required.
 * `app.listen` is skipped when `NODE_ENV === 'test'`, so importing `app` does
 * not bind to port 3010 during the suite.
 */
jest.mock('@prisma/client', () => {
  const findUnique = jest.fn();
  const findMany = jest.fn();
  const mockPrismaInstance = {
    position: { findUnique },
    application: { findMany },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaInstance),
    __mocks__: { findUnique, findMany },
  };
});

import request from 'supertest';
import { app } from '../../src/index';
import { makeApplication, makePosition } from '../helpers/factories';

const { findUnique: mockFindUnique, findMany: mockFindMany } = (
  jest.requireMock('@prisma/client') as {
    __mocks__: { findUnique: jest.Mock; findMany: jest.Mock };
  }
).__mocks__;

/**
 * End-to-end HTTP behavior for the position candidates route mounted on the real app.
 */
describe('GET /positions/:id/candidates (integration)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Confirms `/positions` router wiring and that unrelated paths are not exposed. */
  describe('route mounting', () => {
    it('is reachable under the /positions prefix (router mount works)', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([]);

      const response = await request(app).get('/positions/1/candidates');

      expect(response.status).toBe(200);
    });

    it('rejects unknown paths under /positions with 404 (no extra routes leaked)', async () => {
      const response = await request(app).get('/positions/1/something-else');

      expect(response.status).toBe(404);
    });
  });

  /** Status codes and JSON bodies for validation, success, empty, and error paths. */
  describe('HTTP contract', () => {
    it('responds 400 application/json when the id is not numeric', async () => {
      const response = await request(app).get('/positions/abc/candidates');

      expect(response.status).toBe(400);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({ error: 'Invalid ID format' });
    });

    it('responds 404 application/json when the position does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      const response = await request(app).get('/positions/999/candidates');

      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({ error: 'Position not found' });
    });

    it('responds 200 with positionId + candidates envelope on the happy path', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({
          id: 10,
          candidateId: 5,
          candidate: { id: 5, firstName: 'Jane', lastName: 'Doe' },
          interviews: [{ score: 8 }, { score: 6 }],
        }),
      ]);

      const response = await request(app).get('/positions/1/candidates');

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({
        positionId: 1,
        candidates: [
          {
            applicationId: 10,
            candidateId: 5,
            firstName: 'Jane',
            lastName: 'Doe',
            fullName: 'Jane Doe',
            currentInterviewStep: 3,
            averageInterviewScore: 7,
          },
        ],
      });
    });

    it('responds 200 with an empty candidates array when the position has no applications', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([]);

      const response = await request(app).get('/positions/1/candidates');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ positionId: 1, candidates: [] });
    });

    it('responds 500 with { error: "Internal Server Error" } when Prisma throws unexpectedly', async () => {
      mockFindUnique.mockRejectedValue(new Error('DB connection lost'));

      const response = await request(app).get('/positions/1/candidates');

      expect(response.status).toBe(500);
      expect(response.headers['content-type']).toMatch(/application\/json/);
      expect(response.body).toEqual({ error: 'Internal Server Error' });
    });
  });

  /** Non-GET verbs on this path must not hit the list handler (Express 404/500 behavior). */
  describe('HTTP method gating', () => {
    it('does not accept POST on /positions/:id/candidates', async () => {
      const response = await request(app).post('/positions/1/candidates');

      // Express returns 404 (or text "Something broke!" via global error
      // handler) for unmounted verb/path combos. Either is acceptable as
      // long as the request is NOT routed to getPositionCandidates.
      expect([404, 500]).toContain(response.status);
    });

    it('does not accept DELETE on /positions/:id/candidates', async () => {
      const response = await request(app).delete('/positions/1/candidates');

      expect([404, 500]).toContain(response.status);
    });
  });
});
