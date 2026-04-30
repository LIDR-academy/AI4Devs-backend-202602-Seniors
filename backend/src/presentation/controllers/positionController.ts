import { Request, Response } from 'express';
import { getCandidatesForPosition } from '../../application/services/positionService';

export async function getCandidates(req: Request, res: Response): Promise<void> {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
        res.status(400).json({ message: 'Invalid position ID' });
        return;
    }

    const result = await getCandidatesForPosition(id);

    if (!result.success) {
        res.status(404).json({ message: 'Position not found' });
        return;
    }

    res.status(200).json(result.value);
}
