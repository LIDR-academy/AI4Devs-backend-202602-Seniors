import { PrismaClient } from '@prisma/client';
import { AppError } from '../errors';

export interface UpdatedApplicationResult {
    applicationId: number;
    candidateId: number;
    positionId: number;
    currentInterviewStep: number;
}

function validatePositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
        throw new AppError('VALIDATION_ERROR', `${field} must be a positive integer`, 400);
    }
}

export async function updateCandidateStage(
    positionId: number,
    candidateId: number,
    currentInterviewStep: number,
    prisma: PrismaClient,
): Promise<UpdatedApplicationResult> {
    validatePositiveInteger(positionId, 'positionId');
    validatePositiveInteger(candidateId, 'candidateId');
    validatePositiveInteger(currentInterviewStep, 'currentInterviewStep');

    const position = await prisma.position.findUnique({
        where: { id: positionId },
        include: {
            interviewFlow: {
                include: {
                    interviewSteps: { select: { id: true } },
                },
            },
        },
    });

    if (!position) {
        throw new AppError('NOT_FOUND', 'Position not found', 404);
    }

    // Find the application for this candidate+position pair.
    // A unique constraint on (positionId, candidateId) is specified in the PRD (A-05)
    // but not enforced in the DB schema yet, so we order by most-recent as a tiebreaker.
    const application = await prisma.application.findFirst({
        where: { positionId, candidateId },
        orderBy: { applicationDate: 'desc' },
    });

    if (!application) {
        // Distinguish between "candidate doesn't exist" and "no application for this position"
        const candidate = await prisma.candidate.findUnique({ where: { id: candidateId } });
        if (!candidate) {
            throw new AppError('NOT_FOUND', 'Candidate not found', 404);
        }
        throw new AppError('NOT_FOUND', 'Application not found for this candidate and position', 404);
    }

    const validStepIds = position.interviewFlow?.interviewSteps.map(s => s.id) ?? [];

    if (!validStepIds.includes(currentInterviewStep)) {
        throw new AppError(
            'VALIDATION_ERROR',
            "The interview step does not belong to this position's interview flow",
            400,
        );
    }

    const updated = await prisma.application.update({
        where: { id: application.id },
        data: { currentInterviewStep },
    });

    return {
        applicationId: updated.id,
        candidateId: updated.candidateId,
        positionId: updated.positionId,
        currentInterviewStep: updated.currentInterviewStep,
    };
}
