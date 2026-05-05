import { Router } from 'express';
import { getAllPositions, getCandidatesForPosition } from '../presentation/controllers/positionController';

const router = Router();

router.get('/', getAllPositions);
router.get('/:id/candidates', getCandidatesForPosition);

export default router;
