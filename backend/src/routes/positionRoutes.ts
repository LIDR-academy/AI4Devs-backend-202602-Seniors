import { Router } from 'express';
import { getPositionCandidates } from '../presentation/controllers/positionController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { featureFlagMiddleware } from '../middleware/featureFlagMiddleware';

const router = Router();

// GET /positions/:id/candidates
// Retrieves all candidates in the interview process for a specific position
// Requires authentication and recruiter/hiring_manager role
router.get(
  '/:id/candidates',
  authMiddleware,
  featureFlagMiddleware('FEATURE_POSITION_CANDIDATES_ENDPOINT'),
  requireRole(['recruiter', 'hiring_manager']),
  getPositionCandidates
);

export default router;
