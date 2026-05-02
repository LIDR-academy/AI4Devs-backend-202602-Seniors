const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function seed() {
  try {
    // Create company
    const company = await prisma.company.create({
      data: {
        name: `Test Company ${Date.now()}`,
      },
    });
    console.log(`Created company: ${company.id}`);

    // Create interview type
    const interviewType = await prisma.interviewType.create({
      data: {
        name: 'Standard Interview',
        description: 'Standard interview process',
      },
    });
    console.log(`Created interview type: ${interviewType.id}`);

    // Create interview flow with steps
    const interviewFlow = await prisma.interviewFlow.create({
      data: {
        description: 'Standard interview flow',
        interviewSteps: {
          create: [
            { name: 'Initial Screening', orderIndex: 0, interviewTypeId: interviewType.id },
            { name: 'HR Round', orderIndex: 1, interviewTypeId: interviewType.id },
            { name: 'Technical Round', orderIndex: 2, interviewTypeId: interviewType.id },
          ],
        },
      },
      include: { interviewSteps: true },
    });
    console.log(`Created interview flow: ${interviewFlow.id} with ${interviewFlow.interviewSteps.length} steps`);

    // Create position
    const position = await prisma.position.create({
      data: {
        title: 'Senior Engineer',
        description: 'A senior engineer position',
        location: 'Remote',
        jobDescription: 'We are looking for a senior engineer',
        companyId: company.id,
        interviewFlowId: interviewFlow.id,
      },
    });
    console.log(`Created position: ${position.id}`);

    // Create 3 candidates with applications
    for (let i = 0; i < 3; i++) {
      const candidate = await prisma.candidate.create({
        data: {
          firstName: `Candidate${i}`,
          lastName: 'Test',
          email: `candidate${i}@example.com`,
        },
      });

      const app = await prisma.application.create({
        data: {
          candidateId: candidate.id,
          positionId: position.id,
          applicationDate: new Date(),
          currentInterviewStep: interviewFlow.interviewSteps[0].id,
        },
      });
      console.log(`Created candidate ${i + 1} with application ${app.id}`);
    }

    console.log(`\n✅ Seeded successfully!`);
    console.log(`Position ID: ${position.id}`);
    console.log(`Try: curl http://localhost:3010/positions/${position.id}/candidates -H "Authorization: Bearer test-token"`);
  } catch (error) {
    console.error('Seed error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

seed();
