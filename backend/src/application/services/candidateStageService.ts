import { IApplicationRepository } from '../../domain/repositories/IApplicationRepository';
import { NotFoundError } from '../../domain/errors/NotFoundError';
import { ValidationError } from '../validator';
import { StageUpdateData } from '../validator';

export interface UpdateStageResult {
  applicationId: number;
  candidateId: number;
  positionId: number;
  previousStep: number;
  currentInterviewStep: number;
  stepName: string;
  updatedAt: string;
  notes: string | null;
}

export class CandidateStageService {
  constructor(private readonly applicationRepository: IApplicationRepository) {}

  async updateCandidateStage(candidateId: number, stageData: StageUpdateData): Promise<UpdateStageResult> {
    const candidateExists = await this.applicationRepository.candidateExists(candidateId);
    if (!candidateExists) {
      throw new NotFoundError('Candidate not found');
    }

    const application = await this.applicationRepository.findByIdAndCandidateId(
      stageData.applicationId,
      candidateId
    );
    if (!application) {
      throw new NotFoundError('Application not found for this candidate');
    }

    const previousStep = application.currentInterviewStep;

    const isValid = await this.applicationRepository.isValidInterviewStepForPosition(
      application.positionId,
      stageData.newInterviewStep
    );
    if (!isValid) {
      throw new ValidationError('Invalid interview step for this position', []);
    }

    const updated = await this.applicationRepository.updateInterviewStep(
      stageData.applicationId,
      stageData.newInterviewStep,
      stageData.notes
    );

    const stepName = await this.applicationRepository.getInterviewStepName(stageData.newInterviewStep);

    return {
      applicationId: updated.id,
      candidateId: updated.candidateId,
      positionId: updated.positionId,
      previousStep,
      currentInterviewStep: updated.currentInterviewStep,
      stepName: stepName ?? '',
      updatedAt: (updated.updatedAt ?? new Date()).toISOString(),
      notes: updated.notes,
    };
  }
}
