import { Position } from '../../domain/models/Position';
import { Application } from '../../domain/models/Application';
import { InterviewStep } from '../../domain/models/InterviewStep';

export interface PositionCandidatesResponse {
  candidateId: number;
  fullName: string;
  currentInterviewStep: string;
  averageScore: number | null;
}

export const getCandidatesByPositionId = async (
  positionId: number,
): Promise<PositionCandidatesResponse[]> => {
  // Step 1: Validate Position Exists
  const position = await Position.findOne(positionId);
  if (!position) {
    throw new Error('Position not found');
  }

  // Step 2: Query Applications with Related Data
  const applications = await Application.findMany({
    where: { positionId },
    include: {
      candidate: true,
      interviewStep: true,
      interviews: true,
    },
  });

  // Step 3: Map to Response DTO
  const result: PositionCandidatesResponse[] = applications.map(
    (application) => {
      // Calculate average score, filtering out null scores
      const scores = application.interviews
        .map((interview) => interview.score)
        .filter((s): s is number => s !== null);

      const averageScore =
        scores.length > 0
          ? scores.reduce((sum, s) => sum + s, 0) / scores.length
          : null;

      // Get current interview step name
      const currentInterviewStepName = application.interviewStep?.name || '';

      return {
        candidateId: application.candidateId,
        fullName: `${application.candidate?.firstName || ''} ${application.candidate?.lastName || ''}`,
        currentInterviewStep: currentInterviewStepName,
        averageScore,
      };
    },
  );

  return result;
};
