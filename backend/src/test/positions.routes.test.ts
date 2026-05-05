import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../createApp';

describe('GET /positions/:id/candidates', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
    });

    afterAll(() => {
        (console.log as jest.Mock).mockRestore?.();
    });

    it('responde 400 si el id de posición no es numérico', async () => {
        const prisma = {
            position: { findUnique: jest.fn() },
            application: { findMany: jest.fn() },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma)).get('/positions/abc/candidates');

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('no válido');
        expect(prisma.position.findUnique).not.toHaveBeenCalled();
    });

    it('responde 404 si la posición no existe', async () => {
        const prisma = {
            position: {
                findUnique: jest.fn().mockResolvedValue(null),
            },
            application: { findMany: jest.fn() },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma)).get('/positions/42/candidates');

        expect(res.status).toBe(404);
        expect(prisma.application.findMany).not.toHaveBeenCalled();
    });

    it('responde 200 con lista vacía cuando no hay aplicaciones', async () => {
        const prisma = {
            position: {
                findUnique: jest.fn().mockResolvedValue({ id: 1 }),
            },
            application: {
                findMany: jest.fn().mockResolvedValue([]),
            },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma)).get('/positions/1/candidates');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ position_id: 1, candidatos: [] });
    });

    it('responde 200 con candidatos y average_score calculado', async () => {
        const prisma = {
            position: {
                findUnique: jest.fn().mockResolvedValue({ id: 3 }),
            },
            application: {
                findMany: jest.fn().mockResolvedValue([
                    {
                        id: 20,
                        candidateId: 9,
                        candidate: { firstName: 'John', lastName: 'Doe' },
                        interviewStep: { id: 2, name: 'Technical', orderIndex: 2 },
                        interviews: [{ score: 5 }, { score: 7 }],
                    },
                ]),
            },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma)).get('/positions/3/candidates');

        expect(res.status).toBe(200);
        expect(res.body.position_id).toBe(3);
        expect(res.body.candidatos).toHaveLength(1);
        expect(res.body.candidatos[0]).toMatchObject({
            nombre_completo: 'John Doe',
            average_score: 6,
            current_interview_step: {
                id: 2,
                name: 'Technical',
                order_index: 2,
            },
        });
    });
});
