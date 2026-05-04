/**
 * Unit tests for {@link updateCandidateStage} (application service).
 *
 * Mocks `@prisma/client` so neither the `Candidate` domain model nor
 * `candidateStageService` touches a real database. Mock functions are created
 * inside the `jest.mock` factory and read via `jest.requireMock` to avoid
 * hoist ordering issues — same pattern as `positionCandidateService.test.ts`.
 */
jest.mock('@prisma/client', () => {
  const findUniqueCandidate = jest.fn();
  const findUniqueApplication = jest.fn();
  const updateApplication = jest.fn();
  const findUniqueInterviewStep = jest.fn();
  const mockPrismaInstance = {
    candidate: { findUnique: findUniqueCandidate },
    application: {
      findUnique: findUniqueApplication,
      update: updateApplication,
    },
    interviewStep: { findUnique: findUniqueInterviewStep },
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

import { updateCandidateStage } from '../../src/application/services/candidateStageService';
import {
  makeApplicationWithPosition,
  makeCandidateRow,
  makeInterviewStep,
  makeStageUpdateBody,
} from '../helpers/factories';

/**
 * Narrowed handles to the Prisma doubles created in the `@prisma/client` mock factory (see suite header comment).
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

/**
 * Asserts validation order, ownership/flow checks, and the Prisma call shape.
 * Each test exercises one variant of `StageUpdateResult`.
 */
describe('updateCandidateStage (service)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  /** Row 1 — successful update returns `{ kind: 'ok', application }`. */
  describe('happy path', () => {
    it('returns ok and forwards the exact update arguments to Prisma', async () => {
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

      const result = await updateCandidateStage(5, makeStageUpdateBody());

      expect(result).toEqual({ kind: 'ok', application: updatedRow });
      expect(mockUpdateApplication).toHaveBeenCalledTimes(1);
      expect(mockUpdateApplication).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { currentInterviewStep: 3 },
      });
    });

    /** Row 2 — same-step PUT is allowed and still calls update. */
    it('is idempotent when the application is already at the requested step', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({
          id: 10,
          candidateId: 5,
          currentInterviewStep: 3,
        }),
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

      const result = await updateCandidateStage(5, makeStageUpdateBody());

      expect(result.kind).toBe('ok');
      expect(mockUpdateApplication).toHaveBeenCalledTimes(1);
    });
  });

  /** Row 6 — candidate lookup short-circuits the rest of the flow. */
  describe('candidate not found', () => {
    it('returns candidate_not_found and never calls application/interviewStep/update', async () => {
      mockFindUniqueCandidate.mockResolvedValue(null);

      const result = await updateCandidateStage(999, makeStageUpdateBody());

      expect(result).toEqual({ kind: 'candidate_not_found' });
      expect(mockFindUniqueApplication).not.toHaveBeenCalled();
      expect(mockFindUniqueInterviewStep).not.toHaveBeenCalled();
      expect(mockUpdateApplication).not.toHaveBeenCalled();
    });
  });

  /** Row 12 — application lookup short-circuits step lookup and update. */
  describe('application not found', () => {
    it('returns application_not_found when the application does not exist', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(null);

      const result = await updateCandidateStage(
        5,
        makeStageUpdateBody({ applicationId: 999 }),
      );

      expect(result).toEqual({ kind: 'application_not_found' });
      expect(mockFindUniqueInterviewStep).not.toHaveBeenCalled();
      expect(mockUpdateApplication).not.toHaveBeenCalled();
    });
  });

  /** Row 13 — interview step lookup short-circuits the update. */
  describe('interview step not found', () => {
    it('returns step_not_found when the new step does not exist', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 10, candidateId: 5 }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(null);

      const result = await updateCandidateStage(5, makeStageUpdateBody());

      expect(result).toEqual({ kind: 'step_not_found' });
      expect(mockUpdateApplication).not.toHaveBeenCalled();
    });
  });

  /** Row 14 — application belongs to a different candidate (multi-application case). */
  describe('application/candidate mismatch', () => {
    it('returns application_candidate_mismatch when application.candidateId !== :id', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 11, candidateId: 7 }),
      );

      const result = await updateCandidateStage(
        5,
        makeStageUpdateBody({ applicationId: 11 }),
      );

      expect(result).toEqual({ kind: 'application_candidate_mismatch' });
      expect(mockFindUniqueInterviewStep).not.toHaveBeenCalled();
      expect(mockUpdateApplication).not.toHaveBeenCalled();
    });
  });

  /** Row 15 — step belongs to a different InterviewFlow than the application's position. */
  describe('step ↔ flow consistency', () => {
    it('returns invalid_stage_for_flow when interviewFlowId differs from the application flow', async () => {
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

      const result = await updateCandidateStage(5, makeStageUpdateBody());

      expect(result).toEqual({ kind: 'invalid_stage_for_flow' });
      expect(mockUpdateApplication).not.toHaveBeenCalled();
    });
  });

  /** Row 16 — Prisma `P2025` from the update remaps to application_not_found. */
  describe('race-condition delete (P2025)', () => {
    it('remaps Prisma P2025 from update() to application_not_found', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 10, candidateId: 5 }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(
        makeInterviewStep({ id: 3, interviewFlowId: 1 }),
      );
      mockUpdateApplication.mockRejectedValue(
        Object.assign(new Error('Record to update not found'), { code: 'P2025' }),
      );

      const result = await updateCandidateStage(5, makeStageUpdateBody());

      expect(result).toEqual({ kind: 'application_not_found' });
    });

    it('rethrows non-P2025 errors so the controller maps them to 500', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      mockFindUniqueApplication.mockResolvedValue(
        makeApplicationWithPosition({ id: 10, candidateId: 5 }),
      );
      mockFindUniqueInterviewStep.mockResolvedValue(
        makeInterviewStep({ id: 3, interviewFlowId: 1 }),
      );
      mockUpdateApplication.mockRejectedValue(new Error('DB connection lost'));

      await expect(
        updateCandidateStage(5, makeStageUpdateBody()),
      ).rejects.toThrow('DB connection lost');
    });
  });

  /** Row 21 — only the targeted application is mutated when the candidate has multiple. */
  describe('candidate with multiple applications', () => {
    it('updates exactly the application identified by applicationId in the body', async () => {
      mockFindUniqueCandidate.mockResolvedValue(makeCandidateRow({ id: 5 }));
      // Simulate the requested application being app 10; app 11 is never looked
      // up because findUnique is keyed by id.
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

      await updateCandidateStage(
        5,
        makeStageUpdateBody({ applicationId: 10, currentInterviewStep: 3 }),
      );

      expect(mockFindUniqueApplication).toHaveBeenCalledTimes(1);
      expect(mockFindUniqueApplication).toHaveBeenCalledWith({
        where: { id: 10 },
        include: { position: { select: { interviewFlowId: true } } },
      });
      expect(mockUpdateApplication).toHaveBeenCalledTimes(1);
      expect(mockUpdateApplication).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { currentInterviewStep: 3 },
      });
    });
  });

  /** Validator integration: invalid bodies short-circuit to invalid_input. */
  describe('body validation', () => {
    it('returns invalid_input with "Invalid request body" when body is not an object', async () => {
      const result = await updateCandidateStage(5, undefined);

      expect(result).toEqual({
        kind: 'invalid_input',
        message: 'Invalid request body',
      });
      expect(mockFindUniqueCandidate).not.toHaveBeenCalled();
    });

    it('returns invalid_input with "Invalid applicationId" when applicationId is missing', async () => {
      const result = await updateCandidateStage(5, { currentInterviewStep: 3 });

      expect(result).toEqual({
        kind: 'invalid_input',
        message: 'Invalid applicationId',
      });
    });

    it('returns invalid_input with "Invalid currentInterviewStep" when value is not a positive integer', async () => {
      const result = await updateCandidateStage(5, {
        applicationId: 10,
        currentInterviewStep: 0,
      });

      expect(result).toEqual({
        kind: 'invalid_input',
        message: 'Invalid currentInterviewStep',
      });
    });

    it('returns invalid_input when applicationId is a non-integer number (fractional)', async () => {
      const result = await updateCandidateStage(5, {
        applicationId: 1.5,
        currentInterviewStep: 3,
      });

      expect(result).toEqual({
        kind: 'invalid_input',
        message: 'Invalid applicationId',
      });
      expect(mockFindUniqueCandidate).not.toHaveBeenCalled();
    });

    it('returns invalid_input when applicationId is a non-numeric string', async () => {
      const result = await updateCandidateStage(5, {
        applicationId: 'foo' as unknown as number,
        currentInterviewStep: 3,
      });

      expect(result).toEqual({
        kind: 'invalid_input',
        message: 'Invalid applicationId',
      });
      expect(mockFindUniqueCandidate).not.toHaveBeenCalled();
    });

    /** Empty `{}` still has typeof object — applicationId fails positive-integer validation. */
    it('returns invalid_input with "Invalid applicationId" for an empty object body', async () => {
      const result = await updateCandidateStage(5, {});

      expect(result).toEqual({
        kind: 'invalid_input',
        message: 'Invalid applicationId',
      });
      expect(mockFindUniqueCandidate).not.toHaveBeenCalled();
    });
  });
});
