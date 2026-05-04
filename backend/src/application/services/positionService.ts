import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PositionCandidateDTO = {
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
};

export class PositionNotFoundError extends Error {
    constructor() {
        super('Position not found');
        this.name = 'PositionNotFoundError';
    }
}

function averageScoreFromScores(scores: Array<number | null>): number | null {
    const numeric = scores.filter((s): s is number => s !== null);
    if (numeric.length === 0) {
        return null;
    }
    const sum = numeric.reduce((acc, s) => acc + s, 0);
    return sum / numeric.length;
}

export async function getCandidatesForPosition(positionId: number): Promise<PositionCandidateDTO[]> {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
    });

    if (!position) {
        throw new PositionNotFoundError();
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: { select: { firstName: true, lastName: true } },
            interviewStep: { select: { name: true } },
            interviews: { select: { score: true } },
        },
    });

    return applications.map((application) => {
        const scores = application.interviews.map((interview) => interview.score);
        return {
            fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
            currentInterviewStep: application.interviewStep.name,
            averageScore: averageScoreFromScores(scores),
        };
    });
}
