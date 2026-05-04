import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors';

export interface CandidateInStep {
    candidateId: number;
    fullName: string;
    currentInterviewStep: number;
    averageScore: number | null;
}

export interface InterviewStepWithCandidates {
    stepId: number;
    stepName: string;
    orderIndex: number;
    candidates: CandidateInStep[];
}

export interface PositionCandidatesResult {
    positionId: number;
    interviewSteps: InterviewStepWithCandidates[];
}

function validatePositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
        throw new AppError('VALIDATION_ERROR', `${field} must be a positive integer`, 400);
    }
}

function computeAverageScore(interviews: { score: number | null }[]): number | null {
    const scored = interviews.map(i => i.score).filter((s): s is number => s !== null);
    if (scored.length === 0) return null;
    return scored.reduce((sum, s) => sum + s, 0) / scored.length;
}

export async function getPositionCandidates(
    positionId: number,
    prisma: PrismaClient,
): Promise<PositionCandidatesResult> {
    validatePositiveInteger(positionId, 'positionId');

    const [position, applications] = await Promise.all([
        prisma.position.findUnique({
            where: { id: positionId },
            include: {
                interviewFlow: {
                    include: {
                        interviewSteps: {
                            orderBy: { orderIndex: 'asc' },
                        },
                    },
                },
            },
        }),
        prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: {
                    select: { id: true, firstName: true, lastName: true },
                },
                interviews: {
                    select: { score: true },
                },
            },
        }),
    ]);

    if (!position) {
        throw new AppError('NOT_FOUND', 'Position not found', 404);
    }

    if (!position.interviewFlow) {
        throw new AppError('NOT_FOUND', 'Position has no interview flow configured', 404);
    }

    const validStepIds = new Set(position.interviewFlow.interviewSteps.map(s => s.id));

    const steps: InterviewStepWithCandidates[] = position.interviewFlow.interviewSteps.map(step => ({
        stepId: step.id,
        stepName: step.name,
        orderIndex: step.orderIndex,
        candidates: applications
            .filter(app => app.currentInterviewStep === step.id)
            .map(app => ({
                candidateId: app.candidateId,
                fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
                currentInterviewStep: app.currentInterviewStep,
                averageScore: computeAverageScore(app.interviews),
            })),
    }));

    const unmatchedCount = applications.filter(app => !validStepIds.has(app.currentInterviewStep)).length;
    if (unmatchedCount > 0) {
        console.warn(`[getPositionCandidates] ${unmatchedCount} application(s) for position ${positionId} reference a step not in the current flow and were excluded from the response.`);
    }

    return { positionId, interviewSteps: steps };
}
