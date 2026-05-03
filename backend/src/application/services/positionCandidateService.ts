/**
 * Application service for listing candidates in process for a job position.
 *
 * Loads applications for the position (ordered by application date), maps each row
 * to a summary including interview scores, and returns `null` when the position
 * does not exist.
 */
import { PrismaClient } from '@prisma/client';
import { Position } from '../../domain/models/Position';

const prisma = new PrismaClient();

/** One application row: candidate identity, pipeline step, and aggregated interview scores. */
export interface CandidateInProcess {
  applicationId: number;
  candidateId: number;
  firstName: string;
  lastName: string;
  fullName: string;
  currentInterviewStep: number;
  /** Arithmetic mean of non-null interview scores; `null` when there are no scored interviews. */
  averageInterviewScore: number | null;
}

/** HTTP response envelope: position id and the list of applicants in process. */
export interface PositionCandidatesResult {
  positionId: number;
  candidates: CandidateInProcess[];
}

/**
 * Returns all applications for a position with candidate and interview score rollups.
 *
 * @param positionId - Primary key of the `Position` to list candidates for.
 * @returns `{ positionId, candidates }` when the position exists; `null` if `Position.findOne` finds nothing.
 *
 * @remarks
 * Interview averages use only non-null `score` values. Applications are ordered by
 * `applicationDate` ascending, then `id` ascending.
 */
export const findPositionCandidates = async (
  positionId: number,
): Promise<PositionCandidatesResult | null> => {
  const position = await Position.findOne(positionId);
  if (!position) return null;

  const applications = await prisma.application.findMany({
    where: { positionId },
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true } },
      interviews: { select: { score: true } },
    },
    orderBy: [{ applicationDate: 'asc' }, { id: 'asc' }],
  });

  const candidates: CandidateInProcess[] = applications.map((app) => {
    const nonNullScores = app.interviews
      .map((i) => i.score)
      .filter((s): s is number => s !== null);
    const averageInterviewScore =
      nonNullScores.length > 0
        ? nonNullScores.reduce((sum, s) => sum + s, 0) / nonNullScores.length
        : null;

    return {
      applicationId: app.id,
      candidateId: app.candidateId,
      firstName: app.candidate.firstName,
      lastName: app.candidate.lastName,
      fullName: `${app.candidate.firstName} ${app.candidate.lastName}`.trim(),
      currentInterviewStep: app.currentInterviewStep,
      averageInterviewScore,
    };
  });

  return { positionId, candidates };
};
