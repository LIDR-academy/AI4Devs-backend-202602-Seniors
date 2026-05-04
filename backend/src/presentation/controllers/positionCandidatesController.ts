import { Request, Response } from 'express';
import { getPositionCandidates } from '../../application/services/positionCandidatesService';
import { isAppError } from '../../application/errors';

export async function getPositionCandidatesController(req: Request, res: Response): Promise<void> {
    const rawId = parseInt(req.params.id, 10);
    if (isNaN(rawId)) {
        res.status(400).json({
            error: { code: 'VALIDATION_ERROR', message: 'positionId must be a positive integer' },
        });
        return;
    }

    try {
        const result = await getPositionCandidates(rawId, req.prisma);
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
