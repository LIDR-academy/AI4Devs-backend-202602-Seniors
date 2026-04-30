import { Application } from '../../domain/models/Application';
import { Result } from '../../domain/types/Result';

export interface CandidateSummary {
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
}

export type PositionError = 'POSITION_NOT_FOUND';

export async function getCandidatesForPosition(
    positionId: number
): Promise<Result<CandidateSummary[], PositionError>> {
    const applications = await Application.findByPositionId(positionId);

    if (applications === null) {
        return Result.fail('POSITION_NOT_FOUND');
    }

    const candidates: CandidateSummary[] = applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null);

        const averageScore =
            scores.length > 0
                ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                : null;

        return {
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep.name,
            averageScore,
        };
    });

    return Result.ok(candidates);
}
