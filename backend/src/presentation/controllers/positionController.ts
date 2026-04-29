import { Request, Response } from 'express';
import { getCandidatesByPositionId, PositionServiceError } from '../../application/services/positionService';

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({ error: 'Invalid ID format' });
    }

    try {
        const candidates = await getCandidatesByPositionId(id);
        return res.status(200).json(candidates);
    } catch (error) {
        if (
            error instanceof PositionServiceError ||
            (typeof error === 'object' &&
                error !== null &&
                'statusCode' in error &&
                typeof (error as { statusCode: unknown }).statusCode === 'number')
        ) {
            const serviceError = error as { statusCode: number; message?: string };
            return res.status(serviceError.statusCode).json({ error: serviceError.message || 'Request failed' });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
