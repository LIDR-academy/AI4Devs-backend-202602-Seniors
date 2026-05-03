import { Request, Response, NextFunction } from 'express';
import { makeUpdateCandidateStage } from './candidateStageController';
import { CandidateStageService } from '../../application/services/candidateStageService';
import { NotFoundError } from '../../domain/errors/NotFoundError';
import { ValidationError, validateStageUpdateData } from '../../application/validator';

jest.mock('../../application/validator', () => ({
  ...jest.requireActual('../../application/validator'),
  validateStageUpdateData: jest.fn(),
}));

const validateStageUpdateDataSpy = validateStageUpdateData as jest.Mock;

const mockService = {
  updateCandidateStage: jest.fn(),
} as unknown as CandidateStageService;

function buildMockReq(params: Record<string, string> = {}, body: unknown = {}): Partial<Request> {
  return { params, body };
}

function buildMockRes(): { res: Partial<Response>; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res = { json, status } as unknown as Partial<Response>;
  return { res, json, status };
}

const validBody = { applicationId: 10, newInterviewStep: 3 };
const validStageData = { applicationId: 10, newInterviewStep: 3 };

describe('candidateStageController - makeUpdateCandidateStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for non-numeric candidate id', async () => {
    // Arrange
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: 'abc' }, validBody);
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Invalid candidate ID', code: 'VALIDATION_ERROR' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 for candidate id equal to 0', async () => {
    // Arrange
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '0' }, validBody);
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Invalid candidate ID', code: 'VALIDATION_ERROR' },
    });
  });

  it('should return 400 for negative candidate id', async () => {
    // Arrange
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '-3' }, validBody);
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Invalid candidate ID', code: 'VALIDATION_ERROR' },
    });
  });

  it('should return 400 with details when validateStageUpdateData throws ValidationError', async () => {
    // Arrange
    const validationError = new ValidationError('Validation failed', [
      { field: 'applicationId', message: 'Application ID is required' },
    ]);
    validateStageUpdateDataSpy.mockImplementation(() => {
      throw validationError;
    });
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '1' }, {});
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: [{ field: 'applicationId', message: 'Application ID is required' }],
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next when validateStageUpdateData throws unexpected error', async () => {
    // Arrange
    const unexpectedError = new Error('Unexpected');
    validateStageUpdateDataSpy.mockImplementation(() => {
      throw unexpectedError;
    });
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '1' }, {});
    const { res } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalledWith(unexpectedError);
  });

  it('should return 404 when service throws NotFoundError', async () => {
    // Arrange
    validateStageUpdateDataSpy.mockReturnValue(validStageData);
    (mockService.updateCandidateStage as jest.Mock).mockRejectedValue(
      new NotFoundError('Candidate not found')
    );
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '999' }, validBody);
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Candidate not found', code: 'NOT_FOUND' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 404 for application not found error', async () => {
    // Arrange
    validateStageUpdateDataSpy.mockReturnValue(validStageData);
    (mockService.updateCandidateStage as jest.Mock).mockRejectedValue(
      new NotFoundError('Application not found for this candidate')
    );
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '1' }, validBody);
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Application not found for this candidate', code: 'NOT_FOUND' },
    });
  });

  it('should return 400 when service throws ValidationError', async () => {
    // Arrange
    validateStageUpdateDataSpy.mockReturnValue(validStageData);
    (mockService.updateCandidateStage as jest.Mock).mockRejectedValue(
      new ValidationError('Invalid interview step for this position', [])
    );
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '1' }, validBody);
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: {
        message: 'Invalid interview step for this position',
        code: 'VALIDATION_ERROR',
      },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 200 with correct envelope on success', async () => {
    // Arrange
    const mockResult = {
      applicationId: 10,
      candidateId: 1,
      positionId: 5,
      previousStep: 2,
      currentInterviewStep: 3,
      stepName: 'Technical Interview',
      updatedAt: '2024-01-15T10:30:00.000Z',
      notes: null,
    };
    validateStageUpdateDataSpy.mockReturnValue(validStageData);
    (mockService.updateCandidateStage as jest.Mock).mockResolvedValue(mockResult);
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '1' }, validBody);
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: mockResult,
      message: 'Candidate stage updated successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(error) on unexpected service errors', async () => {
    // Arrange
    const unexpectedError = new Error('Database connection failed');
    validateStageUpdateDataSpy.mockReturnValue(validStageData);
    (mockService.updateCandidateStage as jest.Mock).mockRejectedValue(unexpectedError);
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '1' }, validBody);
    const { res } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalledWith(unexpectedError);
  });

  it('should call service with correct candidateId and stageData', async () => {
    // Arrange
    const mockResult = {
      applicationId: 10,
      candidateId: 1,
      positionId: 5,
      previousStep: 2,
      currentInterviewStep: 3,
      stepName: 'Technical Interview',
      updatedAt: '2024-01-15T10:30:00.000Z',
      notes: null,
    };
    validateStageUpdateDataSpy.mockReturnValue(validStageData);
    (mockService.updateCandidateStage as jest.Mock).mockResolvedValue(mockResult);
    const handler = makeUpdateCandidateStage(mockService);
    const req = buildMockReq({ id: '1' }, validBody);
    const { res } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(mockService.updateCandidateStage).toHaveBeenCalledWith(1, validStageData);
  });
});
