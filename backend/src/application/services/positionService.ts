import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PositionCandidateDTO = {
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
};

export const getPositionCandidates = async (positionId: number): Promise<PositionCandidateDTO[] | null> => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            applications: {
                include: {
                    candidate:     { select: { firstName: true, lastName: true } },
                    interviewStep: { select: { name: true } },
                    interviews:    { select: { score: true } },
                },
            },
        },
    });

    if (!position) return null;

    return position.applications.map((app) => {
        const scores = app.interviews
            .map((i) => i.score)
            .filter((s): s is number => s !== null);

        const averageScore = scores.length > 0
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length
            : null;

        return {
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep.name,
            averageScore,
        };
    });
};
