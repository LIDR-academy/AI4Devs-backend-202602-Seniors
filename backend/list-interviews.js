const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const interviews = await prisma.interview.findMany({
    include: {
      application: {
        include: {
          candidate: { select: { firstName: true, lastName: true } },
          position: { select: { title: true } }
        }
      },
      interviewStep: { select: { name: true } },
      employee: { select: { name: true, role: true } }
    },
    orderBy: { id: 'asc' }
  });

  if (interviews.length === 0) {
    console.log('\nNo interviews found in database\n');
  } else {
    console.log(`\n📋 Total Interviews: ${interviews.length}\n`);
    console.log('='.repeat(120));
    
    interviews.forEach(iv => {
      const candidateName = `${iv.application.candidate.firstName} ${iv.application.candidate.lastName}`;
      const interviewDate = new Date(iv.interviewDate).toLocaleDateString();
      
      console.log(`\n📌 Interview ID: ${iv.id}`);
      console.log(`   Candidate: ${candidateName} | Position: ${iv.application.position.title}`);
      console.log(`   Interviewer: ${iv.employee.name} (${iv.employee.role})`);
      console.log(`   Interview Step: ${iv.interviewStep.name}`);
      console.log(`   Interview Date: ${interviewDate}`);
      console.log(`   Result: ${iv.result || 'Pending'} | Score: ${iv.score || 'N/A'}`);
      console.log(`   Notes: ${iv.notes || 'None'}`);
    });
    
    console.log('\n' + '='.repeat(120) + '\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
