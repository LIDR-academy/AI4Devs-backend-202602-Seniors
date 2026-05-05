import { PrismaClient } from '@prisma/client';
import {
    getCandidatesByPositionId,
    positionExists,
} from '../application/services/positionCandidateService';

describe('positionCandidateService', () => {
    describe('positionExists', () => {
        it('devuelve true si la posición existe', async () => {
            const prisma = {
                position: {
                    findUnique: jest.fn().mockResolvedValue({ id: 7 }),
                },
            } as unknown as PrismaClient;

            await expect(positionExists(prisma, 7)).resolves.toBe(true);
            expect(prisma.position.findUnique).toHaveBeenCalledWith({
                where: { id: 7 },
                select: { id: true },
            });
        });

        it('devuelve false si la posición no existe', async () => {
            const prisma = {
                position: {
                    findUnique: jest.fn().mockResolvedValue(null),
                },
            } as unknown as PrismaClient;

            await expect(positionExists(prisma, 999)).resolves.toBe(false);
        });
    });

    describe('getCandidatesByPositionId', () => {
        it('mapea aplicaciones con nombre completo, paso actual y media de scores', async () => {
            const prisma = {
                application: {
                    findMany: jest.fn().mockResolvedValue([
                        {
                            id: 10,
                            candidateId: 1,
                            candidate: { firstName: 'Ana', lastName: 'López' },
                            interviewStep: { id: 5, name: 'Técnica', orderIndex: 2 },
                            interviews: [{ score: 4 }, { score: 8 }],
                        },
                    ]),
                },
            } as unknown as PrismaClient;

            const rows = await getCandidatesByPositionId(prisma, 1);

            expect(rows).toHaveLength(1);
            expect(rows[0]).toEqual({
                application_id: 10,
                candidate_id: 1,
                nombre_completo: 'Ana López',
                current_interview_step: {
                    id: 5,
                    name: 'Técnica',
                    order_index: 2,
                },
                average_score: 6,
            });
        });

        it('devuelve average_score null cuando no hay puntuaciones', async () => {
            const prisma = {
                application: {
                    findMany: jest.fn().mockResolvedValue([
                        {
                            id: 11,
                            candidateId: 2,
                            candidate: { firstName: 'Bob', lastName: '' },
                            interviewStep: { id: 1, name: 'HR', orderIndex: 1 },
                            interviews: [{ score: null }],
                        },
                    ]),
                },
            } as unknown as PrismaClient;

            const rows = await getCandidatesByPositionId(prisma, 2);
            expect(rows[0].average_score).toBeNull();
        });
    });
});
