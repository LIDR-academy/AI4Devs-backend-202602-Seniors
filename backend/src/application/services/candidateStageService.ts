import { PrismaClient } from '@prisma/client';

export class CandidateStageError extends Error {
    constructor(
        message: string,
        public statusCode: number
    ) {
        super(message);
        this.name = 'CandidateStageError';
    }
}

export async function updateApplicationInterviewStage(
    prisma: PrismaClient,
    candidateId: number,
    positionId: number,
    interviewStepId: number
) {
    const application = await prisma.application.findFirst({
        where: { candidateId, positionId },
    });
    if (!application) {
        throw new CandidateStageError(
            'No existe una aplicación para este candidato y posición.',
            404
        );
    }

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
    if (!position?.interviewFlow) {
        throw new CandidateStageError('Posición o flujo de entrevistas no encontrado.', 404);
    }

    const allowedIds = new Set(position.interviewFlow.interviewSteps.map((s) => s.id));
    if (!allowedIds.has(interviewStepId)) {
        throw new CandidateStageError(
            'La etapa indicada no pertenece al flujo de entrevistas de esta posición.',
            400
        );
    }

    return prisma.application.update({
        where: { id: application.id },
        data: { currentInterviewStep: interviewStepId },
        include: {
            interviewStep: true,
            position: { select: { id: true, title: true } },
            candidate: { select: { id: true, firstName: true, lastName: true } },
        },
    });
}
