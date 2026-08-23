import { PrismaClient } from '@prisma/client';



const prisma = new PrismaClient();



async function main() {

  await prisma.settingsApp.upsert({

    where: { id: 'app' },

    create: { id: 'app' },

    update: {},

  });



  console.log('Seeded default settings_app row.');

}



main()

  .catch((e) => {

    console.error(e);

    process.exit(1);

  })

  .finally(() => prisma.$disconnect());

