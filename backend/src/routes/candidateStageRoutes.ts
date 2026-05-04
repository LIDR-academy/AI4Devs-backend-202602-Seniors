import { Router } from 'express';
import { updateCandidateStageController } from '../presentation/controllers/candidateStageController';

const router = Router();

router.put('/:id/stage', updateCandidateStageController);

export default router;
