import { Router } from 'express';
import { getPositionCandidates } from '../presentation/controllers/applicationController';

const router = Router();

router.get('/:id/candidates', getPositionCandidates);

export default router;
