import { Application } from '../../domain/models/Application';
import { Position } from '../../domain/models/Position';
import { InterviewStep } from '../../domain/models/InterviewStep';

export interface CandidateKanbanCard {
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
}

export interface UpdatedStage {
    id: number;
    candidateId: number;
    positionId: number;
    currentInterviewStep: number;
}

export const getCandidatesByPosition = async (
    positionId: number
): Promise<CandidateKanbanCard[]> => {
    const position = await Position.findOne(positionId);
    if (!position) {
        throw new Error('Position not found');
    }

    const applications = await Application.findByPositionId(positionId);

    return applications.map((app) => {
        const scores = app.interviews
            .map((i) => i.score)
            .filter((s): s is number => s !== null);
        const averageScore =
            scores.length > 0
                ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                : null;

        return {
            fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
            currentInterviewStep: app.interviewStep.name,
            averageScore,
        };
    });
};

export const updateCandidateStage = async (
    candidateId: number,
    applicationId: number,
    newStageId: number
): Promise<UpdatedStage> => {
    const application = await Application.findByIdAndCandidateId(
        applicationId,
        candidateId
    );
    if (!application) {
        throw new Error('Application not found for this candidate');
    }

    const step = await InterviewStep.findOne(newStageId);
    if (!step) {
        throw new Error('Interview step not found');
    }

    application.currentInterviewStep = newStageId;
    await application.save();

    return {
        id: application.id as number,
        candidateId: application.candidateId,
        positionId: application.positionId,
        currentInterviewStep: application.currentInterviewStep,
    };
};
