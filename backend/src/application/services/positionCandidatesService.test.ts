import {
  getCandidatesByPositionId,
  PositionNotFoundError,
} from './positionCandidatesService';
import { PositionCandidatesRepository } from '../../infrastructure/repositories/positionCandidatesRepository';

const createRepositoryMock = (): jest.Mocked<PositionCandidatesRepository> => ({
  positionExists: jest.fn(),
  findApplicationsByPositionId: jest.fn(),
});

describe('getCandidatesByPositionId', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns candidates with calculated average score (happy path)', async () => {
    const repository = createRepositoryMock();
    repository.positionExists.mockResolvedValue(true);
    repository.findApplicationsByPositionId.mockResolvedValue([
      {
        currentInterviewStep: 3,
        candidate: {
          firstName: 'Ada',
          lastName: 'Lovelace',
        },
        interviews: [{ score: 5 }, { score: 3 }, { score: null }],
      },
    ]);

    const result = await getCandidatesByPositionId(1, repository);

    expect(result).toEqual([
      {
        full_name: 'Ada Lovelace',
        current_interview_step: 3,
        average_score: 4,
      },
    ]);
  });

  it('includes candidates without interviews using average_score as null', async () => {
    const repository = createRepositoryMock();
    repository.positionExists.mockResolvedValue(true);
    repository.findApplicationsByPositionId.mockResolvedValue([
      {
        currentInterviewStep: 1,
        candidate: {
          firstName: 'Grace',
          lastName: 'Hopper',
        },
        interviews: [],
      },
    ]);

    const result = await getCandidatesByPositionId(1, repository);

    expect(result).toEqual([
      {
        full_name: 'Grace Hopper',
        current_interview_step: 1,
        average_score: null,
      },
    ]);
  });

  it('throws PositionNotFoundError when position does not exist', async () => {
    const repository = createRepositoryMock();
    repository.positionExists.mockResolvedValue(false);

    await expect(getCandidatesByPositionId(999, repository)).rejects.toMatchObject({
      name: PositionNotFoundError.name,
    });
    expect(repository.findApplicationsByPositionId).not.toHaveBeenCalled();
  });
});
