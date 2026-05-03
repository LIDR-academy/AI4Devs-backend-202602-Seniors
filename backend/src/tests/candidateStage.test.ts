jest.mock('@prisma/client', () => {
  const mockApplicationFindFirst = jest.fn();
  const mockInterviewStepFindUnique = jest.fn();
  const mockApplicationUpdate = jest.fn();
  return {
    PrismaClient: jest.fn().mockImplementation(() => ({
      application: {
        findFirst: mockApplicationFindFirst,
        update: mockApplicationUpdate,
      },
      interviewStep: { findUnique: mockInterviewStepFindUnique },
    })),
  };
});

import { PrismaClient } from '@prisma/client';
import { updateCandidateStage } from '../application/services/candidateService';

const prismaMock = new PrismaClient() as jest.Mocked<any>;

describe('updateCandidateStage service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('throws when application not found for candidate', async () => {
    prismaMock.application.findFirst.mockResolvedValue(null);

    await expect(updateCandidateStage(1, 10, 3)).rejects.toThrow(
      'Application not found for this candidate'
    );
  });

  it('throws when interview step not found', async () => {
    prismaMock.application.findFirst.mockResolvedValue({
      id: 10,
      candidateId: 1,
      position: { interviewFlowId: 5 },
    });
    prismaMock.interviewStep.findUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(1, 10, 3)).rejects.toThrow('InterviewStep not found');
  });

  it('throws when step does not belong to position flow', async () => {
    prismaMock.application.findFirst.mockResolvedValue({
      id: 10,
      candidateId: 1,
      position: { interviewFlowId: 1 },
    });
    prismaMock.interviewStep.findUnique.mockResolvedValue({
      id: 3,
      interviewFlowId: 2,
    });

    await expect(updateCandidateStage(1, 10, 3)).rejects.toThrow(
      'InterviewStep does not belong to the InterviewFlow of this position'
    );
  });

  it('calls application.update with correct data', async () => {
    const applicationId = 10;
    const currentInterviewStep = 3;

    prismaMock.application.findFirst.mockResolvedValue({
      id: applicationId,
      candidateId: 1,
      position: { interviewFlowId: 5 },
    });
    prismaMock.interviewStep.findUnique.mockResolvedValue({
      id: currentInterviewStep,
      interviewFlowId: 5,
    });
    prismaMock.application.update.mockResolvedValue({
      id: applicationId,
      currentInterviewStep,
    });

    await updateCandidateStage(1, applicationId, currentInterviewStep);

    expect(prismaMock.application.update).toHaveBeenCalledWith({
      where: { id: applicationId },
      data: { currentInterviewStep },
    });
  });

  it('returns applicationId and currentInterviewStep on success', async () => {
    prismaMock.application.findFirst.mockResolvedValue({
      id: 5,
      candidateId: 1,
      position: { interviewFlowId: 7 },
    });
    prismaMock.interviewStep.findUnique.mockResolvedValue({
      id: 3,
      interviewFlowId: 7,
    });
    prismaMock.application.update.mockResolvedValue({
      id: 5,
      currentInterviewStep: 3,
    });

    const result = await updateCandidateStage(1, 5, 3);

    expect(result).toEqual({ applicationId: 5, currentInterviewStep: 3 });
  });
});
