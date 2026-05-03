import { PositionService } from './positionService';
import { IPositionRepository } from '../../domain/repositories/IPositionRepository';
import { NotFoundError } from '../../domain/errors/NotFoundError';

const mockRepository: IPositionRepository = {
  existsById: jest.fn(),
  findCandidatesByPositionId: jest.fn(),
};

describe('PositionService - getCandidatesByPosition', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotFoundError when position does not exist', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(false);
    const service = new PositionService(mockRepository);

    // Act & Assert
    await expect(service.getCandidatesByPosition(999)).rejects.toThrow('Position not found');
    await expect(service.getCandidatesByPosition(999)).rejects.toMatchObject({ name: 'NotFoundError' });
  });

  it('should return empty array when position exists but has no applications', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(true);
    (mockRepository.findCandidatesByPositionId as jest.Mock).mockResolvedValue([]);
    const service = new PositionService(mockRepository);

    // Act
    const result = await service.getCandidatesByPosition(5);

    // Assert
    expect(result).toEqual([]);
    expect(mockRepository.findCandidatesByPositionId).toHaveBeenCalledWith(5);
  });

  it('should return null averageScore when application has no interviews', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(true);
    (mockRepository.findCandidatesByPositionId as jest.Mock).mockResolvedValue([
      {
        candidateId: 1,
        firstName: 'John',
        lastName: 'Doe',
        currentInterviewStep: 1,
        interviews: [],
      },
    ]);
    const service = new PositionService(mockRepository);

    // Act
    const result = await service.getCandidatesByPosition(1);

    // Assert
    expect(result[0].averageScore).toBeNull();
  });

  it('should return null averageScore when all interview scores are null', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(true);
    (mockRepository.findCandidatesByPositionId as jest.Mock).mockResolvedValue([
      {
        candidateId: 1,
        firstName: 'John',
        lastName: 'Doe',
        currentInterviewStep: 2,
        interviews: [{ score: null }, { score: null }],
      },
    ]);
    const service = new PositionService(mockRepository);

    // Act
    const result = await service.getCandidatesByPosition(1);

    // Assert
    expect(result[0].averageScore).toBeNull();
  });

  it('should compute averageScore correctly for mixed null/non-null scores', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(true);
    (mockRepository.findCandidatesByPositionId as jest.Mock).mockResolvedValue([
      {
        candidateId: 1,
        firstName: 'John',
        lastName: 'Doe',
        currentInterviewStep: 3,
        interviews: [{ score: 8 }, { score: null }, { score: 6 }],
      },
    ]);
    const service = new PositionService(mockRepository);

    // Act
    const result = await service.getCandidatesByPosition(1);

    // Assert
    expect(result[0].averageScore).toBe(7);
  });

  it('should compute averageScore correctly when all scores are non-null', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(true);
    (mockRepository.findCandidatesByPositionId as jest.Mock).mockResolvedValue([
      {
        candidateId: 2,
        firstName: 'Albert',
        lastName: 'Saelices',
        currentInterviewStep: 2,
        interviews: [{ score: 6 }, { score: 9 }],
      },
    ]);
    const service = new PositionService(mockRepository);

    // Act
    const result = await service.getCandidatesByPosition(1);

    // Assert
    expect(result[0].averageScore).toBe(7.5);
  });

  it('should compose fullName from firstName and lastName', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(true);
    (mockRepository.findCandidatesByPositionId as jest.Mock).mockResolvedValue([
      {
        candidateId: 2,
        firstName: 'Albert',
        lastName: 'Saelices',
        currentInterviewStep: 1,
        interviews: [],
      },
    ]);
    const service = new PositionService(mockRepository);

    // Act
    const result = await service.getCandidatesByPosition(1);

    // Assert
    expect(result[0].fullName).toBe('Albert Saelices');
  });

  it('should map candidateId and currentInterviewStep correctly', async () => {
    // Arrange
    (mockRepository.existsById as jest.Mock).mockResolvedValue(true);
    (mockRepository.findCandidatesByPositionId as jest.Mock).mockResolvedValue([
      {
        candidateId: 42,
        firstName: 'Jane',
        lastName: 'Smith',
        currentInterviewStep: 3,
        interviews: [{ score: 10 }],
      },
    ]);
    const service = new PositionService(mockRepository);

    // Act
    const result = await service.getCandidatesByPosition(1);

    // Assert
    expect(result[0].candidateId).toBe(42);
    expect(result[0].currentInterviewStep).toBe(3);
  });
});
