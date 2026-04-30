import { PrismaClient } from '@prisma/client';
import { Interview } from './Interview';

const prisma = new PrismaClient();

export class Application {
    id?: number;
    positionId: number;
    candidateId: number;
    applicationDate: Date;
    currentInterviewStep: number;
    notes?: string;
    interviews: Interview[]; // Added this line

    constructor(data: any) {
        this.id = data.id;
        this.positionId = data.positionId;
        this.candidateId = data.candidateId;
        this.applicationDate = new Date(data.applicationDate);
        this.currentInterviewStep = data.currentInterviewStep;
        this.notes = data.notes;
        this.interviews = data.interviews || []; // Added this line
    }

    async save() {
        const applicationData: any = {
            positionId: this.positionId,
            candidateId: this.candidateId,
            applicationDate: this.applicationDate,
            currentInterviewStep: this.currentInterviewStep,
            notes: this.notes,
        };

        if (this.id) {
            return await prisma.application.update({
                where: { id: this.id },
                data: applicationData,
            });
        } else {
            return await prisma.application.create({
                data: applicationData,
            });
        }
    }

    static async findOne(id: number): Promise<Application | null> {
        const data = await prisma.application.findUnique({
            where: { id: id },
        });
        if (!data) return null;
        return new Application(data);
    }

    static async findLatestByCandidateId(candidateId: number): Promise<{ id: number } | null> {
        return prisma.application.findFirst({
            where: { candidateId },
            orderBy: { applicationDate: 'desc' },
            select: { id: true },
        });
    }

    static async updateInterviewStep(applicationId: number, currentInterviewStep: number) {
        return prisma.application.update({
            where: { id: applicationId },
            data: { currentInterviewStep },
        });
    }

    static async findByPositionId(positionId: number): Promise<ApplicationWithDetails[] | null> {
        const positionExists = await prisma.position.findUnique({
            where: { id: positionId },
            select: { id: true },
        });

        if (!positionExists) return null;

        return prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: { select: { firstName: true, lastName: true } },
                interviewStep: { select: { name: true } },
                interviews: { select: { score: true } },
            },
        });
    }
}

export interface ApplicationWithDetails {
    candidate: { firstName: string; lastName: string };
    interviewStep: { name: string };
    interviews: { score: number | null }[];
}
