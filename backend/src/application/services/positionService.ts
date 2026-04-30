import { PrismaClient } from '@prisma/client';
import { Position } from '../../domain/models/Position';

const prisma = new PrismaClient();

export interface CandidateInProcess {
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
}

export const getCandidatesInProcess = async (positionId: number): Promise<CandidateInProcess[]> => {
    const position = await Position.findOne(positionId);
    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: true,
            interviewStep: true,
            interviews: true,
        },
    });

    return applications.map((app) => {
        const fullName = `${app.candidate.firstName} ${app.candidate.lastName}`;
        const currentInterviewStep = app.interviewStep.name;

        const scoredInterviews = app.interviews.filter((i) => i.score !== null);
        const averageScore =
            scoredInterviews.length === 0
                ? null
                : Math.round(
                      (scoredInterviews.reduce((sum, i) => sum + (i.score as number), 0) /
                          scoredInterviews.length) *
                          100
                  ) / 100;

        return { fullName, currentInterviewStep, averageScore };
    });
};
