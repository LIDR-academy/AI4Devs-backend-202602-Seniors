import request from 'supertest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../createApp';

describe('PUT /candidates/:id/stage', () => {
    beforeAll(() => {
        jest.spyOn(console, 'log').mockImplementation(() => undefined);
        jest.spyOn(console, 'error').mockImplementation(() => undefined);
    });

    afterAll(() => {
        (console.log as jest.Mock).mockRestore?.();
        (console.error as jest.Mock).mockRestore?.();
    });

    it('responde 400 si el id del candidato no es válido', async () => {
        const prisma = {} as unknown as PrismaClient;

        const res = await request(createApp(prisma))
            .put('/candidates/nan/stage')
            .send({ positionId: 1, interviewStepId: 2 });

        expect(res.status).toBe(400);
    });

    it('responde 400 si falta positionId o interviewStepId válidos', async () => {
        const prisma = {} as unknown as PrismaClient;

        const res = await request(createApp(prisma)).put('/candidates/1/stage').send({});

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('positionId');
    });

    it('responde 404 cuando no existe aplicación para el par candidato–posición', async () => {
        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue(null),
            },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma))
            .put('/candidates/1/stage')
            .send({ positionId: 10, interviewStepId: 100 });

        expect(res.status).toBe(404);
        expect(res.body.error).toContain('aplicación');
    });

    it('responde 400 si interviewStepId no pertenece al flujo de la posición', async () => {
        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue({
                    id: 99,
                    candidateId: 1,
                    positionId: 10,
                }),
            },
            position: {
                findUnique: jest.fn().mockResolvedValue({
                    interviewFlow: {
                        interviewSteps: [{ id: 100 }],
                    },
                }),
            },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma))
            .put('/candidates/1/stage')
            .send({ positionId: 10, interviewStepId: 777 });

        expect(res.status).toBe(400);
        expect(res.body.error).toContain('no pertenece');
    });

    it('responde 200 y actualiza la etapa cuando el paso es válido', async () => {
        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue({
                    id: 99,
                    candidateId: 1,
                    positionId: 10,
                }),
                update: jest.fn().mockResolvedValue({
                    id: 99,
                    candidateId: 1,
                    positionId: 10,
                    interviewStep: { id: 100, name: 'HR', orderIndex: 1 },
                    position: { id: 10, title: 'Dev' },
                    candidate: { id: 1, firstName: 'A', lastName: 'B' },
                }),
            },
            position: {
                findUnique: jest.fn().mockResolvedValue({
                    interviewFlow: {
                        interviewSteps: [{ id: 100 }, { id: 101 }],
                    },
                }),
            },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma))
            .put('/candidates/1/stage')
            .send({ positionId: 10, interviewStepId: 100 });

        expect(res.status).toBe(200);
        expect(res.body.message).toContain('actualizada');
        expect(res.body.application.current_interview_step).toEqual({
            id: 100,
            name: 'HR',
            order_index: 1,
        });
        expect(prisma.application.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: 99 },
                data: { currentInterviewStep: 100 },
            })
        );
    });

    it('acepta positionId e interviewStepId como strings numéricos en JSON', async () => {
        const prisma = {
            application: {
                findFirst: jest.fn().mockResolvedValue({
                    id: 1,
                    candidateId: 2,
                    positionId: 3,
                }),
                update: jest.fn().mockResolvedValue({
                    id: 1,
                    candidateId: 2,
                    positionId: 3,
                    interviewStep: { id: 200, name: 'X', orderIndex: 0 },
                    position: { id: 3, title: 'Y' },
                    candidate: { id: 2, firstName: 'C', lastName: 'D' },
                }),
            },
            position: {
                findUnique: jest.fn().mockResolvedValue({
                    interviewFlow: {
                        interviewSteps: [{ id: 200 }],
                    },
                }),
            },
        } as unknown as PrismaClient;

        const res = await request(createApp(prisma))
            .put('/candidates/2/stage')
            .send({ positionId: '3', interviewStepId: '200' });

        expect(res.status).toBe(200);
    });
});
