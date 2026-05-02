const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const applications = await prisma.application.findMany({
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      position: { select: { id: true, title: true } },
      interviewStep: { select: { id: true, name: true, orderIndex: true } },
      interviews: { select: { id: true, result: true, score: true } }
    },
    orderBy: { id: 'asc' }
  });

  console.log('\n' + '='.repeat(100));
  console.log('DETAILED APPLICATIONS LIST');
  console.log('='.repeat(100) + '\n');

  applications.forEach(app => {
    console.log(`📌 Application ID: ${app.id}`);
    console.log(`   Candidate: ${app.candidate.firstName} ${app.candidate.lastName}`);
    console.log(`   Email: ${app.candidate.email}`);
    console.log(`   Phone: ${app.candidate.phone || 'N/A'}`);
    console.log(`   Position: ${app.position.title} (ID: ${app.position.id})`);
    console.log(`   Current Step: ${app.interviewStep.name} (Step ${app.interviewStep.orderIndex})`);
    console.log(`   Application Date: ${new Date(app.applicationDate).toLocaleDateString()}`);
    console.log(`   Interviews Completed: ${app.interviews.length}`);
    if (app.interviews.length > 0) {
      console.log(`   Interview Results:`);
      app.interviews.forEach((iv, idx) => {
        console.log(`     - Interview ${idx + 1}: ${iv.result || 'Pending'} (Score: ${iv.score || 'N/A'})`);
      });
    }
    console.log('');
  });

  console.log('='.repeat(100) + '\n');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
