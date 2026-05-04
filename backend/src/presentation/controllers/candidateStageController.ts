import { Request, Response } from 'express';
import { updateCandidateStage } from '../../application/services/candidateStageService';
import { AppError, isAppError } from '../../application/errors';

function parseBodyPositiveInteger(value: unknown, field: string): number {
    if (typeof value !== 'number' && typeof value !== 'string') {
        throw new AppError('VALIDATION_ERROR', `${field} must be a positive integer`, 400);
    }
    const parsed = typeof value === 'string' ? parseInt(value, 10) : value;
    if (!Number.isInteger(parsed) || parsed <= 0) {
        throw new AppError('VALIDATION_ERROR', `${field} must be a positive integer`, 400);
    }
    return parsed;
}

export async function updateCandidateStageController(req: Request, res: Response): Promise<void> {
    const rawPositionId = parseInt(req.params.id, 10);
    if (isNaN(rawPositionId)) {
        res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'positionId must be a positive integer' },
        });
        return;
    }

    try {
        const { candidateId: rawCandidateId, currentInterviewStep: rawStep } = req.body;

        if (rawCandidateId === undefined || rawCandidateId === null) {
            throw new AppError('VALIDATION_ERROR', 'candidateId is required', 400);
        }
        if (rawStep === undefined || rawStep === null) {
            throw new AppError('VALIDATION_ERROR', 'currentInterviewStep is required', 400);
        }

        const candidateId = parseBodyPositiveInteger(rawCandidateId, 'candidateId');
        const currentInterviewStep = parseBodyPositiveInteger(rawStep, 'currentInterviewStep');

        const result = await updateCandidateStage(rawPositionId, candidateId, currentInterviewStep, req.prisma);
        res.status(200).json({ data: result });
    } catch (error) {
        if (isAppError(error)) {
            res.status(error.statusCode).json({ error: { code: error.code, message: error.message } });
        } else {
            console.error(error);
            res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Internal server error' } });
        }
    }
}
