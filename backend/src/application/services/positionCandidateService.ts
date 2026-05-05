import { PrismaClient } from '@prisma/client';

export type PositionCandidateRow = {
    application_id: number;
    candidate_id: number;
    nombre_completo: string;
    current_interview_step: {
        id: number;
        name: string;
        order_index: number;
    };
    average_score: number | null;
};

function averageInterviewScore(scores: (number | null)[]): number | null {
    const valid = scores.filter((s): s is number => s !== null && s !== undefined);
    if (valid.length === 0) return null;
    return valid.reduce((a, b) => a + b, 0) / valid.length;
}

export async function getCandidatesByPositionId(
    prisma: PrismaClient,
    positionId: number
): Promise<PositionCandidateRow[]> {
    const applications = await prisma.application.findMany({
        where: { positionId },
        include: {
            candidate: true,
            interviewStep: true,
            interviews: { select: { score: true } },
        },
        orderBy: { applicationDate: 'desc' },
    });

    return applications.map(
        (app: (typeof applications)[number]): PositionCandidateRow => ({
            application_id: app.id,
            candidate_id: app.candidateId,
            nombre_completo: `${app.candidate.firstName} ${app.candidate.lastName}`.trim(),
            current_interview_step: {
                id: app.interviewStep.id,
                name: app.interviewStep.name,
                order_index: app.interviewStep.orderIndex,
            },
            average_score: averageInterviewScore(app.interviews.map((i: { score: number | null }) => i.score)),
        })
    );
}

export async function positionExists(prisma: PrismaClient, positionId: number): Promise<boolean> {
    const p = await prisma.position.findUnique({ where: { id: positionId }, select: { id: true } });
    return !!p;
}
