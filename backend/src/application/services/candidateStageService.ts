import { PrismaClient } from '@prisma/client';
import { Application } from '../../domain/models/Application';

const prisma = new PrismaClient();

export const updateCandidateStage = async (candidateId: number, newStageId: number): Promise<Application> => {
    const updatedApplication = await prisma.$transaction(async (tx) => {
        const candidate = await tx.candidate.findUnique({
            where: { id: candidateId },
        });
        if (!candidate) {
            throw new Error('Candidate not found');
        }

        const application = await tx.application.findFirst({
            where: { candidateId },
            orderBy: { applicationDate: 'desc' },
            include: {
                position: {
                    include: {
                        interviewFlow: true,
                    },
                },
            },
        });
        if (!application) {
            throw new Error('No application found for this candidate');
        }

        const newStage = await tx.interviewStep.findUnique({
            where: { id: newStageId },
        });
        if (!newStage) {
            throw new Error('Interview stage not found');
        }

        const positionInterviewFlowId = application.position.interviewFlowId;
        if (newStage.interviewFlowId !== positionInterviewFlowId) {
            throw new Error('Invalid stage for this position');
        }

        const applicationModel = new Application({
            id: application.id,
            positionId: application.positionId,
            candidateId: application.candidateId,
            applicationDate: application.applicationDate,
            currentInterviewStep: newStageId,
            notes: application.notes,
        });

        const saved = await applicationModel.save(tx);

        const completeApplication = await tx.application.findUnique({
            where: { id: saved.id },
            include: {
                position: {
                    select: {
                        id: true,
                        title: true,
                        interviewFlowId: true,
                    },
                },
                interviewStep: {
                    select: {
                        id: true,
                        name: true,
                        interviewFlowId: true,
                    },
                },
            },
        });

        if (!completeApplication) {
            throw new Error('Error retrieving updated application');
        }

        return new Application(completeApplication);
    });

    return updatedApplication;
};
