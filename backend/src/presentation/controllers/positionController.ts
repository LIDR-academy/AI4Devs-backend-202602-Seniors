import { Request, Response } from 'express';
import { getCandidatesByPositionId } from '../../application/services/positionService';

export async function getCandidatesForPosition(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id) || id <= 0) {
        res.status(400).json({ error: 'Invalid position ID' });
        return;
    }

    try {
        const candidates = await getCandidatesByPositionId(id);
        res.status(200).json(candidates);
    } catch (error: unknown) {
        if (error instanceof Error && error.message === 'Position not found') {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
}
