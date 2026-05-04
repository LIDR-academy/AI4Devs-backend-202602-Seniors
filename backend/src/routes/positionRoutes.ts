import { Router } from 'express';
import { getPositionCandidatesController } from '../presentation/controllers/positionCandidatesController';

const router = Router();

router.get('/:id/candidates', getPositionCandidatesController);

export default router;
