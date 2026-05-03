import { PrismaClient } from '@prisma/client';
import { PositionRepository } from './PositionRepository';

const mockPrisma = {
  position: {
    findUnique: jest.fn(),
  },
  application: {
    findMany: jest.fn(),
  },
} as unknown as PrismaClient;

describe('PositionRepository - existsById', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return true when position exists', async () => {
    // Arrange
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue({ id: 1 });
    const repo = new PositionRepository(mockPrisma);

    // Act
    const result = await repo.existsById(1);

    // Assert
    expect(result).toBe(true);
    expect(mockPrisma.position.findUnique).toHaveBeenCalledWith({
      where: { id: 1 },
      select: { id: true },
    });
  });

  it('should return false when position does not exist', async () => {
    // Arrange
    (mockPrisma.position.findUnique as jest.Mock).mockResolvedValue(null);
    const repo = new PositionRepository(mockPrisma);

    // Act
    const result = await repo.existsById(999);

    // Assert
    expect(result).toBe(false);
    expect(mockPrisma.position.findUnique).toHaveBeenCalledWith({
      where: { id: 999 },
      select: { id: true },
    });
  });
});

describe('PositionRepository - findCandidatesByPositionId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return empty array when no applications exist', async () => {
    // Arrange
    (mockPrisma.application.findMany as jest.Mock).mockResolvedValue([]);
    const repo = new PositionRepository(mockPrisma);

    // Act
    const result = await repo.findCandidatesByPositionId(1);

    // Assert
    expect(result).toEqual([]);
    expect(mockPrisma.application.findMany).toHaveBeenCalledWith({
      where: { positionId: 1 },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        interviews: { select: { score: true } },
      },
    });
  });

  it('should map Prisma result to ApplicationWithCandidate correctly', async () => {
    // Arrange
    const prismaResult = [
      {
        candidate: { id: 10, firstName: 'Albert', lastName: 'Saelices' },
        currentInterviewStep: 2,
        interviews: [{ score: 8 }, { score: null }, { score: 6 }],
      },
    ];
    (mockPrisma.application.findMany as jest.Mock).mockResolvedValue(prismaResult);
    const repo = new PositionRepository(mockPrisma);

    // Act
    const result = await repo.findCandidatesByPositionId(1);

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      candidateId: 10,
      firstName: 'Albert',
      lastName: 'Saelices',
      currentInterviewStep: 2,
      interviews: [{ score: 8 }, { score: null }, { score: 6 }],
    });
  });

  it('should pass correct where and include clauses to Prisma', async () => {
    // Arrange
    (mockPrisma.application.findMany as jest.Mock).mockResolvedValue([]);
    const repo = new PositionRepository(mockPrisma);

    // Act
    await repo.findCandidatesByPositionId(42);

    // Assert
    expect(mockPrisma.application.findMany).toHaveBeenCalledWith({
      where: { positionId: 42 },
      include: {
        candidate: { select: { id: true, firstName: true, lastName: true } },
        interviews: { select: { score: true } },
      },
    });
  });

  it('should map undefined score to null', async () => {
    // Arrange
    const prismaResult = [
      {
        candidate: { id: 5, firstName: 'Jane', lastName: 'Doe' },
        currentInterviewStep: 1,
        interviews: [{ score: undefined }],
      },
    ];
    (mockPrisma.application.findMany as jest.Mock).mockResolvedValue(prismaResult);
    const repo = new PositionRepository(mockPrisma);

    // Act
    const result = await repo.findCandidatesByPositionId(1);

    // Assert
    expect(result[0].interviews[0].score).toBeNull();
  });
});
