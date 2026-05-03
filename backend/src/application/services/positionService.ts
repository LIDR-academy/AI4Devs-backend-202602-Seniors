import { PrismaClient } from '@prisma/client';

export class NotFoundError extends Error {
    code: string;

    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
        this.code = 'NOT_FOUND';
    }
}

type PositionCandidateResponse = {
    positionId: number;
    candidates: {
        candidateId: number;
        firstName: string;
        lastName: string;
        email: string;
        application: {
            applicationId: number;
            applicationDate: string;
            currentInterviewStep: number;
        };
        interviews: {
            count: number;
            averageScore: number | null;
        };
    }[];
};

export const getCandidatesByPositionId = async (
    prisma: PrismaClient,
    positionId: number
): Promise<PositionCandidateResponse> => {
    const position = await prisma.position.findUnique({
        where: { id: positionId },
        select: { id: true }
    });

    if (!position) {
        throw new NotFoundError('Position not found');
    }

    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: {
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true
                }
            },
            interviews: {
                select: {
                    score: true
                }
            }
        },
        orderBy: {
            applicationDate: 'desc'
        }
    });

    const candidates = applications.map((application) => {
        const candidateScores = application.interviews
            .map((interview) => interview.score)
            .filter((score): score is number => score !== null);

        const totalScore = candidateScores.reduce((sum, score) => sum + score, 0);
        const averageScore = candidateScores.length > 0 ? totalScore / candidateScores.length : null;

        return {
            candidateId: application.candidate.id,
            firstName: application.candidate.firstName,
            lastName: application.candidate.lastName,
            email: application.candidate.email,
            application: {
                applicationId: application.id,
                applicationDate: application.applicationDate.toISOString(),
                currentInterviewStep: application.currentInterviewStep
            },
            interviews: {
                count: application.interviews.length,
                averageScore
            }
        };
    });

    return {
        positionId,
        candidates
    };
};
