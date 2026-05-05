import { Router } from 'express';
import { getPositionCandidatesController } from '../presentation/controllers/candidateController';

const router = Router();

router.get('/:id/candidates', getPositionCandidatesController);

export default router;
