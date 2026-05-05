import { Candidate } from '../../domain/models/Candidate';
import { validateCandidateData } from '../validator';
import { Education } from '../../domain/models/Education';
import { WorkExperience } from '../../domain/models/WorkExperience';
import { Resume } from '../../domain/models/Resume';
import { PrismaClient } from '@prisma/client';

export const addCandidate = async (candidateData: any) => {
    try {
        validateCandidateData(candidateData); // Validar los datos del candidato
    } catch (error: any) {
        throw new Error(error);
    }

    const candidate = new Candidate(candidateData); // Crear una instancia del modelo Candidate
    try {
        const savedCandidate = await candidate.save(); // Guardar el candidato en la base de datos
        const candidateId = savedCandidate.id; // Obtener el ID del candidato guardado

        // Guardar la educación del candidato
        if (candidateData.educations) {
            for (const education of candidateData.educations) {
                const educationModel = new Education(education);
                educationModel.candidateId = candidateId;
                await educationModel.save();
                candidate.education.push(educationModel);
            }
        }

        // Guardar la experiencia laboral del candidato
        if (candidateData.workExperiences) {
            for (const experience of candidateData.workExperiences) {
                const experienceModel = new WorkExperience(experience);
                experienceModel.candidateId = candidateId;
                await experienceModel.save();
                candidate.workExperience.push(experienceModel);
            }
        }

        // Guardar los archivos de CV
        if (candidateData.cv && Object.keys(candidateData.cv).length > 0) {
            const resumeModel = new Resume(candidateData.cv);
            resumeModel.candidateId = candidateId;
            await resumeModel.save();
            candidate.resumes.push(resumeModel);
        }
        return savedCandidate;
    } catch (error: any) {
        if (error.code === 'P2002') {
            // Unique constraint failed on the fields: (`email`)
            throw new Error('The email already exists in the database');
        } else {
            throw error;
        }
    }
};

export const findCandidateById = async (id: number): Promise<Candidate | null> => {
    try {
        const candidate = await Candidate.findOne(id); // Cambio aquí: pasar directamente el id
        return candidate;
    } catch (error) {
        console.error('Error al buscar el candidato:', error);
        throw new Error('Error al recuperar el candidato');
    }
};

interface PositionCandidateDTO {
    id: number;
    fullName: string;
    currentInterviewStep: string;
    averageScore: number | null;
    totalInterviews: number;
}

export const getPositionCandidates = async (positionId: number): Promise<PositionCandidateDTO[]> => {
    const prisma = new PrismaClient();
    try {
        // Check if position exists
        const position = await prisma.position.findUnique({
            where: { id: positionId }
        });

        if (!position) {
            const error = new Error('Position not found');
            (error as any).code = 'NOT_FOUND';
            throw error;
        }

        // Get all applications for the position with candidate and interview data
        const applications = await prisma.application.findMany({
            where: { positionId },
            include: {
                candidate: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
                    }
                },
                interviewStep: {
                    select: {
                        name: true
                    }
                },
                interviews: {
                    select: {
                        score: true
                    }
                }
            },
            orderBy: { applicationDate: 'desc' }
        });

        // Map to response DTO
        return applications.map(app => {
            const scores = app.interviews
                .map(interview => interview.score)
                .filter((score): score is number => score !== null);

            const averageScore = scores.length > 0
                ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10
                : null;

            return {
                id: app.candidate.id,
                fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
                currentInterviewStep: app.interviewStep.name,
                averageScore,
                totalInterviews: scores.length
            };
        });
    } finally {
        await prisma.$disconnect();
    }
};

interface UpdateCandidateStageResponse {
    id: number;
    candidateId: number;
    positionId: number;
    currentInterviewStep: string;
    previousInterviewStep: string;
    status: string;
    movedAt: string;
    movedBy: string;
}

export const updateCandidateStage = async (
    candidateId: number,
    newStage: string,
    positionId?: number,
    userId: string = 'system'
): Promise<UpdateCandidateStageResponse> => {
    const prisma = new PrismaClient();
    try {
        // Validate candidate exists
        const candidate = await prisma.candidate.findUnique({
            where: { id: candidateId }
        });

        if (!candidate) {
            const error = new Error('Candidate not found');
            (error as any).code = 'NOT_FOUND';
            throw error;
        }

        // Validate newStage by looking it up
        const newInterviewStep = await prisma.interviewStep.findFirst({
            where: { name: newStage }
        });

        if (!newInterviewStep) {
            // Fetch all valid stage names for error response
            const validSteps = await prisma.interviewStep.findMany({
                select: { name: true },
                orderBy: { orderIndex: 'asc' }
            });
            const error = new Error('Invalid interview stage');
            (error as any).code = 'INVALID_STAGE';
            (error as any).validStages = validSteps.map(s => s.name);
            throw error;
        }

        // Find most recent application for candidate
        const application = await prisma.application.findFirst({
            where: {
                candidateId,
                ...(positionId && { positionId })
            },
            include: {
                interviewStep: {
                    select: { name: true }
                }
            },
            orderBy: { applicationDate: 'desc' }
        });

        if (!application) {
            const error = new Error('Candidate has no application');
            (error as any).code = 'NO_APPLICATION';
            throw error;
        }

        const previousStageName = application.interviewStep.name;

        // Update application with new stage
        const updatedApplication = await prisma.application.update({
            where: { id: application.id },
            data: {
                currentInterviewStep: newInterviewStep.id
            },
            include: {
                interviewStep: {
                    select: { name: true }
                }
            }
        });

        // Audit log
        console.log(`User ${userId} moved candidate ${candidateId} from ${previousStageName} to ${newStage}`);

        return {
            id: updatedApplication.id,
            candidateId: updatedApplication.candidateId,
            positionId: updatedApplication.positionId,
            currentInterviewStep: updatedApplication.interviewStep.name,
            previousInterviewStep: previousStageName,
            status: 'in_progress',
            movedAt: new Date().toISOString(),
            movedBy: userId
        };
    } finally {
        await prisma.$disconnect();
    }
};
