import { Router } from 'express';
import { addCandidateController, getCandidateById, updateCandidateStage } from '../presentation/controllers/candidateController';

const router = Router();

router.post('/', addCandidateController);

router.get('/:id', getCandidateById);
router.put('/:id/stage', updateCandidateStage);

export default router;
