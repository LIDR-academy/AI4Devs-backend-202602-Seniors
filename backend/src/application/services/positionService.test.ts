import { PrismaClient } from '@prisma/client';
import { getCandidatesByPositionId } from './positionService';

function createMockPrisma(overrides: Partial<MockPrisma> = {}): PrismaClient {
    const defaults: MockPrisma = {
        positionFindUnique: jest.fn(),
        applicationFindMany: jest.fn()
    };
    const m = { ...defaults, ...overrides };
    return {
        position: { findUnique: m.positionFindUnique },
        application: { findMany: m.applicationFindMany }
    } as unknown as PrismaClient;
}

type MockPrisma = {
    positionFindUnique: jest.Mock;
    applicationFindMany: jest.Mock;
};

describe('getCandidatesByPositionId', () => {
    const positionId = 42;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('devuelve candidatos de la posición con averageScore correcto', async () => {
        const applicationDate = new Date('2026-05-01T12:00:00.000Z');
        const positionFindUnique = jest.fn().mockResolvedValue({ id: positionId });
        const applicationFindMany = jest.fn().mockResolvedValue([
            {
                id: 1,
                applicationDate,
                currentInterviewStep: 3,
                candidate: {
                    id: 10,
                    firstName: 'Ana',
                    lastName: 'García',
                    email: 'ana@example.com'
                },
                interviews: [{ score: 8 }, { score: 10 }]
            }
        ]);
        const prisma = createMockPrisma({ positionFindUnique, applicationFindMany });

        const result = await getCandidatesByPositionId(prisma, positionId);

        expect(result.positionId).toBe(positionId);
        expect(result.candidates).toHaveLength(1);
        expect(result.candidates[0].candidateId).toBe(10);
        expect(result.candidates[0].interviews.count).toBe(2);
        expect(result.candidates[0].interviews.averageScore).toBe(9);
        expect(positionFindUnique).toHaveBeenCalledWith({
            where: { id: positionId },
            select: { id: true }
        });
        expect(applicationFindMany).toHaveBeenCalled();
    });

    it('ignora scores null al calcular averageScore', async () => {
        const applicationDate = new Date('2026-05-02T10:00:00.000Z');
        const prisma = createMockPrisma({
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId }),
            applicationFindMany: jest.fn().mockResolvedValue([
                {
                    id: 2,
                    applicationDate,
                    currentInterviewStep: 1,
                    candidate: {
                        id: 20,
                        firstName: 'Luis',
                        lastName: 'Pérez',
                        email: 'luis@example.com'
                    },
                    interviews: [{ score: 8 }, { score: null }, { score: 10 }, { score: null }]
                }
            ])
        });

        const result = await getCandidatesByPositionId(prisma, positionId);

        expect(result.candidates[0].interviews.averageScore).toBe(9);
        expect(result.candidates[0].interviews.count).toBe(4);
    });

    it('devuelve averageScore null si no hay scores válidos', async () => {
        const applicationDate = new Date('2026-05-03T08:00:00.000Z');
        const prisma = createMockPrisma({
            positionFindUnique: jest.fn().mockResolvedValue({ id: positionId }),
            applicationFindMany: jest.fn().mockResolvedValue([
                {
                    id: 3,
                    applicationDate,
                    currentInterviewStep: 2,
                    candidate: {
                        id: 30,
                        firstName: 'María',
                        lastName: 'López',
                        email: 'maria@example.com'
                    },
                    interviews: [{ score: null }, { score: null }]
                },
                {
                    id: 4,
                    applicationDate,
                    currentInterviewStep: 2,
                    candidate: {
                        id: 31,
                        firstName: 'Carlos',
                        lastName: 'Ruiz',
                        email: 'carlos@example.com'
                    },
                    interviews: []
                }
            ])
        });

        const result = await getCandidatesByPositionId(prisma, positionId);

        expect(result.candidates[0].interviews.averageScore).toBeNull();
        expect(result.candidates[1].interviews.averageScore).toBeNull();
    });

    it('lanza NotFoundError si la Position no existe', async () => {
        const prisma = createMockPrisma({
            positionFindUnique: jest.fn().mockResolvedValue(null),
            applicationFindMany: jest.fn()
        });

        await expect(getCandidatesByPositionId(prisma, positionId)).rejects.toMatchObject({
            message: 'Position not found',
            code: 'NOT_FOUND',
            name: 'NotFoundError'
        });
        expect(prisma.application.findMany).not.toHaveBeenCalled();
    });
});
