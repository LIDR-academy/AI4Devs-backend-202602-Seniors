import { Router } from 'express';
import { updateCandidateStage } from '../presentation/controllers/applicationController';

const router = Router();

router.put('/:id/stage', updateCandidateStage);

export default router;
