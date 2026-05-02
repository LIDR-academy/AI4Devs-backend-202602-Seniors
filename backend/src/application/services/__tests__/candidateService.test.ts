// ---------------------------------------------------------------------------
// Prisma mock — must be declared BEFORE any module that imports @prisma/client.
//
// We spread jest.requireActual('@prisma/client') into the return value so that
// the real Prisma namespace (including the real PrismaClientInitializationError
// class) is preserved.  This is essential for US-11: Candidate.save() uses
// `instanceof Prisma.PrismaClientInitializationError`, and that check only
// passes when both sides reference the same class object from the real package.
// ---------------------------------------------------------------------------
const mockCandidateFindUnique = jest.fn();
const mockCandidateCreate = jest.fn();
const mockEducationCreate = jest.fn();
const mockWorkExperienceCreate = jest.fn();
const mockResumeCreate = jest.fn();
const mockInterviewStepFindUnique = jest.fn();
const mockApplicationFindMany = jest.fn();
const mockApplicationUpdateMany = jest.fn();

jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');

  const mockPrismaClient = jest.fn().mockImplementation(() => ({
    candidate: {
      create: mockCandidateCreate,
      update: jest.fn(),
      findUnique: mockCandidateFindUnique,
    },
    education: {
      create: mockEducationCreate,
      update: jest.fn(),
    },
    workExperience: {
      create: mockWorkExperienceCreate,
      update: jest.fn(),
    },
    resume: {
      create: mockResumeCreate,
    },
    interviewStep: {
      findUnique: mockInterviewStepFindUnique,
    },
    application: {
      findMany: mockApplicationFindMany,
      updateMany: mockApplicationUpdateMany,
    },
  }));

  return {
    ...actual,
    PrismaClient: mockPrismaClient,
  };
});

// ---------------------------------------------------------------------------
// Imports (after all jest.mock calls)
// ---------------------------------------------------------------------------
import { updateCandidateStage } from '../candidateService';

describe('updateCandidateStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should_throw_error_when_candidate_is_not_found', async () => {
    mockCandidateFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(999, 1)).rejects.toThrow('Candidate not found');
  });

  it('should_throw_error_when_interview_step_is_not_found', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue(null);

    await expect(updateCandidateStage(1, 999)).rejects.toThrow('Interview step not found');
  });

  it('should_throw_error_when_candidate_has_no_applications', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 5,
      name: 'Technical Interview',
      orderIndex: 2
    });
    mockApplicationFindMany.mockResolvedValue([]);

    await expect(updateCandidateStage(1, 5)).rejects.toThrow('Candidate has no applications');
  });

  it('should_update_all_applications_when_candidate_has_multiple_applications', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 5,
      name: 'Technical Interview',
      orderIndex: 2
    });
    mockApplicationFindMany.mockResolvedValue([
      { id: 1, candidateId: 1, positionId: 1, currentInterviewStep: 3 },
      { id: 2, candidateId: 1, positionId: 2, currentInterviewStep: 4 }
    ]);
    mockApplicationUpdateMany.mockResolvedValue({ count: 2 });

    const result = await updateCandidateStage(1, 5);

    expect(mockCandidateFindUnique).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(mockInterviewStepFindUnique).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(mockApplicationFindMany).toHaveBeenCalledWith({ where: { candidateId: 1 } });
    expect(mockApplicationUpdateMany).toHaveBeenCalledWith({
      where: { candidateId: 1 },
      data: { currentInterviewStep: 5 }
    });
    expect(result).toEqual({
      message: 'Candidate stage updated successfully',
      updatedApplications: 2
    });
  });

  it('should_update_a_single_application_when_candidate_has_one_application', async () => {
    mockCandidateFindUnique.mockResolvedValue({
      id: 1,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john@example.com'
    });
    mockInterviewStepFindUnique.mockResolvedValue({
      id: 3,
      name: 'HR Interview',
      orderIndex: 1
    });
    mockApplicationFindMany.mockResolvedValue([
      { id: 1, candidateId: 1, positionId: 1, currentInterviewStep: 2 }
    ]);
    mockApplicationUpdateMany.mockResolvedValue({ count: 1 });

    const result = await updateCandidateStage(1, 3);

    expect(mockApplicationUpdateMany).toHaveBeenCalledWith({
      where: { candidateId: 1 },
      data: { currentInterviewStep: 3 }
    });
    expect(result).toEqual({
      message: 'Candidate stage updated successfully',
      updatedApplications: 1
    });
  });

  it('should_propagate_error_when_database_throws', async () => {
    const dbError = new Error('Database connection failed');
    mockCandidateFindUnique.mockRejectedValue(dbError);

    await expect(updateCandidateStage(1, 5)).rejects.toThrow('Database connection failed');
  });
});
