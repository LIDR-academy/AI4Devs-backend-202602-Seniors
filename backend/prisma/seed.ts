import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TABLES_WITH_SERIAL_ID = [
    'Interview',
    'Application',
    'Education',
    'WorkExperience',
    'Resume',
    'Position',
    'InterviewStep',
    'Employee',
    'InterviewFlow',
    'InterviewType',
    'Candidate',
    'Company',
] as const;

async function clearDatabase(): Promise<void> {
    await prisma.interview.deleteMany();
    await prisma.application.deleteMany();
    await prisma.education.deleteMany();
    await prisma.workExperience.deleteMany();
    await prisma.resume.deleteMany();
    await prisma.position.deleteMany();
    await prisma.interviewStep.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.interviewFlow.deleteMany();
    await prisma.interviewType.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.company.deleteMany();
}

/** After deleteMany, align PostgreSQL sequences so the next inserts start at 1 (dev / tests). */
async function resetSerialSequences(): Promise<void> {
    for (const table of TABLES_WITH_SERIAL_ID) {
        await prisma.$executeRawUnsafe(`
      SELECT setval(
        pg_get_serial_sequence('"${table}"', 'id'),
        1,
        false
      )
    `);
    }
}

type InterviewSeed = {
    candidateEmail: string;
    stepName: string;
    score: number;
    result: string;
};

const INTERVIEW_SEEDS: InterviewSeed[] = [
    { candidateEmail: 'albert.einstein@seed.example', stepName: 'HR Screen', score: 9, result: 'Passed' },
    { candidateEmail: 'isaac.newton@seed.example', stepName: 'HR Screen', score: 7, result: 'Passed' },
    { candidateEmail: 'isaac.newton@seed.example', stepName: 'Technical Screen', score: 8, result: 'Passed' },
    { candidateEmail: 'charles.darwin@seed.example', stepName: 'HR Screen', score: 6, result: 'Passed' },
    { candidateEmail: 'charles.darwin@seed.example', stepName: 'Technical Screen', score: 10, result: 'Passed' },
    { candidateEmail: 'charles.darwin@seed.example', stepName: 'Technical Interview', score: 8, result: 'Passed' },
    { candidateEmail: 'nikola.tesla@seed.example', stepName: 'HR Screen', score: 5, result: 'Passed' },
    { candidateEmail: 'nikola.tesla@seed.example', stepName: 'Technical Screen', score: 7, result: 'Passed' },
    { candidateEmail: 'nikola.tesla@seed.example', stepName: 'Technical Interview', score: 8, result: 'Passed' },
    { candidateEmail: 'nikola.tesla@seed.example', stepName: 'Final Interview', score: 6, result: 'Passed' },
    { candidateEmail: 'rosalind.franklin@seed.example', stepName: 'HR Screen', score: 10, result: 'Passed' },
    { candidateEmail: 'rosalind.franklin@seed.example', stepName: 'Technical Screen', score: 9, result: 'Passed' },
    { candidateEmail: 'stephen.hawking@seed.example', stepName: 'HR Screen', score: 4, result: 'Passed' },
    { candidateEmail: 'ada.lovelace@seed.example', stepName: 'HR Screen', score: 9, result: 'Passed' },
    { candidateEmail: 'ada.lovelace@seed.example', stepName: 'Technical Screen', score: 8, result: 'Passed' },
    { candidateEmail: 'ada.lovelace@seed.example', stepName: 'Technical Interview', score: 10, result: 'Passed' },
    { candidateEmail: 'galileo.galilei@seed.example', stepName: 'HR Screen', score: 8, result: 'Passed' },
    { candidateEmail: 'galileo.galilei@seed.example', stepName: 'Technical Screen', score: 3, result: 'Failed' },
    { candidateEmail: 'richard.feynman@seed.example', stepName: 'HR Screen', score: 7, result: 'Passed' },
    { candidateEmail: 'richard.feynman@seed.example', stepName: 'Technical Screen', score: 8, result: 'Passed' },
    { candidateEmail: 'richard.feynman@seed.example', stepName: 'Technical Interview', score: 9, result: 'Passed' },
    { candidateEmail: 'richard.feynman@seed.example', stepName: 'Final Interview', score: 10, result: 'Passed' },
];

type ApplicationSeed = {
    email: string;
    currentStepName: string;
};

const APPLICATION_SEEDS: ApplicationSeed[] = [
    { email: 'marie.curie@seed.example', currentStepName: 'HR Screen' },
    { email: 'albert.einstein@seed.example', currentStepName: 'HR Screen' },
    { email: 'isaac.newton@seed.example', currentStepName: 'Technical Screen' },
    { email: 'charles.darwin@seed.example', currentStepName: 'Technical Interview' },
    { email: 'nikola.tesla@seed.example', currentStepName: 'Final Interview' },
    { email: 'rosalind.franklin@seed.example', currentStepName: 'Technical Screen' },
    { email: 'stephen.hawking@seed.example', currentStepName: 'HR Screen' },
    { email: 'ada.lovelace@seed.example', currentStepName: 'Technical Interview' },
    { email: 'galileo.galilei@seed.example', currentStepName: 'Technical Screen' },
    { email: 'richard.feynman@seed.example', currentStepName: 'Final Interview' },
];

const CANDIDATES: Array<{ firstName: string; lastName: string; email: string }> = [
    { firstName: 'Marie', lastName: 'Curie', email: 'marie.curie@seed.example' },
    { firstName: 'Albert', lastName: 'Einstein', email: 'albert.einstein@seed.example' },
    { firstName: 'Isaac', lastName: 'Newton', email: 'isaac.newton@seed.example' },
    { firstName: 'Charles', lastName: 'Darwin', email: 'charles.darwin@seed.example' },
    { firstName: 'Nikola', lastName: 'Tesla', email: 'nikola.tesla@seed.example' },
    { firstName: 'Rosalind', lastName: 'Franklin', email: 'rosalind.franklin@seed.example' },
    { firstName: 'Stephen', lastName: 'Hawking', email: 'stephen.hawking@seed.example' },
    { firstName: 'Ada', lastName: 'Lovelace', email: 'ada.lovelace@seed.example' },
    { firstName: 'Galileo', lastName: 'Galilei', email: 'galileo.galilei@seed.example' },
    { firstName: 'Richard', lastName: 'Feynman', email: 'richard.feynman@seed.example' },
];

const INTERVIEW_TYPE_NAMES = ['HR Screen', 'Technical Screen', 'Technical Interview', 'Final Interview'] as const;

const STEP_DEFINITIONS: Array<{ orderIndex: number; name: string; typeName: (typeof INTERVIEW_TYPE_NAMES)[number] }> = [
    { orderIndex: 1, name: 'HR Screen', typeName: 'HR Screen' },
    { orderIndex: 2, name: 'Technical Screen', typeName: 'Technical Screen' },
    { orderIndex: 3, name: 'Technical Interview', typeName: 'Technical Interview' },
    { orderIndex: 4, name: 'Final Interview', typeName: 'Final Interview' },
];

async function main(): Promise<void> {
    await clearDatabase();
    await resetSerialSequences();

    const company = await prisma.company.create({
        data: { name: 'LTI' },
    });

    const interviewTypes: Record<string, { id: number }> = {};
    for (const name of INTERVIEW_TYPE_NAMES) {
        const row = await prisma.interviewType.create({
            data: { name },
        });
        interviewTypes[name] = row;
    }

    const interviewFlow = await prisma.interviewFlow.create({
        data: { description: 'Standard Engineering Flow' },
    });

    const stepByName: Record<string, { id: number }> = {};
    for (const def of STEP_DEFINITIONS) {
        const type = interviewTypes[def.typeName];
        const step = await prisma.interviewStep.create({
            data: {
                interviewFlowId: interviewFlow.id,
                interviewTypeId: type.id,
                name: def.name,
                orderIndex: def.orderIndex,
            },
        });
        stepByName[def.name] = step;
    }

    const employee = await prisma.employee.create({
        data: {
            companyId: company.id,
            name: 'Sarah Johnson',
            email: 'sarah@lti.com',
            role: 'HR Manager',
            isActive: true,
        },
    });

    const position = await prisma.position.create({
        data: {
            companyId: company.id,
            interviewFlowId: interviewFlow.id,
            title: 'Senior QA Engineer',
            description: 'Quality assurance leadership for product releases.',
            status: 'Open',
            isVisible: true,
            location: 'Remote',
            jobDescription: 'QA automation, test strategy, and release quality',
            salaryMin: 45000,
            salaryMax: 75000,
        },
    });

    const candidateByEmail: Record<string, { id: number }> = {};
    for (const c of CANDIDATES) {
        const row = await prisma.candidate.create({
            data: {
                firstName: c.firstName,
                lastName: c.lastName,
                email: c.email,
            },
        });
        candidateByEmail[c.email] = row;
    }

    const applicationByEmail: Record<string, { id: number }> = {};
    const applicationDate = new Date();
    for (const app of APPLICATION_SEEDS) {
        const candidate = candidateByEmail[app.email];
        const step = stepByName[app.currentStepName];
        const row = await prisma.application.create({
            data: {
                positionId: position.id,
                candidateId: candidate.id,
                applicationDate,
                currentInterviewStep: step.id,
            },
        });
        applicationByEmail[app.email] = row;
    }

    const interviewDate = new Date();
    for (const row of INTERVIEW_SEEDS) {
        const application = applicationByEmail[row.candidateEmail];
        const step = stepByName[row.stepName];
        await prisma.interview.create({
            data: {
                applicationId: application.id,
                interviewStepId: step.id,
                employeeId: employee.id,
                interviewDate,
                result: row.result,
                score: row.score,
            },
        });
    }

    console.log(`Seed OK — companyId=${company.id} positionId=${position.id} (use GET /positions/${position.id}/candidates)`);
}

main()
    .catch((e: unknown) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
