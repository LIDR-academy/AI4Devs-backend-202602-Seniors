import { Request, Response } from 'express';
import { getCandidatesForPositionController } from '../positionController';

jest.mock('../../../application/services/positionService', () => ({
  getCandidatesForPosition: jest.fn()
}));

describe('getCandidatesForPositionController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonMock: jest.Mock;
  let statusMock: jest.Mock;

  beforeEach(() => {
    jsonMock = jest.fn();
    statusMock = jest.fn().mockReturnValue({ json: jsonMock });
    mockRes = {
      status: statusMock,
      json: jsonMock
    };
    jest.clearAllMocks();
  });

  it('should_return_400_when_position_id_is_negative', async () => {
    mockReq = { params: { id: '-1' } };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid position ID' });
  });

  it('should_return_400_when_position_id_is_zero', async () => {
    mockReq = { params: { id: '0' } };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid position ID' });
  });

  it('should_return_400_when_position_id_is_not_a_number', async () => {
    mockReq = { params: { id: 'abc' } };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(400);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Invalid position ID' });
  });

  it('should_return_404_when_position_is_not_found', async () => {
    const { getCandidatesForPosition } = require('../../../application/services/positionService');
    getCandidatesForPosition.mockRejectedValue(new Error('Position not found'));

    mockReq = { params: { id: '999' } };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(404);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Position not found' });
  });

  it('should_return_200_with_candidates_when_successful', async () => {
    const { getCandidatesForPosition } = require('../../../application/services/positionService');
    const mockCandidates = [
      {
        candidateId: 1,
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        applicationDate: '2024-01-15T10:00:00.000Z',
        currentInterviewStep: 5,
        averageScore: 8.5
      }
    ];
    getCandidatesForPosition.mockResolvedValue(mockCandidates);

    mockReq = { params: { id: '1' } };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusMock).not.toHaveBeenCalled();
    expect(jsonMock).toHaveBeenCalledWith(mockCandidates);
  });

  it('should_return_500_when_an_unexpected_error_occurs', async () => {
    const { getCandidatesForPosition } = require('../../../application/services/positionService');
    getCandidatesForPosition.mockRejectedValue(new Error('Database error'));

    mockReq = { params: { id: '1' } };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });

  it('should_return_500_when_a_non_error_exception_is_thrown', async () => {
    const { getCandidatesForPosition } = require('../../../application/services/positionService');
    getCandidatesForPosition.mockRejectedValue('Unknown error');

    mockReq = { params: { id: '1' } };

    await getCandidatesForPositionController(mockReq as Request, mockRes as Response);

    expect(statusMock).toHaveBeenCalledWith(500);
    expect(jsonMock).toHaveBeenCalledWith({ error: 'Internal Server Error' });
  });
});
