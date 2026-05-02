import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PositionCandidateDTO = {
    candidateId: number;
    applicationId: number;
    fullName: string;
    currentInterviewStep: string;
    currentInterviewStepId: number;
    averageScore: number | null;
};

export type InterviewStepDTO = {
    id: number;
    name: string;
    orderIndex: number;
    interviewType: string;
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
            candidateId: app.candidateId,
            applicationId: app.id,
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep.name,
            currentInterviewStepId: app.currentInterviewStep,
            averageScore,
        };
    });
};

export const getPositionInterviewSteps = async (positionId: number): Promise<InterviewStepDTO[] | null> => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            interviewFlow: {
                include: {
                    interviewSteps: {
                        orderBy: { orderIndex: 'asc' },
                        include: {
                            interviewType: { select: { name: true } },
                        },
                    },
                },
            },
        },
    });

    if (!position) return null;

    return position.interviewFlow.interviewSteps.map((step) => ({
        id: step.id,
        name: step.name,
        orderIndex: step.orderIndex,
        interviewType: step.interviewType.name,
    }));
};
