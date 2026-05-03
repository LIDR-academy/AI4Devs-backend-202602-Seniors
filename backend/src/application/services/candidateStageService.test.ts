import { CandidateStageService } from './candidateStageService';
import { IApplicationRepository } from '../../domain/repositories/IApplicationRepository';
import { NotFoundError } from '../../domain/errors/NotFoundError';
import { ValidationError } from '../validator';

const mockRepository: IApplicationRepository = {
  candidateExists: jest.fn(),
  findByIdAndCandidateId: jest.fn(),
  updateInterviewStep: jest.fn(),
  isValidInterviewStepForPosition: jest.fn(),
  getInterviewStepName: jest.fn(),
};

const validStageData = { applicationId: 10, newInterviewStep: 3 };

const mockApplication = {
  id: 10,
  positionId: 5,
  candidateId: 1,
  applicationDate: new Date('2024-01-01'),
  currentInterviewStep: 2,
  notes: null,
};

const mockUpdatedApplication = {
  ...mockApplication,
  currentInterviewStep: 3,
  updatedAt: new Date('2024-01-15T10:30:00Z'),
};

describe('CandidateStageService - updateCandidateStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw NotFoundError when candidate does not exist', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(false);
    const service = new CandidateStageService(mockRepository);

    // Act & Assert
    await expect(service.updateCandidateStage(999, validStageData)).rejects.toThrow('Candidate not found');
    await expect(service.updateCandidateStage(999, validStageData)).rejects.toMatchObject({ name: 'NotFoundError' });
    expect(mockRepository.findByIdAndCandidateId).not.toHaveBeenCalled();
  });

  it('should throw NotFoundError when application does not belong to candidate', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(null);
    const service = new CandidateStageService(mockRepository);

    // Act & Assert
    await expect(service.updateCandidateStage(1, validStageData)).rejects.toThrow(
      'Application not found for this candidate'
    );
    await expect(service.updateCandidateStage(1, validStageData)).rejects.toMatchObject({ name: 'NotFoundError' });
    expect(mockRepository.isValidInterviewStepForPosition).not.toHaveBeenCalled();
  });

  it('should throw ValidationError when interview step is invalid for position', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(mockApplication);
    (mockRepository.isValidInterviewStepForPosition as jest.Mock).mockResolvedValue(false);
    const service = new CandidateStageService(mockRepository);

    // Act & Assert
    await expect(service.updateCandidateStage(1, { applicationId: 10, newInterviewStep: 99 })).rejects.toThrow(
      'Invalid interview step for this position'
    );
    await expect(service.updateCandidateStage(1, { applicationId: 10, newInterviewStep: 99 })).rejects.toMatchObject({
      name: 'ValidationError',
    });
    expect(mockRepository.updateInterviewStep).not.toHaveBeenCalled();
  });

  it('should return UpdateStageResult on successful update', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(mockApplication);
    (mockRepository.isValidInterviewStepForPosition as jest.Mock).mockResolvedValue(true);
    (mockRepository.updateInterviewStep as jest.Mock).mockResolvedValue(mockUpdatedApplication);
    (mockRepository.getInterviewStepName as jest.Mock).mockResolvedValue('Technical Interview');
    const service = new CandidateStageService(mockRepository);

    // Act
    const result = await service.updateCandidateStage(1, validStageData);

    // Assert
    expect(result.applicationId).toBe(10);
    expect(result.candidateId).toBe(1);
    expect(result.positionId).toBe(5);
    expect(result.previousStep).toBe(2);
    expect(result.currentInterviewStep).toBe(3);
    expect(result.stepName).toBe('Technical Interview');
    expect(result.notes).toBeNull();
    expect(typeof result.updatedAt).toBe('string');
  });

  it('should pass notes to updateInterviewStep when provided', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(mockApplication);
    (mockRepository.isValidInterviewStepForPosition as jest.Mock).mockResolvedValue(true);
    (mockRepository.updateInterviewStep as jest.Mock).mockResolvedValue({
      ...mockUpdatedApplication,
      notes: 'Advanced to technical interview',
    });
    (mockRepository.getInterviewStepName as jest.Mock).mockResolvedValue('Technical Interview');
    const service = new CandidateStageService(mockRepository);

    // Act
    const result = await service.updateCandidateStage(1, {
      ...validStageData,
      notes: 'Advanced to technical interview',
    });

    // Assert
    expect(mockRepository.updateInterviewStep).toHaveBeenCalledWith(10, 3, 'Advanced to technical interview');
    expect(result.notes).toBe('Advanced to technical interview');
  });

  it('should call repository methods with correct arguments', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(mockApplication);
    (mockRepository.isValidInterviewStepForPosition as jest.Mock).mockResolvedValue(true);
    (mockRepository.updateInterviewStep as jest.Mock).mockResolvedValue(mockUpdatedApplication);
    (mockRepository.getInterviewStepName as jest.Mock).mockResolvedValue('Technical Interview');
    const service = new CandidateStageService(mockRepository);

    // Act
    await service.updateCandidateStage(1, validStageData);

    // Assert
    expect(mockRepository.candidateExists).toHaveBeenCalledWith(1);
    expect(mockRepository.findByIdAndCandidateId).toHaveBeenCalledWith(10, 1);
    expect(mockRepository.isValidInterviewStepForPosition).toHaveBeenCalledWith(5, 3);
    expect(mockRepository.updateInterviewStep).toHaveBeenCalledWith(10, 3, undefined);
    expect(mockRepository.getInterviewStepName).toHaveBeenCalledWith(3);
  });

  it('should use empty string for stepName when getInterviewStepName returns null', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(mockApplication);
    (mockRepository.isValidInterviewStepForPosition as jest.Mock).mockResolvedValue(true);
    (mockRepository.updateInterviewStep as jest.Mock).mockResolvedValue(mockUpdatedApplication);
    (mockRepository.getInterviewStepName as jest.Mock).mockResolvedValue(null);
    const service = new CandidateStageService(mockRepository);

    // Act
    const result = await service.updateCandidateStage(1, validStageData);

    // Assert
    expect(result.stepName).toBe('');
  });

  it('should use current date when updatedAt is not set on updated application', async () => {
    // Arrange
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(mockApplication);
    (mockRepository.isValidInterviewStepForPosition as jest.Mock).mockResolvedValue(true);
    (mockRepository.updateInterviewStep as jest.Mock).mockResolvedValue({
      ...mockApplication,
      currentInterviewStep: 3,
    });
    (mockRepository.getInterviewStepName as jest.Mock).mockResolvedValue('HR Screen');
    const service = new CandidateStageService(mockRepository);

    // Act
    const result = await service.updateCandidateStage(1, validStageData);

    // Assert
    expect(typeof result.updatedAt).toBe('string');
    expect(result.updatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('should set previousStep to the application currentInterviewStep before update', async () => {
    // Arrange
    const appWithStep4 = { ...mockApplication, currentInterviewStep: 4 };
    (mockRepository.candidateExists as jest.Mock).mockResolvedValue(true);
    (mockRepository.findByIdAndCandidateId as jest.Mock).mockResolvedValue(appWithStep4);
    (mockRepository.isValidInterviewStepForPosition as jest.Mock).mockResolvedValue(true);
    (mockRepository.updateInterviewStep as jest.Mock).mockResolvedValue({
      ...appWithStep4,
      currentInterviewStep: 5,
      updatedAt: new Date(),
    });
    (mockRepository.getInterviewStepName as jest.Mock).mockResolvedValue('Final Interview');
    const service = new CandidateStageService(mockRepository);

    // Act
    const result = await service.updateCandidateStage(1, { applicationId: 10, newInterviewStep: 5 });

    // Assert
    expect(result.previousStep).toBe(4);
    expect(result.currentInterviewStep).toBe(5);
  });
});
