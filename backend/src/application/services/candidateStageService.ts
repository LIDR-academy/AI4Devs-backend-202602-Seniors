import { Candidate } from '../../domain/models/Candidate';
import { Application } from '../../domain/models/Application';
import { Result } from '../../domain/types/Result';

export type StageError = 'CANDIDATE_NOT_FOUND' | 'INVALID_INTERVIEW_STEP';

export interface UpdatedApplicationStage {
    id: number;
    candidateId: number;
    positionId: number;
    currentInterviewStep: number;
    applicationDate: Date;
    notes: string | null;
}

export async function updateCandidateStage(
    candidateId: number,
    currentInterviewStep: number
): Promise<Result<UpdatedApplicationStage, StageError>> {
    const candidate = await Candidate.findOne(candidateId);
    if (!candidate) return Result.fail('CANDIDATE_NOT_FOUND');

    const latestApplication = await Application.findLatestByCandidateId(candidateId);
    if (!latestApplication) return Result.fail('CANDIDATE_NOT_FOUND');

    try {
        const updated = await Application.updateInterviewStep(latestApplication.id, currentInterviewStep);
        return Result.ok(updated as UpdatedApplicationStage);
    } catch (error: any) {
        if (error?.code === 'P2003') {
            return Result.fail('INVALID_INTERVIEW_STEP');
        }
        throw error;
    }
}
