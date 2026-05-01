const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const positions = await prisma.position.findMany({
    select: {
      id: true,
      title: true,
      _count: { select: { applications: true } }
    },
    orderBy: { id: 'asc' }
  });

  if (positions.length === 0) {
    console.log('No positions found in database');
  } else {
    console.log('\n📍 Positions in Database:\n');
    positions.forEach(pos => {
      console.log(`  ID ${pos.id}: ${pos.title} (${pos._count.applications} candidates)`);
    });
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
