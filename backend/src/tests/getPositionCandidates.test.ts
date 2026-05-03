import request from 'supertest';
import { app } from '../index';
import { PositionRepository } from '../infrastructure/repositories/PositionRepository';

jest.mock('../infrastructure/repositories/PositionRepository');

const MockPositionRepository = PositionRepository as jest.MockedClass<typeof PositionRepository>;

describe('GET /api/v1/positions/:id/candidates', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('TC-01: returns candidates for a valid position', async () => {
    const mockCandidates = [
      { candidateId: 1, fullName: 'Alice Smith', currentInterviewStep: 'Phone Screen', averageScore: 8.5 },
      { candidateId: 2, fullName: 'Bob Jones', currentInterviewStep: 'Technical Interview', averageScore: 7.0 },
    ];
    MockPositionRepository.prototype.getCandidatesInProcess.mockResolvedValue(mockCandidates);

    const res = await request(app).get('/api/v1/positions/1/candidates');

    expect(res.status).toBe(200);
    expect(res.body).toHaveLength(2);
    expect(res.body[0]).toMatchObject({
      candidateId: 1,
      fullName: 'Alice Smith',
      currentInterviewStep: 'Phone Screen',
      averageScore: 8.5,
    });
  });

  it('TC-02: returns empty array when position has no candidates', async () => {
    MockPositionRepository.prototype.getCandidatesInProcess.mockResolvedValue([]);

    const res = await request(app).get('/api/v1/positions/99/candidates');

    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('TC-03: returns null averageScore when no scored interviews exist', async () => {
    const mockCandidates = [
      { candidateId: 3, fullName: 'Carol White', currentInterviewStep: 'HR Interview', averageScore: null },
    ];
    MockPositionRepository.prototype.getCandidatesInProcess.mockResolvedValue(mockCandidates);

    const res = await request(app).get('/api/v1/positions/1/candidates');

    expect(res.status).toBe(200);
    expect(res.body[0].averageScore).toBeNull();
  });

  it('TC-04: returns 400 for non-numeric position ID', async () => {
    const res = await request(app).get('/api/v1/positions/abc/candidates');

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INVALID_ID');
  });
});
