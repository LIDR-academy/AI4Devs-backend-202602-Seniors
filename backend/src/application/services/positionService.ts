import { Application } from '../../domain/models/Application';
import { Position } from '../../domain/models/Position';

type ApplicationWithRelations = Awaited<ReturnType<typeof Application.findByPositionId>>[number];

export interface CandidateResponse {
    candidateId: number;
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
}

const buildFullName = (candidate: { firstName: string; lastName: string }): string =>
    `${candidate.firstName} ${candidate.lastName}`;

export const calculateAverageScore = (interviews: { score: number | null }[]): number | null => {
    const validScores = interviews
        .map(i => i.score)
        .filter((score): score is number => score !== null);
    if (validScores.length === 0) return null;
    return validScores.reduce((sum, score) => sum + score, 0) / validScores.length;
};

export const mapApplicationToCandidateResponse = (application: ApplicationWithRelations): CandidateResponse => ({
    candidateId: application.candidateId,
    fullName: buildFullName(application.candidate),
    currentInterviewStep: application.interviewStep.name,
    averageScore: calculateAverageScore(application.interviews),
});

export const findCandidatesByPosition = async (positionId: number): Promise<CandidateResponse[] | null> => {
    const position = await Position.findOne(positionId);
    if (!position) return null;

    const applications = await Application.findByPositionId(positionId);
    return applications.map(mapApplicationToCandidateResponse);
};
