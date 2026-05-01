const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const applications = await prisma.application.findMany({
    include: {
      candidate: { select: { id: true, firstName: true, lastName: true, email: true } },
      position: { select: { id: true, title: true } },
      interviewStep: { select: { id: true, name: true, orderIndex: true } }
    },
    orderBy: { id: 'asc' }
  });

  if (applications.length === 0) {
    console.log('No applications found in database\n');
  } else {
    console.log(`\n📋 Total Applications: ${applications.length}\n`);
    console.log('ID | Candidate | Position | Current Step | App Date');
    console.log('---'.padEnd(80, '-'));
    
    applications.forEach(app => {
      const candidateName = `${app.candidate.firstName} ${app.candidate.lastName}`;
      const appDate = new Date(app.applicationDate).toLocaleDateString();
      console.log(
        `${app.id.toString().padEnd(4)} | ` +
        `${candidateName.padEnd(25)} | ` +
        `${app.position.title.padEnd(20)} | ` +
        `${app.interviewStep.name.padEnd(15)} | ` +
        `${appDate}`
      );
    });
    console.log('');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
