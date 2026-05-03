import { Request, Response, NextFunction } from 'express';
import { makeGetPositionCandidates } from './positionController';
import { PositionService } from '../../application/services/positionService';
import { NotFoundError } from '../../domain/errors/NotFoundError';

const mockPositionService = {
  getCandidatesByPosition: jest.fn(),
} as unknown as PositionService;

function buildMockReq(params: Record<string, string> = {}): Partial<Request> {
  return { params };
}

function buildMockRes(): { res: Partial<Response>; json: jest.Mock; status: jest.Mock } {
  const json = jest.fn();
  const status = jest.fn().mockReturnValue({ json });
  const res: Partial<Response> = { json, status } as unknown as Partial<Response>;
  (res as Record<string, unknown>).status = status;
  return { res, json, status };
}

describe('positionController - getPositionCandidates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return 400 for non-numeric id', async () => {
    // Arrange
    const handler = makeGetPositionCandidates(mockPositionService);
    const req = buildMockReq({ id: 'abc' });
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Invalid position ID', code: 'VALIDATION_ERROR' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 400 for id equal to 0', async () => {
    // Arrange
    const handler = makeGetPositionCandidates(mockPositionService);
    const req = buildMockReq({ id: '0' });
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Invalid position ID', code: 'VALIDATION_ERROR' },
    });
  });

  it('should return 400 for negative id', async () => {
    // Arrange
    const handler = makeGetPositionCandidates(mockPositionService);
    const req = buildMockReq({ id: '-5' });
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Invalid position ID', code: 'VALIDATION_ERROR' },
    });
  });

  it('should return 404 when service throws NotFoundError', async () => {
    // Arrange
    (mockPositionService.getCandidatesByPosition as jest.Mock).mockRejectedValue(
      new NotFoundError('Position not found')
    );
    const handler = makeGetPositionCandidates(mockPositionService);
    const req = buildMockReq({ id: '999' });
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      success: false,
      error: { message: 'Position not found', code: 'NOT_FOUND' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 200 with correct envelope on success', async () => {
    // Arrange
    const mockData = [
      { candidateId: 1, fullName: 'Albert Saelices', currentInterviewStep: 2, averageScore: 7.5 },
    ];
    (mockPositionService.getCandidatesByPosition as jest.Mock).mockResolvedValue(mockData);
    const handler = makeGetPositionCandidates(mockPositionService);
    const req = buildMockReq({ id: '1' });
    const { res, status, json } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(status).toHaveBeenCalledWith(200);
    expect(json).toHaveBeenCalledWith({
      success: true,
      data: mockData,
      message: 'Candidates retrieved successfully',
    });
    expect(next).not.toHaveBeenCalled();
  });

  it('should call next(error) on unexpected errors', async () => {
    // Arrange
    const unexpectedError = new Error('Database connection failed');
    (mockPositionService.getCandidatesByPosition as jest.Mock).mockRejectedValue(unexpectedError);
    const handler = makeGetPositionCandidates(mockPositionService);
    const req = buildMockReq({ id: '1' });
    const { res } = buildMockRes();
    const next = jest.fn() as NextFunction;

    // Act
    await handler(req as Request, res as Response, next);

    // Assert
    expect(next).toHaveBeenCalledWith(unexpectedError);
  });
});
