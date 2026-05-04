/**
 * HTTP routes for job positions (`/positions` mount in `index.ts`).
 */
import { Router } from 'express';
import { getPositionCandidates } from '../presentation/controllers/positionController';

const router = Router();

/** List candidates currently in process for the position identified by `id`. */
router.get('/:id/candidates', getPositionCandidates);

export default router;
