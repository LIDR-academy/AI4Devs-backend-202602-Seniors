import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type PositionCandidateSummary = {
    applicationId: number;
    candidateId: number;
    fullName: string;
    current_interview_step: {
        id: number;
        name: string;
        orderIndex: number;
    } | null;
    averageScore: number | null;
};

export type UpdateCandidateStageInput = {
    candidateId: number;
    currentInterviewStep: number;
    positionId?: number;
};

const average = (scores: number[]) => {
    if (scores.length === 0) {
        return null;
    }

    return Number((scores.reduce((total, score) => total + score, 0) / scores.length).toFixed(2));
};

export const getCandidatesByPosition = async (positionId: number): Promise<PositionCandidateSummary[]> => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true },
    });

    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            interviewStep: {
                select: {
                    id: true,
                    name: true,
                    orderIndex: true,
                },
            },
            interviews: {
                select: {
                    score: true,
                },
            },
        },
        orderBy: [
            { currentInterviewStep: 'asc' },
            { applicationDate: 'asc' },
        ],
    });

    return applications.map((application) => {
        const scores = application.interviews
            .map((interview) => interview.score)
            .filter((score): score is number => typeof score === 'number');

        return {
            applicationId: application.id,
            candidateId: application.candidate.id,
            fullName: `${application.candidate.firstName} ${application.candidate.lastName}`,
            current_interview_step: application.interviewStep
                ? {
                    id: application.interviewStep.id,
                    name: application.interviewStep.name,
                    orderIndex: application.interviewStep.orderIndex,
                }
                : null,
            averageScore: average(scores),
        };
    });
};

export const updateCandidateStage = async ({
    candidateId,
    currentInterviewStep,
    positionId,
}: UpdateCandidateStageInput) => {
    const candidate = await prisma.candidate.findUnique({
        where: { id: candidateId },
        select: { id: true },
    });

    if (!candidate) {
        throw new Error('Candidate not found');
    }

    const interviewStep = await prisma.interviewStep.findUnique({
        where: { id: currentInterviewStep },
        select: { id: true },
    });

    if (!interviewStep) {
        throw new Error('Interview step not found');
    }

    const applications = await prisma.application.findMany({
        where: {
            candidateId,
            ...(positionId ? { positionId } : {}),
        },
        select: {
            id: true,
            positionId: true,
        },
    });

    if (applications.length === 0) {
        throw new Error('Application not found');
    }

    if (!positionId && applications.length > 1) {
        throw new Error('Position ID is required when candidate has multiple applications');
    }

    const application = applications[0];

    return prisma.application.update({
        where: { id: application.id },
        data: { currentInterviewStep },
        include: {
            candidate: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                },
            },
            position: {
                select: {
                    id: true,
                    title: true,
                },
            },
            interviewStep: {
                select: {
                    id: true,
                    name: true,
                    orderIndex: true,
                },
            },
        },
    });
};
