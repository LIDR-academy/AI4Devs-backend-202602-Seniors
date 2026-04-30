import { Router } from 'express';
import { getCandidatesForPosition, getInterviewStepsForPosition } from '../presentation/controllers/positionController';

const router = Router();

router.get('/:id/candidates', getCandidatesForPosition);
router.get('/:id/interviewSteps', getInterviewStepsForPosition);

export default router;
