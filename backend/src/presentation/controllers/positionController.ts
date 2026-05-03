import { Request, Response } from 'express';
import { findPositionCandidates } from '../../application/services/positionCandidateService';

/**
 * Express handler for `GET /positions/:id/candidates`.
 *
 * Validates `id` as a base-10 integer; on success returns JSON from {@link findPositionCandidates}.
 * Maps service `null` to **404** (`Position not found`). Uncaught errors yield **500**.
 *
 * @param req - Request whose `params.id` is the position id.
 * @param res - JSON responses: **400** invalid id, **404** missing position, **200** envelope, **500** on failure.
 */
export const getPositionCandidates = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid ID format' });
    }
    const result = await findPositionCandidates(id);
    if (!result) {
      return res.status(404).json({ error: 'Position not found' });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
};
