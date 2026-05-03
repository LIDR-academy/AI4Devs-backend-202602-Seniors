import { Request, Response } from 'express';
import { getCandidatesByPositionId, NotFoundError } from '../../application/services/positionService';

export const getCandidatesByPosition = async (req: Request, res: Response) => {
    if (!/^[1-9]\d*$/.test(req.params.id)) {
        return res.status(400).json({ error: 'Invalid position ID format' });
    }
    const positionId = Number(req.params.id);

    try {
        const result = await getCandidatesByPositionId(req.prisma, positionId);
        return res.status(200).json(result);
    } catch (error) {
        if (error instanceof NotFoundError || (error instanceof Error && 'code' in error && error.code === 'NOT_FOUND')) {
            return res.status(404).json({ error: error.message });
        }

        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
