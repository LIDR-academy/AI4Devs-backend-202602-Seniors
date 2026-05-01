import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // Clear all tables in reverse FK order — makes seed idempotent
    await prisma.interview.deleteMany();
    await prisma.application.deleteMany();
    await prisma.resume.deleteMany();
    await prisma.workExperience.deleteMany();
    await prisma.education.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.position.deleteMany();
    await prisma.interviewStep.deleteMany();
    await prisma.interviewFlow.deleteMany();
    await prisma.interviewType.deleteMany();
    await prisma.employee.deleteMany();
    await prisma.company.deleteMany();

    // Company
    const company = await prisma.company.create({
        data: { name: 'LTI' },
    });

    // Employee (interviewer)
    const employee = await prisma.employee.create({
        data: {
            name: 'Sarah Johnson',
            email: 'sarah@lti.com',
            role: 'HR Manager',
            isActive: true,
            companyId: company.id,
        },
    });

    // Interview types
    const [hrScreen, techScreen, techInterview, finalInterview] = await Promise.all([
        prisma.interviewType.create({ data: { name: 'HR Screen', description: 'Initial HR screening call' } }),
        prisma.interviewType.create({ data: { name: 'Technical Screen', description: 'Short technical assessment' } }),
        prisma.interviewType.create({ data: { name: 'Technical Interview', description: 'In-depth technical evaluation' } }),
        prisma.interviewType.create({ data: { name: 'Final Interview', description: 'Culture fit and final decision' } }),
    ]);

    // Interview flow
    const flow = await prisma.interviewFlow.create({
        data: { description: 'Standard Engineering Flow' },
    });

    // Interview steps — ordered
    const [step1, step2, step3, step4] = await Promise.all([
        prisma.interviewStep.create({
            data: { name: 'HR Screen', orderIndex: 1, interviewFlowId: flow.id, interviewTypeId: hrScreen.id },
        }),
        prisma.interviewStep.create({
            data: { name: 'Technical Screen', orderIndex: 2, interviewFlowId: flow.id, interviewTypeId: techScreen.id },
        }),
        prisma.interviewStep.create({
            data: { name: 'Technical Interview', orderIndex: 3, interviewFlowId: flow.id, interviewTypeId: techInterview.id },
        }),
        prisma.interviewStep.create({
            data: { name: 'Final Interview', orderIndex: 4, interviewFlowId: flow.id, interviewTypeId: finalInterview.id },
        }),
    ]);

    // Position
    const position = await prisma.position.create({
        data: {
            title: 'Senior Backend Engineer',
            description: 'Backend engineering role',
            status: 'Open',
            isVisible: true,
            location: 'Remote',
            jobDescription: 'Build and maintain backend services using TypeScript and Node.js',
            requirements: '3+ years TypeScript, Node.js, PostgreSQL',
            responsibilities: 'Design APIs, review code, mentor juniors',
            salaryMin: 50000,
            salaryMax: 80000,
            employmentType: 'Full-time',
            benefits: 'Health insurance, remote, flexible hours',
            contactInfo: 'hr@lti.com',
            companyId: company.id,
            interviewFlowId: flow.id,
        },
    });

    // Candidates
    const [john, jane, carlos, maria] = await Promise.all([
        prisma.candidate.create({
            data: {
                firstName: 'John', lastName: 'Doe', email: 'john.doe@email.com',
                phone: '612000001', address: '1 Main St',
            },
        }),
        prisma.candidate.create({
            data: {
                firstName: 'Jane', lastName: 'Smith', email: 'jane.smith@email.com',
                phone: '612000002', address: '2 Elm St',
            },
        }),
        prisma.candidate.create({
            data: {
                firstName: 'Carlos', lastName: 'García', email: 'carlos.garcia@email.com',
                phone: '612000003', address: '3 Pine St',
            },
        }),
        prisma.candidate.create({
            data: {
                firstName: 'María', lastName: 'López', email: 'maria.lopez@email.com',
                phone: '612000004', address: '4 Oak St',
            },
        }),
    ]);

    // Applications — each candidate at a different step
    const [appJohn, appJane, appCarlos, appMaria] = await Promise.all([
        prisma.application.create({
            data: {
                candidateId: john.id,
                positionId: position.id,
                applicationDate: new Date(),
                currentInterviewStep: step1.id,
            },
        }),
        prisma.application.create({
            data: {
                candidateId: jane.id,
                positionId: position.id,
                applicationDate: new Date(),
                currentInterviewStep: step2.id,
            },
        }),
        prisma.application.create({
            data: {
                candidateId: carlos.id,
                positionId: position.id,
                applicationDate: new Date(),
                currentInterviewStep: step3.id,
            },
        }),
        prisma.application.create({
            data: {
                candidateId: maria.id,
                positionId: position.id,
                applicationDate: new Date(),
                currentInterviewStep: step4.id,
            },
        }),
    ]);

    // Interviews with scores
    // John  → no interviews → averageScore null
    // Jane  → 1 interview  → averageScore 7.0
    // Carlos→ 2 interviews → averageScore 8.5
    // María → 3 interviews → averageScore 9.0
    await Promise.all([
        prisma.interview.create({
            data: {
                applicationId: appJane.id, interviewStepId: step1.id, employeeId: employee.id,
                interviewDate: new Date(), score: 7, result: 'Passed',
            },
        }),
        prisma.interview.create({
            data: {
                applicationId: appCarlos.id, interviewStepId: step1.id, employeeId: employee.id,
                interviewDate: new Date(), score: 8, result: 'Passed',
            },
        }),
        prisma.interview.create({
            data: {
                applicationId: appCarlos.id, interviewStepId: step2.id, employeeId: employee.id,
                interviewDate: new Date(), score: 9, result: 'Passed',
            },
        }),
        prisma.interview.create({
            data: {
                applicationId: appMaria.id, interviewStepId: step1.id, employeeId: employee.id,
                interviewDate: new Date(), score: 8, result: 'Passed',
            },
        }),
        prisma.interview.create({
            data: {
                applicationId: appMaria.id, interviewStepId: step2.id, employeeId: employee.id,
                interviewDate: new Date(), score: 9, result: 'Passed',
            },
        }),
        prisma.interview.create({
            data: {
                applicationId: appMaria.id, interviewStepId: step3.id, employeeId: employee.id,
                interviewDate: new Date(), score: 10, result: 'Passed',
            },
        }),
    ]);

    console.log('✓ Seed completed');
    console.log(`  Company:   ${company.name}`);
    console.log(`  Position:  ${position.title} (id: ${position.id})`);
    console.log(`  Steps:     ${[step1, step2, step3, step4].map(s => s.name).join(' → ')}`);
    console.log(`  Candidates: John (null), Jane (7.0), Carlos (8.5), María (9.0)`);
    console.log(`\nTest with:`);
    console.log(`  GET /positions/${position.id}/candidates`);
    console.log(`  GET /positions/${position.id}/interviewSteps`);
}

main()
    .catch((e) => { console.error(e); process.exit(1); })
    .finally(() => prisma.$disconnect());
