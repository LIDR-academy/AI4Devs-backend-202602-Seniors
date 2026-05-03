import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface ApplicationWithDetails {
    id: number;
    positionId: number;
    candidateId: number;
    applicationDate: Date;
    currentInterviewStep: number;
    notes: string | null;
    candidate: { firstName: string; lastName: string };
    interviewStep: { name: string };
    interviews: { score: number | null }[];
}

export class Application {
    id?: number;
    positionId: number;
    candidateId: number;
    applicationDate: Date;
    currentInterviewStep: number;
    notes?: string;

    constructor(data: any) {
        this.id = data.id;
        this.positionId = data.positionId;
        this.candidateId = data.candidateId;
        this.applicationDate = new Date(data.applicationDate);
        this.currentInterviewStep = data.currentInterviewStep;
        this.notes = data.notes;
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

    static async findByPositionId(positionId: number): Promise<ApplicationWithDetails[]> {
        return prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: {
                    select: { firstName: true, lastName: true },
                },
                interviewStep: {
                    select: { name: true },
                },
                interviews: {
                    select: { score: true },
                },
            },
        });
    }

    static async findByIdAndCandidateId(
        applicationId: number,
        candidateId: number
    ): Promise<Application | null> {
        const data = await prisma.application.findFirst({
            where: { id: applicationId, candidateId },
        });
        if (!data) return null;
        return new Application(data);
    }
}
