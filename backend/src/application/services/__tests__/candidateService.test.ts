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
    PrismaClientKnownRequestError: class extends Error {
      code: string;
      constructor(
        message: string,
        { code }: { code: string; clientVersion: string },
      ) {
        super(message);
        Object.setPrototypeOf(this, new.target.prototype);
        this.code = code;
      }
    },
  },
}));

import { Prisma } from '@prisma/client';
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

    expect(result).toEqual({
      id: 7,
      candidateId: 1,
      positionId: 2,
      currentInterviewStep: 4,
    });
    expect(mockApplicationUpdate).toHaveBeenCalledWith({
      where: { id: 7 },
      data: { currentInterviewStep: 4 },
      select: {
        id: true,
        candidateId: true,
        positionId: true,
        currentInterviewStep: true,
      },
    });
  });

  it('throws STEP_NOT_FOUND when the target interview step does not exist', async () => {
    mockInterviewStepFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(7, 999)).rejects.toThrow(
      'STEP_NOT_FOUND',
    );
    expect(mockApplicationUpdate).not.toHaveBeenCalled();
  });

  it('throws APPLICATION_NOT_FOUND when the application does not exist', async () => {
    mockInterviewStepFindUnique.mockResolvedValue({ id: 4 });
    const error = new Prisma.PrismaClientKnownRequestError('Record not found', {
      code: 'P2025',
      clientVersion: '5.0.0',
    });
    mockApplicationUpdate.mockRejectedValue(error);

    await expect(updateCandidateStage(999, 4)).rejects.toThrow(
      'APPLICATION_NOT_FOUND',
    );
  });
});
