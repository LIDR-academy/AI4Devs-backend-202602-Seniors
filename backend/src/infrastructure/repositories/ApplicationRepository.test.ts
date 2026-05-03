import { PrismaClient } from '@prisma/client';
import { ApplicationRepository } from './ApplicationRepository';

const mockPrisma = {
  candidate: {
    findUnique: jest.fn(),
  },
  application: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  position: {
    findUnique: jest.fn(),
  },
  interviewStep: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
} as unknown as PrismaClient;

describe('ApplicationRepository - candidateExists', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when candidate exists', async () => {
    // Arrange
    (mockPrisma.candidate.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.candidateExists(1);

    // Assert
    expect(result).toBe(true);
    expect(mockPrisma.candidate.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });

  it('should return false when candidate does not exist', async () => {
    // Arrange
    (mockPrisma.candidate.findUnique as jest.Mock).mockResolvedValue(null);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.candidateExists(999);

    // Assert
    expect(result).toBe(false);
  });
});

describe('ApplicationRepository - findByIdAndCandidateId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when application not found', async () => {
    // Arrange
    (mockPrisma.application.findFirst as jest.Mock).mockResolvedValue(null);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.findByIdAndCandidateId(999, 1);

    // Assert
    expect(result).toBeNull();
    expect(mockPrisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 999, candidateId: 1 },
    });
  });

  it('should return ApplicationData when application found', async () => {
    // Arrange
    const prismaApp = {
      id: 10,
      positionId: 5,
      candidateId: 1,
      applicationDate: new Date('2024-01-01'),
      currentInterviewStep: 2,
      notes: 'Some notes',
    };
    (mockPrisma.application.findFirst as jest.Mock).mockResolvedValue(prismaApp);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.findByIdAndCandidateId(10, 1);

    // Assert
    expect(result).toEqual({
      id: 10,
      positionId: 5,
      candidateId: 1,
      applicationDate: prismaApp.applicationDate,
      currentInterviewStep: 2,
      notes: 'Some notes',
    });
  });

  it('should return ApplicationData with null notes when notes is null', async () => {
    // Arrange
    const prismaApp = {
      id: 10,
      positionId: 5,
      candidateId: 1,
      applicationDate: new Date('2024-01-01'),
      currentInterviewStep: 2,
      notes: null,
    };
    (mockPrisma.application.findFirst as jest.Mock).mockResolvedValue(prismaApp);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.findByIdAndCandidateId(10, 1);

    // Assert
    expect(result).not.toBeNull();
    expect(result!.notes).toBeNull();
  });

  it('should pass correct where clause with both id and candidateId', async () => {
    // Arrange
    (mockPrisma.application.findFirst as jest.Mock).mockResolvedValue(null);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    await repo.findByIdAndCandidateId(42, 7);

    // Assert
    expect(mockPrisma.application.findFirst).toHaveBeenCalledWith({
      where: { id: 42, candidateId: 7 },
    });
  });
});

describe('ApplicationRepository - updateInterviewStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update currentInterviewStep and return updated ApplicationData', async () => {
    // Arrange
    const updatedApp = {
      id: 10,
      positionId: 5,
      candidateId: 1,
      applicationDate: new Date('2024-01-01'),
      currentInterviewStep: 3,
      notes: null,
    };
    (mockPrisma.application.update as jest.Mock).mockResolvedValue(updatedApp);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.updateInterviewStep(10, 3);

    // Assert
    expect(result.currentInterviewStep).toBe(3);
    expect(result.id).toBe(10);
    expect(result.updatedAt).toBeInstanceOf(Date);
    expect(mockPrisma.application.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { currentInterviewStep: 3 },
    });
  });

  it('should include notes in update data when notes provided', async () => {
    // Arrange
    const updatedApp = {
      id: 10,
      positionId: 5,
      candidateId: 1,
      applicationDate: new Date('2024-01-01'),
      currentInterviewStep: 4,
      notes: 'Advanced to final round',
    };
    (mockPrisma.application.update as jest.Mock).mockResolvedValue(updatedApp);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.updateInterviewStep(10, 4, 'Advanced to final round');

    // Assert
    expect(result.notes).toBe('Advanced to final round');
    expect(mockPrisma.application.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { currentInterviewStep: 4, notes: 'Advanced to final round' },
    });
  });

  it('should not include notes in update data when notes is undefined', async () => {
    // Arrange
    const updatedApp = {
      id: 10,
      positionId: 5,
      candidateId: 1,
      applicationDate: new Date('2024-01-01'),
      currentInterviewStep: 3,
      notes: null,
    };
    (mockPrisma.application.update as jest.Mock).mockResolvedValue(updatedApp);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    await repo.updateInterviewStep(10, 3, undefined);

    // Assert
    expect(mockPrisma.application.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { currentInterviewStep: 3 },
    });
  });
});

describe('ApplicationRepository - isValidInterviewStepForPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return false when position does not exist', async () => {
    // Arrange
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue(null);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.isValidInterviewStepForPosition(999, 1);

    // Assert
    expect(result).toBe(false);
    expect(mockPrisma.interviewStep.findFirst).not.toHaveBeenCalled();
  });

  it('should return false when step does not belong to position interview flow', async () => {
    // Arrange
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue({ interviewFlowId: 3 });
    (mockPrisma.interviewStep.findFirst as jest.Mock).mockResolvedValue(null);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.isValidInterviewStepForPosition(1, 99);

    // Assert
    expect(result).toBe(false);
    expect(mockPrisma.interviewStep.findFirst).toHaveBeenCalledWith({
      where: { id: 99, interviewFlowId: 3 },
      select: { id: true },
    });
  });

  it('should return true when step belongs to position interview flow', async () => {
    // Arrange
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue({ interviewFlowId: 3 });
    (mockPrisma.interviewStep.findFirst as jest.Mock).mockResolvedValue({ id: 5 });
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.isValidInterviewStepForPosition(1, 5);

    // Assert
    expect(result).toBe(true);
  });

  it('should query position with correct id', async () => {
    // Arrange
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue({ interviewFlowId: 7 });
    (mockPrisma.interviewStep.findFirst as jest.Mock).mockResolvedValue({ id: 2 });
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    await repo.isValidInterviewStepForPosition(42, 2);

    // Assert
    expect(mockPrisma.position.findUnique).toHaveBeenCalledWith({
      where: { id: 42 },
      select: { interviewFlowId: true },
    });
  });
});

describe('ApplicationRepository - getInterviewStepName', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when step does not exist', async () => {
    // Arrange
    (mockPrisma.interviewStep.findUnique as jest.Mock).mockResolvedValue(null);
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.getInterviewStepName(999);

    // Assert
    expect(result).toBeNull();
  });

  it('should return step name when step exists', async () => {
    // Arrange
    (mockPrisma.interviewStep.findUnique as jest.Mock).mockResolvedValue({ name: 'Technical Interview' });
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    const result = await repo.getInterviewStepName(5);

    // Assert
    expect(result).toBe('Technical Interview');
    expect(mockPrisma.interviewStep.findUnique).toHaveBeenCalledWith({
      where: { id: 5 },
      select: { name: true },
    });
  });

  it('should pass correct id to findUnique', async () => {
    // Arrange
    (mockPrisma.interviewStep.findUnique as jest.Mock).mockResolvedValue({ name: 'HR Screen' });
    const repo = new ApplicationRepository(mockPrisma);

    // Act
    await repo.getInterviewStepName(12);

    // Assert
    expect(mockPrisma.interviewStep.findUnique).toHaveBeenCalledWith({
      where: { id: 12 },
      select: { name: true },
    });
  });
});
