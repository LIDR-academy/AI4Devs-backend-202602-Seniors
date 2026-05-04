/**
 * Unit tests for {@link getPositionCandidates}.
 *
 * Mocks `positionCandidateService` so HTTP status and JSON mapping are tested
 * in isolation from Prisma and service mapping (covered in
 * `positionCandidateService.test.ts`). Avoids sharing one Prisma mock across
 * multiple client instances.
 */
jest.mock('../../src/application/services/positionCandidateService', () => ({
  findPositionCandidates: jest.fn(),
}));

import { Request, Response } from 'express';
import { getPositionCandidates } from '../../src/presentation/controllers/positionController';
import { findPositionCandidates } from '../../src/application/services/positionCandidateService';
import { makeReq, makeRes } from '../helpers/factories';

const mockFindPositionCandidates = findPositionCandidates as jest.MockedFunction<
  typeof findPositionCandidates
>;

/** HTTP layer: parameter parsing, delegation to the service, and error status mapping. */
describe('getPositionCandidates (controller)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Non-numeric `id` yields 400 without calling the service. */
  describe('400 — invalid id', () => {
    it('responds 400 with { error: "Invalid ID format" } for a non-numeric id ("abc")', async () => {
      const req = makeReq({ id: 'abc' });
      const res = makeRes();

      await getPositionCandidates(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
      expect(mockFindPositionCandidates).not.toHaveBeenCalled();
    });

    it('responds 400 for an empty id string ("")', async () => {
      const req = makeReq({ id: '' });
      const res = makeRes();

      await getPositionCandidates(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid ID format' });
    });

    // Audit §6 / §8 mandatory — document the id=0 boundary
    it('treats id "0" as a valid parse (isNaN(0) === false) and forwards 0 to the service', async () => {
      mockFindPositionCandidates.mockResolvedValue(null);
      const req = makeReq({ id: '0' });
      const res = makeRes();

      await getPositionCandidates(req as Request, res);

      expect(mockFindPositionCandidates).toHaveBeenCalledWith(0);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Position not found' });
    });
  });

  /** Service returning `null` maps to 404 with a stable error payload. */
  describe('404 — position not found', () => {
    it('responds 404 with { error: "Position not found" } when the service returns null', async () => {
      mockFindPositionCandidates.mockResolvedValue(null);
      const req = makeReq({ id: '999' });
      const res = makeRes();

      await getPositionCandidates(req as Request, res);

      expect(mockFindPositionCandidates).toHaveBeenCalledWith(999);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Position not found' });
    });
  });

  /** Forwards the service envelope as JSON 200 (full equality on the happy path). */
  describe('200 — happy path', () => {
    it('responds 200 with the full envelope returned by the service (all fields present)', async () => {
      const serviceResult = {
        positionId: 1,
        candidates: [
          {
            applicationId: 10,
            candidateId: 5,
            firstName: 'Jane',
            lastName: 'Doe',
            fullName: 'Jane Doe',
            currentInterviewStep: 3,
            averageInterviewScore: 8,
          },
        ],
      };
      mockFindPositionCandidates.mockResolvedValue(serviceResult);
      const req = makeReq({ id: '1' });
      const res = makeRes();

      await getPositionCandidates(req as Request, res);

      expect(res.status).not.toHaveBeenCalledWith(400);
      expect(res.status).not.toHaveBeenCalledWith(404);
      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledTimes(1);
      // Full shape assertion (audit Finding 3) — no objectContaining/arrayContaining
      expect(res.json).toHaveBeenCalledWith(serviceResult);
    });

    it('responds 200 with an empty candidates array when the position has no applications', async () => {
      mockFindPositionCandidates.mockResolvedValue({
        positionId: 2,
        candidates: [],
      });
      const req = makeReq({ id: '2' });
      const res = makeRes();

      await getPositionCandidates(req as Request, res);

      expect(res.json).toHaveBeenCalledWith({ positionId: 2, candidates: [] });
    });
  });

  /** Uncaught service errors become generic 500 JSON (no stack leak). */
  describe('500 — unexpected errors', () => {
    it('responds 500 with { error: "Internal Server Error" } when the service throws', async () => {
      mockFindPositionCandidates.mockRejectedValue(new Error('DB connection lost'));
      const req = makeReq({ id: '1' });
      const res = makeRes();

      await getPositionCandidates(req as Request, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal Server Error' });
    });
  });
});
