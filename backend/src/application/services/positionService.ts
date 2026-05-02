import { Prisma, PrismaClient } from '@prisma/client';

interface InterviewStep {
  stepId: number;
  stepName: string;
  stepOrder: number;
  interviewFlowId: number;
}

interface CandidateResponse {
  candidateId: number;
  fullName: string;
  email: string;
  phone?: string;
  address?: string;
  applicationDate: string;
  applicationNotes?: string;
  currentInterviewStep: InterviewStep;
  averageScore: number | null;
  totalInterviewsCompleted: number;
}

interface PositionCandidatesResponse {
  positionId: number;
  positionTitle: string;
  candidates: CandidateResponse[];
}

class PositionNotFoundError extends Error {
  constructor(positionId: number) {
    super(`Position with ID ${positionId} not found`);
    this.name = 'PositionNotFoundError';
  }
}

export class PositionService {
  private readonly prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  async getPositionCandidates(positionId: number, requesterCompanyId: number): Promise<PositionCandidatesResponse> {
    // Fetch position with all related data
    type PositionWithRelations = Prisma.PositionGetPayload<{
      include: {
        applications: {
          include: {
            candidate: true;
            interviewStep: { include: { interviewFlow: true } };
            interviews: true;
          };
        };
      };
    }>;
    let position: PositionWithRelations | null;

    try {
      position = await this.prisma.position.findUnique({
        where: { id: positionId },
        include: {
          applications: {
            include: {
              candidate: true,
              interviewStep: {
                include: {
                  interviewFlow: true,
                },
              },
              interviews: {
                where: {
                  score: {
                    not: null,
                  },
                },
              },
            },
          },
        },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new PositionNotFoundError(positionId);
        }
        if (error.code === 'P2002') {
          throw new Error(`Unexpected constraint conflict querying position ${positionId}`);
        }
      }
      throw error;
    }

    if (!position) {
      throw new PositionNotFoundError(positionId);
    }

    // Enforce company scope: treat cross-company access as not-found to avoid leaking existence
    if (position.companyId !== requesterCompanyId) {
      throw new PositionNotFoundError(positionId);
    }

    // Transform data to response format
    const candidates: CandidateResponse[] = position.applications.map((app) => {
      const scores = app.interviews
        .map((interview) => interview.score)
        .filter((score) => score !== null) as number[];

      const averageScore =
        scores.length > 0
          ? scores.reduce((sum, score) => sum + score, 0) / scores.length
          : null;

      return {
        candidateId: app.candidate.id,
        fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        email: app.candidate.email,
        phone: app.candidate.phone ?? undefined,
        address: app.candidate.address ?? undefined,
        applicationDate: app.applicationDate.toISOString(),
        applicationNotes: app.notes ?? undefined,
        currentInterviewStep: {
          stepId: app.interviewStep.id,
          stepName: app.interviewStep.name,
          stepOrder: app.interviewStep.orderIndex,
          interviewFlowId: app.interviewStep.interviewFlowId,
        },
        averageScore,
        totalInterviewsCompleted: app.interviews.length,
      };
    });

    return {
      positionId: position.id,
      positionTitle: position.title,
      candidates,
    };
  }
}

export { PositionNotFoundError };
