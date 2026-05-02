const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const steps = await prisma.interviewStep.findMany({
    include: {
      interviewFlow: { select: { id: true, description: true } },
      interviewType: { select: { id: true, name: true } },
      _count: { select: { applications: true, interviews: true } }
    },
    orderBy: [{ interviewFlowId: 'asc' }, { orderIndex: 'asc' }]
  });

  if (steps.length === 0) {
    console.log('\nNo interview steps found in database\n');
  } else {
    console.log(`\n📋 Total Interview Steps: ${steps.length}\n`);
    console.log('='.repeat(130));
    
    let currentFlowId = null;
    steps.forEach(step => {
      if (currentFlowId !== step.interviewFlowId) {
        currentFlowId = step.interviewFlowId;
        console.log(`\n📍 Interview Flow ID: ${step.interviewFlowId}`);
        console.log(`   Description: ${step.interviewFlow.description}`);
        console.log('   ' + '-'.repeat(120));
      }
      
      console.log(`   Step ${step.orderIndex}: ${step.name} (ID: ${step.id})`);
      console.log(`     Type: ${step.interviewType.name}`);
      console.log(`     Applications at this step: ${step._count.applications} | Interviews completed: ${step._count.interviews}`);
    });
    
    console.log('\n' + '='.repeat(130) + '\n');
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
