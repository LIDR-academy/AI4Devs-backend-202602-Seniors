import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface CandidateInProcessDTO {
  fullName: string;
  currentInterviewStep: number;
  averageScore: number | null;
}

export class Position {
  id?: number;
  companyId: number;
  interviewFlowId: number;
  title: string;
  description: string;
  status: string;
  isVisible: boolean;
  location: string;
  jobDescription: string;
  requirements?: string;
  responsibilities?: string;
  salaryMin?: number;
  salaryMax?: number;
  employmentType?: string;
  benefits?: string;
  companyDescription?: string;
  applicationDeadline?: Date;
  contactInfo?: string;

  constructor(data: any) {
    this.id = data.id;
    this.companyId = data.companyId;
    this.interviewFlowId = data.interviewFlowId;
    this.title = data.title;
    this.description = data.description;
    this.status = data.status ?? 'Draft';
    this.isVisible = data.isVisible ?? false;
    this.location = data.location;
    this.jobDescription = data.jobDescription;
    this.requirements = data.requirements;
    this.responsibilities = data.responsibilities;
    this.salaryMin = data.salaryMin;
    this.salaryMax = data.salaryMax;
    this.employmentType = data.employmentType;
    this.benefits = data.benefits;
    this.companyDescription = data.companyDescription;
    this.applicationDeadline = data.applicationDeadline
      ? new Date(data.applicationDeadline)
      : undefined;
    this.contactInfo = data.contactInfo;
  }

  async save() {
    const positionData: any = {
      companyId: this.companyId,
      interviewFlowId: this.interviewFlowId,
      title: this.title,
      description: this.description,
      status: this.status,
      isVisible: this.isVisible,
      location: this.location,
      jobDescription: this.jobDescription,
      requirements: this.requirements,
      responsibilities: this.responsibilities,
      salaryMin: this.salaryMin,
      salaryMax: this.salaryMax,
      employmentType: this.employmentType,
      benefits: this.benefits,
      companyDescription: this.companyDescription,
      applicationDeadline: this.applicationDeadline,
      contactInfo: this.contactInfo,
    };

    if (this.id) {
      return await prisma.position.update({
        where: { id: this.id },
        data: positionData,
      });
    } else {
      return await prisma.position.create({
        data: positionData,
      });
    }
  }

  static async findOne(id: number): Promise<Position | null> {
    const data = await prisma.position.findUnique({
      where: { id: id },
    });
    if (!data) return null;
    return new Position(data);
  }

  static async findCandidatesInProcess(
    positionId: number,
  ): Promise<CandidateInProcessDTO[]> {
    const applications = await prisma.application.findMany({
      where: { positionId },
      include: {
        candidate: { select: { firstName: true, lastName: true } },
        interviews: { select: { score: true } },
      },
    });

    return applications.map((app) => {
      const scores = app.interviews
        .map((i) => i.score)
        .filter((s): s is number => s !== null);
      return {
        fullName: `${app.candidate.firstName} ${app.candidate.lastName}`,
        currentInterviewStep: app.currentInterviewStep,
        averageScore:
          scores.length > 0
            ? scores.reduce((sum, s) => sum + s, 0) / scores.length
            : null,
      };
    });
  }
}
