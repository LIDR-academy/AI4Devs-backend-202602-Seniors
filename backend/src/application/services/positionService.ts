import { Position } from '../../domain/models/Position';

export interface CandidateForPosition {
    readonly fullName: string;
    readonly currentInterviewStep: number;
    readonly averageScore: number | null;
}

export interface PositionSummary {
    readonly id: number;
    readonly title: string;
    readonly status: string;
}

export async function getAllPositions(): Promise<PositionSummary[]> {
    return Position.findAll();
}

export async function getCandidatesByPositionId(positionId: number): Promise<CandidateForPosition[]> {
    if (!Number.isInteger(positionId) || positionId <= 0) {
        throw new Error('Invalid position ID');
    }

    const applications = await Position.findCandidateApplications(positionId);
    if (applications === null) {
        throw new Error('Position not found');
    }

    return applications.map(app => {
        const scores = app.interviews
            .map(i => i.score)
            .filter((s): s is number => s !== null);

        const averageScore = scores.length > 0
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length
            : null;

        return {
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.currentInterviewStep,
            averageScore,
        };
    });
}
