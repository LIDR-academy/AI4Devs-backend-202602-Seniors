import { Request, Response } from 'express';
import { addCandidate, findCandidateById } from '../../application/services/candidateService';
import { updateCandidateStage as updateCandidateStageService } from '../../application/services/candidateStageService';

/**
 * Express handler that creates a candidate from `req.body` via {@link addCandidate}.
 *
 * Returns **201** with `{ message, data }` on success. Validation and duplicate-email
 * failures surface as **400** JSON `{ message, error }`.
 */
export const addCandidateController = async (req: Request, res: Response) => {
    try {
        const candidateData = req.body;
        const candidate = await addCandidate(candidateData);
        res.status(201).json({ message: 'Candidate added successfully', data: candidate });
    } catch (error: unknown) {
        if (error instanceof Error) {
            res.status(400).json({ message: 'Error adding candidate', error: error.message });
        } else {
            res.status(400).json({ message: 'Error adding candidate', error: 'Unknown error' });
        }
    }
};

/**
 * Express handler for `GET /candidates/:id`.
 *
 * @param req - `params.id` must parse to a base-10 integer.
 * @param res - **400** invalid id (`{ error }`), **404** not found, **200** candidate JSON, **500** on unexpected failure.
 */
export const getCandidateById = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }
        const candidate = await findCandidateById(id);
        if (!candidate) {
            return res.status(404).json({ error: 'Candidate not found' });
        }
        res.json(candidate);
    } catch (error) {
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Express handler for `PUT /candidates/:id/stage`.
 *
 * Parses `:id` as a base-10 integer, then delegates to
 * {@link updateCandidateStageService} and maps its discriminated result
 * to HTTP status codes. JSON error shape `{ error: '...' }` matches
 * `getCandidateById`. Uncaught failures yield **500** JSON.
 */
export const updateCandidateStage = async (req: Request, res: Response) => {
    try {
        const id = parseInt(req.params.id, 10);
        if (isNaN(id)) {
            return res.status(400).json({ error: 'Invalid ID format' });
        }

        const result = await updateCandidateStageService(id, req.body);
        switch (result.kind) {
            case 'invalid_input':
                return res.status(400).json({ error: result.message });
            case 'candidate_not_found':
                return res.status(404).json({ error: 'Candidate not found' });
            case 'application_not_found':
                return res.status(404).json({ error: 'Application not found' });
            case 'application_candidate_mismatch':
                return res
                    .status(409)
                    .json({ error: 'Application does not belong to candidate' });
            case 'step_not_found':
                return res
                    .status(404)
                    .json({ error: 'Interview step not found' });
            case 'invalid_stage_for_flow':
                return res.status(400).json({
                    error: "Stage does not belong to the candidate's interview flow",
                });
            case 'ok':
                return res.status(200).json(result.application);
        }
    } catch (error) {
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

/**
 * Re-export of {@link addCandidate} from the candidate service so `candidateRoutes`
 * can import persistence alongside HTTP handlers from one module (see `POST /candidates`).
 */
export { addCandidate };