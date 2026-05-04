/**
 * Application service for updating the current interview step of a candidate's
 * application (`PUT /candidates/:id/stage`).
 *
 * The "stage" lives on `Application.currentInterviewStep` (Int FK → `InterviewStep.id`),
 * not on `Candidate`. The body therefore disambiguates which application of the
 * candidate to update via `applicationId`.
 *
 * Validation order is enforced explicitly so HTTP status codes can be mapped
 * unambiguously by the controller via the discriminated `StageUpdateResult`.
 */
import { PrismaClient } from '@prisma/client';
import { Candidate } from '../../domain/models/Candidate';
import { validateStageUpdatePayload } from '../validator';

/** Dedicated client for stage-update reads/writes; same lifecycle pattern as other application services. */
const prisma = new PrismaClient();

/**
 * Tagged union returned to the controller. Each variant maps deterministically
 * to one HTTP response in `updateCandidateStage` (controller).
 */
export type StageUpdateResult =
    | { kind: 'ok'; application: any }
    | { kind: 'invalid_input'; message: string }
    | { kind: 'candidate_not_found' }
    | { kind: 'application_not_found' }
    | { kind: 'application_candidate_mismatch' }
    | { kind: 'step_not_found' }
    | { kind: 'invalid_stage_for_flow' };

/**
 * Validates the body, asserts candidate ↔ application ownership, asserts that
 * the new step belongs to the candidate's interview flow, then persists the
 * update via `prisma.application.update`.
 *
 * @param candidateId - Primary key of the `Candidate` from the URL path.
 * @param body        - Raw request body; expected `{ applicationId, currentInterviewStep }`.
 * @returns A discriminated result mapping to the appropriate HTTP response.
 *
 * @remarks
 * `P2025` from the final `update` is remapped to `application_not_found` to
 * stay truthful when a row is deleted between the lookup and the update.
 */
export const updateCandidateStage = async (
    candidateId: number,
    body: any,
): Promise<StageUpdateResult> => {
    let payload: { applicationId: number; currentInterviewStep: number };
    try {
        payload = validateStageUpdatePayload(body);
    } catch (error) {
        const message =
            error instanceof Error ? error.message : 'Invalid request body';
        return { kind: 'invalid_input', message };
    }

    const candidate = await Candidate.findOne(candidateId);
    if (!candidate) {
        return { kind: 'candidate_not_found' };
    }

    const application = await prisma.application.findUnique({
        where: { id: payload.applicationId },
        include: { position: { select: { interviewFlowId: true } } },
    });
    if (!application) {
        return { kind: 'application_not_found' };
    }
    if (application.candidateId !== candidateId) {
        return { kind: 'application_candidate_mismatch' };
    }

    const interviewStep = await prisma.interviewStep.findUnique({
        where: { id: payload.currentInterviewStep },
        select: { id: true, interviewFlowId: true },
    });
    if (!interviewStep) {
        return { kind: 'step_not_found' };
    }
    if (interviewStep.interviewFlowId !== application.position.interviewFlowId) {
        return { kind: 'invalid_stage_for_flow' };
    }

    try {
        const updated = await prisma.application.update({
            where: { id: payload.applicationId },
            data: { currentInterviewStep: payload.currentInterviewStep },
        });
        return { kind: 'ok', application: updated };
    } catch (error: any) {
        if (error?.code === 'P2025') {
            return { kind: 'application_not_found' };
        }
        throw error;
    }
};
