import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // InterviewType
  const interviewType = await prisma.interviewType.create({
    data: { name: 'Technical' }
  });

  // InterviewFlow
  const interviewFlow = await prisma.interviewFlow.create({
    data: {}
  });

  // InterviewStep
  const interviewStep = await prisma.interviewStep.create({
    data: {
      name: 'Screening',
      orderIndex: 1,
      interviewFlowId: interviewFlow.id,
      interviewTypeId: interviewType.id
    }
  });

  // Company
  const company = await prisma.company.create({
    data: { name: 'Test Company' }
  });

  // Position
  const position = await prisma.position.create({
    data: {
      companyId: company.id,
      interviewFlowId: interviewFlow.id,
      title: 'Frontend Dev',
      description: 'Test',
      location: 'Madrid',
      status: 'Draft',
      isVisible: true,
      jobDescription:
        'Buscamos un/a desarrollador/a frontend con experiencia en React y TypeScript para construir interfaces accesibles y de alto rendimiento. Participarás en diseño de componentes, integración con APIs REST y mejora continua de la experiencia de usuario.'
    }
  });

  // Candidate
  const candidate = await prisma.candidate.create({
    data: {
      firstName: 'David',
      lastName: 'Test',
      email: 'test@test.com'
    }
  });

  // Employee
  const employee = await prisma.employee.create({
    data: {
      name: 'Elena Martínez',
      email: 'hr@test.com',
      companyId: company.id,
      role: 'Technical Recruiter'
    }
  });

  // Application
  const application = await prisma.application.create({
    data: {
      candidateId: candidate.id,
      positionId: position.id,
      currentInterviewStep: interviewStep.id,
      applicationDate: new Date()
    }
  });

  // Interview
  await prisma.interview.create({
    data: {
      applicationId: application.id,
      interviewStepId: interviewStep.id,
      employeeId: employee.id,
      interviewDate: new Date(),
      score: 8
    }
  });

  console.log('✅ Seed ejecutado correctamente');
}

main()
  .catch((e) => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });