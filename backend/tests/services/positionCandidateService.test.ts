/**
 * Unit tests for {@link findPositionCandidates} (application service).
 *
 * Mocks `@prisma/client` so neither `Position` nor `positionCandidateService`
 * touches a real database. Mock functions are created inside the `jest.mock`
 * factory and read via `jest.requireMock` to avoid hoist ordering issues.
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

import { findPositionCandidates } from '../../src/application/services/positionCandidateService';
import { makeApplication, makePosition } from '../helpers/factories';

const { findUnique: mockFindUnique, findMany: mockFindMany } = (
  jest.requireMock('@prisma/client') as { __mocks__: { findUnique: jest.Mock; findMany: jest.Mock } }
).__mocks__;

/** Covers existence checks, query shape, row mapping, and score aggregation rules. */
describe('findPositionCandidates (service)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** When `Position.findOne` returns null, short-circuits without querying applications. */
  describe('position lookup', () => {
    it('returns null when the position does not exist', async () => {
      mockFindUnique.mockResolvedValue(null);

      const result = await findPositionCandidates(999);

      expect(result).toBeNull();
      expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: 999 } });
      expect(mockFindMany).not.toHaveBeenCalled();
    });

    it('proceeds to fetch applications when the position exists', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([]);

      const result = await findPositionCandidates(1);

      expect(result).not.toBeNull();
      expect(mockFindMany).toHaveBeenCalledTimes(1);
    });
  });

  /** Asserts `findMany` filter, includes, and ordering match production expectations. */
  describe('Prisma query shape', () => {
    it('passes positionId, the expected include shape, and ordering to findMany', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 7 }));
      mockFindMany.mockResolvedValue([]);

      await findPositionCandidates(7);

      expect(mockFindMany).toHaveBeenCalledWith({
        where: { positionId: 7 },
        include: {
          candidate: { select: { id: true, firstName: true, lastName: true } },
          interviews: { select: { score: true } },
        },
        orderBy: [{ applicationDate: 'asc' }, { id: 'asc' }],
      });
    });
  });

  /** A position with zero applications still returns `{ positionId, candidates: [] }`. */
  describe('empty result envelope', () => {
    it('returns an empty candidates array when the position has no applications', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([]);

      const result = await findPositionCandidates(1);

      expect(result).toEqual({ positionId: 1, candidates: [] });
    });
  });

  /** Field-level mapping from Prisma rows to `CandidateInProcess` (including edge cases from the test audit). */
  describe('row mapping', () => {
    it('returns one entry per application for a position with multiple applicants', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({ id: 10, candidateId: 5 }),
        makeApplication({
          id: 11,
          candidateId: 6,
          candidate: { id: 6, firstName: 'John', lastName: 'Smith' },
        }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.positionId).toBe(1);
      expect(result!.candidates).toHaveLength(2);
    });

    it('maps firstName, lastName, and fullName from the included candidate', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({
          candidate: { id: 5, firstName: 'Jane', lastName: 'Doe' },
        }),
      ]);

      const result = await findPositionCandidates(1);
      const candidate = result!.candidates[0];

      expect(candidate.firstName).toBe('Jane');
      expect(candidate.lastName).toBe('Doe');
      expect(candidate.fullName).toBe('Jane Doe');
    });

    it('exposes the application currentInterviewStep FK value as-is', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({ currentInterviewStep: 7 }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].currentInterviewStep).toBe(7);
    });

    it('maps applicationId and candidateId correctly', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({ id: 42, candidateId: 99 }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].applicationId).toBe(42);
      expect(result!.candidates[0].candidateId).toBe(99);
    });

    // Audit §6 — duplicate (positionId, candidateId) applications must not be deduplicated
    it('returns two separate entries when the same candidate has two applications for the position', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      const duplicateCandidate = { id: 5, firstName: 'Jane', lastName: 'Doe' };
      mockFindMany.mockResolvedValue([
        makeApplication({ id: 10, candidateId: 5, candidate: duplicateCandidate }),
        makeApplication({ id: 11, candidateId: 5, candidate: duplicateCandidate }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates).toHaveLength(2);
      expect(result!.candidates[0].applicationId).toBe(10);
      expect(result!.candidates[1].applicationId).toBe(11);
      expect(result!.candidates[0].candidateId).toBe(5);
      expect(result!.candidates[1].candidateId).toBe(5);
    });

    // Audit §6 — fullName trim behavior with surrounding whitespace
    it('produces a trimmed fullName when first or last name has surrounding whitespace', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({
          candidate: { id: 5, firstName: ' Ana ', lastName: ' Pérez ' },
        }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].fullName).toBe('Ana   Pérez');
    });
  });

  /** Mean of non-null scores; null when no usable scores; fractional averages allowed. */
  describe('averageInterviewScore', () => {
    it('computes the average for multiple non-null scores ([6, 10] → 8)', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({ interviews: [{ score: 6 }, { score: 10 }] }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].averageInterviewScore).toBe(8);
    });

    it('returns null when the application has no interviews', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([makeApplication({ interviews: [] })]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].averageInterviewScore).toBeNull();
    });

    it('returns null when all interview scores are null', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({ interviews: [{ score: null }, { score: null }] }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].averageInterviewScore).toBeNull();
    });

    it('averages only non-null scores when scores are mixed (null, 4, 8 → 6)', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({
          interviews: [{ score: null }, { score: 4 }, { score: 8 }],
        }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].averageInterviewScore).toBe(6);
    });

    // Audit §6 — single non-null score returned as a number
    it('returns the single score as a number when only one interview has a score ([5] → 5)', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({ interviews: [{ score: 5 }] }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].averageInterviewScore).toBe(5);
      expect(typeof result!.candidates[0].averageInterviewScore).toBe('number');
    });

    // Audit §6 — DB stores Int but average can be fractional
    it('returns a fractional number when the average is non-integer ([1, 2] → 1.5)', async () => {
      mockFindUnique.mockResolvedValue(makePosition({ id: 1 }));
      mockFindMany.mockResolvedValue([
        makeApplication({ interviews: [{ score: 1 }, { score: 2 }] }),
      ]);

      const result = await findPositionCandidates(1);

      expect(result!.candidates[0].averageInterviewScore).toBeCloseTo(1.5);
    });
  });
});
