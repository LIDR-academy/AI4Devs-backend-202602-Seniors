import {
  ApplicationNotFoundError,
  InvalidTargetInterviewStepError,
  updateApplicationStage,
} from './applicationStageService';
import { ApplicationStageRepository } from '../../infrastructure/repositories/applicationStageRepository';

const createRepositoryMock = (): jest.Mocked<ApplicationStageRepository> => ({
  findApplicationById: jest.fn(),
  targetStepBelongsToFlow: jest.fn(),
  updateCurrentInterviewStep: jest.fn(),
});

describe('updateApplicationStage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updates current interview step when target step is valid (happy path)', async () => {
    const repository = createRepositoryMock();
    repository.findApplicationById.mockResolvedValue({
      id: 10,
      position: {
        interviewFlowId: 3,
      },
    });
    repository.targetStepBelongsToFlow.mockResolvedValue(true);
    repository.updateCurrentInterviewStep.mockResolvedValue({
      id: 10,
      currentInterviewStep: 7,
    });

    const result = await updateApplicationStage(10, 7, repository);

    expect(result).toEqual({
      application_id: 10,
      current_interview_step: 7,
    });
    expect(repository.targetStepBelongsToFlow).toHaveBeenCalledWith(7, 3);
    expect(repository.updateCurrentInterviewStep).toHaveBeenCalledWith(10, 7);
  });

  it('rejects when target step does not belong to application flow', async () => {
    const repository = createRepositoryMock();
    repository.findApplicationById.mockResolvedValue({
      id: 11,
      position: {
        interviewFlowId: 4,
      },
    });
    repository.targetStepBelongsToFlow.mockResolvedValue(false);

    await expect(updateApplicationStage(11, 99, repository)).rejects.toMatchObject({
      name: InvalidTargetInterviewStepError.name,
    });
    expect(repository.updateCurrentInterviewStep).not.toHaveBeenCalled();
  });

  it('throws when application does not exist', async () => {
    const repository = createRepositoryMock();
    repository.findApplicationById.mockResolvedValue(null);

    await expect(updateApplicationStage(999, 7, repository)).rejects.toMatchObject({
      name: ApplicationNotFoundError.name,
    });
    expect(repository.targetStepBelongsToFlow).not.toHaveBeenCalled();
    expect(repository.updateCurrentInterviewStep).not.toHaveBeenCalled();
  });
});
