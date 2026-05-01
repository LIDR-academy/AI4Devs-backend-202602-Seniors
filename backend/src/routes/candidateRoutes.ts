import { Router } from 'express';
import { addCandidate, getCandidateById, updateCandidateStage } from '../presentation/controllers/candidateController';
import { authMiddleware, requireRole } from '../middleware/authMiddleware';
import { featureFlagMiddleware } from '../middleware/featureFlagMiddleware';

const router = Router();

/**
 * @swagger
 * /candidates:
 *   post:
 *     summary: Create a new candidate
 *     tags: [Candidates]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, email]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       201:
 *         description: Candidate created successfully
 *       400:
 *         description: Invalid input
 */

router.post('/', async (req, res) => {
  try {
    // console.log(req.body); //Just in case you want to inspect the request body
    const result = await addCandidate(req.body);
    res.status(201).send(result);
  } catch (error) {
    if (error instanceof Error) {
      res.status(400).send({ message: error.message });
    } else {
      res.status(500).send({ message: "An unexpected error occurred" });
    }
  }
});

/**
 * @swagger
 * /candidates/{id}:
 *   get:
 *     summary: Get candidate by ID
 *     tags: [Candidates]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Candidate ID
 *     responses:
 *       200:
 *         description: Candidate found
 *       400:
 *         description: Invalid ID format
 *       404:
 *         description: Candidate not found
 */
router.get('/:id', getCandidateById);

/**
 * @swagger
 * /candidates/{applicationId}/stage:
 *   put:
 *     summary: Update candidate interview stage
 *     tags: [Candidates]
 *     description: Advance a candidate to the next interview stage. Requires authentication and recruiter/hiring_manager role.
 *     parameters:
 *       - in: path
 *         name: applicationId
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Application ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateCandidateStageRequest'
 *     responses:
 *       200:
 *         description: Stage updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/UpdateCandidateStageResponse'
 *       400:
 *         description: Invalid input or interview step not in flow
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Missing or invalid authorization
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       403:
 *         description: User does not have required role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: Application not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  '/:applicationId/stage',
  authMiddleware,
  requireRole(['recruiter', 'hiring_manager']),
  featureFlagMiddleware('CANDIDATE_STAGE_UPDATE'),
  updateCandidateStage
);

export default router;
