import { Position, PositionCandidateApplicationRecord } from '../../domain/models/Position';

export interface PositionCandidateSummary {
    fullName: string;
    currentInterviewStep: number;
    averageScore: number | null;
}

export class PositionServiceError extends Error {
    statusCode: number;

    constructor(message: string, statusCode: number) {
        super(message);
        this.name = 'PositionServiceError';
        this.statusCode = statusCode;
    }
}

const calculateAverageScore = (records: PositionCandidateApplicationRecord['interviews']): number | null => {
    const scores = records
        .map((interview) => interview.score)
        .filter((score): score is number => typeof score === 'number' && !Number.isNaN(score));

    if (scores.length === 0) {
        return null;
    }

    const sum = scores.reduce((accumulator, score) => accumulator + score, 0);
    return Number((sum / scores.length).toFixed(2));
};

export const getCandidatesByPositionId = async (positionId: number): Promise<PositionCandidateSummary[]> => {
    if (!Number.isInteger(positionId) || positionId <= 0) {
        throw new PositionServiceError('Invalid position ID format', 400);
    }

    const position = await Position.findOne(positionId);
    if (!position) {
        throw new PositionServiceError('Position not found', 404);
    }

    const applications = await Position.findCandidateApplications(positionId);

    return applications
        .map((application) => ({
            fullName: `${application.candidate.firstName} ${application.candidate.lastName}`.replace(/\s+/g, ' ').trim(),
            currentInterviewStep: application.currentInterviewStep,
            averageScore: calculateAverageScore(application.interviews),
        }))
        .sort((left, right) => {
            if (left.currentInterviewStep !== right.currentInterviewStep) {
                return left.currentInterviewStep - right.currentInterviewStep;
            }

            return left.fullName.localeCompare(right.fullName);
        });
};
